# Smart Field Builder Preview Synchronization Fix

## مشکل (Problem)

کاربر گزارش کرده بود که در ماژول ویرایشگر تعاریف، دسته‌بندی اشخاص، تغییراتی که در بخش "تنظیمات نهایی" (Final Settings) در مودال ساخت فیلد هوشمند اعمال می‌شد، در دو بخش زیر به یکسان نمایش داده نمی‌شد:

1. پیش‌نمایش زنده در خود مودال ساخت فیلد هوشمند
2. تب "پیش‌نمایش فرم" در بخش مدیریت فیلدها

## علت مشکل (Root Cause)

مشکل در سه بخش اصلی وجود داشت:

### 1. عدم به‌روزرسانی پیش‌نمایش زنده در مودال
در فایل `PreviewStep.tsx`، تغییرات تنظیمات نهایی باعث به‌روزرسانی پیش‌نمایش زنده نمی‌شد.

### 2. عدم ذخیره‌سازی تنظیمات نهایی در `generatedConfig`
در فایل `GuidedWizard.tsx`، تابع `generateFinalConfig` تنظیمات نهایی را در بخش `generatedConfig.finalSettings` ذخیره نمی‌کرد.

### 3. عدم استفاده از تنظیمات نهایی در پیش‌نمایش فرم
در فایل‌های `SmartFieldManager.tsx` و `FieldPreview.tsx`، تنظیمات نهایی به درستی استخراج و استفاده نمی‌شد.

## راه‌حل‌های پیاده‌سازی شده (Implemented Solutions)

### 1. بهبود پیش‌نمایش زنده در PreviewStep.tsx

```typescript
// اضافه شدن useEffect برای به‌روزرسانی پیش‌نمایش
useEffect(() => {
  setPreviewValue(''); // Reset preview value to trigger re-render
}, [config.name, config.placeholder, config.helpText, config.isRequired]);

// استفاده از config فعلی در پیش‌نمایش
const fieldProps = {
  label: config.name || 'نام فیلد',
  required: config.isRequired || false,
  placeholder: config.placeholder,
  helperText: config.helpText || config.description,
  // ... سایر خصوصیات
};
```

### 2. بهبود generateFinalConfig در GuidedWizard.tsx

```typescript
generatedConfig: {
  finalSettings: {
    name: config.name,
    englishName: config.englishName,
    placeholder: config.placeholder,
    helpText: config.helpText,
    isRequired: config.isRequired || false,
    order: config.order || 1
  },
  enhancements: config.enhancements?.reduce((acc, enhancement) => {
    if (enhancement.enabled) {
      acc[enhancement.type] = enhancement.config;
    }
    return acc;
  }, {} as Record<string, any>) || {},
  baseFieldConfig: {
    baseType: config.baseType,
    dataSource: config.dataSource,
    validation: config.validation
  }
}
```

### 3. بهبود تبدیل فیلد در SmartFieldManager.tsx

```typescript
const convertSmartFieldToCustom = (smartField: SmartFieldConfig): CustomField => {
  const finalSettings = smartField.generatedConfig?.finalSettings;
  
  const smartFieldMetadata = {
    enhancements: enhancementConfigs,
    finalSettings: {
      placeholder: finalSettings?.placeholder || smartField.placeholder,
      helpText: finalSettings?.helpText || smartField.helpText,
      name: finalSettings?.name || smartField.name,
      englishName: finalSettings?.englishName || smartField.englishName,
      isRequired: finalSettings?.isRequired ?? smartField.isRequired,
      order: finalSettings?.order || smartField.order
    },
    baseType: smartField.baseType,
    dataSource: smartField.dataSource
  };
  
  return {
    id: smartField.id,
    name: finalSettings?.name || smartField.name,
    englishName: finalSettings?.englishName || smartField.englishName,
    type: mapBaseTypeToCustomFieldType(smartField.baseType, smartField.enhancements) as any,
    isRequired: finalSettings?.isRequired ?? smartField.isRequired,
    order: finalSettings?.order || smartField.order,
    defaultValue: JSON.stringify(smartFieldMetadata),
    validationRules: {},
    allowFreeText: hasEnhancement(smartField, 'free_text')
  } as CustomField;
};
```

### 4. بهبود FieldPreview.tsx

```typescript
// استخراج متادیتای فیلد هوشمند
const getSmartFieldMetadata = () => {
  try {
    if (typeof field.defaultValue === 'string' && field.defaultValue) {
      const metadata = JSON.parse(field.defaultValue);
      if (metadata && metadata.finalSettings) {
        return metadata;
      }
      if (metadata && typeof metadata === 'object' && !metadata.finalSettings) {
        return { enhancements: metadata, finalSettings: {} };
      }
    }
  } catch (e) {
    // If parsing fails, return empty metadata
  }
  return { enhancements: {}, finalSettings: {} };
};

const smartFieldMetadata = getSmartFieldMetadata();
const finalSettings = smartFieldMetadata.finalSettings || {};

// استفاده از تنظیمات نهایی برای نمایش
const displayName = finalSettings.name || field.name;
const placeholder = finalSettings.placeholder || undefined;
const smartHelpText = finalSettings.helpText || undefined;
const fieldHelperText = error ? helperText : (smartHelpText || '');
```

## فایل‌های تغییر یافته (Modified Files)

1. **`PreviewStep.tsx`**: اضافه شدن useEffect و استفاده از config فعلی
2. **`GuidedWizard.tsx`**: بهبود generateFinalConfig برای ذخیره finalSettings
3. **`SmartFieldManager.tsx`**: بهبود convertSmartFieldToCustom برای حفظ تنظیمات نهایی
4. **`FieldPreview.tsx`**: اضافه شدن قابلیت استخراج و استفاده از تنظیمات نهایی

## نحوه تست (How to Test)

### تست دستی:
1. به آدرس `/dashboard/definition-editor/categories/اشخاص` بروید
2. یک فیلد هوشمند جدید ایجاد کنید
3. در مرحله "پیش‌نمایش نهایی"، تنظیمات نهایی را تغییر دهید:
   - نام فیلد
   - متن راهنما (Placeholder)
   - متن کمکی
   - وضعیت اجباری بودن
4. بررسی کنید که پیش‌نمایش زنده در مودال فوراً به‌روزرسانی می‌شود
5. فیلد را ذخیره کنید
6. به تب "پیش‌نمایش فرم" بروید
7. بررسی کنید که فیلد دقیقاً همان تنظیماتی را نشان می‌دهد که در مودال تعیین کردید

### تست خودکار:
مسیر: `/dashboard/test/smart-field-preview-sync`

این صفحه تست یک تست خودکار ارائه می‌دهد که:
- شبیه‌سازی تغییرات تنظیمات نهایی می‌کند
- بررسی می‌کند که آیا تنظیمات به درستی ذخیره می‌شود
- نمایش پیش‌نمایش فرم را با تنظیمات انتظار مقایسه می‌کند

## نتیجه (Result)

اکنون تغییرات اعمال شده در بخش "تنظیمات نهایی" مودال ساخت فیلد هوشمند در هر دو مکان زیر به یکسان نمایش داده می‌شود:

1. ✅ پیش‌نمایش زنده در مودال ساخت فیلد هوشمند
2. ✅ تب "پیش‌نمایش فرم" در مدیریت فیلدها

این تضمین می‌کند که کاربران دقیقاً همان چیزی را که در مودال می‌بینند، در فرم نهایی نیز مشاهده خواهند کرد.