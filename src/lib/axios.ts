
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';
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

// Backend URL
export const NEXT_PUBLIC_API_BASE_URL = 
  process.env.NEXT_PUBLIC_DIRECT_BACKEND_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://checklist-app-go-qqzjtedwva-ez.a.run.app';

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

// Get Google ID token from cookie
export function getUserToken(): string | null {
  try {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )user_token=([^;]*)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  } catch (e) {
    logger.error('Error reading user_token:', e);
  }
  return null;
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
  } catch (e) {
    logger.error('Error decoding token:', e);
  }
  return true; // If can't decode, assume expired
}

// Redirect to home with session expired error (login page is not used)
function redirectToSessionExpired(): void {
  if (typeof window !== 'undefined') {
    // If user is intentionally logging out, don't hijack navigation.
    if (isLoggingOut()) return;
    // Use a hard navigation to fully reset any client state.
    window.location.href = '/?error=session_expired';
  }
}

// Refresh token
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies automatically
    });

    if (response.ok) {
      logger.info('Token refreshed successfully');
      return true;
    }

    // If refresh fails with 401, redirect to session-expired flow
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      logger.error('Refresh token expired or invalid:', data);
      
      redirectToSessionExpired();
      return false;
    }

    throw new Error(`Token refresh failed: ${response.status}`);
  } catch (e) {
    logger.error('Error refreshing token:', e);
    return false;
  }
}

// Token refresh and client ID interceptor
axiosInstance.interceptors.request.use(async (cfg) => {
  try {
    cfg.headers = cfg.headers ?? {} as Record<string, string>;
    
    // Add client ID header
    (cfg.headers as Record<string, string>)['X-Client-Id'] = getClientId();
    
    // Check token expiration and refresh if needed
    // Note: Token is sent via httpOnly cookies automatically (withCredentials: true)
    // No need to add Authorization header as backend reads from cookies
    const token = getUserToken();
    
    // If token exists but expired, refresh it
    if (token && isTokenExpired(token)) {
      logger.info('Token expired, attempting refresh...');
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        logger.info('Token refreshed successfully');
      } else {
        // Refresh failed, user will be redirected to login by refreshToken()
        logger.info('Refresh failed, request will be aborted');
      }
    }
  } catch (e) {
    logger.error('Request interceptor error:', e);
  }
  return cfg;
});

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const { data } = await axiosInstance.request<T>(config);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error('API Error:', error.response?.data || error.message);
      // If 401, try refresh and retry once
      const retryableConfig = config as RetryableConfig;
      if (error.response?.status === 401 && !retryableConfig._retry) {
        retryableConfig._retry = true;
        try {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Retry the request
            const { data } = await axiosInstance.request<T>(config);
            return data;
          } else {
            // Refresh failed, redirect to session-expired flow
            redirectToSessionExpired();
            throw error;
          }
        } catch (retryError) {
          // If retry fails, redirect to session-expired flow
          redirectToSessionExpired();
          throw error;
        }
      }
      throw error;
    }
    throw error;
  }
};

export { axiousProps };
