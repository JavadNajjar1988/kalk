export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface ScenarioListItem {
  id: string;
  name: string;
  description?: string;
  created: Date;
  modified: Date;
  image?: string;
}



