# راهنمای کامل آدرس‌دهی نقشه‌های SQLite

## مقدمه

سیستم از متغیر `FILESYSTEM_TILE_ROOT` به عنوان **پایه** برای تمام مسیرهای نقشه استفاده می‌کند. مسیری که در فرم وارد می‌کنید باید **نسبی** به این پایه باشد.

---

## تنظیمات پایه

### متغیر `FILESYSTEM_TILE_ROOT`

این متغیر می‌تواند در دو جا تنظیم شود:

1. **در فایل `.env`** (اولویت اول)
2. **در `docker-compose.yml`** (مقدار پیش‌فرض)

#### مقدار پیش‌فرض:
```python
# در backend/app/core/config.py
FILESYSTEM_TILE_ROOT: str = "sat"
```

#### در Docker:
```yaml
# docker-compose.yml
environment:
  FILESYSTEM_TILE_ROOT: ${FILESYSTEM_TILE_ROOT:-/mnt/external-maps}
```

---

## سناریوهای مختلف

### سناریو 1: نقشه‌ها در پوشه محلی پروژه

**ساختار فایل‌ها:**
```
پروژه/
└── backend/
    └── static/
        └── maps/
            └── sat/              ← نقشه‌های شما اینجاست
                └── z3/
                    └── 0/
                        └── *.sqlitedb
```

**تنظیمات:**
```env
# .env
FILESYSTEM_TILE_ROOT=sat
# یا
FILESYSTEM_TILE_ROOT=backend/static/maps/sat
```

**مسیر وارد شده در فرم:**
- اگر `FILESYSTEM_TILE_ROOT=sat`: **خالی بگذارید** یا فقط `z3/0`
- اگر `FILESYSTEM_TILE_ROOT=backend/static/maps/sat`: **خالی بگذارید** یا فقط `z3/0`

---

### سناریو 2: نقشه‌ها در هارد خارجی (Docker)

**ساختار فایل‌ها (روی هارد خارجی):**
```
D:\maps\              (روی هارد خارجی)
└── sat/
    └── z3/
        └── 0/
            └── *.sqlitedb
```

**تنظیمات:**
```env
# .env
EXTERNAL_MAPS_PATH=D:/maps
FILESYSTEM_TILE_ROOT=/mnt/external-maps
```

**در Docker:**
```yaml
volumes:
  - ${EXTERNAL_MAPS_PATH:-./backend/static/maps}:/mnt/external-maps:ro
environment:
  FILESYSTEM_TILE_ROOT: /mnt/external-maps
```

**مسیر وارد شده در فرم:**
- `sat` (اگر نقشه در `/mnt/external-maps/sat` است)
- `sat/z3/0` (اگر می‌خواهید مستقیماً به zoom level خاص اشاره کنید)

---

### سناریو 3: نقشه‌ها در چند پوشه مختلف

**ساختار فایل‌ها:**
```
/mnt/external-maps/
├── sat/
│   └── z3/0/*.sqlitedb
├── tehran/
│   └── z15/0/0/*.sqlitedb
└── isfahan/
    └── z10/1/2/*.sqlitedb
```

**تنظیمات:**
```env
FILESYSTEM_TILE_ROOT=/mnt/external-maps
```

**مسیر وارد شده در فرم:**
- برای نقشه اول: `sat`
- برای نقشه دوم: `tehran`
- برای نقشه سوم: `isfahan`

---

## قوانین آدرس‌دهی

### ✅ درست:

1. **مسیر نسبی از ریشه:**
   ```
   FILESYSTEM_TILE_ROOT = /mnt/external-maps
   مسیر وارد شده: sat
   نتیجه: /mnt/external-maps/sat
   ```

2. **مسیر نسبی با زیرپوشه:**
   ```
   FILESYSTEM_TILE_ROOT = /mnt/external-maps
   مسیر وارد شده: sat/z3/0
   نتیجه: /mnt/external-maps/sat/z3/0
   ```

3. **مسیر خالی (استفاده از ریشه):**
   ```
   FILESYSTEM_TILE_ROOT = /mnt/external-maps
   مسیر وارد شده: (خالی)
   نتیجه: /mnt/external-maps
   ```

### ❌ اشتباه:

1. **مسیر کامل از هاست:**
   ```
   ❌ app/backend/static/maps/sat
   ❌ D:/maps/sat
   ✅ sat
   ```

2. **مسیر absolute خارج از محدوده:**
   ```
   ❌ /mnt/external-maps/sat  (اگر FILESYSTEM_TILE_ROOT=/mnt/external-maps باشد)
   ✅ sat
   ```

3. **مسیر با نام پایه تکراری:**
   ```
   ❌ external-maps/sat  (اگر base_root نامش external-maps باشد)
   ✅ sat
   ```

---

## الگوریتم حل مسیر (Path Resolution)

کد backend به ترتیب این مسیرها را امتحان می‌کند:

```python
# 1. اگر مسیر absolute است
if raw.is_absolute():
    candidate = raw  # مستقیم استفاده می‌شود

# 2. مسیر نسبی به base_root
candidate = base_root / raw

# 3. اگر نام اولین بخش برابر با نام base_root است
if raw.parts[0] == base_root.name:
    candidate = base_root.parent / raw
```

**نکته مهم:** مسیر نهایی باید **داخل** `base_root` باشد، در غیر این صورت خطای "خارج از محدوده" می‌دهد.

---

## مثال‌های کاربردی

### مثال 1: نقشه در پوشه محلی

**موقعیت فایل‌ها:**
```
C:\Users\AI\Documents\GitHub\kalk\
└── backend\
    └── static\
        └── maps\
            └── sat\
                └── z3\
                    └── 0\
                        └── 0.0.sqlitedb
```

**تنظیمات `.env`:**
```env
FILESYSTEM_TILE_ROOT=backend/static/maps/sat
```

**در فرم وارد کنید:**
```
z3/0
```
یا
```
(خالی - اگر نقشه مستقیماً در sat است)
```

---

### مثال 2: نقشه در هارد خارجی

**موقعیت فایل‌ها (روی هارد):**
```
E:\Maps\
└── sat\
    └── z3\
        └── 0\
            └── 0.0.sqlitedb
```

**تنظیمات `.env`:**
```env
EXTERNAL_MAPS_PATH=E:/Maps
FILESYSTEM_TILE_ROOT=/mnt/external-maps
```

**در `docker-compose.yml`:**
```yaml
volumes:
  - E:/Maps:/mnt/external-maps:ro
```

**در فرم وارد کنید:**
```
sat
```
یا
```
sat/z3/0
```

---

## نحوه تشخیص مسیر صحیح

### روش 1: استفاده از Dropdown (توصیه می‌شود)

1. به **Dashboard → Resources → Maps → ثبت پوشه** بروید
2. سیستم به صورت خودکار تمام پوشه‌های موجود را پیدا می‌کند
3. از dropdown لیست یک پوشه انتخاب کنید
4. مسیر نسبی به صورت خودکار وارد می‌شود

### روش 2: محاسبه دستی

1. **مسیر کامل فایل‌ها را بنویسید:**
   ```
   /mnt/external-maps/sat/z3/0
   ```

2. **مقدار `FILESYSTEM_TILE_ROOT` را ببینید:**
   ```
   FILESYSTEM_TILE_ROOT = /mnt/external-maps
   ```

3. **مسیر ریشه را حذف کنید:**
   ```
   /mnt/external-maps/sat/z3/0
   - /mnt/external-maps
   = sat/z3/0
   ```

4. **مسیر وارد شده:** `sat/z3/0`

---

## پاسخ به سوالات شما

### سوال 1: آیا می‌توانم از `app/backend/static/maps/sat` استفاده کنم؟

**پاسخ:** ❌ **خیر**

این مسیر اشتباه است چون:
- این مسیر کامل از هاست است
- باید نسبی به `FILESYSTEM_TILE_ROOT` باشد
- اگر `FILESYSTEM_TILE_ROOT = /mnt/external-maps` باشد، این مسیر خارج از محدوده است

**راه صحیح:**
- اگر نقشه در `backend/static/maps/sat` است، `FILESYSTEM_TILE_ROOT` را `backend/static/maps/sat` تنظیم کنید
- سپس در فرم فقط `z3/0` یا خالی بگذارید

---

### سوال 2: آیا می‌توانم از `/mnt/external-maps/sat` استفاده کنم؟

**پاسخ:** ⚠️ **بستگی دارد**

**اگر `FILESYSTEM_TILE_ROOT = /mnt/external-maps`:**
- ❌ مسیر `/mnt/external-maps/sat` **اشتباه** است (absolute path خارج از محدوده)
- ✅ مسیر `sat` **درست** است (relative path)

**اگر `FILESYSTEM_TILE_ROOT = /mnt/external-maps/sat`:**
- ✅ مسیر خالی یا `z3/0` **درست** است

---

## جدول راهنمای سریع

| موقعیت نقشه | FILESYSTEM_TILE_ROOT | مسیر وارد شده | توضیح |
|-------------|---------------------|---------------|-------|
| `backend/static/maps/sat` | `sat` | `z3/0` | مسیر نسبی |
| `backend/static/maps/sat` | `backend/static/maps/sat` | (خالی) | استفاده از ریشه |
| `/mnt/external-maps/sat` | `/mnt/external-maps` | `sat` | مسیر نسبی |
| `/mnt/external-maps/sat/z3/0` | `/mnt/external-maps` | `sat/z3/0` | مسیر نسبی با زیرپوشه |
| `D:/maps/sat` (Docker) | `/mnt/external-maps` | `sat` | بعد از mount |

---

## عیب‌یابی

### خطا: "مسیر خارج از محدوده مجاز"

**علت:** مسیر وارد شده خارج از `FILESYSTEM_TILE_ROOT` است

**راه‌حل:**
1. مقدار `FILESYSTEM_TILE_ROOT` را بررسی کنید
2. مسیر وارد شده را به **نسبی** تبدیل کنید
3. از dropdown لیست استفاده کنید

### خطا: "پوشه یافت نشد"

**علت:** پوشه در مسیر مشخص شده وجود ندارد

**راه‌حل:**
1. مطمئن شوید پوشه وجود دارد
2. مسیر را از dropdown انتخاب کنید
3. `FILESYSTEM_TILE_ROOT` را بررسی کنید

### خطا: "هیچ فایل SQLite یافت نشد"

**علت:** پوشه انتخاب شده فایل `.sqlitedb` ندارد

**راه‌حل:**
1. مطمئن شوید پوشه شامل فایل‌های `.sqlitedb` است
2. ساختار باید `z{zoom}/{x_group}/{y_group}/...sqlitedb` باشد
3. پوشه‌ای انتخاب کنید که حداقل یک فایل `.sqlitedb` در زیرپوشه‌هایش دارد

---

## خلاصه

✅ **قانون طلایی:** همیشه از **مسیر نسبی** نسبت به `FILESYSTEM_TILE_ROOT` استفاده کنید

✅ **بهترین روش:** از dropdown لیست پوشه‌های موجود استفاده کنید

✅ **فرمت صحیح:** `نام_نقشه/زیرپوشه/...` (بدون مسیر کامل)

❌ **هرگز استفاده نکنید:**
- مسیر کامل از هاست (مثل `app/backend/static/maps/sat`)
- مسیر absolute خارج از محدوده (مثل `/mnt/external-maps/sat` وقتی base_root همان است)

---

**آخرین به‌روزرسانی:** 2025-01-XX  
**پروژه:** کالک نگار (Kalk Negar)

