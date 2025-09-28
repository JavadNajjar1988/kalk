/**
 * ORBAT State Synchronization
 * همگام‌سازی وضعیت بین React و ORBAT Mapper
 */

import { OrbatMessageBridge } from './OrbatMessageBridge';
import { OrbatEventAdapter } from './OrbatEventAdapter';
import { SelectionState, ViewState } from '../types/orbat-data';

export interface SyncState {
  selection: SelectionState;
  view: ViewState;
  timeline: {
    currentTime: number;
    isPlaying: boolean;
    speed: number;
  };
  scenario: {
    id?: string;
    name?: string;
    hasUnsavedChanges: boolean;
  };
}

export type StateChangeHandler = (state: Partial<SyncState>) => void;

export class OrbatStateSync {
  private bridge: OrbatMessageBridge;
  private eventAdapter: OrbatEventAdapter;
  private currentState: SyncState;
  private changeHandlers = new Set<StateChangeHandler>();
  private isInitialized = false;

  constructor(bridge: OrbatMessageBridge, eventAdapter: OrbatEventAdapter) {
    this.bridge = bridge;
    this.eventAdapter = eventAdapter;
    
    // Initialize default state
    this.currentState = {
      selection: {
        selectedUnitIds: [],
        selectedFeatureIds: [],
        selectedEventIds: [],
      },
      view: {
        mode: 'chart',
        zoom: 1,
        center: [0, 0],
        rotation: 0,
        selectedLayers: [],
        timePosition: 0,
        isPlaying: false,
        playbackSpeed: 1,
      },
      timeline: {
        currentTime: 0,
        isPlaying: false,
        speed: 1,
      },
      scenario: {
        hasUnsavedChanges: false,
      }
    };

    this.init();
  }

  private async init(): Promise<void> {
    // Wait for ORBAT to be ready
    await this.bridge.waitForReady();

    // Subscribe to relevant events
    this.setupEventListeners();

    // Request initial state
    await this.requestInitialState();

    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    // Selection events
    this.eventAdapter.onSelectionChanged((data) => {
      this.updateSelection({
        selectedUnitIds: data.selectedUnitIds || [],
        selectedFeatureIds: data.selectedFeatureIds || [],
        selectedEventIds: data.selectedEventIds || [],
        activeUnitId: data.activeUnitId,
        activeFeatureId: data.activeFeatureId,
        activeEventId: data.activeEventId,
      });
    });

    // View events
    this.eventAdapter.onViewModeChanged((data) => {
      this.updateView({
        mode: data.mode,
      });
    });

    this.eventAdapter.subscribeToType('view', 'zoomed', (event) => {
      this.updateView({
        zoom: event.data.zoom,
        center: event.data.center,
      });
    });

    this.eventAdapter.subscribeToType('view', 'panned', (event) => {
      this.updateView({
        center: event.data.center,
      });
    });

    // Timeline events
    this.eventAdapter.onTimelinePlay((data) => {
      this.updateTimeline({
        isPlaying: true,
        speed: data.speed || 1,
      });
    });

    this.eventAdapter.onTimelinePause((data) => {
      this.updateTimeline({
        isPlaying: false,
        currentTime: data.currentTime,
      });
    });

    this.eventAdapter.subscribeToType('timeline', 'seek', (event) => {
      this.updateTimeline({
        currentTime: event.data.time,
      });
    });

    this.eventAdapter.subscribeToType('timeline', 'speed_changed', (event) => {
      this.updateTimeline({
        speed: event.data.speed,
      });
    });

    // Scenario events
    this.eventAdapter.onScenarioLoaded((data) => {
      this.updateScenario({
        id: data.scenarioId,
        name: data.name,
        hasUnsavedChanges: false,
      });
    });

    this.eventAdapter.subscribeToType('scenario', 'changed', (event) => {
      this.updateScenario({
        hasUnsavedChanges: event.data.hasUnsavedChanges,
      });
    });

    this.eventAdapter.subscribeToType('scenario', 'saved', (event) => {
      this.updateScenario({
        hasUnsavedChanges: false,
      });
    });
  }

  private async requestInitialState(): Promise<void> {
    try {
      // Request all initial state data
      const [selectionData, viewData, timelineData, scenarioData] = await Promise.all([
        this.bridge.requestData('selection'),
        this.bridge.requestData('view'),
        this.bridge.requestData('timeline'),
        this.bridge.requestData('scenario'),
      ]);

      // Update state with received data
      if (selectionData) {
        this.updateSelection(selectionData, false);
      }

      if (viewData) {
        this.updateView(viewData, false);
      }

      if (timelineData) {
        this.updateTimeline(timelineData, false);
      }

      if (scenarioData) {
        this.updateScenario(scenarioData, false);
      }

    } catch (error) {
      console.error('Failed to request initial state:', error);
    }
  }

  // State update methods
  private updateSelection(newSelection: Partial<SelectionState>, notify = true): void {
    this.currentState.selection = {
      ...this.currentState.selection,
      ...newSelection,
    };

    if (notify) {
      this.notifyStateChange({ selection: this.currentState.selection });
    }
  }

  private updateView(newView: Partial<ViewState>, notify = true): void {
    this.currentState.view = {
      ...this.currentState.view,
      ...newView,
    };

    if (notify) {
      this.notifyStateChange({ view: this.currentState.view });
    }
  }

  private updateTimeline(newTimeline: Partial<SyncState['timeline']>, notify = true): void {
    this.currentState.timeline = {
      ...this.currentState.timeline,
      ...newTimeline,
    };

    if (notify) {
      this.notifyStateChange({ timeline: this.currentState.timeline });
    }
  }

  private updateScenario(newScenario: Partial<SyncState['scenario']>, notify = true): void {
    this.currentState.scenario = {
      ...this.currentState.scenario,
      ...newScenario,
    };

    if (notify) {
      this.notifyStateChange({ scenario: this.currentState.scenario });
    }
  }

  private notifyStateChange(changes: Partial<SyncState>): void {
    this.changeHandlers.forEach(handler => {
      try {
        handler(changes);
      } catch (error) {
        console.error('Error in state change handler:', error);
      }
    });
  }

  // Public methods to access state
  public getState(): SyncState {
    return { ...this.currentState };
  }

  public getSelection(): SelectionState {
    return { ...this.currentState.selection };
  }

  public getView(): ViewState {
    return { ...this.currentState.view };
  }

  public getTimeline(): SyncState['timeline'] {
    return { ...this.currentState.timeline };
  }

  public getScenario(): SyncState['scenario'] {
    return { ...this.currentState.scenario };
  }

  // Subscribe to state changes
  public onStateChange(handler: StateChangeHandler): () => void {
    this.changeHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.changeHandlers.delete(handler);
    };
  }

  // Methods to send state changes to ORBAT
  public async setSelection(selection: Partial<SelectionState>): Promise<void> {
    try {
      if (selection.selectedUnitIds !== undefined) {
        await this.bridge.sendCommand('SELECT_UNITS', {
          unitIds: selection.selectedUnitIds,
          mode: 'set'
        });
      }

      if (selection.selectedFeatureIds !== undefined) {
        await this.bridge.sendCommand('SELECT_FEATURES', {
          featureIds: selection.selectedFeatureIds,
          mode: 'set'
        });
      }

      if (selection.activeUnitId !== undefined) {
        await this.bridge.sendCommand('SET_ACTIVE_ITEM', {
          itemType: 'unit',
          itemId: selection.activeUnitId
        });
      }

      if (selection.activeFeatureId !== undefined) {
        await this.bridge.sendCommand('SET_ACTIVE_ITEM', {
          itemType: 'feature',
          itemId: selection.activeFeatureId
        });
      }

    } catch (error) {
      console.error('Failed to set selection:', error);
      throw error;
    }
  }

  public async setViewMode(mode: ViewState['mode']): Promise<void> {
    try {
      await this.bridge.sendCommand('SET_VIEW_MODE', { mode });
    } catch (error) {
      console.error('Failed to set view mode:', error);
      throw error;
    }
  }

  public async setView(view: Partial<Pick<ViewState, 'center' | 'zoom' | 'rotation'>>): Promise<void> {
    try {
      await this.bridge.sendCommand('SET_VIEW', {
        center: view.center || this.currentState.view.center,
        zoom: view.zoom || this.currentState.view.zoom,
        rotation: view.rotation || this.currentState.view.rotation,
        animate: true
      });
    } catch (error) {
      console.error('Failed to set view:', error);
      throw error;
    }
  }

  public async playTimeline(speed = 1): Promise<void> {
    try {
      await this.bridge.sendCommand('PLAY_TIMELINE', { speed });
    } catch (error) {
      console.error('Failed to play timeline:', error);
      throw error;
    }
  }

  public async pauseTimeline(): Promise<void> {
    try {
      await this.bridge.sendCommand('PAUSE_TIMELINE', {});
    } catch (error) {
      console.error('Failed to pause timeline:', error);
      throw error;
    }
  }

  public async seekTimeline(time: number): Promise<void> {
    try {
      await this.bridge.sendCommand('SEEK_TIMELINE', { time });
    } catch (error) {
      console.error('Failed to seek timeline:', error);
      throw error;
    }
  }

  public async setTimelineSpeed(speed: number): Promise<void> {
    try {
      await this.bridge.sendCommand('SET_TIMELINE_SPEED', { speed });
    } catch (error) {
      console.error('Failed to set timeline speed:', error);
      throw error;
    }
  }

  // Utility methods
  public get initialized(): boolean {
    return this.isInitialized;
  }

  public async refresh(): Promise<void> {
    await this.requestInitialState();
  }

  public reset(): void {
    this.currentState = {
      selection: {
        selectedUnitIds: [],
        selectedFeatureIds: [],
        selectedEventIds: [],
      },
      view: {
        mode: 'chart',
        zoom: 1,
        center: [0, 0],
        rotation: 0,
        selectedLayers: [],
        timePosition: 0,
        isPlaying: false,
        playbackSpeed: 1,
      },
      timeline: {
        currentTime: 0,
        isPlaying: false,
        speed: 1,
      },
      scenario: {
        hasUnsavedChanges: false,
      }
    };

    this.notifyStateChange(this.currentState);
  }
}