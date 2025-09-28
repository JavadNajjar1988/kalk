/**
 * ORBAT Command Handler
 * مدیریت و اجرای دستورات به ORBAT Mapper
 */

import { OrbatMessageBridge } from './OrbatMessageBridge';
import { OrbatCommand, CommandResult, CommandRegistry } from '../types/orbat-commands';

export interface CommandOptions {
  timeout?: number;
  retries?: number;
  validatePayload?: boolean;
}

export class OrbatCommandHandler {
  private bridge: OrbatMessageBridge;
  private commandHistory: CommandResult[] = [];
  private maxHistorySize = 100;
  private registry: CommandRegistry = {};

  constructor(bridge: OrbatMessageBridge) {
    this.bridge = bridge;
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    // Register known commands with their schemas
    this.registry = {
      'LOAD_SCENARIO': {
        description: 'Load a scenario from various sources',
        payloadSchema: {
          type: 'object',
          properties: {
            scenarioId: { type: 'string' },
            source: { type: 'string', enum: ['local', 'indexeddb', 'url', 'data'] },
            data: { type: 'object' },
            url: { type: 'string' }
          },
          required: ['source']
        }
      },
      'SAVE_SCENARIO': {
        description: 'Save current scenario',
        payloadSchema: {
          type: 'object',
          properties: {
            destination: { type: 'string', enum: ['local', 'indexeddb', 'download'] },
            name: { type: 'string' },
            format: { type: 'string', enum: ['json', 'zip'] }
          },
          required: ['destination']
        }
      },
      'ADD_UNIT': {
        description: 'Add a new unit to the scenario',
        payloadSchema: {
          type: 'object',
          properties: {
            parentId: { type: 'string' },
            sideId: { type: 'string' },
            groupId: { type: 'string' },
            unitData: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sidc: { type: 'string' },
                location: { type: 'array', items: { type: 'number' } }
              },
              required: ['name', 'sidc']
            }
          },
          required: ['sideId', 'groupId', 'unitData']
        }
      },
      'UPDATE_UNIT': {
        description: 'Update an existing unit',
        payloadSchema: {
          type: 'object',
          properties: {
            unitId: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['unitId', 'updates']
        }
      },
      'DELETE_UNIT': {
        description: 'Delete a unit',
        payloadSchema: {
          type: 'object',
          properties: {
            unitId: { type: 'string' },
            deleteChildren: { type: 'boolean' }
          },
          required: ['unitId']
        }
      },
      'SELECT_UNITS': {
        description: 'Select units',
        payloadSchema: {
          type: 'object',
          properties: {
            unitIds: { type: 'array', items: { type: 'string' } },
            mode: { type: 'string', enum: ['set', 'add', 'remove', 'toggle'] }
          },
          required: ['unitIds', 'mode']
        }
      },
      'SET_VIEW_MODE': {
        description: 'Change view mode',
        payloadSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['chart', 'map', 'grid', 'story'] }
          },
          required: ['mode']
        }
      },
      'ZOOM_TO': {
        description: 'Zoom to target',
        payloadSchema: {
          type: 'object',
          properties: {
            target: { type: 'string', enum: ['unit', 'feature', 'extent', 'coordinate'] },
            targetId: { type: 'string' },
            extent: { type: 'array', items: { type: 'number' } },
            coordinate: { type: 'array', items: { type: 'number' } },
            zoom: { type: 'number' },
            animate: { type: 'boolean' }
          },
          required: ['target']
        }
      },
      'PLAY_TIMELINE': {
        description: 'Start timeline playback',
        payloadSchema: {
          type: 'object',
          properties: {
            startTime: { type: 'number' },
            speed: { type: 'number' }
          }
        }
      },
      'PAUSE_TIMELINE': {
        description: 'Pause timeline playback',
        payloadSchema: { type: 'object' }
      },
      'SEEK_TIMELINE': {
        description: 'Seek to specific time',
        payloadSchema: {
          type: 'object',
          properties: {
            time: { type: 'number' }
          },
          required: ['time']
        }
      }
    };
  }

  // Execute a command
  public async execute(command: string, payload?: any, options: CommandOptions = {}): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Validate command
      if (options.validatePayload !== false) {
        const validation = this.validateCommand(command, payload);
        if (!validation.valid) {
          throw new Error(`Invalid command payload: ${validation.errors.join(', ')}`);
        }
      }

      // Execute command through bridge
      const result = await this.bridge.sendCommand(command, payload);
      
      const commandResult: CommandResult = {
        commandId: `${command}_${Date.now()}`,
        success: true,
        data: result,
        timestamp: startTime
      };

      // Add to history
      this.addToHistory(commandResult);
      
      return commandResult;

    } catch (error) {
      const commandResult: CommandResult = {
        commandId: `${command}_${Date.now()}`,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: startTime
      };

      // Add to history
      this.addToHistory(commandResult);
      
      throw error;
    }
  }

  // Scenario commands
  public async loadScenario(options: {
    scenarioId?: string;
    source: 'local' | 'indexeddb' | 'url' | 'data';
    data?: any;
    url?: string;
  }): Promise<CommandResult> {
    return this.execute('LOAD_SCENARIO', options);
  }

  public async saveScenario(options: {
    destination: 'local' | 'indexeddb' | 'download';
    name?: string;
    format?: 'json' | 'zip';
  }): Promise<CommandResult> {
    return this.execute('SAVE_SCENARIO', options);
  }

  public async newScenario(name: string, description?: string, template?: string): Promise<CommandResult> {
    return this.execute('NEW_SCENARIO', { name, description, template });
  }

  // Unit commands
  public async addUnit(
    sideId: string, 
    groupId: string, 
    unitData: any, 
    parentId?: string
  ): Promise<CommandResult> {
    return this.execute('ADD_UNIT', {
      parentId,
      sideId,
      groupId,
      unitData
    });
  }

  public async updateUnit(unitId: string, updates: any): Promise<CommandResult> {
    return this.execute('UPDATE_UNIT', { unitId, updates });
  }

  public async deleteUnit(unitId: string, deleteChildren = false): Promise<CommandResult> {
    return this.execute('DELETE_UNIT', { unitId, deleteChildren });
  }

  public async moveUnit(
    unitId: string, 
    newParentId?: string, 
    newPosition?: number,
    newLocation?: [number, number]
  ): Promise<CommandResult> {
    return this.execute('MOVE_UNIT', {
      unitId,
      newParentId,
      newPosition,
      newLocation
    });
  }

  public async duplicateUnit(unitId: string, includeChildren = true, newName?: string): Promise<CommandResult> {
    return this.execute('DUPLICATE_UNIT', { unitId, includeChildren, newName });
  }

  // Selection commands
  public async selectUnits(unitIds: string[], mode: 'set' | 'add' | 'remove' | 'toggle' = 'set'): Promise<CommandResult> {
    return this.execute('SELECT_UNITS', { unitIds, mode });
  }

  public async selectFeatures(featureIds: string[], mode: 'set' | 'add' | 'remove' | 'toggle' = 'set'): Promise<CommandResult> {
    return this.execute('SELECT_FEATURES', { featureIds, mode });
  }

  public async setActiveItem(itemType: 'unit' | 'feature' | 'event', itemId: string): Promise<CommandResult> {
    return this.execute('SET_ACTIVE_ITEM', { itemType, itemId });
  }

  public async clearSelection(): Promise<CommandResult> {
    return this.execute('CLEAR_SELECTION', {});
  }

  // View commands
  public async setViewMode(mode: 'chart' | 'map' | 'grid' | 'story'): Promise<CommandResult> {
    return this.execute('SET_VIEW_MODE', { mode });
  }

  public async zoomToUnit(unitId: string, zoom?: number, animate = true): Promise<CommandResult> {
    return this.execute('ZOOM_TO', {
      target: 'unit',
      targetId: unitId,
      zoom,
      animate
    });
  }

  public async zoomToExtent(extent: [number, number, number, number], animate = true): Promise<CommandResult> {
    return this.execute('ZOOM_TO', {
      target: 'extent',
      extent,
      animate
    });
  }

  public async zoomToCoordinate(coordinate: [number, number], zoom?: number, animate = true): Promise<CommandResult> {
    return this.execute('ZOOM_TO', {
      target: 'coordinate',
      coordinate,
      zoom,
      animate
    });
  }

  public async setView(center: [number, number], zoom: number, rotation = 0, animate = true): Promise<CommandResult> {
    return this.execute('SET_VIEW', { center, zoom, rotation, animate });
  }

  // Timeline commands
  public async playTimeline(startTime?: number, speed = 1): Promise<CommandResult> {
    return this.execute('PLAY_TIMELINE', { startTime, speed });
  }

  public async pauseTimeline(): Promise<CommandResult> {
    return this.execute('PAUSE_TIMELINE', {});
  }

  public async seekTimeline(time: number): Promise<CommandResult> {
    return this.execute('SEEK_TIMELINE', { time });
  }

  public async setTimelineSpeed(speed: number): Promise<CommandResult> {
    return this.execute('SET_TIMELINE_SPEED', { speed });
  }

  public async addTimelineEvent(
    startTime: number, 
    title: string, 
    description?: string, 
    unitIds?: string[]
  ): Promise<CommandResult> {
    return this.execute('ADD_TIMELINE_EVENT', {
      startTime,
      title,
      description,
      unitIds
    });
  }

  // Import/Export commands
  public async importData(
    format: string, 
    data: string | ArrayBuffer, 
    options?: any
  ): Promise<CommandResult> {
    return this.execute('IMPORT_DATA', { format, data, options });
  }

  public async exportData(
    format: string, 
    scope: 'scenario' | 'selected' | 'visible',
    options?: any
  ): Promise<CommandResult> {
    return this.execute('EXPORT_DATA', { format, scope, options });
  }

  // Undo/Redo commands
  public async undo(): Promise<CommandResult> {
    return this.execute('UNDO', {});
  }

  public async redo(): Promise<CommandResult> {
    return this.execute('REDO', {});
  }

  public async clearHistory(): Promise<CommandResult> {
    return this.execute('CLEAR_HISTORY', {});
  }

  // Validation
  private validateCommand(command: string, payload: any): { valid: boolean; errors: string[] } {
    const commandDef = this.registry[command];
    if (!commandDef) {
      return { valid: false, errors: [`Unknown command: ${command}`] };
    }

    // Simple validation - in real implementation, use a proper JSON schema validator
    const errors: string[] = [];
    
    if (commandDef.payloadSchema.required) {
      for (const requiredField of commandDef.payloadSchema.required) {
        if (!payload || payload[requiredField] === undefined) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // History management
  private addToHistory(result: CommandResult): void {
    this.commandHistory.push(result);
    
    // Keep only recent commands
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }
  }

  public getHistory(): CommandResult[] {
    return [...this.commandHistory];
  }

  public getSuccessfulCommands(): CommandResult[] {
    return this.commandHistory.filter(cmd => cmd.success);
  }

  public getFailedCommands(): CommandResult[] {
    return this.commandHistory.filter(cmd => !cmd.success);
  }

  public clearCommandHistory(): void {
    this.commandHistory = [];
  }

  // Registry management
  public registerCommand(
    command: string, 
    definition: CommandRegistry[string]
  ): void {
    this.registry[command] = definition;
  }

  public getCommandRegistry(): CommandRegistry {
    return { ...this.registry };
  }

  public isCommandSupported(command: string): boolean {
    return command in this.registry;
  }
}