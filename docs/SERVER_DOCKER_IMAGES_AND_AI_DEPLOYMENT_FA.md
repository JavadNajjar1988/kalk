# راهنمای ساخت، انتقال و استقرار ایمیج‌های داکر و مدل‌های هوش مصنوعی

این راهنما برای مسئول استقرار سرور سامانه کالک تهیه شده است. فرض اصلی این است که
سرور مقصد لینوکسی است، داکر و افزونه ترکیب داکر روی آن نصب شده‌اند و انتقال فایل با
دسترسی امن انجام می‌شود.

هدف این راهنما، استقرار نسخه تازه برنامه بدون حذف اطلاعات قبلی و راه‌اندازی مدل‌های
مورد نیاز کالک‌یار است. دستورها مرحله‌به‌مرحله نوشته شده‌اند. هر مرحله را کامل کنید و
بعد سراغ مرحله بعد بروید.

> هشدار مهم: فرمانی که گزینه `-v` دارد می‌تواند جلدهای پایدار و اطلاعات پایگاه داده را
> حذف کند. در سرور عملیاتی، فرمان `docker compose down -v` را اجرا نکنید.

## ۱. واژه‌های لازم

- ایمیج، بسته فقط‌خواندنی برنامه و وابستگی‌های آن است.
- ظرف، نمونه در حال اجرای یک ایمیج است.
- جلد، محل پایدار نگهداری اطلاعات است. با تعویض ایمیج نباید حذف شود.
- برچسب انتشار، نام دقیق یک نسخه از ایمیج است؛ مانند مقدار زیر:

```text
2026.09.13-f4951fc
```

- فایل محیطی، تنظیمات و رمزهای سرور را نگه می‌دارد. نام آن چنین است:

```text
.env
```

## ۲. اجزای قابل استقرار پروژه

در روش استقرار یکپارچه، دو ایمیج اختصاصی ساخته می‌شود:

| جزء | نام ایمیج | محتوا |
|---|---|---|
| رابط وب | `kalk-web` | داشبورد، کالک‌نگار، شبیه‌ساز و وب‌سرور |
| رابط برنامه | `kalk-api` | رابط پایتونی، مهاجرت پایگاه داده و پردازش‌های سمت سرور |

ایمیج‌های زیر نیز باید روی سرور موجود باشند:

| جزء | نام ایمیج |
|---|---|
| پایگاه داده مکانی | `postgis/postgis:16-3.4` |
| سرویس نقشه | `maptiler/tileserver-gl` |
| اجرای مدل زبانی | `ollama/ollama` |

ایمیج یکپارچه وب باید از پرونده زیر ساخته شود. این ایمیج همه خروجی‌های وب و دارایی‌های
شبیه‌ساز را در خود دارد؛ بنابراین فایل‌های ساخته‌شده رابط وب را دستی و گزینشی روی
سرور کپی نکنید.

```text
web/Dockerfile
```

## ۳. پیش‌بررسی سرور مقصد

ابتدا وارد سرور شوید و مشخصات واقعی آن را ثبت کنید:

```bash
hostnamectl
uname -m
nproc
free -h
df -h
docker version
docker compose version
docker info
```

معماری سرور و معماری ایمیج باید یکسان باشند. در بیشتر سرورهای شرکت مقدار مورد انتظار
چنین است:

```text
x86_64
```

در داکر، نام همین معماری معمولاً مقدار زیر است:

```text
linux/amd64
```

اگر قرار است از کارت گرافیک انویدیا استفاده شود، این فرمان نیز باید بدون خطا مشخصات
کارت و حافظه تصویری را نمایش دهد:

```bash
nvidia-smi
```

برای اجرای هم‌زمان برنامه، مدل زبانی ۹ میلیارد پارامتری و بازشناسی سند، مقدارهای زیر
پیشنهاد عملی هستند:

- دست‌کم ۳۲ گیگابایت حافظه اصلی؛
- دست‌کم ۱۶ گیگابایت حافظه تصویری برای اجرای هم‌زمان روان‌تر؛
- دست‌کم ۶۰ گیگابایت فضای آزاد، افزون بر فضای نقشه‌ها و پایگاه داده؛
- پردازنده چند‌هسته‌ای و فضای کافی در محل داده‌های داکر.

اگر سرور کمتر از این مقدارها دارد، ابتدا فقط برنامه را مستقر کنید. انتقال چندین
گیگابایت مدل به سروری که توان اجرای آن را ندارد، فایده‌ای ندارد.

### مدل‌ها و فایل‌های دقیق مورد نیاز

برای این پروژه دو مدل اصلی و چهار فایل ضروری وجود دارد. فایل‌های `mmproj` مدل جداگانه
نیستند؛ بخش تصویرنگار همان مدل‌اند و برای ورودی تصویر باید کنار فایل اصلی قرار گیرند.

| کاربرد | مدل | فایل اصلی | فایل تصویرنگار |
|---|---|---|---|
| تحلیل متن، پیشنهاد داده و استانداردسازی اکسل | `Qwen3.5-9B` | `Qwen3.5-9B-Q4_K_M.gguf` | `mmproj-Qwen3.5-9B-BF16.gguf` |
| خواندن تصویر و سند | `PaddleOCR-VL-1.5` | `PaddleOCR-VL-1.5.gguf` | `mmproj-PaddleOCR-VL-1.5-BF16.gguf` |

حجم تقریبی فایل‌های موجود و تأییدشده روی رایانه مبدا چنین است:

| فایل | حجم تقریبی |
|---|---:|
| `Qwen3.5-9B-Q4_K_M.gguf` | ۵٫۲۴ گیگابایت |
| `mmproj-Qwen3.5-9B-BF16.gguf` | ۰٫۸۶ گیگابایت |
| `PaddleOCR-VL-1.5.gguf` | ۰٫۸۷ گیگابایت |
| `mmproj-PaddleOCR-VL-1.5-BF16.gguf` | ۰٫۸۲ گیگابایت |

فایل زیر یک رونوشت همسان از تصویرنگار مدل بازشناسی است و لازم نیست جداگانه منتقل شود:

```text
PaddleOCR-VL-1.5-mmproj.gguf
```

اثر انگشت دو فایل تصویرنگار مدل بازشناسی روی رایانه مبدا یکسان بوده است. مسئول سرور
باید یکی از آن‌ها را منتقل کند و اثر انگشت فایل مقصد را با مبدا مقایسه کند.

مدل‌های دیگر موجود روی رایانه، از جمله نسخه ۴ میلیارد پارامتری، نسخه ۲۷ میلیارد
پارامتری و نسخه‌های قدیمی بازشناسی، جزو این استقرار نیستند.

## ۴. انتخاب شناسه انتشار

کار ساخت ایمیج باید روی نسخه تأییدشده مخزن انجام شود. در رایانه ساخت، وارد پوشه اصلی
پروژه شوید و وضعیت را بررسی کنید:

```powershell
Set-Location D:\Projects\GitHub\kalk
git status --short
git branch --show-current
git rev-parse HEAD
```

اگر خروجی وضعیت شامل تغییرهای تأییدنشده است، ساخت انتشار را متوقف کنید. برای ساخت
برچسب قابل ردیابی در پاورشل از تاریخ و هفت نویسه نخست شناسه تعهد استفاده کنید:

```powershell
$kalkCommit = git rev-parse --short=7 HEAD
$kalkRelease = "$(Get-Date -Format 'yyyy.MM.dd')-$kalkCommit"
$kalkRelease
```

مقدار نمایش‌داده‌شده را در صورت‌جلسه استقرار ثبت کنید. در ادامه راهنما، عبارت زیر
نماینده همین مقدار است:

```text
RELEASE_TAG
```

## ۵. ساخت ایمیج‌های پروژه

داکر باید روی رایانه ساخت اجرا شده باشد. از پوشه اصلی پروژه این فرمان‌ها را اجرا
کنید. مقدار واقعی برچسب را جایگزین کنید:

```powershell
docker build --platform linux/amd64 --pull -t kalk-api:RELEASE_TAG .\backend
docker build --platform linux/amd64 --pull -f .\web\Dockerfile -t kalk-web:RELEASE_TAG .
```

نکته مهم این است که زمینه ساخت ایمیج وب، ریشه پروژه است. اجرای ساخت از داخل پوشه وب
درست نیست، زیرا این ایمیج باید هر سه رابط داشبورد، کالک‌نگار و شبیه‌ساز را بردارد.

پس از ساخت، ایمیج‌ها را بررسی کنید:

```powershell
docker image inspect kalk-api:RELEASE_TAG --format '{{.Id}} {{.Os}}/{{.Architecture}}'
docker image inspect kalk-web:RELEASE_TAG --format '{{.Id}} {{.Os}}/{{.Architecture}}'
docker image ls kalk-api
docker image ls kalk-web
```

در صورت نیاز به استقرار کاملاً بدون اینترنت، ایمیج‌های جانبی را نیز برای معماری سرور
دریافت کنید:

```powershell
docker pull --platform linux/amd64 postgis/postgis:16-3.4
docker pull --platform linux/amd64 maptiler/tileserver-gl:latest
docker pull --platform linux/amd64 ollama/ollama:latest
```

استفاده از برچسب `latest` برای انتشارهای بعدی باید با ثبت شناسه دقیق ایمیج همراه باشد:

```powershell
docker image inspect maptiler/tileserver-gl:latest --format '{{index .RepoDigests 0}}'
docker image inspect ollama/ollama:latest --format '{{index .RepoDigests 0}}'
```

## ۶. آزمون اولیه ایمیج‌ها پیش از خروجی‌گرفتن

قبل از انتقال، ایمیج‌ها را با فایل استقرار آزمایشی بالا بیاورید. حداقل این موارد باید
بررسی شوند:

```powershell
docker image inspect kalk-api:RELEASE_TAG
docker image inspect kalk-web:RELEASE_TAG
```

اگر یک محیط آزمایشی در دسترس است، صفحه اصلی و سلامت رابط برنامه را کنترل کنید:

```text
http://SERVER_IP:3000/
http://SERVER_IP:8002/api/health
```

پاسخ مسیر سلامت باید دارای وضعیت موفق و کد `200` باشد. نمایش درست صفحه اصلی به‌تنهایی
کافی نیست؛ مسیرهای زیر نیز باید باز شوند:

```text
/kalknegar/
/simulator/
```

## ۷. خروجی‌گرفتن از ایمیج‌ها

یک پوشه تازه برای بسته انتشار بسازید:

```powershell
$kalkPackage = Join-Path $PWD "output\server-release\$kalkRelease"
New-Item -ItemType Directory -Force -Path $kalkPackage | Out-Null
```

ایمیج‌های اختصاصی را در یک بایگانی ذخیره کنید:

```powershell
docker image save --output "$kalkPackage\kalk-app-$kalkRelease.tar" `
  "kalk-api:$kalkRelease" `
  "kalk-web:$kalkRelease"
```

برای بسته کاملاً بدون اینترنت، ایمیج‌های جانبی را نیز جداگانه ذخیره کنید:

```powershell
docker image save --output "$kalkPackage\kalk-dependencies.tar" `
  postgis/postgis:16-3.4 `
  maptiler/tileserver-gl:latest `
  ollama/ollama:latest
```

از هر فایل یک اثر انگشت بسازید تا خرابی فایل هنگام انتقال قابل تشخیص باشد:

```powershell
Get-FileHash "$kalkPackage\kalk-app-$kalkRelease.tar" -Algorithm SHA256 |
  Format-List | Out-File "$kalkPackage\kalk-app-$kalkRelease.tar.sha256.txt"

Get-FileHash "$kalkPackage\kalk-dependencies.tar" -Algorithm SHA256 |
  Format-List | Out-File "$kalkPackage\kalk-dependencies.tar.sha256.txt"
```

پرونده‌های زیر نیز باید همراه بسته باشند، ولی فایل محرمانه محیطی نباید از رایانه ساخت
کپی شود:

```text
deploy/server/docker-compose.server.yml
deploy/server/docker-compose.gpu.yml
deploy/server/.env.server.example
```

این سه پرونده به‌صورت آماده در مخزن قرار دارند. آن‌ها را در پوشه انتشار کپی کنید:

```powershell
Copy-Item .\deploy\server\docker-compose.server.yml $kalkPackage
Copy-Item .\deploy\server\docker-compose.gpu.yml $kalkPackage
Copy-Item .\deploy\server\.env.server.example $kalkPackage
```

## ۸. انتقال بسته به سرور

روی سرور یک مسیر ثابت برای انتشارها بسازید:

```bash
sudo install -d -m 0750 -o "$USER" -g "$USER" /opt/kalk/releases
sudo install -d -m 0750 -o "$USER" -g "$USER" /opt/kalk/backups
mkdir -p /opt/kalk/releases/RELEASE_TAG
```

انتقال با پوسته امن از رایانه ویندوزی نمونه زیر را دارد:

```powershell
scp "$kalkPackage\*" SERVER_USER@SERVER_IP:/opt/kalk/releases/RELEASE_TAG/
```

اگر از نرم‌افزار انتقال پرونده استفاده می‌شود، از روش امن استفاده کنید و مقصد را دقیقاً
روی پوشه همان انتشار قرار دهید. بایگانی‌ها را در مسیر عمومی وب قرار ندهید.

پس از انتقال، اثر انگشت فایل روی سرور را بگیرید و با مقدار رایانه ساخت مقایسه کنید:

```bash
cd /opt/kalk/releases/RELEASE_TAG
sha256sum kalk-app-RELEASE_TAG.tar
sha256sum kalk-dependencies.tar
```

حتی یک نویسه اختلاف به معنی انتقال ناقص یا تغییر فایل است. در این حالت فایل را بارگذاری
نکنید و دوباره انتقال دهید.

## ۹. بارگذاری ایمیج‌ها روی سرور

ایمیج‌ها را از بایگانی وارد داکر کنید:

```bash
cd /opt/kalk/releases/RELEASE_TAG
docker image load --input kalk-app-RELEASE_TAG.tar
docker image load --input kalk-dependencies.tar
```

سپس وجود برچسب‌ها و معماری را کنترل کنید:

```bash
docker image ls --digests
docker image inspect kalk-api:RELEASE_TAG --format '{{.Id}} {{.Os}}/{{.Architecture}}'
docker image inspect kalk-web:RELEASE_TAG --format '{{.Id}} {{.Os}}/{{.Architecture}}'
```

اگر خطای ناسازگاری معماری دیده شد، ایمیج باید دوباره با معماری درست ساخته شود. شبیه‌سازی
معماری روی سرور عملیاتی راه‌حل مناسبی نیست.

## ۱۰. نگهداری رمزها و تنظیمات سرور

فایل زیر فقط روی سرور ساخته می‌شود و نباید وارد گیت یا پیام‌رسان شود:

```text
/opt/kalk/current/.env
```

برای تولید رمزهای مناسب می‌توان از این فرمان‌ها استفاده کرد:

```bash
openssl rand -hex 24
openssl rand -hex 32
openssl rand -base64 36
```

مقدار `JWT_SECRET` باید دست‌کم ۳۲ بایت باشد. نمونه زیر فقط قالب است و مقدارهای
`CHANGE_ME` باید پیش از اجرا عوض شوند:

```dotenv
KALK_RELEASE=RELEASE_TAG

POSTGRES_USER=kalk
POSTGRES_PASSWORD=CHANGE_ME_DATABASE_PASSWORD
POSTGRES_DB=kalk
DB_URL=postgresql+asyncpg://kalk:CHANGE_ME_DATABASE_PASSWORD@db:5432/kalk

DISABLE_AUTH=false
JWT_SECRET=CHANGE_ME_WITH_AT_LEAST_32_RANDOM_BYTES
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_BOOTSTRAP_PASSWORD=CHANGE_ME_ADMIN_PASSWORD

CORS_ORIGINS=["https://kalk.example.ir"]

INTERNAL_LLM_BASE_URL=http://ollama:11434
INTERNAL_LLM_API_KEY=
INTERNAL_LLM_MODEL=qwen3.5:9b

DOCUMENT_LLM_BASE_URL=http://ollama:11434
DOCUMENT_LLM_MODEL=qwen3.5:9b
DOCUMENT_OCR_BASE_URL=http://ollama:11434
DOCUMENT_OCR_MODEL=qwen3.5:9b
DOCUMENT_OCR_PIPELINE_URL=

DOCUMENT_JOB_DIR=/app/backend/static/document-imports
FILESYSTEM_TILE_ROOT=/app/backend/static/maps
```

رمز پایگاه داده در دو مقدار `POSTGRES_PASSWORD` و `DB_URL` باید یکسان باشد. اگر رمز
دارای نویسه‌های ویژه نشانی است، باید در نشانی اتصال کدگذاری شود. برای مسئول تازه‌کار، یک
مقدار تصادفی شانزده‌شانزدهی طولانی، احتمال خطای کدگذاری را کمتر می‌کند.

مجوز فایل را محدود کنید:

```bash
chmod 600 /opt/kalk/current/.env
```

## ۱۱. اصول فایل استقرار سرور

فایل عملیاتی باید از `image` استفاده کند، نه از `build`. یعنی سرور فقط ایمیج تأییدشده
را اجرا کند و دوباره از روی سورس نسازد. نمونه نام‌گذاری دو سرویس اختصاصی چنین است:

```yaml
services:
  migrate:
    image: kalk-api:${KALK_RELEASE}
    restart: "no"
    env_file: .env
    command: ["sh", "-lc", "alembic -c alembic.ini upgrade head"]

  api:
    image: kalk-api:${KALK_RELEASE}
    restart: unless-stopped
    env_file: .env

  web:
    image: kalk-web:${KALK_RELEASE}
    restart: unless-stopped
    ports:
      - "3000:3000"
```

در فایل کامل، موارد زیر باید حفظ شوند:

- جلد پایگاه داده روی مسیر داخلی پایگاه داده؛
- جلد نقشه‌ها میان رابط برنامه و سرویس نقشه؛
- جلد پرونده‌های پردازش سند؛
- شبکه مشترک میان وب، رابط برنامه، پایگاه داده، سرویس نقشه و مدل‌ها؛
- اجرای مهاجرت پس از آماده‌شدن پایگاه داده و پیش از شروع رابط برنامه؛
- بررسی سلامت رابط برنامه از مسیر درست.

مسیر سلامت رابط برنامه چنین است:

```text
/api/health
```

برای اینکه نام جلدها با عوض‌شدن پوشه انتشار تغییر نکند، نام صریح تعریف کنید:

```yaml
volumes:
  db-data:
    name: kalk-db-data
  maps-data:
    name: kalk-maps-data
  document-imports:
    name: kalk-document-imports
  ollama-models:
    name: kalk-ollama-models
```

تعویض ایمیج به حذف این جلدها نیاز ندارد.

نمونه کامل آماده در مسیر زیر است:

```text
deploy/server/docker-compose.server.yml
```

برای نصب نخست روی سرور، پرونده‌ها را به مسیر جاری منتقل کنید و نمونه محیطی را کپی
کنید:

```bash
mkdir -p /opt/kalk/current
cp /opt/kalk/releases/RELEASE_TAG/docker-compose.server.yml /opt/kalk/current/
cp /opt/kalk/releases/RELEASE_TAG/docker-compose.gpu.yml /opt/kalk/current/
cp /opt/kalk/releases/RELEASE_TAG/.env.server.example /opt/kalk/current/.env
chmod 600 /opt/kalk/current/.env
```

سپس همه مقدارهای `CHANGE_ME` را در فایل محیطی عوض کنید.

## ۱۲. پشتیبان‌گیری پیش از تعویض نسخه

ابتدا نام واقعی ظرف‌ها را ببینید:

```bash
docker compose -f docker-compose.server.yml ps
```

از پایگاه داده یک نسخه پشتیبان منطقی بگیرید:

```bash
mkdir -p /opt/kalk/backups/RELEASE_TAG
docker compose -f docker-compose.server.yml exec -T db \
  pg_dump -U kalk -d kalk -Fc \
  > /opt/kalk/backups/RELEASE_TAG/kalk-before-deploy.dump
```

فایل نباید خالی باشد:

```bash
ls -lh /opt/kalk/backups/RELEASE_TAG/kalk-before-deploy.dump
```

از فایل استقرار و تنظیمات نیز با مجوز محدود نسخه پشتیبان بگیرید:

```bash
cp docker-compose.server.yml /opt/kalk/backups/RELEASE_TAG/
cp .env /opt/kalk/backups/RELEASE_TAG/env.private.backup
chmod 600 /opt/kalk/backups/RELEASE_TAG/env.private.backup
```

نسخه پشتیبان پایگاه داده را روی همان دیسکی که پایگاه داده قرار دارد تنها نگذارید. طبق
سیاست شرکت، یک رونوشت رمزگذاری‌شده در محل پشتیبان مستقل نگهداری شود.

## ۱۳. استقرار نسخه تازه برنامه

ابتدا فایل ترکیب را بدون نمایش عمومی رمزها اعتبارسنجی کنید:

```bash
cd /opt/kalk/current
docker compose -f docker-compose.server.yml config --quiet
```

ایمیج مورد استفاده هر سرویس را ببینید:

```bash
docker compose -f docker-compose.server.yml config --images
```

سپس سرویس‌ها را بالا بیاورید:

```bash
docker compose -f docker-compose.server.yml up -d
```

وضعیت و گزارش‌ها را کنترل کنید:

```bash
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml logs --tail=200 migrate
docker compose -f docker-compose.server.yml logs --tail=200 api
docker compose -f docker-compose.server.yml logs --tail=100 web
```

مهاجرت باید با کد خروج موفق پایان یابد. رابط برنامه، پایگاه داده و سرویس نقشه باید
سالم باشند. اگر رابط برنامه پیوسته از نو آغاز می‌شود، قبل از هر تغییر دیگری گزارش آن
را بخوانید.

## ۱۴. آزمون پذیرش برنامه

روی خود سرور این آزمون‌ها را انجام دهید:

```bash
curl -fsS http://127.0.0.1:8002/api/health
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/kalknegar/
curl -I http://127.0.0.1:3000/simulator/
```

سپس از یک رایانه دیگر در شبکه، همان مسیرها را با نشانی واقعی سرور باز کنید. افزون بر
کد پاسخ موفق، این موارد را دستی کنترل کنید:

- قلم‌ها و تصویرهای داشبورد بارگذاری شوند؛
- کالک‌نگار باز شود؛
- شبیه‌ساز بدون خطای دارایی‌های سزیوم باز شود؛
- ورود کاربر کار کند؛
- یک سناریوی قبلی و یک نقشه قبلی همچنان موجود باشند؛
- درخواست رابط برنامه به‌جای سند وب، پاسخ داده واقعی برگرداند.

پاسخ `200` برای یک فایل جاوااسکریپت کافی نیست. نوع محتوای فایل نیز باید درست باشد؛
برگشتن صفحه اصلی به‌جای فایل مورد درخواست، نشانه استقرار ناقص رابط وب است.

### استقرار از طریق پرتنر

اگر مدیریت سرور با `Portainer` انجام می‌شود، بایگانی ایمیج‌ها باید روی همان موتور داکری
بارگذاری شود که محیط پرتنر به آن متصل است. بارگذاری ایمیج روی رایانه‌ای دیگر باعث
دیده‌شدن آن در پشته سرور نمی‌شود.

پس از اجرای `docker image load` روی میزبان درست، در بخش ایمیج‌های پرتنر وجود این دو
برچسب را کنترل کنید:

```text
kalk-api:RELEASE_TAG
kalk-web:RELEASE_TAG
```

سپس در پشته موجود سامانه فقط برچسب دو ایمیج را تغییر دهید. تعریف جلدهای پایدار، نام
شبکه‌ها و تنظیمات محیطی پشته قبلی را حذف نکنید. اگر گزینه دریافت دوباره ایمیج فعال است
ولی ایمیج‌ها در مخزن شبکه‌ای وجود ندارند، آن گزینه را برای این استقرار آفلاین فعال
نکنید.

پس از به‌روزرسانی پشته، از صفحه وضعیت پرتنر فقط به سبز یا «در حال اجرا» بودن اکتفا
نکنید. گزارش مهاجرت، گزارش رابط برنامه و درخواست مستقیم مسیر سلامت را نیز بررسی کنید.
در پشته فعلی سامانه، درگاه‌های متداول بیرونی چنین‌اند:

```text
وب: 3000
رابط برنامه: 8002
```

## ۱۵. نصب اجرای مدل زبانی روی سرور

روش ساده و قابل نگهداری برای مدل زبانی، اجرای آن در یک ظرف داکر با جلد پایدار است.
سرویس مدل را در همان شبکه داخلی برنامه قرار دهید. اگر کارت گرافیک وجود ندارد، گزینه
کارت گرافیک را حذف کنید؛ اجرای مدل روی پردازنده بسیار کندتر خواهد بود.

نمونه سرویس:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    volumes:
      - ollama-models:/root/.ollama
    networks:
      - kalknet
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

فایل اصلی آماده، اجرای پردازنده‌ای را تعریف می‌کند. برای کارت گرافیک انویدیا، پرونده
افزوده زیر نیز در مخزن آماده است:

```text
deploy/server/docker-compose.gpu.yml
```

در حالت کارت گرافیک، فرمان‌های ترکیب باید هر دو پرونده را دریافت کنند:

```bash
docker compose -f docker-compose.server.yml -f docker-compose.gpu.yml \
  --profile ai up -d ollama
```

درگاه مدل را بی‌دلیل روی اینترنت یا شبکه عمومی منتشر نکنید. رابط برنامه از طریق نام
سرویس و شبکه داخلی به آن دسترسی دارد:

```text
http://ollama:11434
```

پس از اجرای ظرف، مدل پیشنهادی را دریافت کنید:

```bash
docker compose -f docker-compose.server.yml up -d ollama
docker compose -f docker-compose.server.yml exec ollama ollama pull qwen3.5:9b
docker compose -f docker-compose.server.yml exec ollama ollama list
```

این مدل در جلد زیر می‌ماند و با تعویض ظرف دوباره دریافت نمی‌شود:

```text
kalk-ollama-models
```

برای آزمون رابط سازگار با برنامه، از داخل ظرف رابط برنامه درخواست بفرستید:

```bash
docker compose -f docker-compose.server.yml exec -T api \
  curl -fsS http://ollama:11434/v1/models
```

یک آزمون واقعی تولید پاسخ نیز لازم است:

```bash
docker compose -f docker-compose.server.yml exec -T api \
  curl -fsS http://ollama:11434/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen3.5:9b","messages":[{"role":"user","content":"فقط واژه آماده را برگردان."}],"stream":false}'
```

دیدن مدل در فهرست به‌تنهایی ثابت نمی‌کند که حافظه کافی برای تولید پاسخ وجود دارد.

## ۱۶. قرار دادن مدل موجود بدون دریافت دوباره

اگر فایل مدل با قالب `GGUF` از قبل در شرکت موجود است، آن را با روش امن به مسیر اختصاصی
سرور منتقل کنید:

```bash
sudo install -d -m 0750 -o "$USER" -g "$USER" /opt/kalk/models/qwen
```

اثر انگشت فایل را در مبدا و مقصد مقایسه کنید:

```bash
sha256sum /opt/kalk/models/qwen/model.gguf
```

پوشه مدل را فقط‌خواندنی به ظرف مدل متصل کنید:

```yaml
services:
  ollama:
    volumes:
      - ollama-models:/root/.ollama
      - /opt/kalk/models:/models:ro
```

یک فایل تعریف مدل بسازید:

```text
FROM /models/qwen/model.gguf
```

فرض می‌شود این فایل در مسیر زیر قرار گرفته است:

```text
/opt/kalk/models/qwen/Modelfile
```

مدل را با یک شناسه ثابت در اجرای مدل ثبت کنید:

```bash
docker compose -f docker-compose.server.yml exec ollama \
  ollama create kalk-qwen3.5-9b -f /models/qwen/Modelfile
```

در این حالت مقدارهای مدل در فایل محیطی باید با شناسه ثبت‌شده یکسان شوند:

```dotenv
INTERNAL_LLM_MODEL=kalk-qwen3.5-9b
DOCUMENT_LLM_MODEL=kalk-qwen3.5-9b
```

هر فایل `GGUF` الزاماً با هر اجراکننده‌ای سازگار نیست. اگر ثبت مدل خطا داد، نام دقیق
معماری، نوع فشرده‌سازی و گزارش خطا را ثبت کنید و مدل دیگری را خودسرانه جایگزین نکنید.

## ۱۷. آماده‌سازی داکر برای کارت گرافیک انویدیا

درایور باید پیش از ابزار اتصال کارت گرافیک به داکر نصب و با `nvidia-smi` تأیید شده
باشد. در اوبونتو یا دبیان، پس از افزودن مخزن رسمی، ابزار انویدیا را نصب کنید و داکر را
پیکربندی کنید. نسخه بسته را مطابق مستند رسمی روز نصب انتخاب کنید.

```bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl gnupg2

curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

دسترسی داکر به کارت را آزمایش کنید:

```bash
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi
```

اگر این آزمون خطا دارد، سرویس مدل را اجرا نکنید. ابتدا درایور و ابزار اتصال داکر را
اصلاح کنید.

## ۱۸. نصب سرویس کامل بازشناسی سند

بازشناسی سند دو حالت دارد:

1. مسیر جایگزین بینایی از طریق رابط سازگار مدل؛
2. زنجیره کامل تشخیص صفحه‌آرایی با مسیر زیر:

```text
/layout-parsing
```

برای جدول، سند چندستونه، نقشه و اسکن پیچیده، حالت دوم لازم است. این سرویس را با
راه‌اندازی رسمی `PaddleOCR-VL` اجرا کنید. انتخاب ایمیج و تنظیم شتاب‌دهنده به نسل کارت
گرافیک وابسته است؛ تنظیم مخصوص کارت‌های بلک‌ول را روی کارت قدیمی استفاده نکنید.

اگر شرکت از قبل نسخه `GGUF` این مدل را نگه می‌دارد، فایل اصلی به‌تنهایی برای ورودی
تصویر کافی نیست و فایل تصویرنگار متناظر که معمولاً با نام `mmproj` شناخته می‌شود نیز
باید همراه آن منتقل شود. اثر انگشت هر دو فایل را کنترل کنید. این دو فایل برای اجرای
جایگزین سازگار با `llama.cpp` یا نرم‌افزار مدیریت مدل مناسب‌اند؛ اما زنجیره کامل
صفحه‌آرایی همچنان سرویس جداگانه `/layout-parsing` است.

اگر فایل‌های `GGUF` مدل بازشناسی با یک سرویس جداگانه سازگار با رابط مدل اجرا می‌شوند،
تنظیم مستقیم برنامه باید به همان سرویس اشاره کند. شناسه مدل باید دقیقاً از خروجی
`/v1/models` خوانده شود. نمونه متداول چنین است:

```dotenv
DOCUMENT_OCR_BASE_URL=http://paddle-vlm:1234
DOCUMENT_OCR_MODEL=paddlepaddle/paddleocr-vl-1.5-gguf/paddleocr-vl-1.5.gguf
```

اگر زنجیره رسمی بازشناسی نصب شده باشد، تنظیم اصلی این است:

```dotenv
DOCUMENT_OCR_PIPELINE_URL=http://paddleocr-vl:8080
```

این دو مسیر نقش یکسان ندارند. مسیر نخست مدل بینایی مستقیم است و مسیر دوم تشخیص کامل
صفحه‌آرایی، ترتیب خواندن و جدول‌ها را انجام می‌دهد.

روند نصب:

```bash
cd /opt
sudo git clone https://github.com/PaddlePaddle/PaddleOCR.git
sudo chown -R "$USER":"$USER" /opt/PaddleOCR
cd /opt/PaddleOCR
```

در راهنمای رسمی، پوشه شتاب‌دهنده متناسب با کارت را انتخاب کنید. برای کارت‌های بلک‌ول
با قابلیت محاسباتی `sm120` مسیر شناخته‌شده چنین است:

```text
deploy/paddleocr_vl_docker/accelerators/nvidia-gpu-sm120
```

فایل نمونه محیطی همان سرویس را کپی و مقادیرش را مطابق راهنمای همان پوشه تنظیم کنید،
سپس سرویس را بالا بیاورید:

```bash
cp .env.example .env
docker compose up -d
docker compose ps
docker compose logs --tail=200
```

در نسخه‌ای که روی درگاه محلی `8080` اجرا می‌شود، سلامت و مسیر پردازش را بررسی کنید:

```bash
curl -fsS http://127.0.0.1:8080/health
```

در پروژه کالک، درگاه `8080` ممکن است با سرویس نقشه سازمانی تداخل داشته باشد. در این
حالت، نگاشت میزبان را مثلاً به `18080` تغییر دهید، ولی درگاه داخلی ظرف را تغییر ندهید.

اگر سرویس بازشناسی در همان شبکه داکر و با نام `paddleocr-vl` قرار دارد، تنظیم برنامه
چنین است:

```dotenv
DOCUMENT_OCR_PIPELINE_URL=http://paddleocr-vl:8080
```

اگر در یک ترکیب جدا اجرا می‌شود، هر دو ترکیب را به یک شبکه خارجی مشترک متصل کنید:

```bash
docker network create kalk-ai
```

در هر دو فایل ترکیب، شبکه را خارجی تعریف کنید:

```yaml
networks:
  kalk-ai:
    external: true
```

نام سرویس بازشناسی باید در همان شبکه قابل تبدیل به نشانی باشد. از داخل ظرف رابط برنامه
آزمون کنید:

```bash
docker compose -f docker-compose.server.yml exec -T api \
  curl -fsS http://paddleocr-vl:8080/health
```

سپس مقدار زیر را در فایل محیطی ثبت کنید و فقط رابط برنامه را دوباره ایجاد کنید:

```dotenv
DOCUMENT_OCR_PIPELINE_URL=http://paddleocr-vl:8080
```

```bash
docker compose -f docker-compose.server.yml up -d --force-recreate api
```

## ۱۹. آزمون پذیرش مدل‌ها در کالک‌یار

پس از راه‌اندازی، این ترتیب را رعایت کنید:

1. فهرست مدل‌ها را از داخل ظرف رابط برنامه بگیرید.
2. یک درخواست واقعی تولید متن اجرا کنید.
3. سلامت سرویس بازشناسی را بگیرید.
4. در رابط کالک‌یار، وضعیت هر دو خدمت را کنترل کنید.
5. یک متن کوتاه فارسی را پردازش کنید.
6. یک تصویر یا پرونده اسکن‌شده را پردازش کنید.
7. یک سند واقعی دارای جدول و چند ستون را آزمایش کنید.

نتیجه استخراج باید ابتدا به‌صورت پیشنهاد قابل بازبینی نشان داده شود. داده مدل نباید
بدون تأیید کاربر به سناریو یا فهرست منابع وارد شود.

برای ثبت پذیرش، این موارد را بنویسید:

- برچسب انتشار برنامه؛
- شناسه و اثر انگشت ایمیج‌ها؛
- شناسه دقیق مدل‌ها؛
- نوع و مقدار حافظه کارت گرافیک؛
- زمان پردازش متن و سند نمونه؛
- بیشینه مصرف حافظه؛
- نتیجه آزمون مسیرهای سلامت؛
- نام مسئول و زمان استقرار.

## ۲۰. به‌روزرسانی نسخه‌های بعدی

برای هر انتشار تازه:

1. یک برچسب تازه بسازید و از برچسب قبلی استفاده مجدد نکنید.
2. ایمیج‌ها را بسازید و آزمایش کنید.
3. بایگانی و اثر انگشت تازه تولید کنید.
4. پیش از استقرار از پایگاه داده پشتیبان بگیرید.
5. فقط مقدار `KALK_RELEASE` را به نسخه تازه تغییر دهید.
6. سرویس‌ها را دوباره ایجاد کنید.
7. آزمون پذیرش را کامل کنید.
8. ایمیج قبلی را تا پایان دوره بازگشت نگه دارید.

برای مشاهده ایمیج‌های بلااستفاده، فقط بررسی کنید:

```bash
docker image ls
docker system df -v
```

حذف ایمیج قدیمی باید بعد از تأیید نسخه جدید و با نام دقیق انجام شود. از پاک‌سازی کلی و
خودکار روی سرور عملیاتی پرهیز کنید.

## ۲۱. بازگشت به نسخه قبل

اگر نسخه تازه مشکل دارد، مقدار `KALK_RELEASE` را به برچسب قبلی برگردانید:

```dotenv
KALK_RELEASE=PREVIOUS_RELEASE_TAG
```

سپس سرویس‌های برنامه را دوباره ایجاد کنید:

```bash
docker compose -f docker-compose.server.yml up -d --force-recreate web api
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml logs --tail=200 api web
```

بازگرداندن ایمیج، مهاجرت پایگاه داده را خودکار به عقب برنمی‌گرداند. اگر انتشار تازه
ساختار پایگاه داده را ناسازگار تغییر داده باشد، بازگردانی پایگاه داده باید طبق برنامه
مهاجرت و با نسخه پشتیبان انجام شود. این کار بدون تأیید مسئول فنی انجام نشود.

## ۲۲. خطاهای رایج

| نشانه | علت محتمل | بررسی یا اقدام |
|---|---|---|
| رابط برنامه پیوسته آغاز می‌شود | رمز توکن کوتاه یا تنظیم پایگاه داده اشتباه است | گزارش رابط برنامه و مقدارهای مؤثر محیطی را بررسی کنید |
| صفحه اصلی باز است ولی شبیه‌ساز خراب است | رابط وب ناقص یا گزینشی کپی شده است | ایمیج کامل `kalk-web` را دوباره مستقر کنید |
| فایل جاوااسکریپت پاسخ موفق دارد ولی اجرا نمی‌شود | وب‌سرور صفحه اصلی را به‌جای فایل برگردانده است | نوع محتوا و بدنه پاسخ را کنترل کنید |
| مدل در فهرست دیده می‌شود ولی پاسخ نمی‌دهد | حافظه کافی نیست یا مدل بارگذاری نشده است | درخواست واقعی و گزارش اجرای مدل را بررسی کنید |
| رابط برنامه به مدل وصل نمی‌شود | دو سرویس در یک شبکه نیستند یا نام سرویس اشتباه است | از داخل ظرف رابط برنامه نام و درگاه را آزمایش کنید |
| جدول سند به‌هم می‌ریزد | فقط مسیر بینایی ساده فعال است | زنجیره کامل `/layout-parsing` را فعال کنید |
| خطای کارت گرافیک دیده می‌شود | ابزار انویدیا برای داکر آماده نیست | آزمون `nvidia-smi` داخل ظرف را اجرا کنید |
| پس از استقرار داده‌ها نیستند | جلدهای تازه با نام دیگری ساخته شده‌اند | نام جلدهای قبلی را پیدا و فایل ترکیب را اصلاح کنید؛ جلدی را حذف نکنید |
| مهاجرت شکست خورده است | پایگاه داده آماده نیست یا نسخه مهاجرت ناسازگار است | گزارش‌های پایگاه داده و مهاجرت را بخوانید و استقرار را متوقف کنید |

## ۲۳. فرمان‌های تشخیصی بی‌خطر

این فرمان‌ها چیزی را حذف نمی‌کنند و برای جمع‌آوری وضعیت مناسب‌اند:

```bash
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml images
docker compose -f docker-compose.server.yml logs --tail=200
docker ps -a
docker image ls --digests
docker volume ls
docker network ls
docker system df -v
docker inspect CONTAINER_NAME
```

هنگام ارسال گزارش خطا، رمزها و خروجی کامل متغیرهای محیطی را حذف کنید. گزارش مناسب باید
شامل زمان خطا، برچسب انتشار، نام سرویس، آخرین دویست خط گزارش و نتیجه مسیر سلامت باشد.

## ۲۴. کارهایی که نباید انجام شوند

- جلد پایگاه داده یا نقشه را هنگام تعویض نسخه حذف نکنید.
- فایل `.env` را در گیت ثبت نکنید.
- از یک برچسب ثابت برای چند ساخت متفاوت استفاده نکنید.
- فایل‌های خروجی وب را دستی و ناقص روی سرور کپی نکنید.
- درگاه مدل‌ها و پایگاه داده را بدون دیواره آتش در اینترنت عمومی باز نکنید.
- سالم‌بودن برنامه را فقط از روی وضعیت «در حال اجرا» نتیجه نگیرید.
- سالم‌بودن مدل را فقط از روی فهرست مدل‌ها نتیجه نگیرید.
- پیش از تأیید نسخه تازه، ایمیج نسخه قبلی را حذف نکنید.
- برای رفع کمبود فضا، پاک‌سازی کلی داکر را بدون بررسی مالکیت جلدها اجرا نکنید.

## ۲۵. فهرست تحویل مسئول سرور

پیش از اعلام پایان کار، همه گزینه‌های زیر باید تأیید شده باشند:

- [ ] معماری، حافظه، دیسک و کارت گرافیک سرور ثبت شده است.
- [ ] شناسه تعهد و برچسب انتشار ثبت شده است.
- [ ] اثر انگشت بایگانی‌ها در مبدا و مقصد یکسان است.
- [ ] از پایگاه داده پشتیبان گرفته شده است.
- [ ] جلدهای قبلی حذف یا تغییر نام داده نشده‌اند.
- [ ] مهاجرت پایگاه داده با موفقیت پایان یافته است.
- [ ] رابط برنامه و صفحه اصلی پاسخ موفق می‌دهند.
- [ ] کالک‌نگار و شبیه‌ساز کامل باز می‌شوند.
- [ ] داده‌ها و نقشه‌های قبلی دیده می‌شوند.
- [ ] مدل زبانی یک پاسخ واقعی تولید می‌کند.
- [ ] سرویس بازشناسی یک سند نمونه را پردازش می‌کند.
- [ ] درگاه‌های داخلی مدل در اینترنت عمومی منتشر نشده‌اند.
- [ ] روش بازگشت و برچسب نسخه قبلی ثبت شده است.

## ۲۶. منابع رسمی

- مستند ساخت بایگانی ایمیج داکر:

  https://docs.docker.com/reference/cli/docker/image/save/

- مستند بارگذاری بایگانی ایمیج داکر:

  https://docs.docker.com/reference/cli/docker/image/load/

- مستند جلدهای پایدار داکر:

  https://docs.docker.com/engine/storage/volumes/

- نصب اجرای مدل با داکر:

  https://docs.ollama.com/docker

- رابط سازگار اجرای مدل:

  https://docs.ollama.com/api/openai-compatibility

- واردکردن مدل با قالب `GGUF`:

  https://docs.ollama.com/import

- نصب ابزار اتصال کارت گرافیک انویدیا به داکر:

  https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html

- مستند رسمی `PaddleOCR-VL`:

  https://paddlepaddle.github.io/PaddleX/latest/en/pipeline_usage/tutorials/ocr_pipelines/PaddleOCR-VL.html

راهنمای ویژه مدل‌ها و مسیر بازشناسی سند در همین مخزن نیز موجود است:

```text
docs/AI_MODELS_INSTALLATION_FA.md
docs/paddleocr-vl-server.md
```
