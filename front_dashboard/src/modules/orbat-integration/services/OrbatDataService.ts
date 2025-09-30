/**
 * ORBAT Data Service
 * سرویس مدیریت داده‌های ORBAT
 */

import { OrbatMessageBridge } from '../adapters/OrbatMessageBridge';
import { 
  OrbatScenario, 
  OrbatUnit, 
  OrbatEvent, 
  OrbatLayer,
  SelectionState,
  ViewState 
} from '../types/orbat-data';

export interface DataQuery {
  type: 'scenarios' | 'units' | 'events' | 'layers' | 'selection' | 'timeline' | 'view';
  params?: {
    unitIds?: string[];
    layerIds?: string[];
    timeRange?: [number, number];
    spatial?: [number, number, number, number]; // bbox
    filters?: Record<string, any>;
  };
}

export interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

export class OrbatDataService {
  private bridge: OrbatMessageBridge;
  private cache: DataCache = {};
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private subscribers = new Map<string, Set<(data: any) => void>>();

  constructor(bridge: OrbatMessageBridge) {
    this.bridge = bridge;
    this.init();
  }

  private init(): void {
    // Clean up cache periodically
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Every minute
  }

  // Generic data fetching
  public async getData(query: DataQuery, useCache = true): Promise<any> {
    const cacheKey = this.getCacheKey(query);
    
    // Check cache first
    if (useCache && this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    try {
      // Request data from ORBAT
      const data = await this.bridge.requestData(query.type, query.params);
      
      // Cache the result
      this.setCache(cacheKey, data);
      
      // Notify subscribers
      this.notifySubscribers(query.type, data);
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${query.type}:`, error);
      throw error;
    }
  }

  // Scenario data
  public async getScenarios(): Promise<OrbatScenario[]> {
    return this.getData({ type: 'scenarios' });
  }

  public async getCurrentScenario(): Promise<OrbatScenario | null> {
    const scenarios = await this.getScenarios();
    return scenarios.find((s: any) => s.isCurrent) || scenarios[0] || null;
  }

  // Unit data
  public async getUnits(unitIds?: string[]): Promise<OrbatUnit[]> {
    return this.getData({ 
      type: 'units',
      params: unitIds ? { unitIds } : undefined
    });
  }

  public async getUnit(unitId: string): Promise<OrbatUnit | null> {
    const units = await this.getUnits([unitId]);
    return units[0] || null;
  }

  public async getUnitsByParent(parentId: string): Promise<OrbatUnit[]> {
    const allUnits = await this.getUnits();
    return allUnits.filter((unit: any) => unit.parentId === parentId);
  }

  public async getUnitHierarchy(rootUnitId?: string): Promise<OrbatUnit[]> {
    const allUnits = await this.getUnits();
    return this.buildHierarchy(allUnits, rootUnitId);
  }

  private buildHierarchy(units: OrbatUnit[], parentId?: string): OrbatUnit[] {
    const result: OrbatUnit[] = [];
    
    for (const unit of units) {
      if ((unit as any).parentId === parentId) {
        const unitWithChildren = {
          ...unit,
          subUnits: this.buildHierarchy(units, unit.id)
        };
        result.push(unitWithChildren);
      }
    }
    
    return result;
  }

  // Event data
  public async getEvents(timeRange?: [number, number]): Promise<OrbatEvent[]> {
    return this.getData({
      type: 'events',
      params: timeRange ? { timeRange } : undefined
    });
  }

  public async getEventsForUnit(unitId: string): Promise<OrbatEvent[]> {
    const allEvents = await this.getEvents();
    return allEvents.filter((event: any) => 
      event.involvedUnits?.includes(unitId)
    );
  }

  public async getEventsInTimeRange(startTime: number, endTime: number): Promise<OrbatEvent[]> {
    return this.getEvents([startTime, endTime]);
  }

  // Layer data
  public async getLayers(): Promise<OrbatLayer[]> {
    return this.getData({ type: 'layers' });
  }

  public async getLayer(layerId: string): Promise<OrbatLayer | null> {
    const layers = await this.getLayers();
    return layers.find((layer: any) => layer.id === layerId) || null;
  }

  public async getVisibleLayers(): Promise<OrbatLayer[]> {
    const layers = await this.getLayers();
    return layers.filter((layer: any) => layer.visible);
  }

  // Selection and view state
  public async getSelection(): Promise<SelectionState> {
    return this.getData({ type: 'selection' });
  }

  public async getView(): Promise<ViewState> {
    return this.getData({ type: 'view' });
  }

  public async getTimeline(): Promise<any> {
    return this.getData({ type: 'timeline' });
  }

  // Spatial queries
  public async getUnitsInBounds(bounds: [number, number, number, number]): Promise<OrbatUnit[]> {
    return this.getData({
      type: 'units',
      params: { spatial: bounds }
    });
  }

  public async getFeaturesInBounds(bounds: [number, number, number, number]): Promise<any[]> {
    const layers = await this.getData({
      type: 'layers',
      params: { spatial: bounds }
    });
    
    const features: any[] = [];
    for (const layer of layers) {
      if (layer.features) {
        features.push(...layer.features);
      }
    }
    
    return features;
  }

  // Search functionality
  public async searchUnits(query: string): Promise<OrbatUnit[]> {
    const allUnits = await this.getUnits();
    const lowerQuery = query.toLowerCase();
    
    return allUnits.filter((unit: OrbatUnit) => 
      unit.name.toLowerCase().includes(lowerQuery) ||
      unit.description?.toLowerCase().includes(lowerQuery) ||
      unit.shortName?.toLowerCase().includes(lowerQuery)
    );
  }

  public async searchEvents(query: string): Promise<OrbatEvent[]> {
    const allEvents = await this.getEvents();
    const lowerQuery = query.toLowerCase();
    
    return allEvents.filter((event: OrbatEvent) => 
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.subTitle?.toLowerCase().includes(lowerQuery)
    );
  }

  // Statistics
  public async getUnitStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySide: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const units = await this.getUnits();
    
    const stats = {
      total: units.length,
      byType: {} as Record<string, number>,
      bySide: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };

    for (const unit of units) {
      // Count by type (derived from SIDC)
      const unitType = this.getUnitTypeFromSIDC(unit.sidc);
      stats.byType[unitType] = (stats.byType[unitType] || 0) + 1;

      // Count by side
      const sideId = (unit as any)._sid || 'unknown';
      stats.bySide[sideId] = (stats.bySide[sideId] || 0) + 1;

      // Count by status
      const status = (unit as any).status || 'active';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    }

    return stats;
  }

  private getUnitTypeFromSIDC(sidc: string): string {
    // Simple SIDC parsing - in real implementation use proper SIDC library
    if (sidc.length >= 10) {
      const symbolSet = sidc.substring(4, 6);
      const entity = sidc.substring(6, 8);
      return `${symbolSet}_${entity}`;
    }
    return 'unknown';
  }

  // Subscription system
  public subscribe(dataType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Set());
    }
    
    this.subscribers.get(dataType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(dataType);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(dataType);
        }
      }
    };
  }

  private notifySubscribers(dataType: string, data: any): void {
    const subs = this.subscribers.get(dataType);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in data subscriber:', error);
        }
      });
    }
  }

  // Cache management
  private getCacheKey(query: DataQuery): string {
    return `${query.type}_${JSON.stringify(query.params || {})}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < cached.ttl;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, cached] of Object.entries(this.cache)) {
      if ((now - cached.timestamp) > cached.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      delete this.cache[key];
    });
  }

  // Cache control
  public clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      const keysToDelete = Object.keys(this.cache).filter(key => regex.test(key));
      keysToDelete.forEach(key => delete this.cache[key]);
    } else {
      this.cache = {};
    }
  }

  public getCacheStats(): {
    size: number;
    keys: string[];
    totalMemory: number;
  } {
    const keys = Object.keys(this.cache);
    const totalMemory = JSON.stringify(this.cache).length;
    
    return {
      size: keys.length,
      keys,
      totalMemory
    };
  }

  // Force refresh
  public async refresh(dataType?: string): Promise<void> {
    if (dataType) {
      this.clearCache(`^${dataType}_`);
    } else {
      this.clearCache();
    }
  }
}