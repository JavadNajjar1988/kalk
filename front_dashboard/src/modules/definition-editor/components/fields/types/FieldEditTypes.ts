// Types and interfaces for the Field Edit Dialog components
// This file contains all type definitions extracted from NodeFieldManager.tsx

import { CustomFieldDefinition } from '../../../types/equipment';

// Field type definitions aligned with existing types
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference' |
  // Enhanced field types
  'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual' |
  // Complex data field types
  'array-text' | 'key-value' | 'grouped';

// Extended interface for additional text field properties
export interface ExtendedCustomFieldDefinition extends CustomFieldDefinition {
  // Required fields for all field types
  name: string;
  englishName: string;
  type: FieldType;
  
  // Toggle enablers for optional properties
  enablePlaceholder?: boolean;
  enableDefaultValue?: boolean;
  enableHelpText?: boolean;
  enableLengthLimits?: boolean;
  enableCharsetControl?: boolean;
  enableCaseTransform?: boolean;
  enableCustomRegex?: boolean;
  enableWhitespaceControl?: boolean;
  enableDigitNormalization?: boolean;
  enableZWNJPolicy?: boolean;
  enableEmojiPolicy?: boolean;
  enableHTMLPolicy?: boolean;
  enableMarkdownPolicy?: boolean;
  
  // Helper features toggles
  enableSuggestions?: boolean;
  enableAutoComplete?: boolean;
  enableMultiValue?: boolean;
  enableSpellcheck?: boolean;
  
  // Display features toggles
  enableVariant?: boolean;
  enableSelectionAid?: boolean;
  enableVisualEnhancements?: boolean;
  enableStyleConfig?: boolean;
  
  // Text field specific properties
  placeholder?: string;
  helpText?: string;
  direction?: 'auto' | 'rtl' | 'ltr';
  
  // Content properties
  minLength?: number;
  maxLength?: number;
  allowedCharset?: 'letters' | 'alphanumeric' | 'all' | 'custom';
  caseTransform?: 'none' | 'lowercase' | 'uppercase' | 'capitalize';
  
  // Content control properties
  characterControl?: 'letters-only' | 'letters-numbers' | 'all' | 'custom';
  trimExtraSpaces?: boolean;
  trimWhitespace?: boolean;
  convertNumbers?: boolean;
  normalizeDigits?: boolean;
  fixHalfSpace?: boolean;
  fixZWNJ?: boolean;
  allowEmoji?: boolean;
  allowMarkdown?: boolean;
  customRegex?: string;
  
  // Assistive properties
  suggestions?: string[];
  autoComplete?: boolean;
  enableAutoComplete?: boolean;
  enableMultipleValues?: boolean;
  multiValueSeparator?: 'comma' | 'enter' | 'space' | 'semicolon';
  spellCheck?: 'off' | 'persian' | 'english' | 'both' | 'custom';
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
  
  // Security properties
  enableSensitiveDataDetection?: boolean;
  sensitiveDataAction?: 'warn' | 'block' | 'mask';
  enableInappropriateWordsDetection?: boolean;
  inappropriateWordsAction?: 'warn' | 'block' | 'replace';
  searchable?: boolean;
  filterable?: boolean;
  searchAnalyzer?: 'standard' | 'persian' | 'custom';
  analyzer?: 'standard' | 'persian';
  storeRawAndNormalized?: boolean;
  
  // Display properties
  displayType?: 'normal' | 'accordion' | 'multiline' | 'rich-text' | 'inline' | 'chips' | 'pill' | 'masked' | 'popover';
  selectionHelper?: 'none' | 'single' | 'multiple';
  size?: 'sm' | 'md' | 'lg' | 'full';
  icon?: string;
  prefix?: string;
  suffix?: string;
  counterDisplay?: 'off' | 'bottom' | 'inside';
  showCopyButton?: boolean;
  
  // Display features
  variant?: 'plain' | 'accordion' | 'textarea' | 'richtext' | 'inline' | 'chips' | 'pill' | 'masked' | 'popover';
  selectionAid?: 'none' | 'single' | 'multi';
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
  
  // Mask properties
  maskPattern?: string;
  
  // Temporary field for adding new options
  newOptionText?: string;
  
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
  
  // Rules features
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    unique?: boolean;
  };
  conditionalRules?: {
    visibility?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
      value?: string;
    };
    enable?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
      value?: string;
    };
    required?: {
      enabled: boolean;
      dependsOn?: string;
      condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
      value?: string;
    };
    custom?: {
      enabled: boolean;
      rule?: string;
      message?: string;
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