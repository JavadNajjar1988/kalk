/**
 * Enhancement Configuration Types for Smart Field Builder
 */

import { BaseFieldType, EnhancementType } from './smartFieldTypes';

// Text field enhancements
export interface TextEnhancementConfig {
  multiline?: {
    rows: number;
    maxRows?: number;
    autoResize: boolean;
  };
  
  formatted?: {
    format: 'email' | 'phone' | 'url' | 'custom';
    pattern?: string;
    mask?: string;
  };
  
  composite?: {
    parts: Array<{
      id: string;
      label: string;
      type: 'text' | 'select';
      options?: string[];
      required: boolean;
    }>;
    separator: string;
    displayFormat: string;
  };
}

// Number field enhancements
export interface NumberEnhancementConfig {
  range?: {
    min?: number;
    max?: number;
    step?: number;
  };
  
  unit?: {
    unit: string;
    display: 'before' | 'after';
    conversion?: {
      baseUnit: string;
      factor: number;
    };
  };
  
  decimal?: {
    places: number;
    separator: '.' | ',';
    thousandsSeparator?: ',' | '.' | ' ';
  };
}

// Choice field enhancements
export interface ChoiceEnhancementConfig {
  single?: {
    displayStyle: 'dropdown' | 'radio' | 'button';
    showIcons?: boolean;
    compact?: boolean;
  };
  
  multiple?: {
    max?: number;
    min?: number;
    displayStyle: 'chips' | 'list' | 'compact';
  };
  
  searchable?: {
    threshold: number;
    fuzzySearch: boolean;
    searchPlaceholder: string;
  };
  
  grouped?: {
    groups: Array<{
      id: string;
      label: string;
      items: string[];
      collapsible: boolean;
    }>;
  };
}

// Reference field enhancements  
export interface ReferenceEnhancementConfig {
  hierarchical?: {
    maxLevels: number;
    displayPath: boolean;
    expandable: boolean;
    rootLabel?: string;
  };
  
  freeText?: {
    allowCustom: boolean;
    customLabel: string;
    validateCustom: boolean;
  };
  
  searchable?: {
    minChars: number;
    debounceMs: number;
    searchFields: string[];
    displayFormat: string;
  };
}

// Enhancement configuration union type
export type EnhancementConfig = 
  | TextEnhancementConfig
  | NumberEnhancementConfig
  | ChoiceEnhancementConfig
  | ReferenceEnhancementConfig;

// Enhancement availability matrix
export interface EnhancementAvailability {
  [BaseFieldType.TEXT]: EnhancementType[];
  [BaseFieldType.NUMBER]: EnhancementType[];
  [BaseFieldType.CHOICE]: EnhancementType[];
  [BaseFieldType.REFERENCE]: EnhancementType[];
}

// Enhancement suggestion with context
export interface ContextualEnhancement {
  enhancement: EnhancementType;
  baseType: BaseFieldType;
  title: string;
  description: string;
  icon: string;
  
  // Context-based scoring
  relevanceScore: number;
  usageFrequency: number;
  categoryRelevance: number;
  
  // Configuration suggestions
  suggestedConfig: Partial<EnhancementConfig>;
  examples: Array<{
    title: string;
    description: string;
    config: Partial<EnhancementConfig>;
  }>;
  
  // Prerequisites and conflicts
  prerequisites?: EnhancementType[];
  conflicts?: EnhancementType[];
  
  // Usage guidance
  pros: string[];
  cons: string[];
  bestPractices: string[];
}

// Enhancement combination recommendations
export interface EnhancementCombination {
  enhancements: EnhancementType[];
  title: string;
  description: string;
  useCase: string;
  compatibilityScore: number;
  configuration: Record<EnhancementType, Partial<EnhancementConfig>>;
}