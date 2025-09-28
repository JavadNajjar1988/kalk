# Smart Field Builder - Technical API Documentation

## 📋 Table of Contents
1. [Core Components](#core-components)
2. [Custom Hooks](#custom-hooks)
3. [Utility Functions](#utility-functions)
4. [Type Definitions](#type-definitions)
5. [Performance APIs](#performance-apis)
6. [Integration Guide](#integration-guide)

## 🧩 Core Components

### SmartFieldBuilder
The main modal component for field creation and editing.

```typescript
interface SmartFieldBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: any[];
  editingField?: any;
  categoryContext?: string;
}

// Usage
<SmartFieldBuilder
  open={isModalOpen}
  onClose={handleClose}
  onSave={handleFieldSave}
  existingFields={fields}
  editingField={currentField}
  categoryContext="personal"
/>
```

### OptimizedTemplateSelector
Advanced template selector with virtual scrolling and lazy loading.

```typescript
interface OptimizedTemplateSelectorProps {
  onTemplateSelect: (config: any) => void;
  existingFields?: any[];
  categoryContext?: string;
  editingField?: any;
}
```

### LivePreview
Real-time field preview component.

```typescript
interface LivePreviewProps {
  config: any;
  onConfigUpdate?: (config: any) => void;
  className?: string;
  updateInterval?: number;
}
```

### ImportExportDialog
Field configuration import/export interface.

```typescript
interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  fields: any[];
  onImport?: (fields: any[]) => void;
  onExport?: (data: string) => void;
}
```

## 🎣 Custom Hooks

### useAdvancedMemoization
Intelligent memoization with cache management.

```typescript
// Advanced memoization with TTL
const memoizedValue = useAdvancedMemo(
  () => expensiveCalculation(deps),
  [dep1, dep2],
  { 
    cacheSize: 10, 
    ttl: 60000, // 1 minute
    deep: true 
  }
);

// Smart callback with debouncing
const debouncedCallback = useSmartCallback(
  (value) => handleChange(value),
  [dependencies],
  { debounce: 300 }
);

// State with intelligent comparison
const [state, setState] = useSmartState(
  initialValue,
  (a, b) => deepEqual(a, b) // custom equality function
);
```

### useEnhancedAnimations
Advanced animation system with accessibility support.

```typescript
// State transition with animation
const { progress, isComplete, startTransition } = useStateTransition(
  currentState,
  { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
);

// Animated value interpolation
const animatedValue = useAnimatedValue(targetValue, {
  duration: 200,
  easing: 'ease-out'
});

// Spring animation for bouncy effects
const springValue = useSpringAnimation(target, {
  tension: 170,
  friction: 26
});

// Staggered animations for lists
const { getItemStyle } = useStaggeredAnimation(items, {
  staggerDelay: 50,
  itemDuration: 300
});
```

### useDraftManagement
Auto-save and draft recovery system.

```typescript
const draftManager = useDraftManagement(
  fieldData,
  currentStep,
  mode,
  {
    autoSaveInterval: 30000, // 30 seconds
    maxDrafts: 5,
    enabled: true
  }
);

// Access draft functionality
const {
  status,           // Current save status
  lastSaved,        // Last save timestamp
  availableDrafts,  // List of saved drafts
  saveDraft,        // Manual save function
  deleteDraft,      // Delete specific draft
  clearAllDrafts,   // Clear all drafts
  getStatusInfo     // Get status display info
} = draftManager;
```

### useLivePreview
Real-time field preview with validation.

```typescript
const preview = useLivePreview(config, 300); // 300ms update interval

const {
  previewState,        // Current preview state
  updateFieldValue,    // Update field value
  getFieldValue,       // Get current field value
  getFieldError,       // Get field errors
  validateAllFields,   // Validate all fields
  resetPreview,        // Reset preview state
  getPreviewData,      // Get formatted preview data
  exportPreviewData    // Export preview for testing
} = preview;
```

### useKeyboardShortcuts
Comprehensive keyboard navigation system.

```typescript
const shortcuts = useSmartFieldShortcuts({
  onSave: handleSave,
  onClose: handleClose,
  onNext: handleNext,
  onPrevious: handlePrevious,
  onModeSwitch: handleModeSwitch,
  onHelp: showHelp
});

// Focus management
const focusManager = useFocusManagement(containerRef);
const {
  focusFirst,    // Focus first element
  focusLast,     // Focus last element
  focusNext,     // Focus next element
  focusPrevious  // Focus previous element
} = focusManager;
```

### useFieldImportExport
Field configuration import/export functionality.

```typescript
const importExport = useFieldImportExport();

const {
  isExporting,       // Export in progress
  isImporting,       // Import in progress
  exportProgress,    // Export progress (0-100)
  importProgress,    // Import progress (0-100)
  exportFields,      // Export fields function
  importFields,      // Import fields function
  downloadExport,    // Download exported data
  createBackup,      // Create backup before import
  validateFieldConfig // Validate field configuration
} = importExport;

// Export fields
const exportData = await exportFields(fields, {
  format: 'json',
  includeMetadata: true,
  includeValidation: true,
  compression: false
});

// Import fields
const importedFields = await importFields(jsonData, {
  overwriteExisting: false,
  validateOnImport: true,
  createBackup: true,
  mergeStrategy: 'append'
});
```

## 🛠️ Utility Functions

### Intelligent Cache
Multi-level caching system with TTL and dependencies.

```typescript
import { templateCache, useCache } from './utils/intelligentCache';

// Using template cache
templateCache.set('key', data, { 
  ttl: 300000, // 5 minutes
  dependencies: ['dep1', 'dep2']
});

const cachedData = templateCache.get('key');

// Cache hook
const cache = useCache('myCache');
const result = cache.getOrSet('key', () => expensiveOperation(), {
  ttl: 60000,
  dependencies: ['dep']
});
```

### Performance Optimization
Advanced performance monitoring and optimization.

```typescript
import { 
  useSmartFieldPerformance,
  useLazyPreloader,
  useSmartLoadingStrategy
} from './hooks/usePerformanceOptimization';

// Performance monitoring
const { metrics, measureLoadTime, startMonitoring } = useSmartFieldPerformance();

// Lazy preloading
const { preloadComponent, preloadMultiple } = useLazyPreloader();
await preloadComponent('ComponentName', () => import('./Component'), 'high');

// Smart loading strategy
const strategy = useSmartLoadingStrategy();
// Returns: { chunkSize, preloadNext, useVirtualization }
```

### Browser Compatibility
Cross-browser compatibility utilities.

```typescript
import { 
  getBrowserInfo,
  getModalHeight,
  getFallbackStyles
} from './utils/browserCompatibility';

const browser = getBrowserInfo();
const modalHeight = getModalHeight(browser.isMobile);
const fallbackStyles = getFallbackStyles();
```

## 📝 Type Definitions

### Core Types

```typescript
interface SmartFieldConfig {
  id: string;
  name: string;
  englishName: string;
  baseType: BaseFieldType;
  enhancements: FieldEnhancement[];
  validation: ValidationRule[];
  isRequired: boolean;
  order: number;
  placeholder?: string;
  description?: string;
}

enum BaseFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DATE = 'DATE',
  TIME = 'TIME',
  TEXTAREA = 'TEXTAREA'
}

interface FieldEnhancement {
  type: EnhancementType;
  config: any;
  enabled: boolean;
}

interface ValidationRule {
  id: string;
  type: ValidationType;
  config: any;
  message: string;
  enabled: boolean;
}
```

### Draft Management Types

```typescript
interface DraftConfig {
  id: string;
  name?: string;
  data: any;
  timestamp: number;
  step?: number;
  mode?: string;
  version: number;
  checksum: string;
}

enum DraftStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error'
}
```

### Performance Types

```typescript
interface PerformanceMetrics {
  componentLoadTime: number;
  renderTime: number;
  totalMemoryUsage: number;
  chunkLoadTimes: Record<string, number>;
}

interface LoadingStrategy {
  chunkSize: 'small' | 'medium' | 'large';
  preloadNext: boolean;
  useVirtualization: boolean;
}
```

## ⚡ Performance APIs

### Bundle Analyzer
Analyze and optimize bundle size.

```typescript
import { bundleAnalyzer } from './utils/bundleAnalyzer';

// Analyze current bundle
bundleAnalyzer.analyzeBundle('SmartFieldBuilder', [
  'react', 'react-dom', '@mui/material'
]);

// Get optimization recommendations
const recommendations = bundleAnalyzer.getOptimizationRecommendations();
```

### Virtual List
Efficient rendering for large lists.

```typescript
<VirtualList
  items={items}
  itemHeight={80}
  containerHeight={400}
  renderItem={(item, index, style) => (
    <div style={style}>{item.name}</div>
  )}
  keyExtractor={(item, index) => item.id}
  overscan={3}
/>
```

### Smart Loader
Intelligent component loading with priorities.

```typescript
import { componentLoader } from './components/optimization/SmartLoader';

// Register component
componentLoader.register(
  'ComponentName',
  () => import('./Component'),
  { 
    priority: 'high', 
    preload: true, 
    cacheKey: 'component_cache' 
  }
);

// Load component
const Component = await componentLoader.load('ComponentName');
```

## 🔧 Integration Guide

### Basic Integration

```typescript
import { SmartFieldBuilder } from './smart-field-builder/SmartFieldBuilder';

function MyFormBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState([]);

  const handleFieldSave = (config) => {
    setFields(prev => [...prev, config]);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Create Field
      </Button>
      
      <SmartFieldBuilder
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleFieldSave}
        existingFields={fields}
      />
    </>
  );
}
```

### Advanced Integration with State Management

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { SmartFieldBuilder } from './smart-field-builder/SmartFieldBuilder';

function AdvancedFormBuilder() {
  const dispatch = useDispatch();
  const { fields, isModalOpen, editingField } = useSelector(state => state.fields);

  const handleFieldSave = (config) => {
    if (editingField) {
      dispatch(updateField({ id: editingField.id, config }));
    } else {
      dispatch(addField(config));
    }
    dispatch(closeModal());
  };

  return (
    <SmartFieldBuilder
      open={isModalOpen}
      onClose={() => dispatch(closeModal())}
      onSave={handleFieldSave}
      existingFields={fields}
      editingField={editingField}
    />
  );
}
```

### Custom Hook Integration

```typescript
function useSmartFieldBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState([]);
  
  // Draft management
  const draftManager = useDraftManagement(
    fields[fields.length - 1], // Current field
    0, // Current step
    'guided', // Mode
    { autoSaveInterval: 30000 }
  );

  // Performance monitoring
  const { metrics } = useSmartFieldPerformance();

  const openBuilder = () => setIsOpen(true);
  const closeBuilder = () => setIsOpen(false);
  
  const saveField = (config) => {
    setFields(prev => [...prev, config]);
    closeBuilder();
  };

  return {
    isOpen,
    fields,
    openBuilder,
    closeBuilder,
    saveField,
    draftManager,
    metrics
  };
}
```

## 🎯 Best Practices

### Performance Optimization
1. **Use virtual scrolling** for lists with >50 items
2. **Enable caching** for frequently accessed data
3. **Implement lazy loading** for non-critical components
4. **Monitor performance** in development mode
5. **Use memoization** for expensive calculations

### Accessibility
1. **Provide ARIA labels** for all interactive elements
2. **Implement keyboard navigation** for all functionality
3. **Respect motion preferences** in animations
4. **Test with screen readers** regularly
5. **Maintain focus management** in modal dialogs

### Error Handling
1. **Implement error boundaries** around critical components
2. **Provide meaningful error messages** to users
3. **Log errors** for debugging and monitoring
4. **Implement fallback UI** for failed operations
5. **Test error scenarios** thoroughly

### Development Workflow
1. **Use TypeScript** for type safety
2. **Implement unit tests** for all hooks and utilities
3. **Monitor bundle size** and performance metrics
4. **Use ESLint and Prettier** for code consistency
5. **Document all public APIs** thoroughly

---

This documentation provides comprehensive coverage of all APIs and integration patterns for the Smart Field Builder system. For additional examples and advanced usage patterns, refer to the implementation files and test suites.