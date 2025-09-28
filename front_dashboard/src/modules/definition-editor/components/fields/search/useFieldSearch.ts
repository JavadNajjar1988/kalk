import { useState, useEffect, useCallback, useMemo } from 'react';
import { FieldSearchFilter, SortOption } from './FieldSearchFilterPanel';
import FieldSearchEngine, { SearchableField, SearchResult } from './FieldSearchEngine';

interface UseFieldSearchOptions {
  debounceDelay?: number;
  enablePersistence?: boolean;
  storageKey?: string;
  onSearchResult?: (result: SearchResult) => void;
}

interface SavedFilter {
  id: string;
  name: string;
  filter: FieldSearchFilter;
  created: Date;
}

interface UseFieldSearchReturn {
  // Search state
  searchResult: SearchResult | null;
  isSearching: boolean;
  
  // Current filter and sort
  currentFilter: FieldSearchFilter;
  currentSort: SortOption;
  
  // Methods
  updateFilter: (filter: FieldSearchFilter) => void;
  updateSort: (sort: SortOption) => void;
  resetSearch: () => void;
  exportResults: (format: 'csv' | 'json') => string;
  
  // Suggestions
  suggestions: string[];
  getSuggestions: (query: string) => void;
  
  // Saved filters
  savedFilters: SavedFilter[];
  saveFilter: (name: string, filter: FieldSearchFilter) => void;
  loadFilter: (filterId: string) => void;
  deleteFilter: (filterId: string) => void;
  
  // Statistics
  searchStats: {
    totalFields: number;
    filteredFields: number;
    searchTime: number;
    popularTags: Array<{ tag: string; count: number }>;
  };
}

const initialFilter: FieldSearchFilter = {
  searchTerm: '',
  fieldType: [],
  category: [],
  status: [],
  hasValidation: null,
  hasDependencies: null,
  complexity: [1, 10],
  dateRange: {
    start: null,
    end: null
  },
  tags: [],
  favorite: null
};

const initialSort: SortOption = {
  field: 'name',
  direction: 'asc'
};

export const useFieldSearch = (
  fields: SearchableField[],
  options: UseFieldSearchOptions = {}
): UseFieldSearchReturn => {
  const {
    debounceDelay = 300,
    enablePersistence = true,
    storageKey = 'field-search-state',
    onSearchResult
  } = options;

  const searchEngine = useMemo(() => FieldSearchEngine.getInstance(), []);
  
  const [currentFilter, setCurrentFilter] = useState<FieldSearchFilter>(initialFilter);
  const [currentSort, setCurrentSort] = useState<SortOption>(initialSort);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    if (enablePersistence) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentFilter(parsed.filter || initialFilter);
          setCurrentSort(parsed.sort || initialSort);
          setSavedFilters(parsed.savedFilters || []);
        }
      } catch (error) {
        console.warn('Failed to load persisted search state:', error);
      }
    }
  }, [enablePersistence, storageKey]);

  // Persist state changes
  useEffect(() => {
    if (enablePersistence) {
      try {
        const stateToSave = {
          filter: currentFilter,
          sort: currentSort,
          savedFilters
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to persist search state:', error);
      }
    }
  }, [currentFilter, currentSort, savedFilters, enablePersistence, storageKey]);

  // Index fields when they change
  useEffect(() => {
    searchEngine.indexFields(fields);
    // Trigger search with current filter/sort
    performSearch(currentFilter, currentSort);
  }, [fields, searchEngine]);

  // Perform search operation
  const performSearch = useCallback((filter: FieldSearchFilter, sort: SortOption) => {
    setIsSearching(true);
    
    try {
      const result = searchEngine.search(filter, sort);
      setSearchResult(result);
      onSearchResult?.(result);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine, onSearchResult]);

  // Debounced search
  const scheduleSearch = useCallback((filter: FieldSearchFilter, sort: SortOption) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      performSearch(filter, sort);
      setSearchTimeout(null);
    }, debounceDelay);

    setSearchTimeout(timeoutId);
  }, [performSearch, debounceDelay, searchTimeout]);

  // Update filter
  const updateFilter = useCallback((filter: FieldSearchFilter) => {
    setCurrentFilter(filter);
    scheduleSearch(filter, currentSort);
  }, [scheduleSearch, currentSort]);

  // Update sort
  const updateSort = useCallback((sort: SortOption) => {
    setCurrentSort(sort);
    performSearch(currentFilter, sort);
  }, [performSearch, currentFilter]);

  // Reset search
  const resetSearch = useCallback(() => {
    setCurrentFilter(initialFilter);
    setCurrentSort(initialSort);
    setSuggestions([]);
    performSearch(initialFilter, initialSort);
  }, [performSearch]);

  // Export results
  const exportResults = useCallback((format: 'csv' | 'json' = 'json'): string => {
    if (!searchResult) {
      return format === 'csv' ? '' : '[]';
    }
    return searchEngine.exportResults(searchResult.fields, format);
  }, [searchEngine, searchResult]);

  // Get suggestions
  const getSuggestions = useCallback((query: string) => {
    if (query.trim()) {
      const newSuggestions = searchEngine.getSuggestions(query, 10);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchEngine]);

  // Save filter
  const saveFilter = useCallback((name: string, filter: FieldSearchFilter) => {
    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      filter,
      created: new Date()
    };

    setSavedFilters(prev => [...prev, newFilter]);
  }, []);

  // Load filter
  const loadFilter = useCallback((filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      updateFilter(filter.filter);
    }
  }, [savedFilters, updateFilter]);

  // Delete filter
  const deleteFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Calculate search statistics
  const searchStats = useMemo(() => {
    const engineStats = searchEngine.getStatistics();
    return {
      totalFields: engineStats.totalFields,
      filteredFields: searchResult?.filteredCount || 0,
      searchTime: searchResult?.searchTime || 0,
      popularTags: engineStats.mostUsedTags
    };
  }, [searchEngine, searchResult]);

  // Trigger initial search when filter/sort changes
  useEffect(() => {
    if (fields.length > 0) {
      scheduleSearch(currentFilter, currentSort);
    }
  }, [currentFilter, currentSort, fields.length, scheduleSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    searchResult,
    isSearching,
    currentFilter,
    currentSort,
    updateFilter,
    updateSort,
    resetSearch,
    exportResults,
    suggestions,
    getSuggestions,
    savedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    searchStats
  };
};

export default useFieldSearch;