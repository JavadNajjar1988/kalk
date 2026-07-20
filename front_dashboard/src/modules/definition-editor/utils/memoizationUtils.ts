// Memoization Utilities for Performance Optimization
// ابزارهای حافظه‌سازی برای بهینه‌سازی عملکرد

import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { FieldConstructorConfig } from '../types/fieldConstructor';
import type { CustomField } from '../types/equipment';

/**
 * LRU Cache implementation for field computations
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Global caches for different types of computations
 */
export const fieldValidationCache = new LRUCache<string, any>(200);
export const fieldRenderCache = new LRUCache<string, any>(100);
export const hierarchicalDataCache = new LRUCache<string, any>(50);

/**
 * Memoized field validation
 */
export const useMemoizedFieldValidation = (
  field: FieldConstructorConfig | CustomField,
  value: any,
  dependencies: any[] = []
) => {
  return useMemo(() => {
    const cacheKey = `${field.id}_${JSON.stringify(value)}_${JSON.stringify(dependencies)}`;
    
    // Check cache first
    const cached = fieldValidationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform validation
    const isRequired = (field as any).isRequired;
    const fieldType = (field as any).type;
    
    let isValid = true;
    let errorMessage = '';

    // Basic required validation
    if (isRequired && (value === undefined || value === null || value === '')) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Type-specific validation
    if (isValid && value) {
      switch (fieldType) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Invalid email format';
          }
          break;
        
        case 'phone':
        case 'phone-array':
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          const phoneValue = Array.isArray(value) ? value[0] : value;
          if (phoneValue && !phoneRegex.test(phoneValue)) {
            isValid = false;
            errorMessage = 'Invalid phone format';
          }
          break;
        
        case 'number':
          if (isNaN(Number(value))) {
            isValid = false;
            errorMessage = 'Must be a valid number';
          }
          break;
      }
    }

    const result = { isValid, errorMessage };
    
    // Cache the result
    fieldValidationCache.set(cacheKey, result);
    
    return result;
  }, [field.id, (field as any).type, (field as any).isRequired, value, ...dependencies]);
};

/**
 * Memoized field sorting
 */
export const useMemoizedFieldSorting = (
  fields: (FieldConstructorConfig | CustomField)[],
  sortBy: 'order' | 'name' | 'type' = 'order'
) => {
  return useMemo(() => {
    return [...fields].sort((a, b) => {
      switch (sortBy) {
        case 'order':
          return ((a as any).order || 0) - ((b as any).order || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return ((a as any).type || '').localeCompare((b as any).type || '');
        default:
          return 0;
      }
    });
  }, [fields, sortBy]);
};

/**
 * Memoized field filtering
 */
export const useMemoizedFieldFiltering = (
  fields: (FieldConstructorConfig | CustomField)[],
  filters: {
    search?: string;
    type?: string;
    required?: boolean;
    hasError?: boolean;
    errors?: Record<string, string>;
  }
) => {
  return useMemo(() => {
    return fields.filter(field => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!field.name.toLowerCase().includes(searchTerm) && 
            !(field as any).description?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Type filter
      if (filters.type && (field as any).type !== filters.type) {
        return false;
      }

      // Required filter
      if (filters.required !== undefined && !!(field as any).isRequired !== filters.required) {
        return false;
      }

      // Error filter
      if (filters.hasError !== undefined) {
        const hasError = !!(filters.errors && filters.errors[field.id]);
        if (hasError !== filters.hasError) {
          return false;
        }
      }

      return true;
    });
  }, [fields, filters.search, filters.type, filters.required, filters.hasError, filters.errors]);
};

/**
 * Debounced callback hook
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

/**
 * Throttled callback hook
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
};

/**
 * Memoized expensive calculations
 */
export const useMemoizedExpensiveCalculation = <T>(
  calculation: () => T,
  dependencies: any[],
  cacheKey?: string
): T => {
  return useMemo(() => {
    if (cacheKey) {
      const cached = fieldRenderCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = calculation();
    
    if (cacheKey) {
      fieldRenderCache.set(cacheKey, result);
    }
    
    return result;
  }, dependencies);
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    
    if (lastRenderTimeRef.current > 0) {
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      
      // Log slow renders (> 16ms for 60fps)
      if (timeSinceLastRender > 16) {
        console.warn(`Slow render in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms`);
      }
    }
    
    lastRenderTimeRef.current = now;
    
    // Log excessive re-renders
    if (renderCountRef.current > 10) {
      console.warn(`Excessive re-renders in ${componentName}: ${renderCountRef.current} renders`);
    }
  });

  return {
    renderCount: renderCountRef.current,
    clearStats: () => {
      renderCountRef.current = 0;
      lastRenderTimeRef.current = 0;
    }
  };
};

/**
 * Cleanup utility for clearing all caches
 */
export const clearAllCaches = () => {
  fieldValidationCache.clear();
  fieldRenderCache.clear();
  hierarchicalDataCache.clear();
  console.log('All performance caches cleared');
};

export default {
  useMemoizedFieldValidation,
  useMemoizedFieldSorting,
  useMemoizedFieldFiltering,
  useDebouncedCallback,
  useThrottledCallback,
  useMemoizedExpensiveCalculation,
  useIntersectionObserver,
  usePerformanceMonitor,
  clearAllCaches
};