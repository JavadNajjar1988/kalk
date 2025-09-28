import { ApiResponse, ScenarioQuery, PaginatedResponse } from './types';
import { EnhancedScenario, ScenarioStatus } from '@/types';
import { 
  mockStorage, 
  simulateApiDelay, 
  shouldSimulateError, 
  getRandomError,
  demoScenariosData 
} from './mockData';

// Mock API Server class
export class MockApiServer {
  private isEnabled: boolean;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  // Helper to create API response
  private createResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  // Helper to create error response
  private createErrorResponse(message: string, code?: string): ApiResponse<never> {
    return {
      success: false,
      message,
      errors: [message],
      timestamp: new Date().toISOString(),
    };
  }

  // Simulate API processing
  private async processRequest<T>(operation: () => T): Promise<ApiResponse<T>> {
    if (!this.isEnabled) {
      throw new Error('Mock API server is disabled');
    }

    // Simulate network delay
    await simulateApiDelay();

    // Simulate occasional errors for testing
    if (shouldSimulateError()) {
      const error = getRandomError();
      throw new Error(`${error.code}: ${error.message}`);
    }

    try {
      const result = operation();
      return this.createResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResponse(message);
    }
  }

  // API Endpoints

  // GET /api/scenarios
  async getScenarios(query?: ScenarioQuery): Promise<ApiResponse<EnhancedScenario[]>> {
    return this.processRequest(() => {
      let scenarios = mockStorage.getAllScenarios();

      // Apply filters
      if (query?.search) {
        scenarios = mockStorage.searchScenarios(query.search);
      }

      if (query?.status && query.status.length > 0) {
        scenarios = scenarios.filter(s => query.status!.includes(s.status));
      }

      if (query?.startDate) {
        scenarios = scenarios.filter(s => 
          new Date(s.startTime) >= new Date(query.startDate!)
        );
      }

      if (query?.endDate) {
        scenarios = scenarios.filter(s => 
          new Date(s.startTime) <= new Date(query.endDate!)
        );
      }

      // Apply sorting
      if (query?.sortBy) {
        scenarios.sort((a, b) => {
          const aValue = a[query.sortBy!];
          const bValue = b[query.sortBy!];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;

          return query.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination (for future use)
      if (query?.page && query?.limit) {
        const start = (query.page - 1) * query.limit;
        const end = start + query.limit;
        scenarios = scenarios.slice(start, end);
      }

      return scenarios;
    });
  }

  // GET /api/scenarios/:id
  async getScenarioById(id: string): Promise<ApiResponse<EnhancedScenario>> {
    return this.processRequest(() => {
      console.log(`Mock API: Fetching scenario with ID: ${id}`);
      const scenario = mockStorage.getScenarioById(id);
      if (!scenario) {
        console.error(`Mock API: Scenario with id "${id}" not found`);
        throw new Error(`Scenario with id "${id}" not found`);
      }
      console.log(`Mock API: Successfully found scenario: ${scenario.name}`);
      return scenario;
    });
  }

  // POST /api/scenarios
  async createScenario(scenarioData: Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<EnhancedScenario>> {
    return this.processRequest(() => {
      // Validate required fields
      if (!scenarioData.name?.trim()) {
        throw new Error('Scenario name is required');
      }

      if (!scenarioData.startTime) {
        throw new Error('Start time is required');
      }

      // Set defaults for missing fields
      const processedData: Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'> = {
        ...scenarioData,
        status: scenarioData.status || ScenarioStatus.DRAFT,
        units: scenarioData.units || [],
        layers: scenarioData.layers || [],
        events: scenarioData.events || [],
        objectives: scenarioData.objectives || [],
        metadata: scenarioData.metadata || {},
        phases: scenarioData.phases || [],
        environmentalConditions: scenarioData.environmentalConditions || [],
        executionStatus: scenarioData.executionStatus || 'not_started' as any,
      };

      const newScenario = mockStorage.createScenario(processedData);
      return newScenario;
    });
  }

  // PUT /api/scenarios/:id
  async updateScenario(id: string, updates: Partial<EnhancedScenario>): Promise<ApiResponse<EnhancedScenario>> {
    return this.processRequest(() => {
      const updatedScenario = mockStorage.updateScenario(id, updates);
      if (!updatedScenario) {
        throw new Error(`Scenario with id "${id}" not found`);
      }
      return updatedScenario;
    });
  }

  // DELETE /api/scenarios/:id
  async deleteScenario(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.processRequest(() => {
      const deleted = mockStorage.deleteScenario(id);
      if (!deleted) {
        throw new Error(`Scenario with id "${id}" not found`);
      }
      return { id };
    });
  }

  // GET /api/scenarios/demo/:demoId
  async getDemoScenario(demoId: string): Promise<ApiResponse<any>> {
    return this.processRequest(() => {
      const demoScenario = demoScenariosData.find(demo => demo.id === demoId);
      if (!demoScenario) {
        throw new Error(`Demo scenario with id "${demoId}" not found`);
      }
      return demoScenario;
    });
  }

  // POST /api/scenarios/import
  async importScenario(file: File): Promise<ApiResponse<EnhancedScenario>> {
    // Handle async file processing separately
    try {
      await simulateApiDelay();
      
      if (shouldSimulateError()) {
        const error = getRandomError();
        throw new Error(`${error.code}: ${error.message}`);
      }
      
      const text = await file.text();
      const scenarioData = JSON.parse(text) as EnhancedScenario;
      
      // Remove ID to create new scenario
      const { id, createdAt, updatedAt, ...dataWithoutId } = scenarioData;
      
      const newScenario = mockStorage.createScenario(dataWithoutId);
      return this.createResponse(newScenario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      return this.createErrorResponse(message);
    }
  }

  // GET /api/scenarios/:id/export
  async exportScenario(id: string): Promise<ApiResponse<{ url: string; filename: string }>> {
    return this.processRequest(() => {
      const scenario = mockStorage.getScenarioById(id);
      if (!scenario) {
        throw new Error(`Scenario with id "${id}" not found`);
      }

      // In a real implementation, this would create a downloadable file
      const filename = `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const blob = new Blob([JSON.stringify(scenario, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);

      return { url, filename };
    });
  }

  // GET /api/scenarios/stats
  async getScenarioStats(): Promise<ApiResponse<{
    total: number;
    byStatus: Record<ScenarioStatus, number>;
    recent: number;
  }>> {
    return this.processRequest(() => {
      const scenarios = mockStorage.getAllScenarios();
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const byStatus = scenarios.reduce((acc, scenario) => {
        acc[scenario.status] = (acc[scenario.status] || 0) + 1;
        return acc;
      }, {} as Record<ScenarioStatus, number>);

      const recent = scenarios.filter(s => 
        new Date(s.updatedAt) > oneWeekAgo
      ).length;

      return {
        total: scenarios.length,
        byStatus,
        recent,
      };
    });
  }
}

// Singleton instance
export const mockApiServer = new MockApiServer();

// Helper to check if we should use mock API
export const shouldUseMockApi = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.REACT_APP_USE_MOCK_API === 'true';
};