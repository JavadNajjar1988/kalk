import { useMemo } from 'react';

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
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'boolean'
    | 'file'
    | 'email'
    | 'password'
    | 'textarea'
    | 'phone'
    | 'social'
    | 'reference';
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
  referenceCategory?: string;
  referencePath?: string;
  referenceSections?: string;
  referenceDisplayField?: string;
  referenceValueField?: string;
  allowMultiple?: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  englishName: string;
  tabs: TabDefinition[];
}

const USER_DEFINITION: CategoryDefinition = {
  id: 'users',
  name: 'کاربران',
  englishName: 'Users',
  tabs: [
    {
      id: 'basic',
      name: 'اطلاعات پایه',
      englishName: 'Basic',
      fields: [
        { id: 'fullName', name: 'نام', englishName: 'Full Name', type: 'text', isRequired: true, order: 1 },
      ],
    },
  ],
};

const RESOURCE_DEFINITION: CategoryDefinition = {
  id: 'resources',
  name: 'منابع',
  englishName: 'Resources',
  tabs: [
    {
      id: 'basic',
      name: 'اطلاعات پایه',
      englishName: 'Basic',
      fields: [
        { id: 'name', name: 'نام منبع', englishName: 'Name', type: 'text', isRequired: true, order: 1 },
      ],
    },
  ],
};

export const useDefinitionData = (categoryType: 'users' | 'resources') => {
  const definitionData = useMemo(
    () => (categoryType === 'users' ? USER_DEFINITION : RESOURCE_DEFINITION),
    [categoryType]
  );

  return {
    definitionData,
    loading: false,
    error: null as string | null,
    reload: () => {},
    triggerManualSync: () => {},
    getSyncInfo: () => ({ lastSyncTime: Date.now(), syncHistory: [], isAutoSyncEnabled: false }),
    lastSyncTime: Date.now(),
  };
};

export const useAvailableCategories = () => {
  return {
    categories: [
      { id: 'users', name: 'کاربران', englishName: 'Users' },
      { id: 'resources', name: 'منابع', englishName: 'Resources' },
      { id: 'equipment', name: 'تجهیزات', englishName: 'Equipment' },
      { id: 'logistics', name: 'لجستیک', englishName: 'Logistics' },
      { id: 'ammunition', name: 'مهمات', englishName: 'Ammunition' },
    ],
    loading: false,
    error: null as string | null,
  };
};

export const useReferenceFieldOptions = () => {
  return {
    options: [] as Array<{ value: string; label: string }>,
    loading: false,
  };
};
