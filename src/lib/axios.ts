
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';


// Direct backend URL instead of proxy
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_DIRECT_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://checklist-app-go-qqzjtedwva-ez.a.run.app';

// Warm-up function to prevent cold starts
const warmupBackend = async () => {
  try {
    await axiosInstance.get('/', { timeout: 5000 });
    console.log('🔥 Backend warmed up');
  } catch (error) {
    console.log('❄️ Backend warmup failed:', error);
  }
};

// Warm up every 4 minutes to prevent cold starts
if (typeof window !== 'undefined') {
  setInterval(warmupBackend, 4 * 60 * 1000);
  // Initial warmup
  setTimeout(warmupBackend, 1000);


// Create a lightweight axios instance
const axiousProps: AxiosRequestConfig = {
  baseURL: NEXT_PUBLIC_API_BASE_URL,
  timeout: 5000, // 5 second timeout
};
// The base URL is now the local proxy endpoint.
const axiosInstance = Axios.create(axiousProps as CreateAxiosDefaults);

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const { data } = await axiosInstance.request<T>(config);
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

export {axiousProps} ;
