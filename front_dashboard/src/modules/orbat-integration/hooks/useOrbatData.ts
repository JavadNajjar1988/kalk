import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  OrbatScenario, 
  OrbatUnit, 
  OrbatEvent,
  OrbatSearchFilters,
  OrbatStatistics 
} from '../types/orbat-data';

interface UseOrbatDataOptions {
  autoLoad?: boolean;
  enableCache?: boolean;
  refreshInterval?: number;
}

interface UseOrbatDataResult {
  // Data state
  scenarios: OrbatScenario[];
  units: OrbatUnit[];
  events: OrbatEvent[];
  statistics: OrbatStatistics | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingScenarios: boolean;
  isLoadingUnits: boolean;
  isLoadingEvents: boolean;
  isLoadingStatistics: boolean;
  
  // Error states
  error: string | null;
  scenariosError: string | null;
  unitsError: string | null;
  eventsError: string | null;
  statisticsError: string | null;
  
  // Data operations
  loadScenarios: () => Promise<void>;
  loadUnits: (scenarioId?: string) => Promise<void>;
  loadEvents: (filters?: OrbatSearchFilters) => Promise<void>;
  loadStatistics: () => Promise<void>;
  searchData: (query: string, filters?: OrbatSearchFilters) => Promise<any[]>;
  refreshAll: () => Promise<void>;
  
  // Cache operations
  clearCache: () => void;
  getCacheInfo: () => any;
  
  // Data manipulation
  addScenario: (scenario: Omit<OrbatScenario, 'id'>) => Promise<OrbatScenario>;
  updateScenario: (id: string, updates: Partial<OrbatScenario>) => Promise<OrbatScenario>;
  deleteScenario: (id: string) => Promise<void>;
  
  addUnit: (unit: Omit<OrbatUnit, 'id'>) => Promise<OrbatUnit>;
  updateUnit: (id: string, updates: Partial<OrbatUnit>) => Promise<OrbatUnit>;
  deleteUnit: (id: string) => Promise<void>;
  
  addEvent: (event: Omit<OrbatEvent, 'id'>) => Promise<OrbatEvent>;
  updateEvent: (id: string, updates: Partial<OrbatEvent>) => Promise<OrbatEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useOrbatData = (options: UseOrbatDataOptions = {}): UseOrbatDataResult => {
  const { dataService } = useOrbat();
  const { autoLoad = true, enableCache = true, refreshInterval } = options;

  // Data state
  const [scenarios, setScenarios] = useState<OrbatScenario[]>([]);
  const [units, setUnits] = useState<OrbatUnit[]>([]);
  const [events, setEvents] = useState<OrbatEvent[]>([]);
  const [statistics, setStatistics] = useState<OrbatStatistics | null>(null);

  // Loading states
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);

  // Error states
  const [scenariosError, setScenariosError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  // Computed states
  const isLoading = useMemo(() => 
    isLoadingScenarios || isLoadingUnits || isLoadingEvents || isLoadingStatistics,
    [isLoadingScenarios, isLoadingUnits, isLoadingEvents, isLoadingStatistics]
  );

  const error = useMemo(() => 
    scenariosError || unitsError || eventsError || statisticsError,
    [scenariosError, unitsError, eventsError, statisticsError]
  );

  // Load scenarios
  const loadScenarios = useCallback(async () => {
    if (!dataService) return;
    
    setIsLoadingScenarios(true);
    setScenariosError(null);
    
    try {
      const scenarioData = await dataService.getScenarios(enableCache);
      setScenarios(scenarioData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scenarios';
      setScenariosError(errorMessage);
      console.error('Error loading scenarios:', err);
    } finally {
      setIsLoadingScenarios(false);
    }
  }, [dataService, enableCache]);

  // Load units
  const loadUnits = useCallback(async (scenarioId?: string) => {
    if (!dataService) return;
    
    setIsLoadingUnits(true);
    setUnitsError(null);
    
    try {
      const unitsData = await dataService.getUnits(scenarioId, enableCache);
      setUnits(unitsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load units';
      setUnitsError(errorMessage);
      console.error('Error loading units:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  }, [dataService, enableCache]);

  // Load events
  const loadEvents = useCallback(async (filters?: OrbatSearchFilters) => {
    if (!dataService) return;
    
    setIsLoadingEvents(true);
    setEventsError(null);
    
    try {
      const eventsData = await dataService.getEvents(filters, enableCache);
      setEvents(eventsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      setEventsError(errorMessage);
      console.error('Error loading events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [dataService, enableCache]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!dataService) return;
    
    setIsLoadingStatistics(true);
    setStatisticsError(null);
    
    try {
      const statsData = await dataService.getStatistics(enableCache);
      setStatistics(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setStatisticsError(errorMessage);
      console.error('Error loading statistics:', err);
    } finally {
      setIsLoadingStatistics(false);
    }
  }, [dataService, enableCache]);

  // Search data
  const searchData = useCallback(async (query: string, filters?: OrbatSearchFilters) => {
    if (!dataService) return [];
    
    try {
      return await dataService.searchData(query, filters);
    } catch (err) {
      console.error('Error searching data:', err);
      return [];
    }
  }, [dataService]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadScenarios(),
      loadUnits(),
      loadEvents(),
      loadStatistics()
    ]);
  }, [loadScenarios, loadUnits, loadEvents, loadStatistics]);

  // Cache operations
  const clearCache = useCallback(() => {
    if (dataService) {
      dataService.clearCache();
    }
  }, [dataService]);

  const getCacheInfo = useCallback(() => {
    return dataService?.getCacheInfo() || {};
  }, [dataService]);

  // Data manipulation methods
  const addScenario = useCallback(async (scenario: Omit<OrbatScenario, 'id'>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const newScenario = await dataService.addScenario(scenario);
    setScenarios(prev => [...prev, newScenario]);
    return newScenario;
  }, [dataService]);

  const updateScenario = useCallback(async (id: string, updates: Partial<OrbatScenario>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const updatedScenario = await dataService.updateScenario(id, updates);
    setScenarios(prev => prev.map(s => s.id === id ? updatedScenario : s));
    return updatedScenario;
  }, [dataService]);

  const deleteScenario = useCallback(async (id: string) => {
    if (!dataService) throw new Error('Data service not available');
    
    await dataService.deleteScenario(id);
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, [dataService]);

  const addUnit = useCallback(async (unit: Omit<OrbatUnit, 'id'>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const newUnit = await dataService.addUnit(unit);
    setUnits(prev => [...prev, newUnit]);
    return newUnit;
  }, [dataService]);

  const updateUnit = useCallback(async (id: string, updates: Partial<OrbatUnit>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const updatedUnit = await dataService.updateUnit(id, updates);
    setUnits(prev => prev.map(u => u.id === id ? updatedUnit : u));
    return updatedUnit;
  }, [dataService]);

  const deleteUnit = useCallback(async (id: string) => {
    if (!dataService) throw new Error('Data service not available');
    
    await dataService.deleteUnit(id);
    setUnits(prev => prev.filter(u => u.id !== id));
  }, [dataService]);

  const addEvent = useCallback(async (event: Omit<OrbatEvent, 'id'>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const newEvent = await dataService.addEvent(event);
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, [dataService]);

  const updateEvent = useCallback(async (id: string, updates: Partial<OrbatEvent>) => {
    if (!dataService) throw new Error('Data service not available');
    
    const updatedEvent = await dataService.updateEvent(id, updates);
    setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
    return updatedEvent;
  }, [dataService]);

  const deleteEvent = useCallback(async (id: string) => {
    if (!dataService) throw new Error('Data service not available');
    
    await dataService.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, [dataService]);

  // Auto-load effect
  useEffect(() => {
    if (autoLoad && dataService) {
      refreshAll();
    }
  }, [autoLoad, dataService, refreshAll]);

  // Refresh interval effect
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshAll, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshAll]);

  return {
    // Data state
    scenarios,
    units,
    events,
    statistics,
    
    // Loading states
    isLoading,
    isLoadingScenarios,
    isLoadingUnits,
    isLoadingEvents,
    isLoadingStatistics,
    
    // Error states
    error,
    scenariosError,
    unitsError,
    eventsError,
    statisticsError,
    
    // Data operations
    loadScenarios,
    loadUnits,
    loadEvents,
    loadStatistics,
    searchData,
    refreshAll,
    
    // Cache operations
    clearCache,
    getCacheInfo,
    
    // Data manipulation
    addScenario,
    updateScenario,
    deleteScenario,
    addUnit,
    updateUnit,
    deleteUnit,
    addEvent,
    updateEvent,
    deleteEvent
  };
};

export default useOrbatData;