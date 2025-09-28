/**
 * Advanced Template Loader Hook
 * Provides intelligent template loading with caching and preloading strategies
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdvancedMemo, useSmartCallback } from '../../hooks/useAdvancedMemoization';
import { templateCache } from '../../utils/intelligentCache';

interface TemplateLoaderConfig {
  preloadStrategy: 'immediate' | 'lazy' | 'adaptive';
  cacheTimeout: number;
  batchSize: number;
  useVirtualization: boolean;
}

interface TemplateLoadState {
  templates: any[];
  isLoading: boolean;
  error: string | null;
  loadedChunks: Set<string>;
  totalProgress: number;
}

export const useAdvancedTemplateLoader = (config: Partial<TemplateLoaderConfig> = {}) => {
  const defaultConfig: TemplateLoaderConfig = {
    preloadStrategy: 'adaptive',
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    batchSize: 20,
    useVirtualization: false,
    ...config
  };

  const [loadState, setLoadState] = useState<TemplateLoadState>({
    templates: [],
    isLoading: true,
    error: null,
    loadedChunks: new Set(),
    totalProgress: 0
  });

  // Template categories with load priorities
  const templateCategories = useMemo(() => [
    { id: 'personal', priority: 'high', estimatedSize: 15 },
    { id: 'contact', priority: 'high', estimatedSize: 12 },
    { id: 'basic', priority: 'medium', estimatedSize: 8 },
    { id: 'business', priority: 'medium', estimatedSize: 10 },
    { id: 'location', priority: 'low', estimatedSize: 6 },
    { id: 'military', priority: 'low', estimatedSize: 4 },
    { id: 'equipment', priority: 'low', estimatedSize: 5 }
  ], []);

  // Determine loading strategy based on device capabilities
  const getLoadingStrategy = useAdvancedMemo(() => {
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    const slowConnection = connection && ['slow-2g', '2g'].includes(connection.effectiveType);

    if (memory < 2 || slowConnection) {
      return 'lazy'; // Load only when needed
    }
    
    if (memory >= 4 && !slowConnection) {
      return 'immediate'; // Preload everything
    }
    
    return 'adaptive'; // Smart loading based on usage
  }, [], { ttl: 60000 }); // Cache for 1 minute

  // Load templates by category with caching
  const loadTemplateChunk = useSmartCallback(
    async (categoryId: string, priority: 'high' | 'medium' | 'low') => {
      const cacheKey = `templates_${categoryId}_${priority}`;
      
      // Check cache first
      const cached = templateCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      try {
        // Dynamic import based on category
        let templateData;
        
        switch (categoryId) {
          case 'personal':
            templateData = await import('./chunks/PersonalTemplates');
            break;
          case 'contact':
            templateData = await import('./chunks/ContactTemplates');
            break;
          case 'business':
            templateData = await import('./chunks/BusinessTemplates');
            break;
          case 'location':
            templateData = await import('./chunks/LocationTemplates');
            break;
          case 'military':
            templateData = await import('./chunks/MilitaryTemplates');
            break;
          case 'equipment':
            templateData = await import('./chunks/EquipmentTemplates');
            break;
          case 'basic':
            templateData = await import('./chunks/BasicTemplates');
            break;
          default:
            // Fallback to main template data
            templateData = await import('./TemplateData');
        }

        const templates = templateData.default || templateData.templates || [];
        
        // Cache the loaded templates
        templateCache.set(cacheKey, templates, { 
          ttl: defaultConfig.cacheTimeout,
          dependencies: [categoryId, priority]
        });

        return templates;
      } catch (error) {
        console.error(`Failed to load template chunk ${categoryId}:`, error);
        return [];
      }
    },
    [defaultConfig.cacheTimeout],
    { throttle: 100 }
  );

  // Progressive loading with priority
  const loadTemplatesProgressively = useCallback(async () => {
    setLoadState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const strategy = getLoadingStrategy;
    const allTemplates: any[] = [];
    const totalCategories = templateCategories.length;
    let loadedCount = 0;

    try {
      if (strategy === 'immediate') {
        // Load all categories simultaneously
        const promises = templateCategories.map(cat => 
          loadTemplateChunk(cat.id, cat.priority as any)
        );
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allTemplates.push(...result.value);
            setLoadState(prev => ({
              ...prev,
              loadedChunks: new Set([...prev.loadedChunks, templateCategories[index].id])
            }));
          }
          loadedCount++;
          setLoadState(prev => ({
            ...prev,
            totalProgress: (loadedCount / totalCategories) * 100
          }));
        });
      } else {
        // Load categories by priority
        const priorityGroups = {
          high: templateCategories.filter(cat => cat.priority === 'high'),
          medium: templateCategories.filter(cat => cat.priority === 'medium'),
          low: templateCategories.filter(cat => cat.priority === 'low')
        };

        // Load high priority first
        for (const cat of priorityGroups.high) {
          const templates = await loadTemplateChunk(cat.id, 'high');
          allTemplates.push(...templates);
          
          setLoadState(prev => ({
            ...prev,
            templates: [...allTemplates],
            loadedChunks: new Set([...prev.loadedChunks, cat.id]),
            totalProgress: (++loadedCount / totalCategories) * 100
          }));
        }

        // Load medium priority if adaptive or immediate strategy
        if (strategy === 'adaptive') {
          for (const cat of priorityGroups.medium) {
            const templates = await loadTemplateChunk(cat.id, 'medium');
            allTemplates.push(...templates);
            
            setLoadState(prev => ({
              ...prev,
              templates: [...allTemplates],
              loadedChunks: new Set([...prev.loadedChunks, cat.id]),
              totalProgress: (++loadedCount / totalCategories) * 100
            }));
          }
        }
      }

      setLoadState(prev => ({
        ...prev,
        templates: allTemplates,
        isLoading: false,
        totalProgress: 100
      }));

    } catch (error) {
      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalProgress: 0
      }));
    }
  }, [templateCategories, loadTemplateChunk, getLoadingStrategy]);

  // Load remaining templates on demand
  const loadRemainingTemplates = useCallback(async () => {
    const remainingCategories = templateCategories.filter(
      cat => !loadState.loadedChunks.has(cat.id)
    );

    if (remainingCategories.length === 0) return;

    const newTemplates: any[] = [];
    
    for (const cat of remainingCategories) {
      const templates = await loadTemplateChunk(cat.id, cat.priority as any);
      newTemplates.push(...templates);
      
      setLoadState(prev => ({
        ...prev,
        loadedChunks: new Set([...prev.loadedChunks, cat.id])
      }));
    }

    setLoadState(prev => ({
      ...prev,
      templates: [...prev.templates, ...newTemplates]
    }));
  }, [templateCategories, loadState.loadedChunks, loadTemplateChunk]);

  // Preload templates based on user interaction
  const preloadByUsage = useCallback(async (searchQuery: string, selectedCategory: string) => {
    // Analyze search patterns to preload relevant templates
    const relevantCategories = templateCategories.filter(cat => {
      if (selectedCategory !== 'all' && cat.id === selectedCategory) return true;
      if (searchQuery) {
        return cat.id.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });

    for (const cat of relevantCategories) {
      if (!loadState.loadedChunks.has(cat.id)) {
        await loadTemplateChunk(cat.id, cat.priority as any);
      }
    }
  }, [templateCategories, loadState.loadedChunks, loadTemplateChunk]);

  // Initial load
  useEffect(() => {
    loadTemplatesProgressively();
  }, [loadTemplatesProgressively]);

  // Template statistics
  const stats = useMemo(() => ({
    totalTemplates: loadState.templates.length,
    loadedChunks: loadState.loadedChunks.size,
    totalChunks: templateCategories.length,
    loadProgress: loadState.totalProgress,
    byCategory: templateCategories.reduce((acc, cat) => {
      const categoryTemplates = loadState.templates.filter(t => t.category === cat.id);
      acc[cat.id] = {
        count: categoryTemplates.length,
        loaded: loadState.loadedChunks.has(cat.id),
        priority: cat.priority
      };
      return acc;
    }, {} as Record<string, any>)
  }), [loadState.templates, loadState.loadedChunks, loadState.totalProgress, templateCategories]);

  return {
    // State
    templates: loadState.templates,
    isLoading: loadState.isLoading,
    error: loadState.error,
    stats,

    // Actions
    loadRemainingTemplates,
    preloadByUsage,
    reload: loadTemplatesProgressively,

    // Configuration
    config: defaultConfig
  };
};