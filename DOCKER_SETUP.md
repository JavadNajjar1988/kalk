# راهنمای راه‌اندازی Docker

این راهنما نحوه استفاده از Docker برای اجرای پروژه Kalk را توضیح می‌دهد.

## پیش‌نیازها

- Docker Desktop (Windows/Mac) یا Docker Engine + Docker Compose (Linux)
- حداقل 4GB RAM
- حداقل 10GB فضای خالی برای images و volumes

## راه‌اندازی سریع

### 1. کپی فایل تنظیمات

```bash
# کپی فایل .env.example به .env (اگر وجود دارد)
# یا فایل .env را به صورت دستی ایجاد کنید
```

### 2. اجرای Docker Compose

```bash
# Windows PowerShell


# Linux/Mac
./start-all.sh

# یا به صورت دستی
docker compose up -d
```

### 3. بررسی وضعیت سرویس‌ها

```bash
docker compose ps
```

## ساختار سرویس‌ها

### سرویس‌های اصلی

- **db**: PostgreSQL با PostGIS (پورت 5432)
- **api**: FastAPI Backend (پورت 8000)
- **tileserver**: TileServer-GL برای نقشه‌های mbtiles (پورت 8480) - با profile `maps`
- **external-tileserver**: TileServer-GL برای نقشه‌های بزرگ (پورت 8481) - با profile `heavy-maps`
- **geoserver**: GeoServer برای SDI (پورت 8080) - با profile `sdi`

## پیکربندی

### فایل .env

فایل `.env` را در ریشه پروژه ایجاد کنید:

```env
# Database
DB_URL=postgresql+asyncpg://postgres:postgres@db:5432/kalk

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Authentication
DISABLE_AUTH=false

# External Maps Path (اختیاری)
# Windows: EXTERNAL_MAPS_PATH=D:/maps
# Linux: EXTERNAL_MAPS_PATH=/mnt/maps
EXTERNAL_MAPS_PATH=

# Filesystem Tile Root
FILESYSTEM_TILE_ROOT=/mnt/external-maps
```

### استفاده از هارد خارجی

برای استفاده از هارد خارجی برای نقشه‌های بزرگ:

1. فایل `.env` را ایجاد کنید
2. `EXTERNAL_MAPS_PATH` را تنظیم کنید:
   - Windows: `EXTERNAL_MAPS_PATH=D:/maps`
   - Linux: `EXTERNAL_MAPS_PATH=/mnt/maps`
3. سرویس external-tileserver را اجرا کنید:
   ```bash
   docker compose --profile heavy-maps up -d
   ```

## دستورات مفید

### مشاهده لاگ‌ها

```bash
# همه سرویس‌ها
docker compose logs -f

# فقط API
docker compose logs -f api

# فقط Database
docker compose logs -f db
```

### اجرای Migration

```bash
# Migration به صورت خودکار در start-all.ps1 اجرا می‌شود
# یا به صورت دستی:
docker compose exec api alembic upgrade head
```

### دسترسی به Shell کانتینر

```bash
# API container
docker compose exec api sh

# Database container
docker compose exec db psql -U postgres -d kalk
```

### توقف و حذف

```bash
# توقف سرویس‌ها
docker compose down

# توقف و حذف volumes (حذف داده‌های دیتابیس)
docker compose down -v

# توقف و حذف همه چیز
docker compose down -v --remove-orphans
```

### Rebuild

```bash
# Rebuild بدون cache
docker compose build --no-cache

# یا با start-all.ps1
.\start-all.ps1 -Rebuild
```

## قابلیت انتقال (Portability)

پروژه برای قابلیت انتقال بهینه شده است:

### ✅ ویژگی‌های موجود

1. **فایل .dockerignore**: فایل‌های غیرضروری از build حذف می‌شوند
2. **Layer Caching**: Dockerfile بهینه شده برای استفاده بهتر از cache
3. **Environment Variables**: تمام تنظیمات از طریق متغیرهای محیطی قابل تغییر است
4. **Health Checks**: همه سرویس‌ها health check دارند
5. **Volume Mounts**: داده‌ها به صورت volume mount می‌شوند
6. **Network Isolation**: همه سرویس‌ها در شبکه جداگانه `kalknet` هستند

### 🔧 نکات مهم

1. **مسیرها**: در Windows از `/` یا `\\` استفاده کنید (نه `\`)
2. **فایل .env**: همیشه فایل `.env` را در `.gitignore` نگه دارید
3. **Volumes**: داده‌های مهم (مثل دیتابیس) در volumes ذخیره می‌شوند
4. **Ports**: پورت‌های استفاده شده را بررسی کنید تا conflict نداشته باشند

## عیب‌یابی

### مشکل: پورت در حال استفاده است

```bash
# بررسی پورت‌های استفاده شده
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # Linux/Mac

# تغییر پورت در docker-compose.yml
ports:
  - "8001:8000"  # پورت جدید:پورت داخل کانتینر
```

### مشکل: Migration اجرا نمی‌شود

```bash
# بررسی وضعیت API
docker compose ps api

# اجرای دستی migration
docker compose exec api alembic upgrade head

# بررسی لاگ‌ها
docker compose logs api
```

### مشکل: نقشه‌ها لود نمی‌شوند

1. بررسی mount شدن volume:
   ```bash
   docker compose exec api ls -la /app/backend/static/maps
   ```

2. بررسی متغیر `FILESYSTEM_TILE_ROOT`:
   ```bash
   docker compose exec api env | grep FILESYSTEM
   ```

3. بررسی فایل‌های نقشه:
   ```bash
   docker compose exec api find /mnt/external-maps -name "*.sqlitedb" | head -5
   ```

## بهینه‌سازی

### کاهش حجم Image

```bash
# استفاده از multi-stage build (در صورت نیاز)
# حذف فایل‌های غیرضروری با .dockerignore
```

### افزایش Performance

```bash
# استفاده از named volumes برای داده‌های بزرگ
# تنظیم memory limits در docker-compose.yml
```

## امنیت

1. **رمزهای عبور**: همیشه رمزهای قوی برای دیتابیس و سرویس‌ها استفاده کنید
2. **فایل .env**: هرگز فایل `.env` را commit نکنید
3. **Network**: از network isolation استفاده کنید
4. **Volumes**: از read-only mounts برای داده‌های فقط خواندنی استفاده کنید

## پشتیبانی

برای مشکلات بیشتر، لاگ‌های Docker را بررسی کنید:
```bash
docker compose logs --tail=100 -f
```

