/**
 * Performance Optimization Hooks for Smart Field Builder
 * Provides lazy loading, code splitting, and performance monitoring
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  componentLoadTime: number;
  renderTime: number;
  totalMemoryUsage: number;
  chunkLoadTimes: Record<string, number>;
}

// Enhanced performance monitoring hook
export const useSmartFieldPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentLoadTime: 0,
    renderTime: 0,
    totalMemoryUsage: 0,
    chunkLoadTimes: {}
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Measure component load time
  const measureLoadTime = useCallback((componentName: string, loadFunction: () => Promise<any>) => {
    const startTime = performance.now();
    
    return loadFunction().then((result) => {
      const loadTime = performance.now() - startTime;
      
      setMetrics(prev => ({
        ...prev,
        chunkLoadTimes: {
          ...prev.chunkLoadTimes,
          [componentName]: loadTime
        }
      }));
      
      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      return result;
    });
  }, []);

  // Measure render time
  const measureRenderTime = useCallback((callback: () => void) => {
    const startTime = performance.now();
    callback();
    const renderTime = performance.now() - startTime;
    
    setMetrics(prev => ({ ...prev, renderTime }));
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`⚠️ Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  }, []);

  // Monitor memory usage
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      setMetrics(prev => ({ ...prev, totalMemoryUsage: memoryUsage }));
      
      if (process.env.NODE_ENV === 'development' && memoryUsage > 50) {
        console.warn(`💾 High memory usage: ${memoryUsage.toFixed(2)}MB`);
      }
    }
  }, []);

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    updateMemoryUsage();
    
    const interval = setInterval(updateMemoryUsage, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [updateMemoryUsage]);

  return {
    metrics,
    measureLoadTime,
    measureRenderTime,
    startMonitoring,
    isMonitoring
  };
};

// Lazy loading hook with preloading strategy
export const useLazyPreloader = () => {
  const [preloadedModules, setPreloadedModules] = useState<Set<string>>(new Set());
  
  const preloadComponent = useCallback((
    componentName: string,
    importFunction: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    if (preloadedModules.has(componentName)) {
      return Promise.resolve();
    }
    
    // Preload based on priority and network conditions
    const shouldPreload = () => {
      if (priority === 'high') return true;
      if (priority === 'medium') {
        const connection = (navigator as any).connection;
        return connection?.effectiveType !== 'slow-2g';
      }
      return false; // Low priority - only load when needed
    };
    
    if (shouldPreload()) {
      return importFunction().then(() => {
        setPreloadedModules(prev => new Set([...prev, componentName]));
      });
    }
    
    return Promise.resolve();
  }, [preloadedModules]);
  
  const preloadMultiple = useCallback((components: Array<{
    name: string;
    import: () => Promise<any>;
    priority?: 'high' | 'medium' | 'low';
  }>) => {
    return Promise.allSettled(
      components.map(({ name, import: importFn, priority }) =>
        preloadComponent(name, importFn, priority)
      )
    );
  }, [preloadComponent]);
  
  return { preloadComponent, preloadMultiple, preloadedModules };
};

// Smart loading strategy hook
export const useSmartLoadingStrategy = () => {
  const [loadingStrategy, setLoadingStrategy] = useState<{
    chunkSize: 'small' | 'medium' | 'large';
    preloadNext: boolean;
    useVirtualization: boolean;
  }>({
    chunkSize: 'medium',
    preloadNext: true,
    useVirtualization: false
  });

  useEffect(() => {
    // Adjust strategy based on device capabilities
    const adjustStrategy = () => {
      const memory = (navigator as any).deviceMemory || 4; // Default to 4GB
      const connection = (navigator as any).connection;
      
      let newStrategy = { ...loadingStrategy };
      
      // Adjust chunk size based on memory
      if (memory < 2) {
        newStrategy.chunkSize = 'small';
        newStrategy.preloadNext = false;
      } else if (memory >= 4) {
        newStrategy.chunkSize = 'large';
        newStrategy.preloadNext = true;
      }
      
      // Adjust preloading based on connection
      if (connection) {
        const slowConnections = ['slow-2g', '2g'];
        if (slowConnections.includes(connection.effectiveType)) {
          newStrategy.preloadNext = false;
          newStrategy.chunkSize = 'small';
        }
      }
      
      // Enable virtualization for low-end devices
      newStrategy.useVirtualization = memory < 2;
      
      setLoadingStrategy(newStrategy);
    };
    
    adjustStrategy();
    
    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', adjustStrategy);
      
      return () => {
        connection.removeEventListener('change', adjustStrategy);
      };
    }
  }, []);
  
  return loadingStrategy;
};

// Code splitting configuration
export const codeSplittingConfig = {
  // High priority - load immediately
  immediate: [
    'BuilderModeSelector'
  ],
  
  // Medium priority - preload on user interaction
  preload: [
    'GuidedWizard',
    'TemplateSelector'
  ],
  
  // Low priority - lazy load only when needed
  lazy: [
    'TemplateCustomizer',
    'BaseTypeStep',
    'EnhancementsStep',
    'DataSourceStep',
    'PreviewStep'
  ]
};

// Standardized Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  // Memoize options to prevent unnecessary effect re-runs
  const memoizedOptions = useMemo(() => ({
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  }), [options]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      memoizedOptions
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [ref, memoizedOptions]);

  return { isIntersecting, entry };
};

// Alternative hook for cases where ref is managed internally
export const useIntersectionObserverWithRef = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  const memoizedOptions = useMemo(() => ({
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  }), [options]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      memoizedOptions
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [memoizedOptions]);

  return { elementRef, isIntersecting, entry };
};

// Bundle size optimization helper
export const getBundleOptimizationRecommendations = (metrics: PerformanceMetrics) => {
  const recommendations: string[] = [];
  
  // Check load times
  Object.entries(metrics.chunkLoadTimes).forEach(([component, time]) => {
    if (time > 1000) { // 1 second
      recommendations.push(`Consider splitting ${component} into smaller chunks`);
    }
  });
  
  // Check memory usage
  if (metrics.totalMemoryUsage > 100) { // 100MB
    recommendations.push('High memory usage detected - consider implementing virtualization');
  }
  
  // Check render time
  if (metrics.renderTime > 16) { // 16ms (60fps)
    recommendations.push('Render time exceeds 16ms - consider memoization optimizations');
  }
  
  return recommendations;
};