/**
 * useOrbatBridge Hook
 * Hook اصلی برای ارتباط با ORBAT Bridge
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  OrbatMessage, 
  MessageType, 
  CommandMessage, 
  RequestMessage 
} from '../types/orbat-bridge';

export interface UseOrbatBridgeReturn {
  // State
  isReady: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Methods
  sendCommand: (command: string, payload?: any) => Promise<any>;
  requestData: (dataType: string, params?: any) => Promise<any>;
  sendMessage: (message: OrbatMessage) => void;
  
  // Event handling
  onMessage: (type: MessageType, handler: (message: OrbatMessage) => void) => () => void;
  onEvent: (eventType: string, handler: (data: any) => void) => () => void;
  onError: (handler: (error: string, details?: any) => void) => () => void;
  
  // Connection
  connect: (iframe: HTMLIFrameElement) => void;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Utilities
  waitForReady: () => Promise<void>;
  getConnectionStats: () => any;
}

export function useOrbatBridge(): UseOrbatBridgeReturn {
  const { bridge, isReady, isConnected, error, connect, disconnect, reconnect } = useOrbat();
  
  // Memoized methods
  const sendCommand = useCallback(async (command: string, payload?: any) => {
    return await bridge.sendCommand(command, payload);
  }, [bridge]);
  
  const requestData = useCallback(async (dataType: string, params?: any) => {
    return await bridge.requestData(dataType, params);
  }, [bridge]);
  
  const sendMessage = useCallback((message: OrbatMessage) => {
    // This would need to be implemented in the bridge
    console.warn('sendMessage not yet implemented');
  }, []);
  
  const onMessage = useCallback((type: MessageType, handler: (message: OrbatMessage) => void) => {
    return bridge.onMessage(type, handler);
  }, [bridge]);
  
  const onEvent = useCallback((eventType: string, handler: (data: any) => void) => {
    return bridge.onEvent(eventType, handler);
  }, [bridge]);
  
  const onError = useCallback((handler: (error: string, details?: any) => void) => {
    return bridge.onError(handler);
  }, [bridge]);
  
  const waitForReady = useCallback(() => {
    return bridge.waitForReady();
  }, [bridge]);
  
  const getConnectionStats = useCallback(() => {
    // Return basic stats
    return {
      isReady,
      isConnected,
      error,
      timestamp: Date.now()
    };
  }, [isReady, isConnected, error]);
  
  return {
    // State
    isReady,
    isConnected,
    error,
    
    // Methods
    sendCommand,
    requestData,
    sendMessage,
    
    // Event handling
    onMessage,
    onEvent,
    onError,
    
    // Connection
    connect,
    disconnect,
    reconnect,
    
    // Utilities
    waitForReady,
    getConnectionStats
  };
}

// Specialized hook for sending commands with error handling
export function useOrbatCommand() {
  const { commands, errors } = useOrbat();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const execute = useCallback(async (
    commandType: string,
    payload?: any,
    options?: { onSuccess?: (result: any) => void; onError?: (error: string) => void }
  ) => {
    setIsExecuting(true);
    setLastError(null);
    
    try {
      const result = await commands.execute(commandType, payload);
      setLastResult(result);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastError(errorMessage);
      options?.onError?.(errorMessage);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [commands]);
  
  return {
    execute,
    isExecuting,
    lastResult,
    lastError,
    
    // Convenience methods
    loadScenario: useCallback((scenarioId: string) => 
      execute('LOAD_SCENARIO', { source: 'local', scenarioId }), [execute]),
    
    addUnit: useCallback((sideId: string, groupId: string, unitData: any) =>
      execute('ADD_UNIT', { sideId, groupId, unitData }), [execute]),
    
    selectUnits: useCallback((unitIds: string[]) =>
      execute('SELECT_UNITS', { unitIds, mode: 'set' }), [execute]),
    
    setViewMode: useCallback((mode: string) =>
      execute('SET_VIEW_MODE', { mode }), [execute])
  };
}

// Hook for managing request state
export function useOrbatRequest<T = any>(
  dataType: string,
  params?: any,
  options?: {
    immediate?: boolean;
    dependencies?: any[];
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
) {
  const { data: dataService } = useOrbat();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const { immediate = true, dependencies = [], onSuccess, onError } = options || {};
  
  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dataService.getData({ type: dataType as any, params });
      setData(result);
      setLastFetch(Date.now());
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, dataType, params, onSuccess, onError]);
  
  const refresh = useCallback(() => {
    return fetch();
  }, [fetch]);
  
  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, [immediate, ...dependencies]);
  
  return {
    data,
    isLoading,
    error,
    lastFetch,
    fetch,
    refresh
  };
}