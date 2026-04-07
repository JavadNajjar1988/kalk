import { BaseApiClient, handleApiResponse } from './baseApiClient';
import type { ApiResponse } from './types';
import { mockApiServer } from './mockApiServer';
import type { Scenario } from '@/types/scenarioModels';

export interface ScenarioImageUploadResponse {
  filename: string;
  url: string;
}

/** پاسخ API وضعیت اینترو سناریو (کالک‌نگار) */
export interface ScenarioIntroStatus {
  should_show_intro: boolean;
  intro_replay_available: boolean;
  intro_video_url: string | null;
  intro_title: string | null;
  intro_summary: string | null;
}

export class ScenarioApiService extends BaseApiClient {
  private useMockApi = (import.meta as any).env?.VITE_USE_MOCK === 'true';

  constructor() {
    // تعیین پایگاه URL - اولویت با متغیر محیطی، سپس origin والد
    const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
    let base: string;
    
    const isDev = import.meta.env.DEV;

    if (envBase && envBase.trim() !== '') {
      base = envBase.trim().replace(/\/+$/, '');
    } else {
      const apiPathEnv = (import.meta as any).env?.VITE_API_PATH as string | undefined;
      const apiPath = apiPathEnv && apiPathEnv.trim().length > 0 ? apiPathEnv.trim().replace(/^\/+/, '') : 'api';
      if (isDev) {
        const devHost = (import.meta as any).env?.VITE_API_DEV_HOST as string | undefined;
        const defaultDevHost =
          typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5180';
        base = `${(devHost && devHost.trim()) || defaultDevHost}/${apiPath}`;
      } else {
        const isIframe = window.parent !== window;
        if (isIframe) {
          const parentOriginEnv = (import.meta as any).env?.VITE_PARENT_ORIGIN as string | undefined;
          const parentOrigin = parentOriginEnv && parentOriginEnv.trim().length > 0
            ? parentOriginEnv.trim()
            : (document.referrer ? new URL(document.referrer).origin : window.location.origin);
          base = `${parentOrigin.replace(/\/+$/, '')}/${apiPath}`;
        } else {
          base = `${window.location.origin.replace(/\/+$/, '')}/${apiPath}`;
        }
      }
    }

    base = base.replace(/\/+$/, '');
    base = base.replace(/\/scenarios$/, '');
    console.log('[ScenarioApiService] Base URL:', base);

    // ابتدا سازنده پایه را صدا بزنیم، بعد از آن به this دسترسی داشته باشیم
    super(base);

    // اگر از طریق داشبورد (integration=react) وارد شده‌ایم، همیشه از API واقعی استفاده کن
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('integration') === 'react') {
        this.useMockApi = false;
        console.log('[ScenarioApiService] integration=react detected → disabling mock API');
      }
    } catch (e) {
      console.warn('[ScenarioApiService] Failed to inspect URL params for integration mode', e);
    }
  }

  private authHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildPayload(scn: Scenario) {
    const name = (scn as any)?.name || '';
    const description = (scn as any)?.description || '';
    const image = (scn as any)?.image;
    return { name, description, image, content: scn } as any;
  }

  private mapOut(apiItem: any): Scenario {
    console.log('[ScenarioApiService.mapOut] Input:', apiItem);
    
    // اگر apiItem خودش یک Scenario است (بدون wrapper)
    if (apiItem && typeof apiItem === 'object' && apiItem.type === 'ORBAT-mapper') {
      console.log('[ScenarioApiService.mapOut] Direct scenario object');
      return apiItem as Scenario;
    }
    
    // اگر apiItem دارای content است
    if (apiItem && typeof apiItem === 'object' && 'content' in apiItem && apiItem.content) {
      const base = apiItem.content;
      console.log('[ScenarioApiService.mapOut] Extracting from content:', base);
      
      // اگر content خودش یک Scenario است
      if (base && typeof base === 'object' && base.type === 'ORBAT-mapper') {
        const mapped = {
          ...base,
          id: apiItem.id ?? base.id,
          name: apiItem.name ?? base.name,
          description: apiItem.description ?? base.description,
          // اضافه کردن image از apiItem یا base
          image: apiItem.image ?? base.image,
        } as Scenario;
        console.log('[ScenarioApiService.mapOut] Mapped scenario:', mapped);
        return mapped;
      }
      
      // اگر content یک object است اما type ندارد، سعی می‌کنیم آن را به عنوان Scenario در نظر بگیریم
      console.warn('[ScenarioApiService.mapOut] Content does not have type, assuming ORBAT-mapper');
      const mapped = {
        ...base,
        type: 'ORBAT-mapper',
        id: apiItem.id ?? base.id,
        name: apiItem.name ?? base.name,
        description: apiItem.description ?? base.description,
        image: apiItem.image ?? base.image,
      } as Scenario;
      console.log('[ScenarioApiService.mapOut] Mapped scenario (with type added):', mapped);
      return mapped;
    }
    
    console.warn('[ScenarioApiService.mapOut] No content found, returning as-is');
    return apiItem as Scenario;
  }

  async list(): Promise<{ id: string; name: string; description?: string; created: Date; modified: Date; image?: string }[]> {
    if (this.useMockApi) {
      const res = await mockApiServer.getScenarios();
      return handleApiResponse(res);
    }
    const res = await this.get<any[]>('/scenarios');
    const data = handleApiResponse(res);
    return (Array.isArray(data) ? data : []).map((i: any) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      created: i.created,
      modified: i.modified,
      image: i.image,
    }));
  }

  async getById(id: string): Promise<Scenario> {
    if (this.useMockApi) {
      const res = await mockApiServer.getScenarioById(id);
      return handleApiResponse(res);
    }
    console.log('[ScenarioApiService] Fetching scenario:', id);
    const res = await super.get<any>(`/scenarios/${id}`);
    console.log('[ScenarioApiService] API response:', res);
    const data = handleApiResponse(res);
    console.log('[ScenarioApiService] Parsed data:', data);
    const mapped = this.mapOut(data);
    console.log('[ScenarioApiService] Mapped scenario:', mapped);
    return mapped;
  }

  async create(scn: Scenario): Promise<Scenario> {
    if (this.useMockApi) {
      const res = await mockApiServer.createScenario(scn);
      return handleApiResponse(res);
    }
    const payload = this.buildPayload(scn);
    const res = await super.post<any>('/scenarios', payload);
    const data = handleApiResponse(res);
    return this.mapOut(data);
  }

  async save(scn: Scenario): Promise<Scenario> {
    // Try update; if not found, create
    try {
      return await this.update(scn.id, scn);
    } catch (e) {
      return await this.create(scn);
    }
  }

  async update(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    if (this.useMockApi) {
      const res = await mockApiServer.updateScenario(id, updates);
      return handleApiResponse(res);
    }
    const payload = this.buildPayload({ ...(updates as any), id } as Scenario);
    const res = await super.put<any>(`/scenarios/${id}`, payload);
    const data = handleApiResponse(res);
    return this.mapOut(data);
  }

  async remove(id: string): Promise<{ id: string }> {
    if (this.useMockApi) {
      const res = await mockApiServer.deleteScenario(id);
      return handleApiResponse(res);
    }
    const res = await super.delete<{ id: string }>(`/scenarios/${id}`);
    return handleApiResponse(res);
  }

  async uploadImage(file: File): Promise<ScenarioImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.postForm<ScenarioImageUploadResponse>('/scenarios/images', formData);
    return handleApiResponse(res);
  }

  async getIntroStatus(scenarioId: string): Promise<ScenarioIntroStatus> {
    if (this.useMockApi) {
      return {
        should_show_intro: false,
        intro_replay_available: false,
        intro_video_url: null,
        intro_title: null,
        intro_summary: null,
      };
    }
    const res = await this.get<ScenarioIntroStatus>(
      `/scenarios/${encodeURIComponent(scenarioId)}/intro-status`,
    );
    return handleApiResponse(res);
  }

  async recordIntroView(scenarioId: string, neverShowAgain: boolean): Promise<void> {
    if (this.useMockApi) {
      return;
    }
    const res = await this.post<{ recorded?: boolean }>(
      `/scenarios/${encodeURIComponent(scenarioId)}/intro-view`,
      { never_show_again: neverShowAgain },
    );
    handleApiResponse(res);
  }
}

export const scenarioApiService = new ScenarioApiService();


