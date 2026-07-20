/**
 * Symbol Sync Service
 * سرویس همگام‌سازی نمادها - حفظ Real-time sync با ORBAT
 */

import React from 'react';
import { useOrbatEvents, useOrbatCommands } from '../../orbat-integration';
import { buildSIDC } from '../constants/militarySymbols';
import type { InitialSideData, RootUnitConfig } from '../types/new-scenario';

interface SymbolChangeEvent {
  type: 'SYMBOL_UPDATED' | 'UNIT_ADDED' | 'UNIT_REMOVED' | 'SIDE_UPDATED';
  sideIndex?: number;
  unitIndex?: number;
  data: any;
}

interface SymbolSyncOptions {
  onSymbolChange?: (event: SymbolChangeEvent) => void;
  enableRealtimeSync?: boolean;
  preserveOriginalFunctionality?: boolean;
}

export class SymbolSyncService {
  private orbatCommands?: ReturnType<typeof useOrbatCommands>;
  private orbatEvents?: ReturnType<typeof useOrbatEvents>;
  private options: SymbolSyncOptions;
  private syncEnabled = true;

  constructor(options: SymbolSyncOptions = {}) {
    this.options = {
      enableRealtimeSync: true,
      preserveOriginalFunctionality: true,
      ...options
    };
  }

  /**
   * Initialize sync service with ORBAT integration
   */
  initialize(
    orbatCommands: ReturnType<typeof useOrbatCommands>,
    orbatEvents: ReturnType<typeof useOrbatEvents>
  ) {
    // Validate inputs before proceeding
    if (!orbatCommands || !orbatEvents) {
      console.warn('Symbol sync service: Missing ORBAT commands or events');
      return;
    }

    this.orbatCommands = orbatCommands;
    this.orbatEvents = orbatEvents;

    if (this.options.enableRealtimeSync) {
      this.setupEventListeners();
    }
  }

  /**
   * Setup real-time event listeners
   */
  private setupEventListeners() {
    // Validate ORBAT events before setting up listeners
    if (!this.orbatEvents) {
      console.warn('Symbol sync service: Cannot setup event listeners - missing ORBAT events');
      return;
    }

    try {
      // Listen for ORBAT changes and sync back to form
      this.orbatEvents.onUnitChanged((data) => {
        if (this.syncEnabled) {
          this.options.onSymbolChange?.({
            type: 'SYMBOL_UPDATED',
            data
          });
        }
      });

      this.orbatEvents.onUnitAdded((data) => {
        if (this.syncEnabled) {
          this.options.onSymbolChange?.({
            type: 'UNIT_ADDED',
            data
          });
        }
      });

      this.orbatEvents.onUnitRemoved((data) => {
        if (this.syncEnabled) {
          this.options.onSymbolChange?.({
            type: 'UNIT_REMOVED',
            data
          });
        }
      });

      this.orbatEvents.onScenarioChanged((data) => {
        if (this.syncEnabled) {
          this.options.onSymbolChange?.({
            type: 'SIDE_UPDATED',
            data
          });
        }
      });
    } catch (error) {
      console.warn('Symbol sync service: Failed to setup event listeners:', error);
    }
  }

  /**
   * Sync side data to ORBAT (preserving original functionality)
   */
  async syncSideToOrbat(side: InitialSideData, sideIndex: number): Promise<void> {
    if (!this.options.preserveOriginalFunctionality) return;

    try {
      // Create ORBAT-compatible side data
      const orbatSide = {
        id: `side_${sideIndex}`,
        name: side.name,
        standardIdentity: side.standardIdentity,
        symbolOptions: side.symbolOptions,
        units: side.units.map((unit, unitIndex) => this.convertUnitToOrbat(unit, sideIndex, unitIndex))
      };

      // Use existing ORBAT commands (no rewriting)
      await this.orbatCommands?.executeCommand('UPDATE_UNIT', orbatSide);
    } catch (error) {
      console.warn('Failed to sync side to ORBAT:', error);
    }
  }

  /**
   * Sync unit data to ORBAT
   */
  async syncUnitToOrbat(
    unit: RootUnitConfig,
    sideIndex: number,
    unitIndex: number
  ): Promise<void> {
    if (!this.options.preserveOriginalFunctionality) return;

    try {
      const orbatUnit = this.convertUnitToOrbat(unit, sideIndex, unitIndex);
      await this.orbatCommands?.executeCommand('UPDATE_UNIT', orbatUnit);
    } catch (error) {
      console.warn('Failed to sync unit to ORBAT:', error);
    }
  }

  /**
   * Convert form unit to ORBAT-compatible format
   */
  private convertUnitToOrbat(unit: RootUnitConfig, sideIndex: number, unitIndex: number) {
    return {
      id: `unit_${sideIndex}_${unitIndex}`,
      name: unit.rootUnitName || 'ستاد',
      sidc: unit.rootUnitSidc || buildSIDC('3', unit.rootUnitEchelon, unit.rootUnitIcon),
      echelon: unit.rootUnitEchelon || '18',
      icon: unit.rootUnitIcon || '121100',
      // Preserve all original ORBAT properties
      _originalOrbatData: true
    };
  }

  /**
   * Get symbol preview data (no conflicts with battle layout)
   */
  getSymbolPreview(
    standardIdentity: string,
    echelon?: string,
    icon?: string,
    fillColor?: string
  ) {
    return {
      sidc: buildSIDC(standardIdentity, echelon, icon),
      fillColor,
      // Namespace to avoid conflicts with future battle layout
      _previewContext: 'newScenario'
    };
  }

  /**
   * Validate symbol configuration
   */
  validateSymbolConfiguration(side: InitialSideData): string[] {
    const errors: string[] = [];

    if (!side.name.trim()) {
      errors.push('نام طرف الزامی است');
    }

    side.units.forEach((unit, index) => {
      if (!unit.rootUnitName?.trim()) {
        errors.push(`نام واحد ${index + 1} الزامی است`);
      }
    });

    return errors;
  }

  /**
   * Enable/disable sync temporarily
   */
  setSyncEnabled(enabled: boolean) {
    this.syncEnabled = enabled;
  }

  /**
   * Get ORBAT compatibility status
   */
  getCompatibilityStatus() {
    return {
      orbatConnected: !!this.orbatCommands && !!this.orbatEvents,
      syncEnabled: this.syncEnabled,
      preservingOriginalFunctionality: this.options.preserveOriginalFunctionality
    };
  }
}

// Singleton instance for global use
export const symbolSyncService = new SymbolSyncService();

// Hook for easy integration
export const useSymbolSync = (options?: SymbolSyncOptions) => {
  const orbatCommands = useOrbatCommands();
  const orbatEvents = useOrbatEvents();

  React.useEffect(() => {
    // Only initialize if both hooks are available and options are provided
    if (options && orbatCommands && orbatEvents) {
      try {
        symbolSyncService.initialize(orbatCommands, orbatEvents);
      } catch (error) {
        console.warn('Failed to initialize symbol sync service:', error);
      }
    }
  }, [orbatCommands, orbatEvents, options]);

  return symbolSyncService;
};