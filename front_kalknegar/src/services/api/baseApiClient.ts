import type { ApiResponse } from './types';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class BaseApiClient {
  constructor(private baseUrl: string = '/api') {}

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    
    // Cache-busting برای dev environment
    const isDev = import.meta.env.DEV;
    const cacheBuster = isDev ? `${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
    const fullUrl = `${this.baseUrl}${endpoint}${cacheBuster}`;
    
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeader, ...(options?.headers || {}) },
      cache: isDev ? 'no-store' : 'default', // جلوگیری از cache در dev
      ...options,
    });
    const raw = await res.text();
    let data: ApiResponse<T> | null = null;
    try {
      data = raw ? (JSON.parse(raw) as ApiResponse<T>) : null;
    } catch (e) {
      console.error('Failed to parse JSON response', e, 'raw:', raw);
    }
    if (!res.ok || !data?.success) {
      const message = data?.message || `HTTP ${res.status}`;
      throw new ApiClientError(message, 'API_RESPONSE_ERROR', undefined, res.status);
    }
    return data;
  }

  protected async postForm<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    const isDev = import.meta.env.DEV;
    const cacheBuster = isDev ? `${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
    const fullUrl = `${this.baseUrl}${endpoint}${cacheBuster}`;

    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', ...authHeader },
      cache: isDev ? 'no-store' : 'default',
      body: formData,
    });
    const raw = await res.text();
    let data: ApiResponse<T> | null = null;
    try {
      data = raw ? (JSON.parse(raw) as ApiResponse<T>) : null;
    } catch (e) {
      console.error('Failed to parse JSON response', e, 'raw:', raw);
    }
    if (!res.ok || !data?.success) {
      const message = data?.message || `HTTP ${res.status}`;
      throw new ApiClientError(message, 'API_RESPONSE_ERROR', undefined, res.status);
    }
    return data;
  }

  protected get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  protected post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }
  protected put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }
  protected delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export function handleApiResponse<T>(res: ApiResponse<T>): T {
  if (!res.success || typeof res.data === 'undefined') {
    throw new ApiClientError(res.message || 'API response failed');
  }
  return res.data;
}



