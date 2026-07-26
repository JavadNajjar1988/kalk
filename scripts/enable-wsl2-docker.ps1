#Requires -RunAsAdministrator
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$log = Join-Path $env:TEMP 'kalk-enable-wsl2.log'
Start-Transcript -Path $log -Force

Write-Host "=== KALK WSL2 Setup ===" -ForegroundColor Cyan

Write-Host "[1/4] Virtual Machine Platform..." -ForegroundColor Yellow
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "[2/4] Windows Subsystem for Linux..." -ForegroundColor Yellow
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

Write-Host "[3/4] wsl --update..." -ForegroundColor Yellow
wsl --update 2>&1

Write-Host "[4/4] wsl --set-default-version 2..." -ForegroundColor Yellow
wsl --set-default-version 2 2>&1

Write-Host ""
Write-Host "WSL status:" -ForegroundColor Green
wsl --status 2>&1

Write-Host ""
Write-Host "Log saved to: $log" -ForegroundColor Cyan
Write-Host "Restart Windows, then open Docker Desktop." -ForegroundColor Yellow

Stop-Transcript

# Auto-close after 15 seconds so the window does not block unattended runs
Start-Sleep -Seconds 15
