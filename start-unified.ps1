# اسکریپت یکدست راه‌اندازی پروژه
# این اسکریپت تمام مراحل راه‌اندازی را به صورت یکدست انجام می‌دهد

param(
    [switch]$Rebuild,
    [switch]$Purge,
    [switch]$SkipCheck,
    [switch]$SkipFrontend,
    [int]$PortWaitSeconds = 60,
    [string]$EnvFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# بررسی پیش‌نیازها
if (-not $SkipCheck) {
    Write-Host "`nبررسی پیش‌نیازها..." -ForegroundColor Cyan
    & "$PSScriptRoot\check-prerequisites.ps1" -Fix
    if ($LASTEXITCODE -ne 0) {
        Write-Error "بررسی پیش‌نیازها ناموفق بود. لطفاً خطاها را برطرف کنید."
        exit 1
    }
    Write-Host ""
}

# بررسی وجود docker-compose.yml
if (-not (Test-Path ".\docker-compose.yml")) {
    Write-Error "لطفاً این اسکریپت را از ریشه پروژه اجرا کنید (docker-compose.yml پیدا نشد)."
    exit 1
}

# ایجاد فایل .env در صورت نیاز
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "ایجاد فایل .env از .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✓ فایل .env ایجاد شد. لطفاً تنظیمات را بررسی کنید." -ForegroundColor Green
    } else {
        Write-Warning "فایل .env.example پیدا نشد. فایل .env را به صورت دستی ایجاد کنید."
    }
}

# راه‌اندازی Docker services
Write-Host "`nراه‌اندازی سرویس‌های Docker..." -ForegroundColor Cyan

if ($Purge) {
    Write-Host "پاک کردن کانتینرها و volumes..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
    try { 
        $ts = & docker ps -aq -f name=kalk-tileserver
        if ($ts) { 
            docker rm -f $ts | Out-Null 
        } 
    } catch {}
}

if ($Rebuild) {
    Write-Host "بازسازی کانتینرها..." -ForegroundColor Yellow
    docker compose down
    docker compose build --no-cache
}

$composeUpArgs = @("up", "-d")
if ($EnvFile) { 
    $composeUpArgs = @("--env-file", $EnvFile) + $composeUpArgs 
}
docker compose @composeUpArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "راه‌اندازی Docker services ناموفق بود."
    exit 1
}

# راه‌اندازی TileServer (در صورت وجود فایل‌های mbtiles)
$mapsDir = Join-Path $PWD "backend\static\maps"
try {
    $hasMbtiles = Test-Path (Join-Path $mapsDir "*.mbtiles")
    if ($hasMbtiles) {
        Write-Host "`nراه‌اندازی TileServer (maps)..." -ForegroundColor Cyan
        if ($EnvFile) {
            docker compose --env-file $EnvFile --profile maps up -d
        } else {
            docker compose --profile maps up -d
        }
    } else {
        Write-Host "`nفایل‌های .mbtiles پیدا نشد - TileServer راه‌اندازی نمی‌شود." -ForegroundColor Yellow
    }
} catch {
    Write-Warning "خطا در راه‌اندازی TileServer: $_"
}

# راه‌اندازی Frontend (در صورت نیاز)
if (-not $SkipFrontend) {
    Write-Host "`nراه‌اندازی Frontend..." -ForegroundColor Cyan
    
    # بررسی Node.js
    if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
        Write-Warning "Node.js پیدا نشد - Frontend راه‌اندازی نمی‌شود."
    } else {
        # نصب وابستگی‌ها
        function Install-Dependencies([string]$dir) {
            if (-not (Test-Path $dir)) { return }
            if (-not (Test-Path "$dir/node_modules")) {
                Write-Host "  نصب وابستگی‌ها برای $dir..." -ForegroundColor Yellow
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm ci" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
                if ($proc.ExitCode -ne 0) {
                    Write-Warning "npm ci در $dir ناموفق بود، استفاده از npm install..."
                    $proc2 = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm install" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
                    if ($proc2.ExitCode -ne 0) {
                        Write-Error "نصب وابستگی‌ها در $dir ناموفق بود."
                        return $false
                    }
                }
                Write-Host "  ✓ وابستگی‌های $dir نصب شد" -ForegroundColor Green
            } else {
                Write-Host "  ✓ وابستگی‌های $dir از قبل نصب است" -ForegroundColor Green
            }
            return $true
        }

        $dashboardOk = Install-Dependencies "front_dashboard"
        $kalknegarOk = Install-Dependencies "front_kalknegar"

        # راه‌اندازی سرورهای توسعه
        $windowStyle = 'Minimized'
        try { $null = $Host.UI.RawUI } catch { $windowStyle = 'Hidden' }

        if ($dashboardOk -and (Test-Path "front_dashboard")) {
            Write-Host "  راه‌اندازی Dashboard..." -ForegroundColor Yellow
            $spParams = @{ 
                FilePath = 'cmd.exe'
                ArgumentList = @('/c','npm run dev')
                WorkingDirectory = 'front_dashboard'
                WindowStyle = $windowStyle 
            }
            Start-Process @spParams
        }

        if ($kalknegarOk -and (Test-Path "front_kalknegar")) {
            Write-Host "  راه‌اندازی KalkNegar..." -ForegroundColor Yellow
            $spParamsK = @{ 
                FilePath = 'cmd.exe'
                ArgumentList = @('/c','npm run dev-host')
                WorkingDirectory = 'front_kalknegar'
                WindowStyle = $windowStyle 
            }
            Start-Process @spParamsK
        }

        # انتظار برای راه‌اندازی Vite servers
        Write-Host "`nمنتظر راه‌اندازی سرورهای Frontend..." -ForegroundColor Cyan
        $ports = @(3000, 5180)
        foreach ($p in $ports) {
            $ok = $false
            for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
                $listening = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
                if ($listening) { 
                    $ok = $true
                    Write-Host "  ✓ پورت $p آماده است" -ForegroundColor Green
                    break 
                }
                Start-Sleep -Seconds 1
            }
            if (-not $ok) { 
                Write-Warning "  ⚠ پورت $p بعد از $PortWaitSeconds ثانیه آماده نشد. بررسی کنید." 
            }
        }
    }
}

# انتظار برای API و اجرای migrations
Write-Host "`nمنتظر آماده شدن API..." -ForegroundColor Cyan

function Get-ApiContainerId { 
    (& docker compose ps -q api 2>$null).Trim() 
}

$apiId = Get-ApiContainerId
for ($i = 0; (($null -eq $apiId) -or ($apiId -eq "")); $i++) {
    if ($i -ge 30) { break }
    Start-Sleep -Seconds 1
    $apiId = Get-ApiContainerId
}

$healthy = $false
if ($apiId) {
    for ($i = 0; $i -lt 60; $i++) {
        $health = (& docker inspect -f "{{.State.Health.Status}}" $apiId 2>$null)
        if ($health -eq "healthy") { 
            $healthy = $true
            Write-Host "  ✓ API سالم است" -ForegroundColor Green
            break 
        }
        Start-Sleep -Seconds 1
    }
}

if (-not $healthy) {
    # Fallback: بررسی پورت 8000
    $ok = $false
    for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
        $listening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
        if ($listening) { 
            $ok = $true
            Write-Host "  ✓ API روی پورت 8000 در حال اجرا است" -ForegroundColor Green
            break 
        }
        Start-Sleep -Seconds 1
    }
    if (-not $ok) { 
        Write-Warning "  ⚠ API بعد از $PortWaitSeconds ثانیه آماده نشد. ادامه با migrations..." 
    }
}

# اجرای migrations
Write-Host "`nاجرای migrations دیتابیس..." -ForegroundColor Cyan
$maxTries = 10
$try = 1
while ($try -le $maxTries) {
    Write-Host "  تلاش $try از $maxTries..." -ForegroundColor Yellow
    $ErrorActionPreference = 'Continue'
    try {
        $result = & docker compose exec -T api sh -lc "alembic -c alembic.ini upgrade head" 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
    } catch {
        $result = $_.Exception.Message
        $exitCode = 1
    }
    $ErrorActionPreference = 'Stop'
    if ($exitCode -eq 0) {
        Write-Host "  ✓ Migrations با موفقیت اجرا شد" -ForegroundColor Green
        break
    }
    if ($try -lt $maxTries) {
        Write-Warning "  تلاش ناموفق. تلاش مجدد در 5 ثانیه..."
        Start-Sleep -Seconds 5
    }
    $try++
}

if ($try -gt $maxTries) {
    Write-Warning "اجرای migrations ناموفق بود. لاگ‌های API:"
    & docker compose logs --no-color --tail=200 api
}

# نمایش خلاصه
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "راه‌اندازی کامل شد!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "دسترسی به سرویس‌ها:" -ForegroundColor Yellow
Write-Host "  • API:           http://localhost:8000" -ForegroundColor White
Write-Host "  • API Docs:      http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  • Dashboard:     http://127.0.0.1:3000/" -ForegroundColor White
Write-Host "  • KalkNegar:     http://127.0.0.1:3000/kalknegar" -ForegroundColor White
Write-Host "  • KalkNegar (مستقیم): http://127.0.0.1:5180/kalknegar/" -ForegroundColor White
Write-Host ""
if ($SkipFrontend) {
    Write-Warning "سرورهای Frontend راه‌اندازی نشدند (-SkipFrontend)."
    Write-Host "برای راه‌اندازی دستی:" -ForegroundColor Yellow
    Write-Host "  cd front_dashboard && npm run dev" -ForegroundColor White
    Write-Host "  cd front_kalknegar && npm run dev-host" -ForegroundColor White
}
Write-Host ""
Write-Host "سرویس‌های اختیاری:" -ForegroundColor Yellow
Write-Host "  • TileServer:    docker compose --profile maps up -d" -ForegroundColor White
Write-Host "                  http://127.0.0.1:8480" -ForegroundColor White
Write-Host ""

