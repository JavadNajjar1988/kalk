/**
 * useScenarioData Hook
 * هوک مدیریت داده‌های سناریو با ارتباط به API سرور
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import type { 
  ScenarioMetadata, 
  DemoScenario, 
  SortOption, 
  LandingPageState,
  ScenarioAction,
  UploadResult,
  UrlLoadResult
} from '../types';
import type { EnhancedScenario } from '@/types';

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

  // Convert API scenarios to our format
  const convertApiScenarios = useCallback((apiData: any[]): ScenarioMetadata[] => {
    return apiData.map((scenario: any) => ({
      id: scenario.id,
      name: scenario.name || 'بدون نام',
      description: scenario.description || '',
      created: scenario.created ? new Date(scenario.created) : (scenario.createdAt ? new Date(scenario.createdAt) : new Date()),
      modified: scenario.modified ? new Date(scenario.modified) : (scenario.updatedAt ? new Date(scenario.updatedAt) : new Date()),
      // API فعلی همه سناریوها را از نوع ORBAT-mapper برمی‌گرداند؛ در آینده می‌توان این را از متادیتا تشخیص داد
      type: (scenario.metadata?.type as 'ORBAT-mapper' | 'custom') ?? 'ORBAT-mapper',
      version: scenario.metadata?.version || scenario.version,
      imageUrl: scenario.image
    }));
  }, []);

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
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const apiScenarios = await scenarioApiService.getScenarios();
      const convertedScenarios = convertApiScenarios(apiScenarios);
      setState(prev => ({
        ...prev,
        scenarios: convertedScenarios,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'خطا در بارگذاری سناریوها' 
      }));
    }
  }, [convertApiScenarios]);

  const handleScenarioAction = useCallback(async (action: ScenarioAction, scenarioId: string) => {
    try {
      switch (action) {
        case 'open':
          // Navigate to kalknegar editor
          window.open(`/kalknegar/scenario/${scenarioId}?integration=react`, '_self');
          break;
        case 'run': {
          const simulatorBaseUrl = (import.meta as any).env?.VITE_SIMULATOR_URL || 'http://localhost:3001';
          const simulatorUrl = `${simulatorBaseUrl}?scenarioId=${encodeURIComponent(scenarioId)}`;
          const popup = window.open(simulatorUrl, '_blank', 'noopener,noreferrer,width=1920,height=1080');
          if (!popup) {
            setState(prev => ({
              ...prev,
              error: 'مرورگر مانع باز شدن شبیه‌ساز شد. لطفاً popup blocker را غیرفعال کنید.'
            }));
          }
          break;
        }
          
        case 'delete':
          if (window.confirm('آیا مطمئن هستید که می‌خواهید این سناریو را حذف کنید؟')) {
            await scenarioApiService.deleteScenario(scenarioId);
            // Refresh scenarios list
            await loadScenarios();
          }
          break;
          
        case 'download':
          // Download scenario as JSON
          try {
            await scenarioApiService.downloadScenarioAsJson(scenarioId);
          } catch (error) {
            console.error('Failed to download scenario:', error);
            setState(prev => ({ 
              ...prev, 
              error: 'خطا در دانلود سناریو' 
            }));
          }
          break;
          
        case 'duplicate':
          // Duplicate scenario
          try {
            const duplicated = await scenarioApiService.duplicateScenario(scenarioId);
            await loadScenarios();
          } catch (error) {
            console.error('Failed to duplicate scenario:', error);
            setState(prev => ({ 
              ...prev, 
              error: 'خطا در کپی سناریو' 
            }));
          }
          break;
          
        case 'edit':
          // Navigate to kalknegar editor in edit mode
          window.open(`/kalknegar/scenario/${scenarioId}?integration=react`, '_self');
          break;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'خطا در انجام عملیات' 
      }));
    }
  }, [loadScenarios]);

  const handleDemoScenarioSelect = useCallback((scenarioId: string) => {
    // Navigate to demo scenario in kalknegar
    window.open(`/kalknegar/scenario/demo-${scenarioId}?integration=react`, '_self');
  }, []);

  const handleNewScenario = useCallback(() => {
    // Navigate to kalknegar new scenario page
    window.open('/kalknegar/newscenario?integration=react', '_self');
  }, []);

  const handleUploadScenario = useCallback(async (file: File): Promise<UploadResult> => {
    try {
      const text = await file.text();
      const scenarioData = JSON.parse(text);
      
      // Import scenario using API service
      const importedScenario = await scenarioApiService.importScenario(file);
      
      // Refresh scenarios list
      await loadScenarios();
      
      return {
        success: true,
        scenario: convertApiScenarios([importedScenario])[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در بارگذاری فایل'
      };
    }
  }, [convertApiScenarios, loadScenarios]);

  const handleLoadFromUrl = useCallback(async (url: string): Promise<UrlLoadResult> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('دریافت فایل از URL ناموفق بود');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'scenario.json', { type: 'application/json' });
      
      // Import scenario using API service
      const importedScenario = await scenarioApiService.importScenario(file);
      
      // Refresh scenarios list
      await loadScenarios();
      
      return {
        success: true,
        scenario: convertApiScenarios([importedScenario])[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در بارگذاری از URL'
      };
    }
  }, [convertApiScenarios, loadScenarios]);

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

  // Auto-load effect
  useEffect(() => {
    if (autoLoad) {
      loadScenarios();
    }
  }, [autoLoad, loadScenarios]);

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