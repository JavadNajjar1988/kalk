import { useState, useCallback, useMemo } from 'react';
import FilterEngine, { optimizeFilterConfig, filterStateUtils } from '../utils/filterUtils';
import type {
  AdvancedFilterConfig,
  FilterGroup,
  FilterCriteria,
  SavedFilter,
  FilterFieldDefinition,
  NodeSearchResult
} from '../types/fieldConstructor';

interface UseAdvancedFilterOptions {
  initialConfig?: AdvancedFilterConfig;
  availableFields: FilterFieldDefinition[];
  storageKey?: string;
}

export const useAdvancedFilter = ({
  initialConfig,
  availableFields,
  storageKey = 'advanced_filter_config'
}: UseAdvancedFilterOptions) => {
  const [filterConfig, setFilterConfig] = useState<AdvancedFilterConfig>(
    initialConfig || {
      groups: [],
      globalLogicalOperator: 'AND',
      savedFilters: []
    }
  );

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_saved`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Apply filter logic to search results
  const applyFilters = useCallback((
    results: NodeSearchResult[],
    config: AdvancedFilterConfig = filterConfig
  ): NodeSearchResult[] => {
    const optimizedConfig = optimizeFilterConfig(config);
    return FilterEngine.applyFilter(results, optimizedConfig);
  }, [filterConfig]);

  // Generate filter field definitions based on available data
  const getFilterFieldDefinitions = useCallback((): FilterFieldDefinition[] => {
    return [
      {
        id: 'name',
        name: 'نام',
        type: 'text',
        operators: ['=', '!=', 'contains', 'not_contains', 'starts_with', 'ends_with', 'exists', 'not_exists']
      },
      {
        id: 'description',
        name: 'توضیحات',
        type: 'text',
        operators: ['=', '!=', 'contains', 'not_contains', 'starts_with', 'ends_with', 'exists', 'not_exists']
      },
      {
        id: 'level',
        name: 'سطح',
        type: 'number',
        operators: ['=', '!=', '>', '<', '>=', '<=', 'between', 'exists', 'not_exists'],
        validation: { min: 1, max: 10 }
      },
      {
        id: 'categoryType',
        name: 'نوع دسته‌بندی',
        type: 'select',
        operators: ['=', '!=', 'in', 'not_in'],
        options: [
          { value: 'geographical', label: 'جغرافیایی' },
          { value: 'military_ranks', label: 'درجات نظامی' },
          { value: 'equipment', label: 'تجهیزات' },
          { value: 'persons', label: 'اشخاص' },
          { value: 'mission_type', label: 'نوع مأموریت' }
        ]
      },
      {
        id: 'hasCoordinates',
        name: 'دارای مختصات',
        type: 'boolean',
        operators: ['=', '!=']
      },
      {
        id: 'pathLength',
        name: 'عمق سلسله‌مراتب',
        type: 'number',
        operators: ['=', '!=', '>', '<', '>=', '<=', 'between'],
        validation: { min: 0, max: 20 }
      }
    ];
  }, []);

  // Update filter configuration
  const updateConfig = useCallback((newConfig: AdvancedFilterConfig) => {
    setFilterConfig(newConfig);
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save filter config to localStorage:', error);
    }
  }, [storageKey]);

  // Save filter
  const saveFilter = useCallback((filter: SavedFilter) => {
    const updatedSavedFilters = [...savedFilters, filter];
    setSavedFilters(updatedSavedFilters);
    
    try {
      localStorage.setItem(`${storageKey}_saved`, JSON.stringify(updatedSavedFilters));
    } catch (error) {
      console.warn('Failed to save filter to localStorage:', error);
    }
  }, [savedFilters, storageKey]);

  // Load filter
  const loadFilter = useCallback((filter: SavedFilter) => {
    updateConfig(filter.config);
  }, [updateConfig]);

  // Delete saved filter
  const deleteFilter = useCallback((filterId: string) => {
    const updatedSavedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedSavedFilters);
    
    try {
      localStorage.setItem(`${storageKey}_saved`, JSON.stringify(updatedSavedFilters));
    } catch (error) {
      console.warn('Failed to update saved filters in localStorage:', error);
    }
  }, [savedFilters, storageKey]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filterConfig.groups.some(group => group.isActive && group.criteria.length > 0);
  }, [filterConfig]);

  // Get filter summary
  const getFilterSummary = useMemo(() => {
    const activeGroups = filterConfig.groups.filter(g => g.isActive);
    const totalCriteria = activeGroups.reduce((sum, group) => sum + group.criteria.length, 0);
    
    return {
      activeGroups: activeGroups.length,
      totalCriteria,
      globalOperator: filterConfig.globalLogicalOperator
    };
  }, [filterConfig]);

  return {
    filterConfig,
    savedFilters,
    updateConfig,
    applyFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    getFilterFieldDefinitions,
    hasActiveFilters,
    getFilterSummary
  };
};