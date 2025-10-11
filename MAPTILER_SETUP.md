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
    - ./backend/static/maps/maps.mbtiles:/data/maps.mbtiles:ro
  command: ["--mbtiles", "/data/maps.mbtiles"]
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

### 2. اجرای فقط MapTiler (اگر فایل maps.mbtiles موجود باشد)
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
1. فایل `.mbtiles` مورد نظر را دانلود کنید
2. آن را با نام `maps.mbtiles` در مسیر `backend/static/maps/` قرار دهید
3. سیستم را مجدداً راه‌اندازی کنید

### گزینه 2: ایجاد نقشه سفارشی
```bash
# استفاده از MapTiler Desktop یا ابزارهای مشابه
# فایل خروجی را maps.mbtiles نام‌گذاری کنید
# و در مسیر backend/static/maps/ قرار دهید
```

## تنظیمات فرانت‌اند

فرانت‌اند به صورت خودکار از آدرس زیر استفاده می‌کند:
```
http://127.0.0.1:8480/data/maps/{z}/{x}/{y}.png
```

## عیب‌یابی

### بررسی لاگ‌ها
```bash
docker compose logs tileserver
```

### بررسی وضعیت سلامت
```bash
curl http://127.0.0.1:8480/health
```

### مشکل: فایل maps.mbtiles موجود نیست
- فایل `maps.mbtiles` را در مسیر `backend/static/maps/` قرار دهید
- یا از profile استفاده کنید: `docker compose --profile maps up -d`

## مزایای این تنظیمات

1. **مدیریت خودکار**: دیگر نیازی به اجرای دستی نیست
2. **Health Check**: وضعیت سرویس به صورت خودکار بررسی می‌شود
3. **Restart Policy**: در صورت خرابی، سرویس خودکار راه‌اندازی می‌شود
4. **Network Integration**: سرویس در همان شبکه Docker قرار دارد
5. **Volume Mounting**: فایل نقشه به صورت read-only mount می‌شود
6. **Profile Support**: می‌توان فقط در صورت نیاز اجرا کرد
7. **Dependency Management**: بعد از API اجرا می‌شود

## نکات مهم

- اگر فایل `maps.mbtiles` موجود نباشد، tileserver اجرا نمی‌شود
- برای اجرای tileserver، از profile استفاده کنید: `--profile maps`
- فایل نقشه باید در مسیر `backend/static/maps/` با نام `maps.mbtiles` قرار گیرد
