
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';
import { createLogger } from './logger';

// lightweight client id generator
function newId() {
  // Use crypto.randomUUID() for better uniqueness if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'cid-' + Date.now() + '-' + crypto.randomUUID();
  }
  // Fallback for older environments
  return 'cid-' + Date.now() + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Backend URL - required at build time
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_BACKEND_URL');
}

export const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Axios instance with keep-alive and cookies
const axiousProps: AxiosRequestConfig = {
  baseURL: NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,  // ⭐ OLULINE: Saadab cookies'id automaatselt!
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};

const axiosInstance = Axios.create(axiousProps as CreateAxiosDefaults);

// Generate persistent client ID
export function getClientId(): string {
  try {
    const key = 'checklist_client_id';
    let id = localStorage.getItem(key) || '';
    if (!id) {
      id = newId();
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    return newId();
  }
}

const logger = createLogger('Axios');

const LOGOUT_GUARD_KEY = 'checklist_is_logging_out_until';
let isRedirectingToSessionExpired = false; // Prevent multiple redirects

export function markLoggingOut(ttlMs: number = 5000) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGOUT_GUARD_KEY, String(Date.now() + ttlMs));
    }
  } catch {
    // ignore
  }
}

function isLoggingOut(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem(LOGOUT_GUARD_KEY);
    const until = raw ? Number(raw) : 0;
    if (!Number.isFinite(until)) return false;
    if (Date.now() <= until) return true;
    window.localStorage.removeItem(LOGOUT_GUARD_KEY);
    return false;
  } catch {
    return false;
  }
}

// Get CSRF token from cookie
export function getCsrfToken(): string | null {
  try {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  } catch (e) {
    logger.error('Error reading csrf_token:', e);
  }
  return null;
}

// Redirect to home with session expired error (login page is not used)
async function redirectToSessionExpired(): Promise<void> {
  if (typeof window !== 'undefined') {
    // Prevent multiple redirects
    if (isRedirectingToSessionExpired) {
      logger.warn('Session expired redirect already in progress, skipping duplicate');
      return;
    }

    // If user is intentionally logging out, don't hijack navigation.
    if (isLoggingOut()) return;

    // Mark that we're redirecting
    isRedirectingToSessionExpired = true;

    // Use a hard navigation to fully reset any client state.
    window.location.href = '/?error=session_expired';
  }
}

// Track if we've already tried to fetch CSRF token
let csrfTokenFetchAttempted = false;

// Ensure CSRF token is available for non-GET requests
async function ensureCsrfToken(): Promise<void> {
  // Only fetch CSRF token if it's not already present and we haven't tried yet
  if (getCsrfToken() || csrfTokenFetchAttempted) {
    return;
  }

  csrfTokenFetchAttempted = true;

  try {
    // Make a lightweight request directly to backend to get CSRF token
    // Backend sets csrf_token cookie on authenticated requests
    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      logger.info('CSRF token preflight request completed');
      // Give browser a moment to process the Set-Cookie header
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (e) {
    logger.error('Failed to fetch CSRF token via preflight:', e);
  }
}

// Client ID and CSRF interceptor
axiosInstance.interceptors.request.use(async (cfg) => {
  try {
    cfg.headers = cfg.headers ?? {} as Record<string, string>;

    // Add client ID header
    (cfg.headers as Record<string, string>)['X-Client-Id'] = getClientId();

    // For non-GET requests, ensure CSRF token is available
    if (cfg.method && cfg.method.toUpperCase() !== 'GET') {
      await ensureCsrfToken();
    }

    // Add CSRF token header if available
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (cfg.headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
      logger.debug('CSRF token added to request:', csrfToken.substring(0, 10) + '...');
    } else {
      // CSRF token not available - request will proceed without it
      // Backend should return 403 if CSRF protection is required
      logger.warn('No CSRF token available for request:', cfg.url, '- proceeding without CSRF header');
    }

    // Session cookie (session_id) is sent automatically via httpOnly cookies (withCredentials: true)
    // Backend validates session on every request
  } catch (e) {
    logger.error('Request interceptor error:', e);
  }
  return cfg;
});

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const { data } = await axiosInstance.request<T>(config);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('API Error:', error.response?.data || error.message);
      // If 401, session is invalid - redirect to login
      if (error.response?.status === 401) {
        await redirectToSessionExpired();
      }
      throw error;
    }
    throw error;
  }
};

// Fetch wrapper that automatically includes CSRF token
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers = new Headers(options.headers || {});

  // Add CSRF token if available
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  // Add Content-Type if not present and body is provided
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'include', // Include cookies by default
  });
}

export { axiousProps };
