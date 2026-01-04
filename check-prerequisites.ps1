# اسکریپت بررسی پیش‌نیازهای پروژه
# این اسکریپت تمام پیش‌نیازها را بررسی می‌کند

param(
    [switch]$Fix
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$errors = @()
$warnings = @()
$info = @()

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "بررسی پیش‌نیازهای پروژه Kalk" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# بررسی Node.js
Write-Host "[1/6] بررسی Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($nodeMajor -ge 20) {
            Write-Host "  ✓ Node.js $nodeVersion نصب است" -ForegroundColor Green
            $info += "Node.js: $nodeVersion"
        } elseif ($nodeMajor -ge 18) {
            Write-Host "  ⚠ Node.js $nodeVersion نصب است (پیشنهاد: >= 20.10.0)" -ForegroundColor Yellow
            $warnings += "Node.js نسخه $nodeVersion - برای front_kalknegar نیاز به >= 20.10.0 است"
        } else {
            Write-Host "  ✗ Node.js $nodeVersion قدیمی است (نیاز: >= 18.0.0)" -ForegroundColor Red
            $errors += "Node.js نسخه $nodeVersion - نیاز به >= 18.0.0"
        }
    } else {
        Write-Host "  ✗ Node.js نصب نیست" -ForegroundColor Red
        $errors += "Node.js نصب نیست - از https://nodejs.org/ دانلود کنید"
    }
} catch {
    Write-Host "  ✗ Node.js نصب نیست" -ForegroundColor Red
    $errors += "Node.js نصب نیست - از https://nodejs.org/ دانلود کنید"
}

# بررسی npm
Write-Host "[2/6] بررسی npm..." -ForegroundColor Yellow
try {
    $npmVersion = $null
    $npmCommand = $null
    $npmVersion = & cmd.exe /c "npm --version" 2>$null
    if (-not $npmVersion) {
        $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
        if ($npmCommand) {
            $npmVersion = & $npmCommand.Source --version 2>$null
        }
    }
    if ($npmVersion -is [array]) {
        $npmVersion = $npmVersion | Select-Object -First 1
    }
    if ($npmVersion) {
        $npmMajor = [int]($npmVersion -split '\.')[0]
        if ($npmMajor -ge 9) {
            Write-Host "  ✓ npm $npmVersion نصب است" -ForegroundColor Green
            $info += "npm: $npmVersion"
        } else {
            Write-Host "  ⚠ npm $npmVersion قدیمی است (پیشنهاد: >= 9.0.0)" -ForegroundColor Yellow
            $warnings += "npm نسخه $npmVersion - پیشنهاد: >= 9.0.0"
        }
    } else {
        Write-Host "  ✗ npm نصب نیست" -ForegroundColor Red
        $errors += "npm نصب نیست"
    }
} catch {
    Write-Host "  ✗ npm نصب نیست" -ForegroundColor Red
    $errors += "npm نصب نیست"
}

# بررسی Docker
Write-Host "[3/6] بررسی Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "  ✓ Docker نصب است: $dockerVersion" -ForegroundColor Green
        $info += "Docker: $dockerVersion"
        
        # بررسی اجرای Docker
        try {
            docker ps 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Docker در حال اجرا است" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Docker نصب است اما اجرا نیست" -ForegroundColor Red
                $errors += "Docker Desktop را اجرا کنید"
            }
        } catch {
            Write-Host "  ✗ Docker نصب است اما اجرا نیست" -ForegroundColor Red
            $errors += "Docker Desktop را اجرا کنید"
        }
    } else {
        Write-Host "  ✗ Docker نصب نیست" -ForegroundColor Red
        $errors += "Docker نصب نیست - از https://www.docker.com/products/docker-desktop/ دانلود کنید"
    }
} catch {
    Write-Host "  ✗ Docker نصب نیست" -ForegroundColor Red
    $errors += "Docker نصب نیست - از https://www.docker.com/products/docker-desktop/ دانلود کنید"
}

# بررسی Docker Compose
Write-Host "[4/6] بررسی Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>$null
    if ($composeVersion) {
        Write-Host "  ✓ Docker Compose نصب است: $composeVersion" -ForegroundColor Green
        $info += "Docker Compose: $composeVersion"
    } else {
        Write-Host "  ✗ Docker Compose نصب نیست" -ForegroundColor Red
        $errors += "Docker Compose نصب نیست"
    }
} catch {
    Write-Host "  ✗ Docker Compose نصب نیست" -ForegroundColor Red
    $errors += "Docker Compose نصب نیست"
}

# بررسی پورت‌ها
Write-Host "[5/6] بررسی پورت‌ها..." -ForegroundColor Yellow
$ports = @(
    @{Port=3000; Service="Dashboard"},
    @{Port=5180; Service="KalkNegar"},
    @{Port=8000; Service="API"},
    @{Port=5432; Service="PostgreSQL"}
)

foreach ($p in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host "  ⚠ پورت $($p.Port) ($($p.Service)) اشغال است" -ForegroundColor Yellow
        $warnings += "پورت $($p.Port) ($($p.Service)) اشغال است"
    } else {
        Write-Host "  ✓ پورت $($p.Port) ($($p.Service)) آزاد است" -ForegroundColor Green
    }
}

# بررسی فایل .env
Write-Host "[6/6] بررسی فایل .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ فایل .env وجود دارد" -ForegroundColor Green
    $info += "فایل .env موجود است"
} else {
    Write-Host "  ⚠ فایل .env وجود ندارد" -ForegroundColor Yellow
    $warnings += "فایل .env وجود ندارد - از .env.example کپی کنید"
    
    if ($Fix -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✓ فایل .env از .env.example ایجاد شد" -ForegroundColor Green
    }
}

# خلاصه
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "خلاصه بررسی" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($info.Count -gt 0) {
    Write-Host "اطلاعات:" -ForegroundColor Green
    foreach ($i in $info) {
        Write-Host "  ✓ $i" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "هشدارها:" -ForegroundColor Yellow
    foreach ($w in $warnings) {
        Write-Host "  ⚠ $w" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "خطاها:" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "  ✗ $e" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "لطفاً خطاها را برطرف کنید و دوباره اجرا کنید." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ تمام پیش‌نیازها برآورده شده‌اند!" -ForegroundColor Green
    Write-Host ""
    if ($warnings.Count -gt 0) {
        Write-Host "توجه: برخی هشدارها وجود دارد اما اجرا ممکن است." -ForegroundColor Yellow
    }
    exit 0
}

