import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadPersonsData } from '@/modules/definition-editor/data/loader';
import { useDefinitionSync } from '@/utils/definitionSync';
import type { DefinitionNode } from '@/modules/definition-editor/types';
import type { DefinitionChangeEvent } from '@/utils/definitionSync';

export interface TabDefinition {
  id: string;
  name: string;
  englishName: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference';
  isRequired: boolean;
  order: number;
  options?: string[];
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
  };
  referenceCategory?: string; // For reference fields
  referencePath?: string; // For reference fields - equivalent to referenceSections
  referenceSections?: string; // Alternative name for referencePath for compatibility
  referenceDisplayField?: string; // Field to display from referenced data
  referenceValueField?: string; // Field to use as value from referenced data
  allowMultiple?: boolean; // For multi-select reference fields
}

export interface CategoryDefinition {
  id: string;
  name: string;
  englishName: string;
  tabs: TabDefinition[];
}

/**
 * Hook for reading definition data from definition-editor module
 * This enables dynamic form generation based on the definitions
 * با پشتیبانی از real-time sync با definition-editor
 */
export const useDefinitionData = (categoryType: 'users' | 'resources') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<CategoryDefinition | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // تعیین ID گره اصلی بر اساس نوع دسته‌بندی
  const rootNodeId = useMemo(() => {
    return categoryType === 'users' ? 'pr-2' : 'pr-1'; // pr-2 = Users, pr-1 = Resources
  }, [categoryType]);

  // تنظیم سیستم real-time sync
  const syncCallback = useCallback((event: DefinitionChangeEvent) => {
    console.log('Definition data received sync event:', event);
    
    // بررسی اینکه آیا تغییر مربوط به گره‌های ما است یا خیر
    if (event.category === 'persons' && 
        (event.nodeId.startsWith(rootNodeId) || event.nodeId === '*')) {
      console.log('Relevant definition change detected, refreshing definition data...');
      setLastSyncTime(Date.now());
      setRefreshKey(prev => prev + 1);
    }
  }, [rootNodeId]);

  const syncSystem = useDefinitionSync(
    `definition-data-${categoryType}-${rootNodeId}`,
    syncCallback,
    ['persons'], // فقط به تغییرات persons گوش دهیم
    [rootNodeId] // فقط به تغییرات گره مربوطه گوش دهیم
  );

  // راه‌اندازی listener در mount
  useEffect(() => {
    syncSystem.addListener();
    return () => {
      syncSystem.removeListener();
    };
  }, [syncSystem]);

  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading definition data for ${categoryType} (${rootNodeId})...`);

        // Load persons data from definition-editor
        const personsData = await loadPersonsData('persons');
        
        if (!personsData || personsData.length === 0) {
          throw new Error('No persons data found');
        }

        // Find the appropriate root node based on category type
        const rootNode = personsData.find(node => node.id === rootNodeId);
        
        if (!rootNode) {
          throw new Error(`Root node not found for category: ${categoryType}`);
        }

        // Transform definition data into our format
        const categoryDefinition: CategoryDefinition = {
          id: rootNode.id,
          name: rootNode.name,
          englishName: (rootNode as any).englishName || rootNode.name,
          tabs: transformNodesToTabs(rootNode.children || [])
        };

        console.log('Definition data loaded successfully:', {
          categoryId: categoryDefinition.id,
          categoryName: categoryDefinition.name,
          tabsCount: categoryDefinition.tabs.length,
          syncTime: lastSyncTime
        });
        
        setDefinitionData(categoryDefinition);
      } catch (err) {
        console.error('Error loading definition data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadDefinitions();
  }, [categoryType, rootNodeId, refreshKey, lastSyncTime]);

  // تابع refresh برای به‌روزرسانی دستی
  const reload = useCallback(() => {
    console.log('Manual reload triggered for definition data');
    setRefreshKey(prev => prev + 1);
  }, []);

  // تابع برای trigger کردن sync event به‌صورت دستی
  const triggerManualSync = useCallback(() => {
    console.log('Manual sync triggered for definition data');
    syncSystem.triggerSync('persons', rootNodeId);
  }, [syncSystem, rootNodeId]);

  // دریافت اطلاعات آخرین sync
  const getSyncInfo = useCallback(() => {
    return {
      lastSyncTime,
      syncHistory: syncSystem.getHistory().slice(-3), // آخرین 3 event
      isAutoSyncEnabled: true
    };
  }, [lastSyncTime, syncSystem]);

  return {
    definitionData,
    loading,
    error,
    reload,
    triggerManualSync,
    getSyncInfo,
    lastSyncTime
  };
};

/**
 * Transform definition nodes to tab format for dynamic forms
 */
function transformNodesToTabs(nodes: DefinitionNode[]): TabDefinition[] {
  return nodes.map(node => {
    const transformedTab = {
      id: node.id,
      name: node.name,
      englishName: (node as any).englishName || node.name,
      fields: transformCustomFieldsToFieldDefinitions(Array.isArray(node.customFields) ? node.customFields : [])
    };
    
    console.log('Transforming node to tab:', {
      nodeId: node.id,
      nodeName: node.name,
      hasChildren: (node.children || []).length > 0,
      customFieldsCount: (node.customFields || []).length,
      transformedFieldsCount: transformedTab.fields.length
    });
    
    return transformedTab;
  });
}

/**
 * Transform custom fields to field definitions
 */
function transformCustomFieldsToFieldDefinitions(customFields: any[]): FieldDefinition[] {
  return customFields.map(field => ({
    id: field.id,
    name: field.name,
    englishName: field.englishName,
    type: field.type,
    isRequired: field.isRequired,
    order: field.order,
    options: field.options,
    validationRules: field.validationRules,
    // Reference field properties
    referenceCategory: field.referenceCategory,
    referencePath: field.referencePath,
    referenceSections: field.referenceSections || field.referencePath, // Support both names
    referenceDisplayField: field.referenceDisplayField,
    referenceValueField: field.referenceValueField,
    allowMultiple: field.allowMultiple,
  }));
}

/**
 * Hook for getting available categories for reference fields
 * Loads categories from the unified metadata source
 */
export const useAvailableCategories = () => {
  const [categories, setCategories] = useState<{ id: string; name: string; englishName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load from categories metadata
        const module = await import('@/modules/definition-editor/data/json/categories-metadata.json');
        const metadata = module.default || module;
        
        // Convert to expected format
        const categoriesArray = Object.values(metadata).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          englishName: cat.englishName
        })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('خطا در بارگذاری دسته‌بندی‌ها');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
};

/**
 * Hook for getting field options from a reference category
 * This loads actual data from JSON files instead of mock data
 */
export const useReferenceFieldOptions = (categoryId?: string, path?: string) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId || !path) {
      setOptions([]);
      return;
    }

    const loadReferenceOptions = async () => {
      try {
        setLoading(true);
        
        // Load data from actual JSON files using the same loader used by useReferenceData
        const fileName = {
          'geographical': 'geographical',
          'military_ranks': 'military_ranks', 
          'mission_type': 'mission_type',
          'operational_status': 'operational_status',
          'operational_environment': 'operational_environment',
          'time_definitions': 'time_definitions',
          'coding_classification': 'coding_classification',
          'force_type': 'military_unit_type',
          'organizational_affiliation': 'organizational_affiliation',
          'specialty_training': 'specialty_training',
          'threat_type': 'threat_type',
          'info_classification': 'info_classification',
          'logistics_status': 'logistics_status',
          'weather': 'weather',
          'logistics': 'logistics',
          'equipment': 'equipment',
          'military_units': 'military_units',
          'ammunition': 'ammunition',
          'persons': 'persons'
        }[categoryId];
        
        if (!fileName) {
          console.warn(`Unknown category: ${categoryId}`);
          setOptions([]);
          return;
        }
        
        const module = await import(`@/modules/definition-editor/data/json/${fileName}.json`);
        const jsonData = module.default || module;
        
        // Extract options from nodes array
        let data: { value: string; label: string }[] = [];
        if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
          data = jsonData.nodes.map((node: any) => ({
            value: node.id || node.name,
            label: node.name || node.id
          }));
        }
        
        setOptions(data);
      } catch (err) {
        console.error('Error loading reference options:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceOptions();
  }, [categoryId, path]);

  return { options, loading };
};