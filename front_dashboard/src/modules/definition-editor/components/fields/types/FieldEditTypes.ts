// Types and interfaces for the Field Edit Dialog components
// This file contains all type definitions extracted from NodeFieldManager.tsx

import { CustomFieldDefinition } from '../../../types/equipment';

// Field type definitions aligned with existing types
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference' |
  // Enhanced field types
  'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual' |
  // Complex data field types
  'array-text' | 'key-value' | 'grouped';

// Number field specific properties
export interface NumberFieldProperties {
  // Content properties
  numberType?: 'integer' | 'decimal';
  minValue?: number;
  maxValue?: number;
  step?: number;
  decimalPrecision?: number;
  displayFormat?: {
    thousandSeparator?: boolean;
    thousandSymbol?: string;
    decimalSeparator?: 'dot' | 'comma';
    autoFormat?: 'currency' | 'percentage' | 'none';
  };
  defaultValue?: number;
  
  // Helper properties
  enableAutoComplete?: boolean;
  enableSpinner?: boolean;
  enableMiniChart?: boolean;
  enableMultipleValues?: boolean;
  multiValueSeparator?: 'comma' | 'space' | 'semicolon';
  
  // Behavior properties
  editableAfterSave?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  enableConditionalDisplay?: boolean;
  conditionalDisplayField?: string;
  conditionalDisplayOperator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  conditionalDisplayValue?: string;
  enableConditionalEnable?: boolean;
  conditionalEnableField?: string;
  conditionalEnableOperator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  conditionalEnableValue?: string;
  autoCalculation?: {
    enabled: boolean;
    formula?: string;
  };
  
  // Security properties
  indexing?: {
    searchable?: boolean;
    filterable?: boolean;
    sortable?: boolean;
  };
  storeRawAndNormalized?: boolean;
  sensitiveDataDetection?: {
    enabled: boolean;
    action?: 'warn' | 'block';
    patterns?: string[];
  };
  
  // Display properties
  displayType?: 'simple' | 'slider' | 'spinner' | 'progress';
  size?: 'small' | 'medium' | 'large' | 'full';
  showCounter?: boolean;
  icon?: {
    prefix?: string;
    suffix?: string;
  };
  statusColor?: {
    positive?: string;
    negative?: string;
    zero?: string;
  };
  readOnlyStyle?: 'normal' | 'disabled' | 'simple';
  errorStyle?: 'below' | 'tooltip' | 'inline';
}

// Extended interface for additional text field properties
export interface ExtendedCustomFieldDefinition extends CustomFieldDefinition {
  // Required fields for all field types
  name: string;
  englishName: string;
  type: FieldType;
  
  // Number field specific properties
  numberField?: NumberFieldProperties;
  
  
  // Text field specific properties
  placeholder?: string;
  helpText?: string;
  direction?: 'auto' | 'rtl' | 'ltr';
  
  // Content properties
  minLength?: number;
  maxLength?: number;
  caseTransform?: 'none' | 'lowercase' | 'uppercase' | 'capitalize';
  
  // Content control properties
  characterControl?: 'letters' | 'alphanumeric' | 'all' | 'custom';
  trimWhitespace?: boolean;
  normalizeDigits?: boolean;
  fixZWNJ?: boolean;
  allowEmoji?: boolean;
  allowMarkdown?: boolean;
  customRegex?: string;
  
  // Assistive properties
  suggestions?: string[];
  enableAutoComplete?: boolean;
  enableMultipleValues?: boolean;
  multiValueSeparator?: 'comma' | 'enter' | 'space' | 'semicolon';
  spellcheck?: 'off' | 'fa' | 'en' | 'custom';
  customDictionary?: string;
  
  // Behavior properties
  editableAfterSave?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  autoSaveInterval?: number;
  enableConditionalDisplay?: boolean;
  conditionalDisplayField?: string;
  conditionalDisplayOperator?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
  conditionalDisplayValue?: string;
  enableConditionalEnable?: boolean;
  conditionalEnableField?: string;
  conditionalEnableOperator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
  conditionalEnableValue?: string;
  
  // Security properties (legacy - use piiCheck and profanityCheck instead)
  enableSensitiveDataDetection?: boolean;
  sensitiveDataAction?: 'warn' | 'block' | 'mask';
  enableInappropriateWordsDetection?: boolean;
  inappropriateWordsAction?: 'warn' | 'block' | 'replace';
  searchable?: boolean;
  filterable?: boolean;
  searchAnalyzer?: 'standard' | 'persian' | 'custom';
  
  // Display properties
  variant?: 'plain' | 'accordion' | 'textarea' | 'richtext' | 'inline' | 'chips' | 'pill' | 'masked' | 'popover';
  selectionAid?: 'none' | 'single' | 'multi';
  size?: 'sm' | 'md' | 'lg' | 'full';
  icon?: string;
  prefix?: string;
  suffix?: string;
  counterDisplay?: 'off' | 'bottom' | 'inside';
  copyButton?: boolean;
  readOnlyStyle?: 'normal' | 'disabled' | 'plain';
  validationMessageStyle?: 'bottom' | 'tooltip' | 'inline';
  maskPattern?: string;
  accordionTitle?: string;
  accordionDisplayMode?: 'title' | 'options'; // Controls whether to show title or options in accordion
  newOptionText?: string; // Temporary field for adding new options
  
  // Textarea variant properties
  textareaRows?: number;
  textareaMaxRows?: number;
  textareaResize?: 'none' | 'both' | 'horizontal' | 'vertical';
  
  // Richtext variant properties
  richtextToolbar?: string[];
  richtextHeight?: number;
  
  // Chips variant properties
  chipsColor?: 'default' | 'primary' | 'secondary';
  chipsVariant?: 'filled' | 'outlined';
  chipsDeletable?: boolean;
  chipsMaxCount?: number;
  
  // Pill variant properties
  pillColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  pillSize?: 'small' | 'medium';
  
  // Popover variant properties
  popoverTrigger?: 'click' | 'hover';
  popoverSize?: 'small' | 'medium' | 'large';
  popoverPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  // Inline variant properties
  inlineLabelPosition?: 'left' | 'top';
  inlineLabelWidth?: number;
  inlineSpacing?: 'compact' | 'normal' | 'comfortable';
  
  
  // Behavior and Logic features
  debounceTime?: number;
  conditionalVisibility?: {
    enabled: boolean;
    fieldId?: string;
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string;
  };
  conditionalEnable?: {
    enabled: boolean;
    fieldId?: string;
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string;
  };
  
  // Security and Storage features
  piiCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn';
    patterns?: string[];
  };
  profanityCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn';
    customWords?: string[];
  };
  indexing?: {
    searchable?: boolean;
    filterable?: boolean;
  };
  analyzer?: 'standard' | 'persian';
  storeRawAndNormalized?: boolean;
  
  // Rules features
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    unique?: boolean;
  };
  controlRules?: {
    defaultValue?: string;
    lockAfterSave?: boolean;
    readOnly?: boolean;
    conditional?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
      value?: string;
      logic?: 'AND' | 'OR';
      conditions?: Array<{
        dependsOn?: string;
        condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
        value?: string;
      }>;
    };
    advanced?: {
      enableConditionalDefault?: boolean;
      conditionalDefaultValue?: string;
      enableConditionalLock?: boolean;
      conditionalLockRule?: string;
      enableConditionalReadOnly?: boolean;
      conditionalReadOnlyRule?: string;
    };
  };
  conditionalRules?: {
    visibility?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
      value?: string;
      logic?: 'AND' | 'OR';
      conditions?: Array<{
        dependsOn?: string;
        condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
        value?: string;
      }>;
    };
    enable?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
      value?: string;
      logic?: 'AND' | 'OR';
      conditions?: Array<{
        dependsOn?: string;
        condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
        value?: string;
      }>;
    };
    required?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
      value?: string;
      logic?: 'AND' | 'OR';
      conditions?: Array<{
        dependsOn?: string;
        condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
        value?: string;
      }>;
    };
    custom?: {
      enabled: boolean;
      rule?: string;
      message?: string;
      logic?: 'AND' | 'OR';
      rules?: Array<{
        rule?: string;
        message?: string;
      }>;
    };
  };
}

// Props for the FieldEditDialog component
export interface FieldEditDialogProps {
  open: boolean;
  field: ExtendedCustomFieldDefinition | null;
  isEditing: boolean;
  onClose: () => void;
  onSave: (field: ExtendedCustomFieldDefinition) => void;
}

// Props for the FieldSelectionPage component
export interface FieldSelectionPageProps {
  onCreateField: () => void;
  onReadyFields: () => void;
}

// Props for the FieldPropertiesStep component
export interface FieldPropertiesStepProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

// Props for the FieldRulesStep component
export interface FieldRulesStepProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

// Props for the FieldPreviewStep component
export interface FieldPreviewStepProps {
  formData: ExtendedCustomFieldDefinition;
  originalType?: FieldType;
}

// Props for the NodeFieldManager component
export interface NodeFieldManagerProps {
  nodeId: string;
  nodeName: string;
  fields?: ExtendedCustomFieldDefinition[];
}