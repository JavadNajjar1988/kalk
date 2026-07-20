# کامپوننت‌های مدیریت فیلدها

این بخش شامل کامپوننت‌های مربوط به مدیریت فیلدهای تجهیزات و سامانه‌ها است که از ماژول تعاریف پایه انتقال یافته‌اند.

## کامپوننت‌های اصلی

### EquipmentFieldsModule
کامپوننت اصلی مدیریت فیلدهای تجهیزات که شامل 4 تب است:
- **انتخاب مسیر**: مدیریت ساختار درختی تجهیزات
- **مدیریت فیلدها**: تعریف و ویرایش فیلدهای سفارشی
- **پیش‌نمایش فرم**: نمایش فرم ایجاد شده بر اساس فیلدها
- **خروجی/ورودی**: export و import ساختار درخت

### FieldManager
کامپوننت مدیریت فیلدهای سفارشی که امکان:
- افزودن فیلد جدید
- ویرایش فیلد موجود
- حذف فیلد
- تغییر ترتیب فیلدها
- تعریف انواع مختلف فیلد (متن، عدد، تاریخ، انتخاب، فایل)

### FieldPreview
کامپوننت پیش‌نمایش فرم که:
- نمایش فرم واقعی بر اساس فیلدهای تعریف شده
- اعتبارسنجی فیلدها
- پشتیبانی از انواع مختلف فیلد
- حالت read-only

### TreePathPicker
کامپوننت انتخاب مسیر درختی که:
- نمایش ساختار درختی
- جستجو در گره‌ها
- افزودن/ویرایش/حذف گره‌ها
- ناوبری در سطوح مختلف

### EquipmentTreeExportImport
کامپوننت خروجی و ورودی که:
- export به Excel و JSON
- import از Excel و JSON
- اعتبارسنجی داده‌های ورودی
- تبدیل فرمت‌های مختلف

## انواع داده

### CustomField
```typescript
interface CustomField {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file';
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
  };
}
```

### TreeNode
```typescript
interface TreeNode {
  id: string;
  name: string;
  englishName: string;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
  children?: TreeNode[];
  customFields?: CustomField[];
}
```

## Redux Store

### equipmentFieldsSlice
مدیریت state فیلدهای تجهیزات شامل:
- `customFieldDefinitions`: فیلدهای سفارشی هر گره
- `nodeFieldSetVersion`: نسخه فیلدهای هر گره

### Actions
- `addCustomFieldDefinition`: افزودن فیلد جدید
- `updateCustomFieldDefinition`: ویرایش فیلد موجود
- `deleteCustomFieldDefinition`: حذف فیلد
- `setCustomFieldDefinitions`: تنظیم فیلدهای گره
- `clearCustomFieldDefinitions`: پاک کردن فیلدهای گره

### Selectors
- `selectCustomFieldsByNodeId`: دریافت فیلدهای گره
- `selectNodeFieldSetVersion`: دریافت نسخه فیلدهای گره

## نحوه استفاده

### در کامپوننت اصلی
```typescript
import { EquipmentFieldsModule } from '../components';

const MyComponent = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  
  return (
    <EquipmentFieldsModule
      category={{
        id: 'equipment',
        name: 'تجهیزات و سامانه‌ها',
        englishName: 'Equipment & Systems',
        maxLevels: 7,
        isActive: true,
        order: 4
      }}
      treeData={treeData}
      onTreeDataChange={setTreeData}
    />
  );
};
```

### در FieldsManagerBase
```typescript
import { FieldsManagerBase } from '../components';

const CategoryPage = () => {
  return (
    <FieldsManagerBase categoryType={CategoryType.EQUIPMENT} />
  );
};
```

## ویژگی‌های کلیدی

✅ **مدیریت کامل درخت**: افزودن، ویرایش، حذف گره‌ها
✅ **انواع فیلد متنوع**: متن، عدد، تاریخ، انتخاب، فایل
✅ **اعتبارسنجی پیشرفته**: قوانین سفارشی برای هر فیلد
✅ **پیش‌نمایش فرم**: نمایش واقعی فرم ایجاد شده
✅ **خروجی/ورودی**: Excel و JSON
✅ **جستجو و فیلتر**: جستجو در ساختار درخت
✅ **UI فارسی**: کاملاً راست‌چین و فارسی
✅ **Material-UI**: طراحی مدرن و زیبا
✅ **Responsive**: سازگار با موبایل و تبلت

## وابستگی‌ها

- `@mui/material`: کامپوننت‌های UI
- `@mui/icons-material`: آیکون‌ها
- `@mui/x-date-pickers`: کامپوننت تاریخ
- `date-fns`: مدیریت تاریخ
- `xlsx`: پردازش فایل Excel
- `file-saver`: ذخیره فایل
- `@reduxjs/toolkit`: مدیریت state
- `react-redux`: اتصال به Redux

## نکات مهم

1. **Redux Store**: باید `equipmentFieldsSlice` به store اصلی اضافه شود
2. **فونت فارسی**: نیاز به فونت فارسی برای نمایش صحیح
3. **Theme**: تنظیم direction به rtl برای فارسی
4. **Localization**: تنظیم locale فارسی برای تاریخ
5. **API Integration**: اتصال به API برای ذخیره/بارگذاری داده‌ها
