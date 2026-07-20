# FastAPI Backend (Kalk)

## پیش‌نیاز
- Python 3.11
- Postgres + PostGIS (یا docker-compose)

## اجرا (توسعه)
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# پورت 8002 با پروکسی Vite داشبورد هم‌خوان است (--port 8002)
# --reload-dir app: فقط ماژول‌های Python reload شوند؛ آپلود فایل به static/maps باعث قطع اتصال (ERR_CONNECTION_RESET) نشود
uvicorn app.main:app --reload --port 8002 --reload-dir app
```

Swagger: `http://localhost:8002/api/docs` (اگر پورت 8002 باشد)

## متغیرهای محیطی (نمونه)
```
API_PREFIX=/api
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
DB_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/kalk
JWT_SECRET=change_me
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_BOOTSTRAP_PASSWORD=your_secure_password_here  # رمز عبور کاربر ادمین اولیه
```

## Docker Compose
```powershell
docker-compose up -d
```

## مهاجرت دیتابیس (Alembic)
```powershell
alembic -c alembic.ini upgrade head
```

این دستور کاربر ادمین اولیه را نیز ایجاد می‌کند:
- **Username**: `admin`
- **Password**: مقدار تنظیم‌شده در متغیر محیطی `ADMIN_BOOTSTRAP_PASSWORD`
- **نکته**: پس از اولین ورود، رمز عبور را تغییر دهید!

## تست‌ها
```powershell
pytest -q
```
