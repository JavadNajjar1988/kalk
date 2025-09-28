import { useState, useEffect, useCallback } from 'react';

// Export ReferenceSections type
export type ReferenceSections = 'hierarchy' | 'data' | 'both';

// Type definitions for Reference Data
export interface ReferenceDataItem {
  id: string;
  name: string;
  englishName?: string;
  description?: string;
  level?: number;
  category?: string;
  parentId?: string;
  type?: string;
  // Additional flexible properties
  [key: string]: any;
}

export interface ReferenceCategoryData {
  id: string;
  name: string;
  englishName: string;
  description: string;
  items: ReferenceDataItem[];
  loading: boolean;
  error?: string;
  lastSyncTime: number;
}

// Mapping of category IDs to their corresponding JSON filenames
// Categories not in this mapping will use their ID as the filename
// This is for backwards compatibility and special cases only
const CATEGORY_FILE_MAPPING: Record<string, string> = {
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
  'logistics': 'logistics'
};

// Function to load category data from JSON files
const loadCategoryData = async (categoryId: string): Promise<any> => {
  // Try to use mapping first, then fall back to categoryId as filename
  const fileName = CATEGORY_FILE_MAPPING[categoryId] || categoryId;
  if (!fileName) {
    throw new Error(`Unknown category: ${categoryId}`);
  }
  
  try {
    const module = await import(`@/modules/definition-editor/data/json/${fileName}.json`);
    const data = module.default || module;
    
    // Validate JSON structure
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid JSON structure in ${fileName}.json: data is not an object`);
    }
    
    // Check for required properties (at least one should exist)
    if (!data.nodes && !data.levels) {
      throw new Error(`Invalid JSON structure in ${fileName}.json: missing both 'nodes' and 'levels' arrays`);
    }
    
    // Validate nodes array if exists
    if (data.nodes && !Array.isArray(data.nodes)) {
      throw new Error(`Invalid JSON structure in ${fileName}.json: 'nodes' is not an array`);
    }
    
    // Validate levels array if exists
    if (data.levels && !Array.isArray(data.levels)) {
      throw new Error(`Invalid JSON structure in ${fileName}.json: 'levels' is not an array`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with more context
      if (error.message.includes('Cannot resolve module')) {
        // If the category file doesn't exist, it might be a new category
        // Return empty data structure instead of throwing an error
        console.warn(`فایل ${fileName}.json موجود نیست - دسته‌بندی جدید یا در حال توسعه`);
        return { nodes: [], levels: [] };
      } else if (error.message.includes('JSON')) {
        throw new Error(`خطای تجزیه JSON در فایل ${fileName}.json: ${error.message}`);
      } else if (error.message.includes('Invalid JSON structure')) {
        throw new Error(error.message);
      } else {
        throw new Error(`خطای بارگذاری ${fileName}.json: ${error.message}`);
      }
    }
    console.error(`Error loading ${fileName}.json:`, error);
    throw error;
  }
};

// Helper function to recursively flatten hierarchical nodes
const flattenNodes = (nodes: any[]): ReferenceDataItem[] => {
  const items: ReferenceDataItem[] = [];
  
  for (const node of nodes) {
    // Add the current node as an item
    const item: ReferenceDataItem = {
      id: node.id,
      name: node.name,
      englishName: node.englishName,
      description: node.description,
      level: node.level,
      category: node.category,
      parentId: node.parentId,
      type: node.type || 'data',
      // Additional properties specific to different categories
      country: node.country,
      natoEquivalent: node.natoEquivalent,
      icon: node.icon,
      coordinates: node.coordinates,
      ...node // Include any other additional properties
    };
    
    // Remove undefined properties to keep the object clean
    Object.keys(item).forEach(key => {
      if (item[key] === undefined) {
        delete item[key];
      }
    });
    
    items.push(item);
    
    // Recursively process children if they exist
    if (node.children && Array.isArray(node.children)) {
      const childItems = flattenNodes(node.children);
      items.push(...childItems);
    }
  }
  
  return items;
};

// Function to extract hierarchy items from JSON data
// مديريت سطوح سلسله مراتبى - gets data from "levels" array
const extractHierarchyItems = (data: any): ReferenceDataItem[] => {
  // Primary source: levels array for hierarchy level definitions
  if (data.levels && Array.isArray(data.levels)) {
    return data.levels.map((level: any) => ({
      id: level.id,
      name: level.name,
      englishName: level.englishName,
      description: level.description || `Level ${level.order}: ${level.name}`,
      level: level.order,
      category: level.name,
      type: 'hierarchy',
      // Additional properties from levels
      isRequired: level.isRequired,
      isActive: level.isActive,
      icon: level.icon,
      natoRank: level.natoRank,
      standardCode: level.standardCode,
      personnelRange: level.personnelRange,
      specialty: level.specialty,
      order: level.order
    }));
  }
  
  // Fallback: if no levels array exists, return empty array
  return [];
};

// Function to extract data items from JSON nodes
// مديريت دادهها - gets data from "nodes" array (actual data items)
const extractDataItems = (data: any): ReferenceDataItem[] => {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return [];
  }
  
  // Extract all nodes as actual data items (ranks, geographical places, etc.)
  return flattenNodes(data.nodes);
};

/**
 * Hook برای بارگذاری و مدیریت داده‌های دسته‌بندی‌های مرجع
 * این hook امکان دریافت real-time داده‌ها از دسته‌بندی‌های مختلف را فراهم می‌کند
 */
export const useReferenceData = (categoryId?: string, sections?: ReferenceSections) => {
  const [data, setData] = useState<ReferenceCategoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // بارگذاری داده‌ها از فایل‌های JSON واقعی
  const loadReferenceData = useCallback(async (catId: string, selectedSections?: ReferenceSections) => {
    try {
      setLoading(true);
      setError(null);

      // بارگذاری داده‌ها از فایل JSON دسته‌بندی
      const jsonData = await loadCategoryData(catId);

      // Extract items based on selected section
      let items: ReferenceDataItem[] = [];
      
      // Default to 'both' if no section specified
      const section = selectedSections || 'both';
      
      try {
        switch (section) {
          case 'hierarchy':
            items = extractHierarchyItems(jsonData);
            if (items.length === 0) {
              console.warn(`No hierarchy items found in ${catId} data`);
            }
            break;
          case 'data':
            items = extractDataItems(jsonData);
            if (items.length === 0) {
              console.warn(`No data items found in ${catId} data`);
            }
            break;
          case 'both':
            const hierarchyItems = extractHierarchyItems(jsonData);
            const dataItems = extractDataItems(jsonData);
            items = [...hierarchyItems, ...dataItems];
            if (items.length === 0) {
              console.warn(`No items found in either hierarchy or data sections for ${catId}`);
            }
            break;
        }
      } catch (extractError) {
        throw new Error(`خطا در استخراج داده‌ها از بخش "${section}": ${extractError instanceof Error ? extractError.message : 'خطای نامشخص'}`);
      }

      // Get category info from metadata instead of hard-coded data
      const metadata = await loadCategoriesMetadata();
      const categoryInfo = metadata[catId] || {
        name: catId,
        englishName: catId,
        description: 'دسته‌بندی نامشخص'
      };

      const referenceData: ReferenceCategoryData = {
        id: catId,
        name: categoryInfo.name,
        englishName: categoryInfo.englishName,
        description: categoryInfo.description,
        items,
        loading: false,
        error: undefined,
        lastSyncTime: Date.now()
      };

      setData(referenceData);
    } catch (err) {
      console.error('Error loading reference data:', err);
      let errorMessage = 'خطا در بارگذاری داده‌های مرجع';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // بروزرسانی داده‌ها هنگام تغییر categoryId یا sections
  useEffect(() => {
    if (categoryId) {
      loadReferenceData(categoryId, sections);
    } else {
      setData(null);
      setError(null);
    }
  }, [categoryId, sections, loadReferenceData]);

  // تابع بروزرسانی دستی
  const refresh = useCallback(() => {
    if (categoryId) {
      loadReferenceData(categoryId, sections);
    }
  }, [categoryId, sections, loadReferenceData]);

  // تابع جستجو در داده‌ها
  const searchItems = useCallback((query: string): ReferenceDataItem[] => {
    if (!data || !query.trim()) {
      return data?.items || [];
    }

    const searchTerm = query.toLowerCase();
    return data.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.englishName?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
  }, [data]);

  // تابع دریافت آیتم بر اساس ID
  const getItemById = useCallback((id: string): ReferenceDataItem | undefined => {
    return data?.items.find(item => item.id === id);
  }, [data]);

  // تابع دریافت آیتم‌های فرزند
  const getChildItems = useCallback((parentId: string): ReferenceDataItem[] => {
    if (!data) return [];
    return data.items.filter(item => item.parentId === parentId);
  }, [data]);

  return {
    data,
    loading,
    error,
    refresh,
    searchItems,
    getItemById,
    getChildItems,
    // Helper functions
    hasData: !!data && data.items.length > 0,
    isEmpty: !!data && data.items.length === 0,
    isReady: !loading && !error && !!data
  };
};

// Cache for categories metadata
const categoriesMetadataCache = new Map<string, any>();

// Function to load categories metadata from JSON file
const loadCategoriesMetadata = async (): Promise<any> => {
  const cacheKey = 'categories_metadata';
  if (categoriesMetadataCache.has(cacheKey)) {
    return categoriesMetadataCache.get(cacheKey);
  }
  
  try {
    const module = await import('@/modules/definition-editor/data/json/categories-metadata.json');
    const metadata = module.default || module;
    categoriesMetadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Error loading categories metadata:', error);
    // Fallback to empty object if metadata file is not found
    return {};
  }
};

/**
 * Hook برای دریافت لیست تمام دسته‌بندی‌های موجود
 * فقط دسته‌بندی‌هایی که برای Reference Fields مناسب هستند
 * داده‌ها از فایل categories-metadata.json خوانده می‌شوند
 */
export const useAvailableReferenceCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const metadata = await loadCategoriesMetadata();
        
        // Convert metadata object to array format compatible with existing interface
        const categoriesArray = Object.values(metadata).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          englishName: cat.englishName,
          description: cat.description,
          icon: cat.icon,
          hasHierarchy: cat.hasHierarchy,
          hasData: cat.hasData,
          color: cat.color,
          maxLevels: cat.maxLevels,
          isActive: cat.isActive,
          order: cat.order
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

  return {
    categories,
    loading,
    error,
    getCategoryById: (id: string) => categories.find(cat => cat.id === id),
    getCategoryName: (id: string) => categories.find(cat => cat.id === id)?.name || id,
    // Helper functions
    getDualSectionCategories: () => categories.filter(cat => cat.hasHierarchy && cat.hasData),
    getSingleSectionCategories: () => categories.filter(cat => cat.hasHierarchy && !cat.hasData),
    getAvailableSections: (categoryId: string) => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return [];
      
      const sections = [];
      if (category.hasHierarchy) sections.push('hierarchy');
      if (category.hasData) sections.push('data');
      if (category.hasHierarchy && category.hasData) sections.push('both');
      
      return sections;
    }
  };
};

export default useReferenceData;