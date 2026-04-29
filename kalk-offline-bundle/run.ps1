# =============================================================================
# Kalk Offline Bundle - Runner
# اجرای ساده روی سیستم مقصد:
#   1) فایل .env را از .env.example بسازید (اگر وجود ندارد)
#   2) ایمیج‌ها را از فولدر images بارگذاری کنید (فقط بار اول)
#   3) سرویس‌ها را با docker compose بالا بیاورید
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==> Kalk Offline Bundle Runner" -ForegroundColor Cyan

# 1) بررسی Docker
Write-Host "==> بررسی Docker ..."
try {
    docker --version | Out-Null
    docker compose version | Out-Null
} catch {
    Write-Error "Docker یا Docker Compose در دسترس نیست. لطفاً Docker Desktop را نصب و اجرا کنید."
    exit 1
}

# 2) ساخت .env در صورت نبود
$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"
if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "==> فایل .env از .env.example ساخته شد" -ForegroundColor Yellow
    } else {
        Write-Error "فایل .env.example پیدا نشد"
        exit 1
    }
}

# 3) بارگذاری ایمیج‌ها (در صورت نبود)
$imagesDir = Join-Path $PSScriptRoot "images"
if (-not (Test-Path $imagesDir)) {
    Write-Error "فولدر images پیدا نشد"
    exit 1
}

$expectedImages = @(
    @{ Tag = "kalk-api:1.1.0";              File = "kalk-api_1.1.0.tar" },
    @{ Tag = "kalk-web:1.3.0";              File = "kalk-web_1.3.0.tar" },
    @{ Tag = "postgis/postgis:16-3.4";      File = "postgis_16-3.4.tar" },
    @{ Tag = "maptiler/tileserver-gl:latest"; File = "tileserver-gl_latest.tar" }
)

foreach ($img in $expectedImages) {
    $hasImage = $false
    try {
        docker image inspect $img.Tag | Out-Null
        $hasImage = $true
    } catch {
        $hasImage = $false
    }

    if (-not $hasImage) {
        $tarPath = Join-Path $imagesDir $img.File
        if (-not (Test-Path $tarPath)) {
            Write-Error "فایل ایمیج پیدا نشد: $tarPath"
            exit 1
        }
        Write-Host "==> در حال بارگذاری ایمیج $($img.Tag) از $($img.File) ..." -ForegroundColor Yellow
        docker load -i $tarPath
        if ($LASTEXITCODE -ne 0) {
            Write-Error "بارگذاری ایمیج $($img.Tag) ناموفق بود"
            exit 1
        }
    } else {
        Write-Host "==> ایمیج $($img.Tag) از قبل موجود است (skip)" -ForegroundColor DarkGray
    }
}

# 4) بالا آوردن سرویس‌ها
Write-Host "==> اجرای docker compose up -d ..." -ForegroundColor Cyan
Push-Location $PSScriptRoot
try {
    docker compose -f docker-compose.offline.yml up -d
    if ($LASTEXITCODE -ne 0) { throw "compose up failed" }

    Write-Host "==> وضعیت سرویس‌ها:" -ForegroundColor Cyan
    docker compose -f docker-compose.offline.yml ps

    Write-Host ""
    Write-Host "آدرس‌های سرویس‌ها:" -ForegroundColor Green
    Write-Host "  Dashboard:  http://localhost:3000/"
    Write-Host "  KalkNegar:  http://localhost:3000/kalknegar/"
    Write-Host "  Simulator:  http://localhost:3000/simulator/"
    Write-Host "  API:        http://localhost:8002/api"
    Write-Host "  Postgres:   localhost:5432 (user=postgres, db=kalk)"
} finally {
    Pop-Location
}
