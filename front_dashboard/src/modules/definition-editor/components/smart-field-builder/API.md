# Smart Field Builder API Reference

## Core Components

### SmartFieldBuilder

Main modal component for field creation.

```typescript
interface SmartFieldBuilderProps {
  open: boolean;                           // Controls modal visibility
  onClose: () => void;                     // Called when modal is closed
  onSave: (config: SmartFieldConfig | SmartFieldConfig[]) => void;  // Called when field is saved
  existingFields?: SmartFieldConfig[];     // Current fields in the category
  editingField?: SmartFieldConfig | null;  // Field being edited (optional)
  categoryContext?: string;                // Category context for suggestions
}
```

**Usage:**
```tsx
<SmartFieldBuilder
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={handleFieldSave}
  existingFields={currentFields}
  categoryContext="personnel"
/>
```

### OptimizedTemplateSelector

Template selection component with virtual scrolling and caching.

```typescript
interface OptimizedTemplateSelectorProps {
  onTemplateSelect: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}
```

**Features:**
- Virtual scrolling for large template lists
- Intelligent caching
- Search and filtering
- Category-based recommendations

### GuidedWizard

Step-by-step field creation wizard.

```typescript
interface GuidedWizardProps {
  wizardState: WizardState;
  onStateChange: (state: WizardState) => void;
  onComplete: (config: SmartFieldConfig) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}
```

**Wizard Steps:**
1. Base Type Selection
2. Enhancements Configuration
3. Data Source Definition
4. Preview and Validation

## Type Definitions

### SmartFieldConfig

Core field configuration interface.

```typescript
interface SmartFieldConfig {
  id: string;                              // Unique field identifier
  name: string;                            // Persian display name
  englishName: string;                     // System identifier (a-z, 0-9, _)
  description?: string;                    // Field description
  baseType: BaseFieldType;                 // Core field type
  enhancements: FieldEnhancement[];        // Additional features
  dataSource?: DataSource;                 // Data source configuration
  validation: ValidationRule[];            // Validation rules
  isRequired: boolean;                     // Required field flag
  order: number;                           // Display order
  placeholder?: string;                    // Input placeholder
  helpText?: string;                       // Help text
  conditional?: ConditionalLogic;          // Conditional display logic
  generatedConfig?: GeneratedConfig;       // Final configuration
}
```

### BaseFieldType

Available field types.

```typescript
enum BaseFieldType {
  TEXT = 'text',        // Text input fields
  NUMBER = 'number',    // Numeric input fields
  CHOICE = 'choice',    // Selection fields
  REFERENCE = 'reference' // Reference to other data
}
```

### FieldEnhancement

Enhancement configuration for fields.

```typescript
interface FieldEnhancement {
  type: EnhancementType;           // Enhancement type
  config: Record<string, any>;     // Enhancement-specific configuration
  enabled: boolean;                // Whether enhancement is active
}
```

### EnhancementType

Available enhancements by field type.

```typescript
enum EnhancementType {
  // Text enhancements
  MULTILINE = 'multiline',         // Multi-line text support
  COMPOSITE = 'composite',         // Composite field (multiple parts)
  
  // Number enhancements
  RANGE = 'range',                 // Min/max value constraints
  UNIT = 'unit',                   // Display unit (kg, cm, etc.)
  DECIMAL = 'decimal',             // Decimal precision
  
  // Choice enhancements
  SINGLE = 'single',               // Single selection (radio)
  MULTIPLE = 'multiple',           // Multiple selection (checkbox)
  SEARCHABLE = 'searchable',       // Search within options
  GROUPED = 'grouped',             // Grouped options
  
  // Reference enhancements
  HIERARCHICAL = 'hierarchical',   // Tree structure
  FREE_TEXT = 'free_text',         // Allow custom text input
  SEARCHABLE_REF = 'searchable_ref' // Advanced search capabilities
}
```

### DataSource

Data source configuration for choice and reference fields.

```typescript
interface DataSource {
  type: DataSourceType;            // Source type
  config: DataSourceConfig;        // Type-specific configuration
  caching?: CacheConfig;           // Caching options
}

enum DataSourceType {
  CATEGORY = 'category',           // From definition categories
  MANUAL = 'manual',              // Manual list
  EXTERNAL = 'external',          // External API
  COMPUTED = 'computed'           // Computed values
}
```

### ValidationRule

Field validation configuration.

```typescript
interface ValidationRule {
  type: ValidationType;            // Validation type
  config: Record<string, any>;     // Validation-specific config
  enabled: boolean;                // Whether rule is active
  errorMessage: string;            // Custom error message
  order?: number;                  // Validation order
}

enum ValidationType {
  REQUIRED = 'required',           // Required field
  MIN_LENGTH = 'min_length',       // Minimum text length
  MAX_LENGTH = 'max_length',       // Maximum text length
  PATTERN = 'pattern',             // Regex pattern
  RANGE = 'range',                 // Numeric range
  EMAIL = 'email',                 // Email format
  PHONE = 'phone',                 // Phone format
  NATIONAL_ID = 'national_id',     // Iranian national ID
  CUSTOM_FUNCTION = 'custom_function', // Custom validation
  CROSS_FIELD = 'cross_field',     // Cross-field validation
  CONDITIONAL = 'conditional',     // Conditional validation
  UNIQUE = 'unique',               // Unique value
  FILE_SIZE = 'file_size',         // File size limit
  FILE_TYPE = 'file_type',         // File type restriction
  DATE_RANGE = 'date_range',       // Date range
  TIME_RANGE = 'time_range'        // Time range
}
```

## Templates

### Template

Template definition interface.

```typescript
interface Template {
  id: string;                      // Unique template ID
  name: string;                    // Template name
  description: string;             // Template description
  category: string | string[];     // Template categories
  fields: TemplateField[];         // Template fields
  icon?: string;                   // Template icon (emoji)
  tags?: string[];                 // Search tags
  keywords?: string[];             // Search keywords
  isMultiField?: boolean;          // Contains multiple fields
  isCritical?: boolean;            // Critical/recommended template
  usageCount?: number;             // Usage statistics
  rating?: number;                 // User rating
  complexity?: 'simple' | 'intermediate' | 'advanced'; // Complexity level
  createdAt?: string;              // Creation date
  updatedAt?: string;              // Last update date
  lastUsed?: string;               // Last usage date
  qualityScore?: number;           // Quality score (0-100)
  validation?: TemplateValidationResult; // Validation results
}
```

### Critical Field Templates

Pre-built templates for common use cases.

```typescript
const CRITICAL_FIELD_TEMPLATES: Template[] = [
  {
    id: 'personal_info_complete',
    name: 'اطلاعات شخصی کامل',
    description: 'مجموعه کامل فیلدهای اطلاعات شخصی',
    category: ['personnel', 'personal'],
    fields: [
      {
        id: 'full_name',
        name: 'نام و نام خانوادگی',
        englishName: 'fullName',
        baseType: BaseFieldType.TEXT,
        enhancements: [
          {
            type: EnhancementType.COMPOSITE,
            config: {
              parts: [
                { id: 'firstName', label: 'نام', required: true },
                { id: 'lastName', label: 'نام خانوادگی', required: true }
              ]
            },
            enabled: true
          }
        ],
        validation: [
          {
            type: ValidationType.REQUIRED,
            config: {},
            enabled: true,
            errorMessage: 'نام و نام خانوادگی الزامی است'
          }
        ],
        isRequired: true,
        order: 1
      }
      // ... more fields
    ],
    isCritical: true,
    isMultiField: true,
    tags: ['شخصی', 'پرسنل', 'اطلاعات'],
    complexity: 'simple'
  }
  // ... more templates
];
```

## Utilities

### Cache Management

```typescript
// Template caching
const templateCache = cacheManager.getCache('templates', {
  maxSize: 500,
  ttl: 10 * 60 * 1000,     // 10 minutes
  enableStatistics: true,
  persistToDisk: true
});

// Get cached templates
const templates = await templateCache.getOrSet(
  'critical_templates',
  () => loadCriticalTemplates(),
  { ttl: 15 * 60 * 1000 }
);

// Cache statistics
const stats = templateCache.getStatistics();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### Template Validation

```typescript
// Validate single template
const validation = validateTemplate(template, {
  strict: false,
  requireDescription: true,
  validateEnhancements: true
});

if (!validation.isValid) {
  console.error('Template validation failed:', validation.errors);
}

// Validate template collection
const collectionValidation = validateTemplateCollection(templates);

// Quick validation (performance optimized)
const isValid = quickValidateTemplate(template);
```

### Performance Monitoring

```typescript
// Performance metrics
interface PerformanceMetrics {
  componentLoadTime: number;
  renderTime: number;
  totalMemoryUsage: number;
  chunkLoadTimes: Record<string, number>;
  validationTime?: number;
  cacheHitRate?: number;
}

// Usage analytics
interface UsageAnalytics {
  templateId: string;
  templateName: string;
  category: string;
  context?: string;
  searchQuery?: string;
  timestamp: string;
  validationScore?: number;
  hasWarnings?: boolean;
}
```

## Accessibility API

### ARIA Labels

```typescript
const ARIA_LABELS = {
  // Modal and Navigation
  modal: 'مودال ساخت فیلد هوشمند',
  closeModal: 'بستن مودال',
  previousStep: 'مرحله قبل',
  nextStep: 'مرحله بعد',
  
  // Field Types
  textField: 'فیلد متنی',
  numberField: 'فیلد عددی',
  choiceField: 'فیلد انتخابی',
  referenceField: 'فیلد مرجع',
  
  // Actions
  save: 'ذخیره فیلد',
  cancel: 'انصراف',
  preview: 'پیش‌نمایش'
};
```

### Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  CLOSE_MODAL: { key: 'Escape', description: 'بستن مودال' },
  SAVE_FIELD: { key: 's', ctrlKey: true, description: 'ذخیره فیلد' },
  NEXT_STEP: { key: 'ArrowRight', ctrlKey: true, description: 'مرحله بعد' },
  PREVIOUS_STEP: { key: 'ArrowLeft', ctrlKey: true, description: 'مرحله قبل' }
};
```

### Focus Management

```typescript
// Create focus trap
const cleanup = FocusManager.createFocusTrap(container);

// Focus first invalid field
const focused = FocusManager.focusFirstInvalidField(container);

// Announce to screen readers
FocusManager.announceToScreenReader(message, 'polite');
```

## Error Handling

### Error Types

```typescript
// Validation errors
interface ValidationError {
  field: string;
  message: string;
  type: ValidationType;
  value?: any;
}

// Template errors
interface TemplateError {
  templateId: string;
  error: string;
  severity: 'error' | 'warning';
}

// Performance errors
interface PerformanceError {
  component: string;
  metric: string;
  threshold: number;
  actual: number;
}
```

### Error Recovery

```typescript
// Graceful error handling
try {
  const templates = await loadTemplates();
} catch (error) {
  console.error('Template loading failed:', error);
  // Fallback to cached templates
  const cachedTemplates = templateCache.getSync('fallback_templates');
  return cachedTemplates || [];
}
```

## Hooks

### usePerformanceOptimization

```typescript
const {
  isIntersecting,
  measurePerformance,
  optimizeRender
} = usePerformanceOptimization();

// Usage
useEffect(() => {
  if (isIntersecting) {
    measurePerformance('template_load', () => {
      loadTemplates();
    });
  }
}, [isIntersecting]);
```

## Events

### Field Creation Events

```typescript
// Field created
onFieldCreated: (field: SmartFieldConfig) => void;

// Field updated
onFieldUpdated: (field: SmartFieldConfig, changes: Partial<SmartFieldConfig>) => void;

// Validation failed
onValidationFailed: (errors: ValidationError[]) => void;

// Template selected
onTemplateSelected: (template: Template) => void;
```

### Performance Events

```typescript
// Performance threshold exceeded
onPerformanceThreshold: (metric: PerformanceMetrics) => void;

// Cache miss
onCacheMiss: (key: string, category: string) => void;
```

## Configuration

### Builder Configuration

```typescript
interface BuilderConfig {
  // Template settings
  enableTemplates: boolean;
  templateCategories: string[];
  maxTemplatesPerPage: number;
  
  // Wizard settings
  enableWizard: boolean;
  skipOptionalSteps: boolean;
  autoValidation: boolean;
  
  // Performance settings
  virtualScrolling: boolean;
  cacheTemplates: boolean;
  lazyLoading: boolean;
  
  // Accessibility settings
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
}
```

### Theme Integration

```typescript
// Material-UI theme integration
const theme = {
  smartFieldBuilder: {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#f5f5f5',
    surface: '#ffffff',
    
    // Field type colors
    fieldTypes: {
      text: '#4caf50',
      number: '#2196f3',
      choice: '#ff9800',
      reference: '#9c27b0'
    }
  }
};
```

## Migration

### From Simple Field Builder

```typescript
// Old configuration
const oldField = {
  name: 'userName',
  type: 'text',
  required: true
};

// New configuration
const newField: SmartFieldConfig = {
  id: 'user_name_field',
  name: 'نام کاربری',
  englishName: 'userName',
  baseType: BaseFieldType.TEXT,
  enhancements: [],
  validation: [
    {
      type: ValidationType.REQUIRED,
      config: {},
      enabled: true,
      errorMessage: 'نام کاربری الزامی است'
    }
  ],
  isRequired: true,
  order: 1
};
```

## Best Practices

### Performance

1. Use virtual scrolling for large lists
2. Implement proper caching strategies
3. Lazy load components
4. Optimize re-renders with React.memo

### Type Safety

1. Define comprehensive interfaces
2. Avoid 'any' types
3. Use strict TypeScript settings
4. Document complex types

### Accessibility

1. Provide ARIA labels
2. Implement keyboard navigation
3. Support screen readers
4. Test with accessibility tools

### Testing

1. Write unit tests for utilities
2. Integration tests for complete flows
3. Performance testing for large datasets
4. Accessibility testing with tools