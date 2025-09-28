// API Types for Kalknegar - Shared with Backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  status?: number;
}

// Scenario API Types
export interface ScenarioQuery {
  search?: string;
  status?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created' | 'modified';
  sortOrder?: 'asc' | 'desc';
}

export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  size?: number;
  version?: string;
}

export interface ScenarioListResponse {
  scenarios: ScenarioMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  url: string;
}

export interface ExportOptions {
  format?: 'json' | 'kml' | 'kmz' | 'xlsx' | 'milx';
  includeUnits?: boolean;
  includeFeatures?: boolean;
  oneFolderPerSide?: boolean;
  useShortName?: boolean;
  embedIcons?: boolean;
}

// Import/Export Types
export interface ImportResult {
  scenario: any; // Scenario type
  warnings: string[];
  errors: string[];
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
}

// Authentication Types (for future use)
export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}
