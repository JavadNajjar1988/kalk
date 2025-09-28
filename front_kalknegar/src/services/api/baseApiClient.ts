import { ApiResponse, ApiError } from './types';

// Base API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Custom error class for API errors
export class ApiClientError extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly status?: number;

  constructor(message: string, code?: string, details?: Record<string, any>, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

// Base API client class
export class BaseApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.baseUrl, timeout: number = API_CONFIG.timeout) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiClientError(
          data.message || 'API request failed',
          data.code,
          data.details,
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ApiClientError('Request timeout', 'TIMEOUT');
      }

      if (error instanceof TypeError) {
        throw new ApiClientError('Network error', 'NETWORK_ERROR');
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR'
      );
    }
  }

  // HTTP methods
  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // File upload helper
  protected async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
    });
  }
}

// Utility function to handle API responses
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new ApiClientError(
      response.message || 'API response indicates failure',
      'API_RESPONSE_ERROR',
      response.errors
    );
  }
  return response.data;
}
