// API Response types for scenario management
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Pagination for future use
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query parameters for scenarios
export interface ScenarioQuery {
  search?: string;
  status?: string[];
  include_archived?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startTime';
  sortOrder?: 'asc' | 'desc';
}

// File upload/download types
export interface FileUploadResponse {
  filename: string;
  size: number;
  mimetype: string;
  url: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata?: boolean;
  includeUnits?: boolean;
  includeEvents?: boolean;
}
