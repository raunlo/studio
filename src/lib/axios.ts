import Axios, { AxiosError, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import getConfig from 'next/config';

// Get the runtime config
const { publicRuntimeConfig } = getConfig() || {};
const NEXT_PUBLIC_API_BASE_URL = publicRuntimeConfig?.NEXT_PUBLIC_API_BASE_URL || '/api/proxy';

const axiousProps = {
  baseURL: NEXT_PUBLIC_API_BASE_URL
}
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
