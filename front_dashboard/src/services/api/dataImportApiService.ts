import { BaseApiClient, handleApiResponse } from './baseApiClient';
import { ApiClientError } from './baseApiClient';
import type { ResourceBulkImportItem } from './resourceApiService';

export interface ScenarioExcelPreviewData {
  errors: Array<{ sheet: string; row: number; message: string }>;
  resourceErrors: Array<{ sheet: string; row: number; message: string }>;
  valid: boolean;
  preview: {
    name?: string;
    eventsCount: number;
    sidesCount: number;
    equipmentCount: number;
    personnelCount: number;
    featuresCount: number;
    storyboardScenesCount: number;
    resourceEquipmentRowsCount: number;
    resourcePersonnelRowsCount: number;
    resourceUnitRowsCount: number;
    equipmentQuantityTotal: number;
  };
  content: Record<string, unknown> | null;
  impact: {
    scenarioAction: 'created' | 'updated';
    mergeMode: 'merge' | 'replace';
    collections: Record<string, {
      current: number;
      incoming: number;
      added: number;
      updated: number;
      removed: number;
      preserved: number;
      result: number;
    }>;
    totals: { added: number; updated: number; removed: number; preserved: number };
    resources: { incoming: number; created: number; updated: number; warnings: number };
  };
}

export interface ScenarioExcelImportData extends Record<string, unknown> {
  importAction: 'created' | 'updated';
  resourceImport?: {
    requested: boolean;
    persisted: boolean;
    personnelRows: number;
    equipmentRows: number;
    unitRows: number;
    equipmentQuantityTotal: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ sheet: string; row: number; message: string }>;
  };
}

export interface ResourcesImportData {
  personnel: Record<string, unknown>[];
  equipment: Record<string, unknown>[];
  units: ResourceBulkImportItem[];
  errors: Array<{ sheet: string; row: number; message: string }>;
  impact: { created: number; updated: number; warnings: number };
}

export interface AiConfigData {
  enabled: boolean;
}

export interface AiSheetMapping {
  sourceSheet: string;
  targetSheet: string;
  confidence: number;
}

export interface AiAutoImportResult {
  id: string;
  name: string;
  description?: string;
  aiImportMeta: {
    sheetMappings: AiSheetMapping[];
    warnings: string[];
    parseErrors: Array<{ sheet: string; row: number; message: string }>;
  };
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

  async previewScenarioExcel(
    file: File,
    options?: { targetScenarioId?: string; mergeMode?: 'merge' | 'replace' },
  ): Promise<ScenarioExcelPreviewData> {
    const response = await this.uploadFile<ScenarioExcelPreviewData>(
      '/data-import/scenario/preview',
      file,
      {
        target_scenario_id: options?.targetScenarioId || '',
        merge_mode: options?.mergeMode || 'merge',
      },
    );
    return handleApiResponse(response);
  }

  async importScenarioExcel(
    file: File,
    options?: {
      targetScenarioId?: string;
      mergeMode?: 'merge' | 'replace';
      importResources?: boolean;
    },
  ): Promise<ScenarioExcelImportData> {
    const response = await this.uploadFile<ScenarioExcelImportData>(
      '/data-import/scenario/import',
      file,
      {
        target_scenario_id: options?.targetScenarioId || '',
        merge_mode: options?.mergeMode || 'merge',
        import_resources: options?.importResources === false ? 'false' : 'true',
      },
    );
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

  /**
   * Upload a non-standard Excel file → AI auto-detects mapping → saves scenario in DB.
   * Returns the created scenario plus AI mapping metadata.
   */
  async autoImportWithAi(file: File, minConfidence = 0.45): Promise<AiAutoImportResult> {
    const url = `/data-import/scenario/ai-auto-import?min_confidence=${minConfidence}`;
    const response = await this.uploadFile<AiAutoImportResult>(url, file);
    return handleApiResponse(response);
  }

  /**
   * Upload a non-standard Excel → AI maps it → download the standardized .xlsx file.
   * Returns a Blob ready for download.
   */
  async downloadStandardizedExcel(file: File, minConfidence = 0.45): Promise<Blob> {
    const url = `${this.baseUrl}/data-import/scenario/ai-auto-import?download_excel=true&min_confidence=${minConfidence}`;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      if (res.status === 401) this.handleUnauthorized();
      const errBody = await res.json().catch(() => ({}));
      throw new ApiClientError(
        (errBody as any)?.detail || 'AI standardize failed',
        'AI_IMPORT_FAILED',
        undefined,
        res.status,
      );
    }
    return res.blob();
  }
}

export const dataImportApiService = new DataImportApiService();
export default dataImportApiService;
