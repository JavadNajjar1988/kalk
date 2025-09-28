import type { ReferenceSections } from '@/hooks/useReferenceData';

// تعریف نوع داده برای فیلدهای سفارشی
export interface CustomField {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference' |
        // Enhanced field types
        'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual';
  isRequired: boolean;
  order: number;
  unit?: string;
  options?: string[];
  defaultValue?: any;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
  };
  // Reference field properties
  referenceCategory?: string; // ID of the category to reference (e.g., 'military_ranks')
  referenceSections?: ReferenceSections; // Which sections to display: 'hierarchy', 'data', or 'both'
  
  // Enhanced field properties
  minItems?: number; // For array fields
  maxItems?: number; // For array fields
  hierarchicalCategory?: string; // For hierarchical address fields
  allowFreeText?: boolean; // For hierarchical address fields
}

// تعریف نوع داده برای گره‌های درخت
export interface TreeNode {
  id: string;
  name: string;
  englishName: string;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
  children?: TreeNode[];
  customFields?: CustomField[];
}

// تعریف نوع داده برای دسته‌بندی
export interface DefinitionCategory {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  icon?: string;
  color?: string;
  maxLevels: number;
  isActive: boolean;
  order: number;
}

// تعریف نوع داده برای فیلدهای سفارشی در Redux
export interface CustomFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference' |
        // Enhanced field types
        'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual';
  isRequired: boolean;
  defaultValue?: any;
  options?: string[];
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
  };
  order: number;
  // Reference field properties
  referenceCategory?: string;
  referenceSections?: ReferenceSections;
  
  // Enhanced field properties
  minItems?: number; // For array fields
  maxItems?: number; // For array fields
  hierarchicalCategory?: string; // For hierarchical address fields
  allowFreeText?: boolean; // For hierarchical address fields
}
