# راهنمای تنظیم MapTiler

## تنظیمات فعلی

MapTiler حالا به صورت خودکار با `docker-compose.yml` اجرا می‌شود و دیگر نیازی به اجرای دستی نیست.

### سرویس tileserver در docker-compose.yml

```yaml
tileserver:
  image: maptiler/tileserver-gl:latest
  restart: unless-stopped
  ports:
    - "8480:8080"
  volumes:
    - ./backend/static/maps:/data:ro
  healthcheck:
    test: ["CMD-SHELL", "curl -sf http://localhost:8080/health || wget -qO- http://localhost:8080/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
  networks:
    - kalknet
  profiles:
    - maps
  depends_on:
    - api
```

## نحوه استفاده

### 1. اجرای سیستم کامل
```bash
docker compose up -d
```

### 2. اجرای فقط MapTiler (با پشتیبانی چندفایلی)
```bash
docker compose --profile maps up -d
```

### 3. بررسی وضعیت
```bash
docker compose ps
```

### 4. دسترسی به TileServer
- **URL**: http://127.0.0.1:8480
- **Health Check**: http://127.0.0.1:8480/health

## اضافه کردن فایل نقشه

### گزینه 1: دانلود نقشه آماده
1. فایل(های) `.mbtiles` مورد نظر را دانلود کنید
2. آن‌ها را در مسیر `backend/static/maps/` قرار دهید (نام فایل همان شناسه لایه خواهد شد)
3. سیستم را مجدداً راه‌اندازی کنید (یا فقط پروفایل `maps`)

### گزینه 2: ایجاد نقشه سفارشی
```bash
# استفاده از MapTiler Desktop یا ابزارهای مشابه
# فایل خروجی را maps.mbtiles نام‌گذاری کنید
# و در مسیر backend/static/maps/ قرار دهید
```

## تنظیمات فرانت‌اند

فرانت‌اند به صورت خودکار از آدرس‌های زیر استفاده می‌کند:
```
http://127.0.0.1:8480/data/<filename>.mbtiles/{z}/{x}/{y}.png
یا مقداردهی از طریق ENV: VITE_TILESERVER_URL
```

## کاشی‌های فایل‌سیستمی (SQLite chunk)

- پوشه‌هایی مثل `sat/` ساختار MapTiler chunk دارند: `sat/z{Z}/{X-group}/{Y-group}/{X-chunk}.{Y-chunk}.sqlitedb`.
- پوشه را در سرور (یا مسیر مانت‌شده داخل کانتینر) قرار دهید. مقدار `FILESYSTEM_TILE_ROOT` مسیر پایه را مشخص می‌کند (`sat` به‌صورت پیش‌فرض در `docker-compose.yml` مانت شده است).
- در داشبورد، تب «نقشه‌های آفلاین» را باز کرده و دکمه «ثبت پوشه» را بزنید. مسیر پوشه (نسبت به `sat/` یا مسیر مطلق داخل سرور) را وارد کنید؛ سیستم وجود فایل‌های `.sqlitedb` را بررسی و نقشه را ثبت می‌کند.
- پس از ثبت، URL کاشی به صورت `/api/tile-cache/<map_id>/{z}/{x}/{y}` در دسترس است و سرویس FastAPI کاشی را از SQLite استخراج می‌کند.
- همان نقشه در KalkNegar به‌عنوان لایهٔ پایهٔ جدید در دسترس است و می‌توانید آن را فعال/غیرفعال کنید.

## عیب‌یابی

### بررسی لاگ‌ها
```bash
docker compose logs tileserver
```

### بررسی وضعیت سلامت
```bash
curl http://127.0.0.1:8480/health
```

### مشکل: فایل‌ها پیدا نمی‌شوند
- مطمئن شوید فایل‌های `.mbtiles` در `backend/static/maps/` قرار دارند
- نام فایل در URL استفاده می‌شود: `/data/<filename>.mbtiles/{z}/{x}/{y}.png`
- از پروفایل استفاده کنید: `docker compose --profile maps up -d`
- برای نقشه‌های پوشه‌ای، ساختار باید `sat/z{Z}/{X-group}/{Y-group}/{X-chunk}.{Y-chunk}.sqlitedb` باشد و مسیر در داشبورد ثبت شده باشد.

## مزایای این تنظیمات

1. **مدیریت خودکار**: دیگر نیازی به اجرای دستی نیست
2. **Health Check**: وضعیت سرویس به صورت خودکار بررسی می‌شود
3. **Restart Policy**: در صورت خرابی، سرویس خودکار راه‌اندازی می‌شود
4. **Network Integration**: سرویس در همان شبکه Docker قرار دارد
5. **Volume Mounting**: فایل نقشه به صورت read-only mount می‌شود
6. **Profile Support**: می‌توان فقط در صورت نیاز اجرا کرد
7. **Dependency Management**: بعد از API اجرا می‌شود

## نکات مهم

- در نبود فایل `.mbtiles`، tileserver چیزی برای سرو ندارد
- برای اجرای tileserver، از profile استفاده کنید: `--profile maps`
- همه‌ی فایل‌های `.mbtiles` داخل `backend/static/maps/` به‌صورت read-only در `/data` درون کانتینر در دسترس‌اند
