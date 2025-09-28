import { BaseApiClient, handleApiResponse, ApiClientError } from './baseApiClient';
import { 
  ApiResponse, 
  ScenarioQuery, 
  ScenarioListResponse, 
  ScenarioMetadata,
  FileUploadResponse,
  ExportOptions,
  ExportResult,
  ImportResult
} from './types';
import type { Scenario } from '@/types/scenarioModels';
import { mockApiServer, shouldUseMockApi } from './mockApiServer';

export class ScenarioApiService extends BaseApiClient {
  private useMockApi: boolean;

  constructor() {
    super();
    this.useMockApi = shouldUseMockApi();
  }

  // GET /api/scenarios
  async getScenarios(query?: ScenarioQuery): Promise<ScenarioListResponse> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.getScenarios(query);
        return handleApiResponse(response);
      }

      const response = await this.get<ScenarioListResponse>('/scenarios', query);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
      throw error;
    }
  }

  // GET /api/scenarios/:id
  async getScenarioById(id: string): Promise<Scenario> {
    try {
      console.log(`ScenarioApiService: Fetching scenario ${id}, useMockApi: ${this.useMockApi}`);
      
      if (this.useMockApi) {
        const response = await mockApiServer.getScenarioById(id);
        return handleApiResponse(response);
      }

      const response = await this.get<Scenario>(`/scenarios/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to fetch scenario ${id}:`, error);
      throw error;
    }
  }

  // POST /api/scenarios
  async createScenario(scenarioData: Omit<Scenario, 'id' | 'meta'>): Promise<Scenario> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.createScenario(scenarioData);
        return handleApiResponse(response);
      }

      const response = await this.post<Scenario>('/scenarios', scenarioData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to create scenario:', error);
      throw error;
    }
  }

  // PUT /api/scenarios/:id
  async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.updateScenario(id, updates);
        return handleApiResponse(response);
      }

      const response = await this.put<Scenario>(`/scenarios/${id}`, updates);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to update scenario ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/scenarios/:id
  async deleteScenario(id: string): Promise<void> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.deleteScenario(id);
        handleApiResponse(response);
        return;
      }

      const response = await this.delete<{ id: string }>(`/scenarios/${id}`);
      handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to delete scenario ${id}:`, error);
      throw error;
    }
  }

  // POST /api/scenarios/import
  async importScenario(file: File): Promise<ImportResult> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.importScenario(file);
        return handleApiResponse(response);
      }

      const response = await this.uploadFile<ImportResult>('/scenarios/import', file);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to import scenario:', error);
      throw error;
    }
  }

  // GET /api/scenarios/:id/export
  async exportScenario(id: string, options?: ExportOptions): Promise<ExportResult> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.exportScenario(id, options);
        return handleApiResponse(response);
      }

      const response = await this.get<ExportResult>(
        `/scenarios/${id}/export`,
        options
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to export scenario ${id}:`, error);
      throw error;
    }
  }

  // POST /api/upload
  async uploadFile(file: File): Promise<FileUploadResponse> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.uploadFile(file);
        return handleApiResponse(response);
      }

      const response = await this.uploadFile<FileUploadResponse>('/upload', file);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // GET /api/scenarios/stats
  async getScenarioStats(): Promise<{
    total: number;
    byVersion: Record<string, number>;
    totalSize: number;
  }> {
    try {
      if (this.useMockApi) {
        const response = await mockApiServer.getScenarioStats();
        return handleApiResponse(response);
      }

      const response = await this.get<{
        total: number;
        byVersion: Record<string, number>;
        totalSize: number;
      }>('/scenarios/stats');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch scenario stats:', error);
      throw error;
    }
  }

  // Duplicate scenario
  async duplicateScenario(id: string, newName?: string): Promise<Scenario> {
    try {
      const originalScenario = await this.getScenarioById(id);
      const { id: _, meta, ...scenarioData } = originalScenario;
      
      const duplicatedScenario = {
        ...scenarioData,
        name: newName || `${originalScenario.name} (Copy)`,
      };

      return this.createScenario(duplicatedScenario);
    } catch (error) {
      console.error(`Failed to duplicate scenario ${id}:`, error);
      throw error;
    }
  }

  // Search scenarios
  async searchScenarios(searchTerm: string): Promise<ScenarioListResponse> {
    return this.getScenarios({ search: searchTerm });
  }
}

// Singleton instance
export const scenarioApiService = new ScenarioApiService();

// Export for use in components and stores
export default scenarioApiService;
