import { ref, computed } from 'vue';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import type { ScenarioListResponse, ScenarioQuery } from '@/services/api/types';
import type { Scenario } from '@/types/scenarioModels';

// Composable for scenario API operations
export function useScenarioApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Get scenarios list
  const getScenarios = async (query?: ScenarioQuery): Promise<ScenarioListResponse | null> => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.getScenarios(query);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch scenarios';
      console.error('Error fetching scenarios:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get single scenario
  const getScenario = async (id: string): Promise<Scenario | null> => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.getScenarioById(id);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch scenario';
      console.error('Error fetching scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create scenario
  const createScenario = async (scenarioData: Omit<Scenario, 'id' | 'meta'>): Promise<Scenario | null> => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.createScenario(scenarioData);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create scenario';
      console.error('Error creating scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update scenario
  const updateScenario = async (id: string, updates: Partial<Scenario>): Promise<Scenario | null> => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.updateScenario(id, updates);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update scenario';
      console.error('Error updating scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Delete scenario
  const deleteScenario = async (id: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    
    try {
      await scenarioApiService.deleteScenario(id);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete scenario';
      console.error('Error deleting scenario:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Import scenario
  const importScenario = async (file: File) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.importScenario(file);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import scenario';
      console.error('Error importing scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Export scenario
  const exportScenario = async (id: string, options?: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.exportScenario(id, options);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export scenario';
      console.error('Error exporting scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Duplicate scenario
  const duplicateScenario = async (id: string, newName?: string): Promise<Scenario | null> => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.duplicateScenario(id, newName);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate scenario';
      console.error('Error duplicating scenario:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Search scenarios
  const searchScenarios = async (searchTerm: string): Promise<ScenarioListResponse | null> => {
    return getScenarios({ search: searchTerm });
  };

  // Get scenario stats
  const getStats = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await scenarioApiService.getScenarioStats();
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch stats';
      console.error('Error fetching stats:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Actions
    getScenarios,
    getScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    importScenario,
    exportScenario,
    duplicateScenario,
    searchScenarios,
    getStats,
  };
}
