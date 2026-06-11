import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && payload.success === false) throw new ApiError(payload.message || '接口请求失败', payload.code);
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    throw new ApiError(error.response?.data?.message || error.message || '网络请求失败', error.response?.data?.code);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config);
  return response.data.data;
}
