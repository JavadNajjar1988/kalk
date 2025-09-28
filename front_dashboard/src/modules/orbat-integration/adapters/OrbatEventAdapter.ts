/**
 * ORBAT Event Adapter
 * تبدیل و فیلتر رویدادهای ORBAT برای React
 */

import { OrbatEvent, EventListener, EventFilter, EventSubscription } from '../types/orbat-events';
import { EventMessage } from '../types/orbat-bridge';
import { OrbatMessageBridge } from './OrbatMessageBridge';

export class OrbatEventAdapter {
  private bridge: OrbatMessageBridge;
  private subscriptions = new Map<string, EventSubscription>();
  private subscriptionId = 0;

  constructor(bridge: OrbatMessageBridge) {
    this.bridge = bridge;
    this.init();
  }

  private init(): void {
    // Listen to all ORBAT events
    this.bridge.onMessage('ORBAT_EVENT', this.handleOrbatEvent.bind(this));
  }

  private handleOrbatEvent(message: EventMessage): void {
    // Convert message to typed event
    const event = this.convertMessageToEvent(message);
    if (!event) return;

    // Dispatch to matching subscriptions
    this.subscriptions.forEach(subscription => {
      if (subscription.active && this.matchesFilter(event, subscription.filter)) {
        try {
          subscription.listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    });
  }

  private convertMessageToEvent(message: EventMessage): OrbatEvent | null {
    try {
      // Map ORBAT event types to our typed events
      const { eventType, data } = message;
      
      // Extract category and type from eventType (e.g., "scenario:loaded")
      const [category, type] = eventType.split(':');
      
      return {
        category: category as any,
        type,
        data
      } as OrbatEvent;
    } catch (error) {
      console.error('Failed to convert ORBAT event:', error);
      return null;
    }
  }

  private matchesFilter(event: OrbatEvent, filter?: EventFilter): boolean {
    if (!filter) return true;

    // Check category filter
    if (filter.categories && !filter.categories.includes(event.category)) {
      return false;
    }

    // Check type filter
    if (filter.types && !filter.types.includes(event.type)) {
      return false;
    }

    // Check unit ID filter
    if (filter.unitIds && event.data) {
      const eventUnitIds = this.extractUnitIds(event.data);
      if (eventUnitIds.length > 0 && !eventUnitIds.some(id => filter.unitIds!.includes(id))) {
        return false;
      }
    }

    // Check feature ID filter
    if (filter.featureIds && event.data) {
      const eventFeatureIds = this.extractFeatureIds(event.data);
      if (eventFeatureIds.length > 0 && !eventFeatureIds.some(id => filter.featureIds!.includes(id))) {
        return false;
      }
    }

    return true;
  }

  private extractUnitIds(data: any): string[] {
    const unitIds: string[] = [];
    
    if (typeof data === 'object' && data !== null) {
      // Look for common unit ID fields
      if (data.unitId) unitIds.push(data.unitId);
      if (data.unitIds) unitIds.push(...data.unitIds);
      if (data.selectedUnitIds) unitIds.push(...data.selectedUnitIds);
      if (data.activeUnitId) unitIds.push(data.activeUnitId);
      if (data.involvedUnits) unitIds.push(...data.involvedUnits);
    }

    return unitIds;
  }

  private extractFeatureIds(data: any): string[] {
    const featureIds: string[] = [];
    
    if (typeof data === 'object' && data !== null) {
      // Look for common feature ID fields
      if (data.featureId) featureIds.push(data.featureId);
      if (data.featureIds) featureIds.push(...data.featureIds);
      if (data.selectedFeatureIds) featureIds.push(...data.selectedFeatureIds);
      if (data.activeFeatureId) featureIds.push(data.activeFeatureId);
    }

    return featureIds;
  }

  // Subscribe to events with optional filter
  public subscribe(listener: EventListener, filter?: EventFilter): string {
    const id = `subscription_${++this.subscriptionId}`;
    
    const subscription: EventSubscription = {
      id,
      filter,
      listener,
      active: true
    };

    this.subscriptions.set(id, subscription);
    return id;
  }

  // Subscribe to specific event category
  public subscribeToCategory(category: string, listener: EventListener): string {
    return this.subscribe(listener, { categories: [category as any] });
  }

  // Subscribe to specific event type
  public subscribeToType(category: string, type: string, listener: EventListener): string {
    return this.subscribe(listener, { 
      categories: [category as any], 
      types: [type] 
    });
  }

  // Subscribe to unit-related events
  public subscribeToUnit(unitId: string, listener: EventListener): string {
    return this.subscribe(listener, { unitIds: [unitId] });
  }

  // Subscribe to multiple units
  public subscribeToUnits(unitIds: string[], listener: EventListener): string {
    return this.subscribe(listener, { unitIds });
  }

  // Subscribe to feature-related events
  public subscribeToFeature(featureId: string, listener: EventListener): string {
    return this.subscribe(listener, { featureIds: [featureId] });
  }

  // Unsubscribe from events
  public unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  // Pause subscription
  public pauseSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      return true;
    }
    return false;
  }

  // Resume subscription
  public resumeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = true;
      return true;
    }
    return false;
  }

  // Get active subscriptions
  public getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  // Clear all subscriptions
  public clearAll(): void {
    this.subscriptions.clear();
  }

  // Convenience methods for common event types
  public onScenarioLoaded(listener: (data: any) => void): string {
    return this.subscribeToType('scenario', 'loaded', (event) => {
      listener(event.data);
    });
  }

  public onUnitAdded(listener: (data: any) => void): string {
    return this.subscribeToType('unit', 'added', (event) => {
      listener(event.data);
    });
  }

  public onUnitUpdated(listener: (data: any) => void): string {
    return this.subscribeToType('unit', 'updated', (event) => {
      listener(event.data);
    });
  }

  public onUnitDeleted(listener: (data: any) => void): string {
    return this.subscribeToType('unit', 'deleted', (event) => {
      listener(event.data);
    });
  }

  public onSelectionChanged(listener: (data: any) => void): string {
    return this.subscribeToType('selection', 'changed', (event) => {
      listener(event.data);
    });
  }

  public onTimelinePlay(listener: (data: any) => void): string {
    return this.subscribeToType('timeline', 'play', (event) => {
      listener(event.data);
    });
  }

  public onTimelinePause(listener: (data: any) => void): string {
    return this.subscribeToType('timeline', 'pause', (event) => {
      listener(event.data);
    });
  }

  public onViewModeChanged(listener: (data: any) => void): string {
    return this.subscribeToType('view', 'mode_changed', (event) => {
      listener(event.data);
    });
  }

  public onMapClick(listener: (data: any) => void): string {
    return this.subscribeToType('map', 'click', (event) => {
      listener(event.data);
    });
  }

  public onMapRightClick(listener: (data: any) => void): string {
    return this.subscribeToType('map', 'right_click', (event) => {
      listener(event.data);
    });
  }

  public onCommandExecuted(listener: (data: any) => void): string {
    return this.subscribeToType('command', 'executed', (event) => {
      listener(event.data);
    });
  }

  public onSystemError(listener: (data: any) => void): string {
    return this.subscribeToType('system', 'error', (event) => {
      listener(event.data);
    });
  }

  // Statistics
  public getSubscriptionStats(): {
    total: number;
    active: number;
    paused: number;
    byCategory: Record<string, number>;
  } {
    const stats = {
      total: this.subscriptions.size,
      active: 0,
      paused: 0,
      byCategory: {} as Record<string, number>
    };

    this.subscriptions.forEach(sub => {
      if (sub.active) {
        stats.active++;
      } else {
        stats.paused++;
      }

      // Count by category if filter exists
      if (sub.filter?.categories) {
        sub.filter.categories.forEach(category => {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });
      }
    });

    return stats;
  }
}