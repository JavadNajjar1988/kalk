// Enhanced field types for personnel forms
// تعریف انواع فیلدهای پیشرفته برای فرم‌های پرسنلی

import { FieldDefinition } from '@/hooks/useDefinitionData';

/**
 * انواع فیلدهای پیشرفته
 */
export interface EnhancedFieldDefinition extends FieldDefinition {
  // اعتبارسنجی‌های پیشرفته
  validation?: {
    pattern?: string; // regex pattern
    minLength?: number;
    maxLength?: number;
    custom?: 'english-only' | 'numeric-only' | 'national-id' | 'phone';
    dependsOn?: string; // نام فیلد وابسته
  };
  
  // فیلدهای شرطی
  conditionalOn?: {
    field: string; // نام فیلد
    value: any; // مقدار شرط
    operator?: 'equals' | 'not-equals' | 'includes' | 'not-includes';
  };
  
  // فیلدهای آرایه‌ای
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    itemStructure?: FieldStructure;
    allowedLabels?: string[];
  };
  
  // پیکربندی آدرس سلسله‌مراتبی
  hierarchicalConfig?: {
    rootCategory: string; // نام دسته‌بندی مرجع
    levels: string[]; // سطوح درخت (استان، شهر، منطقه)
    allowFreeText?: boolean; // اجازه متن آزاد
  };
}

/**
 * ساختار فیلد برای آیتم‌های آرایه
 */
export interface FieldStructure {
  [key: string]: {
    type: string;
    label: string;
    required?: boolean;
    validation?: EnhancedFieldDefinition['validation'];
  };
}

/**
 * ساختار داده شماره تلفن
 */
export interface PhoneEntry {
  id: string;
  number: string;
  label: string;
  isPrimary?: boolean;
  verified?: boolean;
  notes?: string;
}

/**
 * ساختار داده آدرس سلسله‌مراتبی
 */
export interface HierarchicalAddress {
  id: string;
  label: string;
  selectedPath: Record<string, string>; // Dynamic levels: level1, level2, level3, etc.
  detailedAddress?: string; // آدرس دقیق
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isPrimary?: boolean;
  verified?: boolean;
}

/**
 * نوع‌های فیلد جدید
 */
export const ENHANCED_FIELD_TYPES = {
  // فیلدهای پایه با اعتبارسنجی
  TEXT_ENGLISH: 'text-english',
  TEXT_NUMERIC: 'text-numeric',
  
  // فیلدهای شرطی
  CONDITIONAL_NATIONAL_ID: 'conditional-national-id',
  
  // فیلدهای آرایه‌ای
  PHONE_ARRAY: 'phone-array',
  ADDRESS_ARRAY: 'address-array',
  
  // فیلدهای سلسله‌مراتبی
  HIERARCHICAL_ADDRESS: 'hierarchical-address',
  
  // فیلدهای مرکب
  NAME_SPLIT: 'name-split', // تفکیک نام و نام خانوادگی
  FULL_NAME_DUAL: 'full-name-dual' // نام فارسی + انگلیسی
} as const;

/**
 * نقشه‌برداری نوع فیلد به کامپوننت
 */
export const FIELD_TYPE_COMPONENT_MAP = {
  [ENHANCED_FIELD_TYPES.TEXT_ENGLISH]: 'EnglishTextFieldComponent',
  [ENHANCED_FIELD_TYPES.TEXT_NUMERIC]: 'NumericTextFieldComponent',
  [ENHANCED_FIELD_TYPES.CONDITIONAL_NATIONAL_ID]: 'ConditionalNationalIdComponent',
  [ENHANCED_FIELD_TYPES.PHONE_ARRAY]: 'PhoneArrayFieldComponent',
  [ENHANCED_FIELD_TYPES.ADDRESS_ARRAY]: 'AddressArrayFieldComponent',
  [ENHANCED_FIELD_TYPES.HIERARCHICAL_ADDRESS]: 'HierarchicalAddressComponent',
  [ENHANCED_FIELD_TYPES.NAME_SPLIT]: 'NameSplitFieldComponent',
  [ENHANCED_FIELD_TYPES.FULL_NAME_DUAL]: 'FullNameDualFieldComponent'
} as const;

/**
 * پیش‌فرض‌های آرایه فیلدها
 */
export const DEFAULT_ARRAY_CONFIGS = {
  phones: {
    minItems: 1,
    maxItems: 5,
    itemStructure: {
      number: {
        type: 'text',
        label: 'شماره تلفن',
        required: true,
        validation: { custom: 'phone' }
      },
      label: {
        type: 'select',
        label: 'نوع شماره',
        required: true
      },
      isPrimary: {
        type: 'boolean',
        label: 'شماره اصلی',
        required: false
      }
    },
    allowedLabels: ['mobile', 'home', 'work', 'emergency', 'fax', 'other']
  },
  addresses: {
    minItems: 0,
    maxItems: 3,
    itemStructure: {
      label: {
        type: 'select',
        label: 'نوع آدرس',
        required: true
      },
      selectedPath: {
        type: 'hierarchical',
        label: 'انتخاب منطقه',
        required: true
      },
      detailedAddress: {
        type: 'textarea',
        label: 'آدرس دقیق',
        required: false
      },
      postalCode: {
        type: 'text',
        label: 'کد پستی',
        required: false,
        validation: { pattern: '^\\d{10}$' }
      }
    },
    allowedLabels: ['home', 'work', 'birth', 'temporary', 'other']
  }
} as const;

export type EnhancedFieldType = typeof ENHANCED_FIELD_TYPES[keyof typeof ENHANCED_FIELD_TYPES];