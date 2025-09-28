# Persian Number Localization Implementation

تمام اعداد در رابط کاربری پروژه Orbat Mapper اکنون به فارسی نمایش داده می‌شوند.

## 📋 Summary of Changes

### 🔧 Core Utilities Created

1. **`/src/utils/persianNumbers.ts`** - اصلی‌ترین فایل تبدیل اعداد
   - تبدیل اعداد انگلیسی (0-9) به فارسی (۰-۹)
   - تبدیل معکوس فارسی به انگلیسی
   - فرمت‌بندی اعداد با جداکننده هزارگان
   - فرمت‌بندی مختصات جغرافیایی
   - فرمت‌بندی زمان و تاریخ
   - فرمت‌بندی درصدها

2. **`/src/utils/persianNumberDirective.ts`** - دستورات Vue برای تبدیل خودکار
   - `v-persian-numbers`: تبدیل خودکار تمام اعداد در محتوا
   - `v-persian-input`: تبدیل ویژه برای فیلدهای ورودی

3. **`/src/composables/persianNumbers.ts`** - Composable برای استفاده در کامپوننت‌ها
   - توابع reactive برای تبدیل اعداد
   - Two-way binding برای فیلدهای ورودی
   - فرمت‌بندی پیشرفته اعداد

### 🎯 Updated Components

تمام کامپوننت‌هایی که اعداد نمایش می‌دهند بروزرسانی شدند:

#### Time & Date Components
- **`TimeController.vue`** - نمایش تاریخ و زمان با اعداد فارسی
- **`MapTimeController.vue`** - کنترلر زمان روی نقشه
- **`TimeDateSettingsPanel.vue`** - پنل تنظیمات زمان و تاریخ

#### Input Components  
- **`CoordinateInput.vue`** - ورودی مختصات جغرافیایی
- **`PropertyInput.vue`** - ورودی خصوصیات واحدها
- **`OpacityInput.vue`** - ورودی شفافیت (درصد)

#### Display Components
- **`ZoomSelector.vue`** - نمایش سطح زوم
- **`ImportOrbatMapperStep.vue`** - نمایش تعداد واحدها و حالت‌ها

#### Input Field Components
- توضیحات کامل در فایل `persianNumbers.ts`

### 🚀 Global Registration

دستورات Persian number در `main.ts` به صورت سراسری ثبت شدند:
```typescript
// Register Persian number directives globally
Object.entries(persianNumberDirectives).forEach(([name, directive]) => {
  app.directive(name, directive);
});
```

## 📖 Usage Guide

### استفاده از Utility Functions

```typescript
import { toPersianDigits, formatPersianNumber } from '@/utils';

// تبدیل ساده اعداد
const persianNumber = toPersianDigits("123"); // "۱۲۳"

// فرمت‌بندی با جداکننده
const formattedNumber = formatPersianNumber(1234567); // "۱,۲۳۴,۵۶۷"
```

### استفاده از Composable

```vue
<script setup>
import { usePersianNumbers } from '@/composables/persianNumbers';

const { persianNumber, persianTime, persianInput } = usePersianNumbers();

const count = ref(123);
const displayCount = persianNumber(count); // reactive Persian number

const { displayValue, actualValue } = persianInput(123);
</script>

<template>
  <div>{{ displayCount }}</div>
  <input v-model="displayValue" />
</template>
```

### استفاده از Directives

```vue
<template>
  <!-- تبدیل خودکار تمام اعداد -->
  <div v-persian-numbers>
    Numbers: 123, 456, 789
  </div>
  
  <!-- برای input fields -->
  <input v-persian-input v-model="value" />
</template>
```

### استفاده در Template

```vue
<template>
  <div>
    <!-- نمایش تعداد با اعداد فارسی -->
    <span>تعداد: {{ toPersianDigits(count) }}</span>
    
    <!-- نمایش زمان با اعداد فارسی -->
    <time>{{ formatPersianTime(timestamp) }}</time>
    
    <!-- نمایش مختصات با اعداد فارسی -->
    <span>{{ formatPersianCoordinates(lat, lon) }}</span>
  </div>
</template>
```

## 🧪 Testing

تمام توابع تبدیل اعداد با test suite کاملی آزمایش شدند:
- فایل: `src/utils/persianNumbers.test.ts`
- 21 تست موفق
- پوشش تمام سناریوهای مختلف

### اجرای تست‌ها

```bash
npm run test:unit -- persianNumbers.test.ts
```

## 🔧 Technical Details

### Mapping Table

| English | Persian |
|---------|---------|
| 0       | ۰       |
| 1       | ۱       |
| 2       | ۲       |
| 3       | ۳       |
| 4       | ۴       |
| 5       | ۵       |
| 6       | ۶       |
| 7       | ۷       |
| 8       | ۸       |
| 9       | ۹       |

### Performance Considerations

- تبدیل اعداد با استفاده از Regular Expressions بهینه انجام می‌شود
- Computed properties برای جلوگیری از محاسبات غیرضروری
- Directive ها فقط در صورت تغییر محتوا اجرا می‌شوند
- Observer pattern برای تغییرات دینامیکی محتوا

## 🎨 UI Impact

تمام موارد زیر اکنون با اعداد فارسی نمایش داده می‌شوند:

- ✅ تاریخ و زمان در تمام بخش‌ها
- ✅ مختصات جغرافیایی (عرض و طول)
- ✅ تعداد واحدها و عناصر  
- ✅ درصد شفافیت و زوم
- ✅ مقادیر عددی در جداول
- ✅ تعداد حالت‌های واحدها
- ✅ مقادیر ورودی در فرم‌ها
- ✅ اعداد در نمودارها و نمایش‌ها

## 🔮 Future Enhancements

### ویژگی‌های پیشنهادی برای آینده:

1. **تنظیمات کاربر**: امکان تغییر بین اعداد فارسی/انگلیسی
2. **Currency Formatting**: فرمت‌بندی مقادیر پولی
3. **Number Input Validation**: اعتبارسنجی ورودی‌های عددی
4. **Accessibility**: پشتیبانی بهتر از Screen Reader ها
5. **RTL Number Handling**: مدیریت بهتر اعداد در متن‌های راست به چپ

## 📝 Notes

- تمام تبدیل‌ها برای نمایش هستند و داده‌های اصلی همچنان انگلیسی باقی می‌مانند
- فیلدهای ورودی امکان تایپ هم فارسی و هم انگلیسی را دارند
- سازگاری کامل با سیستم‌های موجود حفظ شده است
- هیچ تغییری در API یا داده‌های پایگاه داده لازم نیست

---

**تاریخ پیاده‌سازی**: ۲۹ دی ۱۴۰۳  
**وضعیت**: کامل و آماده برای استفاده  
**تست**: تمام تست‌ها موفق ✅