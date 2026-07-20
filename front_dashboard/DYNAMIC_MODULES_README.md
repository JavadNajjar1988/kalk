# ماژول‌های پویا و سیستم Dynamic Modal

## بررسی اجمالی

این پروژه شامل یک سیستم پیشرفته برای ایجاد ماژول‌های پویا است که قابلیت خواندن تعاریف از ماژول `definition-editor` و تولید فرم‌های پویا براساس آن تعاریف را دارد.

## ویژگی‌های کلیدی

### ✅ ماژول Users (کاربران)
- صفحه لیست کاربران با قابلیت فیلتر و جستجو
- صفحه جزئیات کاربر
- Redux slice برای مدیریت state
- Routing کامل

### ✅ ماژول Resources (منابع)  
- صفحه لیست منابع با قابلیت فیلتر و جستجو
- Redux slice برای مدیریت state
- Routing کامل

### ✅ سیستم Dynamic Modal
- خواندن خودکار تعاریف از `definition-editor/persons.json`
- تولید فرم‌های پویا براساس تعاریف
- پشتیبانی از انواع مختلف فیلد
- سیستم validation کامل
- نمایش فرم‌ها در قالب تب‌های مختلف

### ✅ انواع فیلدهای پشتیبانی شده
- `text` - فیلد متنی ساده
- `textarea` - فیلد متن چندخطی
- `number` - فیلد عددی
- `email` - فیلد ایمیل با validation
- `password` - فیلد رمز عبور
- `date` - تاریخ با تقویم فارسی
- `select` - لیست کشویی تک انتخابی
- `multiselect` - لیست کشویی چند انتخابی
- `boolean` - چک‌باکس
- `phone` - فیلد چندگانه برای شماره‌های تلفن
- `social` - فیلد چندگانه برای شبکه‌های اجتماعی
- `file` - انتخاب فایل
- `reference` - فیلد مرجع (در حال توسعه)

### 🚧 Reference Fields (در حال توسعه)
- امکان ارجاع فیلدها به دسته‌بندی‌های دیگر
- بروزرسانی خودکار در صورت تغییر دسته‌بندی مرجع
- interface های آماده شده

## ساختار فایل‌ها

### ماژول Users
```
src/modules/users/
├── types/index.ts          # Type definitions
├── store/usersSlice.ts     # Redux slice
├── pages/
│   ├── UsersListPage.tsx   # صفحه لیست کاربران
│   └── UserDetailPage.tsx  # صفحه جزئیات کاربر
├── routes/index.tsx        # Routing
└── index.ts               # Module exports
```

### ماژول Resources
```
src/modules/resources/
├── types/index.ts              # Type definitions
├── store/resourcesSlice.ts     # Redux slice
├── pages/ResourcesListPage.tsx # صفحه لیست منابع
├── routes/index.tsx            # Routing
└── index.ts                   # Module exports
```

### سیستم Dynamic Modal
```
src/hooks/useDefinitionData.ts           # Hook برای خواندن تعاریف
src/components/common/
├── DynamicModal.tsx                     # Modal اصلی
└── DynamicForm.tsx                      # رندر فرم‌های پویا
```

## نحوه استفاده

### افزودن کاربر جدید
```tsx
<DynamicModal
  open={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSave={handleSaveUser}
  categoryType="users"          // خواندن از pr-2 در persons.json
  mode="create"
  title="افزودن کاربر جدید"
  maxWidth="lg"
/>
```

### افزودن منبع جدید
```tsx
<DynamicModal
  open={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSave={handleSaveResource}
  categoryType="resources"      // خواندن از pr-1 در persons.json
  mode="create"
  title="افزودن منبع جدید"
  maxWidth="lg"
/>
```

## تنظیمات و پیکربندی

### Redux Store
```typescript
// store/index.ts میں users اور resources slices اضافه شده‌اند
{
  users: usersSlice,
  resourcesModule: resourcesSlice,
}
```

### Routing
```typescript
// dashboard/routes/index.tsx میں routes اضافه شده‌اند
<Route path="users/*" element={<UsersRoutes />} />
<Route path="resources/*" element={<ResourcesRoutes />} />
```

## ویژگی‌های قابل توسعه

### 1. Reference Fields
فیلدهایی که می‌توانند از دسته‌بندی‌های دیگر اطلاعات بگیرند:

```json
{
  "id": "military-rank",
  "name": "درجه نظامی",
  "type": "reference",
  "referenceCategory": "military_ranks",
  "referencePath": "nodes",
  "referenceDisplayField": "name",
  "referenceValueField": "id"
}
```

### 2. Validation Rules
```json
{
  "validationRules": {
    "minLength": 2,
    "maxLength": 50,
    "pattern": "^[\\u0600-\\u06FF\\s]+$"
  }
}
```

### 3. Custom Field Types
امکان اضافه کردن انواع فیلد جدید در `DynamicForm.tsx`

## مثال از persons.json

```json
{
  "nodes": [
    {
      "id": "pr-2",
      "name": "کاربران",
      "children": [
        {
          "id": "pr-2-1",
          "name": "اطلاعات شخصی",
          "customFields": [
            {
              "id": "pf-full-name",
              "name": "نام و نام خانوادگی",
              "type": "text",
              "isRequired": true,
              "order": 1
            }
          ]
        }
      ]
    }
  ]
}
```

## مراحل آینده

1. **تکمیل Reference Fields** - اتصال کامل به دسته‌بندی‌های مرجع
2. **افزودن validation های پیشرفته** - Date range, Custom regex
3. **پشتیبانی از فیلدهای Conditional** - فیلدهایی که بر اساس مقدار فیلدهای دیگر نمایش داده می‌شوند
4. **Import/Export** - امکان import و export تعاریف
5. **Real-time Updates** - بروزرسانی خودکار در صورت تغییر تعاریف

## نکات مهم

- تمام فرم‌ها RTL هستند
- از تقویم فارسی استفاده می‌شود
- Validation ها real-time هستند
- اطلاعات در Redux Store ذخیره می‌شوند
- قابلیت pagination و search در لیست‌ها