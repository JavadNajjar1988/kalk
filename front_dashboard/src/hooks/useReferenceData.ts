import { useMemo } from 'react';

export type ReferenceSections = 'hierarchy' | 'data' | 'both';

export interface ReferenceDataItem {
  id: string;
  name: string;
  englishName?: string;
  description?: string;
  level?: number;
  category?: string;
  parentId?: string;
  type?: string;
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

export const useReferenceData = (categoryId?: string, _sections?: ReferenceSections) => {
  const data = useMemo<ReferenceCategoryData | null>(() => {
    if (!categoryId) return null;
    return {
      id: categoryId,
      name: categoryId,
      englishName: categoryId,
      description: 'Reference data',
      items: [],
      loading: false,
      lastSyncTime: Date.now(),
    };
  }, [categoryId]);

  return {
    data,
    loading: false,
    error: null as string | null,
    refresh: () => {},
    searchItems: (_q: string) => data?.items || [],
    getItemById: (id: string) => data?.items.find((i) => i.id === id),
    getChildItems: (parentId: string) => data?.items.filter((i) => i.parentId === parentId) || [],
    hasData: !!data && data.items.length > 0,
    isEmpty: !!data && data.items.length === 0,
    isReady: !!data,
  };
};

export const useAvailableReferenceCategories = () => {
  const categories = [
    { id: 'geographical', name: 'جغرافیا', englishName: 'Geographical', hasHierarchy: true, hasData: true, icon: 'public' },
    { id: 'military_ranks', name: 'درجات', englishName: 'Military Ranks', hasHierarchy: true, hasData: true, icon: 'military_tech' },
    { id: 'equipment', name: 'تجهیزات', englishName: 'Equipment', hasHierarchy: true, hasData: true, icon: 'inventory' },
    { id: 'logistics', name: 'لجستیک', englishName: 'Logistics', hasHierarchy: true, hasData: true, icon: 'local_shipping' },
    { id: 'ammunition', name: 'مهمات', englishName: 'Ammunition', hasHierarchy: true, hasData: true, icon: 'security' },
  ];

  return {
    categories,
    loading: false,
    error: null as string | null,
    getCategoryById: (id: string) => categories.find((c) => c.id === id),
    getCategoryName: (id: string) => categories.find((c) => c.id === id)?.name || id,
    getDualSectionCategories: () => categories.filter((c) => c.hasHierarchy && c.hasData),
    getSingleSectionCategories: () => categories.filter((c) => c.hasHierarchy && !c.hasData),
    getAvailableSections: (_categoryId: string) => ['hierarchy', 'data', 'both'],
  };
};

export default useReferenceData;
