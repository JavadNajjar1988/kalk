/**
 * Template System Types for Smart Field Builder
 */

import { SmartFieldConfig } from './smartFieldTypes';

// Template categories
export enum TemplateCategory {
  PERSONAL = 'personal',
  ADDRESS = 'address', 
  CONTACT = 'contact',
  IDENTIFICATION = 'identification',
  MILITARY = 'military',
  CUSTOM = 'custom'
}

// Template difficulty level
export enum TemplateComplexity {
  SIMPLE = 'simple',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// Individual template configuration
export interface FieldTemplate {
  id: string;
  name: string;
  englishName: string;
  description: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  icon: string;
  tags: string[];
  
  // Template configuration
  fields: SmartFieldConfig[];
  
  // Customization options
  customizable: boolean;
  customizationOptions?: {
    allowAddFields: boolean;
    allowRemoveFields: boolean;
    allowModifyFields: boolean;
    requiredFields: string[];
  };
  
  // Usage statistics
  usageCount?: number;
  rating?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  author?: string;
  version: string;
}

// Template collection
export interface TemplateCollection {
  category: TemplateCategory;
  title: string;
  description: string;
  icon: string;
  templates: FieldTemplate[];
}

// Template customization state
export interface TemplateCustomization {
  templateId: string;
  originalTemplate: FieldTemplate;
  customizedFields: SmartFieldConfig[];
  addedFields: SmartFieldConfig[];
  removedFieldIds: string[];
  modifications: Record<string, Partial<SmartFieldConfig>>;
}

// Template search and filter options
export interface TemplateFilters {
  category?: TemplateCategory;
  complexity?: TemplateComplexity;
  tags?: string[];
  searchTerm?: string;
  minRating?: number;
}

// Template suggestion based on context
export interface TemplateSuggestion {
  template: FieldTemplate;
  relevanceScore: number;
  reasons: string[];
  adaptations?: {
    fieldId: string;
    suggestedChanges: Partial<SmartFieldConfig>;
  }[];
}