
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';
// lightweight client id generator (no extra deps)
function newId() {
  return 'cid-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Direct backend URL instead of proxy
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_DIRECT_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://checklist-app-go-qqzjtedwva-ez.a.run.app';

// Create a custom axios instance with keep-alive agents
const axiousProps: AxiosRequestConfig = {
  baseURL: NEXT_PUBLIC_API_BASE_URL,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};

// The base URL is now the local proxy endpoint.
const axiosInstance = Axios.create(axiousProps as CreateAxiosDefaults);

// Generate or return a persistent client id stored in localStorage
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
    // fallback to ephemeral id if localStorage unavailable
    return newId();
  }
}

// Attach client id header to all requests
axiosInstance.interceptors.request.use((cfg) => {
  try {
    const clientId = getClientId();
    cfg.headers = cfg.headers ?? {} as Record<string, any>;
    // assign header in a type-safe way
    (cfg.headers as Record<string, any>)['X-Client-Id'] = clientId;
  } catch (e) {
    // ignore
  }
  return cfg;
});

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    // Add authentication header if needed (for direct backend calls)
    const authConfig = {
      ...config,
      headers: {
        ...config.headers,
        // Add your authentication logic here if needed
        // For example: 'Authorization': `Bearer ${token}`
      }
    };
    
    const { data } = await axiosInstance.request<T>(authConfig);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // You can add more specific error handling here
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
    throw error;
  }
};

export { axiousProps };
