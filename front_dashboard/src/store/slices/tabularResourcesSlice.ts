import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// Import JSON data files
import personnelData from '@/data/resources/personnel.json';
import equipmentData from '@/data/resources/equipment.json';
import ammunitionData from '@/data/resources/ammunition.json';
import logisticsData from '@/data/resources/logistics.json';
import ranksData from '@/data/resources/ranks.json';
import mapsData from '@/data/resources/maps.json';

// Types for our 6-tab resource management system
export interface PersonnelItem {
  id: string;
  personalCode: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  rank: string;
  unit: string;
  position?: string;
  phoneNumber?: string;
  email?: string;
  status: 'active' | 'inactive' | 'leave' | 'mission';
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  equipmentCode: string;
  name: string;
  type: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  acquisitionDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  location: string;
  assignedTo?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  createdAt: string;
  updatedAt: string;
}

export interface AmmunitionItem {
  id: string;
  ammunitionCode: string;
  name: string;
  caliber: string;
  type: string;
  manufacturer?: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  productionDate: string;
  expiryDate: string;
  status: 'available' | 'allocated' | 'used' | 'expired' | 'damaged';
  dangerClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  location: string;
  supplier?: string;
  unitPrice: number;
  totalValue: number;
  status: 'available' | 'low-stock' | 'out-of-stock' | 'ordered';
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
  // Hierarchical selection data
  hierarchicalData?: {
    path: Array<{ nodeId: string; nodeName: string; level: number }>;
    finalNode?: any;
    fieldValues: Record<string, any>;
  };
}

export interface RankItem {
  id: string;
  rankCode: string;
  title: string;
  level: number;
  category: string; 
  insignia?: string;
  authority: string[];
  description?: string;
  requirements?: string;
  status: 'active' | 'historical' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface MapItem {
  id: string;
  mapCode: string;
  title: string;
  type: 'topographic' | 'satellite' | 'tactical' | 'nautical' | 'aeronautical';
  scale?: string;
  area: string;
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  datum?: string;
  projection?: string;
  securityClassification: 'public' | 'restricted' | 'confidential' | 'secret';
  source?: string;
  lastUpdated: string;
  version: string;
  format: 'digital' | 'paper' | 'both';
  status: 'active' | 'archived' | 'superseded';
  createdAt: string;
  updatedAt: string;
}

// State interface
export interface TabularResourcesState {
  personnel: {
    items: PersonnelItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      rank?: string;
      unit?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  equipment: {
    items: EquipmentItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      type?: string;
      condition?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  ammunition: {
    items: AmmunitionItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      type?: string;
      dangerClass?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  logistics: {
    items: LogisticsItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      category?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  ranks: {
    items: RankItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      category?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  maps: {
    items: MapItem[];
    loading: boolean;
    error: string | null;
    filters: {
      search?: string;
      status?: string;
      type?: string;
      securityClassification?: string;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
}

// Initial state
const initialTabState = {
  items: [],
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 0,
    pageSize: 10,
    total: 0,
  },
};

const initialState: TabularResourcesState = {
  personnel: { ...initialTabState, items: [] },
  equipment: { ...initialTabState, items: [] },
  ammunition: { ...initialTabState, items: [] },
  logistics: { ...initialTabState, items: [] },
  ranks: { ...initialTabState, items: [] },
  maps: { ...initialTabState, items: [] },
};

// Resource types
export type ResourceType = 'personnel' | 'equipment' | 'ammunition' | 'logistics' | 'ranks' | 'maps';
export type ResourceItem = PersonnelItem | EquipmentItem | AmmunitionItem | LogisticsItem | RankItem | MapItem;

// Local storage utilities
const getStorageKey = (tabType: ResourceType) => `lindu_${tabType}_data`;

// Get initial data from JSON files
const getInitialData = (tabType: ResourceType): ResourceItem[] => {
  switch (tabType) {
    case 'personnel':
      return personnelData.personnel as PersonnelItem[];
    case 'equipment':
      return equipmentData.equipment as EquipmentItem[];
    case 'ammunition':
      return ammunitionData.ammunition as AmmunitionItem[];
    case 'logistics':
      return logisticsData.logistics as unknown as LogisticsItem[];
    case 'ranks':
      return ranksData.ranks as RankItem[];
    case 'maps':
      return mapsData.maps as MapItem[];
    default:
      return [];
  }
};

const loadFromStorage = (tabType: ResourceType): ResourceItem[] => {
  try {
    const data = localStorage.getItem(getStorageKey(tabType));
    if (data) {
      return JSON.parse(data);
    } else {
      // If no data in localStorage, load from JSON and save to localStorage
      const initialData = getInitialData(tabType);
      if (initialData.length > 0) {
        saveToStorage(tabType, initialData);
        console.log(`Loaded initial ${tabType} data from JSON file:`, initialData.length, 'items');
      }
      return initialData;
    }
  } catch (error) {
    console.error(`Error loading ${tabType} from storage:`, error);
    // Fallback to JSON data
    return getInitialData(tabType);
  }
};

const saveToStorage = (tabType: ResourceType, items: ResourceItem[]) => {
  try {
    localStorage.setItem(getStorageKey(tabType), JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving ${tabType} to storage:`, error);
  }
};

// Utility function to reset data - useful for development
export const resetTabData = (tabType: ResourceType) => {
  localStorage.removeItem(getStorageKey(tabType));
  console.log(`Reset ${tabType} data - will reload from JSON on next fetch`);
};

// Utility function to reset all tabs data
export const resetAllTabsData = () => {
  const tabTypes: ResourceType[] = ['personnel', 'equipment', 'ammunition', 'logistics', 'ranks', 'maps'];
  tabTypes.forEach(tabType => {
    localStorage.removeItem(getStorageKey(tabType));
  });
  console.log('Reset all tabs data - will reload from JSON files on next fetch');
};

// Async thunks for CRUD operations
export const fetchTabItems = createAsyncThunk(
  'tabularResources/fetchTabItems',
  async ({ tabType, filters }: { tabType: ResourceType; filters?: any }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Load from localStorage
    const items = loadFromStorage(tabType);
    
    // Apply filters if provided
    let filteredItems = items;
    if (filters) {
      filteredItems = items.filter(item => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const itemValues = Object.values(item).join(' ').toLowerCase();
          if (!itemValues.includes(searchLower)) return false;
        }
        if (filters.status && filters.status !== 'all') {
          if ((item as any).status !== filters.status) return false;
        }
        if (filters.category && filters.category !== 'all') {
          if ((item as any).category !== filters.category) return false;
        }
        if (filters.type && filters.type !== 'all') {
          if ((item as any).type !== filters.type) return false;
        }
        if (filters.condition && filters.condition !== 'all') {
          if ((item as any).condition !== filters.condition) return false;
        }
        if (filters.dangerClass && filters.dangerClass !== 'all') {
          if ((item as any).dangerClass !== filters.dangerClass) return false;
        }
        if (filters.securityClassification && filters.securityClassification !== 'all') {
          if ((item as any).securityClassification !== filters.securityClassification) return false;
        }
        return true;
      });
    }
    
    return {
      tabType,
      items: filteredItems,
      total: filteredItems.length,
    };
  }
);

export const createTabItem = createAsyncThunk(
  'tabularResources/createTabItem',
  async ({ tabType, itemData }: { tabType: ResourceType; itemData: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'> }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newItem = {
      ...itemData,
      id: `${tabType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ResourceItem;
    
    // Load existing items, add new item, and save back to storage
    const existingItems = loadFromStorage(tabType);
    const updatedItems = [newItem, ...existingItems];
    saveToStorage(tabType, updatedItems);
    
    return { tabType, item: newItem };
  }
);

export const updateTabItem = createAsyncThunk(
  'tabularResources/updateTabItem',
  async ({ tabType, itemId, itemData }: { tabType: ResourceType; itemId: string; itemData: Partial<ResourceItem> }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const updatedItem = {
      ...itemData,
      id: itemId,
      updatedAt: new Date().toISOString(),
    } as ResourceItem;
    
    // Load existing items, update the specific item, and save back to storage
    const existingItems = loadFromStorage(tabType);
    const updatedItems = existingItems.map(item => 
      item.id === itemId ? { ...item, ...updatedItem } : item
    );
    saveToStorage(tabType, updatedItems);
    
    return { tabType, item: updatedItem };
  }
);

/** ادغام ردیف‌های برگشتی از ایمپورت اکسل با دادهٔ موجود در localStorage */
export const mergeImportedResources = createAsyncThunk(
  'tabularResources/mergeImported',
  async ({
    personnel,
    equipment,
  }: {
    personnel: PersonnelItem[];
    equipment: EquipmentItem[];
  }) => {
    if (personnel.length) {
      const existing = loadFromStorage('personnel') as PersonnelItem[];
      saveToStorage('personnel', [...personnel, ...existing]);
    }
    if (equipment.length) {
      const existing = loadFromStorage('equipment') as EquipmentItem[];
      saveToStorage('equipment', [...equipment, ...existing]);
    }
    return { personnelCount: personnel.length, equipmentCount: equipment.length };
  }
);

export const deleteTabItem = createAsyncThunk(
  'tabularResources/deleteTabItem',
  async ({ tabType, itemId }: { tabType: ResourceType; itemId: string }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Load existing items, remove the specific item, and save back to storage
    const existingItems = loadFromStorage(tabType);
    const updatedItems = existingItems.filter(item => item.id !== itemId);
    saveToStorage(tabType, updatedItems);
    
    return { tabType, itemId };
  }
);

// Slice
const tabularResourcesSlice = createSlice({
  name: 'tabularResources',
  initialState,
  reducers: {
    // Set filters for a specific tab
    setTabFilters: (state, action: PayloadAction<{ tabType: ResourceType; filters: any }>) => {
      const { tabType, filters } = action.payload;
      state[tabType].filters = { ...state[tabType].filters, ...filters };
    },
    
    // Clear filters for a specific tab
    clearTabFilters: (state, action: PayloadAction<ResourceType>) => {
      const tabType = action.payload;
      state[tabType].filters = {};
    },
    
    // Set pagination for a specific tab
    setTabPagination: (state, action: PayloadAction<{ tabType: ResourceType; pagination: Partial<{ page: number; pageSize: number; total: number }> }>) => {
      const { tabType, pagination } = action.payload;
      state[tabType].pagination = { ...state[tabType].pagination, ...pagination };
    },
    
    // Clear error for a specific tab
    clearTabError: (state, action: PayloadAction<ResourceType>) => {
      const tabType = action.payload;
      state[tabType].error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchTabItems.pending, (state, action) => {
        const tabType = action.meta.arg.tabType;
        state[tabType].loading = true;
        state[tabType].error = null;
      })
      .addCase(fetchTabItems.fulfilled, (state, action) => {
        const { tabType, items, total } = action.payload;
        state[tabType].loading = false;
        (state[tabType] as any).items = items;
        state[tabType].pagination.total = total;
      })
      .addCase(fetchTabItems.rejected, (state, action) => {
        const tabType = action.meta.arg.tabType;
        state[tabType].loading = false;
        state[tabType].error = action.error.message || 'خطا در بارگذاری اطلاعات';
      })
      
      // Create item
      .addCase(createTabItem.pending, (state, action) => {
        const tabType = action.meta.arg.tabType;
        state[tabType].loading = true;
        state[tabType].error = null;
      })
      .addCase(createTabItem.fulfilled, (state, action) => {
        const { tabType, item } = action.payload;
        state[tabType].loading = false;
        (state[tabType] as any).items.unshift(item);
        state[tabType].pagination.total += 1;
      })
      .addCase(createTabItem.rejected, (state, action) => {
        const tabType = action.meta.arg.tabType;
        state[tabType].loading = false;
        state[tabType].error = action.error.message || 'خطا در ایجاد آیتم';
      })
      
      // Update item
      .addCase(updateTabItem.fulfilled, (state, action) => {
        const { tabType, item } = action.payload;
        const items = (state[tabType] as any).items;
        const index = items.findIndex((i: any) => i.id === item.id);
        if (index !== -1) {
          items[index] = item;
        }
      })
      
      // Delete item
      .addCase(deleteTabItem.fulfilled, (state, action) => {
        const { tabType, itemId } = action.payload;
        (state[tabType] as any).items = (state[tabType] as any).items.filter((i: any) => i.id !== itemId);
        state[tabType].pagination.total -= 1;
      })
      .addCase(mergeImportedResources.pending, (state) => {
        state.personnel.loading = true;
        state.equipment.loading = true;
        state.personnel.error = null;
        state.equipment.error = null;
      })
      .addCase(mergeImportedResources.fulfilled, (state) => {
        state.personnel.loading = false;
        state.equipment.loading = false;
      })
      .addCase(mergeImportedResources.rejected, (state, action) => {
        state.personnel.error = action.error.message || 'خطا در ایمپورت';
        state.equipment.error = action.error.message || 'خطا در ایمپورت';
      });
  },
});

// Actions
export const {
  setTabFilters,
  clearTabFilters,
  setTabPagination,
  clearTabError,
} = tabularResourcesSlice.actions;

// Selectors
export const selectTabularResources = (state: RootState) => state.tabularResources;
export const selectTabItems = (state: RootState, tabType: ResourceType) => state.tabularResources[tabType].items;
export const selectTabLoading = (state: RootState, tabType: ResourceType) => state.tabularResources[tabType].loading;
export const selectTabError = (state: RootState, tabType: ResourceType) => state.tabularResources[tabType].error;
export const selectTabFilters = (state: RootState, tabType: ResourceType) => state.tabularResources[tabType].filters;
export const selectTabPagination = (state: RootState, tabType: ResourceType) => state.tabularResources[tabType].pagination;

export default tabularResourcesSlice.reducer;