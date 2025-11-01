# راهنمای استفاده از هارد خارجی برای نقشه‌ها (10+ ترابایت)

برای استفاده از یک هارد خارجی (مثلاً 10 ترابایت) برای ذخیره نقشه‌ها، مراحل زیر را دنبال کنید:

## روش 1: استفاده از متغیر محیطی (توصیه می‌شود)

### مرحله 1: ساخت فایل `.env`

در ریشه پروژه یک فایل `.env` بسازید (اگر وجود ندارد):

```env
# مسیر هارد خارجی (Windows)
EXTERNAL_MAPS_PATH=D:\maps

# یا برای Linux/Mac
# EXTERNAL_MAPS_PATH=/mnt/maps

# مسیر mount شده در داخل کانتینر (معمولاً تغییر نمی‌شود)
EXTERNAL_MAPS_MOUNT=/mnt/external-maps
```

### مرحله 2: ساختار پوشه در هارد خارجی

در هارد خارجی خود ساختار زیر را ایجاد کنید:

```
D:\maps\              (یا /mnt/maps/)
├── mbtiles/          # فایل‌های .mbtiles
│   ├── map1.mbtiles
│   ├── map2.mbtiles
│   └── ...
├── sqlite/           # پوشه‌های sqlite (z/x/y)
│   ├── region1/
│   │   ├── z3/
│   │   │   └── 0/
│   │   │       └── *.sqlitedb
│   │   └── ...
│   └── region2/
│       └── ...
└── ...
```

### مرحله 3: تنظیم docker-compose.yml

فایل `docker-compose.yml` به صورت خودکار از متغیر `EXTERNAL_MAPS_PATH` استفاده می‌کند. فقط نیاز است که:

1. فایل `.env` را با مسیر هارد خارجی تنظیم کنید (مرحله 1)
2. در `.env` این خط را هم اضافه کنید:
   ```env
   FILESYSTEM_TILE_ROOT=/mnt/external-maps
   ```

اگر `.env` ندارید، یک فایل `.env` در ریشه پروژه بسازید:

**توجه:** برای Windows، مسیر باید به صورت `D:/maps` یا `D:\\maps` باشد (نه `D:\maps`)

### مرحله 4: راه‌اندازی

```powershell
docker compose down
docker compose up -d
```

## روش 2: تنظیم مستقیم در docker-compose.yml

اگر نمی‌خواهید از `.env` استفاده کنید، مستقیماً در `docker-compose.yml` مسیر را وارد کنید:

### برای Windows:

```yaml
api:
  volumes:
    - D:/maps:/mnt/external-maps:ro
  environment:
    FILESYSTEM_TILE_ROOT: /mnt/external-maps

tileserver:
  volumes:
    - D:/maps/mbtiles:/data:ro
```

### برای Linux/Mac:

```yaml
api:
  volumes:
    - /mnt/maps:/mnt/external-maps:ro
  environment:
    FILESYSTEM_TILE_ROOT: /mnt/external-maps

tileserver:
  volumes:
    - /mnt/maps/mbtiles:/data:ro
```

## روش 3: استفاده از Symlink (برای ساختار پیچیده)

اگر نقشه‌های شما در چندین پوشه مختلف روی هارد هستند، می‌توانید از symlink استفاده کنید:

### Windows:
```powershell
# در PowerShell با دسترسی Administrator
New-Item -ItemType SymbolicLink -Path "D:\maps\all-maps" -Target "D:\region1\maps"
```

### Linux:
```bash
ln -s /mnt/region1/maps /mnt/maps/region1
ln -s /mnt/region2/maps /mnt/maps/region2
```

سپس `/mnt/maps` را mount کنید.

## استفاده در داشبورد

بعد از mount کردن هارد خارجی:

### برای پوشه‌های sqlite:
1. به داشبورد → Resources → Maps → تب Sources بروید
2. روی "ثبت پوشه" کلیک کنید
3. مسیر نسبی را از ریشه mount شده انتخاب کنید
   - مثال: اگر نقشه شما در `/mnt/external-maps/region1/z3/0/` است
   - مسیر نسبی: `region1/z3/0`

### برای فایل‌های mbtiles:
1. می‌توانید فایل‌ها را از طریق داشبورد آپلود کنید (اما حجم زیاد زمان می‌برد)
2. یا فایل‌ها را مستقیم در پوشه `mbtiles/` روی هارد قرار دهید
3. tileserver به صورت خودکار آن‌ها را پیدا می‌کند

## بررسی و تست

### بررسی mount شدن:
```powershell
# داخل کانتینر API
docker exec -it kalk-api-1 ls -la /mnt/external-maps

# تست دسترسی
docker exec -it kalk-api-1 ls /mnt/external-maps/sqlite
```

### بررسی در داشبورد:
1. به `Resources → Maps` بروید
2. روی "ثبت پوشه" کلیک کنید
3. باید پوشه‌های موجود در هارد خارجی را ببینید

## نکات مهم

1. **Read-Only Mount:** استفاده از `:ro` (read-only) برای امنیت بیشتر توصیه می‌شود
2. **Performance:** برای حجم زیاد (10TB)، استفاده از SSD یا هارد پرسرعت توصیه می‌شود
3. **Network Storage:** اگر هارد روی شبکه است، از `NFS` یا `SMB` mount استفاده کنید
4. **Permissions:** در Linux، مطمئن شوید که کاربر Docker به هارد دسترسی دارد:
   ```bash
   sudo chown -R 1000:1000 /mnt/maps  # یا uid:gid کانتینر
   ```

## مثال کامل برای Windows

اگر نقشه‌های شما در `E:\Maps` است:

1. فایل `.env`:
```env
EXTERNAL_MAPS_PATH=E:/Maps
EXTERNAL_MAPS_MOUNT=/mnt/external-maps
```

2. ساختار پوشه:
```
E:\Maps\
├── sqlite\
│   └── sat\
│       └── z3\
│           └── 0\
│               └── *.sqlitedb
└── mbtiles\
    └── *.mbtiles
```

3. در داشبورد: مسیر نسبی `sqlite/sat/z3/0` را ثبت کنید

## عیب‌یابی

### مشکل: "پوشه ریشه نقشه یافت نشد"
- بررسی کنید که مسیر درست mount شده باشد
- بررسی کنید که `FILESYSTEM_TILE_ROOT` درست تنظیم شده باشد

### مشکل: "Permission denied"
- در Linux: دسترسی فایل‌ها را بررسی کنید
- در Windows: مطمئن شوید که Docker Desktop به درایو دسترسی دارد

### مشکل: نقشه‌ها نمایش داده نمی‌شوند
- بررسی کنید که فایل‌های `.sqlitedb` در ساختار `z/x/y/` باشند
- لاگ‌های کانتینر را بررسی کنید: `docker logs kalk-api-1`

