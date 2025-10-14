param(
  [switch]$Rebuild,
  [switch]$Purge,
  [int]$PortWaitSeconds = 60,
  [string]$EnvFile,
  [switch]$SkipFrontend
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path ".\docker-compose.yml")) {
  Write-Error "Please run start-all.ps1 from the repository root (docker-compose.yml not found)."
  exit 1
}

if ($EnvFile) {
  if (-not (Test-Path $EnvFile)) {
    Write-Error "Env file '$EnvFile' not found."
    exit 1
  }
  Write-Host "Using env file: $EnvFile"
}

function Ensure-Command([string]$command, [string]$installHint) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    Write-Error "'$command' not found. $installHint"
    exit 1
  }
}

Ensure-Command -command "docker" -installHint "Install Docker Desktop and ensure it is running."
Ensure-Command -command "docker-compose" -installHint "Install Docker Compose or enable it in Docker Desktop."

# Start / Prepare Docker services
if ($Purge) {
  docker compose down -v --remove-orphans
  # Also remove standalone tileserver container if present
  try { $ts = & docker ps -aq -f name=kalk-tileserver; if ($ts) { docker rm -f $ts | Out-Null } } catch {}
}
if ($Rebuild) {
  docker compose down
  docker compose build --no-cache
}

$composeUpArgs = @("up","-d")
if ($EnvFile) { $composeUpArgs = @("--env-file", $EnvFile) + $composeUpArgs }
docker compose @composeUpArgs

# TileServer is now managed by docker-compose.yml
# No need for manual container management

$mapsMbtiles = Join-Path $PWD "backend\static\maps\maps.mbtiles"
try {
  if (Test-Path $mapsMbtiles) {
    Write-Host "Starting TileServer profile (maps)..."
    if ($EnvFile) {
      docker compose --env-file $EnvFile --profile maps up -d
    } else {
      docker compose --profile maps up -d
    }
  } else {
    Write-Warning "TileServer MBTiles file not found at backend/static/maps/maps.mbtiles; skipping maps profile."
  }
} catch {
  Write-Warning "Failed to start TileServer profile: $_"
}

if (-not $SkipFrontend) {
  # Ensure Node/npm available
  Ensure-Command -command "node" -installHint "Install Node.js LTS and ensure it is in PATH."
  Ensure-Command -command "npm" -installHint "Install Node.js LTS (npm is bundled)."

  function Install-Dependencies([string]$dir) {
    if (-not (Test-Path $dir)) { return }
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
  if (Test-Path "front_dashboard") {
    $spParams = @{ FilePath = 'cmd.exe'; ArgumentList = @('/c','npm run dev'); WorkingDirectory = 'front_dashboard'; WindowStyle = $windowStyle }
    Start-Process @spParams
  }
  if (Test-Path "front_kalknegar") {
    $spParamsK = @{ FilePath = 'cmd.exe'; ArgumentList = @('/c','npm run dev-host'); WorkingDirectory = 'front_kalknegar'; WindowStyle = $windowStyle }
    Start-Process @spParamsK
  }

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
Write-Host ""
if ($SkipFrontend) {
  Write-Warning "Front-end dev servers were skipped (-SkipFrontend). Start them manually if needed."
}
Write-Host ""
Write-Host "Optional services:"
Write-Host "- TileServer:    docker compose --profile maps up -d (requires backend/static/maps/maps.mbtiles)"
Write-Host "                http://127.0.0.1:8480 (MBTiles: backend/static/maps/maps.mbtiles)"
