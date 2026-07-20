/**
 * Intelligent Caching System for Smart Field Builder
 * Provides multi-level caching with automatic cache invalidation
 */

import { LRUCache } from 'lru-cache';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  version: string;
  dependencies: string[];
}

interface CacheOptions {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age regardless of access
  enableStatistics: boolean;
  persistToDisk?: boolean;
}

interface CacheStatistics {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
}

class IntelligentCache<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private statistics: CacheStatistics;
  private dependencyMap: Map<string, Set<string>>;
  private options: CacheOptions;
  private accessTimes: number[];

  constructor(options: CacheOptions) {
    this.options = options;
    this.cache = new LRUCache({
      max: options.maxSize,
      ttl: options.ttl,
      dispose: (value, key) => {
        if (options.enableStatistics) {
          console.log(`Cache entry evicted: ${key}`);
        }
      }
    });

    this.statistics = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0
    };

    this.dependencyMap = new Map();
    this.accessTimes = [];
  }

  // Set cache entry with dependencies
  set(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      version?: string;
      dependencies?: string[];
    } = {}
  ): void {
    const startTime = performance.now();
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      version: options.version || '1.0.0',
      dependencies: options.dependencies || []
    };

    // Set custom TTL if provided
    const ttl = options.ttl || this.options.ttl;
    this.cache.set(key, entry, { ttl });

    // Update dependency tracking
    if (entry.dependencies.length > 0) {
      this.dependencyMap.set(key, new Set(entry.dependencies));
    }

    // Update statistics
    this.updateStatistics(performance.now() - startTime);
    this.statistics.size = this.cache.size;

    // Persist to disk if enabled
    if (this.options.persistToDisk) {
      this.persistEntry(key, entry);
    }
  }

  // Get cache entry
  get(key: string): T | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (entry) {
      // Check if entry is still valid
      if (this.isEntryValid(entry)) {
        entry.accessCount++;
        this.statistics.hits++;
        this.updateStatistics(performance.now() - startTime);
        return entry.value;
      } else {
        // Remove invalid entry
        this.cache.delete(key);
      }
    }

    this.statistics.misses++;
    this.updateStatistics(performance.now() - startTime);
    return undefined;
  }

  // Get or set pattern
  getOrSet(
    key: string,
    factory: () => T | Promise<T>,
    options: {
      ttl?: number;
      version?: string;
      dependencies?: string[];
    } = {}
  ): T | Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = factory();
    
    if (result instanceof Promise) {
      return result.then(value => {
        this.set(key, value, options);
        return value;
      });
    } else {
      this.set(key, result, options);
      return result;
    }
  }

  // Invalidate by key
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.dependencyMap.delete(key);
    this.statistics.size = this.cache.size;
    return deleted;
  }

  // Invalidate by dependency
  invalidateByDependency(dependency: string): number {
    let invalidatedCount = 0;
    
    for (const [key, dependencies] of this.dependencyMap.entries()) {
      if (dependencies.has(dependency)) {
        if (this.invalidate(key)) {
          invalidatedCount++;
        }
      }
    }
    
    return invalidatedCount;
  }

  // Invalidate by pattern
  invalidateByPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        if (this.invalidate(key)) {
          invalidatedCount++;
        }
      }
    }
    
    return invalidatedCount;
  }

  // Check if entry is valid
  private isEntryValid(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check max age
    if (this.options.maxAge && age > this.options.maxAge) {
      return false;
    }
    
    return true;
  }

  // Update access statistics
  private updateStatistics(accessTime: number): void {
    if (!this.options.enableStatistics) return;
    
    this.accessTimes.push(accessTime);
    
    // Keep only recent access times for average calculation
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-500);
    }
    
    this.statistics.averageAccessTime = 
      this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length;
    
    const total = this.statistics.hits + this.statistics.misses;
    this.statistics.hitRate = total > 0 ? (this.statistics.hits / total) * 100 : 0;
  }

  // Persist entry to disk (simplified implementation)
  private persistEntry(key: string, entry: CacheEntry<T>): void {
    try {
      const serialized = JSON.stringify({ key, entry });
      localStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  // Load entry from disk
  private loadEntry(key: string): CacheEntry<T> | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const { entry } = JSON.parse(stored);
        return entry;
      }
    } catch (error) {
      console.warn('Failed to load cache entry:', error);
    }
    return null;
  }

  // Get cache statistics
  getStatistics(): CacheStatistics {
    return { ...this.statistics, size: this.cache.size };
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.dependencyMap.clear();
    this.statistics = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0
    };
  }

  // Get cache info for debugging
  getDebugInfo(): object {
    return {
      statistics: this.getStatistics(),
      cacheSize: this.cache.size,
      dependencyCount: this.dependencyMap.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage
  private estimateMemoryUsage(): number {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((size, entry) => {
      return size + JSON.stringify(entry).length * 2; // Rough estimate
    }, 0);
    
    return Math.round(totalSize / 1024); // KB
  }
}

// Cache manager for different cache types
class CacheManager {
  private caches: Map<string, IntelligentCache>;
  
  constructor() {
    this.caches = new Map();
  }

  // Create or get cache instance
  getCache<T>(
    name: string, 
    options: CacheOptions = {
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5 minutes
      enableStatistics: true
    }
  ): IntelligentCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new IntelligentCache<T>(options));
    }
    return this.caches.get(name)!;
  }

  // Get statistics for all caches
  getAllStatistics(): Record<string, CacheStatistics> {
    const stats: Record<string, CacheStatistics> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStatistics();
    }
    
    return stats;
  }

  // Clear all caches
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  // Invalidate by dependency across all caches
  invalidateGlobalDependency(dependency: string): number {
    let totalInvalidated = 0;
    
    for (const cache of this.caches.values()) {
      totalInvalidated += cache.invalidateByDependency(dependency);
    }
    
    return totalInvalidated;
  }
}

// Singleton cache manager instance
export const cacheManager = new CacheManager();

// Predefined cache instances for Smart Field Builder
export const templateCache = cacheManager.getCache('templates', {
  maxSize: 500, // Increased from 200 for better template storage
  ttl: 10 * 60 * 1000, // 10 minutes
  maxAge: 30 * 60 * 1000, // 30 minutes maximum age
  enableStatistics: true,
  persistToDisk: true
});

export const performanceCache = cacheManager.getCache('performance', {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes for performance metrics
  enableStatistics: true,
  persistToDisk: false // No need to persist performance data
});

export const validationCache = cacheManager.getCache('validation', {
  maxSize: 200,
  ttl: 15 * 60 * 1000, // 15 minutes for validation rules
  enableStatistics: true,
  persistToDisk: true
});



export const previewCache = cacheManager.getCache('preview', {
  maxSize: 50,
  ttl: 30 * 1000, // 30 seconds
  enableStatistics: true
});

export const configurationCache = cacheManager.getCache('configuration', {
  maxSize: 100,
  ttl: 15 * 60 * 1000, // 15 minutes
  enableStatistics: true,
  persistToDisk: true
});

// Hook for using cache in React components
export const useCache = <T>(cacheName: string, options?: CacheOptions) => {
  return cacheManager.getCache<T>(cacheName, options);
};

// Utility functions for common caching patterns
export const withCache = <T>(
  cache: IntelligentCache<T>,
  key: string,
  factory: () => T | Promise<T>,
  options?: {
    ttl?: number;
    version?: string;
    dependencies?: string[];
  }
): T | Promise<T> => {
  return cache.getOrSet(key, factory, options);
};

export { IntelligentCache, CacheManager };