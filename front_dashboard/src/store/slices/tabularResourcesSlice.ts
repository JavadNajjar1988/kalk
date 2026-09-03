import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import resourceApiService, {
  ResourceDto,
  ResourceType as ApiResourceType,
  ResourceBulkImportItem,
} from '@/services/api/resourceApiService';

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
  /** شناسهٔ تصویر اصلی منبع (در سیستم مدیا/ResourceMedia). */
  primaryMediaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  equipmentCode: string;
  name: string;
  type: string;
  quantity?: number;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  acquisitionDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  location: string;
  assignedTo?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  primaryMediaId?: string;
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
  primaryMediaId?: string;
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
  primaryMediaId?: string;
  createdAt: string;
  updatedAt: string;
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
  primaryMediaId?: string;
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

export interface TabularResourcesState {
  personnel: TabState<PersonnelItem>;
  equipment: TabState<EquipmentItem>;
  ammunition: TabState<AmmunitionItem>;
  logistics: TabState<LogisticsItem>;
  ranks: TabState<RankItem>;
  maps: TabState<MapItem>;
}

interface TabState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  filters: Record<string, any>;
  pagination: { page: number; pageSize: number; total: number };
}

const initialTabState = <T,>(): TabState<T> => ({
  items: [],
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 0, pageSize: 10, total: 0 },
});

const initialState: TabularResourcesState = {
  personnel: initialTabState<PersonnelItem>(),
  equipment: initialTabState<EquipmentItem>(),
  ammunition: initialTabState<AmmunitionItem>(),
  logistics: initialTabState<LogisticsItem>(),
  ranks: initialTabState<RankItem>(),
  maps: initialTabState<MapItem>(),
};

// تب یگان‌ها مستقیماً از سرویس عمومی منابع استفاده می‌کند و در این اسلایس قدیمی نیست.
export type ResourceType = Exclude<ApiResourceType, 'units'>;
export type ResourceItem =
  | PersonnelItem
  | EquipmentItem
  | AmmunitionItem
  | LogisticsItem
  | RankItem
  | MapItem;

// ---- Mapping helpers ---------------------------------------------------------
//
// منابع روی بک‌اند با ساختار عمومی (id/type/name/code/metadata) ذخیره می‌شوند.
// در این فایل، فیلدهای اختصاصی هر تب در `metadata` (JSONB) سریال می‌شوند تا
// تایپ‌های پیشین UI دست‌نخورده بمانند و در فاز ۲ صرفاً منبع داده عوض شود.

const TAB_DOMAIN_KEYS: Record<ResourceType, string[]> = {
  personnel: [
    'firstName',
    'lastName',
    'nationalId',
    'rank',
    'unit',
    'position',
    'phoneNumber',
    'email',
    'startDate',
    'primaryMediaId',
  ],
  equipment: [
    'type',
    'quantity',
    'model',
    'manufacturer',
    'serialNumber',
    'acquisitionDate',
    'condition',
    'location',
    'assignedTo',
    'primaryMediaId',
  ],
  ammunition: [
    'caliber',
    'type',
    'manufacturer',
    'lotNumber',
    'quantity',
    'unit',
    'storageLocation',
    'productionDate',
    'expiryDate',
    'dangerClass',
    'primaryMediaId',
  ],
  logistics: [
    'category',
    'description',
    'quantity',
    'unit',
    'minStock',
    'maxStock',
    'location',
    'supplier',
    'unitPrice',
    'totalValue',
    'lastRestocked',
    'hierarchicalData',
    'primaryMediaId',
  ],
  ranks: [
    'level',
    'category',
    'insignia',
    'authority',
    'description',
    'requirements',
    'primaryMediaId',
  ],
  maps: [
    'type',
    'scale',
    'area',
    'coordinates',
    'datum',
    'projection',
    'securityClassification',
    'source',
    'lastUpdated',
    'version',
    'format',
  ],
};

const CODE_FIELD_BY_TAB: Record<ResourceType, keyof any> = {
  personnel: 'personalCode',
  equipment: 'equipmentCode',
  ammunition: 'ammunitionCode',
  logistics: 'itemCode',
  ranks: 'rankCode',
  maps: 'mapCode',
};

const NAME_FIELD_BY_TAB: Record<ResourceType, keyof any> = {
  personnel: 'firstName',
  equipment: 'name',
  ammunition: 'name',
  logistics: 'name',
  ranks: 'title',
  maps: 'title',
};

function dtoToItem(dto: ResourceDto): ResourceItem {
  const meta = (dto.metadata || {}) as Record<string, any>;
  const codeField = CODE_FIELD_BY_TAB[dto.type as ResourceType] as string;
  const nameField = NAME_FIELD_BY_TAB[dto.type as ResourceType] as string;

  const base: Record<string, any> = {
    ...meta,
    id: dto.id,
    [codeField]: dto.code ?? meta[codeField] ?? '',
    status: dto.status ?? meta.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };

  if (dto.type === 'personnel') {
    base.firstName = meta.firstName ?? dto.name.split(' ')[0] ?? '';
    base.lastName = meta.lastName ?? dto.name.split(' ').slice(1).join(' ');
  } else {
    base[nameField] = dto.name;
  }
  if (dto.description !== undefined && dto.description !== null) {
    base.description = base.description ?? dto.description;
  }
  return base as ResourceItem;
}

function itemToCreatePayload(
  tabType: ResourceType,
  item: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const codeField = CODE_FIELD_BY_TAB[tabType] as string;
  const nameField = NAME_FIELD_BY_TAB[tabType] as string;
  const data = item as any;

  const code = data[codeField] || undefined;
  let name: string;
  if (tabType === 'personnel') {
    name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || code || 'منبع';
  } else {
    name = data[nameField] || code || 'منبع';
  }

  const metadataKeys = TAB_DOMAIN_KEYS[tabType];
  const metadata: Record<string, any> = {};
  for (const key of metadataKeys) {
    if (data[key] !== undefined) metadata[key] = data[key];
  }
  if (tabType === 'personnel') {
    metadata.firstName = data.firstName;
    metadata.lastName = data.lastName;
  }

  return {
    type: tabType,
    name,
    code,
    description: data.description,
    status: data.status,
    metadata,
  };
}

// ---- Local cache (offline fallback) -----------------------------------------

const getStorageKey = (tabType: ResourceType) => `lindu_${tabType}_data`;

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

const cacheToStorage = (tabType: ResourceType, items: ResourceItem[]) => {
  try {
    localStorage.setItem(getStorageKey(tabType), JSON.stringify(items));
  } catch {
    // ignore quota issues
  }
};

const loadCacheOrSeed = (tabType: ResourceType): ResourceItem[] => {
  try {
    const data = localStorage.getItem(getStorageKey(tabType));
    if (data) return JSON.parse(data);
  } catch {
    // ignore parse errors
  }
  return getInitialData(tabType);
};

export const resetTabData = (tabType: ResourceType) => {
  localStorage.removeItem(getStorageKey(tabType));
};

export const resetAllTabsData = () => {
  const tabTypes: ResourceType[] = [
    'personnel',
    'equipment',
    'ammunition',
    'logistics',
    'ranks',
    'maps',
  ];
  tabTypes.forEach((t) => localStorage.removeItem(getStorageKey(t)));
};

function applyClientFilters(items: ResourceItem[], filters?: any): ResourceItem[] {
  if (!filters) return items;
  return items.filter((item) => {
    if (filters.search) {
      const searchLower = String(filters.search).toLowerCase();
      if (!Object.values(item).join(' ').toLowerCase().includes(searchLower))
        return false;
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
    if (
      filters.securityClassification &&
      filters.securityClassification !== 'all'
    ) {
      if (
        (item as any).securityClassification !== filters.securityClassification
      )
        return false;
    }
    return true;
  });
}

// ---- Async thunks -----------------------------------------------------------

export const fetchTabItems = createAsyncThunk(
  'tabularResources/fetchTabItems',
  async ({ tabType, filters }: { tabType: ResourceType; filters?: any }) => {
    try {
      const response = await resourceApiService.list({
        type: tabType,
        search: filters?.search,
        status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
        limit: 1000,
      });
      const items = response.items.map(dtoToItem);
      cacheToStorage(tabType, items);
      const filtered = applyClientFilters(items, filters);
      return { tabType, items: filtered, total: filtered.length };
    } catch (err) {
      // Fallback به cache محلی در صورت قطعی API
      const cached = loadCacheOrSeed(tabType);
      const filtered = applyClientFilters(cached, filters);
      return { tabType, items: filtered, total: filtered.length };
    }
  },
);

export const createTabItem = createAsyncThunk(
  'tabularResources/createTabItem',
  async ({
    tabType,
    itemData,
  }: {
    tabType: ResourceType;
    itemData: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'>;
  }) => {
    const payload = itemToCreatePayload(tabType, itemData);
    const dto = await resourceApiService.create(payload);
    const item = dtoToItem(dto);
    const cached = loadCacheOrSeed(tabType);
    cacheToStorage(tabType, [item, ...cached]);
    return { tabType, item };
  },
);

export const updateTabItem = createAsyncThunk(
  'tabularResources/updateTabItem',
  async ({
    tabType,
    itemId,
    itemData,
  }: {
    tabType: ResourceType;
    itemId: string;
    itemData: Partial<ResourceItem>;
  }) => {
    const payload = itemToCreatePayload(
      tabType,
      itemData as Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'>,
    );
    const dto = await resourceApiService.update(itemId, {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      status: payload.status,
      metadata: payload.metadata,
    });
    const item = dtoToItem(dto);
    const cached = loadCacheOrSeed(tabType);
    cacheToStorage(
      tabType,
      cached.map((i) => (i.id === itemId ? item : i)),
    );
    return { tabType, item };
  },
);

export const deleteTabItem = createAsyncThunk(
  'tabularResources/deleteTabItem',
  async ({ tabType, itemId }: { tabType: ResourceType; itemId: string }) => {
    await resourceApiService.remove(itemId);
    const cached = loadCacheOrSeed(tabType);
    cacheToStorage(
      tabType,
      cached.filter((i) => i.id !== itemId),
    );
    return { tabType, itemId };
  },
);

export const mergeImportedResources = createAsyncThunk(
  'tabularResources/mergeImported',
  async ({
    personnel,
    equipment,
    units = [],
  }: {
    personnel: PersonnelItem[];
    equipment: EquipmentItem[];
    units?: ResourceBulkImportItem[];
  }) => {
    const items: any[] = [];
    for (const p of personnel) {
      items.push(itemToCreatePayload('personnel', p as any));
    }
    for (const e of equipment) {
      items.push(itemToCreatePayload('equipment', e as any));
    }
    items.push(...units);
    if (items.length) {
      try {
        await resourceApiService.bulkImport(items);
      } catch (error) {
        // در صورت خطای API، fallback به cache محلی برای حداقل تجربه کاربر
        if (personnel.length) {
          const existing = loadCacheOrSeed('personnel') as PersonnelItem[];
          cacheToStorage('personnel', [...personnel, ...existing]);
        }
        if (equipment.length) {
          const existing = loadCacheOrSeed('equipment') as EquipmentItem[];
          cacheToStorage('equipment', [...equipment, ...existing]);
        }
        throw new Error(
          error instanceof Error
            ? `ثبت منابع در سرور انجام نشد: ${error.message}`
            : 'ثبت منابع در سرور انجام نشد و فقط یک نسخه محلی نگهداری شد',
        );
      }
    }
    return {
      personnelCount: personnel.length,
      equipmentCount: equipment.length,
      unitCount: units.length,
    };
  },
);

// ---- Slice ------------------------------------------------------------------

const tabularResourcesSlice = createSlice({
  name: 'tabularResources',
  initialState,
  reducers: {
    setTabFilters: (
      state,
      action: PayloadAction<{ tabType: ResourceType; filters: any }>,
    ) => {
      const { tabType, filters } = action.payload;
      state[tabType].filters = { ...state[tabType].filters, ...filters };
    },
    clearTabFilters: (state, action: PayloadAction<ResourceType>) => {
      state[action.payload].filters = {};
    },
    setTabPagination: (
      state,
      action: PayloadAction<{
        tabType: ResourceType;
        pagination: Partial<{ page: number; pageSize: number; total: number }>;
      }>,
    ) => {
      const { tabType, pagination } = action.payload;
      state[tabType].pagination = { ...state[tabType].pagination, ...pagination };
    },
    clearTabError: (state, action: PayloadAction<ResourceType>) => {
      state[action.payload].error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(updateTabItem.fulfilled, (state, action) => {
        const { tabType, item } = action.payload;
        const items = (state[tabType] as any).items;
        const index = items.findIndex((i: any) => i.id === item.id);
        if (index !== -1) items[index] = item;
      })
      .addCase(deleteTabItem.fulfilled, (state, action) => {
        const { tabType, itemId } = action.payload;
        (state[tabType] as any).items = (state[tabType] as any).items.filter(
          (i: any) => i.id !== itemId,
        );
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

export const {
  setTabFilters,
  clearTabFilters,
  setTabPagination,
  clearTabError,
} = tabularResourcesSlice.actions;

export const selectTabularResources = (state: RootState) => state.tabularResources;
export const selectTabItems = (state: RootState, tabType: ResourceType) =>
  state.tabularResources[tabType].items;
export const selectTabLoading = (state: RootState, tabType: ResourceType) =>
  state.tabularResources[tabType].loading;
export const selectTabError = (state: RootState, tabType: ResourceType) =>
  state.tabularResources[tabType].error;
export const selectTabFilters = (state: RootState, tabType: ResourceType) =>
  state.tabularResources[tabType].filters;
export const selectTabPagination = (state: RootState, tabType: ResourceType) =>
  state.tabularResources[tabType].pagination;

export default tabularResourcesSlice.reducer;
