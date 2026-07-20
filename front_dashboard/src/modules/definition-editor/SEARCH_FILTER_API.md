# Advanced Search and Filter API Documentation

## Overview

سیستم جستجو و فیلتر پیشرفته برای جستجو در گره‌های دسته‌بندی‌های مختلف با قابلیت‌های فیلتر چندگانه و ذخیره‌سازی فیلترها.

## Core Components

### 1. NodeSearchComponent

مؤلفه اصلی برای جستجو در گره‌های دسته‌بندی‌ها.

```typescript
import NodeSearchComponent from '@/modules/definition-editor/components/search/NodeSearchComponent';
import { CategoryType, NodeSearchResult } from '@/modules/definition-editor/types';

// Basic usage
<NodeSearchComponent
  categoryTypes={[CategoryType.GEOGRAPHICAL, CategoryType.MILITARY_RANKS]}
  onSelectionChange={(nodes) => console.log('Selected:', nodes)}
/>

// Advanced usage
<NodeSearchComponent
  categoryTypes={[CategoryType.EQUIPMENT]}
  placeholder="جستجو در تجهیزات..."
  maxResults={25}
  minSearchLength={3}
  searchDelay={400}
  multiSelect={true}
  enableFilters={true}
  enableAdvancedFilters={true}
  showPath={true}
  showCoordinates={true}
  showLevel={true}
  groupByCategory={true}
  enableFavorites={true}
  enableRecent={true}
  onNodeClick={(node) => console.log('Clicked:', node)}
  onSearchStart={() => console.log('Search started')}
  onSearchComplete={(results) => console.log('Results:', results)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `categoryTypes` | `CategoryType[]` | `[CategoryType.GEOGRAPHICAL]` | انواع دسته‌بندی‌هایی که باید جستجو شوند |
| `placeholder` | `string` | `'جستجو در گره‌ها...'` | متن placeholder برای فیلد جستجو |
| `maxResults` | `number` | `50` | حداکثر تعداد نتایج جستجو |
| `minSearchLength` | `number` | `2` | حداقل طول متن برای شروع جستجو |
| `searchDelay` | `number` | `300` | تأخیر debounce برای جستجو (میلی‌ثانیه) |
| `multiSelect` | `boolean` | `false` | امکان انتخاب چندین گره |
| `enableFilters` | `boolean` | `true` | فعال‌سازی فیلترهای پایه |
| `enableAdvancedFilters` | `boolean` | `false` | فعال‌سازی فیلترهای پیشرفته |
| `showPath` | `boolean` | `true` | نمایش مسیر سلسله‌مراتبی |
| `showCoordinates` | `boolean` | `true` | نمایش مختصات جغرافیایی |
| `showLevel` | `boolean` | `true` | نمایش سطح گره |
| `groupByCategory` | `boolean` | `true` | گروه‌بندی نتایج بر اساس دسته‌بندی |
| `enableFavorites` | `boolean` | `false` | امکان ذخیره‌سازی مورد علاقه |
| `enableRecent` | `boolean` | `false` | نمایش موارد اخیراً انتخاب شده |

#### Events

- `onSelectionChange(nodes: NodeSearchResult[])`: هنگام تغییر انتخاب گره‌ها
- `onNodeClick(node: NodeSearchResult)`: هنگام کلیک روی یک گره
- `onSearchStart()`: هنگام شروع جستجو
- `onSearchComplete(results: NodeSearchResult[])`: هنگام اتمام جستجو

### 2. AdvancedFilterManager

مؤلفه مدیریت فیلترهای پیشرفته با قابلیت ایجاد، ویرایش و ذخیره‌سازی فیلترها.

```typescript
import AdvancedFilterManager from '@/modules/definition-editor/components/filters/AdvancedFilterManager';
import { AdvancedFilterConfig, FilterFieldDefinition } from '@/modules/definition-editor/types/fieldConstructor';

const filterFields: FilterFieldDefinition[] = [
  {
    id: 'name',
    name: 'نام',
    type: 'text',
    operators: ['=', '!=', 'contains', 'starts_with']
  },
  {
    id: 'level',
    name: 'سطح',
    type: 'number',
    operators: ['=', '>', '<', 'between'],
    validation: { min: 1, max: 10 }
  }
];

<AdvancedFilterManager
  availableFields={filterFields}
  onFilterChange={(config) => console.log('Filter changed:', config)}
  onApplyFilter={(config) => console.log('Apply filter:', config)}
  onSaveFilter={(filter) => console.log('Save filter:', filter)}
/>
```

### 3. useAdvancedFilter Hook

Hook برای مدیریت منطق فیلترهای پیشرفته.

```typescript
import { useAdvancedFilter } from '@/modules/definition-editor/hooks/useAdvancedFilter';

const {
  filterConfig,
  savedFilters,
  updateConfig,
  applyFilters,
  saveFilter,
  loadFilter,
  deleteFilter,
  hasActiveFilters
} = useAdvancedFilter({
  availableFields: filterFieldDefinitions,
  storageKey: 'my_custom_filters'
});

// Apply filters to search results
const filteredResults = applyFilters(searchResults, filterConfig);
```

## Type Definitions

### NodeSearchResult

```typescript
interface NodeSearchResult {
  id: string;
  name: string;
  description?: string;
  level?: number;
  parentId?: string;
  categoryType: string;
  path?: string[];               // مسیر سلسله‌مراتبی
  coordinates?: { lat: number; lng: number };
  metadata?: Record<string, any>;
  score?: number;               // امتیاز ارتباط جستجو
}
```

### AdvancedFilterConfig

```typescript
interface AdvancedFilterConfig {
  groups: FilterGroup[];
  globalLogicalOperator: 'AND' | 'OR';
  savedFilters: SavedFilter[];
}

interface FilterGroup {
  id: string;
  name: string;
  criteria: FilterCriteria[];
  logicalOperator: 'AND' | 'OR';
  isActive: boolean;
}

interface FilterCriteria {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}
```

### FilterOperator

```typescript
type FilterOperator = 
  | '=' | '!=' | '>' | '<' | '>=' | '<=' 
  | 'in' | 'not_in' | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with' | 'between' 
  | 'exists' | 'not_exists';
```

## Category Types

سیستم از انواع دسته‌بندی‌های زیر پشتیبانی می‌کند:

- `GEOGRAPHICAL`: داده‌های جغرافیایی
- `MILITARY_RANKS`: درجات نظامی  
- `EQUIPMENT`: تجهیزات نظامی
- `PERSONS`: اطلاعات اشخاص
- `MISSION_TYPE`: انواع مأموریت
- `MILITARY_UNITS`: واحدهای نظامی
- `OPERATIONAL_STATUS`: وضعیت عملیاتی
- `THREAT_TYPE`: انواع تهدید
- `LOGISTICS`: اطلاعات لجستیک
- `AMMUNITION`: مهمات
- `WEATHER`: آب و هوا

## Usage Examples

### Basic Search

```typescript
// جستجوی ساده در داده‌های جغرافیایی
<NodeSearchComponent
  categoryTypes={[CategoryType.GEOGRAPHICAL]}
  onSelectionChange={(nodes) => {
    console.log('Selected locations:', nodes);
  }}
/>
```

### Multi-Category Search

```typescript
// جستجو در چندین دسته‌بندی
<NodeSearchComponent
  categoryTypes={[
    CategoryType.MILITARY_RANKS,
    CategoryType.PERSONS,
    CategoryType.EQUIPMENT
  ]}
  multiSelect={true}
  groupByCategory={true}
  enableFilters={true}
  onSelectionChange={(nodes) => {
    const ranks = nodes.filter(n => n.categoryType === 'military_ranks');
    const persons = nodes.filter(n => n.categoryType === 'persons');
    const equipment = nodes.filter(n => n.categoryType === 'equipment');
    
    console.log('Selected ranks:', ranks);
    console.log('Selected persons:', persons);
    console.log('Selected equipment:', equipment);
  }}
/>
```

### Advanced Filtering

```typescript
// استفاده از فیلترهای پیشرفته
const advancedFilterConfig: AdvancedFilterConfig = {
  groups: [
    {
      id: 'group1',
      name: 'High-level locations',
      criteria: [
        {
          id: 'criteria1',
          field: 'level',
          operator: '<=',
          value: 3,
          logicalOperator: 'AND'
        },
        {
          id: 'criteria2',
          field: 'hasCoordinates',
          operator: '=',
          value: true
        }
      ],
      logicalOperator: 'AND',
      isActive: true
    }
  ],
  globalLogicalOperator: 'AND',
  savedFilters: []
};

<NodeSearchComponent
  categoryTypes={[CategoryType.GEOGRAPHICAL]}
  enableAdvancedFilters={true}
  advancedFilterConfig={advancedFilterConfig}
  onAdvancedFilterChange={(config) => {
    console.log('Filter config updated:', config);
  }}
/>
```

## Performance Considerations

### Search Optimization

- جستجو با **debouncing** انجام می‌شود تا از درخواست‌های مکرر جلوگیری شود
- نتایج بر اساس **امتیاز ارتباط** مرتب می‌شوند
- **حداکثر تعداد نتایج** قابل تنظیم است
- داده‌ها در **localStorage** cache می‌شوند

### Memory Management

- فیلترهای ذخیره شده در localStorage نگهداری می‌شوند
- موارد اخیراً انتخاب شده محدود به 10 مورد هستند
- داده‌های دسته‌بندی در memory cache می‌شوند

### Best Practices

1. **تنظیم maxResults**: برای داده‌های حجیم، maxResults را کاهش دهید
2. **استفاده از minSearchLength**: برای جلوگیری از جستجوهای بی‌معنی
3. **تنظیم searchDelay**: بر اساس تجربه کاربری و حجم داده
4. **استفاده مناسب از فیلترها**: فیلترهای پیشرفته را فقط در صورت نیاز فعال کنید

## Error Handling

سیستم خطاهای زیر را مدیریت می‌کند:

- **خطای بارگذاری داده**: نمایش پیام خطای مناسب
- **خطای شبکه**: retry mechanism برای درخواست‌های ناموفق
- **خطای validation**: بررسی صحت ورودی‌های کاربر
- **خطای localStorage**: fallback به حافظه موقت

## Integration with Field Constructor

```typescript
// استفاده در Field Constructor System
const dataSourceConfig: DataSourceComponent = {
  type: 'category',
  configuration: {
    categoryType: 'military_ranks',
    searchable: true,
    filterable: true,
    filterBy: ['level', 'specialty'],
    maxLevel: 5
  }
};

// استفاده در FieldConstructorBuilder
<FieldConstructorBuilder
  onFieldBuilt={(field) => {
    if (field.fieldConfig.dataSource?.configuration.searchable) {
      // فیلد با قابلیت جستجو ایجاد شده
      console.log('Searchable field created:', field);
    }
  }}
/>
```

## Testing

برای تست عملکرد از کامپوننت‌های زیر استفاده کنید:

### SearchPerformanceTest

```typescript
import SearchPerformanceTest from '@/modules/definition-editor/components/test/SearchPerformanceTest';

// تست خودکار عملکرد
<SearchPerformanceTest />
```

### MultiCategorySearchTest

```typescript
import MultiCategorySearchTest from '@/modules/definition-editor/components/test/MultiCategorySearchTest';

// تست جستجو در چندین دسته‌بندی
<MultiCategorySearchTest />
```

## API Reference

### Search Functions

```typescript
// جستجو در یک دسته‌بندی خاص
const searchInCategory = async (
  categoryType: CategoryType,
  searchTerm: string,
  filters?: AdvancedFilterConfig
): Promise<NodeSearchResult[]> => {
  // Implementation in NodeSearchComponent
};

// اعمال فیلترهای پیشرفته
const applyAdvancedFilters = (
  results: NodeSearchResult[],
  config: AdvancedFilterConfig
): NodeSearchResult[] => {
  // Implementation in useAdvancedFilter hook
};
```

### Filter Management

```typescript
// ذخیره فیلتر
const saveFilter = (filter: SavedFilter): void => {
  localStorage.setItem('saved_filters', JSON.stringify(filter));
};

// بارگذاری فیلتر
const loadFilter = (filterId: string): SavedFilter | null => {
  const saved = localStorage.getItem('saved_filters');
  return saved ? JSON.parse(saved) : null;
};
```

## Supported Categories

| Category | File | Description |
|----------|------|-------------|
| `GEOGRAPHICAL` | `geographical.json` | اماکن و مناطق جغرافیایی |
| `MILITARY_RANKS` | `military_ranks.json` | درجات و رتبه‌های نظامی |
| `EQUIPMENT` | `equipment.json` | تجهیزات و ادوات نظامی |
| `PERSONS` | `persons.json` | اطلاعات پرسنل |
| `MISSION_TYPE` | `mission_type.json` | انواع مأموریت‌ها |
| `MILITARY_UNITS` | `military_units.json` | ساختار واحدهای نظامی |
| `OPERATIONAL_STATUS` | `operational_status.json` | وضعیت‌های عملیاتی |
| `THREAT_TYPE` | `threat_type.json` | انواع تهدیدات |
| `LOGISTICS` | `logistics.json` | اطلاعات لجستیک |
| `AMMUNITION` | `ammunition.json` | انواع مهمات |
| `WEATHER` | `weather.json` | شرایط آب و هوایی |

## Migration Guide

### From Simple Reference Fields

```typescript
// قبل: فیلد مرجع ساده
{
  type: 'reference',
  referenceCategory: 'military_ranks',
  referenceSections: 'data'
}

// بعد: فیلد مرجع با جستجو و فیلتر
{
  baseType: 'reference',
  dataSource: {
    type: 'category',
    configuration: {
      categoryType: 'military_ranks',
      searchable: true,
      filterable: true,
      filterBy: ['level', 'specialty']
    }
  },
  inputEnhancement: {
    type: 'autocomplete',
    configuration: {
      minSearchLength: 2,
      maxSuggestions: 10
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **No search results**: 
   - بررسی کنید که فایل JSON دسته‌بندی موجود باشد
   - مطمئن شوید که categoryType صحیح است

2. **Slow search performance**:
   - maxResults را کاهش دهید
   - searchDelay را افزایش دهید
   - فیلترهای غیرضروری را غیرفعال کنید

3. **Filter not working**:
   - بررسی کنید که filterConfig صحیح باشد
   - مطمئن شوید که فیلتر active است

4. **Memory issues**:
   - تعداد categoryTypes را محدود کنید
   - از enableRecent و enableFavorites در داده‌های حجیم استفاده نکنید

### Debug Mode

برای debug کردن، console logs را فعال کنید:

```typescript
<NodeSearchComponent
  onSearchStart={() => console.log('Search started')}
  onSearchComplete={(results) => console.log('Search results:', results)}
  categoryTypes={[CategoryType.GEOGRAPHICAL]}
/>
```

## Examples Repository

نمونه‌های کامل در مسیر زیر موجود است:

- `src/modules/definition-editor/components/test/MultiCategorySearchTest.tsx`
- `src/modules/definition-editor/components/test/SearchPerformanceTest.tsx`
- `src/modules/definition-editor/components/test/FieldConstructorSystemTest.tsx`