/**
 * ORBAT Provider - React Context Provider
 * ارائه‌دهنده Context برای دسترسی به سرویس‌های ORBAT
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef,
  ReactNode 
} from 'react';
import { OrbatMessageBridge } from '../adapters/OrbatMessageBridge';
import { OrbatEventAdapter } from '../adapters/OrbatEventAdapter';
import { OrbatCommandHandler } from '../adapters/OrbatCommandHandler';
import { OrbatStateSync } from '../adapters/OrbatStateSync';
import { 
  OrbatDataService,
  OrbatConfigService, 
  OrbatErrorService,
  OrbatValidationService 
} from '../services';
import type { OrbatConfig } from '../services/OrbatConfigService';

export interface OrbatContextValue {
  // Core services
  bridge: OrbatMessageBridge;
  events: OrbatEventAdapter;
  commands: OrbatCommandHandler;
  data: OrbatDataService;
  config: OrbatConfigService;
  errors: OrbatErrorService;
  stateSync: OrbatStateSync;
  validation: OrbatValidationService;
  
  // State
  isReady: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Methods
  connect: (iframe: HTMLIFrameElement) => void;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

const OrbatContext = createContext<OrbatContextValue | null>(null);

export interface OrbatProviderProps {
  children: ReactNode;
  config?: Partial<OrbatConfig>;
  onReady?: () => void;
  onError?: (error: string) => void;
  onDisconnect?: () => void;
}

export const OrbatProvider: React.FC<OrbatProviderProps> = ({
  children,
  config: initialConfig,
  onReady,
  onError,
  onDisconnect
}) => {
  // Services
  const servicesRef = useRef<{
    config: OrbatConfigService;
    errors: OrbatErrorService;
    bridge: OrbatMessageBridge;
    events: OrbatEventAdapter;
    commands: OrbatCommandHandler;
    data: OrbatDataService;
    stateSync: OrbatStateSync;
    validation: OrbatValidationService;
  } | null>(null);
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize services only once
  if (!servicesRef.current) {
    const configService = new OrbatConfigService(initialConfig);
    const errorService = new OrbatErrorService();
    const bridge = new OrbatMessageBridge(configService.getBridgeConfig());
    const events = new OrbatEventAdapter(bridge);
    const commands = new OrbatCommandHandler(bridge);
    const data = new OrbatDataService(bridge);
    const stateSync = new OrbatStateSync(bridge, events);
    const validation = new OrbatValidationService();
    
    servicesRef.current = {
      config: configService,
      errors: errorService,
      bridge,
      events,
      commands,
      data,
      stateSync,
      validation
    };
  }
  
  const services = servicesRef.current;
  
  // Setup event listeners
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // Bridge ready event
    unsubscribers.push(
      services.bridge.onMessage('ORBAT_READY', () => {
        setIsReady(true);
        setIsConnected(true);
        setError(null);
        onReady?.();
      })
    );
    
    // Bridge error events
    unsubscribers.push(
      services.bridge.onError((errorMessage) => {
        setError(errorMessage);
        onError?.(errorMessage);
      })
    );
    
    // Error service events
    unsubscribers.push(
      services.errors.onError('BRIDGE_ERROR', (error) => {
        setIsConnected(false);
        setError(error.message);
        onDisconnect?.();
      })
    );
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [services, onReady, onError, onDisconnect]);
  
  // Methods
  const connect = (iframe: HTMLIFrameElement) => {
    try {
      services.bridge.setIframe(iframe);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect iframe';
      setError(errorMessage);
      services.errors.reportBridgeError(errorMessage, err);
    }
  };
  
  const disconnect = () => {
    try {
      services.bridge.destroy();
      setIsReady(false);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      services.errors.reportBridgeError(errorMessage, err);
    }
  };
  
  const reconnect = async () => {
    try {
      setError(null);
      // Wait for bridge to be ready again
      await services.bridge.waitForReady();
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect';
      setError(errorMessage);
      services.errors.reportBridgeError(errorMessage, err);
      throw err;
    }
  };
  
  const contextValue: OrbatContextValue = {
    // Services
    bridge: services.bridge,
    events: services.events,
    commands: services.commands,
    data: services.data,
    config: services.config,
    errors: services.errors,
    stateSync: services.stateSync,
    validation: services.validation,
    
    // State
    isReady,
    isConnected,
    error,
    
    // Methods
    connect,
    disconnect,
    reconnect
  };
  
  return (
    <OrbatContext.Provider value={contextValue}>
      {children}
    </OrbatContext.Provider>
  );
};

// Hook to use ORBAT context
export const useOrbat = (): OrbatContextValue => {
  const context = useContext(OrbatContext);
  
  if (!context) {
    throw new Error('useOrbat must be used within an OrbatProvider');
  }
  
  return context;
};

// Hook to use specific ORBAT service
export const useOrbatService = <T extends keyof OrbatContextValue>(
  serviceName: T
): OrbatContextValue[T] => {
  const context = useOrbat();
  return context[serviceName];
};

// Convenience hooks for common services
export const useOrbatBridge = () => useOrbatService('bridge');
export const useOrbatEvents = () => useOrbatService('events');
export const useOrbatCommands = () => useOrbatService('commands');
export const useOrbatData = () => useOrbatService('data');
export const useOrbatConfig = () => useOrbatService('config');
export const useOrbatErrors = () => useOrbatService('errors');
export const useOrbatStateSync = () => useOrbatService('stateSync');
export const useOrbatValidation = () => useOrbatService('validation');