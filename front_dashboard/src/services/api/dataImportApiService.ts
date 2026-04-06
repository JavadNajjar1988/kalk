import { BaseApiClient, handleApiResponse } from './baseApiClient';
import { ApiClientError } from './baseApiClient';

export interface ScenarioExcelPreviewData {
  errors: Array<{ sheet: string; row: number; message: string }>;
  valid: boolean;
  preview: {
    name?: string;
    eventsCount: number;
    sidesCount: number;
    equipmentCount: number;
    personnelCount: number;
  };
  content: Record<string, unknown> | null;
}

export interface ResourcesImportData {
  personnel: Record<string, unknown>[];
  equipment: Record<string, unknown>[];
  errors: Array<{ sheet: string; row: number; message: string }>;
}

export interface AiConfigData {
  enabled: boolean;
}

class DataImportApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async downloadExcelTemplate(): Promise<Blob> {
    const url = `${this.baseUrl}/data-import/excel-template`;
    const res = await fetch(url, {
      headers: this.getAuthHeaders(),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.handleUnauthorized();
      }
      throw new ApiClientError('Failed to download template', 'DOWNLOAD_FAILED', undefined, res.status);
    }
    return res.blob();
  }

  async getAiConfig(): Promise<AiConfigData> {
    const response = await this.get<AiConfigData>('/data-import/ai-config');
    return handleApiResponse(response);
  }

  async previewScenarioExcel(file: File): Promise<ScenarioExcelPreviewData> {
    const response = await this.uploadFile<ScenarioExcelPreviewData>('/data-import/scenario/preview', file);
    return handleApiResponse(response);
  }

  async importScenarioExcel(file: File): Promise<Record<string, unknown>> {
    const response = await this.uploadFile<Record<string, unknown>>('/data-import/scenario/import', file);
    return handleApiResponse(response);
  }

  async importResourcesExcel(file: File): Promise<ResourcesImportData> {
    const response = await this.uploadFile<ResourcesImportData>('/data-import/resources/import', file);
    return handleApiResponse(response);
  }

  async suggestMappingWithAi(file: File): Promise<Record<string, unknown>> {
    const response = await this.uploadFile<Record<string, unknown>>('/data-import/ai/suggest-mapping', file);
    return handleApiResponse(response);
  }
}

export const dataImportApiService = new DataImportApiService();
export default dataImportApiService;
