// تعریف ارجاع به تعاریف پایه
export interface ResourceReference {
  categoryId: string;
  definitionId: string;
  level: number;
}

// منبع پایه
export interface BaseResource {
  id: string;
  name: string;
  description?: string;
  references: ResourceReference[];
  customFields: Record<string, any>;
  metadata: {
    type: 'person' | 'equipment' | 'unit' | 'location';
    status: 'active' | 'inactive' | 'archived';
    createdAt: string;
    updatedAt: string;
  };
}

// منبع پرسنل
export interface PersonResource extends BaseResource {
  metadata: BaseResource['metadata'] & {
    type: 'person';
  };
  personFields: {
    nationalId?: string;
    rankId?: string;
    unitId?: string;
    specialty?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    personalInfo?: {
      birthDate?: string;
      gender?: 'male' | 'female';
      bloodType?: string;
    };
    serviceInfo?: {
      serviceNumber?: string;
      enlistmentDate?: string;
      dischargeDate?: string;
      rank?: string;
    };
  };
}

// منبع تجهیزات
export interface EquipmentResource extends BaseResource {
  metadata: BaseResource['metadata'] & {
    type: 'equipment';
  };
  equipmentFields: {
    name?: string;
    description?: string;
  };
}

// منبع واحد
export interface UnitResource extends BaseResource {
  metadata: BaseResource['metadata'] & {
    type: 'unit';
  };
  unitFields: {
    unitCode?: string;
    unitType?: string;
    commander?: string;
    strength?: {
      authorized?: number;
      actual?: number;
      available?: number;
    };
    location?: {
      base?: string;
      coordinates?: [number, number];
      address?: string;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
      fax?: string;
    };
    operationalStatus?: 'active' | 'reserve' | 'training' | 'deployed';
  };
}

// منبع مکان
export interface LocationResource extends BaseResource {
  metadata: BaseResource['metadata'] & {
    type: 'location';
  };
  locationFields: {
    coordinates?: [number, number];
    address?: string;
    type?: 'base' | 'camp' | 'facility' | 'checkpoint' | 'observation_post';
    capacity?: number;
    facilities?: string[];
    accessInfo?: {
      roadAccess?: boolean;
      airAccess?: boolean;
      waterAccess?: boolean;
      restrictions?: string[];
    };
    contactInfo?: {
      phone?: string;
      email?: string;
      emergencyContact?: string;
    };
  };
}

// تعریف قالب منبع
export interface ResourceTemplate {
  id: string;
  name: string;
  description?: string;
  type: BaseResource['metadata']['type'];
  requiredFields: string[];
  optionalFields: string[];
  customFieldDefinitions: CustomFieldDefinition[];
  validationRules?: Record<string, any>;
}

// تعریف فیلد سفارشی
export interface CustomFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'textarea' | 'email' | 'password' | 'phone' | 'social';
  isRequired: boolean;
  defaultValue?: any;
  options?: string[]; // برای نوع select
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  order: number;
  description?: string;
}

// فیلترهای جستجو
export interface ResourceFilters {
  type?: BaseResource['metadata']['type'];
  status?: BaseResource['metadata']['status'];
  categoryId?: string;
  definitionId?: string;
  searchQuery?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  customFilters?: Record<string, any>;
}

// نتیجه جستجو
export interface ResourceSearchResult {
  resources: BaseResource[];
  total: number;
  page: number;
  pageSize: number;
  filters: ResourceFilters;
}

// آمار منابع
export interface ResourceStats {
  total: number;
  byType: Record<BaseResource['metadata']['type'], number>;
  byStatus: Record<BaseResource['metadata']['status'], number>;
  byCategory: Record<string, number>;
  recentAdditions: number;
  recentUpdates: number;
}

// Export types
export type Resource = PersonResource | EquipmentResource | UnitResource | LocationResource; 