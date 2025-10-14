import { BaseApiClient, handleApiResponse } from './baseApiClient';
import type { ApiResponse } from './types';
import { mockApiServer } from './mockApiServer';
import type { Scenario } from '@/types/scenarioModels';

export class ScenarioApiService extends BaseApiClient {
  private useMockApi = (import.meta as any).env?.VITE_USE_MOCK === 'true';

  constructor() {
    // تعیین پایگاه URL - اولویت با متغیر محیطی، سپس origin والد
    const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
    let base: string;
    
    if (envBase && envBase.trim() !== '') {
      base = envBase.trim().replace(/\/+$/, '');
    } else {
      const apiPathEnv = (import.meta as any).env?.VITE_API_PATH as string | undefined;
      const apiPath = apiPathEnv && apiPathEnv.trim().length > 0 ? apiPathEnv.trim().replace(/^\/+/, '') : 'api';
      const isIframe = window.parent !== window;

      if (isIframe) {
        const parentOriginEnv = (import.meta as any).env?.VITE_PARENT_ORIGIN as string | undefined;
        const parentOrigin = parentOriginEnv && parentOriginEnv.trim().length > 0
          ? parentOriginEnv.trim()
          : (document.referrer ? new URL(document.referrer).origin : window.location.origin);
        base = `${parentOrigin.replace(/\/+$/, '')}/${apiPath}`;
      } else if (import.meta.env.DEV) {
        base = `http://127.0.0.1:8000/${apiPath}`;
      } else {
        base = `${window.location.origin.replace(/\/+$/, '')}/${apiPath}`;
      }
    }

    base = base.replace(/\/+$/, '');
    base = base.replace(/\/scenarios$/, '');
    console.log('[ScenarioApiService] Base URL:', base);
    super(base);
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
    if (apiItem && typeof apiItem === 'object' && 'content' in apiItem && apiItem.content) {
      const base = apiItem.content;
      return {
        ...base,
        id: apiItem.id ?? base.id,
        name: apiItem.name ?? base.name,
        description: apiItem.description ?? base.description,
      } as Scenario;
    }
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
    const res = await super.get<any>(`/scenarios/${id}`);
    const data = handleApiResponse(res);
    return this.mapOut(data);
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
}

export const scenarioApiService = new ScenarioApiService();


