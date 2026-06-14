# Kalk - Offline Bundle (بدون انتقال داده دیتابیس)

این بسته شامل تمام چیزی است که برای اجرای پروژه روی یک سیستم مقصد لازم است،
بدون نیاز به اینترنت، بدون نیاز به سورس‌کد و بدون انتقال داده‌های دیتابیس.

> دیتابیس روی مقصد به صورت **خالی و تازه** ساخته می‌شود.

## ساختار بسته

```
kalk-offline-bundle/
├─ docker-compose.offline.yml   # تعریف سرویس‌ها (web, api, tileserver, db)
├─ .env.example                 # نمونه فایل تنظیمات (روی مقصد به .env کپی شود)
├─ run.ps1                      # اسکریپت اجرای خودکار (Windows)
├─ README-OFFLINE.md            # همین فایل
└─ images/
   ├─ kalk-web_1.4.0.tar        # ایمیج Frontend (Dashboard + KalkNegar + Simulator + nginx؛ آپلود تا 16g)
   ├─ kalk-api_1.2.0.tar        # ایمیج Backend (FastAPI + Python + Docker CLI)
   ├─ postgis_16-3.4.tar        # ایمیج PostgreSQL/PostGIS
   └─ tileserver-gl_latest.tar  # ایمیج TileServer-GL (سرو نقشه‌های MBTiles)
```

## پیش‌نیاز روی سیستم مقصد

- Docker Desktop (با Compose v2) — فقط همین.
- معماری CPU باید **x86_64 (amd64)** باشد (سازگار با ایمیج‌های ساخته‌شده).

## اجرای ساده (Windows / PowerShell)

داخل فولدر بسته:

```powershell
.\run.ps1
```

این اسکریپت به ترتیب:
1. در صورت نبود `.env`، آن را از `.env.example` می‌سازد.
2. ایمیج‌های `kalk-web`, `kalk-api`, `postgis`, `tileserver-gl` را از فولدر `images/` بارگذاری می‌کند (فقط بار اول).
3. سرویس‌ها را با `docker compose -f docker-compose.offline.yml up -d` بالا می‌آورد.

## اجرای دستی (هر سیستم‌عاملی)

```bash
# 1) بارگذاری ایمیج‌ها (فقط بار اول)
docker load -i images/kalk-web_1.4.0.tar
docker load -i images/kalk-api_1.2.0.tar
docker load -i images/postgis_16-3.4.tar
docker load -i images/tileserver-gl_latest.tar

# 2) ساخت .env (در صورت نبود)
cp .env.example .env

# 3) اجرای سرویس‌ها
docker compose -f docker-compose.offline.yml up -d

# 4) بررسی
docker compose -f docker-compose.offline.yml ps
docker compose -f docker-compose.offline.yml logs -f api
```

## آدرس‌های سرویس‌ها (روی مقصد)

| سرویس     | آدرس                                  | پورت میزبان |
|-----------|---------------------------------------|-------------|
| Dashboard | `http://<IP-Server>:3000/`            | 3000        |
| KalkNegar | `http://<IP-Server>:3000/kalknegar/`  | 3000        |
| Simulator | `http://<IP-Server>:3000/simulator/`  | 3000        |
| API       | `http://<IP-Server>:8002/api`         | 8002        |
| Postgres  | `<IP-Server>:5432` (user=postgres)    | 5432        |

> داشبورد روی پورت 3000 توسط nginx سرو می‌شود و درخواست‌های `/api`, `/kalknegar/`,
> و `/simulator/` را به سرویس‌های مربوطه proxy می‌کند، پس مرورگر کاربر فقط با
> پورت 3000 کار می‌کند.

## توقف / حذف

```powershell
# توقف سرویس‌ها (داده‌ها حفظ می‌شود)
docker compose -f docker-compose.offline.yml down

# توقف + حذف داده دیتابیس (volume)
docker compose -f docker-compose.offline.yml down -v
```

## عیب‌یابی سریع

- اگر پورت‌ها اشغال‌اند: مقادیر پورت در `docker-compose.offline.yml` را تغییر دهید.
- اگر داشبورد بالا نمی‌آید: `docker compose -f docker-compose.offline.yml logs -f web`
- اگر api سالم نیست: `docker compose -f docker-compose.offline.yml logs -f api`
- اگر دیتابیس init نشد: `docker compose -f docker-compose.offline.yml logs -f db`

### TileServer: `EACCES` / `No input file found` / حلقه restart

**علت:** volume `maps-data` هنوز فایل `.mbtiles` ندارد، یا tileserver اجازه خواندن/نوشتن روی `/data` ندارد.

**روی سرور (فوری):**

```bash
cd kalk-offline-bundle

# ۱) توقف حلقه restart
docker compose -f docker-compose.offline.yml stop tileserver

# ۲) بررسی فایل‌های نقشه داخل volume (مسیر مشترک با API)
docker compose -f docker-compose.offline.yml exec api ls -la /app/backend/static/maps

# ۳) اگر خالی است: از داشبورد آپلود کنید (منابع → نقشه) یا فایل را کپی کنید:
docker cp /path/to/map.mbtiles tileserver:/data/
# یا
docker compose -f docker-compose.offline.yml exec api ls /app/backend/static/maps

# ۴) اصلاح دسترسی volume
docker compose -f docker-compose.offline.yml run --rm --user 0:0 tileserver sh -c "chmod -R a+rwX /data"

# ۵) بالا آوردن مجدد
docker compose -f docker-compose.offline.yml up -d tileserver
docker compose -f docker-compose.offline.yml logs -f tileserver
```

> فایل `.mbtiles` را مستقیم روی دیسک سرور (خارج از Docker volume) کپی نکنید مگر با `docker cp` یا mount به volume `maps-data` — مسیر داخل کانتینرها: `/data` (tileserver) و `/app/backend/static/maps` (api).

## نکات مهم

- **این بسته داده‌ای از دیتابیس قبلی منتقل نمی‌کند.** اگر داده‌های واقعی نیاز است،
  جداگانه با `pg_dump`/`pg_restore` انجام دهید.
- **نقشه‌های MBTiles**: فایل‌های آپلودشده در volume مشترک `maps-data` ذخیره می‌شوند
  و TileServer-GL آن‌ها را سرو می‌کند. nginx مسیر `/tiles/` را به tileserver پراکسی
  می‌کند، بنابراین **هیچ پورت اضافه‌ای نیاز نیست** و نقشه‌ها هم لوکال و هم از شبکه
  کار می‌کنند.
- **نکته**: پس از آپلود فایل mbtiles جدید، ممکن است نیاز به ری‌استارت tileserver باشد:
  `docker compose -f docker-compose.offline.yml restart tileserver`
- داشبورد روی **پورت 3000** سرو می‌شود (همان پورتی که در حالت توسعه با
  `start.ps1` به آن عادت داشته‌اید).
