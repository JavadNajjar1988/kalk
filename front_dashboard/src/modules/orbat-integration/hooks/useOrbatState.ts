import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  OrbatScenario, 
  OrbatUnit, 
  OrbatEvent, 
  MapViewState,
  Position 
} from '../types/orbat-data';

interface OrbatState {
  // Current scenario
  currentScenario: OrbatScenario | null;
  
  // Units data
  units: OrbatUnit[];
  selectedUnits: string[];
  visibleUnits: string[];
  highlightedUnits: string[];
  
  // Events data
  events: OrbatEvent[];
  activeEvents: string[];
  
  // Map state
  mapView: MapViewState | null;
  visibleLayers: string[];
  
  // UI state
  isLoading: boolean;
  lastError: string | null;
  
  // Synchronization state
  lastSyncTime: Date | null;
  isDirty: boolean;
}

interface UseOrbatStateOptions {
  autoSync?: boolean;
  syncInterval?: number;
  persistState?: boolean;
  onStateChange?: (state: OrbatState) => void;
}

interface StateUpdate<T> {
  (current: T): T;
}

interface UseOrbatStateResult {
  // Current state
  state: OrbatState;
  
  // Scenario state management
  setCurrentScenario: (scenario: OrbatScenario | null) => void;
  updateScenario: (updates: Partial<OrbatScenario>) => void;
  
  // Units state management
  setUnits: (units: OrbatUnit[] | StateUpdate<OrbatUnit[]>) => void;
  addUnit: (unit: OrbatUnit) => void;
  updateUnit: (id: string, updates: Partial<OrbatUnit>) => void;
  removeUnit: (id: string) => void;
  
  // Unit selection management
  selectUnits: (unitIds: string[]) => void;
  selectUnit: (unitId: string) => void;
  deselectUnit: (unitId: string) => void;
  deselectAllUnits: () => void;
  toggleUnitSelection: (unitId: string) => void;
  
  // Unit visibility management
  showUnits: (unitIds: string[]) => void;
  hideUnits: (unitIds: string[]) => void;
  toggleUnitVisibility: (unitId: string) => void;
  showAllUnits: () => void;
  hideAllUnits: () => void;
  
  // Unit highlighting management
  highlightUnits: (unitIds: string[]) => void;
  clearHighlight: () => void;
  toggleUnitHighlight: (unitId: string) => void;
  
  // Events state management
  setEvents: (events: OrbatEvent[] | StateUpdate<OrbatEvent[]>) => void;
  addEvent: (event: OrbatEvent) => void;
  updateEvent: (id: string, updates: Partial<OrbatEvent>) => void;
  removeEvent: (id: string) => void;
  activateEvent: (id: string) => void;
  deactivateEvent: (id: string) => void;
  
  // Map state management
  setMapView: (view: MapViewState) => void;
  updateMapView: (updates: Partial<MapViewState>) => void;
  
  // Layer management
  showLayer: (layerId: string) => void;
  hideLayer: (layerId: string) => void;
  toggleLayer: (layerId: string) => void;
  
  // Global state operations
  resetState: () => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Synchronization
  syncState: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
  
  // State persistence
  saveState: () => void;
  loadState: () => void;
  clearSavedState: () => void;
  
  // State queries
  getUnitById: (id: string) => OrbatUnit | undefined;
  getEventById: (id: string) => OrbatEvent | undefined;
  getSelectedUnits: () => OrbatUnit[];
  getVisibleUnits: () => OrbatUnit[];
  getHighlightedUnits: () => OrbatUnit[];
  getActiveEvents: () => OrbatEvent[];
  
  // State statistics
  getStatistics: () => {
    totalUnits: number;
    selectedUnitsCount: number;
    visibleUnitsCount: number;
    highlightedUnitsCount: number;
    totalEvents: number;
    activeEventsCount: number;
    visibleLayersCount: number;
  };
}

const initialState: OrbatState = {
  currentScenario: null,
  units: [],
  selectedUnits: [],
  visibleUnits: [],
  highlightedUnits: [],
  events: [],
  activeEvents: [],
  mapView: null,
  visibleLayers: [],
  isLoading: false,
  lastError: null,
  lastSyncTime: null,
  isDirty: false
};

const STORAGE_KEY = 'orbat_state';

export const useOrbatState = (options: UseOrbatStateOptions = {}): UseOrbatStateResult => {
  const { stateSyncService } = useOrbat();
  const { 
    autoSync = true, 
    syncInterval = 5000, 
    persistState = true, 
    onStateChange 
  } = options;

  const [state, setState] = useState<OrbatState>(() => {
    if (persistState) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          return { ...initialState, ...parsed, lastSyncTime: new Date(parsed.lastSyncTime) };
        }
      } catch (error) {
        console.warn('Failed to load saved state:', error);
      }
    }
    return initialState;
  });

  // Update state helper
  const updateState = useCallback((updater: StateUpdate<OrbatState>) => {
    setState(prevState => {
      const newState = updater(prevState);
      
      if (onStateChange) {
        onStateChange(newState);
      }
      
      return newState;
    });
  }, [onStateChange]);

  // Scenario state management
  const setCurrentScenario = useCallback((scenario: OrbatScenario | null) => {
    updateState(state => ({
      ...state,
      currentScenario: scenario,
      isDirty: true
    }));
  }, [updateState]);

  const updateScenario = useCallback((updates: Partial<OrbatScenario>) => {
    updateState(state => ({
      ...state,
      currentScenario: state.currentScenario ? { ...state.currentScenario, ...updates } : null,
      isDirty: true
    }));
  }, [updateState]);

  // Units state management
  const setUnits = useCallback((units: OrbatUnit[] | StateUpdate<OrbatUnit[]>) => {
    updateState(state => ({
      ...state,
      units: typeof units === 'function' ? units(state.units) : units,
      isDirty: true
    }));
  }, [updateState]);

  const addUnit = useCallback((unit: OrbatUnit) => {
    updateState(state => ({
      ...state,
      units: [...state.units, unit],
      isDirty: true
    }));
  }, [updateState]);

  const updateUnit = useCallback((id: string, updates: Partial<OrbatUnit>) => {
    updateState(state => ({
      ...state,
      units: state.units.map(unit => 
        unit.id === id ? { ...unit, ...updates } : unit
      ),
      isDirty: true
    }));
  }, [updateState]);

  const removeUnit = useCallback((id: string) => {
    updateState(state => ({
      ...state,
      units: state.units.filter(unit => unit.id !== id),
      selectedUnits: state.selectedUnits.filter(uid => uid !== id),
      visibleUnits: state.visibleUnits.filter(uid => uid !== id),
      highlightedUnits: state.highlightedUnits.filter(uid => uid !== id),
      isDirty: true
    }));
  }, [updateState]);

  // Unit selection management
  const selectUnits = useCallback((unitIds: string[]) => {
    updateState(state => ({
      ...state,
      selectedUnits: unitIds
    }));
  }, [updateState]);

  const selectUnit = useCallback((unitId: string) => {
    updateState(state => ({
      ...state,
      selectedUnits: state.selectedUnits.includes(unitId) 
        ? state.selectedUnits 
        : [...state.selectedUnits, unitId]
    }));
  }, [updateState]);

  const deselectUnit = useCallback((unitId: string) => {
    updateState(state => ({
      ...state,
      selectedUnits: state.selectedUnits.filter(id => id !== unitId)
    }));
  }, [updateState]);

  const deselectAllUnits = useCallback(() => {
    updateState(state => ({
      ...state,
      selectedUnits: []
    }));
  }, [updateState]);

  const toggleUnitSelection = useCallback((unitId: string) => {
    updateState(state => ({
      ...state,
      selectedUnits: state.selectedUnits.includes(unitId)
        ? state.selectedUnits.filter(id => id !== unitId)
        : [...state.selectedUnits, unitId]
    }));
  }, [updateState]);

  // Unit visibility management
  const showUnits = useCallback((unitIds: string[]) => {
    updateState(state => ({
      ...state,
      visibleUnits: [...new Set([...state.visibleUnits, ...unitIds])]
    }));
  }, [updateState]);

  const hideUnits = useCallback((unitIds: string[]) => {
    updateState(state => ({
      ...state,
      visibleUnits: state.visibleUnits.filter(id => !unitIds.includes(id))
    }));
  }, [updateState]);

  const toggleUnitVisibility = useCallback((unitId: string) => {
    updateState(state => ({
      ...state,
      visibleUnits: state.visibleUnits.includes(unitId)
        ? state.visibleUnits.filter(id => id !== unitId)
        : [...state.visibleUnits, unitId]
    }));
  }, [updateState]);

  const showAllUnits = useCallback(() => {
    updateState(state => ({
      ...state,
      visibleUnits: state.units.map(unit => unit.id)
    }));
  }, [updateState]);

  const hideAllUnits = useCallback(() => {
    updateState(state => ({
      ...state,
      visibleUnits: []
    }));
  }, [updateState]);

  // Unit highlighting management
  const highlightUnits = useCallback((unitIds: string[]) => {
    updateState(state => ({
      ...state,
      highlightedUnits: unitIds
    }));
  }, [updateState]);

  const clearHighlight = useCallback(() => {
    updateState(state => ({
      ...state,
      highlightedUnits: []
    }));
  }, [updateState]);

  const toggleUnitHighlight = useCallback((unitId: string) => {
    updateState(state => ({
      ...state,
      highlightedUnits: state.highlightedUnits.includes(unitId)
        ? state.highlightedUnits.filter(id => id !== unitId)
        : [...state.highlightedUnits, unitId]
    }));
  }, [updateState]);

  // Events state management
  const setEvents = useCallback((events: OrbatEvent[] | StateUpdate<OrbatEvent[]>) => {
    updateState(state => ({
      ...state,
      events: typeof events === 'function' ? events(state.events) : events,
      isDirty: true
    }));
  }, [updateState]);

  const addEvent = useCallback((event: OrbatEvent) => {
    updateState(state => ({
      ...state,
      events: [...state.events, event],
      isDirty: true
    }));
  }, [updateState]);

  const updateEvent = useCallback((id: string, updates: Partial<OrbatEvent>) => {
    updateState(state => ({
      ...state,
      events: state.events.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ),
      isDirty: true
    }));
  }, [updateState]);

  const removeEvent = useCallback((id: string) => {
    updateState(state => ({
      ...state,
      events: state.events.filter(event => event.id !== id),
      activeEvents: state.activeEvents.filter(eid => eid !== id),
      isDirty: true
    }));
  }, [updateState]);

  const activateEvent = useCallback((id: string) => {
    updateState(state => ({
      ...state,
      activeEvents: state.activeEvents.includes(id) 
        ? state.activeEvents 
        : [...state.activeEvents, id]
    }));
  }, [updateState]);

  const deactivateEvent = useCallback((id: string) => {
    updateState(state => ({
      ...state,
      activeEvents: state.activeEvents.filter(eid => eid !== id)
    }));
  }, [updateState]);

  // Map state management
  const setMapView = useCallback((view: MapViewState) => {
    updateState(state => ({
      ...state,
      mapView: view
    }));
  }, [updateState]);

  const updateMapView = useCallback((updates: Partial<MapViewState>) => {
    updateState(state => ({
      ...state,
      mapView: state.mapView ? { ...state.mapView, ...updates } : null
    }));
  }, [updateState]);

  // Layer management
  const showLayer = useCallback((layerId: string) => {
    updateState(state => ({
      ...state,
      visibleLayers: state.visibleLayers.includes(layerId) 
        ? state.visibleLayers 
        : [...state.visibleLayers, layerId]
    }));
  }, [updateState]);

  const hideLayer = useCallback((layerId: string) => {
    updateState(state => ({
      ...state,
      visibleLayers: state.visibleLayers.filter(id => id !== layerId)
    }));
  }, [updateState]);

  const toggleLayer = useCallback((layerId: string) => {
    updateState(state => ({
      ...state,
      visibleLayers: state.visibleLayers.includes(layerId)
        ? state.visibleLayers.filter(id => id !== layerId)
        : [...state.visibleLayers, layerId]
    }));
  }, [updateState]);

  // Global state operations
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const clearData = useCallback(() => {
    updateState(state => ({
      ...state,
      units: [],
      events: [],
      selectedUnits: [],
      visibleUnits: [],
      highlightedUnits: [],
      activeEvents: [],
      isDirty: true
    }));
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState(state => ({
      ...state,
      isLoading: loading
    }));
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState(state => ({
      ...state,
      lastError: error
    }));
  }, [updateState]);

  // Synchronization
  const syncState = useCallback(async () => {
    if (stateSyncService) {
      try {
        await stateSyncService.syncState(state);
        updateState(current => ({
          ...current,
          lastSyncTime: new Date(),
          isDirty: false
        }));
      } catch (error) {
        console.error('State sync failed:', error);
        setError(error instanceof Error ? error.message : 'Sync failed');
      }
    }
  }, [stateSyncService, state, updateState, setError]);

  const markDirty = useCallback(() => {
    updateState(state => ({
      ...state,
      isDirty: true
    }));
  }, [updateState]);

  const markClean = useCallback(() => {
    updateState(state => ({
      ...state,
      isDirty: false,
      lastSyncTime: new Date()
    }));
  }, [updateState]);

  // State persistence
  const saveState = useCallback(() => {
    if (persistState) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save state:', error);
      }
    }
  }, [persistState, state]);

  const loadState = useCallback(() => {
    if (persistState) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setState({ ...initialState, ...parsed, lastSyncTime: new Date(parsed.lastSyncTime) });
        }
      } catch (error) {
        console.warn('Failed to load state:', error);
      }
    }
  }, [persistState]);

  const clearSavedState = useCallback(() => {
    if (persistState) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [persistState]);

  // State queries
  const getUnitById = useCallback((id: string) => {
    return state.units.find(unit => unit.id === id);
  }, [state.units]);

  const getEventById = useCallback((id: string) => {
    return state.events.find(event => event.id === id);
  }, [state.events]);

  const getSelectedUnits = useCallback(() => {
    return state.units.filter(unit => state.selectedUnits.includes(unit.id));
  }, [state.units, state.selectedUnits]);

  const getVisibleUnits = useCallback(() => {
    return state.units.filter(unit => state.visibleUnits.includes(unit.id));
  }, [state.units, state.visibleUnits]);

  const getHighlightedUnits = useCallback(() => {
    return state.units.filter(unit => state.highlightedUnits.includes(unit.id));
  }, [state.units, state.highlightedUnits]);

  const getActiveEvents = useCallback(() => {
    return state.events.filter(event => state.activeEvents.includes(event.id));
  }, [state.events, state.activeEvents]);

  // State statistics
  const getStatistics = useCallback(() => ({
    totalUnits: state.units.length,
    selectedUnitsCount: state.selectedUnits.length,
    visibleUnitsCount: state.visibleUnits.length,
    highlightedUnitsCount: state.highlightedUnits.length,
    totalEvents: state.events.length,
    activeEventsCount: state.activeEvents.length,
    visibleLayersCount: state.visibleLayers.length
  }), [state]);

  // Auto-sync effect
  useEffect(() => {
    if (autoSync && state.isDirty && syncInterval > 0) {
      const interval = setInterval(() => {
        if (state.isDirty) {
          syncState();
        }
      }, syncInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoSync, state.isDirty, syncInterval, syncState]);

  // State persistence effect
  useEffect(() => {
    if (persistState) {
      saveState();
    }
  }, [state, persistState, saveState]);

  return {
    // Current state
    state,
    
    // Scenario state management
    setCurrentScenario,
    updateScenario,
    
    // Units state management
    setUnits,
    addUnit,
    updateUnit,
    removeUnit,
    
    // Unit selection management
    selectUnits,
    selectUnit,
    deselectUnit,
    deselectAllUnits,
    toggleUnitSelection,
    
    // Unit visibility management
    showUnits,
    hideUnits,
    toggleUnitVisibility,
    showAllUnits,
    hideAllUnits,
    
    // Unit highlighting management
    highlightUnits,
    clearHighlight,
    toggleUnitHighlight,
    
    // Events state management
    setEvents,
    addEvent,
    updateEvent,
    removeEvent,
    activateEvent,
    deactivateEvent,
    
    // Map state management
    setMapView,
    updateMapView,
    
    // Layer management
    showLayer,
    hideLayer,
    toggleLayer,
    
    // Global state operations
    resetState,
    clearData,
    setLoading,
    setError,
    
    // Synchronization
    syncState,
    markDirty,
    markClean,
    
    // State persistence
    saveState,
    loadState,
    clearSavedState,
    
    // State queries
    getUnitById,
    getEventById,
    getSelectedUnits,
    getVisibleUnits,
    getHighlightedUnits,
    getActiveEvents,
    
    // State statistics
    getStatistics
  };
};

export default useOrbatState;