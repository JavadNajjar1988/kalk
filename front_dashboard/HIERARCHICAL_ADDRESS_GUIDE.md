# راهنمای فیلد آدرس سلسله‌مراتبی (Hierarchical Address Field)

## بررسی اجمالی

کامپوننت `HierarchicalAddressField` برای مدیریت آرایه‌ای از آدرس‌های سلسله‌مراتبی طراحی شده است. این کامپوننت امکان انتخاب موقعیت جغرافیایی از درخت سلسله‌مراتبی و وارد کردن آدرس دقیق را فراهم می‌کند.

## ویژگی‌های کلیدی

### 1. انتخاب سلسله‌مراتبی موقعیت
- انتخاب استان، شهر و منطقه به صورت متوالی
- غیرفعال شدن خودکار گزینه‌های وابسته
- ریست خودکار سطوح بعدی هنگام تغییر سطوح قبلی

### 2. مدیریت چندین آدرس
- امکان افزودن تا حداکثر تعداد مشخص شده آدرس
- برچسب‌گذاری آدرس‌ها (منزل، محل کار، محل تولد، موقت، سایر)
- انتخاب یک آدرس به عنوان آدرس اصلی
- حذف آدرس‌های غیرضروری

### 3. فیلدهای تکمیلی
- آدرس دقیق (اختیاری)
- کد پستی (با اعتبارسنجی)
- نوع آدرس با آیکون‌های مناسب

## نحوه استفاده

### مثال پایه

```tsx
import HierarchicalAddressComponent from './HierarchicalAddressField';

const MyForm = () => {
  const [addresses, setAddresses] = useState<HierarchicalAddress[]>([]);

  return (
    <HierarchicalAddressComponent
      value={addresses}
      onChange={setAddresses}
      label="آدرس‌های شخص"
      required={true}
      minItems={1}
      maxItems={3}
      rootCategory="geographical"
      levels={['استان', 'شهر', 'منطقه']}
      allowFreeText={true}
    />
  );
};
```

### Properties

| Property | Type | پیش‌فرض | توضیح |
|----------|------|---------|-------|
| `value` | `HierarchicalAddress[]` | `[]` | آرایه آدرس‌ها |
| `onChange` | `(addresses: HierarchicalAddress[]) => void` | - | تابع تغییر |
| `label` | `string` | - | برچسب فیلد |
| `required` | `boolean` | `false` | الزامی بودن |
| `error` | `string` | - | پیام خطا |
| `minItems` | `number` | `0` | حداقل تعداد |
| `maxItems` | `number` | `3` | حداکثر تعداد |
| `rootCategory` | `string` | `'geographical'` | دسته‌بندی مرجع |
| `levels` | `string[]` | `['استان', 'شهر', 'منطقه']` | سطوح درخت |
| `allowFreeText` | `boolean` | `true` | اجازه متن آزاد |

### Interface HierarchicalAddress

```typescript
interface HierarchicalAddress {
  id: string;
  label: string; // 'home' | 'work' | 'birth' | 'temporary' | 'other'
  selectedPath: {
    level1?: string; // استان
    level2?: string; // شهر
    level3?: string; // منطقه
  };
  detailedAddress?: string; // آدرس دقیق
  postalCode?: string; // کد پستی
  coordinates?: {
    lat: number;
    lng: number;
  };
  isPrimary?: boolean; // آدرس اصلی
  verified?: boolean; // تایید شده
}
```

## استفاده در FieldManager و FieldPreview

### در FieldManager

فیلد جدید با نوع `address-array` یا `hierarchical-address` ایجاد کنید:

```json
{
  "id": "user-addresses",
  "name": "آدرس‌ها",
  "englishName": "Addresses",
  "type": "address-array",
  "isRequired": false,
  "order": 10,
  "minItems": 0,
  "maxItems": 3,
  "hierarchicalCategory": "geographical",
  "allowFreeText": true
}
```

### در FieldPreview

کامپوننت به طور خودکار در پیش‌نمایش فرم نمایش داده می‌شود و کاربر می‌تواند:

1. آدرس جدید اضافه کند
2. استان، شهر و منطقه را انتخاب کند  
3. آدرس دقیق و کد پستی وارد کند
4. نوع آدرس را مشخص کند
5. آدرس اصلی را انتخاب کند
6. آدرس‌های غیرضروری را حذف کند

## داده‌های جغرافیایی

### انتقال از داده‌های Mock به سیستم واقعی

✅ **تحقق یافته**: کامپوننت حالا به طور کامل با سیستم جغرافیایی واقعی Definition Editor ادغام شده است.

#### ویژگی‌های جدید:
- **بارگذاری خودکار**: داده‌های جغرافیایی به صورت خودکار از فایل `geographical.json` بارگذاری می‌شوند
- **درخت ۹ سطحی**: پشتیبانی از ساختار کامل ۹ سطحی (قاره تا مختصات دقیق)
- **انتخاب پویا**: گزینه‌های هر سطح بر اساس انتخاب سطوح قبلی فیلتر می‌شوند
- **نمایش مسیر**: نمایش مسیر انتخاب شده به صورت تصویری
- **مختصات جغرافیایی**: نمایش نودهای دارای مختصات با نماد 📍

#### ساختار داده‌های واقعی:
سیستم از فایل `geographical.json` استفاده می‌کند که شامل:
- **۹ سطح سازمانی**: از قاره تا مختصات دقیق
- **روابط والد-فرزند**: ساختار درختی کامل
- **مختصات جغرافیایی**: نودهای مهم دارای lat/lng
- **متاداده کامل**: توضیحات و اطلاعات تکمیلی

### سطوح جغرافیایی قابل انتخاب:

1. **قاره** (Continent) - سطح ۱
2. **کشور** (Country) - سطح ۲
3. **استان/ایالت** (Province/State) - سطح ۳
4. **شهرستان/منطقه** (County/District) - سطح ۴
5. **بخش/ناحیه** (Sector/Sub-district) - سطح ۵
6. **دهستان/زون عملیاتی** (Rural District/Operational Zone) - سطح ۶
7. **روستا/شهر/پایگاه** (Village/Town/Base) - سطح ۷

**نکته**: انتخاب تا سطح ۷ (شهر) امکان‌پذیر است و سپس آدرس دقیق به صورت دستی وارد می‌شود.

### نحوه کارکرد:
```typescript
// بارگذاری خودکار داده‌ها
const [nodes, levels] = await Promise.all([
  loadGeographicalData('geographical'),
  loadCategoryLevels(CategoryType.GEOGRAPHICAL)
]);

// ایجاد درخت سلسله‌مراتبی
const treeNodes = buildHierarchicalTree(nodes);
```

### مزایای سیستم جدید:
- **یکپارچگی**: ادغام کامل با سیستم Definition Editor
- **مقیاس‌پذیری**: پشتیبانی از هزاران نود جغرافیایی
- **انعطاف‌پذیری**: قابلیت افزودن سطوح و نودهای جدید
- **کارایی**: کش کردن داده‌ها و بهینه‌سازی جستجو

## اعتبارسنجی

### اعتبارسنجی‌های موجود

- **حداقل/حداکثر تعداد آدرس**: کنترل تعداد آدرس‌های قابل افزودن
- **فیلدهای الزامی**: بررسی پر بودن فیلدهای ضروری
- **کد پستی**: اعتبارسنجی فرمت عددی 10 رقمی
- **آدرس اصلی**: اطمینان از انتخاب حداقل یک آدرس اصلی

### افزودن اعتبارسنجی سفارشی

```typescript
const handleValidateAddress = (address: HierarchicalAddress): string | null => {
  if (!address.selectedPath.level1) {
    return 'انتخاب استان الزامی است';
  }
  
  if (address.postalCode && !/^\d{10}$/.test(address.postalCode)) {
    return 'کد پستی باید 10 رقم باشد';
  }
  
  return null;
};
```

## سفارشی‌سازی

### سفارشی‌سازی برچسب‌ها

برچسب‌های آدرس در `ADDRESS_LABELS` تعریف شده‌اند:

```typescript
export const ADDRESS_LABELS = [
  { value: 'home', label: 'منزل', icon: '🏠' },
  { value: 'work', label: 'محل کار', icon: '🏢' },
  // ... سایر برچسب‌ها
];
```

### سفارشی‌سازی ظاهر

از `sx` props برای تغییر استایل استفاده کنید:

```tsx
<HierarchicalAddressComponent
  // ... سایر props
  sx={{
    '& .MuiPaper-root': {
      backgroundColor: 'primary.light',
      borderRadius: 2
    }
  }}
/>
```

## نکات مهم

1. **عملکرد**: برای تعداد زیاد آدرس‌ها، از pagination استفاده کنید
2. **حافظه**: داده‌های جغرافیایی را به صورت lazy load کنید
3. **دسترسی**: همه المان‌ها دارای ARIA labels مناسب هستند
4. **RTL**: کامپوننت کاملاً از زبان فارسی پشتیبانی می‌کند

## مثال کامل

```tsx
import React, { useState } from 'react';
import HierarchicalAddressComponent from './HierarchicalAddressField';
import type { HierarchicalAddress } from '../types/enhancedFields';

const AddressForm: React.FC = () => {
  const [addresses, setAddresses] = useState<HierarchicalAddress[]>([]);
  const [error, setError] = useState<string>('');

  const handleAddressChange = (newAddresses: HierarchicalAddress[]) => {
    setAddresses(newAddresses);
    setError('');
  };

  const validateAddresses = (): boolean => {
    if (addresses.length === 0) {
      setError('حداقل یک آدرس الزامی است');
      return false;
    }

    const hasPrimary = addresses.some(addr => addr.isPrimary);
    if (!hasPrimary) {
      setError('انتخاب آدرس اصلی الزامی است');
      return false;
    }

    return true;
  };

  return (
    <div>
      <HierarchicalAddressComponent
        value={addresses}
        onChange={handleAddressChange}
        label="آدرس‌های محل سکونت"
        required={true}
        error={error}
        minItems={1}
        maxItems={2}
        rootCategory="geographical"
        levels={['استان', 'شهر', 'محله']}
        allowFreeText={true}
      />
      
      <button onClick={validateAddresses}>
        اعتبارسنجی آدرس‌ها
      </button>
    </div>
  );
};

export default AddressForm;
```