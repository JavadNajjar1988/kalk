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
    movingUnitsCount: number;
    unitMovementStatesCount: number;
    resourceEquipmentRowsCount: number;
    resourcePersonnelRowsCount: number;
    resourceUnitRowsCount: number;
    equipmentQuantityTotal: number;
  };
  content: Record<string, unknown> | null;
  impact: {
    scenarioAction: 'created' | 'updated';
    mergeMode: 'merge' | 'replace';
    collections: Record<
      string,
      {
        current: number;
        incoming: number;
        added: number;
        updated: number;
        removed: number;
        preserved: number;
        result: number;
      }
    >;
    totals: {
      added: number;
      updated: number;
      removed: number;
      preserved: number;
    };
    resources: {
      incoming: number;
      created: number;
      updated: number;
      warnings: number;
    };
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
  configured: boolean;
  reachable: boolean;
  modelAvailable: boolean;
  model: string;
  message: string;
}

export interface DocumentModelState {
  model: string;
  configured: boolean;
  reachable: boolean;
  available: boolean;
}

export interface DocumentModelStatus {
  ready: boolean;
  llm: DocumentModelState;
  ocr: DocumentModelState;
  ocrMode: 'vlm-component' | 'full-pipeline';
}

export interface DocumentProposal {
  id: string;
  kind: 'scenario' | 'person' | 'unit' | 'equipment' | 'place' | 'event';
  name: string;
  evidence: string;
  sourcePage: number;
  sourceMethod: string;
  documentId: string;
  reviewStatus: 'pending' | 'accepted' | 'rejected';
  startTime?: string;
  longitude?: number;
  latitude?: number;
  side?: string;
  unitType?: string;
  echelon?: string;
  parentUnitId?: string;
  equipmentType?: string;
  quantity?: number;
  unitId?: string;
  rank?: string;
  specialty?: string;
  placeType?: string;
  radiusMeters?: number;
  resourceCode?: string;
  matchedResourceId?: string;
  matchedResourceName?: string;
  canonicalName?: string;
  entityDraftId?: string;
}

export interface DocumentPagePreview {
  documentId: string;
  filename: string;
  page: number;
  pageCount: number;
  method: string;
  text: string;
  nativeText?: string;
  ocrText?: string;
  pageKinds?: Array<'text' | 'image' | 'table' | 'military-map'>;
  warnings: string[];
  items: DocumentProposal[];
  persisted: boolean;
  pageKind?: 'military-map';
  reviewStatus?: 'pending' | 'reviewed' | 'no_relevant_data';
  mapCandidate?: Omit<DocumentMapPage, 'page'>;
}

export interface DocumentMapPage {
  page: number;
  status: 'needs_placement' | 'attached' | 'ignored';
  rotationDegrees: 0 | 90 | 180 | 270;
  reason: string;
  confidence?: number;
  scenarioId?: string;
  layerId?: string;
  reviewedAt?: string;
}

export interface DocumentPageCoverage {
  page: number;
  pageKinds: Array<'text' | 'image' | 'table' | 'military-map'>;
  status: 'pending_review' | 'reviewed' | 'no_relevant_data' | 'error';
  itemCount: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  mapStatus?: DocumentMapPage['status'];
  warnings: string[];
}

export interface DocumentJob {
  id: string;
  filename: string;
  documentId: string;
  pageCount: number;
  forceOcr: boolean;
  status:
    | 'queued'
    | 'running'
    | 'cancel_requested'
    | 'cancelled'
    | 'completed'
    | 'partial'
    | 'failed';
  currentPage?: number;
  processedPages: number[];
  failedPages: Record<string, string>;
  mapPages?: Record<string, DocumentMapPage>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface DocumentWorkbookDraft {
  filename: string;
  documentId: string;
  pageCount: number;
  mainScenarioId: string;
  items: DocumentProposal[];
  coverage?: DocumentPageCoverage[];
  finalized?: boolean;
}

export type DocumentStreamEvent =
  | { type: 'metadata'; pageCount: number; documentId: string }
  | { type: 'progress'; page: number; pageCount: number }
  | { type: 'page'; result: DocumentPagePreview }
  | { type: 'page_error'; page: number; message: string }
  | { type: 'done'; pageCount: number; succeeded: number; failed: number };

export interface AiSheetMapping {
  sourceSheet: string;
  targetSheet: string;
  confidence: number;
}

export interface AiColumnMapping {
  targetSheet: string;
  mappings: Array<{ fromHeader: string; toField: string }>;
}

export interface AiMappingSuggestion {
  sheetMappings: AiSheetMapping[];
  columnMaps: AiColumnMapping[];
}

export interface AiMappingSuggestionData {
  suggestion: AiMappingSuggestion;
  sheetSamples: Array<{
    sheet: string;
    headerRow: number;
    headerDepth: number;
    headers: string[];
    sampleRows: string[][];
  }>;
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

  async downloadExcelTemplate(
    variant: 'blank' | 'example' = 'blank'
  ): Promise<Blob> {
    const url = `${this.baseUrl}/data-import/excel-template?variant=${variant}`;
    const res = await fetch(url, {
      headers: this.getAuthHeaders(),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.handleUnauthorized();
      }
      throw new ApiClientError(
        'Failed to download template',
        'DOWNLOAD_FAILED',
        undefined,
        res.status
      );
    }
    return res.blob();
  }

  async getAiConfig(): Promise<AiConfigData> {
    const response = await this.get<AiConfigData>('/data-import/ai-config');
    return handleApiResponse(response);
  }

  async getDocumentModelStatus(): Promise<DocumentModelStatus> {
    const response = await this.get<DocumentModelStatus>(
      '/data-import/document/status'
    );
    return handleApiResponse(response);
  }

  async previewDocument(
    file: File,
    page: number,
    forceOcr: boolean,
    signal: AbortSignal
  ): Promise<DocumentPagePreview> {
    const body = new FormData();
    body.append('file', file);
    body.append('page', String(page));
    body.append('force_ocr', String(forceOcr));
    const response = await fetch(
      `${this.baseUrl}/data-import/document/preview`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        signal,
      }
    );
    if (response.status === 401) this.handleUnauthorized();
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.message ||
          (typeof result.detail === 'string'
            ? result.detail
            : 'استخراج سند ناموفق بود.')
      );
    return handleApiResponse(result);
  }

  async previewWholeDocument(
    file: File,
    skipPages: number[],
    forceOcr: boolean,
    signal: AbortSignal,
    onEvent: (event: DocumentStreamEvent) => void
  ): Promise<void> {
    const body = new FormData();
    body.append('file', file);
    body.append('skip_pages', JSON.stringify(skipPages));
    body.append('force_ocr', String(forceOcr));
    const response = await fetch(
      `${this.baseUrl}/data-import/document/preview-all`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        signal,
      }
    );
    if (response.status === 401) this.handleUnauthorized();
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(
        result.message || result.detail || 'پردازش سند آغاز نشد.'
      );
    }
    if (!response.body)
      throw new Error('مرورگر دریافت تدریجی نتیجه را پشتیبانی نمی‌کند.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    let finished = false;
    const consume = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line) as DocumentStreamEvent;
      if (event.type === 'done') finished = true;
      onEvent(event);
    };
    try {
      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split('\n');
        pending = lines.pop() || '';
        lines.forEach(consume);
        if (done) {
          consume(pending);
          break;
        }
      }
      if (!finished)
        throw new Error(
          'ارتباط پیش از پایان سند قطع شد؛ برای ادامه دوباره پردازش کل سند را بزنید.'
        );
    } finally {
      reader.releaseLock();
    }
  }

  async createDocumentJob(file: File, forceOcr: boolean): Promise<DocumentJob> {
    const response = await this.uploadFile<DocumentJob>(
      '/data-import/document/jobs',
      file,
      { force_ocr: String(forceOcr) }
    );
    return handleApiResponse(response);
  }

  async getDocumentJob(jobId: string): Promise<DocumentJob> {
    const response = await this.get<DocumentJob>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}`
    );
    return handleApiResponse(response);
  }

  async listDocumentJobs(): Promise<DocumentJob[]> {
    const response = await this.get<DocumentJob[]>(
      '/data-import/document/jobs'
    );
    return handleApiResponse(response);
  }

  async getDocumentJobPage(
    jobId: string,
    page: number
  ): Promise<DocumentPagePreview> {
    const response = await this.get<DocumentPagePreview>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/pages/${page}`
    );
    return handleApiResponse(response);
  }

  async cancelDocumentJob(jobId: string): Promise<DocumentJob> {
    const response = await this.post<DocumentJob>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/cancel`
    );
    return handleApiResponse(response);
  }

  async resumeDocumentJob(jobId: string): Promise<DocumentJob> {
    const response = await this.post<DocumentJob>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/resume`
    );
    return handleApiResponse(response);
  }

  async detectDocumentMapPages(jobId: string): Promise<DocumentJob> {
    const response = await this.post<DocumentJob>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/map-pages/detect`
    );
    return handleApiResponse(response);
  }

  async getDocumentMapPageImage(jobId: string, page: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/data-import/document/jobs/${encodeURIComponent(jobId)}/map-pages/${page}/image`,
      { headers: { ...this.getAuthHeaders() } }
    );
    if (!response.ok) throw new ApiClientError('دریافت تصویر کالک ناموفق بود.');
    return response.blob();
  }

  async attachDocumentMapPage(
    jobId: string,
    page: number,
    payload: {
      scenarioId: string;
      layerName: string;
      rotationDegrees: 0 | 90 | 180 | 270;
    }
  ): Promise<{
    scenarioId: string;
    layerId: string;
    imageUrl: string;
    requiresPlacement: boolean;
    kalknegarUrl: string;
  }> {
    const response = await this.post<{
      scenarioId: string;
      layerId: string;
      imageUrl: string;
      requiresPlacement: boolean;
      kalknegarUrl: string;
    }>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/map-pages/${page}/attach`,
      payload
    );
    return handleApiResponse(response);
  }

  async decideDocumentMapPage(
    jobId: string,
    page: number,
    decision: 'ignored' | 'needs_placement'
  ): Promise<DocumentJob> {
    const response = await this.post<DocumentJob>(
      `/data-import/document/jobs/${encodeURIComponent(jobId)}/map-pages/${page}/decision`,
      { decision }
    );
    return handleApiResponse(response);
  }

  async createDocumentWorkbook(draft: DocumentWorkbookDraft): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/data-import/document/workbook`,
      {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
        signal: AbortSignal.timeout(this.timeout),
      }
    );
    if (response.status === 401) this.handleUnauthorized();
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(
        result.message || result.detail || 'ساخت فایل اکسل ناموفق بود.'
      );
    }
    return response.blob();
  }

  async previewScenarioExcel(
    file: File,
    options?: { targetScenarioId?: string; mergeMode?: 'merge' | 'replace' }
  ): Promise<ScenarioExcelPreviewData> {
    const response = await this.uploadFile<ScenarioExcelPreviewData>(
      '/data-import/scenario/preview',
      file,
      {
        target_scenario_id: options?.targetScenarioId || '',
        merge_mode: options?.mergeMode || 'merge',
      }
    );
    return handleApiResponse(response);
  }

  async importScenarioExcel(
    file: File,
    options?: {
      targetScenarioId?: string;
      mergeMode?: 'merge' | 'replace';
      importResources?: boolean;
    }
  ): Promise<ScenarioExcelImportData> {
    const response = await this.uploadFile<ScenarioExcelImportData>(
      '/data-import/scenario/import',
      file,
      {
        target_scenario_id: options?.targetScenarioId || '',
        merge_mode: options?.mergeMode || 'merge',
        import_resources: options?.importResources === false ? 'false' : 'true',
      }
    );
    return handleApiResponse(response);
  }

  async importResourcesExcel(file: File): Promise<ResourcesImportData> {
    const response = await this.uploadFile<ResourcesImportData>(
      '/data-import/resources/import',
      file
    );
    return handleApiResponse(response);
  }

  async suggestMappingWithAi(file: File): Promise<AiMappingSuggestionData> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(
      `${this.baseUrl}/data-import/ai/suggest-mapping`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
        signal: AbortSignal.timeout(180_000),
      }
    );
    if (response.status === 401) this.handleUnauthorized();
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiClientError(
        result.message || result.detail || 'تحلیل ساختار اکسل ناموفق بود.',
        'AI_MAPPING_FAILED',
        undefined,
        response.status
      );
    }
    return handleApiResponse(result);
  }

  /**
   * Upload a non-standard Excel file → AI auto-detects mapping → saves scenario in DB.
   * Returns the created scenario plus AI mapping metadata.
   */
  async autoImportWithAi(
    file: File,
    minConfidence = 0.45
  ): Promise<AiAutoImportResult> {
    const url = `/data-import/scenario/ai-auto-import?min_confidence=${minConfidence}`;
    const response = await this.uploadFile<AiAutoImportResult>(url, file);
    return handleApiResponse(response);
  }

  /**
   * Upload a non-standard Excel → AI maps it → download the standardized .xlsx file.
   * Returns a Blob ready for download.
   */
  async downloadStandardizedExcel(
    file: File,
    mapping?: AiMappingSuggestion,
    minConfidence = 0.45
  ): Promise<Blob> {
    const url = `${this.baseUrl}/data-import/scenario/ai-auto-import?download_excel=true&min_confidence=${minConfidence}`;
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping_json', JSON.stringify(mapping));

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
        res.status
      );
    }
    return res.blob();
  }
}

export const dataImportApiService = new DataImportApiService();
export default dataImportApiService;
