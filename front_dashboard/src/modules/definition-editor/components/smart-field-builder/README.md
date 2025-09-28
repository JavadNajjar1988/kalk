# Smart Field Builder Documentation

## Overview

The Smart Field Builder is a sophisticated React component system designed to create dynamic form fields with advanced features. It provides two main approaches for field creation:

1. **Template-based creation**: Quick field generation using pre-built templates
2. **Guided wizard**: Step-by-step field creation with detailed configuration

## Architecture

```
SmartFieldBuilder/
├── components/
│   ├── templates/              # Template-related components
│   │   ├── OptimizedTemplateSelector.tsx
│   │   ├── TemplateCustomizer.tsx
│   │   └── CriticalFieldTemplates.ts
│   ├── wizard/                 # Wizard-related components
│   │   ├── GuidedWizard.tsx
│   │   └── steps/
│   │       ├── BaseTypeStep.tsx
│   │       ├── EnhancementsStep.tsx
│   │       ├── DataSourceStep.tsx
│   │       └── PreviewStep.tsx
│   ├── validation/             # Validation components
│   │   └── ValidationRuleBuilder.tsx
│   └── optimization/           # Performance components
│       └── VirtualList.tsx
├── utils/                      # Utility functions
│   ├── intelligentCache.ts
│   ├── templateValidation.ts
│   └── accessibilityHelpers.ts
├── types/                      # TypeScript definitions
│   └── smartFieldTypes.ts
└── hooks/                      # Custom React hooks
    └── usePerformanceOptimization.ts
```

## Core Features

### 1. Template-Based Field Creation

Templates provide quick field creation for common use cases:

- **Personal Information**: Name, national ID, phone number
- **Contact Details**: Email, address, emergency contacts
- **Business Information**: Company details, job titles, departments
- **Educational**: Degrees, institutions, certificates
- **Medical**: Health records, medications, allergies

#### Usage Example

```tsx
import SmartFieldBuilder from './SmartFieldBuilder';

function FieldCreator() {
  const [open, setOpen] = useState(false);
  
  const handleSave = (config: SmartFieldConfig | SmartFieldConfig[]) => {
    console.log('Created field:', config);
    setOpen(false);
  };

  return (
    <SmartFieldBuilder
      open={open}
      onClose={() => setOpen(false)}
      onSave={handleSave}
      categoryContext="personnel"
    />
  );
}
```

### 2. Guided Wizard Creation

The wizard provides step-by-step field creation:

#### Step 1: Base Type Selection
- **Text**: For names, descriptions, comments
- **Number**: For ages, quantities, scores  
- **Choice**: For selections from predefined options
- **Reference**: For linking to other data categories

#### Step 2: Enhancements
Available enhancements vary by base type:

**Text Enhancements:**
- Multiline: Support for long text content
- Composite: Combine multiple text parts

**Number Enhancements:**
- Range: Set minimum and maximum values
- Unit: Display measurement units
- Decimal: Support decimal precision

**Choice Enhancements:**
- Single: Radio button selection
- Multiple: Checkbox selection
- Searchable: Search within options
- Grouped: Organize options in groups

**Reference Enhancements:**
- Hierarchical: Tree-like data structure
- Free Text: Allow custom text input
- Searchable: Advanced search capabilities

#### Step 3: Data Source Configuration
Define where field options come from:
- **Manual**: Predefined list of options
- **Category**: Link to existing data categories
- **External**: API-based data source
- **Computed**: Calculated values

#### Step 4: Preview and Validation
Review the final field configuration before creation.

## Field Configuration

### SmartFieldConfig Interface

```typescript
interface SmartFieldConfig {
  id: string;
  name: string;                    // Persian display name
  englishName: string;             // System identifier
  description?: string;            // Field description
  baseType: BaseFieldType;         // Core field type
  enhancements: FieldEnhancement[]; // Additional features
  dataSource?: DataSource;         // Data source configuration
  validation: ValidationRule[];    // Validation rules
  isRequired: boolean;             // Required field flag
  order: number;                   // Display order
  placeholder?: string;            // Input placeholder
  helpText?: string;               // Help text
  conditional?: ConditionalLogic;  // Conditional display logic
}
```

### Base Field Types

```typescript
enum BaseFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CHOICE = 'choice',
  REFERENCE = 'reference'
}
```

### Enhancement Configuration

```typescript
interface FieldEnhancement {
  type: EnhancementType;
  config: Record<string, any>;
  enabled: boolean;
}

enum EnhancementType {
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
```

## Performance Optimizations

### 1. Intelligent Caching

The system uses multiple cache layers:

```typescript
// Template caching with TTL
const templateCache = cacheManager.getCache('templates', {
  maxSize: 500,
  ttl: 10 * 60 * 1000,     // 10 minutes
  enableStatistics: true
});

// Performance metrics caching
const performanceCache = cacheManager.getCache('performance', {
  maxSize: 100,
  ttl: 5 * 60 * 1000       // 5 minutes
});

// Validation results caching
const validationCache = cacheManager.getCache('validation', {
  maxSize: 200,
  ttl: 15 * 60 * 1000      // 15 minutes
});
```

### 2. Virtual Scrolling

For large template lists:

```tsx
<VirtualList
  items={templates}
  itemHeight={200}
  containerHeight={600}
  renderItem={renderTemplateCard}
  keyExtractor={(template) => template.id}
  overscan={3}
/>
```

### 3. Lazy Loading

Components are loaded on demand:

```tsx
const GuidedWizard = lazy(() => import('./GuidedWizard'));
const OptimizedTemplateSelector = lazy(() => 
  import('./components/templates/OptimizedTemplateSelector')
);
```

## Accessibility Features

### ARIA Labels and Roles

The system provides comprehensive accessibility support:

```typescript
// ARIA labels for Persian UI
const ARIA_LABELS = {
  modal: 'مودال ساخت فیلد هوشمند',
  templateSection: 'بخش انتخاب قالب آماده',
  wizardSection: 'بخش راهنمای گام به گام',
  // ... more labels
};
```

### Keyboard Navigation

Supported keyboard shortcuts:

- `Escape`: Close modal
- `Ctrl+S`: Save field
- `Ctrl+Shift+R`: Reset form
- `Ctrl+→`: Next step
- `Ctrl+←`: Previous step
- `Ctrl+P`: Jump to preview
- `Tab`/`Shift+Tab`: Navigate elements

### Focus Management

```typescript
// Create focus trap for modal
const cleanup = FocusManager.createFocusTrap(modalRef.current);

// Auto-focus on first invalid field
FocusManager.focusFirstInvalidField(container);

// Announce changes to screen readers
FocusManager.announceToScreenReader(message, 'polite');
```

## Validation System

### Built-in Validation Rules

```typescript
enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  PATTERN = 'pattern',
  RANGE = 'range',
  EMAIL = 'email',
  PHONE = 'phone',
  NATIONAL_ID = 'national_id',
  CUSTOM_FUNCTION = 'custom_function',
  CROSS_FIELD = 'cross_field'
}
```

### Custom Validation

```typescript
const customValidation: ValidationRule = {
  type: ValidationType.CUSTOM_FUNCTION,
  config: {
    function: (value: any, context: ValidationContext) => {
      // Custom validation logic
      return {
        isValid: true,
        errorMessage: ''
      };
    }
  },
  enabled: true,
  errorMessage: 'Custom validation failed'
};
```

## Error Handling

### Template Validation

```typescript
const validation = validateTemplate(template, {
  strict: false,
  requireDescription: true,
  validateEnhancements: true
});

if (!validation.isValid) {
  console.error('Template validation failed:', validation.errors);
}
```

### Collection Validation

```typescript
const collectionValidation = validateTemplateCollection(templates);

if (collectionValidation.warnings.length > 0) {
  console.warn('Collection warnings:', collectionValidation.warnings);
}
```

## Testing Guidelines

### Unit Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import SmartFieldBuilder from './SmartFieldBuilder';

describe('SmartFieldBuilder', () => {
  test('opens modal when open prop is true', () => {
    render(
      <SmartFieldBuilder 
        open={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('creates field with wizard', async () => {
    const onSave = jest.fn();
    
    render(
      <SmartFieldBuilder 
        open={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );
    
    // Select guided mode
    fireEvent.click(screen.getByText('راهنمای گام به گام'));
    
    // Select text field type
    fireEvent.click(screen.getByText('متن'));
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('نام فیلد'), {
      target: { value: 'نام کاربر' }
    });
    
    fireEvent.change(screen.getByLabelText('نام انگلیسی'), {
      target: { value: 'userName' }
    });
    
    // Save field
    fireEvent.click(screen.getByText('ایجاد'));
    
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'نام کاربر',
        englishName: 'userName',
        baseType: 'text'
      })
    );
  });
});
```

### Integration Testing

```typescript
describe('SmartFieldBuilder Integration', () => {
  test('complete wizard flow', async () => {
    // Test complete flow from opening modal to field creation
    // Include template selection, wizard steps, validation
  });
  
  test('template customization flow', async () => {
    // Test template selection and customization
  });
});
```

## Best Practices

### 1. Performance

- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Cache expensive calculations with useMemo
- Use lazy loading for large components

### 2. Type Safety

- Always define proper TypeScript interfaces
- Avoid 'any' types
- Use strict type checking
- Document complex type relationships

### 3. Accessibility

- Provide ARIA labels for all interactive elements
- Implement keyboard navigation
- Use semantic HTML elements
- Test with screen readers

### 4. Error Handling

- Validate all user inputs
- Provide clear error messages
- Handle edge cases gracefully
- Log errors for debugging

### 5. Testing

- Write tests for all critical paths
- Test accessibility features
- Mock external dependencies
- Use integration tests for complex flows

## Troubleshooting

### Common Issues

1. **Template loading errors**
   - Check template validation
   - Verify cache configuration
   - Ensure proper error handling

2. **Performance issues**
   - Monitor cache hit rates
   - Check virtual list configuration
   - Optimize re-renders

3. **Accessibility problems**
   - Verify ARIA labels
   - Test keyboard navigation
   - Check focus management

4. **Type errors**
   - Update TypeScript definitions
   - Check interface implementations
   - Verify prop types

## Contributing

When contributing to the Smart Field Builder:

1. Follow the established architecture patterns
2. Add comprehensive TypeScript types
3. Include accessibility features
4. Write tests for new functionality
5. Update documentation
6. Performance considerations for large datasets

## Migration Guide

### From Simple Field Builder

To migrate from the simple field builder:

1. Update component imports
2. Replace field configuration objects
3. Add enhancement configurations
4. Update validation rules
5. Test thoroughly

### API Changes

Key differences from the previous version:

- New enhancement system
- Updated validation structure
- Improved type definitions
- Enhanced accessibility support
- Performance optimizations