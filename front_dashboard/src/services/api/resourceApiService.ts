import { BaseApiClient, handleApiResponse, ApiClientError } from './baseApiClient';

export type ResourceType =
  | 'personnel'
  | 'equipment'
  | 'units'
  | 'ammunition'
  | 'logistics'
  | 'ranks'
  | 'maps';

export interface ResourceMediaDto {
  id: string;
  resource_id?: string | null;
  filename: string;
  content_type?: string | null;
  file_size?: number | null;
  caption?: string | null;
  credits?: string | null;
  credits_url?: string | null;
  url: string;
  created_at: string;
}

export interface ResourceDto {
  id: string;
  type: ResourceType;
  name: string;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  media_files: ResourceMediaDto[];
}

export interface ResourceListResponse {
  items: ResourceDto[];
  total: number;
}

export interface ResourceListQuery {
  type?: ResourceType;
  search?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export interface ResourceCreatePayload {
  type: ResourceType;
  name: string;
  id?: string;
  code?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ResourceUpdatePayload {
  name?: string;
  code?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ResourceBulkImportItem {
  type: ResourceType;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ResourceBulkImportResponse {
  created: number;
  updated: number;
  skipped: number;
}

export interface ResourceUsageAssignment {
  kind: 'equipment' | 'personnel' | 'unit' | 'positioned-equipment';
  unitId?: string | null;
  unitName: string;
  parentUnitName?: string | null;
  sideName?: string | null;
  status: string;
  quantity?: number | null;
  onHand?: number | null;
  location?: number[] | null;
  startTime?: string | number | null;
  endTime?: string | number | null;
}

export interface ResourceUsageOperation {
  scenarioId: string;
  scenarioName: string;
  scenarioStatus: string;
  startTime?: string | null;
  endTime?: string | null;
  assignments: ResourceUsageAssignment[];
}

export interface ResourceUsageGraph {
  resource: {
    id: string;
    type: ResourceType;
    name: string;
    code?: string | null;
    status?: string | null;
  };
  summary: { operationsCount: number; assignmentsCount: number };
  operations: ResourceUsageOperation[];
}

export interface UnitReconciliationOccurrence {
  scenarioId: string;
  scenarioName: string;
  unitId: string;
  unitName: string;
  sidc?: string | null;
  sideName?: string | null;
  parentUnitName?: string | null;
}

export interface UnitReconciliationData {
  occurrences: UnitReconciliationOccurrence[];
  resources: Array<{ id: string; name: string; code?: string | null; sidc?: string | null }>;
  summary: { unlinkedOccurrences: number; canonicalUnits: number };
}

export interface LegacyResourceReconciliationOccurrence {
  scenarioId: string;
  scenarioName: string;
  occurrenceKey: string;
  resourceType: 'equipment' | 'personnel';
  itemName: string;
  sourceCode?: string | null;
  unitNames: string[];
  occurrenceCount: number;
}

export interface LegacyResourceReconciliationData {
  resourceType: 'equipment' | 'personnel';
  occurrences: LegacyResourceReconciliationOccurrence[];
  resources: Array<{ id: string; name: string; code?: string | null }>;
  summary: {
    unlinkedGroups: number;
    unlinkedReferences: number;
    canonicalResources: number;
  };
}

class ResourceApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async list(query: ResourceListQuery = {}): Promise<ResourceListResponse> {
    const params: Record<string, string> = {};
    if (query.type) params.type = query.type;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.skip !== undefined) params.skip = String(query.skip);
    if (query.limit !== undefined) params.limit = String(query.limit);
    const response = await this.get<ResourceListResponse>('/resources', params);
    return handleApiResponse(response);
  }

  async search(q: string, type?: ResourceType, limit = 20): Promise<ResourceDto[]> {
    const qq = (q ?? '').trim();
    if (!qq) return [];
    const params: Record<string, string> = { q, limit: String(limit) };
    if (type) params.type = type;
    const response = await this.get<ResourceDto[]>('/resources/search', params);
    return handleApiResponse(response);
  }

  async getById(id: string): Promise<ResourceDto> {
    const response = await this.get<ResourceDto>(`/resources/${encodeURIComponent(id)}`);
    return handleApiResponse(response);
  }

  async getUsageGraph(id: string): Promise<ResourceUsageGraph> {
    const response = await this.get<ResourceUsageGraph>(
      `/resources/${encodeURIComponent(id)}/usage-graph`,
    );
    return handleApiResponse(response);
  }

  async getUnitReconciliation(): Promise<UnitReconciliationData> {
    const response = await this.get<UnitReconciliationData>('/resources/units/reconciliation');
    return handleApiResponse(response);
  }

  async applyUnitReconciliation(
    assignments: Array<{ scenario_id: string; unit_id: string; resource_id: string }>,
  ): Promise<{ linked: number; skipped: Array<Record<string, string>> }> {
    const response = await this.post<{ linked: number; skipped: Array<Record<string, string>> }>(
      '/resources/units/reconciliation',
      { assignments },
    );
    return handleApiResponse(response);
  }

  async getLegacyReconciliation(
    type: 'equipment' | 'personnel',
  ): Promise<LegacyResourceReconciliationData> {
    const response = await this.get<LegacyResourceReconciliationData>(
      `/resources/reconciliation/${type}`,
    );
    return handleApiResponse(response);
  }

  async applyLegacyReconciliation(
    type: 'equipment' | 'personnel',
    assignments: Array<{ scenario_id: string; occurrence_key: string; resource_id: string }>,
  ): Promise<{ linkedGroups: number; linkedReferences: number; skipped: Array<Record<string, string>> }> {
    const response = await this.post<{
      linkedGroups: number;
      linkedReferences: number;
      skipped: Array<Record<string, string>>;
    }>(`/resources/reconciliation/${type}`, { assignments });
    return handleApiResponse(response);
  }

  async create(payload: ResourceCreatePayload): Promise<ResourceDto> {
    const response = await this.post<ResourceDto>('/resources', payload);
    return handleApiResponse(response);
  }

  async update(id: string, payload: ResourceUpdatePayload): Promise<ResourceDto> {
    const response = await this.put<ResourceDto>(
      `/resources/${encodeURIComponent(id)}`,
      payload,
    );
    return handleApiResponse(response);
  }

  async remove(id: string): Promise<void> {
    await this.delete(`/resources/${encodeURIComponent(id)}`);
  }

  async bulkImport(items: ResourceBulkImportItem[]): Promise<ResourceBulkImportResponse> {
    const response = await this.post<ResourceBulkImportResponse>(
      '/resources/bulk-import',
      { items },
    );
    return handleApiResponse(response);
  }

  async uploadMedia(
    file: File,
    options: { resourceId?: string; caption?: string; credits?: string; creditsUrl?: string } = {},
  ): Promise<ResourceMediaDto> {
    const additional: Record<string, any> = {};
    if (options.resourceId) additional.resource_id = options.resourceId;
    if (options.caption) additional.caption = options.caption;
    if (options.credits) additional.credits = options.credits;
    if (options.creditsUrl) additional.credits_url = options.creditsUrl;
    const response = await this.uploadFile<ResourceMediaDto>(
      '/resources/media/upload',
      file,
      additional,
    );
    return handleApiResponse(response);
  }

  async getMediaMeta(mediaId: string): Promise<ResourceMediaDto> {
    const response = await this.get<ResourceMediaDto>(
      `/resources/media/${encodeURIComponent(mediaId)}`,
    );
    return handleApiResponse(response);
  }

  getMediaUrl(mediaId: string): string {
    return `${this.baseUrl}/resources/media/${encodeURIComponent(mediaId)}/file`;
  }

  async deleteMedia(mediaId: string): Promise<void> {
    await this.delete(`/resources/media/${encodeURIComponent(mediaId)}`);
  }
}

export const resourceApiService = new ResourceApiService();
export default resourceApiService;
export { ApiClientError };
