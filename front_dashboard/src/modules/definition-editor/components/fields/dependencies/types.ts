// Field Dependency Management System - Type Definitions

export interface FieldDependency {
  id: string;
  sourceFieldId: string;
  targetFieldId: string;
  type: DependencyType;
  condition: DependencyCondition;
  action: DependencyAction;
  enabled: boolean;
  priority: number;
  description?: string;
}

export enum DependencyType {
  VISIBILITY = 'visibility',      // Show/hide field based on condition
  REQUIRED = 'required',          // Make field required/optional based on condition
  VALUE = 'value',               // Set field value based on condition
  OPTIONS = 'options',           // Change field options based on condition
  VALIDATION = 'validation',     // Enable/disable validation rules based on condition
  READONLY = 'readonly'          // Make field readonly/editable based on condition
}

export interface DependencyCondition {
  sourceFieldId: string;
  operator: ConditionOperator;
  targetValue: any;
  value: any;
  valueType: ValueType;
  caseSensitive?: boolean;
  multiple?: boolean; // For multiple value comparisons
  values?: any[]; // For 'in' or 'notIn' operators
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
  MATCHES_PATTERN = 'matchesPattern',
  HAS_LENGTH = 'hasLength',
  REGEX_MATCH = 'regexMatch',
  IN_LIST = 'inList',
  NOT_IN_LIST = 'notInList'
}

export enum ValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object'
}

export interface DependencyAction {
  type: ActionType;
  config: ActionConfig;
  value?: any;
  executeWhenConditionFalse?: boolean;
  customFunction?: (context: any) => Promise<any> | any;
}

export enum ActionType {
  SHOW = 'show',
  HIDE = 'hide',
  REQUIRE = 'require',
  OPTIONAL = 'optional',
  SET_VALUE = 'setValue',
  CLEAR_VALUE = 'clearValue',
  SET_OPTIONS = 'setOptions',
  FILTER_OPTIONS = 'filterOptions',
  ENABLE_VALIDATION = 'enableValidation',
  DISABLE_VALIDATION = 'disableValidation',
  READONLY = 'readonly',
  EDITABLE = 'editable',
  FOCUS = 'focus',
  BLUR = 'blur',
  SHOW_FIELD = 'showField',
  HIDE_FIELD = 'hideField',
  ENABLE_FIELD = 'enableField',
  DISABLE_FIELD = 'disableField',
  MAKE_REQUIRED = 'makeRequired',
  MAKE_OPTIONAL = 'makeOptional',
  ADD_VALIDATION = 'addValidation',
  REMOVE_VALIDATION = 'removeValidation',
  EXECUTE_CUSTOM = 'executeCustom'
}

export interface ActionConfig {
  // For setValue action
  value?: any;
  preserveExisting?: boolean;
  
  // For setOptions/filterOptions action
  options?: FieldOption[];
  filterBy?: string;
  filterValue?: any;
  
  // For validation actions
  validationRules?: string[];
  
  // For animation/transition
  animate?: boolean;
  duration?: number;
  
  // For conditional execution
  condition?: DependencyCondition;
}

export interface FieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, any>;
}

export interface DependencyEvaluationContext {
  formData: Record<string, any>;
  fieldDefinitions: Record<string, any>;
  previousValues?: Record<string, any>;
  triggerField: string;
  timestamp: number;
}

export interface DependencyResult {
  dependencyId: string;
  dependency: FieldDependency;
  matched: boolean;
  conditionMet: boolean;
  actionExecuted: boolean;
  action: DependencyAction;
  targetFieldId: string;
  newValue?: any;
  context?: DependencyContext;
  error?: string;
}

export interface DependencyManagerOptions {
  enableLogging?: boolean;
  enableCaching?: boolean;
  enableAnimation?: boolean;
  batchUpdates?: boolean;
  debounceDelay?: number;
  maxDependencyDepth?: number;
}

// Dependency Context for evaluation
export interface DependencyContext {
  fieldValues: Record<string, any>;
  fieldDefinitions: Record<string, any>;
  previousValues?: Record<string, any>;
  triggerField: string;
  timestamp: number;
}

// Built-in dependency patterns
export const DependencyPatterns = {
  SHOW_IF_EQUALS: {
    type: DependencyType.VISIBILITY,
    condition: {
      operator: ConditionOperator.EQUALS,
      value: '',
      valueType: ValueType.STRING,
      sourceFieldId: '',
      targetValue: ''
    },
    action: {
      type: ActionType.SHOW_FIELD,
      config: { animate: true }
    },
    priority: 100
  },
  REQUIRE_IF_NOT_EMPTY: {
    type: DependencyType.REQUIRED,
    condition: {
      operator: ConditionOperator.IS_NOT_EMPTY,
      value: null,
      valueType: ValueType.STRING,
      sourceFieldId: '',
      targetValue: null
    },
    action: {
      type: ActionType.MAKE_REQUIRED,
      config: {}
    },
    priority: 100
  },
  CASCADING_OPTIONS: {
    type: DependencyType.OPTIONS,
    condition: {
      operator: ConditionOperator.IS_NOT_EMPTY,
      value: null,
      valueType: ValueType.STRING,
      sourceFieldId: '',
      targetValue: null
    },
    action: {
      type: ActionType.FILTER_OPTIONS,
      config: { filterBy: 'category' }
    },
    priority: 100
  }
} as const;

// Built-in dependency patterns
export interface DependencyPattern {
  id: string;
  name: string;
  description: string;
  category: DependencyPatternCategory;
  template: Partial<FieldDependency>;
  examples: DependencyExample[];
}

export enum DependencyPatternCategory {
  COMMON = 'common',
  ADVANCED = 'advanced',
  BUSINESS_LOGIC = 'businessLogic',
  UI_BEHAVIOR = 'uiBehavior'
}

export interface DependencyExample {
  title: string;
  description: string;
  sourceField: string;
  targetField: string;
  scenario: string;
}

// Built-in patterns
export const DEPENDENCY_PATTERNS: DependencyPattern[] = [
  {
    id: 'show-if-equals',
    name: 'Show Field If Value Equals',
    description: 'Show target field when source field equals specific value',
    category: DependencyPatternCategory.COMMON,
    template: {
      type: DependencyType.VISIBILITY,
      condition: {
        operator: ConditionOperator.EQUALS,
        value: '',
        valueType: ValueType.STRING,
        sourceFieldId: '',
        targetValue: ''
      },
      action: {
        type: ActionType.SHOW,
        config: { animate: true }
      }
    },
    examples: [
      {
        title: 'Address Details',
        description: 'Show address fields when user selects "Other" for country',
        sourceField: 'country',
        targetField: 'address_details',
        scenario: 'country equals "Other"'
      }
    ]
  },
  {
    id: 'require-if-not-empty',
    name: 'Require Field If Source Not Empty',
    description: 'Make target field required when source field has value',
    category: DependencyPatternCategory.COMMON,
    template: {
      type: DependencyType.REQUIRED,
      condition: {
        operator: ConditionOperator.IS_NOT_EMPTY,
        value: null,
        valueType: ValueType.STRING,
        sourceFieldId: '',
        targetValue: null
      },
      action: {
        type: ActionType.REQUIRE,
        config: {}
      }
    },
    examples: [
      {
        title: 'Email Confirmation',
        description: 'Require email confirmation when email is provided',
        sourceField: 'email',
        targetField: 'email_confirmation',
        scenario: 'email is not empty'
      }
    ]
  },
  {
    id: 'cascading-options',
    name: 'Cascading Option Lists',
    description: 'Filter options in target field based on source field selection',
    category: DependencyPatternCategory.ADVANCED,
    template: {
      type: DependencyType.OPTIONS,
      condition: {
        operator: ConditionOperator.IS_NOT_EMPTY,
        value: null,
        valueType: ValueType.STRING,
        sourceFieldId: '',
        targetValue: null
      },
      action: {
        type: ActionType.FILTER_OPTIONS,
        config: { filterBy: 'category' }
      }
    },
    examples: [
      {
        title: 'Country-State Selection',
        description: 'Filter states based on selected country',
        sourceField: 'country',
        targetField: 'state',
        scenario: 'Filter states by country'
      }
    ]
  },
  {
    id: 'conditional-validation',
    name: 'Conditional Validation',
    description: 'Enable validation rules based on field values',
    category: DependencyPatternCategory.BUSINESS_LOGIC,
    template: {
      type: DependencyType.VALIDATION,
      condition: {
        operator: ConditionOperator.EQUALS,
        value: true,
        valueType: ValueType.BOOLEAN,
        sourceFieldId: '',
        targetValue: true
      },
      action: {
        type: ActionType.ENABLE_VALIDATION,
        config: { validationRules: [] }
      }
    },
    examples: [
      {
        title: 'Business Registration',
        description: 'Require business license when user is business owner',
        sourceField: 'user_type',
        targetField: 'business_license',
        scenario: 'user_type equals "business"'
      }
    ]
  }
];