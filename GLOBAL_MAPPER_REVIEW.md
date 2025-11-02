# بررسی کامل Global Mapper

## معرفی Global Mapper

**Global Mapper** یک نرم‌افزار حرفه‌ای GIS (سیستم اطلاعات جغرافیایی) است که توسط شرکت **Blue Marble Geographics** توسعه یافته و برای حرفه‌ای‌های GIS در سراسر جهان مورد اعتماد قرار گرفته است. این نرم‌افزار یک راه‌حل جامع برای پردازش، تجسم و مدیریت داده‌های مکانی ارائه می‌دهد.

### نسخه فعلی
- **نسخه فعلی**: V26.2
- **وب‌سایت رسمی**: https://www.bluemarblegeo.com/global-mapper/

---

## ویژگی‌های کلیدی Global Mapper

### 1. پشتیبانی گسترده از فرمت‌های فایل

Global Mapper از **بیش از 300 فرمت فایل** پشتیبانی می‌کند بدون نیاز به افزونه یا لایسنس اضافی:

- **داده‌های برداری (Vector)**: Shapefile, KML, GeoJSON, DXF, DWG و...
- **داده‌های رستری (Raster)**: GeoTIFF, JPEG2000, ECW, MrSID و...
- **داده‌های ارتفاعی (Elevation)**: DEM, DTM, DSM و...
- **ابر نقاط (Point Cloud)**: LAS, LAZ, E57, PLY و...
- **فرمت‌های جدید**: 
  - IIQ (Phase One Intelligent Image Quality)
  - OSM PBF (OpenStreetMap Protocolbuffer Binary)
  - TFADS-O (Table Formatted Aeronautical Data Set–Obstacles)
  - پشتیبانی بهبود یافته از ECW و JPEG2000

### 2. اتصال به منابع داده آنلاین

دسترسی به منابع داده آنلاین شامل:
- تصاویر هوایی
- داده‌های ارتفاعی جهانی
- نقشه‌های توپوگرافی
- تصاویر ماهواره‌ای Landsat
- داده‌های پوشش زمین (Land Cover)
- نمودارهای هوانوردی
- و منابع دیگر...

### 3. تجسم انعطاف‌پذیر داده‌ها

- **تجسم 2D و 3D** داده‌ها برای تحلیل بهینه
- **Shaders قابل تنظیم** برای نمایش بهتر زمین
- **ایجاد انیمیشن** برای تجسم داده‌های سری زمانی
- **ضبط ویدیو HD** از پروازهای سه‌بعدی
- **ابزارهای Layout** برای طراحی نقشه و خروجی PDF/چاپ
- **خروجی به فرمت Tile وب** برای انتشار آنلاین

### 4. ایجاد و ویرایش داده‌های برداری

- ابزارهای دیجیتایز کردن برای ایجاد:
  - نقاط (Points)
  - خطوط (Lines)
  - چندضلعی‌ها (Polygons)
- ابزارهای هندسی تخصصی:
  - حلقه‌های فاصله (Range Rings)
  - شبکه‌ها (Grids)
  - مناطق بافر (Buffer Areas)
- **ابزار عملیات مکانی (Spatial Operations)**:
  - Intersection (اشتراک)
  - Union (اجتماع)
  - Difference (تفاضل)
  - Symmetrical Difference (تفاضل متقارن)
  - محمولات مکانی متعدد و تبدیل‌ها

### 5. نمایش و تحلیل داده‌های رستری

- **ابزارهای تنظیم بصری**:
  - ایجاد لایه چندبانده
  - Pan Sharpening (تیزسازی پانکروماتیک)
  - تایلینگ و موزاییک کردن تصویر
- **تطبیق هیستوگرام**: تنظیم کانال رنگ یک لایه بر اساس لایه دیگر
- **Feathering و تنظیم کنتراست**: ترکیب داده‌های جمع‌آوری شده در زمان‌ها یا با تجهیزات مختلف

### 6. محاسبه رستری

- **عملیات ریاضی** روی تصاویر چندبانده یا لایه‌های چندگانه
- **فرمول‌های داخلی** برای:
  - NDVI (Normalized Difference Vegetation Index)
  - NDWI (Normalized Difference Water Index)
  - NBR و سایر شاخص‌های رایج
- **فرمول‌های سفارشی** قابل تعریف
- **ابزار Reclassify**: تبدیل مقادیر پیکسل بر اساس قوانین کاربر

### 7. ایجاد و تجسم Terrain

- **تجسم پویای Terrain**:
  - پشتیبانی از داده‌های ارتفاعی وارد شده
  - لایه‌های TIN تولید شده از داده‌های برداری 3D
  - گزینه‌های Shader رنگی
- **ایجاد لایه‌های برداری** برای برجسته کردن الگوها یا مقادیر در داده‌ها
- **تولید خطوط کانتور** قابل تنظیم:
  - فاصله کانتور قابل تنظیم
  - تولید ویژگی چندضلعی
  - شناسایی قله‌ها و فرورفتگی‌های محلی

### 8. تحلیل Terrain

- **محاسبه حجم Cut-and-Fill** از ویژگی‌های چندضلعی یا خطی
- **ایجاد نقشه سایت صاف شده**
- **تولید Relative Elevation Model (REM)**

### 9. تحلیل Watershed

- **تولید Watershed** و تعیین مناطق
- **تعیین مسیر احتمالی جریان‌ها** و مناطق زهکشی یا catchment
- **ارزیابی افزایش سطح آب** و پتانسیل سیل از Terrain بارگذاری شده

### 10. Path Profile و Viewshed

- **نمای پروفیل مقطع** Terrain از هر ویژگی خطی موجود یا رسم شده
- **محاسبه آمار ارتفاع و شیب** از پروفیل‌ها
- **تحلیل خط دید (Line-of-Sight)**:
  - تجسم موانع در طول مسیر
  - شامل ویژگی‌های برداری 3D
- **محاسبات Viewshed**:
  - شناسایی مناطق پوشیده یا پنهان شده
  - در تمام جهات درون شعاع مشخص شده
  - از یک موقعیت مشخص

### 11. بهینه‌سازی Workflow و پردازش داده

- **اتوماسیون با Global Mapper Script**:
  - پشتیبانی از import، تبدیل، reproject
  - تحلیل، محاسبه ویژگی‌ها
  - تقسیم لایه‌ها و export داده
- **ذخیره اسکریپت‌های مورد علاقه** برای اجرای سریع
- **پردازش دسته‌ای (Batch Processing)**:
  - تبدیل چند فایل انتخابی یا تمام فایل‌های سازگار در یک پوشه
  - تبدیل، reproject، gridding و تغییر نام
  - بدون نیاز به رندر کردن داده در viewer‌های مختلف

---

## نسخه‌های Global Mapper

### Global Mapper Standard

**ویژگی‌های اصلی:**

✅ پشتیبانی از import/export بیش از 300 فرمت فایل  
✅ دسترسی به منابع داده آنلاین  
✅ رسم، ویرایش، تحلیل و عملیات مکانی برداری  
✅ ویرایش، join، محاسبه، نمودار و query ویژگی‌ها  
✅ نقشه‌کشی موضوعی و Choropleth  
✅ طراحی نقشه و Layout پیش‌چاپ  
✅ نمایش، فیلتر و ویرایش دستی LiDAR  
✅ ایجاد و اصلاح Terrain  
✅ تحلیل Terrain شامل:
- تولید کانتور
- Line of Sight
- Viewshed
- Watershed
- شبیه‌سازی سیل

✅ محاسبه حجم، برآورد حجم توده، تحلیل Cut-and-Fill و تشخیص تغییرات  
✅ تجسم 3D غوطه‌وری، ایجاد و ویرایش داده‌های 3D، ضبط پرواز و انیمیشن لایه  
✅ Rectification تصویر  
✅ Blending، Feathering، Cropping و Pan Sharpening تصویر  
✅ Reclassify تصویر و رستری  
✅ محاسبه رستری شامل NDVI، NDWI، NBR و فرمول‌های سفارشی  
✅ Geocoding آدرس  
✅ تبدیل دسته‌ای فایل و اتوماسیون workflow با Global Mapper Script  
✅ یکپارچه‌سازی با اپلیکیشن Global Mapper Mobile  
✅ پشتیبانی GPS برای ردیابی و جمع‌آوری داده  
✅ Image blending، Feathering، تطبیق هیستوگرام، Cropping و Pan Sharpening

### Global Mapper Pro

**تمام ویژگی‌های Standard به علاوه:**

✨ **Terrain Painting**  
✨ **محاسبه Breakline**  
✨ **Query پیشرفته، ویرایش، تقسیم و فیلتر LiDAR و ابر نقاط 3D**  
✨ **طبقه‌بندی خودکار داده‌های Point Cloud** شامل:
- زمین (Ground)
- پوشش گیاهی (Vegetation)
- ساختمان‌ها (Buildings)
- خطوط برق (Power Lines)
- تیرها (Poles)

✨ **استخراج ویژگی‌های برداری از Point Cloud طبقه‌بندی شده**  
✨ **شناسایی و حذف نویز LiDAR**  
✨ **Variography و Kriging**  
✨ **نازک‌سازی Point Cloud و Rectification عمودی و افقی**  
✨ **تراز خودکار Point Cloud‌های همپوشان**  
✨ **تحلیل بصری Point Cloud** بر اساس:
- تراکم محلی
- ارتفاع از زمین
- شدت
- طبقه‌بندی

✨ **پروفایل Point Cloud**  
✨ **Pixels to Points®**: پردازش تصاویر Drone/UAV برای ایجاد:
- Point Cloud 3D
- Orthoimage
- مدل 3D

✨ **Vectorization خودکار پیشرفته** تصویر و Terrain  
✨ **پشتیبانی از دستگاه‌های RTK** و نمایش صورت‌فلکی ماهواره‌ای  
✨ **ویرایشگر داخلی برای Global Mapper Script**  
✨ **پشتیبانی از Python Scripting**  
✨ **ابزار Script Builder** برای ضبط اعمال در Global Mapper Script  
✨ **ادغام ساده‌تر داده موبایل**

---

## Global Mapper Suite

یک مجموعه جامع از برنامه‌های GIS دسکتاپ و موبایل به همراه یک SDK:

### Global Mapper Desktop
یک نرم‌افزار GIS همه‌کاره با تمام ابزارهای لازم برای پردازش داده‌های مکانی.

### Global Mapper Mobile
اپلیکیشن iOS و Android برای مشاهده و جمع‌آوری داده‌های GIS. نسخه Pro آن ابزارهای حرفه‌ای بیشتری ارائه می‌دهد.

### Global Mapper SDK
یک toolkit که دسترسی به بیشتر عملکردهای اپلیکیشن دسکتاپ را از درون یک اپلیکیشن موجود یا سفارشی فراهم می‌کند، به توسعه‌دهندگان داخلی اجازه می‌دهد تا نسخه‌ای منحصر به فرد از نرم‌افزار را برای نیازهای خاص خود ایجاد کنند.

---

## آخرین پیشرفت‌ها در Global Mapper V26.2

### 1. دسترسی آسان به فایل‌ها
- مرورگر فایل جدید قابل Dock
- پیدا کردن داده‌ها در یک مکان واحد

### 2. ایجاد انیمیشن بهبود یافته
- ابزارهای انیمیشن به‌روز شده
- ایجاد تجسم‌های پویا شامل:
  - سری‌های زمانی (Timeseries)
  - ویدیوها
  - چند انیمیشن در یک workspace

### 3. تجسم Terrain
- کنترل‌های Shader جدید برای نمایش بهتر Terrain

### 4. گسترش پشتیبانی از فرمت‌ها
- پشتیبانی از import برای:
  - تصاویر IIQ (Phase One)
  - OSM PBF (OpenStreetMap Protocolbuffer Binary)
  - TFADS-O (Table Formatted Aeronautical Data Set–Obstacles)
- پشتیبانی بهبود یافته از ECW و JPEG2000

---

## مقایسه با سیستم فعلی پروژه "کالک نگار"

### سیستم فعلی

پروژه "کالک نگار" از تکنولوژی‌های زیر استفاده می‌کند:

#### Frontend
- **OpenLayers**: کتابخانه JavaScript برای نمایش نقشه در مرورگر
- **React + TypeScript**: فریمورک اصلی
- **Material-UI**: کامپوننت‌های UI

#### Backend
- **PostGIS**: پایگاه داده مکانی
- **TileServer-GL**: سرور نقشه برای نقشه‌های آفلاین (.mbtiles)
- **GeoServer**: برای SDI (Spatial Data Infrastructure)
- **FastAPI (Python)**: API اصلی

#### ویژگی‌های فعلی
- نمایش نقشه با OpenLayers
- پشتیبانی از نقشه‌های آفلاین (MBTiles, XYZ Tiles)
- لایه‌های پایه، overlay و نظامی
- Timeline برای سناریوها
- نمایش واحدهای نظامی
- ترسیم و ویرایش ساده

---

## مقایسه ویژگی‌ها

| ویژگی | Global Mapper | سیستم فعلی (کالک نگار) |
|-------|---------------|------------------------|
| **نوع سیستم** | نرم‌افزار دسکتاپ | وب اپلیکیشن |
| **پشتیبانی فرمت** | 300+ فرمت | محدود (XYZ, MBTiles, GeoJSON) |
| **تحلیل مکانی** | بسیار پیشرفته | محدود |
| **تحلیل Terrain** | کامل | ندارد |
| **پردازش Point Cloud** | کامل (Pro) | ندارد |
| **تحلیل Watershed** | دارد | ندارد |
| **Viewshed** | دارد | ندارد |
| **پردازش تصویر** | پیشرفته | ندارد |
| **اتوماسیون** | Scripting (Global Mapper Script, Python) | API محدود |
| **چند پلتفرم** | Windows, Mac | وب (همه پلتفرم‌ها) |
| **قیمت** | تجاری (لایسنس) | رایگان (متن‌باز) |
| **انیمیشن** | کامل | محدود |
| **3D** | کامل | محدود |
| **جمع‌آوری داده موبایل** | Global Mapper Mobile | ندارد |

---

## امکان ادغام یا استفاده از Global Mapper در پروژه

### سناریو 1: استفاده به عنوان ابزار پردازش داده (پیشنهادی)

Global Mapper می‌تواند به عنوان یک ابزار **backend** برای پردازش و آماده‌سازی داده‌ها استفاده شود:

#### کاربردها:
1. **تبدیل و پردازش داده‌ها**:
   - تبدیل فرمت‌های مختلف به فرمت‌های قابل استفاده در وب (GeoJSON, MBTiles)
   - پردازش تصاویر ماهواره‌ای
   - تولید نقشه‌های Tile

2. **تحلیل و پردازش پیش‌محاسباتی**:
   - تولید Viewshed برای موقعیت‌های مشخص
   - تحلیل Watershed
   - تولید خطوط کانتور
   - پردازش Point Cloud

3. **اتوماسیون با Script**:
   - استفاده از Global Mapper Script برای پردازش دسته‌ای
   - ادغام در pipeline پردازش داده

#### مزایا:
- ✅ بدون تغییر در سیستم فعلی
- ✅ استفاده از قابلیت‌های پیشرفته Global Mapper
- ✅ نتایج پردازش شده در سیستم وب نمایش داده می‌شود

#### نحوه پیاده‌سازی:
```python
# مثال: استفاده از Global Mapper SDK یا اجرای Script
# در backend برای پردازش داده

import subprocess
import os

def process_with_global_mapper(input_file, output_format):
    """
    پردازش فایل با Global Mapper Script
    """
    script_content = f"""
    GLOBAL_MAPPER_SCRIPT VERSION=1.00
    IMPORT FILENAME="{input_file}"
    EXPORT_VECTOR FILENAME="{output_format}" TYPE={output_format.upper()}
    """
    
    script_file = "temp_script.gms"
    with open(script_file, "w") as f:
        f.write(script_content)
    
    # اجرای Global Mapper Script
    subprocess.run([
        "global_mapper.exe",
        script_file
    ])
```

---

### سناریو 2: ادغام با Global Mapper SDK

استفاده از **Global Mapper SDK** برای ادغام قابلیت‌های پردازش در backend:

#### مزایا:
- ✅ دسترسی مستقیم به API های Global Mapper
- ✅ کنترل بهتر روی پردازش
- ✅ عملکرد بهتر نسبت به Script

#### معایب:
- ❌ نیاز به لایسنس SDK (هزینه)
- ❌ نیاز به توسعه بیشتر

---

### سناریو 3: استفاده موبایل (Global Mapper Mobile)

استفاده از **Global Mapper Mobile** برای جمع‌آوری داده در میدان:

#### کاربرد:
- جمع‌آوری داده‌های مکانی در میدان
- همگام‌سازی با سیستم مرکزی
- استفاده از GPS برای موقعیت‌یابی دقیق

#### ادغام:
- داده‌های جمع‌آوری شده می‌تواند به سیستم وب منتقل شود
- نمایش در MapPage.tsx

---

## پیشنهادات برای پروژه کالک نگار

### پیشنهاد 1: استفاده محدود برای پردازش داده (توصیه می‌شود)

**هدف**: استفاده از Global Mapper فقط برای پردازش داده‌های پیچیده که در سیستم وب امکان‌پذیر نیست.

**اقدامات**:
1. نصب Global Mapper در سرور پردازش (اختیاری)
2. ایجاد Script های Global Mapper برای:
   - تبدیل فرمت‌های خاص
   - تولید Tile Map از داده‌های بزرگ
   - تحلیل Terrain و Viewshed
3. ایجاد API endpoint در backend برای فراخوانی پردازش‌ها

**مزایا**:
- ✅ بهبود قابلیت‌های سیستم بدون تغییر معماری
- ✅ هزینه کمتر (نیازی به لایسنس برای همه نیست)
- ✅ حفظ معماری وب‌محور

---

### پیشنهاد 2: توسعه قابلیت‌های مشابه (راه‌حل متن‌باز)

استفاده از کتابخانه‌های متن‌باز برای پیاده‌سازی برخی قابلیت‌های Global Mapper:

#### ابزارهای پیشنهادی:

1. **برای تحلیل Terrain**:
   - **GDAL/OGR**: تبدیل و پردازش داده‌های مکانی
   - **QGIS Processing**: برای تحلیل‌های پیشرفته
   - **GRASS GIS**: برای تحلیل‌های مکانی و Terrain

2. **برای پردازش Point Cloud**:
   - **PDAL (Point Data Abstraction Library)**: پردازش Point Cloud
   - **CloudCompare**: تجسم و تحلیل Point Cloud

3. **برای Viewshed/Watershed**:
   - **GDAL + Python**: پیاده‌سازی Viewshed
   - **Whitebox Tools**: ابزارهای تحلیل Terrain

4. **برای پردازش تصویر**:
   - **Rasterio**: خواندن و نوشتن داده‌های رستری
   - **scikit-image**: پردازش تصویر
   - **OpenCV**: پردازش تصویر پیشرفته

**مزایا**:
- ✅ رایگان و متن‌باز
- ✅ قابل کنترل کامل
- ✅ ادغام آسان‌تر با سیستم فعلی

**معایب**:
- ❌ نیاز به توسعه بیشتر
- ❌ ممکن است به اندازه Global Mapper کامل نباشد

---

### پیشنهاد 3: ترکیبی (توصیه نهایی)

**استراتژی ترکیبی**:

1. **برای پردازش‌های ساده و رایج**: استفاده از ابزارهای متن‌باز (GDAL, Rasterio)
2. **برای پردازش‌های پیچیده و تخصصی**: استفاده از Global Mapper (در صورت نیاز)
3. **برای جمع‌آوری داده موبایل**: بررسی Global Mapper Mobile یا توسعه اپلیکیشن موبایل خود

---

## مثال پیاده‌سازی: ادغام پردازش با Global Mapper

### ساختار پیشنهادی:

```
backend/
├── app/
│   ├── services/
│   │   ├── gis/
│   │   │   ├── __init__.py
│   │   │   ├── global_mapper.py  # رابط با Global Mapper
│   │   │   ├── terrain_analysis.py
│   │   │   ├── viewshed.py
│   │   │   └── watershed.py
│   │   └── ...
│   └── api/
│       └── routes/
│           └── gis_processing.py  # API endpoints برای پردازش
```

### مثال کد:

```python
# backend/app/services/gis/global_mapper.py

import subprocess
import tempfile
import os
from pathlib import Path
from typing import Optional, Dict, Any

class GlobalMapperService:
    """
    سرویس برای استفاده از Global Mapper Scripts
    """
    
    def __init__(self, global_mapper_path: Optional[str] = None):
        """
        Args:
            global_mapper_path: مسیر اجرای Global Mapper
                              (در صورت تنظیم نشدن از PATH استفاده می‌شود)
        """
        self.global_mapper_path = global_mapper_path or "global_mapper.exe"
    
    def convert_format(
        self, 
        input_file: str, 
        output_file: str, 
        output_format: str = "GEOJSON"
    ) -> bool:
        """
        تبدیل فرمت فایل با Global Mapper
        
        Args:
            input_file: مسیر فایل ورودی
            output_file: مسیر فایل خروجی
            output_format: فرمت خروجی (GEOJSON, SHAPEFILE, KML, ...)
        
        Returns:
            True در صورت موفقیت
        """
        script_content = f"""GLOBAL_MAPPER_SCRIPT VERSION=1.00
IMPORT FILENAME="{input_file}"
EXPORT_VECTOR FILENAME="{output_file}" TYPE={output_format.upper()}
"""
        
        return self._run_script(script_content)
    
    def generate_contours(
        self,
        elevation_file: str,
        output_file: str,
        interval: float = 10.0
    ) -> bool:
        """
        تولید خطوط کانتور از داده ارتفاعی
        
        Args:
            elevation_file: فایل داده ارتفاعی
            output_file: فایل خروجی (خطوط کانتور)
            interval: فاصله کانتور (متر)
        
        Returns:
            True در صورت موفقیت
        """
        script_content = f"""GLOBAL_MAPPER_SCRIPT VERSION=1.00
IMPORT FILENAME="{elevation_file}"
GENERATE_CONTOURS CONTOUR_INTERVAL={interval} OUTPUT_FILENAME="{output_file}"
"""
        
        return self._run_script(script_content)
    
    def calculate_viewshed(
        self,
        elevation_file: str,
        observer_point: tuple,  # (lon, lat)
        output_file: str,
        radius: float = 5000.0,
        observer_height: float = 1.7
    ) -> bool:
        """
        محاسبه Viewshed
        
        Args:
            elevation_file: فایل داده ارتفاعی
            observer_point: مختصات نقطه ناظر (طول، عرض)
            output_file: فایل خروجی
            radius: شعاع تحلیل (متر)
            observer_height: ارتفاع ناظر (متر)
        
        Returns:
            True در صورت موفقیت
        """
        lon, lat = observer_point
        script_content = f"""GLOBAL_MAPPER_SCRIPT VERSION=1.00
IMPORT FILENAME="{elevation_file}"
CALC_VIEWSHED OBSERVER_X={lon} OBSERVER_Y={lat} OBSERVER_HEIGHT={observer_height} RADIUS={radius} OUTPUT_FILENAME="{output_file}"
"""
        
        return self._run_script(script_content)
    
    def _run_script(self, script_content: str) -> bool:
        """
        اجرای Global Mapper Script
        
        Args:
            script_content: محتوای Script
        
        Returns:
            True در صورت موفقیت
        """
        # ایجاد فایل Script موقت
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.gms',
            delete=False
        ) as f:
            f.write(script_content)
            script_file = f.name
        
        try:
            # اجرای Global Mapper
            result = subprocess.run(
                [self.global_mapper_path, script_file],
                capture_output=True,
                text=True,
                timeout=300  # timeout 5 دقیقه
            )
            
            if result.returncode == 0:
                return True
            else:
                print(f"Global Mapper Error: {result.stderr}")
                return False
        
        except subprocess.TimeoutExpired:
            print("Global Mapper execution timeout")
            return False
        except Exception as e:
            print(f"Error running Global Mapper: {e}")
            return False
        finally:
            # حذف فایل Script موقت
            if os.path.exists(script_file):
                os.remove(script_file)


# استفاده در API
# backend/app/api/routes/gis_processing.py

from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.gis.global_mapper import GlobalMapperService

router = APIRouter(prefix="/gis", tags=["GIS Processing"])

gm_service = GlobalMapperService()

@router.post("/convert")
async def convert_file_format(
    input_file: UploadFile = File(...),
    output_format: str = "GEOJSON"
):
    """
    تبدیل فرمت فایل با Global Mapper
    """
    # ذخیره فایل ورودی
    input_path = f"/tmp/{input_file.filename}"
    with open(input_path, "wb") as f:
        f.write(await input_file.read())
    
    # تعیین مسیر خروجی
    output_path = f"/tmp/output.{output_format.lower()}"
    
    # تبدیل
    success = gm_service.convert_format(input_path, output_path, output_format)
    
    if not success:
        raise HTTPException(status_code=500, detail="Conversion failed")
    
    # بازگرداندن فایل خروجی
    return FileResponse(output_path)

@router.post("/viewshed")
async def calculate_viewshed(
    elevation_file: UploadFile = File(...),
    lon: float,
    lat: float,
    radius: float = 5000.0
):
    """
    محاسبه Viewshed
    """
    # پردازش مشابه...
    pass
```

---

## هزینه و لایسنس Global Mapper

### قیمت‌گذاری (تخمینی - نیاز به بررسی با شرکت):

- **Global Mapper Standard**: حدود $499 - $999 USD (یکباره)
- **Global Mapper Pro**: حدود $999 - $1,999 USD (یکباره)
- **Global Mapper SDK**: قیمت جداگانه (نیاز به تماس با شرکت)
- **لایسنس آکادمیک**: تخفیف برای استفاده‌های آموزشی

**نکته**: قیمت دقیق نیاز به تماس با Blue Marble Geographics دارد.

---

## نتیجه‌گیری و توصیه نهایی

### برای پروژه "کالک نگار":

#### ✅ توصیه می‌شود:
1. **استفاده محدود از Global Mapper** برای پردازش‌های پیچیده که در ابزارهای متن‌باز امکان‌پذیر نیست
2. **توسعه قابلیت‌های مشابه با ابزارهای متن‌باز** (GDAL, Rasterio, Whitebox Tools)
3. **ادغام پردازش‌ها در API** برای استفاده در سیستم وب

#### ❌ توصیه نمی‌شود:
1. جایگزین کردن کامل سیستم با Global Mapper (از دست دادن معماری وب)
2. خرید لایسنس برای همه کاربران (هزینه بالا)

#### 🎯 راه‌حل بهینه:
**استراتژی ترکیبی**:
- استفاده از ابزارهای متن‌باز برای اکثر نیازها
- استفاده از Global Mapper در صورت نیاز برای پردازش‌های تخصصی
- حفظ معماری وب‌محور فعلی

---

## منابع و لینک‌های مفید

- **وب‌سایت رسمی**: https://www.bluemarblegeo.com/global-mapper/
- **دانلود نسخه Trial**: https://www.bluemarblegeo.com/download/
- **مستندات**: https://www.bluemarblegeo.com/knowledge-base/
- **ویدیوهای آموزشی**: در وب‌سایت موجود است
- **تماس با پشتیبانی**: از طریق وب‌سایت

---

## تاریخ بررسی
**تاریخ**: 2025-01-XX  
**نسخه Global Mapper بررسی شده**: V26.2  
**پروژه**: کالک نگار (Kalk Negar)

---

**تهیه شده توسط**: بررسی سیستم AI  
**برای**: پروژه کالک نگار

