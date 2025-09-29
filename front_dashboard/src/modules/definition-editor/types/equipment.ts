import type { ReferenceSections } from '@/hooks/useReferenceData';

// تعریف نوع داده برای فیلدهای سفارشی
export interface CustomField {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference' |
        // Enhanced field types
        'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual' |
        // Complex data field types
        'array-text' | 'key-value' | 'grouped';
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
    patternMessage?: string;
    unique?: boolean;
  };
  // Reference field properties
  referenceCategory?: string; // ID of the category to reference (e.g., 'military_ranks')
  referenceSections?: ReferenceSections; // Which sections to display: 'hierarchy', 'data', or 'both'
  
  // Enhanced field properties
  minItems?: number; // For array fields
  maxItems?: number; // For array fields
  hierarchicalCategory?: string; // For hierarchical address fields
  allowFreeText?: boolean; // For hierarchical address fields
  
  // Extended text field properties
  placeholder?: string;
  helpText?: string;
  direction?: 'auto' | 'rtl' | 'ltr';
  
  // Content properties
  minLength?: number;
  maxLength?: number;
  allowedCharset?: 'letters' | 'alphanumeric' | 'all' | 'custom';
  customRegex?: string; // Custom regex pattern for allowed charset
  caseTransform?: 'none' | 'lowercase' | 'uppercase' | 'capitalize';
  
  // Advanced properties
  trimWhitespace?: boolean;
  normalizeDigits?: boolean;
  fixZWNJ?: boolean;
  allowEmoji?: boolean;
  allowMarkdown?: boolean;
  
  // Helper features
  suggestions?: string[];
  autoComplete?: boolean;
  multiValue?: boolean;
  multiValueSeparator?: 'comma' | 'enter' | 'space';
  spellcheck?: 'fa' | 'en' | 'custom' | 'off';
  customDictionary?: string;
  
  // Display features
  variant?: 'plain' | 'accordion' | 'textarea' | 'richtext' | 'inline' | 'chips' | 'pill' | 'masked' | 'popover';
  selectionAid?: 'none' | 'single' | 'multi';
  size?: 'sm' | 'md' | 'lg' | 'full';
  icon?: string;
  prefix?: string;
  suffix?: string;
  counterDisplay?: 'bottom' | 'inside' | 'off';
  copyButton?: boolean;
  readOnlyStyle?: 'normal' | 'disabled' | 'plain';
  validationMessageStyle?: 'bottom' | 'tooltip' | 'inline';
  maskPattern?: string;
  accordionTitle?: string;
  accordionDisplayMode?: 'title' | 'options'; // Controls whether to show title or options in accordion
  
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
  
  // Array-text field properties
  arrayTextMinItems?: number;
  arrayTextMaxItems?: number;
  arrayTextItemLabel?: string; // Label for each item (e.g., "آدرس", "توضیحات")
  arrayTextItemPlaceholder?: string; // Placeholder for each item
  arrayTextItemType?: 'text' | 'textarea'; // Type of each array item
  
  // Key-value field properties
  keyValueMinPairs?: number;
  keyValueMaxPairs?: number;
  keyValueKeyLabel?: string; // Label for key field (e.g., "ویژگی")
  keyValueValueLabel?: string; // Label for value field (e.g., "مقدار")
  keyValueKeyPlaceholder?: string;
  keyValueValuePlaceholder?: string;
  keyValuePredefinedKeys?: string[]; // Predefined keys to suggest
  
  // Grouped field properties
  groupedSections?: {
    id: string;
    title: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    fields: {
      key: string;
      label: string;
      type: 'text' | 'textarea' | 'number' | 'select';
      options?: string[]; // For select type
      required?: boolean;
      placeholder?: string;
    }[];
  }[];
  
  // Behavior and Logic features
  editableAfterSave?: boolean; // قفل‌شدن بعد از ثبت / قابل‌ویرایش‌بودن
  debounceTime?: number; // زمان تأخیر (میلی‌ثانیه)
  enableAutosave?: boolean; // ذخیرهٔ خودکار
  autosaveInterval?: number; // فاصله زمانی ذخیره خودکار (ثانیه)
  conditionalVisibility?: {
    enabled: boolean;
    fieldId?: string; // فیلد مرجع
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string; // مقدار شرط
  };
  conditionalEnable?: {
    enabled: boolean;
    fieldId?: string; // فیلد مرجع
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string; // مقدار شرط
  };
  
  // Security and Storage features
  piiCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn'; // مسدود/هشدار
    patterns?: string[]; // الگوهای اطلاعات حساس
  };
  profanityCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn'; // مسدود/هشدار
    customWords?: string[]; // کلمات نامناسب سفارشی
  };
  indexing?: {
    searchable?: boolean; // قابل جستجو
    filterable?: boolean; // قابل فیلتر
  };
  analyzer?: 'standard' | 'persian'; // برای جستجوی بهتر
  storeRawAndNormalized?: boolean; // نگه‌داری نسخهٔ خام و نرمال‌شده جداگانه
  
  // Conditional and Control rules
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
  };
  controlRules?: {
    defaultValue?: string;
    lockAfterSave?: boolean;
    readOnly?: boolean;
  };
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
        'text-english' | 'text-numeric' | 'conditional-national-id' | 'phone-array' | 'address-array' | 'hierarchical-address' | 'name-split' | 'full-name-dual' |
        // Complex data field types
        'array-text' | 'key-value' | 'grouped';
  isRequired: boolean;
  defaultValue?: any;
  options?: string[];
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    patternMessage?: string;
    unique?: boolean;
  };
  order: number;
  unit?: string;
  // Reference field properties
  referenceCategory?: string;
  referenceSections?: ReferenceSections;
  
  // Enhanced field properties
  minItems?: number; // For array fields
  maxItems?: number; // For array fields
  hierarchicalCategory?: string; // For hierarchical address fields
  allowFreeText?: boolean; // For hierarchical address fields
  
  // Extended text field properties
  placeholder?: string;
  helpText?: string;
  direction?: 'auto' | 'rtl' | 'ltr';
  
  // Content properties
  minLength?: number;
  maxLength?: number;
  allowedCharset?: 'letters' | 'alphanumeric' | 'all' | 'custom';
  customRegex?: string; // Custom regex pattern for allowed charset
  caseTransform?: 'none' | 'lowercase' | 'uppercase' | 'capitalize';
  
  // Advanced properties
  trimWhitespace?: boolean;
  normalizeDigits?: boolean;
  fixZWNJ?: boolean;
  allowEmoji?: boolean;
  allowMarkdown?: boolean;
  
  // Helper features
  suggestions?: string[];
  autoComplete?: boolean;
  multiValue?: boolean;
  multiValueSeparator?: 'comma' | 'enter' | 'space';
  spellcheck?: 'fa' | 'en' | 'custom' | 'off';
  customDictionary?: string;
  
  // Display features
  variant?: 'plain' | 'accordion' | 'textarea' | 'richtext' | 'inline' | 'chips' | 'pill' | 'masked' | 'popover';
  selectionAid?: 'none' | 'single' | 'multi';
  size?: 'sm' | 'md' | 'lg' | 'full';
  icon?: string;
  prefix?: string;
  suffix?: string;
  counterDisplay?: 'bottom' | 'inside' | 'off';
  copyButton?: boolean;
  readOnlyStyle?: 'normal' | 'disabled' | 'plain';
  validationMessageStyle?: 'bottom' | 'tooltip' | 'inline';
  maskPattern?: string;
  accordionTitle?: string;
  accordionDisplayMode?: 'title' | 'options'; // Controls whether to show title or options in accordion
  
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
  
  // Array-text field properties
  arrayTextMinItems?: number;
  arrayTextMaxItems?: number;
  arrayTextItemLabel?: string; // Label for each item (e.g., "آدرس", "توضیحات")
  arrayTextItemPlaceholder?: string; // Placeholder for each item
  arrayTextItemType?: 'text' | 'textarea'; // Type of each array item
  
  // Key-value field properties
  keyValueMinPairs?: number;
  keyValueMaxPairs?: number;
  keyValueKeyLabel?: string; // Label for key field (e.g., "ویژگی")
  keyValueValueLabel?: string; // Label for value field (e.g., "مقدار")
  keyValueKeyPlaceholder?: string;
  keyValueValuePlaceholder?: string;
  keyValuePredefinedKeys?: string[]; // Predefined keys to suggest
  
  // Grouped field properties
  groupedSections?: {
    id: string;
    title: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    fields: {
      key: string;
      label: string;
      type: 'text' | 'textarea' | 'number' | 'select';
      options?: string[]; // For select type
      required?: boolean;
      placeholder?: string;
    }[];
  }[];
  
  // Behavior and Logic features
  editableAfterSave?: boolean; // قفل‌شدن بعد از ثبت / قابل‌ویرایش‌بودن
  debounceTime?: number; // زمان تأخیر (میلی‌ثانیه)
  enableAutosave?: boolean; // ذخیرهٔ خودکار
  autosaveInterval?: number; // فاصله زمانی ذخیره خودکار (ثانیه)
  conditionalVisibility?: {
    enabled: boolean;
    fieldId?: string; // فیلد مرجع
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string; // مقدار شرط
  };
  conditionalEnable?: {
    enabled: boolean;
    fieldId?: string; // فیلد مرجع
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
    value?: string; // مقدار شرط
  };
  
  // Security and Storage features
  piiCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn'; // مسدود/هشدار
    patterns?: string[]; // الگوهای اطلاعات حساس
  };
  profanityCheck?: {
    enabled: boolean;
    action?: 'block' | 'warn'; // مسدود/هشدار
    customWords?: string[]; // کلمات نامناسب سفارشی
  };
  indexing?: {
    searchable?: boolean; // قابل جستجو
    filterable?: boolean; // قابل فیلتر
  };
  analyzer?: 'standard' | 'persian'; // برای جستجوی بهتر
  storeRawAndNormalized?: boolean; // نگه‌داری نسخهٔ خام و نرمال‌شده جداگانه
  
  // Conditional and Control rules
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
  };
  controlRules?: {
    defaultValue?: string;
    lockAfterSave?: boolean;
    readOnly?: boolean;
  };
}
