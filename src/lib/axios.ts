
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';

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
    console.error('[Axios] Error reading user_token:', e);
  }
  return null;
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
  } catch (e) {
    console.error('[Axios] Error decoding token:', e);
  }
  return true; // If can't decode, assume expired
}

// Redirect to login page with session expired error
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login?error=session_expired';
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
      console.log('[Axios] Token refreshed successfully');
      return true;
    }

    // If refresh fails with 401, redirect to login
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      console.error('[Axios] Refresh token expired or invalid:', data);
      
      // Redirect to login page
      redirectToLogin();
      return false;
    }

    throw new Error(`Token refresh failed: ${response.status}`);
  } catch (e) {
    console.error('[Axios] Error refreshing token:', e);
    return false;
  }
}

// Add Authorization header with JWT token
axiosInstance.interceptors.request.use(async (cfg) => {
  try {
    cfg.headers = cfg.headers ?? {} as Record<string, any>;
    
    // Add client ID header
    (cfg.headers as Record<string, any>)['X-Client-Id'] = getClientId();
    
    // Get token
    let token = getUserToken();
    
    // If token exists but expired, refresh it
    if (token && isTokenExpired(token)) {
      console.log('[Axios] Token expired, attempting refresh...');
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Get new token after refresh
        token = getUserToken();
        console.log('[Axios] Using refreshed token');
      } else {
        // Refresh failed, user will be redirected to login by refreshToken()
        console.log('[Axios] Refresh failed, request will be aborted');
        token = null;
      }
    }
    
    // Add Authorization header with Google ID token
    if (token) {
      (cfg.headers as Record<string, any>)['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('[Axios] Request interceptor error:', e);
  }
  return cfg;
});

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const { data } = await axiosInstance.request<T>(config);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('API Error:', error.response?.data || error.message);
      // If 401, try refresh and retry once
      if (error.response?.status === 401 && !(config as any)._retry) {
        (config as any)._retry = true;
        try {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Retry the request
            const { data } = await axiosInstance.request<T>(config);
            return data;
          } else {
            // Refresh failed, redirect to login
            redirectToLogin();
            throw error;
          }
        } catch (retryError) {
          // If retry fails, redirect to login
          redirectToLogin();
          throw error;
        }
      }
      throw error;
    }
    throw error;
  }
};

export { axiousProps };
