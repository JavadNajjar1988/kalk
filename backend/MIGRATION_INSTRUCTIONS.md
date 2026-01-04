# دستورالعمل اجرای Migration

## ⚠️ مشکل فعلی

Migration برای PostgreSQL تنظیم شده، ولی PostgreSQL در حال اجرا نیست.

## ✅ راه‌حل‌ها

### گزینه 1: استفاده از SQLite (ساده‌تر برای توسعه)

1. تغییر در `.env` یا `config.py`:
```python
# به جای PostgreSQL
DB_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kalk"

# از SQLite استفاده کنید
DB_URL: str = "sqlite+aiosqlite:///./kalk.db"
```

2. اجرای Migration:
```bash
cd backend
.\.venv\Scripts\activate
alembic upgrade head
```

### گزینه 2: راه‌اندازی PostgreSQL با Docker

از اسکریپت `start.ps1` استفاده کنید:
```powershell
.\start.ps1
```

این اسکریپت PostgreSQL را در Docker راه‌اندازی می‌کند.

سپس:
```powershell
cd backend
.\migrate.ps1
```

## ✅ وضعیت فعلی فایل‌های SDI

### تغییرات انجام شده:
1. ✅ `backend/app/models/sdi.py` — `metadata` → `extra_metadata` (اصلاح شد)
2. ✅ `backend/migrations/versions/0005_add_sdi_tables.py` — `metadata` → `extra_metadata`
3. ✅ `backend/app/schemas/sdi.py` — `metadata` → `extra_metadata`
4. ✅ `backend/app/api/routes/sdi.py` — `metadata` → `extra_metadata`

### دلیل تغییر:
`metadata` یک کلمه رزرو شده در SQLAlchemy است، پس به `extra_metadata` تغییر یافت.

## 📝 بعد از اجرای Migration موفق

Migration 3 جدول ایجاد می‌کند:
- `sdi_servers`
- `sdi_maps`
- `sdi_jobs`

## 🧪 تست

بعد از اجرای Migration:
```powershell
# راه‌اندازی بک‌اند
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

سپس تست APIها:
```
GET  http://localhost:8000/api/docs
GET  http://localhost:8000/api/sdi/maps
GET  http://localhost:8000/api/catalog/layers.json
```

