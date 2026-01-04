# راهنمای تنظیم فایل .env

برای یکدست بودن تنظیمات روی همه سیستم‌ها، فایل `.env` را در ریشه پروژه ایجاد کنید.

## ایجاد فایل .env

### روش 1: کپی از الگو (پیشنهادی)

```powershell
# در ریشه پروژه
Copy-Item ".env.example" ".env"
```

### روش 2: ایجاد دستی

فایل `.env` را در ریشه پروژه ایجاد کنید و محتوای زیر را در آن قرار دهید:

```env
# تنظیمات پایه دیتابیس
DB_URL=postgresql+asyncpg://postgres:postgres@db:5432/kalk

# تنظیمات CORS (فرمت JSON array)
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:3000","http://127.0.0.1:5173","http://127.0.0.1:3000"]

# غیرفعال کردن احراز هویت (فقط برای توسعه)
DISABLE_AUTH=false

# مسیر هارد خارجی برای نقشه‌های بزرگ (اختیاری)
# Windows: EXTERNAL_MAPS_PATH=D:/maps
# Linux: EXTERNAL_MAPS_PATH=/mnt/maps
# EXTERNAL_MAPS_PATH=

# مسیر پایه برای نقشه‌های فایل سیستم
FILESYSTEM_TILE_ROOT=/mnt/external-maps

# تنظیمات Keycloak (اختیاری)
USE_KEYCLOAK=false
KEYCLOAK_SERVER_URL=http://localhost:9090
KEYCLOAK_REALM=kalk
KEYCLOAK_CLIENT_ID=kalk-backend
KEYCLOAK_CLIENT_SECRET=

# تنظیمات TileServer
TILESERVER_URL=http://127.0.0.1:8480

# تنظیمات Admin
ADMIN_BOOTSTRAP_PASSWORD=admin123
```

## توضیحات تنظیمات

### DB_URL
آدرس اتصال به دیتابیس PostgreSQL. در حالت Docker معمولاً تغییر نمی‌کند.

### CORS_ORIGINS
لیست آدرس‌های مجاز برای CORS. باید به صورت JSON array باشد.

### DISABLE_AUTH
اگر `true` باشد، احراز هویت غیرفعال می‌شود (فقط برای توسعه).

### EXTERNAL_MAPS_PATH
مسیر هارد خارجی برای نقشه‌های بزرگ. اگر خالی باشد، از مسیر محلی استفاده می‌شود.

**مثال Windows:**
```env
EXTERNAL_MAPS_PATH=D:/maps
```

**مثال Linux:**
```env
EXTERNAL_MAPS_PATH=/mnt/maps
```

### FILESYSTEM_TILE_ROOT
مسیر پایه برای نقشه‌های فایل سیستم در داخل کانتینر.

### USE_KEYCLOAK
فعال/غیرفعال کردن Keycloak SSO.

### KEYCLOAK_SERVER_URL
آدرس سرور Keycloak.

### TILESERVER_URL
آدرس TileServer برای نقشه‌های mbtiles.

### ADMIN_BOOTSTRAP_PASSWORD
رمز عبور پیش‌فرض برای کاربر admin.

## نکات مهم

1. **فایل `.env` را commit نکنید** - این فایل حاوی تنظیمات محلی است
2. **از `.env.example` به عنوان الگو استفاده کنید** - این فایل باید commit شود
3. **تنظیمات را تغییر ندهید** - مگر اینکه واقعاً لازم باشد
4. **بعد از تغییر `.env`** - سرویس‌های Docker را restart کنید:
   ```powershell
   docker compose restart api
   ```

## عیب‌یابی

### مشکل: تنظیمات اعمال نمی‌شود

1. مطمئن شوید فایل `.env` در ریشه پروژه است
2. سرویس‌های Docker را restart کنید
3. بررسی کنید که فایل `.env` فرمت صحیح دارد (بدون BOM)

### مشکل: خطا در خواندن فایل .env

1. مطمئن شوید که فایل با encoding UTF-8 ذخیره شده است
2. بررسی کنید که هیچ کاراکتر اضافی در ابتدای فایل نیست
3. بررسی کنید که همه مقادیر در یک خط هستند

