/**
 * ORBAT Error Service
 * سرویس مدیریت خطاهای ORBAT
 */

export interface OrbatError {
  id: string;
  timestamp: number;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  source: ErrorSource;
  stack?: string;
  context?: ErrorContext;
  resolved?: boolean;
  resolvedAt?: number;
}

export type ErrorType = 
  | 'BRIDGE_ERROR'
  | 'IFRAME_ERROR' 
  | 'COMMAND_ERROR'
  | 'DATA_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PERMISSION_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorSource = 'react' | 'vue' | 'bridge' | 'iframe' | 'network' | 'validation' | 'user';

export interface ErrorContext {
  componentName?: string;
  action?: string;
  userId?: string;
  scenarioId?: string;
  unitId?: string;
  commandType?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ErrorHandler {
  type: ErrorType;
  handler: (error: OrbatError) => Promise<void> | void;
}

export interface ErrorRecoveryStrategy {
  type: ErrorType;
  strategy: (error: OrbatError) => Promise<boolean> | boolean;
}

export class OrbatErrorService {
  private errors: OrbatError[] = [];
  private maxErrors = 1000;
  private handlers = new Map<ErrorType, Set<(error: OrbatError) => void>>();
  private recoveryStrategies = new Map<ErrorType, (error: OrbatError) => Promise<boolean>>();
  private errorId = 0;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultStrategies();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultStrategies(): void {
    // Bridge connection recovery
    this.recoveryStrategies.set('BRIDGE_ERROR', async (error) => {
      console.log('Attempting bridge recovery:', error.message);
      // Attempt to reconnect or reload iframe
      return false; // Recovery attempt failed
    });

    // Network error recovery
    this.recoveryStrategies.set('NETWORK_ERROR', async (error) => {
      console.log('Attempting network recovery:', error.message);
      // Retry network request or switch to offline mode
      return false;
    });

    // Command error recovery
    this.recoveryStrategies.set('COMMAND_ERROR', async (error) => {
      console.log('Attempting command recovery:', error.message);
      // Retry command or revert to previous state
      return false;
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'UNKNOWN_ERROR',
        severity: 'high',
        message: 'Unhandled promise rejection',
        details: event.reason,
        source: 'react',
        context: {
          action: 'unhandled_rejection'
        }
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'UNKNOWN_ERROR',
        severity: 'high',
        message: event.message || 'Global error',
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        },
        source: 'react',
        stack: event.error?.stack,
        context: {
          action: 'global_error'
        }
      });
    });
  }

  // Report an error
  public reportError(errorData: Omit<OrbatError, 'id' | 'timestamp'>): string {
    const error: OrbatError = {
      id: `error_${++this.errorId}_${Date.now()}`,
      timestamp: Date.now(),
      resolved: false,
      ...errorData,
      context: {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        ...errorData.context
      }
    };

    this.errors.push(error);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify handlers
    this.notifyHandlers(error);

    // Attempt recovery for critical errors
    if (error.severity === 'critical') {
      this.attemptRecovery(error);
    }

    // Log error
    this.logError(error);

    return error.id;
  }

  // Convenience methods for different error types
  public reportBridgeError(message: string, details?: any, severity: ErrorSeverity = 'high'): string {
    return this.reportError({
      type: 'BRIDGE_ERROR',
      severity,
      message,
      details,
      source: 'bridge',
      context: {
        action: 'bridge_communication'
      }
    });
  }

  public reportIframeError(message: string, details?: any, severity: ErrorSeverity = 'medium'): string {
    return this.reportError({
      type: 'IFRAME_ERROR',
      severity,
      message,
      details,
      source: 'iframe',
      context: {
        action: 'iframe_interaction'
      }
    });
  }

  public reportCommandError(commandType: string, message: string, details?: any): string {
    return this.reportError({
      type: 'COMMAND_ERROR',
      severity: 'medium',
      message,
      details,
      source: 'react',
      context: {
        action: 'command_execution',
        commandType
      }
    });
  }

  public reportDataError(message: string, details?: any, severity: ErrorSeverity = 'medium'): string {
    return this.reportError({
      type: 'DATA_ERROR',
      severity,
      message,
      details,
      source: 'react',
      context: {
        action: 'data_operation'
      }
    });
  }

  public reportValidationError(message: string, details?: any): string {
    return this.reportError({
      type: 'VALIDATION_ERROR',
      severity: 'low',
      message,
      details,
      source: 'validation',
      context: {
        action: 'data_validation'
      }
    });
  }

  public reportNetworkError(url: string, message: string, details?: any): string {
    return this.reportError({
      type: 'NETWORK_ERROR',
      severity: 'high',
      message,
      details,
      source: 'network',
      context: {
        action: 'network_request',
        url
      }
    });
  }

  public reportTimeoutError(message: string, details?: any): string {
    return this.reportError({
      type: 'TIMEOUT_ERROR',
      severity: 'medium',
      message,
      details,
      source: 'bridge',
      context: {
        action: 'timeout'
      }
    });
  }

  // Error resolution
  public resolveError(errorId: string, resolution?: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error && !error.resolved) {
      error.resolved = true;
      error.resolvedAt = Date.now();
      if (resolution) {
        error.details = { ...error.details, resolution };
      }
      return true;
    }
    return false;
  }

  public resolveErrorsByType(type: ErrorType): number {
    let resolved = 0;
    this.errors
      .filter(e => e.type === type && !e.resolved)
      .forEach(error => {
        error.resolved = true;
        error.resolvedAt = Date.now();
        resolved++;
      });
    return resolved;
  }

  // Error retrieval
  public getErrors(filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    resolved?: boolean;
    since?: number;
    limit?: number;
  }): OrbatError[] {
    let filtered = [...this.errors];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity);
      }
      if (filter.source) {
        filtered = filtered.filter(e => e.source === filter.source);
      }
      if (filter.resolved !== undefined) {
        filtered = filtered.filter(e => e.resolved === filter.resolved);
      }
      if (filter.since) {
        filtered = filtered.filter(e => e.timestamp >= filter.since!);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  public getError(errorId: string): OrbatError | undefined {
    return this.errors.find(e => e.id === errorId);
  }

  public getUnresolvedErrors(): OrbatError[] {
    return this.getErrors({ resolved: false });
  }

  public getCriticalErrors(): OrbatError[] {
    return this.getErrors({ severity: 'critical', resolved: false });
  }

  public getRecentErrors(hours = 1): OrbatError[] {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    return this.getErrors({ since });
  }

  // Statistics
  public getErrorStatistics(): {
    total: number;
    resolved: number;
    unresolved: number;
    bySeverity: Record<ErrorSeverity, number>;
    byType: Record<ErrorType, number>;
    bySource: Record<ErrorSource, number>;
    recentCount: number; // Last hour
  } {
    const stats = {
      total: this.errors.length,
      resolved: this.errors.filter(e => e.resolved).length,
      unresolved: this.errors.filter(e => !e.resolved).length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byType: {} as Record<ErrorType, number>,
      bySource: {} as Record<ErrorSource, number>,
      recentCount: this.getRecentErrors(1).length
    };

    // Count by severity
    for (const error of this.errors) {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySource[error.source] = (stats.bySource[error.source] || 0) + 1;
    }

    return stats;
  }

  // Event handlers
  public onError(type: ErrorType, handler: (error: OrbatError) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    return () => {
      const typeHandlers = this.handlers.get(type);
      if (typeHandlers) {
        typeHandlers.delete(handler);
        if (typeHandlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  public onAnyError(handler: (error: OrbatError) => void): () => void {
    const unsubscribers: (() => void)[] = [];
    
    // Subscribe to all error types
    const errorTypes: ErrorType[] = [
      'BRIDGE_ERROR', 'IFRAME_ERROR', 'COMMAND_ERROR', 'DATA_ERROR',
      'VALIDATION_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR', 
      'PERMISSION_ERROR', 'CONFIGURATION_ERROR', 'UNKNOWN_ERROR'
    ];
    
    errorTypes.forEach(type => {
      unsubscribers.push(this.onError(type, handler));
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  private notifyHandlers(error: OrbatError): void {
    const typeHandlers = this.handlers.get(error.type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(error);
        } catch (handlerError) {
          console.error('Error in error handler:', handlerError);
        }
      });
    }
  }

  // Recovery system
  public registerRecoveryStrategy(type: ErrorType, strategy: (error: OrbatError) => Promise<boolean>): void {
    this.recoveryStrategies.set(type, strategy);
  }

  private async attemptRecovery(error: OrbatError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type);
    if (strategy) {
      try {
        const recovered = await strategy(error);
        if (recovered) {
          this.resolveError(error.id, 'Auto-recovered');
          console.log(`Successfully recovered from error: ${error.id}`);
        }
        return recovered;
      } catch (recoveryError) {
        console.error('Error during recovery attempt:', recoveryError);
        return false;
      }
    }
    return false;
  }

  // Logging
  private logError(error: OrbatError): void {
    const logMethod = this.getLogMethod(error.severity);
    
    logMethod(
      `[ORBAT Error] ${error.type}: ${error.message}`,
      {
        id: error.id,
        severity: error.severity,
        source: error.source,
        context: error.context,
        details: error.details,
        stack: error.stack
      }
    );
  }

  private getLogMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case 'low': return console.info;
      case 'medium': return console.warn;
      case 'high': 
      case 'critical': return console.error;
      default: return console.log;
    }
  }

  // Export/Import
  public exportErrors(filter?: Parameters<typeof this.getErrors>[0]): string {
    const errors = this.getErrors(filter);
    return JSON.stringify(errors, null, 2);
  }

  public clearErrors(olderThan?: number): number {
    const initialCount = this.errors.length;
    
    if (olderThan) {
      this.errors = this.errors.filter(e => e.timestamp >= olderThan);
    } else {
      this.errors = [];
    }
    
    return initialCount - this.errors.length;
  }

  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    criticalErrors: number;
    highSeverityErrors: number;
    recentErrorRate: number; // errors per hour
  } {
    const recent = this.getRecentErrors(1);
    const critical = this.getCriticalErrors();
    const highSeverity = this.getErrors({ severity: 'high', resolved: false });
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (critical.length > 0) {
      status = 'critical';
    } else if (highSeverity.length > 5 || recent.length > 10) {
      status = 'warning';
    }
    
    return {
      status,
      criticalErrors: critical.length,
      highSeverityErrors: highSeverity.length,
      recentErrorRate: recent.length
    };
  }
}