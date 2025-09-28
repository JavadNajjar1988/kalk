# TODO لیست ماژول تعاریف پایه

## ✅ مرحله 1: ساختار پایه (تکمیل شده)
- [x] ایجاد تایپ‌های TypeScript
- [x] ایجاد Redux slice
- [x] اضافه کردن slice به store اصلی
- [x] ایجاد کامپوننت CategoryCard
- [x] ایجاد کامپوننت DefinitionTree
- [x] ایجاد صفحه اصلی MasterDefinitionsPage
- [x] اضافه کردن route به router
- [x] اضافه کردن تب به منوی همبرگری
- [x] اضافه کردن ترجمه‌ها

## ✅ مرحله 2: کامپوننت‌های فرم (تکمیل شده)
- [x] ایجاد کامپوننت CategoryForm (فرم ایجاد/ویرایش دسته‌بندی)
- [x] ایجاد کامپوننت DefinitionForm (فرم ایجاد/ویرایش تعریف)
- [x] ایجاد کامپوننت Modal برای فرم‌ها
- [x] اضافه کردن validation به فرم‌ها
- [x] ایجاد کامپوننت DeleteConfirmation

## ⏸️ مرحله 3: API و Backend (موکول به بعد)
- [ ] ایجاد API endpoints در backend
- [ ] اتصال Redux thunks به API واقعی
- [ ] اضافه کردن error handling
- [ ] اضافه کردن loading states
- [ ] ایجاد database schema

## ✅ مرحله 4: ویژگی‌های پیشرفته (تکمیل شده)
- [x] Drag & Drop برای مرتب‌سازی
- [x] Search و Filter
- [x] Bulk operations (حذف/ویرایش گروهی)
- [x] Export/Import (JSON, Excel)
- [x] Audit trail (تاریخچه تغییرات)

## ✅ مرحله 5: زیردسته‌های پیش‌فرض (تکمیل شده)
- [x] تعریف زیردسته‌های پیش‌فرض برای هر دسته‌بندی
- [x] ایجاد migration script
- [x] تست زیردسته‌های پیش‌فرض

## 🔄 مرحله 6: تست و بهینه‌سازی (در حال انجام)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness

## 🔄 مرحله 7: مستندات (در حال انجام)
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Migration guide

## 🔄 مرحله 8: Deployment (در حال انجام)
- [ ] Production build
- [ ] Database migration
- [ ] Environment configuration
- [ ] Monitoring setup

---

## جزئیات هر مرحله:

### مرحله 2: کامپوننت‌های فرم
#### CategoryForm
- فرم ایجاد/ویرایش دسته‌بندی
- فیلدهای: نام، نام انگلیسی، توضیحات، آیکون، رنگ، حداکثر سطوح
- Validation: نام اجباری، نام انگلیسی اجباری، حداکثر سطوح بین 1-10

#### DefinitionForm
- فرم ایجاد/ویرایش تعریف
- فیلدهای: نام، نام انگلیسی، توضیحات، دسته‌بندی، والد، سطح، ترتیب
- Validation: نام اجباری، نام انگلیسی اجباری، سطح باید کمتر از حداکثر سطوح دسته‌بندی

#### Modal Components
- CategoryModal: برای CategoryForm
- DefinitionModal: برای DefinitionForm
- DeleteConfirmationModal: برای تأیید حذف

### مرحله 3: API و Backend
#### Endpoints مورد نیاز:
- `GET /api/master-definitions/categories` - دریافت همه دسته‌بندی‌ها
- `POST /api/master-definitions/categories` - ایجاد دسته‌بندی جدید
- `PUT /api/master-definitions/categories/:id` - ویرایش دسته‌بندی
- `DELETE /api/master-definitions/categories/:id` - حذف دسته‌بندی
- `GET /api/master-definitions/definitions` - دریافت تعاریف
- `POST /api/master-definitions/definitions` - ایجاد تعریف جدید
- `PUT /api/master-definitions/definitions/:id` - ویرایش تعریف
- `DELETE /api/master-definitions/definitions/:id` - حذف تعریف

#### Database Schema:
```sql
-- دسته‌بندی‌ها
CREATE TABLE definition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  english_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7),
  max_levels INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- تعاریف
CREATE TABLE master_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  english_name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES definition_categories(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES master_definitions(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_master_definitions_category_id ON master_definitions(category_id);
CREATE INDEX idx_master_definitions_parent_id ON master_definitions(parent_id);
CREATE INDEX idx_master_definitions_level ON master_definitions(level);
```

### مرحله 5: زیردسته‌های پیش‌فرض
#### تقسیمات جغرافیایی:
- سطح 1: کشور
- سطح 2: استان/ولایت
- سطح 3: شهرستان/شهر
- سطح 4: بخش/منطقه
- سطح 5: محله/روستا

#### درجات نظامی:
- سطح 1: گروه‌بندی (ستاد، صف)
- سطح 2: رده (عمومی، تخصصی)
- سطح 3: درجه (سرهنگ، سرگرد، و...)

#### ساختار رده‌های نظامی:
- سطح 1: نوع نیرو (زمینی، هوایی، دریایی)
- سطح 2: رده سازمانی (لشکر، تیپ، گردان)
- سطح 3: نوع یگان (پیاده، زرهی، توپخانه)
- سطح 4: نام خاص (تیپ 1 پیاده، گردان 2 زرهی)

### مرحله 6: تست و بهینه‌سازی
#### Unit Tests:
- تست کامپوننت‌ها
- تست Redux actions و reducers
- تست utility functions

#### Integration Tests:
- تست API endpoints
- تست فرم‌ها
- تست navigation

#### Performance:
- Lazy loading برای درخت بزرگ
- Virtualization برای لیست‌های طولانی
- Memoization برای کامپوننت‌های سنگین

---

## نکات مهم:
1. **امنیت**: تمام عملیات حذف باید تأیید شوند
2. **Validation**: اعتبارسنجی سختگیرانه در frontend و backend
3. **Error Handling**: مدیریت خطاهای شبکه و سرور
4. **UX**: Loading states، feedback مناسب، keyboard navigation
5. **Accessibility**: ARIA labels، keyboard shortcuts، screen reader support
6. **Internationalization**: پشتیبانی کامل از فارسی، انگلیسی و عربی
7. **Responsive Design**: سازگاری با موبایل و تبلت

---

## اولویت‌بندی:
1. **High Priority**: مراحل 2 و 3 (فرم‌ها و API)
2. **Medium Priority**: مراحل 4 و 5 (ویژگی‌های پیشرفته و زیردسته‌ها)
3. **Low Priority**: مراحل 6، 7 و 8 (تست، مستندات و deployment) 