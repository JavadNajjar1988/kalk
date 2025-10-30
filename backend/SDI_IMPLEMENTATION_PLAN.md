# برنامه پیاده‌سازی SDI در بک‌اند

## 📋 فهرست تغییرات

### 1. ✅ مدل‌های دیتابیس (Database Models)

#### 1.1. جدول `sdi_servers`
```python
class SDIServer(Base):
    __tablename__ = "sdi_servers"
    
    id: int (PK)
    name: str
    base_url: str
    service_types: JSON  # ["wms", "wmts", "wfs"]
    auth_type: str  # "none", "basic", "bearer"
    auth_config: JSON  # {"username": "...", "token": "..."}
    last_sync_at: datetime
    status: str  # "active", "error", "disabled"
    created_at: datetime
    updated_at: datetime
```

#### 1.2. جدول `sdi_maps` (جایگزین/تکمیلی برای `offline_maps`)
```python
class SDIMap(Base):
    __tablename__ = "sdi_maps"
    
    id: int (PK)
    server_id: int (FK, nullable)  # اگر از سرور آمده
    title: str
    description: str (nullable)
    source_type: str  # "wms", "wmts", "xyz_mbtiles", "xyz_sqlite", "wfs"
    url_or_path: str
    layer_name: str (nullable)  # برای WMS/WMTS
    format: str  # "png", "jpeg", "pbf", "mvt"
    srs: str  # "EPSG:3857"
    minzoom: int
    maxzoom: int
    bbox: JSON  # [minx, miny, maxx, maxy]
    version: str  # "v1", "v2"
    hash: str  # برای تشخیص تغییرات
    status: str  # "draft", "published", "retired"
    roles: JSON  # ["user", "admin"]
    category: str (nullable)
    metadata: JSON  # سایر متادیتا
    created_at: datetime
    updated_at: datetime
```

#### 1.3. جدول `sdi_jobs`
```python
class SDIJob(Base):
    __tablename__ = "sdi_jobs"
    
    id: int (PK)
    type: str  # "harvest", "publish", "rollback"
    server_id: int (FK, nullable)
    map_ids: JSON  # لیست map_idهایی که در این job بودند
    status: str  # "running", "success", "error"
    started_at: datetime
    ended_at: datetime (nullable)
    logs: JSON  # ["log line 1", "log line 2"]
    error: str (nullable)
    created_at: datetime
```

---

### 2. ✅ Schemaهای Pydantic

#### 2.1. Schemas برای Servers
```python
# app/schemas/sdi.py
class SDIServerCreate(BaseModel)
class SDIServerUpdate(BaseModel)
class SDIServerResponse(BaseModel)
class SDIServerTestResponse(BaseModel)  # برای تست اتصال
```

#### 2.2. Schemas برای Maps
```python
class SDIMapListResponse(BaseModel)  # برای جدول مدیریت
class SDIMapPublishRequest(BaseModel)  # {"map_ids": [1, 2, 3]}
class SDIMapPublishResponse(BaseModel)
```

#### 2.3. Schemas برای Catalog
```python
class CatalogLayer(BaseModel)  # برای layers.json
class CatalogResponse(BaseModel)  # {"schema_version": 1, "catalog_version": "...", "layers": [...]}
```

---

### 3. ✅ Service Layer (Logic جدا از Routes)

#### 3.1. `app/services/sdi/harvest.py`
```python
class HarvestService:
    async def harvest_from_server(server: SDIServer) -> list[SDIMap]
    async def harvest_offline_map(file_path: str, metadata: dict) -> SDIMap
    async def harvest_filesystem_folder(folder_path: str) -> SDIMap
```

**توابع کلیدی:**
- `get_capabilities_wms(url)` → لیست لایه‌ها
- `get_capabilities_wmts(url)` → لیست لایه‌ها
- `extract_mbtiles_metadata(path)` → minzoom, maxzoom, bounds
- `scan_filesystem_folder(path)` → metadata

#### 3.2. `app/services/sdi/publish.py`
```python
class PublishService:
    async def publish_maps(map_ids: list[int]) -> str  # catalog_version
    async def rollback_catalog(version: str) -> bool
    async def generate_layers_json() -> dict  # ساخت layers.json
```

**توابع کلیدی:**
- `atomic_write_json(file_path, data)` → نوشتن اتمیک
- `validate_maps_before_publish(map_ids)` → چک قبل از publish
- `calculate_catalog_version()` → version جدید

#### 3.3. `app/services/sdi/validation.py`
```python
class ValidationService:
    async def validate_map(map: SDIMap) -> tuple[bool, list[str]]  # (is_valid, errors)
    async def check_tiles_readable(map: SDIMap) -> bool
    async def verify_bbox(map: SDIMap) -> bool
```

---

### 4. ✅ API Routes

#### 4.1. `/api/sdi/servers` - مدیریت سرورها
```python
POST   /api/sdi/servers              # افزودن سرور جدید
GET    /api/sdi/servers              # لیست سرورها
GET    /api/sdi/servers/{id}         # جزئیات سرور
PUT    /api/sdi/servers/{id}         # به‌روزرسانی
DELETE /api/sdi/servers/{id}         # حذف
POST   /api/sdi/servers/{id}/test    # تست اتصال
POST   /api/sdi/servers/{id}/harvest # Harvest دستی
```

#### 4.2. `/api/sdi/maps` - مدیریت لایه‌ها
```python
GET    /api/sdi/maps?status=all      # لیست لایه‌ها (با فیلتر)
GET    /api/sdi/maps/{id}            # جزئیات یک لایه
POST   /api/sdi/maps/{id}/publish    # Publish یک لایه
POST   /api/sdi/maps/publish         # Publish چند لایه (body: {"map_ids": [...]})
POST   /api/sdi/maps/{id}/retire     # Retire
POST   /api/sdi/maps/{id}/rollback   # Rollback به draft
```

#### 4.3. `/api/sdi/offline` - منابع آفلاین
```python
POST   /api/sdi/offline/upload       # آپلود MBTiles (همان /maps/upload فعلی)
POST   /api/sdi/offline/register-folder  # ثبت پوشه x/y/z
```

#### 4.4. `/api/catalog` - کاتالوگ مصرفی
```python
GET    /api/catalog/layers.json      # خروجی برای کلاینت (فقط published)
GET    /api/catalog/version           # {"catalog_version": "..."} برای چک تغییر
```

#### 4.5. `/api/sdi/jobs` - مدیریت Jobs
```python
GET    /api/sdi/jobs                 # لیست Jobs
GET    /api/sdi/jobs/{id}            # جزئیات + Log
GET    /api/sdi/jobs/{id}/log        # فقط Log
```

---

### 5. ✅ Migration جدید

**فایل:** `backend/migrations/versions/0005_add_sdi_tables.py`

```python
def upgrade():
    # ایجاد جدول sdi_servers
    # ایجاد جدول sdi_maps
    # ایجاد جدول sdi_jobs
    # اضافه کردن indexها
    # migration داده از offline_maps به sdi_maps (اگر نیاز باشد)
```

---

### 6. ✅ Dependencies جدید

**افزودن به `requirements.txt`:**
```txt
owslib>=0.29.2          # برای GetCapabilities (WMS/WMTS)
mbutil>=1.3.3          # برای خواندن metadata از MBTiles
pyproj>=3.6.0          # برای تبدیل SRS
```

---

### 7. ✅ Config جدید

**افزودن به `app/core/config.py`:**
```python
CATALOG_PATH: str = "backend/static/maps/layers.json"
CATALOG_TMP_PATH: str = "backend/static/maps/layers.tmp.json"
FILESYSTEM_TILE_ROOT: str = "backend/static/maps"
DEFAULT_ROLES: list[str] = ["user"]
```

---

### 8. ✅ Integration با موجود

#### 8.1. استفاده از `OfflineMap` فعلی
دو گزینه:
- **گزینه A:** Migration به `SDIMap` + حذف `OfflineMap`
- **گزینه B:** نگه‌داری هر دو + Syncing (پیشنهادی برای فاز اول)

برای فاز اول، پیشنهاد می‌شود:
- `OfflineMap` را نگه داریم (برای سازگاری)
- وقتی کاربر یک نقشه را Publish می‌کند، یک رکورد `SDIMap` هم ساخته شود
- Endpoint `/catalog/layers.json` فقط از `SDIMap` با `status='published'` بخواند

---

## 🎯 مراحل پیاده‌سازی (Roadmap)

### فاز 1: MVP (Minimum Viable Product)
1. ✅ ایجاد مدل‌های DB + Migration
2. ✅ Service Harvest (فقط برای آفلاین، نه GetCapabilities)
3. ✅ Service Publish (ساخت layers.json اتمیک)
4. ✅ Route `/catalog/layers.json`
5. ✅ Route `/sdi/maps` (CRUD ساده)

### فاز 2: Harvest از سرورها
6. ✅ Service GetCapabilities برای WMS/WMTS
7. ✅ Route `/sdi/servers`
8. ✅ Route `/sdi/servers/{id}/harvest`

### فاز 3: Job Management
9. ✅ جدول Jobs + Logging
10. ✅ Route `/sdi/jobs`
11. ✅ Scheduled Harvest (اختیاری)

---

## 📝 نکات مهم

### 1. Atomic Publish
```python
async def publish_maps(map_ids: list[int]):
    # 1. Validate
    # 2. Generate layers.json در memory
    # 3. Write layers.tmp.json
    # 4. Calculate checksum
    # 5. Rename (atomic)
    # 6. Update DB
```

### 2. Version Handling
- هر Publish یک `catalog_version` جدید می‌سازد (timestamp یا increment)
- کلاینت این را چک می‌کند و در صورت تغییر refresh می‌کند

### 3. Backward Compatibility
- `OfflineMap` فعلی را نگه داریم
- Routes قدیمی `/maps/*` کار کنند
- به تدریج migrate کنیم

---

## 🔍 فایل‌های جدید که باید ساخته شوند

```
backend/app/
├── models/
│   └── sdi.py                    # SDIServer, SDIMap, SDIJob
├── schemas/
│   └── sdi.py                    # Pydantic models
├── services/
│   └── sdi/
│       ├── __init__.py
│       ├── harvest.py            # HarvestService
│       ├── publish.py             # PublishService
│       └── validation.py          # ValidationService
└── api/routes/
    ├── sdi.py                     # Routes برای SDI
    └── catalog.py                 # Route برای catalog/layers.json
```

