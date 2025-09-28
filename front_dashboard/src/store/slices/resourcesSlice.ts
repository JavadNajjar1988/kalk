import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
  BaseResource,
  Resource,
  PersonResource,
  EquipmentResource,
  UnitResource,
  LocationResource,
  ResourceTemplate,
  CustomFieldDefinition,
  ResourceFilters,
  ResourceSearchResult,
  ResourceStats,
  ResourceReference
} from '@/types/resources';

// تعریف انواع داده‌ها (حفظ شده برای سازگاری)
export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface MilitarySymbol {
  id: string;
  name: string;
  icon: string;
  category?: string;
}

export interface MilitaryRank {
  id: string;
  name: string;
  shortName?: string;
  category: 'officer' | 'enlisted' | 'other';
}

export interface MilitaryNode {
  id: string;
  parentId: string | null;
  name: string;
  symbolId: string;
  commanderName?: string;
  commanderImage?: string;
  rankId?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MilitaryOrganization {
  id: string;
  countryCode: string;
  name: string;
  nodes: MilitaryNode[];
  createdAt: number;
  updatedAt: number;
}

// نوع داده state جدید
interface ResourcesState {
  // داده‌های قدیمی (حفظ شده برای سازگاری)
  countries: Country[];
  militarySymbols: MilitarySymbol[];
  militaryRanks: MilitaryRank[];
  militaryOrganizations: MilitaryOrganization[];
  selectedOrganizationId: string | null;
  
  // داده‌های جدید
  resources: Resource[];
  resourceTemplates: Record<string, ResourceTemplate>;
  customFieldDefinitions: Record<string, CustomFieldDefinition[]>;
  selectedResource: Resource | null;
  filters: ResourceFilters;
  stats: ResourceStats;
  loading: boolean;
  error: string | null;
}

// داده‌های اولیه
const initialState: ResourcesState = {
  // داده‌های قدیمی
  countries: [
    { code: 'IR', name: 'ایران', flag: '/icons/flags/ir.png' },
    { code: 'US', name: 'ایالات متحده', flag: '/icons/flags/us.png' },
    { code: 'RU', name: 'روسیه', flag: '/icons/flags/ru.png' },
    { code: 'CN', name: 'چین', flag: '/icons/flags/cn.png' },
  ],
  militarySymbols: [
    { id: 'division', name: 'لشکر', icon: '⬢' },
    { id: 'brigade', name: 'تیپ', icon: '⬡' },
    { id: 'battalion', name: 'گردان', icon: '◆' },
    { id: 'company', name: 'گروهان', icon: '●' },
    { id: 'platoon', name: 'دسته', icon: '▲' },
  ],
  militaryRanks: [
    { id: 'general', name: 'سرلشکر', category: 'officer' },
    { id: 'lieutenant_general', name: 'سرتیپ', category: 'officer' },
    { id: 'major_general', name: 'سرتیپ دوم', category: 'officer' },
    { id: 'brigadier_general', name: 'سرهنگ', category: 'officer' },
    { id: 'colonel', name: 'سرگرد', category: 'officer' },
    { id: 'lieutenant_colonel', name: 'سروان', category: 'officer' },
    { id: 'major', name: 'ستوان یکم', category: 'officer' },
    { id: 'captain', name: 'ستوان دوم', category: 'officer' },
  ],
  militaryOrganizations: [],
  selectedOrganizationId: null,
  
  // داده‌های جدید
  resources: [],
  resourceTemplates: {},
  customFieldDefinitions: {},
  selectedResource: null,
  filters: {},
  stats: {
    total: 0,
    byType: { person: 0, equipment: 0, unit: 0, location: 0 },
    byStatus: { active: 0, inactive: 0, archived: 0 },
    byCategory: {},
    recentAdditions: 0,
    recentUpdates: 0,
  },
  loading: false,
  error: null,
};

// ایجاد slice
const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    // Reducers قدیمی (حفظ شده)
    createMilitaryOrganization(state, action: PayloadAction<{ countryCode: string; name: string }>) {
      const { countryCode, name } = action.payload;
      const now = Date.now();
      
      const newOrganization: MilitaryOrganization = {
        id: `org-${now}`,
        countryCode,
        name,
        nodes: [],
        createdAt: now,
        updatedAt: now,
      };
      
      state.militaryOrganizations.push(newOrganization);
    },

    selectMilitaryOrganization(state, action: PayloadAction<string | null>) {
      state.selectedOrganizationId = action.payload;
    },

    addMilitaryNode(state, action: PayloadAction<{
      organizationId: string;
      node: Omit<MilitaryNode, 'id' | 'createdAt' | 'updatedAt'>;
    }>) {
      const { organizationId, node } = action.payload;
      const organization = state.militaryOrganizations.find(org => org.id === organizationId);
      
      if (organization) {
        const now = Date.now();
        const newNode: MilitaryNode = {
          ...node,
          id: `node-${now}`,
          createdAt: now,
          updatedAt: now,
        };
        
        organization.nodes.push(newNode);
        organization.updatedAt = now;
      }
    },

    updateMilitaryNode(state, action: PayloadAction<{
      organizationId: string;
      nodeId: string;
      updates: Partial<Omit<MilitaryNode, 'id' | 'createdAt' | 'updatedAt'>>;
    }>) {
      const { organizationId, nodeId, updates } = action.payload;
      const organization = state.militaryOrganizations.find(org => org.id === organizationId);
      
      if (organization) {
        const node = organization.nodes.find(n => n.id === nodeId);
        if (node) {
          Object.assign(node, updates, { updatedAt: Date.now() });
          organization.updatedAt = Date.now();
        }
      }
    },

    deleteMilitaryNode(state, action: PayloadAction<{
      organizationId: string;
      nodeId: string;
    }>) {
      const { organizationId, nodeId } = action.payload;
      const organization = state.militaryOrganizations.find(org => org.id === organizationId);
      
      if (organization) {
        const removeChildren = (parentId: string) => {
          const children = organization.nodes.filter(node => node.parentId === parentId);
          children.forEach(child => {
            removeChildren(child.id);
            organization.nodes = organization.nodes.filter(n => n.id !== child.id);
          });
        };
        
        removeChildren(nodeId);
        organization.nodes = organization.nodes.filter(n => n.id !== nodeId);
        organization.updatedAt = Date.now();
      }
    },

    addCountry(state, action: PayloadAction<Country>) {
      state.countries.push(action.payload);
    },

    addMilitarySymbol(state, action: PayloadAction<MilitarySymbol>) {
      state.militarySymbols.push(action.payload);
    },

    // Reducers جدید برای سیستم منابع
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // مدیریت منابع
    addResource(state, action: PayloadAction<Resource>) {
      state.resources.push(action.payload);
      state.stats.total = state.resources.length;
      state.stats.recentAdditions++;
      // به‌روزرسانی آمار
      const type = action.payload.metadata.type;
      state.stats.byType[type]++;
      const status = action.payload.metadata.status;
      state.stats.byStatus[status]++;
    },

    updateResource(state, action: PayloadAction<{ id: string; updates: Partial<Resource> }>) {
      const { id, updates } = action.payload;
      const index = state.resources.findIndex(resource => resource.id === id);
      if (index !== -1) {
        state.resources[index] = { ...state.resources[index], ...updates };
        state.stats.recentUpdates++;
      }
    },

    deleteResource(state, action: PayloadAction<string>) {
      const resource = state.resources.find(r => r.id === action.payload);
      if (resource) {
        // کاهش آمار
        const type = resource.metadata.type;
        state.stats.byType[type]--;
        const status = resource.metadata.status;
        state.stats.byStatus[status]--;
        state.stats.total--;
      }
      state.resources = state.resources.filter(r => r.id !== action.payload);
    },

    setSelectedResource(state, action: PayloadAction<Resource | null>) {
      state.selectedResource = action.payload;
    },

    // مدیریت قالب‌ها
    addResourceTemplate(state, action: PayloadAction<ResourceTemplate>) {
      state.resourceTemplates[action.payload.id] = action.payload;
    },

    updateResourceTemplate(state, action: PayloadAction<{ id: string; updates: Partial<ResourceTemplate> }>) {
      const { id, updates } = action.payload;
      if (state.resourceTemplates[id]) {
        state.resourceTemplates[id] = { ...state.resourceTemplates[id], ...updates };
      }
    },

    deleteResourceTemplate(state, action: PayloadAction<string>) {
      delete state.resourceTemplates[action.payload];
    },

    // مدیریت فیلدهای سفارشی
    addCustomFieldDefinition(state, action: PayloadAction<{ templateId: string; field: CustomFieldDefinition }>) {
      const { templateId, field } = action.payload;
      if (!state.customFieldDefinitions[templateId]) {
        state.customFieldDefinitions[templateId] = [];
      }
      state.customFieldDefinitions[templateId].push(field);
    },

    updateCustomFieldDefinition(state, action: PayloadAction<{ 
      templateId: string; 
      fieldId: string; 
      updates: Partial<CustomFieldDefinition> 
    }>) {
      const { templateId, fieldId, updates } = action.payload;
      const fields = state.customFieldDefinitions[templateId];
      if (fields) {
        const index = fields.findIndex(field => field.id === fieldId);
        if (index !== -1) {
          fields[index] = { ...fields[index], ...updates };
        }
      }
    },

    deleteCustomFieldDefinition(state, action: PayloadAction<{ templateId: string; fieldId: string }>) {
      const { templateId, fieldId } = action.payload;
      const fields = state.customFieldDefinitions[templateId];
      if (fields) {
        state.customFieldDefinitions[templateId] = fields.filter(field => field.id !== fieldId);
      }
    },

    // مدیریت فیلترها
    setFilters(state, action: PayloadAction<ResourceFilters>) {
      state.filters = action.payload;
    },

    clearFilters(state) {
      state.filters = {};
    },

    // به‌روزرسانی آمار
    updateStats(state, action: PayloadAction<ResourceStats>) {
      state.stats = action.payload;
    },
  },
});

export const {
  // Actions قدیمی
  createMilitaryOrganization,
  selectMilitaryOrganization,
  addMilitaryNode,
  updateMilitaryNode,
  deleteMilitaryNode,
  addCountry,
  addMilitarySymbol,
  
  // Actions جدید
  setLoading,
  setError,
  addResource,
  updateResource,
  deleteResource,
  setSelectedResource,
  addResourceTemplate,
  updateResourceTemplate,
  deleteResourceTemplate,
  addCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  setFilters,
  clearFilters,
  updateStats,
} = resourcesSlice.actions;

// Selectors قدیمی
export const selectCountries = (state: RootState) => state.resources.countries;
export const selectMilitarySymbols = (state: RootState) => state.resources.militarySymbols;
export const selectMilitaryRanks = (state: RootState) => state.resources.militaryRanks;
export const selectMilitaryOrganizations = (state: RootState) => state.resources.militaryOrganizations;
export const selectCurrentOrganization = (state: RootState) => {
  const { selectedOrganizationId, militaryOrganizations } = state.resources;
  return selectedOrganizationId 
    ? militaryOrganizations.find(org => org.id === selectedOrganizationId) 
    : null;
};

// Selectors جدید
export const selectResources = (state: RootState) => state.resources.resources;
export const selectSelectedResource = (state: RootState) => state.resources.selectedResource;
export const selectResourceTemplates = (state: RootState) => state.resources.resourceTemplates;
export const selectCustomFieldDefinitions = (state: RootState) => state.resources.customFieldDefinitions;
export const selectResourceFilters = (state: RootState) => state.resources.filters;
export const selectResourceStats = (state: RootState) => state.resources.stats;
export const selectResourcesLoading = (state: RootState) => state.resources.loading;
export const selectResourcesError = (state: RootState) => state.resources.error;

// Selectors کمکی
export const selectResourcesByType = (state: RootState, type: BaseResource['metadata']['type']) =>
  state.resources.resources.filter(resource => resource.metadata.type === type);

export const selectResourcesByStatus = (state: RootState, status: BaseResource['metadata']['status']) =>
  state.resources.resources.filter(resource => resource.metadata.status === status);

export const selectResourcesByCategory = (state: RootState, categoryId: string) =>
  state.resources.resources.filter(resource => 
    resource.references.some(ref => ref.categoryId === categoryId)
  );

export default resourcesSlice.reducer;
