/**
 * useScenarioData Hook
 * هوک مدیریت داده‌های سناریو با ارتباط ORBAT
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrbatData } from '../../orbat-integration';
import type { 
  ScenarioMetadata, 
  DemoScenario, 
  SortOption, 
  LandingPageState,
  ScenarioAction,
  UploadResult,
  UrlLoadResult
} from '../types';

// Demo scenarios (مطابق با Vue)
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'falkland82',
    name: 'جنگ فالکلند ۱۹۸۲',
    summary: 'جنگ فالکلند یک درگیری نظامی بود که در سال ۱۹۸۲ بین آرژانتین و بریتانیا رخ داد. آرژانتین در ۲ آوریل ۱۹۸۲ به جزایر فالکلند حمله کرد و بریتانیا با اعزام نیروی ویژه برای بازپس‌گیری جزایر پاسخ داد.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/HMS_Broadsword_and_Hermes%2C_1982_%28IWM%29.jpg'
  },
  {
    id: 'narvik40',
    name: 'نبردهای نارویک ۱۹۴۰',
    summary: 'مجموعه‌ای از درگیری‌های دریایی و زمینی بین نیروهای آلمان و متفقین از آوریل تا ژوئن ۱۹۴۰. این نبردها اولین پیروزی متفقین علیه آلمان در جنگ بود.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Norwegian_Army_Colt_heavy_machine_gun_at_the_Narvik_front.jpg'
  }
];

export interface UseScenarioDataResult {
  // State
  state: LandingPageState;
  
  // Data
  scenarios: ScenarioMetadata[];
  demoScenarios: DemoScenario[];
  sortOptions: SortOption[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadScenarios: () => Promise<void>;
  handleScenarioAction: (action: ScenarioAction, scenarioId: string) => Promise<void>;
  handleDemoScenarioSelect: (scenarioId: string) => void;
  handleNewScenario: () => void;
  handleUploadScenario: (file: File) => Promise<UploadResult>;
  handleLoadFromUrl: (url: string) => Promise<UrlLoadResult>;
  handleSearch: (query: string) => void;
  handleSort: (sortBy: string) => void;
  refreshData: () => Promise<void>;
}

interface UseScenarioDataOptions {
  autoLoad?: boolean;
  enableDemoScenarios?: boolean;
}

export const useScenarioData = (options: UseScenarioDataOptions = {}): UseScenarioDataResult => {
  const { autoLoad = true, enableDemoScenarios = true } = options;
  
  // ORBAT integration
  const {
    scenarios: orbatScenarios,
    isLoading: orbatLoading,
    error: orbatError,
    loadScenarios: loadOrbatScenarios,
    addScenario,
    updateScenario,
    deleteScenario
  } = useOrbatData({ autoLoad });

  // Local state
  const [state, setState] = useState<LandingPageState>({
    scenarios: [],
    demoScenarios: enableDemoScenarios ? DEMO_SCENARIOS : [],
    isLoading: false,
    error: null,
    sortBy: 'modified',
    sortOrder: 'desc',
    searchQuery: '',
    selectedScenarios: []
  });

  // Convert ORBAT scenarios to our format
  const convertOrbatScenarios = useCallback((orbatData: any[]): ScenarioMetadata[] => {
    return orbatData.map(scenario => ({
      id: scenario.id,
      name: scenario.name || 'بدون نام',
      description: scenario.description || scenario.meta?.description,
      created: scenario.meta?.createdDate || scenario.createdAt || new Date(),
      modified: scenario.meta?.lastModifiedDate || scenario.updatedAt || new Date(),
      type: scenario.type || 'ORBAT-mapper',
      version: scenario.version
    }));
  }, []);

  // Update scenarios when ORBAT data changes
  useEffect(() => {
    const convertedScenarios = convertOrbatScenarios(orbatScenarios || []);
    setState(prev => ({
      ...prev,
      scenarios: convertedScenarios,
      isLoading: orbatLoading,
      error: orbatError
    }));
  }, [orbatScenarios, orbatLoading, orbatError, convertOrbatScenarios]);

  // Sort options
  const sortOptions: SortOption[] = useMemo(() => [
    {
      label: 'نام',
      value: 'name',
      action: () => handleSort('name'),
      active: state.sortBy === 'name'
    },
    {
      label: 'آخرین تغییر',
      value: 'modified',
      action: () => handleSort('modified'),
      active: state.sortBy === 'modified'
    },
    {
      label: 'تاریخ ایجاد',
      value: 'created',
      action: () => handleSort('created'),
      active: state.sortBy === 'created'
    }
  ], [state.sortBy]);

  // Filtered and sorted scenarios
  const filteredScenarios = useMemo(() => {
    let filtered = [...state.scenarios];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(scenario => 
        scenario.name.toLowerCase().includes(query) ||
        (scenario.description && scenario.description.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created).getTime();
          bValue = new Date(b.created).getTime();
          break;
        case 'modified':
        default:
          aValue = new Date(a.modified).getTime();
          bValue = new Date(b.modified).getTime();
          break;
      }

      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [state.scenarios, state.searchQuery, state.sortBy, state.sortOrder]);

  // Actions
  const loadScenarios = useCallback(async () => {
    try {
      await loadOrbatScenarios();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'خطا در بارگذاری سناریوها' 
      }));
    }
  }, [loadOrbatScenarios]);

  const handleScenarioAction = useCallback(async (action: ScenarioAction, scenarioId: string) => {
    try {
      switch (action) {
        case 'open':
          // Navigate to scenario editor
          window.location.href = `/orbat-editor/${scenarioId}`;
          break;
          
        case 'delete':
          if (window.confirm('آیا مطمئن هستید که می‌خواهید این سناریو را حذف کنید؟')) {
            await deleteScenario(scenarioId);
          }
          break;
          
        case 'download':
          // Implement download functionality
          console.log('Download scenario:', scenarioId);
          break;
          
        case 'duplicate':
          // Implement duplicate functionality
          console.log('Duplicate scenario:', scenarioId);
          break;
          
        case 'edit':
          // Navigate to scenario editor in edit mode
          window.location.href = `/orbat-editor/${scenarioId}?mode=edit`;
          break;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'خطا در انجام عملیات' 
      }));
    }
  }, [deleteScenario]);

  const handleDemoScenarioSelect = useCallback((scenarioId: string) => {
    // Navigate to demo scenario
    window.location.href = `/orbat-editor/demo-${scenarioId}`;
  }, []);

  const handleNewScenario = useCallback(() => {
    // Navigate to new scenario page
    window.location.href = '/dashboard/scenario-management/new';
  }, []);

  const handleUploadScenario = useCallback(async (file: File): Promise<UploadResult> => {
    try {
      const text = await file.text();
      const scenarioData = JSON.parse(text);
      
      // Validate scenario structure
      if (!scenarioData.type || scenarioData.type !== 'ORBAT-mapper') {
        throw new Error('فایل انتخاب شده سناریوی معتبر نیست');
      }

      const newScenario = await addScenario(scenarioData);
      
      return {
        success: true,
        scenario: convertOrbatScenarios([newScenario])[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در بارگذاری فایل'
      };
    }
  }, [addScenario, convertOrbatScenarios]);

  const handleLoadFromUrl = useCallback(async (url: string): Promise<UrlLoadResult> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('دریافت فایل از URL ناموفق بود');
      }
      
      const scenarioData = await response.json();
      
      // Validate scenario structure
      if (!scenarioData.type || scenarioData.type !== 'ORBAT-mapper') {
        throw new Error('فایل دریافت شده سناریوی معتبر نیست');
      }

      const newScenario = await addScenario(scenarioData);
      
      return {
        success: true,
        scenario: convertOrbatScenarios([newScenario])[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در بارگذاری از URL'
      };
    }
  }, [addScenario, convertOrbatScenarios]);

  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleSort = useCallback((sortBy: string) => {
    setState(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const refreshData = useCallback(async () => {
    await loadScenarios();
  }, [loadScenarios]);

  return {
    state,
    scenarios: filteredScenarios,
    demoScenarios: state.demoScenarios,
    sortOptions,
    isLoading: state.isLoading,
    error: state.error,
    loadScenarios,
    handleScenarioAction,
    handleDemoScenarioSelect,
    handleNewScenario,
    handleUploadScenario,
    handleLoadFromUrl,
    handleSearch,
    handleSort,
    refreshData
  };
};

export default useScenarioData;