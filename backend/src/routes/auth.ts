import { Router, Request, Response } from 'express';
import { createToiClient, fetchWithRetry, performLogin } from '../toiClient';
import { isAuthenticated } from '../parser';

const router = Router();

// In-memory session store (cookie → validated status)
const sessionStore = new Map<string, { valid: boolean; username?: string; validatedAt: number }>();

export function getSession(req: Request): string | null {
  return req.headers['x-session-cookie'] as string || null;
}

// POST /api/auth/login - perform login with credentials
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  try {
    const cookie = await performLogin(username, password);
    
    // Validate it immediately to get user info for the response
    const client = createToiClient(cookie);
    const response = await fetchWithRetry(client, '/00-pre-toi', {}, 1);
    const html = response.data as string;
    const valid = isAuthenticated(html);
    
    // Extract username display name
    const usernameMatch = html.match(/(?:Welcome|สวัสดี)[,\s]+([^\s<"]+)/i) ||
                          html.match(/class="username">([^<]+)</);
    const displayName = usernameMatch?.[1]?.trim() || username;

    sessionStore.set(cookie, { valid, username: displayName, validatedAt: Date.now() });

    return res.json({ 
      success: true, 
      cookie, 
      username: displayName 
    });
  } catch (error: any) {
    return res.status(error.response?.status || 500).json({ 
      success: false, 
      error: error.message || 'Login failed' 
    });
  }
});

// POST /api/auth/validate - validate session cookie
router.post('/validate', async (req: Request, res: Response) => {
  const { cookie } = req.body;

  if (!cookie || typeof cookie !== 'string' || cookie.trim() === '') {
    return res.status(400).json({ valid: false, error: 'No cookie provided' });
  }

  const trimmedCookie = cookie.trim();

  // Check cache (valid for 5 minutes)
  const cached = sessionStore.get(trimmedCookie);
  if (cached && Date.now() - cached.validatedAt < 5 * 60 * 1000) {
    return res.json({ valid: cached.valid, username: cached.username });
  }

  try {
    const client = createToiClient(trimmedCookie);
    const response = await fetchWithRetry(client, '/00-pre-toi', {}, 1);
    const html = response.data as string;
    const valid = isAuthenticated(html);

    // Try to extract username
    const usernameMatch = html.match(/(?:Welcome|สวัสดี)[,\s]+([^\s<"]+)/i) ||
                          html.match(/class="username">([^<]+)</);
    const username = usernameMatch?.[1]?.trim();

    sessionStore.set(trimmedCookie, { valid, username, validatedAt: Date.now() });

    if (!valid) {
      console.log(`[Auth/Validate] Validation failed for cookie: ${trimmedCookie.substring(0, 10)}...`);
      return res.status(401).json({ valid: false, error: 'Session invalid or expired' });
    }

    return res.json({ valid: true, username });
  } catch (error: any) {
    console.error(`[Auth/Validate] Error during validation:`, error.message || error);
    if (error.response) {
       console.error(`[Auth/Validate] Response Data:`, error.response.data);
    }
    return res.status(500).json({ 
      valid: false, 
      error: error.message || 'Failed to validate session' 
    });
  }
});

// DELETE /api/auth - clear session
router.delete('/', (req: Request, res: Response) => {
  const cookie = req.headers['x-session-cookie'] as string;
  if (cookie) {
    sessionStore.delete(cookie);
  }
  return res.json({ success: true });
});

export default router;
