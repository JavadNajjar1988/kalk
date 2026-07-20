/**
 * Smart Field Builder Core Types
 * Completely independent from simple field builder
 */

// Base field types - simplified to 4 core types
export enum BaseFieldType {
  TEXT = 'text',
  NUMBER = 'number', 
  CHOICE = 'choice',
  REFERENCE = 'reference'
}

// Enhancement types for each base field type
export enum EnhancementType {
  // Text enhancements
  MULTILINE = 'multiline',
  COMPOSITE = 'composite',
  
  // Number enhancements
  RANGE = 'range',
  UNIT = 'unit',
  DECIMAL = 'decimal',
  
  // Choice enhancements
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  SEARCHABLE = 'searchable',
  GROUPED = 'grouped',
  
  // Reference enhancements
  HIERARCHICAL = 'hierarchical',
  FREE_TEXT = 'free_text',
  SEARCHABLE_REF = 'searchable_ref'
}

// Data source types
export enum DataSourceType {
  CATEGORY = 'category',           // From definition categories
  MANUAL = 'manual',              // Manual list
  EXTERNAL = 'external',          // External API
  COMPUTED = 'computed'           // Computed values
}

// Validation rule types
export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  PATTERN = 'pattern',
  RANGE = 'range',
  EMAIL = 'email',
  PHONE = 'phone',
  NATIONAL_ID = 'national_id',
  // Advanced validation types
  CUSTOM_FUNCTION = 'custom_function',
  CROSS_FIELD = 'cross_field',
  CONDITIONAL = 'conditional',
  UNIQUE = 'unique',
  FILE_SIZE = 'file_size',
  FILE_TYPE = 'file_type',
  DATE_RANGE = 'date_range',
  TIME_RANGE = 'time_range'
}

// Builder modes
export enum BuilderMode {
  GUIDED = 'guided',              // 4-step wizard
  TEMPLATE = 'template'           // Pre-built templates
}

// Enhanced interfaces for better type safety

// Template-related interfaces
export interface TemplateField extends SmartFieldConfig {
  templateId?: string;
  isFromTemplate?: boolean;
  templateVersion?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string | string[];
  fields: TemplateField[];
  icon?: string;
  tags?: string[];
  keywords?: string[];
  isMultiField?: boolean;
  isCritical?: boolean;
  usageCount?: number;
  rating?: number;
  complexity?: 'simple' | 'intermediate' | 'advanced';
  createdAt?: string;
  updatedAt?: string;
  lastUsed?: string;
  qualityScore?: number;
  validation?: TemplateValidationResult;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  count?: number;
  isRelevant?: boolean;
}

// Component props interfaces
export interface SmartFieldBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: SmartFieldConfig[];
  editingField?: SmartFieldConfig | null;
  categoryContext?: string;
}

export interface OptimizedTemplateSelectorProps {
  onTemplateSelect: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}

export interface TemplateCustomizerProps {
  template: SmartFieldConfig | SmartFieldConfig[];
  onSave: (customizedFields: SmartFieldConfig[]) => void;
  onCancel: () => void;
  existingFields?: SmartFieldConfig[];
}

// Performance and analytics interfaces
export interface PerformanceMetrics {
  componentLoadTime: number;
  renderTime: number;
  totalMemoryUsage: number;
  chunkLoadTimes: Record<string, number>;
  validationTime?: number;
  cacheHitRate?: number;
}

export interface UsageAnalytics {
  templateId: string;
  templateName: string;
  category: string;
  context?: string;
  searchQuery?: string;
  timestamp: string;
  validationScore?: number;
  hasWarnings?: boolean;
}

// Wizard state interfaces
export interface WizardStepProps {
  config: Partial<SmartFieldConfig>;
  onConfigUpdate: (updates: Partial<SmartFieldConfig>) => void;
  fieldContext: FieldContext;
  errors: Record<string, string>;
  editingField?: SmartFieldConfig | null;
  previewData?: PreviewData;
}

export interface PreviewData {
  basicInfo: {
    name: string;
    englishName: string;
    type: string;
    description: string;
  };
  enhancements: FieldEnhancement[];
  validation: ValidationRule[];
  dataSource?: DataSource;
  settings: {
    isRequired: boolean;
    placeholder: string;
    helpText: string;
  };
}

// Cache interfaces
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  version?: string;
  dependencies?: string[];
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
}

// Enhanced field enhancement configuration
export interface FieldEnhancement {
  type: EnhancementType;
  config: Record<string, any>;
  enabled: boolean;
}

// Data source configuration
export interface DataSource {
  type: DataSourceType;
  config: {
    categoryId?: string;           // For category source
    items?: Array<{id: string; label: string}>; // For manual source
    apiEndpoint?: string;          // For external source
    computation?: string;          // For computed source
  };
}

// Validation rule configuration
export interface ValidationRule {
  id: string;
  type: ValidationType;
  enabled: boolean;
  message: string;
  config: {
    // Basic validation config
    value?: any;
    min?: number;
    max?: number;
    pattern?: string;
    flags?: string;
    
    // Advanced validation config
    dependsOn?: string; // Field ID for cross-field validation
    condition?: string; // Condition expression
    customFunction?: string; // Custom validation function
    allowedTypes?: string[]; // For file type validation
    maxSize?: number; // For file size validation
    dateFormat?: string; // For date validation
    
    // Conditional validation
    when?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
      value: any;
    };
  };
}

// Main smart field configuration
export interface SmartFieldConfig {
  // Basic identification
  id: string;
  name: string;
  englishName: string;
  description?: string;
  
  // Core field configuration
  baseType: BaseFieldType;
  enhancements: FieldEnhancement[];
  dataSource?: DataSource;
  validation: ValidationRule[];
  
  // Metadata
  isRequired: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  
  // Advanced options
  conditional?: {
    dependsOn: string;
    condition: string;
    value: any;
  };
  
  // Dependencies (new)
  dependencies?: FieldDependency[];
  
  // Generated configuration (for compatibility)
  generatedConfig?: Record<string, any>;
}

// Field dependency configuration
export interface FieldDependency {
  id: string;
  type: 'visibility' | 'required' | 'value' | 'options';
  sourceFieldId: string;
  targetFieldId: string;
  condition: {
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty' | 'in';
    value: any;
    values?: any[];
  };
  action: {
    type: 'show' | 'hide' | 'require' | 'optional' | 'setValue' | 'setOptions';
    value?: any;
    options?: { id: string; label: string }[];
  };
  enabled: boolean;
  description?: string;
}

// Wizard step state
export interface WizardStep {
  step: number;
  title: string;
  description: string;
  isValid: boolean;
  isComplete: boolean;
}

// Wizard state
export interface WizardState {
  currentStep: number;
  steps: WizardStep[];
  config: Partial<SmartFieldConfig>;
  errors: Record<string, string>;
  isNavigationEnabled: boolean;
}

// Context for smart suggestions
export interface FieldContext {
  categoryType?: string;
  existingFields?: SmartFieldConfig[];
  usagePatterns?: Record<string, number>;
  currentCategory?: string;
}

// Enhancement suggestion
export interface EnhancementSuggestion {
  enhancement: EnhancementType;
  title: string;
  description: string;
  icon: string;
  recommended: boolean;
  config?: Record<string, any>;
}