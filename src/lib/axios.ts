import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

const axiosInstance = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
