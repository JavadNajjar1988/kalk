# راهنمای نصب و راه‌اندازی پروژه در سیستم جدید ویندوز

## پیش‌نیازها

### 1. نصب Docker Desktop
```bash
# دانلود و نصب Docker Desktop از:
# https://www.docker.com/products/docker-desktop/

# بررسی نصب:
docker --version
docker compose --version
```

### 2. نصب Node.js
```bash
# دانلود Node.js LTS از:
# https://nodejs.org/

# بررسی نصب:
node --version
npm --version
```

### 3. نصب Git
```bash
# دانلود Git از:
# https://git-scm.com/

# بررسی نصب:
git --version
```

## مراحل نصب

### مرحله 1: کلون کردن پروژه
```bash
git clone [URL_REPOSITORY]
cd kalk
```

### مرحله 2: بررسی ساختار پروژه
```
kalk/
├── backend/           # بک‌اند FastAPI
├── front_dashboard/   # فرانت‌اند React
├── front_kalknegar/   # فرانت‌اند Vue
├── docker-compose.yml # تنظیمات Docker
├── start-all.ps1      # اسکریپت راه‌اندازی
└── README.md
```

### مرحله 3: اجرای سیستم

#### روش 1: استفاده از اسکریپت PowerShell (پیشنهادی)
```powershell
# اجرای کامل سیستم
.\start-all.ps1

# یا با گزینه‌های مختلف:
.\start-all.ps1 -Rebuild    # بازسازی کانتینرها
.\start-all.ps1 -Purge      # پاک کردن کامل
```

#### روش 2: اجرای دستی
```bash
# 1. راه‌اندازی Docker services
docker compose up -d

# 2. نصب dependencies فرانت‌اند
cd front_dashboard
npm install
cd ..

cd front_kalknegar
npm install
cd ..

# 3. اجرای فرانت‌اندها
cd front_dashboard
npm run dev
# در ترمینال جدید:
cd front_kalknegar
npm run dev-host
```

## بررسی وضعیت سیستم

### 1. بررسی سرویس‌های Docker
```bash
docker compose ps
```

### 2. بررسی لاگ‌ها
```bash
# لاگ API
docker compose logs api

# لاگ دیتابیس
docker compose logs db

# لاگ همه سرویس‌ها
docker compose logs
```

### 3. تست API
```bash
# تست سلامت API
curl http://localhost:8000/api/health

# تست لاگین
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

## دسترسی به سیستم

### URL های اصلی:
- **Dashboard**: http://127.0.0.1:3000
- **KalkNegar**: http://localhost:5173/kalknegar/
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### اطلاعات لاگین:
- **Username**: admin
- **Password**: admin123

## سرویس‌های اختیاری

### MapTiler (اگر فایل نقشه موجود باشد)
```bash
# اجرای MapTiler
docker compose --profile maps up -d

# دسترسی: http://127.0.0.1:8480
```

### فایل‌های کاشی آفلاین (پوشه sat/)
- پوشه `sat/` به‌صورت پیش‌فرض در کانتینر API مانت می‌شود و انتظار می‌رود ساختار MapTiler chunk داشته باشد (`sat/z{Z}/{X-group}/{Y-group}/{X-chunk}.{Y-chunk}.sqlitedb`).
- در داشبورد → «نقشه‌های آفلاین» با انتخاب گزینه «ثبت پوشه» مسیر نقشه را وارد کنید؛ سرویس وجود فایل‌های `.sqlitedb` را بررسی و نقشه جدید را ثبت می‌کند.
- پس از ثبت، آدرس کاشی‌ها به شکل `/api/tile-cache/<map_id>/{z}/{x}/{y}` فراهم است و فرانت‌اندها به‌طور خودکار آن را مصرف می‌کنند.
- در محیط توسعه به دلیل پیکربندی پروکسی، همان الگو با پیشوند `/api/...` قابل استفاده است.
- اجرای `start-all.ps1` وجود این پوشه‌ها را تشخیص داده و پیام راهنما چاپ می‌کند.


## عیب‌یابی مشکلات رایج

### مشکل 1: پورت اشغال است
```bash
# بررسی پورت‌های استفاده شده
netstat -an | findstr ":3000"
netstat -an | findstr ":8000"
netstat -an | findstr ":5173"

# متوقف کردن سرویس‌ها
docker compose down
```

### مشکل 2: دیتابیس متصل نمی‌شود
```bash
# بررسی وضعیت دیتابیس
docker compose logs db

# راه‌اندازی مجدد دیتابیس
docker compose restart db
```

### مشکل 3: فرانت‌اند اجرا نمی‌شود
```bash
# نصب مجدد dependencies
cd front_dashboard
rm -rf node_modules
npm install

cd ../front_kalknegar
rm -rf node_modules
npm install
```

### مشکل 4: API پاسخ نمی‌دهد
```bash
# بررسی وضعیت API
docker compose logs api

# راه‌اندازی مجدد API
docker compose restart api
```

## تنظیمات محیط

### متغیرهای محیطی (اختیاری)
```bash
# ایجاد فایل .env در ریشه پروژه
DB_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/kalk
DISABLE_AUTH=false
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

## به‌روزرسانی سیستم

### به‌روزرسانی کد
```bash
git pull origin main
docker compose down
docker compose up -d --build
```

### به‌روزرسانی Dependencies
```bash
cd front_dashboard
npm update
cd ../front_kalknegar
npm update
```

## نکات مهم

1. **پورت‌ها**: مطمئن شوید پورت‌های 3000، 5173، 8000، 5432 آزاد هستند
2. **Docker**: Docker Desktop باید در حال اجرا باشد
3. **Node.js**: از نسخه LTS استفاده کنید
4. **Firewall**: ممکن است نیاز به تنظیم firewall باشد
5. **Antivirus**: برخی آنتی‌ویروس‌ها ممکن است مانع اجرا شوند

## پشتیبانی

در صورت بروز مشکل:
1. لاگ‌ها را بررسی کنید
2. وضعیت سرویس‌ها را چک کنید
3. پورت‌ها را بررسی کنید
4. Docker Desktop را restart کنید
