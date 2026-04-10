import { Router, Request, Response } from 'express';
import { createToiClient, fetchWithRetry } from '../toiClient';
import { parseTaskList, parseTaskDetail } from '../parser';

const router = Router();

// Cache
const taskListCache = new Map<string, { data: any; cachedAt: number }>();
const taskDetailCache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function requireSession(req: Request, res: Response): string | null {
  const cookie = req.headers['x-session-cookie'] as string;
  if (!cookie || cookie.trim() === '') {
    res.status(401).json({ error: 'No session cookie provided' });
    return null;
  }
  return cookie.trim();
}

// GET /api/tasks - fetch task list
router.get('/', async (req: Request, res: Response) => {
  const cookie = requireSession(req, res);
  if (!cookie) return;

  const forceRefresh = req.query.refresh === 'true';

  // Check cache
  const cacheKey = `list-${cookie}`;
  const cached = taskListCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return res.json({ tasks: cached.data, fromCache: true });
  }

  try {
    const client = createToiClient(cookie);
    const response = await fetchWithRetry(client, '/00-pre-toi');
    const html = response.data as string;
    
    console.log(`[Tasks API] Fetched HTML size: ${html.length} bytes`);
    
    const tasks = parseTaskList(html);

    taskListCache.set(cacheKey, { data: tasks, cachedAt: Date.now() });

    return res.json({ tasks, fromCache: false });
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    return res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:taskId - fetch task detail
router.get('/:taskId', async (req: Request, res: Response) => {
  const cookie = requireSession(req, res);
  if (!cookie) return;

  const { taskId } = req.params;
  const forceRefresh = req.query.refresh === 'true';

  // Validate task ID format
  if (!/^[A-Z]\d+-\d{3}$/.test(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format' });
  }

  const cacheKey = `detail-${cookie}-${taskId}`;
  const cached = taskDetailCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return res.json({ task: cached.data, fromCache: true });
  }

  try {
    const client = createToiClient(cookie);
    const response = await fetchWithRetry(client, `/00-pre-toi/tasks/${taskId}/description`);
    const html = response.data as string;
    const task = parseTaskDetail(html, taskId);

    taskDetailCache.set(cacheKey, { data: task, cachedAt: Date.now() });

    return res.json({ task, fromCache: false });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    return res.status(500).json({ error: error.message || 'Failed to fetch task detail' });
  }
});

// Invalidate cache for a task (call after submission)
export function invalidateTaskCache(cookie: string, taskId: string): void {
  taskDetailCache.delete(`detail-${cookie}-${taskId}`);
  taskListCache.delete(`list-${cookie}`);
}

export default router;
