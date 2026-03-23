import axios, { type AxiosRequestConfig } from 'axios';
import { history } from '@umijs/max';
import { message } from 'antd';
import { TOKEN_STORAGE_KEY } from '@/constants/storage';
import type { ApiResponse } from '@/types/api';

const service = axios.create({
  baseURL: process.env.UMI_APP_API_BASE_URL || '/api',
  timeout: 10000,
});

service.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

service.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      history.push('/login');
    }
    message.error(error.response?.data?.message || error.message || '请求失败');
    return Promise.reject(error);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await service.request<ApiResponse<T>>(config);
  const payload = response.data;

  if (!payload.success || payload.code !== 0) {
    message.error(payload.message || '请求失败');
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}
