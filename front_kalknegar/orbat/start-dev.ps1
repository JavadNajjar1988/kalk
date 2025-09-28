# Orbat Development Server Launcher
Write-Host "Starting Orbat Mapper Development Server..." -ForegroundColor Green

# Change to the correct directory
$orbatPath = "C:\Users\Renderkar\Documents\Bac\Lindu\backend\orbat\Orbat"
Set-Location $orbatPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "package.json found" -ForegroundColor Green
    
    # Check if node_modules exists, if not install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "Starting development server..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host "package.json not found in current directory" -ForegroundColor Red
    Write-Host "Current directory contents:" -ForegroundColor Yellow
    Get-ChildItem
}