import type { ApiResponse, ScenarioListItem } from './types';
import type { Scenario } from '@/types/scenarioModels';
import { useIndexedDb } from '@/scenariostore/localdb';

function createResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message, timestamp: new Date().toISOString() };
}

function createError<T = never>(message: string): ApiResponse<T> {
  return { success: false, message, errors: [message], timestamp: new Date().toISOString() };
}

export class MockApiServer {
  // GET /api/scenarios (list metadata)
  async getScenarios(): Promise<ApiResponse<ScenarioListItem[]>> {
    try {
      const { listScenarios } = await useIndexedDb();
      const items = await listScenarios();
      return createResponse(items);
    } catch (e: any) {
      return createError(e?.message || 'Failed to list scenarios');
    }
  }

  // GET /api/scenarios/:id
  async getScenarioById(id: string): Promise<ApiResponse<Scenario>> {
    try {
      const { loadScenario } = await useIndexedDb();
      const scn = await loadScenario(id);
      if (!scn) return createError(`Scenario ${id} not found`);
      return createResponse(scn);
    } catch (e: any) {
      return createError(e?.message || 'Failed to load scenario');
    }
  }

  // POST /api/scenarios
  async createScenario(scenario: Scenario): Promise<ApiResponse<Scenario>> {
    try {
      const { addScenario, loadScenario } = await useIndexedDb();
      const id = await addScenario(scenario, scenario.id);
      const scn = await loadScenario(id);
      return createResponse(scn as Scenario);
    } catch (e: any) {
      return createError(e?.message || 'Failed to create scenario');
    }
  }

  // PUT /api/scenarios/:id
  async updateScenario(id: string, updates: Partial<Scenario>): Promise<ApiResponse<Scenario>> {
    try {
      const { loadScenario, putScenario } = await useIndexedDb();
      const current = await loadScenario(id);
      if (!current) return createError(`Scenario ${id} not found`);
      const updated = { ...current, ...updates } as Scenario;
      await putScenario(updated);
      return createResponse(updated);
    } catch (e: any) {
      return createError(e?.message || 'Failed to update scenario');
    }
  }

  // DELETE /api/scenarios/:id
  async deleteScenario(id: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const { deleteScenario } = await useIndexedDb();
      await deleteScenario(id);
      return createResponse({ id });
    } catch (e: any) {
      return createError(e?.message || 'Failed to delete scenario');
    }
  }
}

export const mockApiServer = new MockApiServer();



