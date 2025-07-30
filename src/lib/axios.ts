import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

// The base URL is now the local proxy endpoint.
const axiosInstance = Axios.create({
  baseURL: '/api/proxy',
});

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

export default customInstance;
