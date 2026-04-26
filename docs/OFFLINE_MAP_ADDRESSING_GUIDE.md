# راهنمای آدرس‌دهی نقشه‌های آفلاین

## ساختار آدرس‌دهی

سیستم "کالک نگار" از ساختار **MapTiler-style SQLite chunk cache** برای ذخیره و آدرس‌دهی نقشه‌های آفلاین استفاده می‌کند.

---

## ساختار پوشه‌بندی

### فرمت کلی:

```
<ROOT>/z{zoom}/{x_group}/{y_group}/{x_chunk}.{y_chunk}.sqlitedb
```

### جزئیات:

#### 1. سطح Zoom (`z{zoom}`)
- پوشه با نام `z` به همراه شماره سطح zoom
- مثال: `z3`, `z10`, `z15`

#### 2. گروه X (`{x_group}`)
- تقسیم‌بندی X به گروه‌های 1024 تایی
- محاسبه: `x_group = x // 1024`
- مثال: برای X=5000 → `x_group = 4`

#### 3. گروه Y (`{y_group}`)
- تقسیم‌بندی Y به گروه‌های 1024 تایی
- محاسبه: `y_group = y // 1024`
- مثال: برای Y=3000 → `y_group = 2`

#### 4. فایل SQLite (`{x_chunk}.{y_chunk}.sqlitedb`)
- تقسیم‌بندی نهایی به chunk های 256x256
- محاسبه:
  - `x_chunk = x // 256`
  - `y_chunk = y // 256`
- مثال: برای X=5000, Y=3000 → `19.11.sqlitedb`

---

## مثال کامل ساختار

برای یک نقشه با zoom level 3:

```
backend/static/maps/
└── sat/                      # نام نقشه/منطقه
    └── z3/                   # سطح zoom 3
        ├── 0/                # x_group = 0 (X: 0-1023)
        │   ├── 0/            # y_group = 0 (Y: 0-1023)
        │   │   ├── 0.0.sqlitedb      # chunk (0,0): X:0-255, Y:0-255
        │   │   ├── 0.1.sqlitedb      # chunk (0,1): X:0-255, Y:256-511
        │   │   ├── 1.0.sqlitedb      # chunk (1,0): X:256-511, Y:0-255
        │   │   └── ...
        │   ├── 1/            # y_group = 1 (Y: 1024-2047)
        │   │   └── ...
        │   └── ...
        ├── 1/                # x_group = 1 (X: 1024-2047)
        │   └── ...
        └── ...
```

---

## محاسبه مسیر Tile

### الگوریتم (Python):

```python
def calculate_tile_path(root: Path, z: int, x: int, y: int) -> Path:
    """
    محاسبه مسیر فایل SQLite برای یک tile
    
    Args:
        root: مسیر ریشه نقشه (مثلاً backend/static/maps/sat)
        z: سطح zoom
        x: مختصات X tile
        y: مختصات Y tile
    
    Returns:
        مسیر کامل فایل .sqlitedb
    """
    x_group = x // 1024
    y_group = y // 1024
    x_chunk = x // 256
    y_chunk = y // 256
    
    return (
        root
        / f"z{z}"
        / str(x_group)
        / str(y_group)
        / f"{x_chunk}.{y_chunk}.sqlitedb"
    )
```

### مثال عملی:

```python
from pathlib import Path

# مسیر ریشه نقشه
root = Path("backend/static/maps/sat")

# Tile مورد نظر: Zoom=10, X=512, Y=256
z, x, y = 10, 512, 256

# محاسبه مسیر
x_group = 512 // 1024  # = 0
y_group = 256 // 1024  # = 0
x_chunk = 512 // 256   # = 2
y_chunk = 256 // 256   # = 1

tile_path = root / f"z{10}" / "0" / "0" / "2.1.sqlitedb"
# نتیجه: backend/static/maps/sat/z10/0/0/2.1.sqlitedb
```

---

## ساختار داخلی فایل SQLite

هر فایل `.sqlitedb` شامل یک جدول با نام `t` است:

### جدول:

```sql
CREATE TABLE t (
    x INTEGER,        -- مختصات X tile
    y INTEGER,        -- مختصات Y tile
    b BLOB            -- داده tile (PNG/JPEG/WebP)
);
```

### دسترسی به Tile:

```python
import sqlite3

def get_tile(db_path: Path, x: int, y: int) -> bytes:
    """
    دریافت داده tile از فایل SQLite
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.execute(
        "SELECT b FROM t WHERE x = ? AND y = ? LIMIT 1",
        (x, y)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return row[0]  # داده binary tile
    return None
```

---

## URL Template برای استفاده در Frontend

### API Endpoint:

```
GET /api/tile-cache/{map_id}/{z}/{x}/{y}
```

### مثال:

```typescript
// در MapPage.tsx یا MapsTab.tsx
const tileUrl = `/api/tile-cache/${mapId}/${z}/${x}/${y}`;

// استفاده در OpenLayers
const tileLayer = new TileLayer({
    source: new XYZ({
        url: tileUrl,
        tileLoadFunction: (tile, src) => {
            // بارگذاری tile از API
        }
    })
});
```

---

## مسیرهای نسبی و مطلق

### مسیر ریشه (Base Root):

مسیر ریشه از متغیر محیطی `FILESYSTEM_TILE_ROOT` خوانده می‌شود:

- **پیش‌فرض**: `backend/static/maps`
- **از .env**: `FILESYSTEM_TILE_ROOT=/mnt/external-maps`
- **داخل کانتینر Docker**: `/mnt/external-maps`

### مسیر نسبی نقشه:

وقتی یک پوشه را در داشبورد ثبت می‌کنید:

```
پوشه کامل: backend/static/maps/sat/z3/0
مسیر نسبی: sat/z3/0
```

### مثال‌های مسیر:

| نوع مسیر | مثال | توضیح |
|----------|------|-------|
| **مطلق** | `C:\Maps\sat\z3\0` | مسیر کامل از ریشه سیستم |
| **نسبی به Base Root** | `sat/z3/0` | مسیر نسبی از `FILESYSTEM_TILE_ROOT` |
| **در Docker** | `/mnt/external-maps/sat/z3/0` | مسیر داخل کانتینر |

---

## ثبت نقشه در داشبورد

### روش 1: ثبت پوشه (Register Folder)

1. به **Dashboard → Resources → Maps → تب Sources** بروید
2. روی دکمه **"ثبت پوشه"** کلیک کنید
3. مسیر پوشه را وارد کنید:

#### مثال‌ها:

| ساختار فایل‌ها | مسیر نسبی وارد شده |
|----------------|-------------------|
| `maps/sat/z3/0/*.sqlitedb` | `sat/z3/0` |
| `maps/region1/z10/0/0/*.sqlitedb` | `region1/z10/0/0` |
| `maps/tehran/z15/1/2/*.sqlitedb` | `tehran/z15/1/2` |

**نکته مهم**: سیستم خودکار فایل‌های `.sqlitedb` را در زیرپوشه‌ها جستجو می‌کند.

### منطق حل مسیر (Path Resolution):

کد backend این مراحل را انجام می‌دهد:

```python
# 1. بررسی مسیر مطلق
if path.is_absolute():
    candidate = Path(path)

# 2. مسیر نسبی به base_root
candidate = base_root / path

# 3. مسیر با نام base_root در ابتدا
if path.parts[0] == base_root.name:
    candidate = base_root.parent / path
```

**مثال**:
- Base Root: `/mnt/external-maps`
- ورودی کاربر: `sat/z3/0`
- نتیجه: `/mnt/external-maps/sat/z3/0`

---

## تبدیل مختصات (XYZ vs TMS)

### XYZ Format (استاندارد):
- Y از بالا به پایین شمارش می‌شود (0 در شمال)

### TMS Format:
- Y از پایین به بالا شمارش می‌شود (0 در جنوب)

### تبدیل:

```python
def tms_to_xyz(y: int, z: int) -> int:
    """تبدیل TMS Y به XYZ Y"""
    max_index = (1 << z) - 1
    return max_index - y

def xyz_to_tms(y: int, z: int) -> int:
    """تبدیل XYZ Y به TMS Y"""
    max_index = (1 << z) - 1
    return max_index - y
```

### پشتیبانی خودکار:

سیستم به صورت خودکار هر دو فرمت را امتحان می‌کند:

```python
# در FilesystemTileService.get_tile()
candidates = [y]  # XYZ
tms_y = max_index - y
if tms_y != y:
    candidates.append(tms_y)  # TMS

# امتحان هر دو تا یکی پیدا شود
for candidate in candidates:
    try:
        return self._fetch_tile(z, x, candidate)
    except NotFound:
        continue
```

---

## مثال‌های واقعی

### مثال 1: نقشه تهران در Zoom 15

```
مسیر ریشه: backend/static/maps
نام نقشه: tehran

ساختار:
backend/static/maps/tehran/
└── z15/
    ├── 17/              # X: 17408-18431
    │   ├── 11/          # Y: 11264-12287
    │   │   ├── 68.44.sqlitedb  # X:17408-17663, Y:11264-11519
    │   │   ├── 68.45.sqlitedb
    │   │   └── ...
    │   └── ...
    └── ...

ثبت در داشبورد:
- نام: "تهران - Zoom 15"
- مسیر: "tehran/z15/17/11"
```

### مثال 2: نقشه ماهواره‌ای در Zoom 3

```
مسیر ریشه: /mnt/external-maps
نام نقشه: satellite_global

ساختار:
/mnt/external-maps/satellite_global/
└── z3/
    └── 0/               # X: 0-1023
        └── 0/           # Y: 0-1023
            ├── 0.0.sqlitedb
            ├── 0.1.sqlitedb
            ├── 1.0.sqlitedb
            └── ...

ثبت در داشبورد:
- نام: "نقشه ماهواره‌ای جهانی"
- مسیر: "satellite_global/z3/0/0"
```

---

## محدودیت‌ها و نکات

### محدودیت‌ها:

1. **فرمت فایل**: فقط فایل‌های `.sqlitedb` پشتیبانی می‌شوند
2. **ساختار جدول**: جدول باید نام `t` و ستون‌های `x`, `y`, `b` داشته باشد
3. **مسیر امن**: مسیر باید داخل `FILESYSTEM_TILE_ROOT` باشد

### نکات:

1. **بهینه‌سازی**: 
   - هر فایل SQLite می‌تواند تا 256x256 tile را ذخیره کند
   - این ساختار دسترسی سریع‌تر نسبت به فایل‌های جداگانه دارد

2. **مقیاس‌پذیری**:
   - برای نقشه‌های بزرگ (10+ TB)، از هارد خارجی استفاده کنید
   - ساختار chunk بندی شده دسترسی به بخش‌های خاص را سریع می‌کند

3. **چند Zoom Level**:
   - هر zoom level در پوشه جداگانه `z{N}` ذخیره می‌شود
   - می‌توانید فقط zoom level های مورد نیاز را ذخیره کنید

---

## عیب‌یابی

### مشکل: "فایل کاشی یافت نشد"

**بررسی‌ها:**
1. آیا ساختار پوشه درست است؟
   ```
   z{zoom}/{x_group}/{y_group}/{x_chunk}.{y_chunk}.sqlitedb
   ```
2. آیا فایل `.sqlitedb` وجود دارد؟
3. آیا مسیر نسبی درست ثبت شده است؟

### مشکل: "پوشه نقشه در دسترس نیست"

**بررسی‌ها:**
1. آیا `FILESYSTEM_TILE_ROOT` درست تنظیم شده است؟
2. آیا پوشه mount شده است؟ (در Docker)
3. آیا دسترسی خواندن وجود دارد؟

### مشکل: "کاشی یافت نشد" در جدول SQLite

**بررسی‌ها:**
1. آیا tile با مختصات `(x, y)` در جدول وجود دارد؟
2. آیا فرمت Y درست است؟ (XYZ vs TMS)

### لاگ‌های مفید:

```python
# در backend
import logging
logger = logging.getLogger(__name__)

# در FilesystemTileService
logger.debug(f"Looking for tile: z={z}, x={x}, y={y}")
logger.debug(f"Chunk path: {chunk_path}")
```

---

## خلاصه فرمول‌ها

### محاسبه مسیر فایل:

```
x_group = x // 1024
y_group = y // 1024
x_chunk = x // 256
y_chunk = y // 256

path = <ROOT>/z{zoom}/{x_group}/{y_group}/{x_chunk}.{y_chunk}.sqlitedb
```

### محاسبه محدوده Tile در Chunk:

```
x_min = (x_chunk * 256)
x_max = (x_chunk * 256) + 255
y_min = (y_chunk * 256)
y_max = (y_chunk * 256) + 255
```

### تبدیل TMS به XYZ:

```
xyz_y = (2^zoom - 1) - tms_y
```

---

## منابع و مراجع

- **کد Backend**: `backend/app/services/filesystem_tiles.py`
- **API Route**: `backend/app/api/routes/filesystem_tiles.py`
- **مدل داده**: `backend/app/models/map.py`
- **MapTiler Documentation**: https://docs.maptiler.com/

---

**آخرین به‌روزرسانی**: 2025-01-XX  
**پروژه**: کالک نگار (Kalk Negar)

