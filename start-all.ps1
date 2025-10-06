param(
  [switch]$Rebuild,
  [switch]$Purge,
  [int]$PortWaitSeconds = 60,
  [string]$EnvFile
)

# Start / Prepare Docker services
if ($Purge) {
  docker compose down -v --remove-orphans
}
if ($Rebuild) {
  docker compose down
  docker compose build --no-cache
}

$composeUpArgs = @("up","-d")
if ($EnvFile) { $composeUpArgs = @("--env-file", $EnvFile) + $composeUpArgs }
docker compose @composeUpArgs

# Ensure Node/npm available
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  $nodePath = "C:\\Program Files\\nodejs\\node.exe"
  if (-not (Test-Path $nodePath)) {
    Write-Error "Node.js not found in PATH or at $nodePath. Please install Node LTS or setup PATH."
    exit 1
  }
}

function Install-Dependencies([string]$dir) {
  if (-not (Test-Path "$dir/node_modules")) {
    Write-Host "Installing dependencies for $dir..."
    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm ci" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
    if ($proc.ExitCode -ne 0) {
      Write-Warning "npm ci failed in $dir (exit $($proc.ExitCode)), falling back to 'npm install'"
      $proc2 = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm install" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
      if ($proc2.ExitCode -ne 0) {
        Write-Error "Dependency installation failed in $dir (exit $($proc2.ExitCode))."
        exit 1
      }
    }
  }
}

Install-Dependencies "front_dashboard"
Install-Dependencies "front_kalknegar"

# Start dev servers (via cmd to avoid PowerShell policy)
$windowStyle = 'Minimized'
try { $null = $Host.UI.RawUI } catch { $windowStyle = 'Hidden' }
$spParams = @{ FilePath = 'cmd.exe'; ArgumentList = @('/c','npm run dev'); WorkingDirectory = 'front_dashboard'; WindowStyle = $windowStyle }
Start-Process @spParams

# Start front_kalknegar dev server (host mode)
$spParamsK = @{ FilePath = 'cmd.exe'; ArgumentList = @('/c','npm run dev-host'); WorkingDirectory = 'front_kalknegar'; WindowStyle = $windowStyle }
Start-Process @spParamsK

# Wait for Vite servers to listen (best-effort)
$ports = @(3000, 5173)
foreach ($p in $ports) {
  $ok = $false
  for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
    $listening = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($listening) { $ok = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $ok) { Write-Warning "Port $p is not listening yet after $PortWaitSeconds seconds. Check Vite window for errors." }
}

# Wait for API health/port before migrations, then run Alembic with retries
function Get-ApiContainerId { (& docker compose ps -q api 2>$null).Trim() }

# Wait for container to be created
$apiId = Get-ApiContainerId
for ($i = 0; ($null -eq $apiId) -or ($apiId -eq ""); $i++) {
  if ($i -ge 30) { break }
  Start-Sleep -Seconds 1
  $apiId = Get-ApiContainerId
}

$healthy = $false
if ($apiId) {
  for ($i = 0; $i -lt 60; $i++) {
    $health = (& docker inspect -f "{{.State.Health.Status}}" $apiId 2>$null)
    if ($health -eq "healthy") { $healthy = $true; break }
    Start-Sleep -Seconds 1
  }
}

if (-not $healthy) {
  # Fallback: check port 8000 listening
  $ok = $false
  for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
    $listening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($listening) { $ok = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $ok) { Write-Warning "API port 8000 is not listening yet; proceeding to migrations anyway." }
}

# Run Alembic migrations inside api container with retries
$maxTries = 10
$try = 1
while ($try -le $maxTries) {
  Write-Host "Running DB migrations (attempt $try of $maxTries)..."
  $result = & docker compose exec -T api sh -lc "alembic -c alembic.ini upgrade head" 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations applied successfully."
    break
  }
  Write-Warning "Migration attempt failed (attempt $try). Output:" 
  Write-Host $result
  Start-Sleep -Seconds 5
  $try++
}
if ($try -gt $maxTries) {
  Write-Warning "Failed to apply migrations after $maxTries attempts. Showing last 200 lines of API logs..."
  & docker compose logs --no-color --tail=200 api
}

Write-Host "Started:"
Write-Host "- API:           http://localhost:8000 (Swagger: /api/docs)"
Write-Host "- Dashboard:     http://127.0.0.1:3000/"
Write-Host "- KalkNegar:     http://localhost:5173/kalknegar/"
