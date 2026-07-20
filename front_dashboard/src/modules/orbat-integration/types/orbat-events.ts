/**
 * ORBAT Event Types
 * انواع رویدادهای قابل پردازش
 */

// Event categories
export type EventCategory = 
  | 'scenario'
  | 'unit'
  | 'timeline'
  | 'selection'
  | 'view'
  | 'map'
  | 'layer'
  | 'command'
  | 'data'
  | 'system';

// Scenario events
export interface ScenarioLoadedEvent {
  category: 'scenario';
  type: 'loaded';
  data: {
    scenarioId: string;
    name: string;
    metadata: any;
  };
}

export interface ScenarioSavedEvent {
  category: 'scenario';
  type: 'saved';
  data: {
    scenarioId: string;
    saveLocation: 'local' | 'indexeddb' | 'server';
  };
}

export interface ScenarioChangedEvent {
  category: 'scenario';
  type: 'changed';
  data: {
    changes: string[];
    hasUnsavedChanges: boolean;
  };
}

// Unit events
export interface UnitAddedEvent {
  category: 'unit';
  type: 'added';
  data: {
    unitId: string;
    parentId?: string;
    sideId: string;
    groupId: string;
  };
}

export interface UnitUpdatedEvent {
  category: 'unit';
  type: 'updated';
  data: {
    unitId: string;
    changes: Partial<any>; // Unit properties that changed
    previousValues: Partial<any>;
  };
}

export interface UnitDeletedEvent {
  category: 'unit';
  type: 'deleted';
  data: {
    unitId: string;
    parentId?: string;
  };
}

export interface UnitMovedEvent {
  category: 'unit';
  type: 'moved';
  data: {
    unitId: string;
    newLocation: [number, number] | [number, number, number];
    previousLocation?: [number, number] | [number, number, number];
  };
}

// Timeline events
export interface TimelinePlayEvent {
  category: 'timeline';
  type: 'play';
  data: {
    startTime: number;
    speed: number;
  };
}

export interface TimelinePauseEvent {
  category: 'timeline';
  type: 'pause';
  data: {
    currentTime: number;
  };
}

export interface TimelineSeekEvent {
  category: 'timeline';
  type: 'seek';
  data: {
    time: number;
    previousTime: number;
  };
}

export interface TimelineSpeedChangedEvent {
  category: 'timeline';
  type: 'speed_changed';
  data: {
    speed: number;
    previousSpeed: number;
  };
}

// Selection events
export interface SelectionChangedEvent {
  category: 'selection';
  type: 'changed';
  data: {
    selectedUnitIds: string[];
    selectedFeatureIds: string[];
    selectedEventIds: string[];
    previousSelection: {
      unitIds: string[];
      featureIds: string[];
      eventIds: string[];
    };
  };
}

export interface ActiveItemChangedEvent {
  category: 'selection';
  type: 'active_changed';
  data: {
    activeUnitId?: string;
    activeFeatureId?: string;
    activeEventId?: string;
    previousActiveUnitId?: string;
    previousActiveFeatureId?: string;
    previousActiveEventId?: string;
  };
}

// View events
export interface ViewModeChangedEvent {
  category: 'view';
  type: 'mode_changed';
  data: {
    mode: 'chart' | 'map' | 'grid' | 'story';
    previousMode: 'chart' | 'map' | 'grid' | 'story';
  };
}

export interface ViewZoomedEvent {
  category: 'view';
  type: 'zoomed';
  data: {
    zoom: number;
    center: [number, number];
    previousZoom: number;
    previousCenter: [number, number];
  };
}

export interface ViewPannedEvent {
  category: 'view';
  type: 'panned';
  data: {
    center: [number, number];
    previousCenter: [number, number];
  };
}

// Map events
export interface MapClickEvent {
  category: 'map';
  type: 'click';
  data: {
    coordinate: [number, number];
    pixel: [number, number];
    features?: any[];
  };
}

export interface MapRightClickEvent {
  category: 'map';
  type: 'right_click';
  data: {
    coordinate: [number, number];
    pixel: [number, number];
    features?: any[];
    target?: 'map' | 'unit' | 'feature';
  };
}

export interface MapDoubleClickEvent {
  category: 'map';
  type: 'double_click';
  data: {
    coordinate: [number, number];
    pixel: [number, number];
  };
}

// Layer events
export interface LayerVisibilityChangedEvent {
  category: 'layer';
  type: 'visibility_changed';
  data: {
    layerId: string;
    visible: boolean;
    previousVisible: boolean;
  };
}

export interface LayerOpacityChangedEvent {
  category: 'layer';
  type: 'opacity_changed';
  data: {
    layerId: string;
    opacity: number;
    previousOpacity: number;
  };
}

// Command events
export interface CommandExecutedEvent {
  category: 'command';
  type: 'executed';
  data: {
    commandId: string;
    payload: any;
    result: any;
    success: boolean;
    error?: string;
  };
}

export interface UndoEvent {
  category: 'command';
  type: 'undo';
  data: {
    commandId: string;
    success: boolean;
  };
}

export interface RedoEvent {
  category: 'command';
  type: 'redo';
  data: {
    commandId: string;
    success: boolean;
  };
}

// Data events
export interface DataImportedEvent {
  category: 'data';
  type: 'imported';
  data: {
    format: string;
    itemCount: number;
    success: boolean;
    errors?: string[];
  };
}

export interface DataExportedEvent {
  category: 'data';
  type: 'exported';
  data: {
    format: string;
    itemCount: number;
    destination: string;
    success: boolean;
  };
}

// System events
export interface SystemReadyEvent {
  category: 'system';
  type: 'ready';
  data: {
    version: string;
    capabilities: string[];
    timestamp: number;
  };
}

export interface SystemErrorEvent {
  category: 'system';
  type: 'error';
  data: {
    error: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
  };
}

// Union type for all events
export type OrbatEvent = 
  | ScenarioLoadedEvent
  | ScenarioSavedEvent
  | ScenarioChangedEvent
  | UnitAddedEvent
  | UnitUpdatedEvent
  | UnitDeletedEvent
  | UnitMovedEvent
  | TimelinePlayEvent
  | TimelinePauseEvent
  | TimelineSeekEvent
  | TimelineSpeedChangedEvent
  | SelectionChangedEvent
  | ActiveItemChangedEvent
  | ViewModeChangedEvent
  | ViewZoomedEvent
  | ViewPannedEvent
  | MapClickEvent
  | MapRightClickEvent
  | MapDoubleClickEvent
  | LayerVisibilityChangedEvent
  | LayerOpacityChangedEvent
  | CommandExecutedEvent
  | UndoEvent
  | RedoEvent
  | DataImportedEvent
  | DataExportedEvent
  | SystemReadyEvent
  | SystemErrorEvent;

// Event listener type
export type EventListener<T extends OrbatEvent = OrbatEvent> = (event: T) => void;

// Event filter
export interface EventFilter {
  categories?: EventCategory[];
  types?: string[];
  unitIds?: string[];
  featureIds?: string[];
}

// Event subscription
export interface EventSubscription {
  id: string;
  filter?: EventFilter;
  listener: EventListener;
  active: boolean;
}