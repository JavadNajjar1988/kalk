import { useCallback, useMemo } from 'react';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  OrbatCommandType, 
  CommandMessage, 
  CommandResponse 
} from '../types/orbat-bridge';
import type { 
  OrbatScenario, 
  OrbatUnit, 
  OrbatEvent, 
  Position,
  MapViewState 
} from '../types/orbat-data';

interface UseOrbatCommandsOptions {
  timeout?: number;
  retryAttempts?: number;
  onError?: (error: Error) => void;
  onSuccess?: (response: CommandResponse) => void;
}

interface UseOrbatCommandsResult {
  // Basic commands
  executeCommand: <T = any>(command: OrbatCommandType, data?: any) => Promise<T>;
  
  // Scenario commands
  loadScenario: (scenarioId: string) => Promise<OrbatScenario>;
  createScenario: (scenario: Omit<OrbatScenario, 'id'>) => Promise<OrbatScenario>;
  updateScenario: (id: string, updates: Partial<OrbatScenario>) => Promise<OrbatScenario>;
  deleteScenario: (id: string) => Promise<void>;
  duplicateScenario: (id: string, newName: string) => Promise<OrbatScenario>;
  
  // Unit commands
  addUnit: (unit: Omit<OrbatUnit, 'id'>) => Promise<OrbatUnit>;
  updateUnit: (id: string, updates: Partial<OrbatUnit>) => Promise<OrbatUnit>;
  deleteUnit: (id: string) => Promise<void>;
  moveUnit: (id: string, position: Position) => Promise<OrbatUnit>;
  updateUnitSymbol: (id: string, sidc: string) => Promise<OrbatUnit>;
  
  // Event commands
  addEvent: (event: Omit<OrbatEvent, 'id'>) => Promise<OrbatEvent>;
  updateEvent: (id: string, updates: Partial<OrbatEvent>) => Promise<OrbatEvent>;
  deleteEvent: (id: string) => Promise<void>;
  triggerEvent: (id: string) => Promise<void>;
  
  // View commands
  setMapView: (viewState: MapViewState) => Promise<void>;
  zoomToUnit: (unitId: string) => Promise<void>;
  zoomToArea: (bounds: [number, number, number, number]) => Promise<void>;
  resetView: () => Promise<void>;
  
  // Display commands
  showUnits: (unitIds: string[]) => Promise<void>;
  hideUnits: (unitIds: string[]) => Promise<void>;
  highlightUnits: (unitIds: string[]) => Promise<void>;
  clearHighlight: () => Promise<void>;
  
  // Layer commands
  showLayer: (layerId: string) => Promise<void>;
  hideLayer: (layerId: string) => Promise<void>;
  toggleLayer: (layerId: string) => Promise<boolean>;
  
  // Export commands
  exportMap: (format: 'png' | 'jpg' | 'svg') => Promise<string>;
  exportData: (format: 'json' | 'xml' | 'csv') => Promise<string>;
  
  // System commands
  getSystemInfo: () => Promise<any>;
  clearCache: () => Promise<void>;
  resetSystem: () => Promise<void>;
  
  // Batch commands
  executeBatch: (commands: Array<{ command: OrbatCommandType; data?: any }>) => Promise<any[]>;
  
  // State
  isExecuting: boolean;
  lastCommand: OrbatCommandType | null;
  lastError: Error | null;
}

export const useOrbatCommands = (options: UseOrbatCommandsOptions = {}): UseOrbatCommandsResult => {
  const { commandService } = useOrbat();
  const { 
    timeout = 30000, 
    retryAttempts = 3, 
    onError, 
    onSuccess 
  } = options;

  // Basic command execution
  const executeCommand = useCallback(async <T = any>(
    command: OrbatCommandType, 
    data?: any
  ): Promise<T> => {
    if (!commandService) {
      throw new Error('Command service not available');
    }

    try {
      const response = await commandService.executeCommand(command, data, { 
        timeout, 
        retryAttempts 
      });
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Command execution failed');
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [commandService, timeout, retryAttempts, onError, onSuccess]);

  // Scenario commands
  const loadScenario = useCallback(async (scenarioId: string): Promise<OrbatScenario> => {
    return await executeCommand('LOAD_SCENARIO', { scenarioId });
  }, [executeCommand]);

  const createScenario = useCallback(async (scenario: Omit<OrbatScenario, 'id'>): Promise<OrbatScenario> => {
    return await executeCommand('CREATE_SCENARIO', scenario);
  }, [executeCommand]);

  const updateScenario = useCallback(async (id: string, updates: Partial<OrbatScenario>): Promise<OrbatScenario> => {
    return await executeCommand('UPDATE_SCENARIO', { id, updates });
  }, [executeCommand]);

  const deleteScenario = useCallback(async (id: string): Promise<void> => {
    await executeCommand('DELETE_SCENARIO', { id });
  }, [executeCommand]);

  const duplicateScenario = useCallback(async (id: string, newName: string): Promise<OrbatScenario> => {
    return await executeCommand('DUPLICATE_SCENARIO', { id, newName });
  }, [executeCommand]);

  // Unit commands
  const addUnit = useCallback(async (unit: Omit<OrbatUnit, 'id'>): Promise<OrbatUnit> => {
    return await executeCommand('ADD_UNIT', unit);
  }, [executeCommand]);

  const updateUnit = useCallback(async (id: string, updates: Partial<OrbatUnit>): Promise<OrbatUnit> => {
    return await executeCommand('UPDATE_UNIT', { id, updates });
  }, [executeCommand]);

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    await executeCommand('DELETE_UNIT', { id });
  }, [executeCommand]);

  const moveUnit = useCallback(async (id: string, position: Position): Promise<OrbatUnit> => {
    return await executeCommand('MOVE_UNIT', { id, position });
  }, [executeCommand]);

  const updateUnitSymbol = useCallback(async (id: string, sidc: string): Promise<OrbatUnit> => {
    return await executeCommand('UPDATE_UNIT_SYMBOL', { id, sidc });
  }, [executeCommand]);

  // Event commands
  const addEvent = useCallback(async (event: Omit<OrbatEvent, 'id'>): Promise<OrbatEvent> => {
    return await executeCommand('ADD_EVENT', event);
  }, [executeCommand]);

  const updateEvent = useCallback(async (id: string, updates: Partial<OrbatEvent>): Promise<OrbatEvent> => {
    return await executeCommand('UPDATE_EVENT', { id, updates });
  }, [executeCommand]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await executeCommand('DELETE_EVENT', { id });
  }, [executeCommand]);

  const triggerEvent = useCallback(async (id: string): Promise<void> => {
    await executeCommand('TRIGGER_EVENT', { id });
  }, [executeCommand]);

  // View commands
  const setMapView = useCallback(async (viewState: MapViewState): Promise<void> => {
    await executeCommand('SET_MAP_VIEW', viewState);
  }, [executeCommand]);

  const zoomToUnit = useCallback(async (unitId: string): Promise<void> => {
    await executeCommand('ZOOM_TO_UNIT', { unitId });
  }, [executeCommand]);

  const zoomToArea = useCallback(async (bounds: [number, number, number, number]): Promise<void> => {
    await executeCommand('ZOOM_TO_AREA', { bounds });
  }, [executeCommand]);

  const resetView = useCallback(async (): Promise<void> => {
    await executeCommand('RESET_VIEW');
  }, [executeCommand]);

  // Display commands
  const showUnits = useCallback(async (unitIds: string[]): Promise<void> => {
    await executeCommand('SHOW_UNITS', { unitIds });
  }, [executeCommand]);

  const hideUnits = useCallback(async (unitIds: string[]): Promise<void> => {
    await executeCommand('HIDE_UNITS', { unitIds });
  }, [executeCommand]);

  const highlightUnits = useCallback(async (unitIds: string[]): Promise<void> => {
    await executeCommand('HIGHLIGHT_UNITS', { unitIds });
  }, [executeCommand]);

  const clearHighlight = useCallback(async (): Promise<void> => {
    await executeCommand('CLEAR_HIGHLIGHT');
  }, [executeCommand]);

  // Layer commands
  const showLayer = useCallback(async (layerId: string): Promise<void> => {
    await executeCommand('SHOW_LAYER', { layerId });
  }, [executeCommand]);

  const hideLayer = useCallback(async (layerId: string): Promise<void> => {
    await executeCommand('HIDE_LAYER', { layerId });
  }, [executeCommand]);

  const toggleLayer = useCallback(async (layerId: string): Promise<boolean> => {
    return await executeCommand('TOGGLE_LAYER', { layerId });
  }, [executeCommand]);

  // Export commands
  const exportMap = useCallback(async (format: 'png' | 'jpg' | 'svg'): Promise<string> => {
    return await executeCommand('EXPORT_MAP', { format });
  }, [executeCommand]);

  const exportData = useCallback(async (format: 'json' | 'xml' | 'csv'): Promise<string> => {
    return await executeCommand('EXPORT_DATA', { format });
  }, [executeCommand]);

  // System commands
  const getSystemInfo = useCallback(async (): Promise<any> => {
    return await executeCommand('GET_SYSTEM_INFO');
  }, [executeCommand]);

  const clearCache = useCallback(async (): Promise<void> => {
    await executeCommand('CLEAR_CACHE');
  }, [executeCommand]);

  const resetSystem = useCallback(async (): Promise<void> => {
    await executeCommand('RESET_SYSTEM');
  }, [executeCommand]);

  // Batch commands
  const executeBatch = useCallback(async (
    commands: Array<{ command: OrbatCommandType; data?: any }>
  ): Promise<any[]> => {
    return await executeCommand('BATCH_EXECUTE', { commands });
  }, [executeCommand]);

  // State from command service
  const isExecuting = useMemo(() => {
    return commandService?.isExecuting || false;
  }, [commandService]);

  const lastCommand = useMemo(() => {
    return commandService?.lastCommand || null;
  }, [commandService]);

  const lastError = useMemo(() => {
    return commandService?.lastError || null;
  }, [commandService]);

  return {
    // Basic commands
    executeCommand,
    
    // Scenario commands
    loadScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    
    // Unit commands
    addUnit,
    updateUnit,
    deleteUnit,
    moveUnit,
    updateUnitSymbol,
    
    // Event commands
    addEvent,
    updateEvent,
    deleteEvent,
    triggerEvent,
    
    // View commands
    setMapView,
    zoomToUnit,
    zoomToArea,
    resetView,
    
    // Display commands
    showUnits,
    hideUnits,
    highlightUnits,
    clearHighlight,
    
    // Layer commands
    showLayer,
    hideLayer,
    toggleLayer,
    
    // Export commands
    exportMap,
    exportData,
    
    // System commands
    getSystemInfo,
    clearCache,
    resetSystem,
    
    // Batch commands
    executeBatch,
    
    // State
    isExecuting,
    lastCommand,
    lastError
  };
};

export default useOrbatCommands;