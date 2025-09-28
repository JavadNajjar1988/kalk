# Definition Editor Module

ماژول ویرایشگر تعاریف - JSON-first، ماژولار و بدون وابستگی به backend، قابل گسترش با Strategy Pattern.

## 🏗️ ساختار ماژول

```
definition-editor/
├── api/                    # لایه API
├── components/             # کامپوننت‌های UI
│   ├── common/            # کامپوننت‌های مشترک
│   ├── forms/             # فرم‌ها
│   └── nodes/             # کامپوننت‌های گره
├── data/                  # لایه داده
│   └── json/              # فایل‌های JSON نمونه
├── pages/                 # صفحات
│   └── sections/          # بخش‌های مختلف صفحه
├── routes/                # مسیرها
├── strategies/            # الگوهای استراتژی
│   ├── baseStrategy.ts    # کلاس پایه استراتژی
│   ├── strategyRegistry.ts # رجیستری استراتژی‌ها
│   └── *.tsx             # استراتژی‌های مخصوص هر دسته
├── store/                 # مدیریت state
├── types/                 # تعاریف TypeScript
├── utils/                 # توابع کمکی
└── index.ts               # Export اصلی
```

## 🚀 ویژگی‌ها

### ✅ ماژولار بودن
- ساختار کاملاً ماژولار
- جداسازی مسئولیت‌ها
- قابلیت استفاده مجدد

### ✅ Strategy Pattern
- الگوی استراتژی برای دسته‌بندی‌های مختلف
- قابلیت گسترش آسان
- منطق مخصوص هر دسته‌بندی
- رجیستری مرکزی برای مدیریت استراتژی‌ها

### ✅ JSON-First Data
- داده‌های نمونه در JSON
- آماده برای اتصال API
- قابلیت cache کردن

### ✅ UI/UX کامل
- نمایش درختی و گرافی
- فیلترهای پیشرفته
- جستجوی هوشمند
- Responsive Design

## 📋 دسته‌بندی‌های پشتیبانی شده

1. **جغرافیایی** (Geographical) - 🌍
2. **درجات نظامی** (Military Ranks) - ⭐
3. **تعاریف زمانی** (Time Definitions) - ⏰
4. **تجهیزات** (Equipment) - 🚗
5. **تدارکات** (Logistics) - 📦

## 🔧 نحوه استفاده

### 1. دسترسی به ماژول
```
http://localhost:3000/dashboard/definition-editor
```

### 2. Import کردن
```typescript
import { DefinitionEditorPage } from '@/modules/definition-editor';
```

### 3. استفاده از Store
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { definitionEditorActions } from '@/modules/definition-editor';

const { nodes, currentCategory } = useSelector((state) => state.definitionEditor);
```

### 4. استفاده از استراتژی‌ها
```typescript
import { getStrategy } from '@/modules/definition-editor/strategies';
import { CategoryType } from '@/modules/definition-editor/types';

const strategy = getStrategy(CategoryType.GEOGRAPHICAL);
const graphConfig = strategy.getGraphConfig();
const filteredNodes = nodes.filter(node => strategy.filterNode(node, filters));
```

## 🎯 مزایا

- **کد تمیز و قابل نگهداری**
- **عملکرد بهینه**
- **قابلیت گسترش آسان**
- **آماده برای API**
- **UI/UX مدرن**

## 🔄 مراحل توسعه

1. ✅ ایجاد ساختار پوشه‌ها
2. ✅ تعریف Types و Interfaces
3. ✅ پیاده‌سازی Strategy Pattern
4. ✅ ایجاد لایه داده
5. ✅ پیاده‌سازی Store
6. ✅ ایجاد Utilities
7. ✅ پیاده‌سازی Components
8. ✅ ایجاد Pages و Sections
9. ✅ پیاده‌سازی Routes
10. ✅ ایجاد رجیستری استراتژی‌ها
11. ⏳ Testing
12. ⏳ Documentation

## 📝 نکات مهم

- تمام داده‌ها در JSON ذخیره می‌شوند
- قابلیت اتصال به API در آینده
- پشتیبانی از Dark Mode
- Responsive برای تمام دستگاه‌ها
- Accessibility کامل

## جریان داده (Mermaid)

```
JSON (data/json/*.json)
  -> Loader (dynamic import + cache + validation)
  -> Redux Slice (nodes/levels/filters/view)
  -> Selectors (memoized)
  -> Strategy Registry (category-specific logic)
  -> UI Sections (Toolbar/Search/Tree/Graph)
```

## ابزارهای توسعه
- `npm run validate:definition-editor`: اعتبارسنجی ساختار JSON
- `npm run typecheck:definition-editor`: تایپ‌چک ایزوله ماژول

## افزودن دسته‌بندی جدید (راهنما)

### 1. تعریف نوع دسته‌بندی
```typescript
// در types/index.ts
export enum CategoryType {
  // ... existing types
  NEW_CATEGORY = 'new_category'
}
```

### 2. ایجاد استراتژی
```typescript
// strategies/newCategoryStrategy.tsx
import { BaseStrategy } from './baseStrategy';
import { CategoryType } from '../types';

export class NewCategoryStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.NEW_CATEGORY);
  }

  getGraphConfig(): GraphConfig {
    const base = super.getGraphConfig();
    return { ...base, nodeColor: '#FF6B6B' };
  }

  filterNode(node: DefinitionNode, filters: SearchFilters): boolean {
    if (!super.filterNode(node, filters)) return false;
    // منطق فیلتر مخصوص
    return true;
  }

  getNodeData(categoryId: string): DefinitionNode[] {
    return loadNewCategoryData(categoryId);
  }

  getNodeRenderer() {
    return (node: DefinitionNode) => <NewCategoryNodeRenderer node={node} />;
  }
}
```

### 3. ثبت در رجیستری
```typescript
// در strategyRegistry.ts
import { NewCategoryStrategy } from './newCategoryStrategy';

strategyRegistry.set(CategoryType.NEW_CATEGORY, new NewCategoryStrategy());
```

### 4. اضافه کردن داده JSON
```json
// data/json/new_category.json
{
  "nodes": [...],
  "levels": [...]
}
```

### 5. اضافه کردن به لودر
```typescript
// در data/loader.ts
export async function loadNewCategoryData(categoryId: string): Promise<DefinitionNode[]> {
  // implementation
}

// در loadCategoryNodes
case CategoryType.NEW_CATEGORY:
  return loadNewCategoryData(categoryId);
```

### 6. اضافه کردن به UI
```typescript
// در DefinitionEditorPage.tsx
const DEFINITION_CATEGORIES = [
  // ... existing categories
  {
    id: 'new_category',
    name: 'دسته جدید',
    type: CategoryType.NEW_CATEGORY,
    // ... other properties
  }
];
```

## مثال‌های عملی

### استفاده از فیلترهای مخصوص دسته
```typescript
const strategy = getStrategy(currentCategory.type);
const defaultFilters = strategy.getDefaultFilters();
// فیلترهای پیش‌فرض مخصوص این دسته
```

### اعمال منطق مخصوص در گراف
```typescript
const graphConfig = strategy.getGraphConfig();
// تنظیمات گراف مخصوص این دسته (رنگ، شکل، چیدمان)
```

### رندر مخصوص نودها
```typescript
const NodeRenderer = strategy.getNodeRenderer();
// رندر مخصوص نودهای این دسته
```
