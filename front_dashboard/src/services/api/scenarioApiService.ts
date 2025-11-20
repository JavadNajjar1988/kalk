import { BaseApiClient, handleApiResponse, ApiClientError } from './baseApiClient';
import { ApiResponse, ScenarioQuery, ExportOptions, FileUploadResponse } from './types';
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

// Transform form data to scenario data
function transformFormToScenario(formData: ScenarioFormData): Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: formData.name,
    description: formData.description || '',
    startTime: formData.startTime || new Date().toISOString(),
    endTime: formData.endTime,
    status: 'draft' as any,
    units: [],
    layers: [],
    events: [],
    objectives: formData.objectives || [],
    metadata: {},
    phases: [],
    environmentalConditions: [],
    executionStatus: 'not_started' as any,
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
    const image = (data as any)?.image;
    return { name, description, image, content: data } as any;
  }

  private mapScenarioOutToEnhanced(apiItem: any): EnhancedScenario {
    if (apiItem && typeof apiItem === 'object' && 'content' in apiItem && apiItem.content) {
      const base = apiItem.content;
      return {
        ...base,
        id: apiItem.id ?? base.id,
        name: apiItem.name ?? base.name,
        description: apiItem.description ?? base.description,
      } as EnhancedScenario;
    }
    return apiItem as EnhancedScenario;
  }


  // GET /api/scenarios
  async getScenarios(query?: ScenarioQuery): Promise<EnhancedScenario[]> {
    try {
      const response = await this.get<any[]>('/scenarios', query);
      const data = handleApiResponse(response);
      return (Array.isArray(data) ? data : []).map((i) => this.mapScenarioOutToEnhanced(i));
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
  async updateScenario(id: string, updates: Partial<EnhancedScenario>): Promise<EnhancedScenario> {
    try {
      const payload = this.buildScenarioPayload({ ...(updates as any), id } as EnhancedScenario);
      const response = await this.put<any>(`/scenarios/${id}`, payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to update scenario ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/scenarios/:id (for partial updates)
  async patchScenario(id: string, updates: Partial<EnhancedScenario>): Promise<EnhancedScenario> {
    try {
      const payload = { ...this.buildScenarioPayload({ ...(updates as any), id } as EnhancedScenario) };
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

  // POST /api/scenarios/import
  async importScenario(file: File): Promise<EnhancedScenario> {
    try {
      const response = await this.uploadFile<EnhancedScenario>('/scenarios/import', file);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to import scenario:', error);
      throw error;
    }
  }

  // GET /api/scenarios/:id/export
  async exportScenario(id: string, options?: ExportOptions): Promise<{ url: string; filename: string }> {
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
      link.download = filename || `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
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

  // Duplicate scenario
  async duplicateScenario(id: string, newName?: string): Promise<EnhancedScenario> {
    try {
      const originalScenario = await this.getScenarioById(id);
      const { id: _, createdAt, updatedAt, ...scenarioData } = originalScenario;
      
      // ساخت سناریوی کپی شده با تمام محتوا (بدون id, createdAt, updatedAt)
      const duplicatedScenario = {
        ...scenarioData,
        name: newName || `${originalScenario.name} (Copy)`,
      } as Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'>;

      // استفاده مستقیم از buildScenarioPayload برای حفظ تمام محتوا
      const payload = this.buildScenarioPayload(duplicatedScenario as any);
      const response = await this.post<any>('/scenarios', payload);
      const data = handleApiResponse(response);
      return this.mapScenarioOutToEnhanced(data);
    } catch (error) {
      console.error(`Failed to duplicate scenario ${id}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const scenarioApiService = new ScenarioApiService();

// Export for use in Redux thunks and components
export default scenarioApiService;