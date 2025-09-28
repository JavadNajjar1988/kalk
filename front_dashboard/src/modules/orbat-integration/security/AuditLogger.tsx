import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SecurityUser } from './SecurityMiddleware';

// Audit log interfaces
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  username?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  outcome: 'SUCCESS' | 'FAILURE' | 'ERROR';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM' | 'SECURITY';
}

export interface SecurityMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  authenticationAttempts: number;
  authenticationFailures: number;
  unauthorizedAccess: number;
  dataViolations: number;
  systemErrors: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: 'SECURITY_BREACH' | 'UNAUTHORIZED_ACCESS' | 'DATA_VIOLATION' | 'SYSTEM_ERROR' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface MonitoringConfig {
  enableAuditLogging: boolean;
  enableRealTimeMonitoring: boolean;
  logRetentionDays: number;
  alertThresholds: {
    failedLoginAttempts: number;
    unauthorizedAccess: number;
    dataViolations: number;
    systemErrors: number;
  };
  enableMetrics: boolean;
  metricsUpdateInterval: number;
}

// Default monitoring configuration
const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enableAuditLogging: true,
  enableRealTimeMonitoring: true,
  logRetentionDays: 90,
  alertThresholds: {
    failedLoginAttempts: 5,
    unauthorizedAccess: 3,
    dataViolations: 1,
    systemErrors: 10
  },
  enableMetrics: true,
  metricsUpdateInterval: 60000 // 1 minute
};

// Audit logger class
export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private config: MonitoringConfig;
  private metrics: SecurityMetrics;
  private alerts: SecurityAlert[] = [];
  private alertCallbacks: ((alert: SecurityAlert) => void)[] = [];

  constructor(config: MonitoringConfig = DEFAULT_MONITORING_CONFIG) {
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.loadStoredLogs();
    this.startMetricsUpdate();
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      authenticationAttempts: 0,
      authenticationFailures: 0,
      unauthorizedAccess: 0,
      dataViolations: 0,
      systemErrors: 0,
      averageResponseTime: 0,
      lastUpdated: new Date()
    };
  }

  private loadStoredLogs(): void {
    try {
      const stored = localStorage.getItem('orbat_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load stored audit logs:', error);
    }
  }

  private saveLogs(): void {
    try {
      // Keep only logs within retention period
      const retentionCutoff = new Date();
      retentionCutoff.setDate(retentionCutoff.getDate() - this.config.logRetentionDays);
      
      const filteredLogs = this.logs.filter(log => log.timestamp > retentionCutoff);
      
      localStorage.setItem('orbat_audit_logs', JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  private startMetricsUpdate(): void {
    if (!this.config.enableMetrics) return;

    setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsUpdateInterval);
  }

  private updateMetrics(): void {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => log.timestamp > last24Hours);
    
    this.metrics = {
      totalRequests: recentLogs.length,
      successfulRequests: recentLogs.filter(log => log.outcome === 'SUCCESS').length,
      failedRequests: recentLogs.filter(log => log.outcome === 'FAILURE' || log.outcome === 'ERROR').length,
      authenticationAttempts: recentLogs.filter(log => log.category === 'AUTHENTICATION').length,
      authenticationFailures: recentLogs.filter(log => 
        log.category === 'AUTHENTICATION' && log.outcome === 'FAILURE'
      ).length,
      unauthorizedAccess: recentLogs.filter(log => log.category === 'AUTHORIZATION' && log.outcome === 'FAILURE').length,
      dataViolations: recentLogs.filter(log => log.category === 'DATA_ACCESS' && log.severity === 'HIGH').length,
      systemErrors: recentLogs.filter(log => log.category === 'SYSTEM' && log.outcome === 'ERROR').length,
      averageResponseTime: 0, // Would need performance timing data
      lastUpdated: now
    };

    // Check for alert conditions
    this.checkAlertThresholds();
  }

  private checkAlertThresholds(): void {
    const thresholds = this.config.alertThresholds;
    
    // Check failed login attempts
    if (this.metrics.authenticationFailures >= thresholds.failedLoginAttempts) {
      this.createAlert('SECURITY_BREACH', 'HIGH', 
        `High number of failed login attempts: ${this.metrics.authenticationFailures}`,
        { count: this.metrics.authenticationFailures, threshold: thresholds.failedLoginAttempts }
      );
    }

    // Check unauthorized access
    if (this.metrics.unauthorizedAccess >= thresholds.unauthorizedAccess) {
      this.createAlert('UNAUTHORIZED_ACCESS', 'HIGH',
        `Multiple unauthorized access attempts: ${this.metrics.unauthorizedAccess}`,
        { count: this.metrics.unauthorizedAccess, threshold: thresholds.unauthorizedAccess }
      );
    }

    // Check data violations
    if (this.metrics.dataViolations >= thresholds.dataViolations) {
      this.createAlert('DATA_VIOLATION', 'CRITICAL',
        `Data integrity violations detected: ${this.metrics.dataViolations}`,
        { count: this.metrics.dataViolations, threshold: thresholds.dataViolations }
      );
    }

    // Check system errors
    if (this.metrics.systemErrors >= thresholds.systemErrors) {
      this.createAlert('SYSTEM_ERROR', 'MEDIUM',
        `High number of system errors: ${this.metrics.systemErrors}`,
        { count: this.metrics.systemErrors, threshold: thresholds.systemErrors }
      );
    }
  }

  private createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    details: Record<string, any>
  ): void {
    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity,
      message,
      details,
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    
    // Notify callbacks
    this.alertCallbacks.forEach(callback => callback(alert));
    
    console.warn(`Security Alert [${severity}]: ${message}`, details);
  }

  /**
   * Log an audit entry
   */
  log(
    action: string,
    resource: string,
    outcome: AuditLogEntry['outcome'],
    details: Record<string, any> = {},
    user?: SecurityUser,
    resourceId?: string,
    category: AuditLogEntry['category'] = 'SYSTEM',
    severity: AuditLogEntry['severity'] = 'LOW'
  ): void {
    if (!this.config.enableAuditLogging) return;

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: user?.id,
      username: user?.username,
      sessionId: user?.sessionId,
      action,
      resource,
      resourceId,
      details,
      outcome,
      errorMessage: outcome === 'ERROR' ? details.error : undefined,
      ipAddress: '127.0.0.1', // In real implementation, get from request
      userAgent: navigator.userAgent,
      severity,
      category
    };

    this.logs.push(entry);
    this.saveLogs();

    // Real-time monitoring
    if (this.config.enableRealTimeMonitoring) {
      this.processRealTimeEntry(entry);
    }
  }

  private processRealTimeEntry(entry: AuditLogEntry): void {
    // Check for immediate security concerns
    if (entry.outcome === 'FAILURE' && entry.category === 'AUTHENTICATION') {
      // Track failed authentication attempts by user
      const recentFailures = this.logs.filter(log => 
        log.username === entry.username &&
        log.category === 'AUTHENTICATION' &&
        log.outcome === 'FAILURE' &&
        log.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      ).length;

      if (recentFailures >= 3) {
        this.createAlert('SECURITY_BREACH', 'HIGH',
          `Multiple failed login attempts for user: ${entry.username}`,
          { username: entry.username, attempts: recentFailures }
        );
      }
    }

    if (entry.severity === 'CRITICAL') {
      this.createAlert('SUSPICIOUS_ACTIVITY', 'CRITICAL',
        `Critical security event: ${entry.action}`,
        { entry }
      );
    }
  }

  /**
   * Get audit logs with filtering
   */
  getLogs(filter?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    category?: AuditLogEntry['category'];
    severity?: AuditLogEntry['severity'];
    outcome?: AuditLogEntry['outcome'];
    limit?: number;
  }): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }
      if (filter.severity) {
        filtered = filtered.filter(log => log.severity === filter.severity);
      }
      if (filter.outcome) {
        filtered = filtered.filter(log => log.outcome === filter.outcome);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get security alerts
   */
  getAlerts(onlyUnresolved = true): SecurityAlert[] {
    return onlyUnresolved 
      ? this.alerts.filter(alert => !alert.resolved)
      : [...this.alerts];
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: SecurityAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'Timestamp', 'User', 'Action', 'Resource', 'Outcome', 
        'Category', 'Severity', 'Details'
      ].join(',');
      
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.username || '',
        log.action,
        log.resource,
        log.outcome,
        log.category,
        log.severity,
        JSON.stringify(log.details).replace(/"/g, '""')
      ].join(','));
      
      return [headers, ...rows].join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(): number {
    const initialCount = this.logs.length;
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - this.config.logRetentionDays);
    
    this.logs = this.logs.filter(log => log.timestamp > retentionCutoff);
    this.saveLogs();
    
    return initialCount - this.logs.length;
  }
}

// Monitoring context
interface MonitoringContextType {
  logger: AuditLogger;
  metrics: SecurityMetrics;
  alerts: SecurityAlert[];
  refreshMetrics: () => void;
  refreshAlerts: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

// Monitoring provider
export const MonitoringProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<MonitoringConfig>;
}> = ({ children, config: userConfig = {} }) => {
  const [logger] = useState(() => new AuditLogger({ ...DEFAULT_MONITORING_CONFIG, ...userConfig }));
  const [metrics, setMetrics] = useState<SecurityMetrics>(logger.getMetrics());
  const [alerts, setAlerts] = useState<SecurityAlert[]>(logger.getAlerts());

  const refreshMetrics = useCallback(() => {
    setMetrics(logger.getMetrics());
  }, [logger]);

  const refreshAlerts = useCallback(() => {
    setAlerts(logger.getAlerts());
  }, [logger]);

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = logger.onAlert(() => {
      refreshAlerts();
    });

    // Refresh metrics periodically
    const interval = setInterval(refreshMetrics, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [logger, refreshMetrics, refreshAlerts]);

  const contextValue: MonitoringContextType = {
    logger,
    metrics,
    alerts,
    refreshMetrics,
    refreshAlerts
  };

  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
    </MonitoringContext.Provider>
  );
};

// Monitoring hook
export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within MonitoringProvider');
  }
  return context;
};

// Audit hook for easy logging
export const useAuditLogger = () => {
  const { logger } = useMonitoring();

  const logAction = useCallback((
    action: string,
    resource: string,
    outcome: AuditLogEntry['outcome'] = 'SUCCESS',
    details: Record<string, any> = {},
    user?: SecurityUser,
    category: AuditLogEntry['category'] = 'SYSTEM'
  ) => {
    logger.log(action, resource, outcome, details, user, undefined, category);
  }, [logger]);

  const logAuthentication = useCallback((
    outcome: AuditLogEntry['outcome'],
    username: string,
    details: Record<string, any> = {}
  ) => {
    logger.log('LOGIN_ATTEMPT', 'USER_SESSION', outcome, 
      { username, ...details }, undefined, undefined, 'AUTHENTICATION',
      outcome === 'FAILURE' ? 'HIGH' : 'LOW'
    );
  }, [logger]);

  const logDataAccess = useCallback((
    resource: string,
    action: string,
    outcome: AuditLogEntry['outcome'],
    user?: SecurityUser,
    details: Record<string, any> = {}
  ) => {
    logger.log(action, resource, outcome, details, user, undefined, 'DATA_ACCESS');
  }, [logger]);

  const logSecurityViolation = useCallback((
    violation: string,
    details: Record<string, any> = {},
    user?: SecurityUser
  ) => {
    logger.log('SECURITY_VIOLATION', violation, 'ERROR', details, user, undefined, 'SECURITY', 'CRITICAL');
  }, [logger]);

  return {
    logAction,
    logAuthentication,
    logDataAccess,
    logSecurityViolation,
    logger
  };
};

export default AuditLogger;