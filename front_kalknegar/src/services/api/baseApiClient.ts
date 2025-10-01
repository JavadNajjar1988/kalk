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
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...options,
    });
    const data = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !data.success) {
      throw new ApiClientError(data.message || 'API Error', 'API_RESPONSE_ERROR');
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



