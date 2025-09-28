import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  EventMessage, 
  OrbatEventType 
} from '../types/orbat-bridge';
import type { 
  OrbatUnit, 
  OrbatEvent, 
  Position 
} from '../types/orbat-data';

interface EventHandler<T = any> {
  (data: T): void;
}

interface UseOrbatEventsOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface EventSubscription {
  id: string;
  eventType: OrbatEventType;
  handler: EventHandler;
  filters?: Record<string, any>;
}

interface UseOrbatEventsResult {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Event subscription
  subscribe: <T = any>(
    eventType: OrbatEventType, 
    handler: EventHandler<T>, 
    filters?: Record<string, any>
  ) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  
  // Convenience subscriptions
  onUnitChanged: (handler: EventHandler<OrbatUnit>) => string;
  onUnitAdded: (handler: EventHandler<OrbatUnit>) => string;
  onUnitRemoved: (handler: EventHandler<{ id: string }>) => string;
  onUnitMoved: (handler: EventHandler<{ id: string; position: Position }>) => string;
  onUnitSelected: (handler: EventHandler<{ id: string }>) => string;
  
  onEventTriggered: (handler: EventHandler<OrbatEvent>) => string;
  onEventAdded: (handler: EventHandler<OrbatEvent>) => string;
  onEventRemoved: (handler: EventHandler<{ id: string }>) => string;
  
  onMapViewChanged: (handler: EventHandler<any>) => string;
  onLayerToggled: (handler: EventHandler<{ layerId: string; visible: boolean }>) => string;
  
  onScenarioLoaded: (handler: EventHandler<{ scenarioId: string }>) => string;
  onScenarioChanged: (handler: EventHandler<any>) => string;
  
  onSystemError: (handler: EventHandler<{ error: string; details?: any }>) => string;
  onSystemReady: (handler: EventHandler<any>) => string;
  
  // Event emission
  emit: (eventType: OrbatEventType, data?: any) => void;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Event history
  eventHistory: EventMessage[];
  clearHistory: () => void;
  getEventsByType: (eventType: OrbatEventType) => EventMessage[];
  
  // Statistics
  eventCounts: Record<OrbatEventType, number>;
  totalEvents: number;
  lastEventTime: Date | null;
}

export const useOrbatEvents = (options: UseOrbatEventsOptions = {}): UseOrbatEventsResult => {
  const { events: eventService } = useOrbat();
  const { 
    autoConnect = true, 
    reconnectAttempts = 3, 
    reconnectDelay = 1000 
  } = options;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Event management
  const [subscriptions, setSubscriptions] = useState<Map<string, EventSubscription>>(new Map());
  const [eventHistory, setEventHistory] = useState<EventMessage[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<OrbatEventType, number>>({} as Record<OrbatEventType, number>);

  // Generate unique subscription ID
  const generateSubscriptionId = useCallback(() => {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Subscribe to events
  const subscribe = useCallback(<T = any>(
    eventType: OrbatEventType, 
    handler: EventHandler<T>, 
    filters?: Record<string, any>
  ): string => {
    const subscriptionId = generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      filters
    };

    setSubscriptions(prev => new Map(prev).set(subscriptionId, subscription));

    // Register with event service
    if (eventService) {
      eventService.subscribe(eventType, (data: T) => {
        // Apply filters if provided
        if (filters && !matchesFilters(data, filters)) {
          return;
        }
        
        handler(data);
        
        // Update event history
        const eventMessage: EventMessage = {
          id: `event_${Date.now()}`,
          type: 'EVENT',
          eventType,
          data,
          timestamp: new Date()
        };
        
        setEventHistory(prev => [...prev.slice(-99), eventMessage]);
        setEventCounts(prev => ({
          ...prev,
          [eventType]: (prev[eventType] || 0) + 1
        }));
      });
    }

    return subscriptionId;
  }, [eventService, generateSubscriptionId]);

  // Helper function to match filters
  const matchesFilters = useCallback((data: any, filters: Record<string, any>): boolean => {
    return Object.entries(filters).every(([key, value]) => {
      if (data && typeof data === 'object') {
        return data[key] === value;
      }
      return false;
    });
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((subscriptionId: string) => {
    setSubscriptions(prev => {
      const subscription = prev.get(subscriptionId);
      if (subscription && eventService) {
        eventService.unsubscribe(subscription.eventType, subscription.handler);
      }
      const newMap = new Map(prev);
      newMap.delete(subscriptionId);
      return newMap;
    });
  }, [eventService]);

  // Unsubscribe from all events
  const unsubscribeAll = useCallback(() => {
    setSubscriptions(prev => {
      if (eventService) {
        prev.forEach((subscription) => {
          eventService.unsubscribe(subscription.eventType, subscription.handler);
        });
      }
      return new Map();
    });
  }, [eventService]);

  // Convenience subscription methods
  const onUnitChanged = useCallback((handler: EventHandler<OrbatUnit>) => 
    subscribe('UNIT_CHANGED', handler), [subscribe]);

  const onUnitAdded = useCallback((handler: EventHandler<OrbatUnit>) => 
    subscribe('UNIT_ADDED', handler), [subscribe]);

  const onUnitRemoved = useCallback((handler: EventHandler<{ id: string }>) => 
    subscribe('UNIT_REMOVED', handler), [subscribe]);

  const onUnitMoved = useCallback((handler: EventHandler<{ id: string; position: Position }>) => 
    subscribe('UNIT_MOVED', handler), [subscribe]);

  const onUnitSelected = useCallback((handler: EventHandler<{ id: string }>) => 
    subscribe('UNIT_SELECTED', handler), [subscribe]);

  const onEventTriggered = useCallback((handler: EventHandler<OrbatEvent>) => 
    subscribe('EVENT_TRIGGERED', handler), [subscribe]);

  const onEventAdded = useCallback((handler: EventHandler<OrbatEvent>) => 
    subscribe('EVENT_ADDED', handler), [subscribe]);

  const onEventRemoved = useCallback((handler: EventHandler<{ id: string }>) => 
    subscribe('EVENT_REMOVED', handler), [subscribe]);

  const onMapViewChanged = useCallback((handler: EventHandler<any>) => 
    subscribe('MAP_VIEW_CHANGED', handler), [subscribe]);

  const onLayerToggled = useCallback((handler: EventHandler<{ layerId: string; visible: boolean }>) => 
    subscribe('LAYER_TOGGLED', handler), [subscribe]);

  const onScenarioLoaded = useCallback((handler: EventHandler<{ scenarioId: string }>) => 
    subscribe('SCENARIO_LOADED', handler), [subscribe]);

  const onScenarioChanged = useCallback((handler: EventHandler<any>) => 
    subscribe('SCENARIO_CHANGED', handler), [subscribe]);

  const onSystemError = useCallback((handler: EventHandler<{ error: string; details?: any }>) => 
    subscribe('SYSTEM_ERROR', handler), [subscribe]);

  const onSystemReady = useCallback((handler: EventHandler<any>) => 
    subscribe('SYSTEM_READY', handler), [subscribe]);

  // Event emission
  const emit = useCallback((eventType: OrbatEventType, data?: any) => {
    if (eventService) {
      eventService.emit(eventType, data);
    }
  }, [eventService]);

  // Connection management
  const connect = useCallback(async () => {
    if (!eventService) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await eventService.connect();
      setIsConnected(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [eventService]);

  const disconnect = useCallback(() => {
    if (eventService) {
      eventService.disconnect();
      setIsConnected(false);
      // Clear subscriptions without calling unsubscribeAll to avoid dependency loop
      setSubscriptions(new Map());
    }
  }, [eventService]);

  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, reconnectDelay));
    await connect();
  }, [disconnect, connect, reconnectDelay]);

  // Event history utilities
  const clearHistory = useCallback(() => {
    setEventHistory([]);
    setEventCounts({} as Record<OrbatEventType, number>);
  }, []);

  const getEventsByType = useCallback((eventType: OrbatEventType) => {
    return eventHistory.filter(event => event.eventType === eventType);
  }, [eventHistory]);

  // Computed values
  const totalEvents = useMemo(() => 
    Object.values(eventCounts).reduce((sum, count) => sum + count, 0), 
    [eventCounts]
  );

  const lastEventTime = useMemo(() => {
    if (eventHistory.length === 0) return null;
    return eventHistory[eventHistory.length - 1].timestamp;
  }, [eventHistory]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && eventService && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, eventService, isConnected, isConnecting, connect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      unsubscribeAll();
      disconnect();
    };
  }, [unsubscribeAll, disconnect]);

  // Connection status monitoring  
  useEffect(() => {
    if (eventService) {
      const handleConnectionChange = (connected: boolean) => {
        setIsConnected(connected);
        // Remove auto-reconnect to prevent infinite loops
        // Auto-reconnect logic should be handled at a higher level
      };

      eventService.onConnectionChange?.(handleConnectionChange);
      
      return () => {
        eventService.offConnectionChange?.(handleConnectionChange);
      };
    }
  }, [eventService]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Event subscription
    subscribe,
    unsubscribe,
    unsubscribeAll,
    
    // Convenience subscriptions
    onUnitChanged,
    onUnitAdded,
    onUnitRemoved,
    onUnitMoved,
    onUnitSelected,
    onEventTriggered,
    onEventAdded,
    onEventRemoved,
    onMapViewChanged,
    onLayerToggled,
    onScenarioLoaded,
    onScenarioChanged,
    onSystemError,
    onSystemReady,
    
    // Event emission
    emit,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Event history
    eventHistory,
    clearHistory,
    getEventsByType,
    
    // Statistics
    eventCounts,
    totalEvents,
    lastEventTime
  };
};

export default useOrbatEvents;