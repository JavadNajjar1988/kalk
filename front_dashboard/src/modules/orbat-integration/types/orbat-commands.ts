/**
 * ORBAT Command Types
 * انواع دستوراتی که می‌توان به ORBAT Mapper ارسال کرد
 */

// Base command structure
export interface BaseCommand {
  id: string;
  type: string;
  timestamp: number;
  userId?: string;
}

// Command categories
export type CommandCategory = 
  | 'scenario'
  | 'unit'
  | 'timeline'
  | 'selection'
  | 'view'
  | 'map'
  | 'layer'
  | 'import'
  | 'export'
  | 'undo_redo';

// Scenario commands
export interface LoadScenarioCommand extends BaseCommand {
  type: 'LOAD_SCENARIO';
  payload: {
    scenarioId?: string;
    source: 'local' | 'indexeddb' | 'url' | 'data';
    data?: any;
    url?: string;
  };
}

export interface SaveScenarioCommand extends BaseCommand {
  type: 'SAVE_SCENARIO';
  payload: {
    destination: 'local' | 'indexeddb' | 'download';
    name?: string;
    format?: 'json' | 'zip';
  };
}

export interface NewScenarioCommand extends BaseCommand {
  type: 'NEW_SCENARIO';
  payload: {
    name: string;
    description?: string;
    template?: string;
  };
}

// Unit commands
export interface AddUnitCommand extends BaseCommand {
  type: 'ADD_UNIT';
  payload: {
    parentId?: string;
    sideId: string;
    groupId: string;
    unitData: {
      name: string;
      sidc: string;
      location?: [number, number];
      [key: string]: any;
    };
  };
}

export interface UpdateUnitCommand extends BaseCommand {
  type: 'UPDATE_UNIT';
  payload: {
    unitId: string;
    updates: {
      name?: string;
      sidc?: string;
      location?: [number, number];
      [key: string]: any;
    };
  };
}

export interface DeleteUnitCommand extends BaseCommand {
  type: 'DELETE_UNIT';
  payload: {
    unitId: string;
    deleteChildren?: boolean;
  };
}

export interface MoveUnitCommand extends BaseCommand {
  type: 'MOVE_UNIT';
  payload: {
    unitId: string;
    newParentId?: string;
    newPosition?: number;
    newLocation?: [number, number];
  };
}

export interface DuplicateUnitCommand extends BaseCommand {
  type: 'DUPLICATE_UNIT';
  payload: {
    unitId: string;
    includeChildren?: boolean;
    newName?: string;
  };
}

// Timeline commands
export interface PlayTimelineCommand extends BaseCommand {
  type: 'PLAY_TIMELINE';
  payload: {
    startTime?: number;
    speed?: number;
  };
}

export interface PauseTimelineCommand extends BaseCommand {
  type: 'PAUSE_TIMELINE';
  payload: {};
}

export interface SeekTimelineCommand extends BaseCommand {
  type: 'SEEK_TIMELINE';
  payload: {
    time: number;
  };
}

export interface SetTimelineSpeedCommand extends BaseCommand {
  type: 'SET_TIMELINE_SPEED';
  payload: {
    speed: number;
  };
}

export interface AddTimelineEventCommand extends BaseCommand {
  type: 'ADD_TIMELINE_EVENT';
  payload: {
    startTime: number;
    title: string;
    description?: string;
    unitIds?: string[];
    eventType?: string;
  };
}

// Selection commands
export interface SelectUnitsCommand extends BaseCommand {
  type: 'SELECT_UNITS';
  payload: {
    unitIds: string[];
    mode: 'set' | 'add' | 'remove' | 'toggle';
  };
}

export interface SelectFeaturesCommand extends BaseCommand {
  type: 'SELECT_FEATURES';
  payload: {
    featureIds: string[];
    mode: 'set' | 'add' | 'remove' | 'toggle';
  };
}

export interface SetActiveItemCommand extends BaseCommand {
  type: 'SET_ACTIVE_ITEM';
  payload: {
    itemType: 'unit' | 'feature' | 'event';
    itemId: string;
  };
}

export interface ClearSelectionCommand extends BaseCommand {
  type: 'CLEAR_SELECTION';
  payload: {};
}

// View commands
export interface SetViewModeCommand extends BaseCommand {
  type: 'SET_VIEW_MODE';
  payload: {
    mode: 'chart' | 'map' | 'grid' | 'story';
  };
}

export interface ZoomToCommand extends BaseCommand {
  type: 'ZOOM_TO';
  payload: {
    target: 'unit' | 'feature' | 'extent' | 'coordinate';
    targetId?: string;
    extent?: [number, number, number, number];
    coordinate?: [number, number];
    zoom?: number;
    animate?: boolean;
  };
}

export interface SetViewCommand extends BaseCommand {
  type: 'SET_VIEW';
  payload: {
    center: [number, number];
    zoom: number;
    rotation?: number;
    animate?: boolean;
  };
}

// Map commands
export interface AddMapLayerCommand extends BaseCommand {
  type: 'ADD_MAP_LAYER';
  payload: {
    name: string;
    type: 'base' | 'overlay';
    url?: string;
    visible?: boolean;
    opacity?: number;
  };
}

export interface UpdateMapLayerCommand extends BaseCommand {
  type: 'UPDATE_MAP_LAYER';
  payload: {
    layerId: string;
    updates: {
      name?: string;
      visible?: boolean;
      opacity?: number;
      url?: string;
    };
  };
}

export interface RemoveMapLayerCommand extends BaseCommand {
  type: 'REMOVE_MAP_LAYER';
  payload: {
    layerId: string;
  };
}

// Layer visibility commands
export interface SetLayerVisibilityCommand extends BaseCommand {
  type: 'SET_LAYER_VISIBILITY';
  payload: {
    layerId: string;
    visible: boolean;
  };
}

export interface SetLayerOpacityCommand extends BaseCommand {
  type: 'SET_LAYER_OPACITY';
  payload: {
    layerId: string;
    opacity: number;
  };
}

// Import/Export commands
export interface ImportDataCommand extends BaseCommand {
  type: 'IMPORT_DATA';
  payload: {
    format: 'json' | 'kml' | 'kmz' | 'gpx' | 'geojson';
    data: string | ArrayBuffer;
    options?: {
      overwrite?: boolean;
      merge?: boolean;
      validate?: boolean;
    };
  };
}

export interface ExportDataCommand extends BaseCommand {
  type: 'EXPORT_DATA';
  payload: {
    format: 'json' | 'kml' | 'kmz' | 'gpx' | 'geojson' | 'pdf' | 'png';
    scope: 'scenario' | 'selected' | 'visible';
    options?: {
      includeEvents?: boolean;
      includeMedia?: boolean;
      quality?: number;
    };
  };
}

// Undo/Redo commands
export interface UndoCommand extends BaseCommand {
  type: 'UNDO';
  payload: {};
}

export interface RedoCommand extends BaseCommand {
  type: 'REDO';
  payload: {};
}

export interface ClearHistoryCommand extends BaseCommand {
  type: 'CLEAR_HISTORY';
  payload: {};
}

// Query commands (for data retrieval)
export interface QueryDataCommand extends BaseCommand {
  type: 'QUERY_DATA';
  payload: {
    dataType: 'scenarios' | 'units' | 'events' | 'layers' | 'selection' | 'timeline' | 'view';
    params?: {
      unitIds?: string[];
      layerIds?: string[];
      timeRange?: [number, number];
      spatial?: [number, number, number, number]; // bbox
    };
  };
}

// Context menu commands
export interface ShowContextMenuCommand extends BaseCommand {
  type: 'SHOW_CONTEXT_MENU';
  payload: {
    x: number;
    y: number;
    target: 'map' | 'unit' | 'feature';
    targetId?: string;
  };
}

export interface ExecuteContextActionCommand extends BaseCommand {
  type: 'EXECUTE_CONTEXT_ACTION';
  payload: {
    actionId: string;
    target: 'map' | 'unit' | 'feature';
    targetId?: string;
    params?: any;
  };
}

// Union type for all commands
export type OrbatCommand = 
  | LoadScenarioCommand
  | SaveScenarioCommand
  | NewScenarioCommand
  | AddUnitCommand
  | UpdateUnitCommand
  | DeleteUnitCommand
  | MoveUnitCommand
  | DuplicateUnitCommand
  | PlayTimelineCommand
  | PauseTimelineCommand
  | SeekTimelineCommand
  | SetTimelineSpeedCommand
  | AddTimelineEventCommand
  | SelectUnitsCommand
  | SelectFeaturesCommand
  | SetActiveItemCommand
  | ClearSelectionCommand
  | SetViewModeCommand
  | ZoomToCommand
  | SetViewCommand
  | AddMapLayerCommand
  | UpdateMapLayerCommand
  | RemoveMapLayerCommand
  | SetLayerVisibilityCommand
  | SetLayerOpacityCommand
  | ImportDataCommand
  | ExportDataCommand
  | UndoCommand
  | RedoCommand
  | ClearHistoryCommand
  | QueryDataCommand
  | ShowContextMenuCommand
  | ExecuteContextActionCommand;

// Command result
export interface CommandResult {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// Command handler type
export type CommandHandler = (command: OrbatCommand) => Promise<CommandResult> | CommandResult;

// Command registry for validation and documentation
export interface CommandRegistry {
  [commandType: string]: {
    description: string;
    payloadSchema: any; // JSON schema
    permissions?: string[];
    validation?: (payload: any) => boolean;
  };
}