import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import qs from 'qs';
import http from 'http';
import https from 'https';

const BASE_URL = 'https://toi-coding.informatics.buu.ac.th';
const REQUEST_DELAY_MS = 300;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Optimized agents for persistent connections
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100, freeSocketTimeout: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, freeSocketTimeout: 30000 });

let lastRequestTime = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  duration: number;
  error?: string;
}

export const requestLogs: RequestLog[] = [];

export function createToiClient(sessionCookie: string): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    httpAgent,
    httpsAgent,
    headers: {
      'Cookie': `00-pre-toi_login=${sessionCookie}`,
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
      'Referer': `${BASE_URL}/00-pre-toi`,
    },
    withCredentials: false,
    maxRedirects: 5,
  });

  // Request interceptor: throttle + log
  client.interceptors.request.use(async (config) => {
    await throttle();
    (config as any)._startTime = Date.now();
    return config;
  });

  // Response interceptor: log
  client.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any)._startTime || Date.now();
      requestLogs.unshift({
        timestamp: new Date().toISOString(),
        method: response.config.method?.toUpperCase() || 'GET',
        url: response.config.url || '',
        status: response.status,
        duration: Date.now() - startTime,
      });
      if (requestLogs.length > 100) requestLogs.pop();
      return response;
    },
    (error) => {
      const startTime = (error.config as any)?._startTime || Date.now();
      requestLogs.unshift({
        timestamp: new Date().toISOString(),
        method: error.config?.method?.toUpperCase() || 'GET',
        url: error.config?.url || '',
        status: error.response?.status || null,
        duration: Date.now() - startTime,
        error: error.message,
      });
      if (requestLogs.length > 100) requestLogs.pop();
      return Promise.reject(error);
    }
  );

  return client;
}

export async function fetchWithRetry(
  client: AxiosInstance,
  url: string,
  options: Record<string, any> = {},
  retries: number = MAX_RETRIES
): Promise<AxiosResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) console.log(`[TOI/Fetch] Retry ${attempt}/${retries} for ${url}`);
      const response = await client.get(url, options);
      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === retries - 1;
      const statusCode = error.response?.status;
      
      console.warn(`[TOI/Fetch] Failed ${url}: HTTP ${statusCode || 'Error'} - ${error.message}`);
      
      if (isLastAttempt) throw error;
      
      // Don't retry on 404 or 403
      if (statusCode === 404 || statusCode === 403) throw error;
      
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function postWithRetry(
  client: AxiosInstance,
  url: string,
  data: any,
  options: Record<string, any> = {},
  retries: number = MAX_RETRIES
): Promise<AxiosResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) console.log(`[TOI/Post] Retry ${attempt}/${retries} for ${url}`);
      const response = await client.post(url, data, options);
      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === retries - 1;
      const statusCode = error.response?.status;

      console.warn(`[TOI/Post] Failed ${url}: HTTP ${statusCode || 'Error'} - ${error.message}`);

      if (isLastAttempt) throw error;
      
      // Don't retry on 401 or 403 for POST (usually auth issue)
      if (statusCode === 401 || statusCode === 403) throw error;

      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function performLogin(username: string, password: string): Promise<string> {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    maxRedirects: 0,
    validateStatus: (status) => status < 400,
  });

  try {
    // Step 1: GET login page to get initial _xsrf
    console.log(`[Auth/Login] Fetching login page to get CSRF token...`);
    const initialRes = await instance.get('/00-pre-toi');
    const $ = cheerio.load(initialRes.data);
    const xsrfFromForm = $('input[name="_xsrf"]').val() as string || $('input[name="csrf_token"]').val() as string;
    
    // Extract cookies from initial response
    const setCookie = initialRes.headers['set-cookie'] || [];
    const xsrfCookie = setCookie.find(c => c.startsWith('_xsrf='));
    
    if (!xsrfFromForm) {
      console.error('[Auth/Login] Could not find CSRF token in page HTML');
      throw new Error('Could not find CSRF token in login page');
    }
    console.log(`[Auth/Login] Found CSRF token from form: ${xsrfFromForm.substring(0, 10)}...`);

    // Step 2: POST login
    const loginPayload = qs.stringify({
      _xsrf: xsrfFromForm,
      username,
      password,
    });

    console.log(`[Auth/Login] Attempting POST login for user: ${username}`);
    const loginRes = await instance.post('/00-pre-toi/login', loginPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': xsrfCookie || '',
        'Referer': `${BASE_URL}/00-pre-toi`,
      },
    });

    // We expect a 302 redirect on success
    const loginSetCookie = loginRes.headers['set-cookie'] || [];
    const sessionCookie = loginSetCookie.find(c => c.startsWith('00-pre-toi_login='));

    if (!sessionCookie) {
      // If we got a 200 OK instead of 302, it might be a login error page
      if (loginRes.status === 200) {
        const $err = cheerio.load(loginRes.data);
        const errorMsg = $err('.alert-error, .error, .alert-danger').text().trim();
        console.error(`[Auth/Login] Login failed with 200 OK: ${errorMsg}`);
        throw new Error(errorMsg || 'Login failed (invalid credentials?)');
      }
      console.error('[Auth/Login] Login response did not contain 00-pre-toi_login cookie');
      throw new Error('Session cookie not found after login');
    }

    // Extract only the value portion
    const match = sessionCookie.match(/00-pre-toi_login=([^;]+)/);
    if (!match) throw new Error('Could not parse session cookie');
    
    console.log('[Auth/Login] Successfully logged in and acquired session cookie');
    return match[1];
  } catch (err: any) {
    if (err.response?.status === 302) {
      // Check if redirect has our cookie
      const redirectedCookies = err.response.headers['set-cookie'] || [];
      const sessionCookie = redirectedCookies.find((c: string) => c.startsWith('00-pre-toi_login='));
      if (sessionCookie) {
        const match = sessionCookie.match(/00-pre-toi_login=([^;]+)/);
        if (match) {
          console.log('[Auth/Login] Login successful (302 redirect with cookie)');
          return match[1];
        }
      }
    }
    console.error(`[Auth/Login] Error: ${err.message}`);
    throw err;
  }
}
