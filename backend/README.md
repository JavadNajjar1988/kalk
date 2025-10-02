# FastAPI Backend (Kalk)

## پیش‌نیاز
- Python 3.11
- Postgres + PostGIS (یا docker-compose)

## اجرا (توسعه)
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger: `http://localhost:8000/api/docs`

## متغیرهای محیطی (نمونه)
```
API_PREFIX=/api
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
DB_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/kalk
JWT_SECRET=change_me
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Docker Compose
```powershell
docker-compose up -d
```

## مهاجرت دیتابیس (Alembic)
```powershell
alembic -c alembic.ini upgrade head
```

## تست‌ها
```powershell
pytest -q
```
