# راهنمای یکدست‌سازی نصب و راه‌اندازی پروژه

این راهنما برای اطمینان از اجرای یکدست پروژه روی همه سیستم‌های شرکت طراحی شده است.

## مشکلات رایج و راهکارها

### مشکل 1: تفاوت نسخه‌های Node.js

**مشکل:**
- `front_dashboard` نیاز به Node.js >= 18.0.0 دارد
- `front_kalknegar` نیاز به Node.js >= 20.10.0 دارد
- روی سیستم‌های مختلف نسخه‌های متفاوتی نصب است

**راهکار:**
1. استفاده از نسخه یکسان Node.js LTS (20.x) روی همه سیستم‌ها
2. استفاده از `.nvmrc` یا `.node-version` برای مدیریت نسخه
3. بررسی خودکار نسخه قبل از اجرا

### مشکل 2: تفاوت نسخه‌های Python

**مشکل:**
- Backend نیاز به Python 3.11+ دارد
- روی برخی سیستم‌ها Python قدیمی‌تر نصب است

**راهکار:**
1. استفاده از Docker برای Backend (پیشنهادی)
2. یا استفاده از نسخه یکسان Python روی همه سیستم‌ها

### مشکل 3: پورت‌های اشغال شده

**مشکل:**
- پورت‌های 3000، 5173، 5180، 8000 ممکن است روی برخی سیستم‌ها اشغال باشند

**راهکار:**
1. بررسی خودکار پورت‌ها قبل از اجرا
2. نمایش پیام خطا واضح در صورت اشغال بودن
3. امکان تغییر پورت از طریق فایل `.env`

### مشکل 4: تفاوت در تنظیمات محیطی

**مشکل:**
- فایل `.env` وجود ندارد یا تنظیمات متفاوت است
- متغیرهای محیطی تنظیم نشده‌اند

**راهکار:**
1. ایجاد فایل `.env.example` به عنوان الگو
2. کپی خودکار `.env.example` به `.env` در صورت عدم وجود
3. بررسی و اعتبارسنجی تنظیمات

### مشکل 5: مشکلات Docker

**مشکل:**
- Docker Desktop نصب نیست یا اجرا نیست
- نسخه Docker متفاوت است
- مشکلات شبکه Docker

**راهکار:**
1. بررسی خودکار نصب و اجرای Docker
2. راهنمایی برای نصب در صورت عدم وجود
3. بررسی نسخه Docker

## راهکار یکدست‌سازی

### مرحله 1: ایجاد فایل‌های کانفیگ استاندارد

#### 1.1 فایل `.env.example`

این فایل به عنوان الگو برای همه سیستم‌ها استفاده می‌شود:

```env
# Database Configuration
DB_URL=postgresql+asyncpg://postgres:postgres@db:5432/kalk

# CORS Origins (JSON array format)
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:3000","http://127.0.0.1:5173","http://127.0.0.1:3000"]

# Authentication
DISABLE_AUTH=false

# External Maps Path (اختیاری - برای نقشه‌های بزرگ)
# Windows: EXTERNAL_MAPS_PATH=D:/maps
# Linux: EXTERNAL_MAPS_PATH=/mnt/maps
# EXTERNAL_MAPS_PATH=

# Filesystem Tile Root
FILESYSTEM_TILE_ROOT=/mnt/external-maps

# Ports (در صورت نیاز به تغییر)
# DASHBOARD_PORT=3000
# KALKNEGAR_PORT=5180
# API_PORT=8000
```

#### 1.2 فایل `.nvmrc` (برای مدیریت نسخه Node.js)

```
20.10.0
```

#### 1.3 فایل `.node-version` (برای asdf یا nodenv)

```
20.10.0
```

### مرحله 2: اسکریپت بررسی پیش‌نیازها

اسکریپت `check-prerequisites.ps1` تمام پیش‌نیازها را بررسی می‌کند.

### مرحله 3: اسکریپت یکدست راه‌اندازی

اسکریپت `start.ps1` که:
1. پیش‌نیازها را بررسی می‌کند
2. فایل `.env` را ایجاد می‌کند (در صورت نیاز)
3. پورت‌ها را بررسی می‌کند
4. وابستگی‌ها را نصب می‌کند
5. سرویس‌ها را راه‌اندازی می‌کند

## دستورالعمل نصب روی سیستم جدید

### مرحله 1: نصب پیش‌نیازها

```powershell
# 1. نصب Node.js LTS 20.x
# دانلود از: https://nodejs.org/
# یا استفاده از nvm-windows:
nvm install 20.10.0
nvm use 20.10.0

# 2. نصب Docker Desktop
# دانلود از: https://www.docker.com/products/docker-desktop/

# 3. نصب Git
# دانلود از: https://git-scm.com/
```

### مرحله 2: کلون کردن پروژه

```powershell
git clone [URL_REPOSITORY]
cd kalk
```

### مرحله 3: اجرای اسکریپت یکدست

```powershell
# بررسی پیش‌نیازها
.\check-prerequisites.ps1

# راه‌اندازی سیستم
.\start.ps1
```

## بررسی مشکلات

### بررسی نسخه‌ها

```powershell
# Node.js
node --version  # باید >= 20.10.0

# npm
npm --version   # باید >= 10.2.0

# Docker
docker --version
docker compose --version

# Python (اگر از Docker استفاده نمی‌کنید)
python --version  # باید >= 3.11
```

### بررسی پورت‌ها

```powershell
# بررسی پورت‌های استفاده شده
netstat -an | findstr ":3000"
netstat -an | findstr ":5180"
netstat -an | findstr ":8000"
netstat -an | findstr ":5432"
```

### بررسی سرویس‌های Docker

```powershell
# بررسی وضعیت کانتینرها
docker compose ps

# بررسی لاگ‌ها
docker compose logs api
docker compose logs db
```

## نکات مهم

1. **همیشه از Docker برای Backend استفاده کنید** - این اطمینان می‌دهد که همه سیستم‌ها از همان محیط استفاده می‌کنند

2. **از نسخه‌های LTS استفاده کنید** - Node.js 20.x LTS برای همه سیستم‌ها

3. **فایل `.env` را commit نکنید** - هر سیستم باید `.env` خودش را داشته باشد

4. **از `.env.example` به عنوان الگو استفاده کنید** - این فایل باید commit شود

5. **پورت‌ها را تغییر ندهید** - مگر اینکه واقعاً لازم باشد

6. **قبل از commit کردن تغییرات** - مطمئن شوید که روی سیستم‌های مختلف تست شده است

## عیب‌یابی

### مشکل: Node.js نسخه قدیمی

```powershell
# استفاده از nvm-windows
nvm install 20.10.0
nvm use 20.10.0
```

### مشکل: Docker اجرا نمی‌شود

1. Docker Desktop را باز کنید
2. مطمئن شوید که Docker Engine در حال اجرا است
3. در صورت نیاز Docker Desktop را restart کنید

### مشکل: پورت اشغال است

```powershell
# پیدا کردن پروسس استفاده کننده از پورت
netstat -ano | findstr ":3000"

# متوقف کردن پروسس (PID را از خروجی بالا بگیرید)
taskkill /PID [PID] /F
```

### مشکل: وابستگی‌ها نصب نمی‌شوند

```powershell
# پاک کردن cache
npm cache clean --force

# پاک کردن node_modules و نصب مجدد
Remove-Item -Recurse -Force node_modules
npm install
```

## پشتیبانی

در صورت بروز مشکل:
1. خروجی `check-prerequisites.ps1` را بررسی کنید
2. لاگ‌های Docker را بررسی کنید
3. نسخه‌های نصب شده را با این راهنما مقایسه کنید
4. فایل `.env` را با `.env.example` مقایسه کنید

