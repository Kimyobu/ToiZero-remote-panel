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
    const taskHtml = taskResponse.data as string;
    const taskDetail = parseTaskDetail(taskHtml, taskId);

    if (!taskDetail.csrfToken) {
      console.warn(`[Submit] No CSRF token found for task ${taskId}, attempting without`);
    } else {
      console.log(`[Submit] Found CSRF token: ${taskDetail.csrfToken.substring(0, 10)}...`);
    }

    // Step 2: Build multipart form
    const form = new FormData();
    // THE TOI PLATFORM MIGHT USE DIFFERENT FIELD NAMES
    // Usually 'code' or 'file'. Based on previous errors, let's ensure it's correct.
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    if (taskDetail.csrfToken) {
      form.append('_xsrf', taskDetail.csrfToken);
      form.append('csrf_token', taskDetail.csrfToken);
      form.append('_token', taskDetail.csrfToken);
      form.append('csrfmiddlewaretoken', taskDetail.csrfToken);
    }

    // Step 3: POST submission
    const submitUrl = `/00-pre-toi/tasks/${taskId}/submit`;
    console.log(`[Submit] Posting solution to: ${submitUrl}`);
    const response = await postWithRetry(client, submitUrl, form, {
      headers: {
        ...form.getHeaders(),
        // We MUST NOT set manual Cookie here if using axios interceptors or headers, 
        // but our createToiClient already sets it.
        // Let's be explicit just in case.
        'Referer': `https://toi-coding.informatics.buu.ac.th/00-pre-toi/tasks/${taskId}/description`,
      },
      maxRedirects: 0, // CMS often redirects after submission
      validateStatus: (status: number) => status < 500,
    });

    // Step 4: Invalidate cache
    invalidateTaskCache(cookie, taskId);

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    // Determine success from response
    const isSuccess = response.status >= 200 && response.status < 400;
    const isRedirect = response.status >= 300 && response.status < 400;

    return res.json({
      success: isSuccess,
      status: response.status,
      redirected: isRedirect,
      message: isSuccess ? 'Submitted successfully' : 'Submission may have failed',
      rawResponse: responseText.substring(0, 2000), // First 2KB for debugging
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
