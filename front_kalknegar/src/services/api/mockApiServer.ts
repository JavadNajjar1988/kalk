import type { 
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
import { mockScenarios, mockScenarioMetadata, delay, MOCK_API_DELAY } from './mockData';
import { nanoid } from '@/utils';

// Mock API Server for Kalknegar
export class MockApiServer {
  private scenarios: Scenario[] = [...mockScenarios];
  private scenarioMetadata: ScenarioMetadata[] = [...mockScenarioMetadata];

  // GET /api/scenarios
  async getScenarios(query?: ScenarioQuery): Promise<ApiResponse<ScenarioListResponse>> {
    await delay();
    
    let filteredMetadata = [...this.scenarioMetadata];
    
    // Apply search filter
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      filteredMetadata = filteredMetadata.filter(meta => 
        meta.name.toLowerCase().includes(searchTerm) ||
        meta.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    const sortBy = query?.sortBy || 'modified';
    const sortOrder = query?.sortOrder || 'desc';
    
    filteredMetadata.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'created':
          aValue = new Date(a.created);
          bValue = new Date(b.created);
          break;
        case 'modified':
        default:
          aValue = new Date(a.modified);
          bValue = new Date(b.modified);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const limit = query?.limit || 50;
    const offset = query?.offset || 0;
    const paginatedMetadata = filteredMetadata.slice(offset, offset + limit);
    
    return {
      success: true,
      data: {
        scenarios: paginatedMetadata,
        total: filteredMetadata.length,
        limit,
        offset,
      }
    };
  }

  // GET /api/scenarios/:id
  async getScenarioById(id: string): Promise<ApiResponse<Scenario>> {
    await delay();
    
    const scenario = this.scenarios.find(s => s.id === id);
    if (!scenario) {
      throw new Error(`Scenario with id ${id} not found`);
    }
    
    return {
      success: true,
      data: scenario
    };
  }

  // POST /api/scenarios
  async createScenario(scenarioData: Omit<Scenario, 'id' | 'meta'>): Promise<ApiResponse<Scenario>> {
    await delay();
    
    const newScenario: Scenario = {
      ...scenarioData,
      id: nanoid(),
      meta: {
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
      }
    };
    
    this.scenarios.push(newScenario);
    this.scenarioMetadata.push({
      id: newScenario.id,
      name: newScenario.name,
      description: newScenario.description || '',
      created: newScenario.meta!.createdDate,
      modified: newScenario.meta!.lastModifiedDate,
      size: JSON.stringify(newScenario).length,
      version: newScenario.version,
    });
    
    return {
      success: true,
      data: newScenario
    };
  }

  // PUT /api/scenarios/:id
  async updateScenario(id: string, updates: Partial<Scenario>): Promise<ApiResponse<Scenario>> {
    await delay();
    
    const scenarioIndex = this.scenarios.findIndex(s => s.id === id);
    if (scenarioIndex === -1) {
      throw new Error(`Scenario with id ${id} not found`);
    }
    
    const updatedScenario: Scenario = {
      ...this.scenarios[scenarioIndex],
      ...updates,
      meta: {
        ...this.scenarios[scenarioIndex].meta,
        lastModifiedDate: new Date().toISOString(),
      }
    };
    
    this.scenarios[scenarioIndex] = updatedScenario;
    
    // Update metadata
    const metadataIndex = this.scenarioMetadata.findIndex(m => m.id === id);
    if (metadataIndex !== -1) {
      this.scenarioMetadata[metadataIndex] = {
        ...this.scenarioMetadata[metadataIndex],
        name: updatedScenario.name,
        description: updatedScenario.description || '',
        modified: updatedScenario.meta!.lastModifiedDate,
        size: JSON.stringify(updatedScenario).length,
        version: updatedScenario.version,
      };
    }
    
    return {
      success: true,
      data: updatedScenario
    };
  }

  // DELETE /api/scenarios/:id
  async deleteScenario(id: string): Promise<ApiResponse<{ id: string }>> {
    await delay();
    
    const scenarioIndex = this.scenarios.findIndex(s => s.id === id);
    if (scenarioIndex === -1) {
      throw new Error(`Scenario with id ${id} not found`);
    }
    
    this.scenarios.splice(scenarioIndex, 1);
    
    // Remove metadata
    const metadataIndex = this.scenarioMetadata.findIndex(m => m.id === id);
    if (metadataIndex !== -1) {
      this.scenarioMetadata.splice(metadataIndex, 1);
    }
    
    return {
      success: true,
      data: { id }
    };
  }

  // POST /api/scenarios/import
  async importScenario(file: File): Promise<ApiResponse<ImportResult>> {
    await delay();
    
    try {
      const text = await file.text();
      const scenarioData = JSON.parse(text);
      
      // Validate scenario data
      if (!scenarioData.type || scenarioData.type !== 'ORBAT-mapper') {
        throw new Error('Invalid scenario file format');
      }
      
      const newScenario: Scenario = {
        ...scenarioData,
        id: nanoid(),
        meta: {
          createdDate: new Date().toISOString(),
          lastModifiedDate: new Date().toISOString(),
        }
      };
      
      this.scenarios.push(newScenario);
      this.scenarioMetadata.push({
        id: newScenario.id,
        name: newScenario.name,
        description: newScenario.description || '',
        created: newScenario.meta!.createdDate,
        modified: newScenario.meta!.lastModifiedDate,
        size: JSON.stringify(newScenario).length,
        version: newScenario.version,
      });
      
      return {
        success: true,
        data: {
          scenario: newScenario,
          warnings: [],
          errors: []
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          scenario: null as any,
          warnings: [],
          errors: [error instanceof Error ? error.message : 'Import failed']
        }
      };
    }
  }

  // GET /api/scenarios/:id/export
  async exportScenario(id: string, options?: ExportOptions): Promise<ApiResponse<ExportResult>> {
    await delay();
    
    const scenario = this.scenarios.find(s => s.id === id);
    if (!scenario) {
      throw new Error(`Scenario with id ${id} not found`);
    }
    
    const format = options?.format || 'json';
    const filename = `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
    
    // In a real implementation, this would generate the file
    // For mock, we just return the download info
    return {
      success: true,
      data: {
        url: `/api/scenarios/${id}/download?format=${format}`,
        filename,
        size: JSON.stringify(scenario).length
      }
    };
  }

  // POST /api/upload
  async uploadFile(file: File): Promise<ApiResponse<FileUploadResponse>> {
    await delay();
    
    const fileId = nanoid();
    const filename = file.name;
    
    return {
      success: true,
      data: {
        id: fileId,
        filename,
        size: file.size,
        url: `/api/files/${fileId}`
      }
    };
  }

  // GET /api/scenarios/stats
  async getScenarioStats(): Promise<ApiResponse<{
    total: number;
    byVersion: Record<string, number>;
    totalSize: number;
  }>> {
    await delay();
    
    const byVersion: Record<string, number> = {};
    let totalSize = 0;
    
    this.scenarios.forEach(scenario => {
      byVersion[scenario.version] = (byVersion[scenario.version] || 0) + 1;
      totalSize += JSON.stringify(scenario).length;
    });
    
    return {
      success: true,
      data: {
        total: this.scenarios.length,
        byVersion,
        totalSize
      }
    };
  }
}

// Singleton instance
export const mockApiServer = new MockApiServer();

// Helper function to determine if we should use mock API
export function shouldUseMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === 'true' || 
         import.meta.env.VITE_API_URL === undefined ||
         import.meta.env.VITE_OFFLINE_MODE === 'true';
}
