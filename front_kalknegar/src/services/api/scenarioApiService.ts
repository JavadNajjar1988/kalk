import { BaseApiClient, handleApiResponse } from './baseApiClient';
import type { ApiResponse } from './types';
import { mockApiServer } from './mockApiServer';
import type { Scenario } from '@/types/scenarioModels';

export class ScenarioApiService extends BaseApiClient {
  private useMockApi = (import.meta as any).env?.VITE_USE_MOCK === 'true';

  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  private authHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async list(): Promise<{ id: string; name: string; description?: string; created: Date; modified: Date; image?: string }[]> {
    if (this.useMockApi) {
      const res = await mockApiServer.getScenarios();
      return handleApiResponse(res);
    }
    const res = await this.get('/scenarios');
    return handleApiResponse(res as ApiResponse<any>);
  }

  async get(id: string): Promise<Scenario> {
    if (this.useMockApi) {
      const res = await mockApiServer.getScenarioById(id);
      return handleApiResponse(res);
    }
    const res = await super.get<Scenario>(`/scenarios/${id}`);
    return handleApiResponse(res);
  }

  async create(scn: Scenario): Promise<Scenario> {
    if (this.useMockApi) {
      const res = await mockApiServer.createScenario(scn);
      return handleApiResponse(res);
    }
    const res = await super.post<Scenario>('/scenarios', scn);
    return handleApiResponse(res);
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
    const res = await super.put<Scenario>(`/scenarios/${id}`, updates);
    return handleApiResponse(res);
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


