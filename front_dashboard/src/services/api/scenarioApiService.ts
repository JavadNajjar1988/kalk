import { BaseApiClient, handleApiResponse } from './baseApiClient';
import { ScenarioQuery, ExportOptions } from './types';
import { EnhancedScenario } from '@/types';

// Form-specific types for scenario creation/editing to handle optional fields
export interface ScenarioFormData {
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  objectives?: string[];
  // Other optional form fields
  [key: string]: any;
}

export interface ScenarioHistoryChange {
  category: 'tactical_symbol' | 'unit' | 'map_feature' | string;
  operation: 'added' | 'removed' | 'moved' | 'edited' | string;
  name: string;
  layer?: string;
  side?: string;
  region?: string;
  previous_region?: string;
  location?: { lon: number; lat: number };
  previous_location?: { lon: number; lat: number };
  changed_fields?: string[];
}

export interface ScenarioHistoryDiff {
  fields?: string[];
  summary?: {
    added?: number;
    removed?: number;
    moved?: number;
    edited?: number;
    total?: number;
  };
  changes?: ScenarioHistoryChange[];
  truncated?: boolean;
  name?: string;
  source_id?: string;
}

export interface ScenarioHistoryEntry {
  id: string;
  scenario_id: string;
  actor_user_id: string | null;
  actor_username: string | null;
  actor_display_name: string | null;
  actor_user_code: string | null;
  action: string;
  payload_diff: ScenarioHistoryDiff | null;
  created_at: string;
}

export interface ScenarioHistoryPage {
  items: ScenarioHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * تبدیل داده‌های فرم داشبورد به یک سناریوی سازگار با ORBAT-mapper
 * این ساختار در فیلد `content` در بک‌اند ذخیره می‌شود تا مستقیماً توسط کالک‌نگار قابل لود باشد.
 */
export function transformFormToScenario(formData: ScenarioFormData): any {
  const nowIso = new Date().toISOString();

  // شناسه موقت برای سناریو؛ شناسه نهایی از طرف بک‌اند (UUID) برمی‌گردد
  const tempId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `scn-${Date.now()}`;

  // دریافت تصویر از formData.image یا formData.metadata?.image
  const image = (formData as any)?.image || (formData as any)?.metadata?.image;

  // تبدیل startTime از ISO string به timestamp (number)
  let startTime: number;
  if (formData.startTime) {
    const date = new Date(formData.startTime);
    startTime = isNaN(date.getTime())
      ? new Date().setHours(12, 0, 0, 0)
      : date.getTime();
  } else {
    startTime = new Date().setHours(12, 0, 0, 0);
  }

  // تبدیل endTime از ISO string به timestamp (number) اگر وجود داشته باشد
  let endTime: number | undefined;
  if (formData.endTime) {
    const date = new Date(formData.endTime);
    endTime = isNaN(date.getTime()) ? undefined : date.getTime();
  }

  // دریافت timeZone و symbologyStandard از metadata
  const metadata = (formData as any)?.metadata || {};
  const timeZone = metadata.timeZone || 'UTC';
  const symbologyStandard = metadata.symbologyStandard || 'app6';

  // ایجاد یک لایه خالی برای features
  // استفاده از یک ID ساده برای لایه
  const defaultLayerId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    // فیلدهای اصلی مورد انتظار کالک‌نگار
    id: tempId,
    type: 'ORBAT-mapper',
    version: '0.40.0',
    name: formData.name,
    description: formData.description || '',

    // زمان شروع/پایان سناریو (باید timestamp باشد نه ISO string)
    startTime: startTime,
    endTime: endTime,

    // timeZone و symbologyStandard باید در سطح اصلی باشند
    timeZone: timeZone,
    symbologyStandard: symbologyStandard,

    // وضعیت و اهداف (هم در داشبورد و هم در کالک‌نگار به کار می‌آیند)
    status: formData.status || 'draft',
    objectives: formData.objectives || [],

    // تصویر سناریو
    image: image,

    // آرایش اولیه انتخاب‌شده در فرم؛ در صورت انتخاب «افزودن بعداً» خالی است
    sides: Array.isArray(metadata.sides) ? metadata.sides : [],
    events: [],
    phases: [],
    // حداقل یک لایه خالی برای features
    layers: [{ id: defaultLayerId, name: 'Features', features: [] }],
    mapLayers: [],

    // تنظیمات سناریو – باید baseMapId داشته باشد
    settings: {
      rangeRingGroups: [],
      statuses: [],
      supplyClasses: [
        { name: 'Class I' },
        { name: 'Class II' },
        { name: 'Class III' },
        { name: 'Class IV' },
        { name: 'Class V' },
      ],
      supplyUoMs: [
        { name: 'Kilogram', code: 'KG', type: 'weight' },
        { name: 'Liter', code: 'LI', type: 'volume' },
        { name: 'Each', code: 'EA', type: 'quantity' },
        { name: 'Meter', code: 'MR', type: 'distance' },
        { name: 'Gallon', code: 'GL', type: 'volume' },
      ],
      map: {
        baseMapId: 'osm',
      },
    },

    // متادیتا و فیلدهای توسعه‌یافته‌ای که هر دو فرانت می‌توانند از آن استفاده کنند
    meta: {
      createdDate: nowIso,
      lastModifiedDate: nowIso,
    },
    terrainAnalysis: undefined,
    battleInformation: undefined,
    commandStructure: [],
    simulationSettings: undefined,
    currentTime: undefined,
    simulationSpeed: 1.0,
    executionStatus: 'not_started',
    analysisResults: [],
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    metadata: {
      source: 'dashboard',
      // حفظ تصویر در metadata هم برای سازگاری
      ...(image ? { image } : {}),
      // حفظ سایر metadata از formData
      ...metadata,
    },
  };
}

export class ScenarioApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  // Override getAuthHeaders to include authentication token
  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildScenarioPayload(data: EnhancedScenario) {
    const name = (data as any)?.name || '';
    const description = (data as any)?.description || '';
    // دریافت تصویر از image یا metadata.image
    const image = (data as any)?.image || (data as any)?.metadata?.image;
    const intro_video_url = (data as any)?.intro_video_url ?? undefined;
    const intro_title = (data as any)?.intro_title ?? undefined;
    const intro_summary = (data as any)?.intro_summary ?? undefined;
    const toIsoDate = (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '')
        return undefined;
      const date = new Date(value as string | number);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };
    return {
      name,
      description,
      image,
      intro_video_url,
      intro_title,
      intro_summary,
      start_time: toIsoDate((data as any)?.startTime),
      end_time: toIsoDate((data as any)?.endTime),
      content: data,
    } as any;
  }

  mapScenarioOutToEnhanced(apiItem: any): EnhancedScenario {
    if (
      apiItem &&
      typeof apiItem === 'object' &&
      'content' in apiItem &&
      apiItem.content
    ) {
      const base = apiItem.content;
      return {
        ...base,
        id: apiItem.id ?? base.id,
        name: apiItem.name ?? base.name,
        description: apiItem.description ?? base.description,
        // اضافه کردن image از apiItem یا base
        image: apiItem.image ?? base.image,
        intro_video_url:
          apiItem.intro_video_url ?? (base as any).intro_video_url,
        intro_title: apiItem.intro_title ?? (base as any).intro_title,
        intro_summary: apiItem.intro_summary ?? (base as any).intro_summary,
        archived_at: apiItem.archived_at ?? null,
        createdAt: apiItem.created ?? base.createdAt,
        updatedAt: apiItem.modified ?? base.updatedAt,
        importAction: apiItem.importAction,
        // اگر image در metadata نباشد، آن را اضافه می‌کنیم
        metadata: {
          ...(base.metadata || {}),
          image: apiItem.image ?? base.image ?? base.metadata?.image,
        },
      } as EnhancedScenario;
    }
    return apiItem as EnhancedScenario;
  }

  // GET /api/scenarios
  async getScenarios(query?: ScenarioQuery): Promise<EnhancedScenario[]> {
    try {
      const response = await this.get<any[]>('/scenarios', query);
      const data = handleApiResponse(response);
      return (Array.isArray(data) ? data : []).map(i =>
        this.mapScenarioOutToEnhanced(i)
      );
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
      throw error;
    }
  }

  // GET /api/scenarios/:id
  async getScenarioById(id: string): Promise<EnhancedScenario> {
    try {
      console.log(`ScenarioApiService: Fetching scenario ${id}`);

      const response = await this.get<any>(`/scenarios/${id}`);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to fetch scenario ${id}:`, error);
      throw error;
    }
  }

  // POST /api/scenarios
  async createScenario(formData: ScenarioFormData): Promise<EnhancedScenario> {
    try {
      const scenarioData = transformFormToScenario(formData);
      const payload = this.buildScenarioPayload(scenarioData as any);
      const response = await this.post<any>('/scenarios', payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error('Failed to create scenario:', error);
      throw error;
    }
  }

  // PUT /api/scenarios/:id
  async updateScenario(
    id: string,
    updates: Partial<EnhancedScenario>
  ): Promise<EnhancedScenario> {
    try {
      // The backend stores the complete editor model in `content`. Always merge
      // partial UI updates with the latest server copy before replacing it.
      const current = await this.getScenarioById(id);
      const merged = {
        ...current,
        ...updates,
        id,
        metadata: {
          ...(current.metadata || {}),
          ...((updates as any).metadata || {}),
        },
      } as EnhancedScenario;
      const payload = this.buildScenarioPayload(merged);
      const response = await this.put<any>(`/scenarios/${id}`, payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to update scenario ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/scenarios/:id (for partial updates)
  async patchScenario(
    id: string,
    updates: Partial<EnhancedScenario>
  ): Promise<EnhancedScenario> {
    try {
      const payload = {
        ...this.buildScenarioPayload({
          ...(updates as any),
          id,
        } as EnhancedScenario),
      };
      const response = await this.patch<any>(`/scenarios/${id}`, payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to patch scenario ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/scenarios/:id
  async deleteScenario(id: string): Promise<{ id: string }> {
    try {
      const response = await this.delete<{ id: string }>(`/scenarios/${id}`);
      const data = handleApiResponse(response);
      // Return the id to ensure it's available for the reducer
      return data || { id };
    } catch (error) {
      console.error(`Failed to delete scenario ${id}:`, error);
      throw error;
    }
  }

  // GET /api/scenarios/demo/:demoId
  async getDemoScenario(demoId: string): Promise<any> {
    try {
      const response = await this.get<any>(`/scenarios/demo/${demoId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to fetch demo scenario ${demoId}:`, error);
      throw error;
    }
  }

  // Create a full scenario on the server from a demo scenario definition
  async duplicateDemoScenario(
    demoId: string,
    newName?: string
  ): Promise<EnhancedScenario> {
    try {
      const demoScenario = await this.getDemoScenario(demoId);

      // Depending on backend implementation, demo scenario might be wrapped or plain
      const base: any = demoScenario?.content ?? demoScenario;

      const {
        id: _,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...scenarioData
      } = base || {};

      const duplicatedScenario = {
        ...scenarioData,
        name:
          newName ||
          demoScenario?.name ||
          base?.name ||
          `Demo Scenario ${demoId}`,
      } as Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'>;

      const payload = this.buildScenarioPayload(duplicatedScenario as any);
      const response = await this.post<any>('/scenarios', payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to duplicate demo scenario ${demoId}:`, error);
      throw error;
    }
  }

  // POST /api/scenarios/import
  async importScenario(
    file: File
  ): Promise<EnhancedScenario & { importAction?: 'created' | 'updated' }> {
    try {
      const response = await this.uploadFile<
        EnhancedScenario & { importAction?: 'created' | 'updated' }
      >('/scenarios/import', file);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error('Failed to import scenario:', error);
      throw error;
    }
  }

  // POST /api/scenarios/images
  async uploadScenarioImage(
    file: File
  ): Promise<{ filename: string; url: string }> {
    try {
      const response = await this.uploadFile<{ filename: string; url: string }>(
        '/scenarios/images',
        file
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to upload scenario image:', error);
      throw error;
    }
  }

  /** ویدئوی اینترو کالک‌نگار (mp4 / webm) */
  async uploadScenarioIntroVideo(
    file: File
  ): Promise<{ filename: string; url: string }> {
    try {
      const response = await this.uploadFile<{ filename: string; url: string }>(
        '/scenarios/intro-videos',
        file
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to upload scenario intro video:', error);
      throw error;
    }
  }

  async deleteScenarioIntroVideo(filename: string): Promise<void> {
    try {
      const safeFilename = filename.trim();
      if (!/^[a-f0-9]{32}\.(mp4|webm)$/i.test(safeFilename)) {
        throw new Error('Invalid scenario intro video filename');
      }
      await this.delete(
        `/scenarios/intro-videos/${encodeURIComponent(safeFilename)}`
      );
    } catch (error) {
      console.error('Failed to delete scenario intro video:', error);
      throw error;
    }
  }

  // GET /api/scenarios/:id/export
  async exportScenario(
    id: string,
    options?: ExportOptions
  ): Promise<{ url: string; filename: string }> {
    try {
      const response = await this.get<{ url: string; filename: string }>(
        `/scenarios/${id}/export`,
        options
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to export scenario ${id}:`, error);
      throw error;
    }
  }

  // Download scenario as JSON file
  async downloadScenarioAsJson(id: string, filename?: string): Promise<void> {
    try {
      const scenario = await this.getScenarioById(id);
      const jsonData = JSON.stringify(scenario, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download =
        filename || `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download scenario ${id}:`, error);
      throw error;
    }
  }

  // Search scenarios
  async searchScenarios(searchTerm: string): Promise<EnhancedScenario[]> {
    return this.getScenarios({ search: searchTerm });
  }

  // Filter scenarios by status
  async getScenariosByStatus(statuses: string[]): Promise<EnhancedScenario[]> {
    return this.getScenarios({ status: statuses });
  }

  // Get scenario statistics
  async getScenarioStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recent: number;
  }> {
    try {
      const response = await this.get<{
        total: number;
        byStatus: Record<string, number>;
        recent: number;
      }>('/scenarios/stats');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch scenario stats:', error);
      throw error;
    }
  }

  // Duplicate scenario (uses backend endpoint)
  async duplicateScenario(
    id: string,
    newName?: string
  ): Promise<EnhancedScenario> {
    try {
      const body: Record<string, any> = {};
      if (newName) body.new_name = newName;
      const response = await this.post<any>(`/scenarios/${id}/duplicate`, body);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to duplicate scenario ${id}:`, error);
      throw error;
    }
  }

  // Archive scenario
  async archiveScenario(id: string): Promise<EnhancedScenario> {
    try {
      const response = await this.post<any>(`/scenarios/${id}/archive`, {});
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to archive scenario ${id}:`, error);
      throw error;
    }
  }

  // Restore scenario
  async restoreScenario(id: string): Promise<EnhancedScenario> {
    try {
      const response = await this.post<any>(`/scenarios/${id}/restore`, {});
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to restore scenario ${id}:`, error);
      throw error;
    }
  }

  // Get audit history
  async getScenarioHistory(
    id: string,
    limit = 20,
    offset = 0
  ): Promise<ScenarioHistoryPage> {
    try {
      const response = await this.get<ScenarioHistoryPage>(
        `/scenarios/${id}/history`,
        {
          limit,
          offset,
        }
      );
      return (
        handleApiResponse(response) || {
          items: [],
          total: 0,
          limit,
          offset,
        }
      );
    } catch (error) {
      console.error(`Failed to fetch scenario history ${id}:`, error);
      throw error;
    }
  }

  // POST /api/scenarios/:id/unity-launch
  async requestUnityLaunch(id: string): Promise<Record<string, any>> {
    try {
      const response = await this.post<Record<string, any>>(
        `/scenarios/${id}/unity-launch`,
        {}
      );
      return handleApiResponse(response);
    } catch (error) {
      console.warn(`Unity launch request failed for scenario ${id}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const scenarioApiService = new ScenarioApiService();

// Export for use in Redux thunks and components
export default scenarioApiService;
