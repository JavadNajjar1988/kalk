import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  OrbatCommandType, 
  CommandMessage, 
  ResponseMessage 
} from '../types/orbat-bridge';

// Error types and interfaces
export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  canApply: (error: Error) => boolean;
  priority: number; // Higher number = higher priority
}

export interface FallbackOption {
  name: string;
  description: string;
  data: any;
  timestamp: Date;
}

export interface ErrorRecoveryConfig {
  maxRetryAttempts: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  enableFallbackData: boolean;
  enableOfflineMode: boolean;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface RecoveryResult {
  success: boolean;
  strategy?: string;
  attempts: number;
  fallbackUsed: boolean;
  error?: Error;
}

// Default configuration
const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  maxRetryAttempts: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  enableFallbackData: true,
  enableOfflineMode: true,
  heartbeatInterval: 30000,
  connectionTimeout: 10000
};

export class ErrorRecoveryManager {
  private config: ErrorRecoveryConfig;
  private strategies: RecoveryStrategy[] = [];
  private fallbackData: Map<string, FallbackOption> = new Map();
  private isOfflineMode: boolean = false;
  private lastSuccessfulConnection: Date | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;
  
  // Event callbacks
  private onRecoveryAttempt?: (strategy: string, attempt: number) => void;
  private onRecoverySuccess?: (strategy: string, attempts: number) => void;
  private onRecoveryFailure?: (error: Error, attempts: number) => void;
  private onOfflineModeToggle?: (isOffline: boolean) => void;
  private onFallbackDataUsed?: (key: string, data: any) => void;

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeStrategies();
    this.startHeartbeat();
  }

  // Initialize recovery strategies
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'Immediate Retry',
        description: 'Retry the operation immediately',
        priority: 1,
        canApply: (error) => !error.message.includes('timeout'),
        execute: async () => {
          // Simple retry - handled by caller
          return true;
        }
      },
      {
        name: 'Connection Reset',
        description: 'Reset the iframe connection',
        priority: 3,
        canApply: (error) => error.message.includes('connection') || error.message.includes('network'),
        execute: async () => {
          try {
            // Signal to reset iframe
            window.dispatchEvent(new CustomEvent('orbat-reset-connection'));
            await this.waitForConnection();
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Heartbeat Check',
        description: 'Send heartbeat to check connection',
        priority: 2,
        canApply: (error) => error.message.includes('timeout') || error.message.includes('response'),
        execute: async () => {
          try {
            // Send heartbeat message
            const heartbeatResult = await this.sendHeartbeat();
            return heartbeatResult;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Fallback Data',
        description: 'Use cached fallback data',
        priority: 0,
        canApply: (error) => this.config.enableFallbackData,
        execute: async () => {
          // This strategy always "succeeds" but uses fallback data
          this.isOfflineMode = true;
          this.onOfflineModeToggle?.(true);
          return true;
        }
      }
    ];

    // Sort strategies by priority (descending)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  // Start connection heartbeat
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(async () => {
      try {
        const isAlive = await this.sendHeartbeat();
        if (isAlive && this.isOfflineMode) {
          this.isOfflineMode = false;
          this.lastSuccessfulConnection = new Date();
          this.connectionAttempts = 0;
          this.onOfflineModeToggle?.(false);
        }
      } catch (error) {
        this.connectionAttempts++;
        if (!this.isOfflineMode && this.connectionAttempts > 3) {
          this.isOfflineMode = true;
          this.onOfflineModeToggle?.(true);
        }
      }
    }, this.config.heartbeatInterval);
  }

  // Send heartbeat to Vue application
  private async sendHeartbeat(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      try {
        // Send heartbeat message
        window.postMessage({
          type: 'HEARTBEAT',
          id: `heartbeat-${Date.now()}`,
          timestamp: new Date()
        }, '*');
        
        // Listen for response
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'HEARTBEAT_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handleMessage);
            resolve(true);
          }
        };
        
        window.addEventListener('message', handleMessage);
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  // Wait for connection to be established
  private async waitForConnection(timeout = this.config.connectionTimeout): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const checkConnection = () => {
        this.sendHeartbeat().then((isConnected) => {
          if (isConnected) {
            clearTimeout(timeoutId);
            resolve();
          } else {
            setTimeout(checkConnection, 500);
          }
        });
      };

      checkConnection();
    });
  }

  // Main recovery method
  async recoverFromError(
    error: Error, 
    operation: () => Promise<any>,
    context?: any
  ): Promise<RecoveryResult> {
    let attempts = 0;
    let lastError = error;
    let fallbackUsed = false;

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.canApply(error)
    );

    for (const strategy of applicableStrategies) {
      attempts++;
      this.onRecoveryAttempt?.(strategy.name, attempts);

      try {
        // Execute recovery strategy
        const strategyResult = await strategy.execute();
        
        if (strategyResult) {
          // If strategy is fallback data, mark as fallback used
          if (strategy.name === 'Fallback Data') {
            fallbackUsed = true;
            this.onRecoverySuccess?.(strategy.name, attempts);
            return {
              success: true,
              strategy: strategy.name,
              attempts,
              fallbackUsed: true
            };
          }

          // Try to execute the original operation
          try {
            await operation();
            this.lastSuccessfulConnection = new Date();
            this.connectionAttempts = 0;
            this.onRecoverySuccess?.(strategy.name, attempts);
            
            return {
              success: true,
              strategy: strategy.name,
              attempts,
              fallbackUsed: false
            };
          } catch (operationError) {
            lastError = operationError as Error;
            continue; // Try next strategy
          }
        }
      } catch (strategyError) {
        console.warn(`Recovery strategy ${strategy.name} failed:`, strategyError);
        continue; // Try next strategy
      }

      // Add delay between attempts
      if (attempts < applicableStrategies.length) {
        const delay = this.config.exponentialBackoff 
          ? this.config.retryDelay * Math.pow(2, attempts - 1)
          : this.config.retryDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All strategies failed
    this.onRecoveryFailure?.(lastError, attempts);
    
    return {
      success: false,
      attempts,
      fallbackUsed,
      error: lastError
    };
  }

  // Store fallback data
  storeFallbackData(key: string, data: any, description?: string): void {
    if (!this.config.enableFallbackData) return;

    this.fallbackData.set(key, {
      name: key,
      description: description || `Fallback data for ${key}`,
      data,
      timestamp: new Date()
    });
  }

  // Retrieve fallback data
  getFallbackData(key: string): any | null {
    if (!this.config.enableFallbackData) return null;
    
    const fallback = this.fallbackData.get(key);
    if (fallback) {
      this.onFallbackDataUsed?.(key, fallback.data);
      return fallback.data;
    }
    
    return null;
  }

  // Get all available fallback data
  getAllFallbackData(): FallbackOption[] {
    return Array.from(this.fallbackData.values());
  }

  // Clear fallback data
  clearFallbackData(key?: string): void {
    if (key) {
      this.fallbackData.delete(key);
    } else {
      this.fallbackData.clear();
    }
  }

  // Check if in offline mode
  isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  // Force offline mode
  setOfflineMode(offline: boolean): void {
    this.isOfflineMode = offline;
    this.onOfflineModeToggle?.(offline);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isOnline: !this.isOfflineMode,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      connectionAttempts: this.connectionAttempts,
      fallbackDataCount: this.fallbackData.size
    };
  }

  // Set event handlers
  setEventHandlers(handlers: {
    onRecoveryAttempt?: (strategy: string, attempt: number) => void;
    onRecoverySuccess?: (strategy: string, attempts: number) => void;
    onRecoveryFailure?: (error: Error, attempts: number) => void;
    onOfflineModeToggle?: (isOffline: boolean) => void;
    onFallbackDataUsed?: (key: string, data: any) => void;
  }): void {
    this.onRecoveryAttempt = handlers.onRecoveryAttempt;
    this.onRecoverySuccess = handlers.onRecoverySuccess;
    this.onRecoveryFailure = handlers.onRecoveryFailure;
    this.onOfflineModeToggle = handlers.onOfflineModeToggle;
    this.onFallbackDataUsed = handlers.onFallbackDataUsed;
  }

  // Add custom recovery strategy
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  // Remove recovery strategy
  removeRecoveryStrategy(name: string): void {
    this.strategies = this.strategies.filter(s => s.name !== name);
  }

  // Destroy and cleanup
  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    this.fallbackData.clear();
    this.strategies = [];
  }
}

// React hook for error recovery
export const useErrorRecovery = (config?: Partial<ErrorRecoveryConfig>) => {
  const [recoveryManager] = useState(() => new ErrorRecoveryManager(config));
  const [isOffline, setIsOffline] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  useEffect(() => {
    recoveryManager.setEventHandlers({
      onRecoveryAttempt: (strategy, attempt) => {
        setRecoveryAttempts(attempt);
        console.log(`Recovery attempt ${attempt} using strategy: ${strategy}`);
      },
      onRecoverySuccess: (strategy, attempts) => {
        setLastError(null);
        setRecoveryAttempts(0);
        console.log(`Recovery successful after ${attempts} attempts using: ${strategy}`);
      },
      onRecoveryFailure: (error, attempts) => {
        setLastError(error);
        setRecoveryAttempts(attempts);
        console.error(`Recovery failed after ${attempts} attempts:`, error);
      },
      onOfflineModeToggle: (offline) => {
        setIsOffline(offline);
        console.log(`${offline ? 'Entered' : 'Exited'} offline mode`);
      },
      onFallbackDataUsed: (key, data) => {
        console.log(`Using fallback data for: ${key}`, data);
      }
    });

    return () => {
      recoveryManager.destroy();
    };
  }, [recoveryManager]);

  // Wrapped execution with automatic recovery
  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    fallbackKey?: string
  ): Promise<T> => {
    try {
      const result = await operation();
      
      // Store successful result as fallback data
      if (fallbackKey && result) {
        recoveryManager.storeFallbackData(fallbackKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('Operation failed, attempting recovery:', error);
      
      const recoveryResult = await recoveryManager.recoverFromError(
        error as Error,
        operation
      );

      if (recoveryResult.success) {
        if (recoveryResult.fallbackUsed && fallbackKey) {
          const fallbackData = recoveryManager.getFallbackData(fallbackKey);
          if (fallbackData) {
            return fallbackData;
          }
        }
        
        // If recovery succeeded, try operation again
        return await operation();
      }

      // If all recovery attempts failed, try fallback data
      if (fallbackKey) {
        const fallbackData = recoveryManager.getFallbackData(fallbackKey);
        if (fallbackData) {
          console.warn(`Using fallback data for failed operation: ${fallbackKey}`);
          return fallbackData;
        }
      }

      // No recovery possible, rethrow error
      throw recoveryResult.error || error;
    }
  }, [recoveryManager]);

  const storeFallbackData = useCallback((key: string, data: any, description?: string) => {
    recoveryManager.storeFallbackData(key, data, description);
  }, [recoveryManager]);

  const getFallbackData = useCallback((key: string) => {
    return recoveryManager.getFallbackData(key);
  }, [recoveryManager]);

  const clearFallbackData = useCallback((key?: string) => {
    recoveryManager.clearFallbackData(key);
  }, [recoveryManager]);

  const getConnectionStatus = useCallback(() => {
    return recoveryManager.getConnectionStatus();
  }, [recoveryManager]);

  const setOfflineMode = useCallback((offline: boolean) => {
    recoveryManager.setOfflineMode(offline);
  }, [recoveryManager]);

  return {
    executeWithRecovery,
    storeFallbackData,
    getFallbackData,
    clearFallbackData,
    getConnectionStatus,
    setOfflineMode,
    isOffline,
    lastError,
    recoveryAttempts,
    recoveryManager
  };
};

export default ErrorRecoveryManager;