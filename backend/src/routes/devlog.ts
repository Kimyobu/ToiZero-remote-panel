import { Router, Request, Response } from 'express';
import { requestLogs } from '../toiClient';

const router = Router();

// GET /api/devlog - get request logs
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  return res.json({ logs: requestLogs.slice(0, limit) });
});

// DELETE /api/devlog - clear logs
router.delete('/', (_req: Request, res: Response) => {
  requestLogs.length = 0;
  return res.json({ success: true });
});

export default router;
