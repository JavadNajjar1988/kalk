# پیدا کردن جداول در VS Code

## ✅ اتصال شما موفق است!

از تصویر می‌بینم که:
- ✅ اتصال `kalk` متصل است (نقطه سبز)
- ✅ دیتابیس `kalk database` باز است
- ✅ `Schemas` باز است

---

## 📍 جداول کجا هستند؟

### مرحله 1: باز کردن Schema `public`
1. روی schema **`public`** کلیک کنید (فلش کنار آن)
2. یا دوبار کلیک کنید

### مرحله 2: مشاهده جداول
بعد از باز کردن `public`، این بخش‌ها را می‌بینید:
- **Tables** - جداول اصلی (اینجا جداول شما هستند!)
- **Views** - Viewها
- **Functions** - توابع
- **Sequences** - Sequenceها

### مرحله 3: باز کردن Tables
1. روی **`Tables`** کلیک کنید
2. تمام جداول را می‌بینید:
   - `users`
   - `scenarios`
   - `offline_maps`
   - `sdi_servers`
   - `sdi_maps`
   - `sdi_jobs`
   - `alembic_version`

---

## 🔍 مشاهده داده‌های یک جدول

### روش 1: راست کلیک
1. روی یک جدول کلیک راست کنید
2. انتخاب کنید:
   - **`Show Table Records`** - مشاهده داده‌ها
   - **`Describe Table`** - ساختار جدول
   - **`Run Query`** - اجرای Query

### روش 2: Query جدید
1. `Ctrl+Shift+P` → `SQLTools: New Query`
2. نوشتن:
   ```sql
   SELECT * FROM users;
   ```
3. `Ctrl+Shift+E` برای اجرا

---

## 📋 Schemaهای موجود

از تصویر می‌بینم که این schemaها وجود دارند:

### `public` ⭐
- **اینجا جداول شما هستند!**
- جداول اصلی پروژه در این schema هستند

### `tiger` و `tiger_data`
- برای PostGIS و داده‌های جغرافیایی
- معمولاً نیازی به تغییر ندارند

### `topology`
- برای PostGIS Topology
- معمولاً نیازی به تغییر ندارند

---

## 🎯 مسیر کامل برای پیدا کردن جداول

```
CONNECTIONS
└── kalk (postgres@127.0.0.1:5432/kalk) ✅ متصل
    └── kalk database
        └── Schemas
            └── public ⬅️ اینجا را باز کنید!
                └── Tables ⬅️ اینجا جداول شما هستند!
                    ├── users
                    ├── scenarios
                    ├── offline_maps
                    ├── sdi_servers
                    ├── sdi_maps
                    ├── sdi_jobs
                    └── alembic_version
```

---

## 💡 نکات

1. **جداول در `public` هستند**: همیشه schema `public` را باز کنید
2. **برای مشاهده داده‌ها**: راست کلیک → `Show Table Records`
3. **برای Query**: `Ctrl+Shift+P` → `SQLTools: New Query`

---

## 🚀 شروع سریع

1. روی **`public`** کلیک کنید (در تصویر شما)
2. روی **`Tables`** کلیک کنید
3. روی یک جدول (مثلاً `users`) راست کلیک کنید
4. **`Show Table Records`** را انتخاب کنید

**تمام!** حالا داده‌های جدول را می‌بینید. 🎉

