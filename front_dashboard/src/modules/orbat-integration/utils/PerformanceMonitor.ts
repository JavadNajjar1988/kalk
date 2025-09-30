import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Performance metric interfaces
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'memory' | 'network' | 'rendering' | 'data' | 'user';
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: Date;
  metrics: PerformanceMetric[];
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  networkStats: {
    totalRequests: number;
    failedRequests: number;
    averageLatency: number;
  };
  renderingStats: {
    frameRate: number;
    renderTime: number;
    componentUpdates: number;
  };
}

export interface OptimizationSuggestion {
  category: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  impact: string;
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private observers: PerformanceObserver[] = [];
  private timers: Map<string, number> = new Map();
  private networkRequests: Map<string, { start: number; end?: number; success?: boolean }> = new Map();
  private renderCount: number = 0;
  private frameRate: number = 60;
  private lastFrameTime: number = performance.now();
  
  // Configuration
  private maxMetrics: number = 1000;
  private maxSnapshots: number = 100;
  private snapshotInterval: number = 10000; // 10 seconds
  private monitoringEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
    this.startFrameRateMonitoring();
    this.startPeriodicSnapshots();
  }

  // Initialize performance observers
  private initializeObservers(): void {
    try {
      // Navigation timing observer
      if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.addMetric({
                name: 'Page Load Time',
                value: navEntry.loadEventEnd - navEntry.fetchStart,
                unit: 'ms',
                timestamp: new Date(),
                category: 'network'
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      }

      // Resource timing observer
      if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.addMetric({
              name: 'Resource Load Time',
              value: resourceEntry.responseEnd - resourceEntry.fetchStart,
              unit: 'ms',
              timestamp: new Date(),
              category: 'network'
            });
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }

      // Long task observer
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: 'Long Task Duration',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              category: 'rendering'
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      }

      // Memory usage observer (if available)
      if ('memory' in performance) {
        setInterval(() => {
          const memInfo = (performance as any).memory;
          this.addMetric({
            name: 'Memory Usage',
            value: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100,
            unit: '%',
            timestamp: new Date(),
            category: 'memory'
          });
        }, 5000);
      }
    } catch (error) {
      console.warn('Some performance observers are not supported:', error);
    }
  }

  // Start frame rate monitoring
  private startFrameRateMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrame = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        this.frameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.addMetric({
          name: 'Frame Rate',
          value: this.frameRate,
          unit: 'fps',
          timestamp: new Date(),
          category: 'rendering'
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.monitoringEnabled) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  }

  // Start periodic snapshots
  private startPeriodicSnapshots(): void {
    setInterval(() => {
      if (this.monitoringEnabled) {
        this.takeSnapshot();
      }
    }, this.snapshotInterval);
  }

  // Add performance metric
  addMetric(metric: PerformanceMetric): void {
    if (!this.monitoringEnabled) return;
    
    this.metrics.push(metric);
    
    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Start timing operation
  startTiming(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End timing operation
  endTiming(name: string, category: PerformanceMetric['category'] = 'user'): number {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      console.warn(`No start time found for timer: ${name}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    this.addMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category
    });
    
    return duration;
  }

  // Track network request
  trackNetworkRequest(id: string, start: boolean, success?: boolean): void {
    if (start) {
      this.networkRequests.set(id, { start: performance.now() });
    } else {
      const request = this.networkRequests.get(id);
      if (request) {
        request.end = performance.now();
        request.success = success;
        
        const duration = request.end - request.start;
        this.addMetric({
          name: success ? 'Successful Request' : 'Failed Request',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          category: 'network'
        });
        
        this.networkRequests.delete(id);
      }
    }
  }

  // Track component render
  trackRender(componentName: string, renderTime: number): void {
    this.renderCount++;
    
    this.addMetric({
      name: `${componentName} Render`,
      value: renderTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'rendering'
    });
  }

  // Take performance snapshot
  takeSnapshot(): PerformanceSnapshot {
    const memoryInfo = this.getMemoryUsage();
    const networkStats = this.getNetworkStats();
    const renderingStats = this.getRenderingStats();
    
    const snapshot: PerformanceSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      metrics: [...this.metrics.slice(-50)], // Last 50 metrics
      memoryUsage: memoryInfo,
      networkStats,
      renderingStats
    };
    
    this.snapshots.push(snapshot);
    
    // Maintain max snapshots limit
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
    
    return snapshot;
  }

  // Get memory usage statistics
  private getMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
      };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  }

  // Get network statistics
  private getNetworkStats() {
    const recentNetworkMetrics = this.metrics
      .filter(m => m.category === 'network')
      .slice(-100);
    
    const totalRequests = recentNetworkMetrics.length;
    const failedRequests = recentNetworkMetrics
      .filter(m => m.name.includes('Failed')).length;
    const averageLatency = totalRequests > 0 
      ? recentNetworkMetrics.reduce((sum, m) => sum + m.value, 0) / totalRequests
      : 0;
    
    return {
      totalRequests,
      failedRequests,
      averageLatency: Math.round(averageLatency)
    };
  }

  // Get rendering statistics
  private getRenderingStats() {
    const recentRenderMetrics = this.metrics
      .filter(m => m.category === 'rendering')
      .slice(-50);
    
    const renderTime = recentRenderMetrics.length > 0
      ? recentRenderMetrics.reduce((sum, m) => sum + m.value, 0) / recentRenderMetrics.length
      : 0;
    
    return {
      frameRate: this.frameRate,
      renderTime: Math.round(renderTime),
      componentUpdates: this.renderCount
    };
  }

  // Generate optimization suggestions
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const recentMetrics = this.metrics.slice(-100);
    
    // Check frame rate
    if (this.frameRate < 30) {
      suggestions.push({
        category: 'rendering',
        severity: 'high',
        title: 'Low Frame Rate Detected',
        description: `Current frame rate is ${this.frameRate} FPS, which may cause choppy animations.`,
        action: 'Optimize rendering performance or reduce visual complexity',
        impact: 'Improved user experience and smoother animations'
      });
    }
    
    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.percentage > 80) {
      suggestions.push({
        category: 'memory',
        severity: 'high',
        title: 'High Memory Usage',
        description: `Memory usage is at ${memoryUsage.percentage.toFixed(1)}%`,
        action: 'Implement memory cleanup and reduce data caching',
        impact: 'Reduced risk of memory leaks and improved stability'
      });
    }
    
    // Check network latency
    const networkStats = this.getNetworkStats();
    if (networkStats.averageLatency > 2000) {
      suggestions.push({
        category: 'network',
        severity: 'medium',
        title: 'High Network Latency',
        description: `Average request latency is ${networkStats.averageLatency}ms`,
        action: 'Implement request caching and optimize network requests',
        impact: 'Faster data loading and better responsiveness'
      });
    }
    
    // Check error rate
    if (networkStats.failedRequests / Math.max(networkStats.totalRequests, 1) > 0.1) {
      suggestions.push({
        category: 'network',
        severity: 'high',
        title: 'High Error Rate',
        description: `${((networkStats.failedRequests / networkStats.totalRequests) * 100).toFixed(1)}% of requests are failing`,
        action: 'Implement better error handling and retry mechanisms',
        impact: 'Improved reliability and user experience'
      });
    }
    
    // Check long tasks
    const longTasks = recentMetrics.filter(m => 
      m.name === 'Long Task Duration' && m.value > 50
    );
    if (longTasks.length > 5) {
      suggestions.push({
        category: 'rendering',
        severity: 'medium',
        title: 'Frequent Long Tasks',
        description: `${longTasks.length} long tasks detected in recent activity`,
        action: 'Break down large operations into smaller chunks',
        impact: 'More responsive user interface'
      });
    }
    
    return suggestions;
  }

  // Get performance summary
  getPerformanceSummary() {
    const recentMetrics = this.metrics.slice(-100);
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];
    
    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      latestSnapshot,
      memoryUsage: this.getMemoryUsage(),
      networkStats: this.getNetworkStats(),
      renderingStats: this.getRenderingStats(),
      optimizationSuggestions: this.generateOptimizationSuggestions()
    };
  }

  // Clear all data
  clear(): void {
    this.metrics = [];
    this.snapshots = [];
    this.timers.clear();
    this.networkRequests.clear();
    this.renderCount = 0;
  }

  // Enable/disable monitoring
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by category
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }

  // Get all snapshots
  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  // Cleanup
  destroy(): void {
    this.setMonitoringEnabled(false);
    this.observers.forEach(observer => observer.disconnect());
    this.clear();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [monitor] = useState(() => new PerformanceMonitor());
  const [summary, setSummary] = useState(() => monitor.getPerformanceSummary());
  const renderStartTime = useRef<number>(0);

  // Update summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(monitor.getPerformanceSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, [monitor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => monitor.destroy();
  }, [monitor]);

  // Timing utilities
  const startTiming = useCallback((name: string) => {
    monitor.startTiming(name);
  }, [monitor]);

  const endTiming = useCallback((name: string, category?: PerformanceMetric['category']) => {
    return monitor.endTiming(name, category);
  }, [monitor]);

  // Network request tracking
  const trackRequest = useCallback((id: string, start: boolean, success?: boolean) => {
    monitor.trackNetworkRequest(id, start, success);
  }, [monitor]);

  // Component render tracking
  const trackRender = useCallback((componentName: string) => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      monitor.trackRender(componentName, renderTime);
      renderStartTime.current = 0;
    }
  }, [monitor]);

  const startRenderTracking = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // Manual metric addition
  const addMetric = useCallback((metric: PerformanceMetric) => {
    monitor.addMetric(metric);
  }, [monitor]);

  // Take snapshot
  const takeSnapshot = useCallback(() => {
    return monitor.takeSnapshot();
  }, [monitor]);

  // Performance data access
  const getMetrics = useCallback((category?: PerformanceMetric['category']) => {
    return category ? monitor.getMetricsByCategory(category) : monitor.getMetrics();
  }, [monitor]);

  const getSnapshots = useCallback(() => {
    return monitor.getSnapshots();
  }, [monitor]);

  const getOptimizationSuggestions = useCallback(() => {
    return monitor.generateOptimizationSuggestions();
  }, [monitor]);

  // Clear data
  const clearData = useCallback(() => {
    monitor.clear();
    setSummary(monitor.getPerformanceSummary());
  }, [monitor]);

  return {
    summary,
    startTiming,
    endTiming,
    trackRequest,
    trackRender,
    startRenderTracking,
    addMetric,
    takeSnapshot,
    getMetrics,
    getSnapshots,
    getOptimizationSuggestions,
    clearData,
    monitor
  };
};

// Performance wrapper component
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const WithPerformanceTracking: React.FC<P> = (props) => {
    const { startRenderTracking, trackRender } = usePerformanceMonitor();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Anonymous';

    useEffect(() => {
      startRenderTracking();
      trackRender(name);
    });

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceTracking.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPerformanceTracking;
};

// Export singleton monitor instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;