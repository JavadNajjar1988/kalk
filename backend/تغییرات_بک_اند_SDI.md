# 📝 تغییرات لازم در بک‌اند برای SDI

## 🎯 هدف
تبدیل سیستم دستی وارد کردن نقشه‌ها به یک سیستم خودکار و استاندارد (SDI)

---

## ✅ 1. تغییرات دیتابیس

### جدول‌های جدید که باید ساخته شوند:

#### 1️⃣ `sdi_servers` (سرورهای نقشه)
```sql
- id: int (primary key)
- name: str (نام سرور)
- base_url: str (آدرس پایه)
- service_types: JSON (["wms", "wmts", ...])
- auth_type: str ("none", "basic", "bearer")
- auth_config: JSON (ذخیره username/token)
- last_sync_at: datetime
- status: str ("active", "error", "disabled")
- created_at, updated_at: datetime
```

#### 2️⃣ `sdi_maps` (لایه‌های نقشه)
```sql
- id: int (primary key)
- server_id: int (FK به sdi_servers، nullable)
- title: str (عنوان لایه)
- description: str (nullable)
- source_type: str ("wms", "wmts", "xyz_mbtiles", "xyz_sqlite", ...)
- url_or_path: str (مسیر/URL)
- layer_name: str (برای WMS/WMTS)
- format: str ("png", "jpeg", "pbf")
- srs: str ("EPSG:3857")
- minzoom: int
- maxzoom: int
- bbox: JSON ([minx, miny, maxx, maxy])
- version: str ("v1", "v2")
- hash: str (برای تشخیص تغییرات)
- status: str ("draft", "published", "retired") ⭐ مهم
- roles: JSON (["user", "admin"]) ⭐ برای کنترل دسترسی
- category: str (nullable)
- metadata: JSON (سایر متادیتا)
- created_at, updated_at: datetime
```

#### 3️⃣ `sdi_jobs` (لاگ کارها)
```sql
- id: int (primary key)
- type: str ("harvest", "publish", "rollback")
- server_id: int (FK، nullable)
- map_ids: JSON (لیست map_idها)
- status: str ("running", "success", "error")
- started_at: datetime
- ended_at: datetime (nullable)
- logs: JSON (["خط 1", "خط 2"])
- error: str (nullable)
- created_at: datetime
```

---

## ✅ 2. APIهای جدید

### گروه 1: مدیریت سرورها (`/api/sdi/servers`)
```
POST   /api/sdi/servers              → افزودن سرور جدید
GET    /api/sdi/servers              → لیست سرورها
GET    /api/sdi/servers/{id}         → جزئیات یک سرور
PUT    /api/sdi/servers/{id}         → ویرایش
DELETE /api/sdi/servers/{id}         → حذف
POST   /api/sdi/servers/{id}/test    → تست اتصال
POST   /api/sdi/servers/{id}/harvest → Harvest دستی
```

### گروه 2: مدیریت لایه‌ها (`/api/sdi/maps`)
```
GET    /api/sdi/maps?status=all      → لیست لایه‌ها (با فیلتر status)
GET    /api/sdi/maps/{id}            → جزئیات یک لایه
POST   /api/sdi/maps/{id}/publish    → Publish یک لایه
POST   /api/sdi/maps/publish         → Publish چند لایه (body: {"map_ids": [1,2,3]})
POST   /api/sdi/maps/{id}/retire     → Retire (غیرفعال کردن)
```

### گروه 3: کاتالوگ مصرفی (`/api/catalog`)
```
GET    /api/catalog/layers.json      → خروجی برای کلاینت (فقط publishedها)
GET    /api/catalog/version          → {"catalog_version": "..."} برای چک تغییر
```

### گروه 4: مدیریت Jobs (`/api/sdi/jobs`)
```
GET    /api/sdi/jobs                 → لیست Jobs
GET    /api/sdi/jobs/{id}            → جزئیات + Log
```

---

## ✅ 3. Service Layer (منطق کسب‌وکار)

### 3.1. Harvest Service (`app/services/sdi/harvest.py`)
**وظیفه:** کشف لایه‌ها از منابع مختلف

```python
class HarvestService:
    # از سرور WMS/WMTS
    async def harvest_from_server(server: SDIServer) -> list[SDIMap]
    
    # از فایل MBTiles
    async def harvest_offline_map(file_path: str) -> SDIMap
    
    # از پوشه x/y/z
    async def harvest_filesystem_folder(folder_path: str) -> SDIMap
```

**توابع کمکی:**
- `get_capabilities_wms(url)` → لیست لایه‌های WMS
- `get_capabilities_wmts(url)` → لیست لایه‌های WMTS
- `extract_mbtiles_metadata(path)` → استخراج minzoom, maxzoom, bounds
- `scan_filesystem_folder(path)` → اسکن پوشه و استخراج metadata

### 3.2. Publish Service (`app/services/sdi/publish.py`)
**وظیفه:** انتشار اتمیک لایه‌ها به کاتالوگ

```python
class PublishService:
    # Publish لایه‌ها
    async def publish_maps(map_ids: list[int]) -> str  # برمی‌گرداند catalog_version
    
    # Rollback به نسخه قبلی
    async def rollback_catalog(version: str) -> bool
    
    # ساخت layers.json
    async def generate_layers_json() -> dict
```

**فرآیند Publish (اتمیک):**
```python
1. Validate کردن لایه‌ها (چک کردن سلامت)
2. ساخت layers.json در memory
3. نوشتن layers.tmp.json
4. محاسبه checksum
5. Rename به layers.json (عملیات atomic)
6. به‌روزرسانی status در DB
```

### 3.3. Validation Service (`app/services/sdi/validation.py`)
**وظیفه:** اعتبارسنجی لایه‌ها قبل از Publish

```python
class ValidationService:
    async def validate_map(map: SDIMap) -> tuple[bool, list[str]]  # (is_valid, errors)
    async def check_tiles_readable(map: SDIMap) -> bool
    async def verify_bbox(map: SDIMap) -> bool
```

---

## ✅ 4. ساختار `layers.json` که تولید می‌شود

```json
{
  "schema_version": 1,
  "catalog_version": "2025-01-15T10:30:00Z",
  "layers": [
    {
      "id": "roads-v2",
      "title": "راه‌ها",
      "category": "Transport",
      "description": "شبکه راه‌ها",
      "type": "raster-xyz",
      "source": "mbtiles",
      "path": "tiles/roads/v2/roads.mbtiles",
      "minzoom": 5,
      "maxzoom": 17,
      "updated": "2025-10-20",
      "ui": {
        "defaultOpacity": 1.0,
        "visibleByDefault": false,
        "tags": ["base", "vectorized"]
      },
      "admin": {
        "version": "v2",
        "filesize": 183457920,
        "checksum": "sha256:...",
        "roles": ["user", "admin"]
      },
      "bbox": [38.7, 24.2, 63.3, 39.8]
    }
  ]
}
```

⚠️ **مهم:** فقط لایه‌هایی که `status='published'` هستند در این فایل قرار می‌گیرند.

---

## ✅ 5. Dependencies جدید

**افزودن به `requirements.txt`:**
```txt
owslib>=0.29.2          # برای GetCapabilities (WMS/WMTS)
mbutil>=1.3.3          # برای خواندن metadata از MBTiles (اختیاری)
pyproj>=3.6.0          # برای تبدیل SRS (اگر نیاز باشد)
```

---

## ✅ 6. Config جدید

**افزودن به `app/core/config.py`:**
```python
CATALOG_PATH: str = "backend/static/maps/layers.json"
CATALOG_TMP_PATH: str = "backend/static/maps/layers.tmp.json"
DEFAULT_ROLES: list[str] = ["user"]
```

---

## ✅ 7. فایل‌های جدید که باید ساخته شوند

```
backend/app/
├── models/
│   └── sdi.py                    # مدل‌های SDIServer, SDIMap, SDIJob
├── schemas/
│   └── sdi.py                    # Pydantic schemas
├── services/
│   └── sdi/
│       ├── __init__.py
│       ├── harvest.py            # HarvestService
│       ├── publish.py            # PublishService
│       └── validation.py          # ValidationService
└── api/routes/
    ├── sdi.py                     # Routes برای SDI
    └── catalog.py                 # Routes برای catalog
```

**و یک Migration جدید:**
```
backend/migrations/versions/0005_add_sdi_tables.py
```

---

## 🔄 8. سازگاری با کد موجود

### رویکرد پیشنهادی:
1. **`OfflineMap` فعلی را نگه داریم** (برای سازگاری)
2. وقتی یک نقشه را **Publish** می‌کنیم، یک رکورد `SDIMap` هم ساخته می‌شود
3. Endpoint `/catalog/layers.json` فقط از `SDIMap` با `status='published'` می‌خواند
4. Routes قدیمی `/maps/*` همچنان کار می‌کنند

**در آینده:**
- می‌توانیم `OfflineMap` را به `SDIMap` migrate کنیم
- یا نگه داریم و sync کنیم

---

## 📅 مراحل پیاده‌سازی (اولویت‌بندی)

### فاز 1: MVP (اولویت بالا) ⭐
1. ✅ ایجاد مدل‌های DB (`SDIServer`, `SDIMap`, `SDIJob`)
2. ✅ Migration برای ایجاد جدول‌ها
3. ✅ Service Publish (ساخت `layers.json` اتمیک)
4. ✅ Route `/api/catalog/layers.json`
5. ✅ Route `/api/sdi/maps` (CRUD ساده)
6. ✅ Route `/api/sdi/maps/publish`

### فاز 2: Harvest از منابع آفلاین ⭐
7. ✅ Service Harvest برای MBTiles (استخراج metadata)
8. ✅ Service Harvest برای پوشه‌های x/y/z
9. ✅ Route `/api/sdi/offline/upload` (استفاده از کد موجود)
10. ✅ Route `/api/sdi/offline/register-folder`

### فاز 3: Harvest از سرورها (اختیاری)
11. ✅ Service GetCapabilities برای WMS/WMTS
12. ✅ Route `/api/sdi/servers`
13. ✅ Route `/api/sdi/servers/{id}/harvest`

### فاز 4: Job Management
14. ✅ Route `/api/sdi/jobs`
15. ✅ Logging برای تمام عملیات

---

## ⚠️ نکات مهم

1. **Atomic Publish:** همیشه از `layers.tmp.json` → `rename` استفاده کن
2. **Catalog Version:** هر Publish یک version جدید می‌سازد (timestamp)
3. **Validation:** قبل از Publish حتماً validate کن
4. **Backward Compatibility:** Routes قدیمی `/maps/*` را نگه دار

---

## 🎯 نتیجه نهایی

بعد از پیاده‌سازی:
- ✅ کاربر دیگر نیازی به وارد کردن دستی نقشه ندارد
- ✅ SDI خودکار لایه‌ها را می‌یابد و draft می‌سازد
- ✅ ادمین از Dashboard Publish می‌کند
- ✅ `layers.json` خودکار تولید می‌شود
- ✅ کلاینت فقط `layers.json` را می‌خواند و منو می‌سازد

