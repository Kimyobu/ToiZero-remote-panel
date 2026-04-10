import { Router, Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { createToiClient, fetchWithRetry, postWithRetry } from '../toiClient';
import { parseTaskDetail } from '../parser';
import { invalidateTaskCache } from './tasks';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.py', '.cpp', '.c', '.java', '.pas', '.rb'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  },
});


function requireSession(req: Request, res: Response): string | null {
  const cookie = req.headers['x-session-cookie'] as string;
  if (!cookie || cookie.trim() === '') {
    res.status(401).json({ error: 'No session cookie provided' });
    return null;
  }
  return cookie.trim();
}

// POST /api/submit/:taskId - submit solution
router.post('/:taskId', upload.single('file'), async (req: Request, res: Response) => {
  const cookie = requireSession(req, res);
  if (!cookie) return;

  const { taskId } = req.params;

  if (!/^[A-Z]\d+-\d{3}$/.test(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const client = createToiClient(cookie);

    // Step 1: GET task page to extract CSRF token
    console.log(`[Submit] Fetching task page for ${taskId} to get CSRF token...`);
    const taskResponse = await fetchWithRetry(client, `/00-pre-toi/tasks/${taskId}/description`);
    
    // Extract _xsrf cookie if present
    const setCookie = taskResponse.headers['set-cookie'] || [];
    const xsrfCookieRaw = setCookie.find(c => c.startsWith('_xsrf='));
    let xsrfCookieValue = '';
    if (xsrfCookieRaw) {
      xsrfCookieValue = xsrfCookieRaw.split(';')[0];
      console.log(`[Submit] Found session-specific XSRF cookie: ${xsrfCookieValue.substring(0, 15)}...`);
    }

    const taskHtml = taskResponse.data as string;
    const taskDetail = parseTaskDetail(taskHtml, taskId);

    if (!taskDetail.csrfToken) {
      console.warn(`[Submit] No CSRF token found for task ${taskId}, attempting without`);
    } else {
      console.log(`[Submit] Found CSRF token: ${taskDetail.csrfToken.substring(0, 10)}...`);
    }

    // Step 2: Build multipart form
    const form = new FormData();
    
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    
    // Map extension to CMS language strings AND specific MIME types to avoid "damage"
    let language = 'Python 3 / CPython';
    let mimeType = 'text/plain';

    if (['cpp', 'cc', 'cxx'].includes(ext || '')) {
      language = 'C++17 / g++';
      mimeType = 'text/x-c++src';
    } else if (ext === 'c') {
      language = 'C11 / gcc';
      mimeType = 'text/x-csrc';
    } else if (ext === 'py') {
      language = 'Python 3 / CPython';
      mimeType = 'text/x-python';
    }

    // TOI/CMS requires the file field to be named as "TASK_ID.%l"
    const fileFieldName = `${taskId}.%l`;
    
    // Convert buffer to string to normalize line endings and log check
    let fileContent = req.file.buffer.toString('utf8');
    console.log(`[Submit] Received file: ${req.file.originalname}, Size: ${req.file.size} bytes, Chars: ${fileContent.length}`);
    console.log(`[Submit] Content Preview: ${fileContent.substring(0, 50).replace(/\n/g, '\\n')}...`);

    // CMS/Grader safety: Normalize all line endings to LF (\n)
    // This often fixes issues where a file appears truncated or "broken" due to \r characters
    fileContent = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    const finalBuffer = Buffer.from(fileContent, 'utf8');
    console.log(`[Submit] Final submission buffer size: ${finalBuffer.length} bytes`);

    console.log(`[Submit] Using field name: ${fileFieldName}, Language: ${language}, MimeType: ${mimeType}`);
    
    form.append(fileFieldName, finalBuffer, {
      filename: req.file.originalname,
      contentType: mimeType,
      knownLength: finalBuffer.length // Explicitly tell form-data the length
    });
    
    form.append('language', language);

    if (taskDetail.csrfToken) {
      form.append('_xsrf', taskDetail.csrfToken);
    }

    // Step 3: POST submission
    const submitUrl = `/00-pre-toi/tasks/${taskId}/submit`;
    console.log(`[Submit] Posting solution to: ${submitUrl}`);
    
    // EXTREMELY CRITICAL: Tornado requires BOTH the _xsrf form field AND the _xsrf cookie to match.
    // We already have 00-pre-toi_login in createToiClient, but we must add the _xsrf cookie here.
    const finalCookie = `00-pre-toi_login=${cookie}; ${xsrfCookieValue}`.trim();

    const headers: any = {
      ...form.getHeaders(),
      'Cookie': finalCookie,
      'Referer': `https://toi-coding.informatics.buu.ac.th/00-pre-toi/tasks/${taskId}/submissions`,
      'Origin': 'https://toi-coding.informatics.buu.ac.th',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    };

    if (taskDetail.csrfToken) {
      headers['X-XSRF-Token'] = taskDetail.csrfToken;
      headers['X-CSRF-Token'] = taskDetail.csrfToken;
    }

    const response = await postWithRetry(client, submitUrl, form, {
      headers,
      maxRedirects: 0,
      validateStatus: (status: number) => true,
    });

    console.log(`[Submit] Status: ${response.status}`);

    const isRedirect = (response.status === 302 || response.status === 303);
    let finalResult: any = {
      success: isRedirect || (response.status >= 200 && response.status < 300),
      status: response.status,
      message: 'Submitted',
    };

    // Step 4: SMART POLLING - Follow redirect and wait for score
    if (isRedirect && response.headers.location) {
      const redirectPath = response.headers.location;
      console.log(`[Submit] Following redirect to: ${redirectPath}`);
      
      try {
        // Fetch the submissions page to find the numeric ID
        const subPage = await fetchWithRetry(client, redirectPath, { headers: { 'Cookie': finalCookie } });
        const html = subPage.data as string;
        
        // Find numeric submission ID in HTML (e.g., data-submission="4")
        const idMatch = html.match(/tr data-submission="(\d+)"/);
        const numericId = idMatch ? idMatch[1] : null;
        
        if (numericId) {
          console.log(`[Submit] Found numeric ID: ${numericId}. Polling for score...`);
          
          // Poll up to 10 times, once per second
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const pollResponse = await fetchWithRetry(client, 
              `/00-pre-toi/tasks/${taskId}/submissions/${numericId}`, 
              { headers: { 'Cookie': finalCookie, 'X-Requested-With': 'XMLHttpRequest' } }
            );
            
            const data = pollResponse.data;
            console.log(`[Submit] Poll ${i+1}: status=${data.status}, score=${data.public_score_message}`);
            
            if (data.status === 5) { // Status 5 is Evaluated
              finalResult.isEvaluated = true;
              finalResult.score = data.public_score_message;
              finalResult.numericId = numericId;
              break;
            }
          }
        }
      } catch (pollErr) {
        console.warn(`[Submit] Polling failed, but submission might be okay:`, pollErr);
      }
    }

    // Step 5: Force Invalidate Cache
    invalidateTaskCache(cookie, taskId);
    invalidateTaskCache(cookie, 'list');

    return res.json({
      ...finalResult,
      rawResponse: 'Evaluation processed'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Submission failed',
      rawResponse: error.response?.data?.substring?.(0, 2000),
    });
  }
});

export default router;
