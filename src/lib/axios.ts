
import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import http from 'http';
import https from 'https';

// The base URL should always be the relative path to our proxy.
const NEXT_PUBLIC_API_BASE_URL = process.env.BACKEND_URL;

const axiousProps: AxiosRequestConfig = {
  baseURL: NEXT_PUBLIC_API_BASE_URL,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};
// The base URL is now the local proxy endpoint.
const axiosInstance = Axios.create(axiousProps as CreateAxiosDefaults);

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const { data } = await axiosInstance.request<T>({ ...config });
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
