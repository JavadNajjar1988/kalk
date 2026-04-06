# قالب اکسل استاندارد — ایمپورت سناریو و منابع

فایل قالب رسمی را از داشبورد، بخش **مدیریت داده → دانلود قالب** بگیرید (`scenario_import_template.xlsx`).

## شیت «سناریو» (یا `scenario`)

| ستون | توضیح |
|------|--------|
| `name` / نام | عنوان سناریو (الزامی) |
| `description` / توضیح | متن توضیح |
| `start_time` / زمان شروع | ISO-8601 یا مهر زمانی میلی‌ثانیه |
| `time_zone` / منطقه زمانی | مثلاً `Asia/Tehran` یا `UTC` |
| `symbology_standard` | پیش‌فرض `app6` |

حداقل یک ردیف داده (ردیف ۲) لازم است.

## شیت «حوادث» (`events`)

| ستون | توضیح |
|------|--------|
| `id` / شناسه | اختیاری؛ در صورت خالی تولید می‌شود |
| `title` / عنوان | الزامی برای هر رویداد |
| `subtitle` / زیرعنوان | اختیاری |
| `start_time` | زمان رویداد |
| `lon` / `lat` | اختیاری؛ نقطه روی نقشه |

## شیت «یگان‌ها» (`units`)

| ستون | توضیح |
|------|--------|
| `id` / شناسه | اختیاری |
| `name` / نام | الزامی |
| `parent_id` / id والد | برای درخت سازمانی؛ خالی = ریشه |
| `side` / طرف | `friend`، `hostile`، `neutral` یا معادل فارسی (دوست، دشمن، …) |
| `unit_type` / نوع | `infantry`، `tank`، `naval`، `air` (برای نگاشت SIDC) |
| `time`، `lon`، `lat` | اختیاری برای اولین state موقعیت |

## شیت «تجهیزات» (`equipment`)

| ستون | توضیح |
|------|--------|
| `id`، `name`، `type`، `quantity`، `unit_id` | `unit_id` ارجاع به شناسه یگان در شیت یگان‌ها |

## شیت «پرسنل» (`personnel`)

| ستون | توضیح |
|------|--------|
| `first_name` / `last_name` یا `full_name` | نام |
| `rank` / درجه | |
| `specialty` / تخصص | |
| `national_id` / کد ملی | |
| `unit_id` | ارجاع به یگان |

---

**API بک‌اند**

- `POST /api/data-import/scenario/preview` — پیش‌نمایش بدون ذخیره  
- `POST /api/data-import/scenario/import` — ایجاد سناریو (نیاز به نقش فرمانده/سوپرادمین)  
- `POST /api/data-import/resources/import` — برگرداندن JSON پرسنل/تجهیز برای ادغام در داشبورد  
- `GET /api/data-import/excel-template` — دانلود قالب  

**AI اختیاری:** `INTERNAL_LLM_BASE_URL` در `.env` بک‌اند (مثلاً آدرس سرویس سازگار با OpenAI).
