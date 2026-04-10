import { Router, Request, Response } from 'express';
import axios from 'axios';
import { createToiClient, fetchWithRetry } from '../toiClient';
import * as cheerio from 'cheerio';

const router = Router();

const BASE_URL = 'https://toi-coding.informatics.buu.ac.th';
const PDF_SUFFIXES = ['', '_R1', '_R2', '_R3', '_R4', '_R5', '_R6', '_R7', '_R8', '_R9', '_R10'];

// Cache: taskId → working PDF URL
const pdfUrlCache = new Map<string, string>();

function requireSession(req: Request, res: Response): string | null {
  const cookie = req.headers['x-session-cookie'] as string;
  if (!cookie || cookie.trim() === '') {
    res.status(401).json({ error: 'No session cookie provided' });
    return null;
  }
  return cookie.trim();
}

// Try to find working PDF URL by crawling the description page and trying common patterns
async function findPdfUrl(taskId: string, cookie: string): Promise<string | null> {
  console.log(`[PDF] Searching for PDF URL for task: ${taskId}`);
  // Check cache first
  if (pdfUrlCache.has(taskId)) {
    console.log(`[PDF] Found URL in cache: ${pdfUrlCache.get(taskId)}`);
    return pdfUrlCache.get(taskId)!;
  }

  const client = createToiClient(cookie);

  // Method 1: Crawl the description page (Highest accuracy if link exists)
  try {
    const descResponse = await fetchWithRetry(client, `/00-pre-toi/tasks/${taskId}/description`);
    const $ = cheerio.load(descResponse.data);
    let foundUrl: string | null = null;

    $('a[href$=".pdf"], a[href*=".pdf"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !foundUrl) {
        foundUrl = href.startsWith('http') ? href : (href.startsWith('/') ? `${BASE_URL}${href}` : `${BASE_URL}/00-pre-toi/tasks/${taskId}/${href}`);
      }
    });

    if (foundUrl) {
      console.log(`[PDF] Found PDF link in description page: ${foundUrl}`);
      // Normalize relative paths if they contain ./ or ../
      if (foundUrl.includes('/./')) foundUrl = foundUrl.replace('/./', '/');
      
      pdfUrlCache.set(taskId, foundUrl);
      return foundUrl;
    }
  } catch (err: any) {
    console.warn(`[PDF] Description crawl failed for ${taskId}: ${err.message}`);
  }

  // Method 2: Systemic Brute-force for common patterns
  const suffixes = ['', '_R1', '_R2', '_R3', '_R4', '_R5'];
  const baseNames = [taskId, taskId.replace('-', '_')];
  
  const candidateTemplates = [
    `${BASE_URL}/00-pre-toi/tasks/${taskId}/attachments/{{filename}}.pdf`,
    `${BASE_URL}/00-pre-toi/attachments/${taskId}/{{filename}}.pdf`,
    `${BASE_URL}/00-pre-toi/pdf/{{filename}}.pdf`,
    `${BASE_URL}/files/{{filename}}.pdf`,
  ];

  console.log(`[PDF] Trying systemic patterns for ${taskId}...`);
  for (const template of candidateTemplates) {
    for (const base of baseNames) {
      for (const suffix of suffixes) {
        const filename = `${base}${suffix}`;
        const url = template.replace('{{filename}}', filename);
        
        try {
          // Use HEAD request for speed
          const response = await client.head(url, { 
            timeout: 3000,
            validateStatus: (s) => s < 400,
          });
          
          if (response.status < 400) {
            console.log(`[PDF] Found working PDF via pattern: ${url}`);
            pdfUrlCache.set(taskId, url);
            return url;
          }
        } catch {
          // Continue to next candidate
        }
      }
    }
  }

  console.log(`[PDF] Could not find any PDF for ${taskId} after systemic search`);
  return null;
}

// GET /api/pdf/:taskId - resolve PDF URL
router.get('/:taskId', async (req: Request, res: Response) => {
  const cookie = requireSession(req, res);
  if (!cookie) return;

  const { taskId } = req.params;
  if (!/^[A-Z]\d+-\d{3}$/.test(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format' });
  }

  try {
    const pdfUrl = await findPdfUrl(taskId, cookie);
    if (!pdfUrl) {
      return res.status(404).json({ error: `No PDF found for task ${taskId}` });
    }
    return res.json({ url: pdfUrl, taskId });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to find PDF' });
  }
});

// GET /api/pdf/stream/:taskId - proxy PDF binary
router.get('/stream/:taskId', async (req: Request, res: Response) => {
  const cookie = requireSession(req, res);
  if (!cookie) return;

  const { taskId } = req.params;
  const manualUrl = req.query.url as string | undefined;

  if (!/^[A-Z]\d+-\d{3}$/.test(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format' });
  }

  try {
    let pdfUrl: string | null = manualUrl || null;

    if (!pdfUrl) {
      pdfUrl = await findPdfUrl(taskId, cookie);
    }

    if (!pdfUrl) {
      return res.status(404).json({ error: `No PDF found for task ${taskId}` });
    }

    // Stream PDF from TOI server
    console.log(`[PDF] Streaming PDF from: ${pdfUrl}`);
    const response = await axios.get(pdfUrl, {
      responseType: 'stream',
      headers: {
        'Cookie': `00-pre-toi_login=${cookie}`,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${taskId}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    });

    if (response.headers['content-length']) {
      res.set('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    return res.status(500).json({ error: error.message || 'Failed to stream PDF' });
  }
});

// DELETE /api/pdf/cache/:taskId - clear PDF URL cache
router.delete('/cache/:taskId', (req: Request, res: Response) => {
  const { taskId } = req.params;
  pdfUrlCache.delete(taskId);
  return res.json({ success: true });
});

export default router;
