# Single entrypoint for running the full project.

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

Push-Location $PSScriptRoot
try {
    if (-not $SkipCheck) {
        Write-Host "`nChecking prerequisites..." -ForegroundColor Cyan
        & "$PSScriptRoot\check-prerequisites.ps1" -Fix
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Prerequisites check failed. Fix the issues above and re-run."
            exit 1
        }
        Write-Host ""
    }

    if (-not (Test-Path ".\docker-compose.yml")) {
        Write-Error "Please run from the repository root (docker-compose.yml not found)."
        exit 1
    }

    if ($EnvFile -and -not (Test-Path $EnvFile)) {
        Write-Error "Env file '$EnvFile' not found."
        exit 1
    }

    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
            Copy-Item ".env.example" ".env"
            Write-Host "Created .env. Review and adjust it if needed." -ForegroundColor Green
        } else {
            Write-Warning ".env.example not found. Create .env manually."
        }
    }

    Write-Host "`nStarting Docker services..." -ForegroundColor Cyan

    if ($Purge) {
        Write-Host "Purging containers and volumes..." -ForegroundColor Yellow
        docker compose down -v --remove-orphans
        try {
            $ts = & docker ps -aq -f name=kalk-tileserver
            if ($ts) {
                docker rm -f $ts | Out-Null
            }
        } catch {}
    }

    if ($Rebuild) {
        Write-Host "Rebuilding images..." -ForegroundColor Yellow
        docker compose down
        docker compose build --no-cache
    }

    $composeUpArgs = @("up", "-d")
    if ($EnvFile) {
        $composeUpArgs = @("--env-file", $EnvFile) + $composeUpArgs
    }
    docker compose @composeUpArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker services failed to start."
        exit 1
    }

    $mapsDir = Join-Path $PWD "backend\static\maps"
    try {
        $hasMbtiles = Test-Path (Join-Path $mapsDir "*.mbtiles")
        if ($hasMbtiles) {
            Write-Host "`nStarting TileServer (maps profile)..." -ForegroundColor Cyan
            if ($EnvFile) {
                docker compose --env-file $EnvFile --profile maps up -d
            } else {
                docker compose --profile maps up -d
            }
        } else {
            Write-Host "`nNo .mbtiles found under backend/static/maps; skipping TileServer." -ForegroundColor Yellow
        }
    } catch {
        Write-Warning "Failed to start TileServer: $_"
    }

    if (-not $SkipFrontend) {
        Write-Host "`nStarting front-end dev servers..." -ForegroundColor Cyan

        if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
            Write-Warning "Node.js not found - skipping front-end dev servers."
        } else {
            function Install-Dependencies([string]$dir) {
                if (-not (Test-Path $dir)) {
                    return $false
                }
                if (-not (Test-Path "$dir/node_modules")) {
                    Write-Host "  Installing dependencies in $dir..." -ForegroundColor Yellow
                    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm ci" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
                    if ($proc.ExitCode -ne 0) {
                        Write-Warning "npm ci failed in $dir; falling back to npm install..."
                        $proc2 = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm install" -WorkingDirectory $dir -NoNewWindow -PassThru -Wait
                        if ($proc2.ExitCode -ne 0) {
                            Write-Error "Dependency install failed in $dir."
                            return $false
                        }
                    }
                    Write-Host "  OK: $dir dependencies installed" -ForegroundColor Green
                } else {
                    Write-Host "  OK: $dir dependencies already present" -ForegroundColor Green
                }
                return $true
            }

            $dashboardOk = Install-Dependencies "front_dashboard"
            $kalknegarOk = Install-Dependencies "front_kalknegar"

            $windowStyle = 'Minimized'
            try { $null = $Host.UI.RawUI } catch { $windowStyle = 'Hidden' }

            if ($dashboardOk -and (Test-Path "front_dashboard")) {
                Write-Host "  Starting Dashboard..." -ForegroundColor Yellow
                $spParams = @{
                    FilePath = 'cmd.exe'
                    ArgumentList = @('/c','npm run dev')
                    WorkingDirectory = 'front_dashboard'
                    WindowStyle = $windowStyle
                }
                Start-Process @spParams
            }

            if ($kalknegarOk -and (Test-Path "front_kalknegar")) {
                Write-Host "  Starting KalkNegar..." -ForegroundColor Yellow
                $spParamsK = @{
                    FilePath = 'cmd.exe'
                    ArgumentList = @('/c','npm run dev-host')
                    WorkingDirectory = 'front_kalknegar'
                    WindowStyle = $windowStyle
                }
                Start-Process @spParamsK
            }

            Write-Host "`nWaiting for front-end ports..." -ForegroundColor Cyan
            $ports = @(3000, 5180)
            foreach ($p in $ports) {
                $ok = $false
                for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
                    $listening = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
                    if ($listening) {
                        $ok = $true
                        Write-Host "  OK: port $p is listening" -ForegroundColor Green
                        break
                    }
                    Start-Sleep -Seconds 1
                }
                if (-not $ok) {
                    Write-Warning "  Port $p did not open within $PortWaitSeconds seconds."
                }
            }
        }
    }

    Write-Host "`nWaiting for API..." -ForegroundColor Cyan

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
                Write-Host "  OK: API is healthy" -ForegroundColor Green
                break
            }
            Start-Sleep -Seconds 1
        }
    }

    if (-not $healthy) {
        $ok = $false
        for ($i = 0; $i -lt $PortWaitSeconds; $i++) {
            $listening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
            if ($listening) {
                $ok = $true
                Write-Host "  OK: API port 8000 is listening" -ForegroundColor Green
                break
            }
            Start-Sleep -Seconds 1
        }
        if (-not $ok) {
            Write-Warning "API did not become healthy within the expected time. Proceeding to migrations."
        }
    }

    Write-Host "`nRunning database migrations..." -ForegroundColor Cyan
    $maxTries = 10
    $try = 1
    while ($try -le $maxTries) {
        Write-Host "  Attempt $try of $maxTries..." -ForegroundColor Yellow
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
            Write-Host "  OK: migrations applied" -ForegroundColor Green
            break
        }
        if ($try -lt $maxTries) {
            Write-Warning "  Migration attempt failed. Retrying in 5 seconds..."
            Start-Sleep -Seconds 5
        }
        $try++
    }

    if ($try -gt $maxTries) {
        Write-Warning "Migration execution failed. API logs:"
        & docker compose logs --no-color --tail=200 api
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Project started" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Yellow
    Write-Host "  API:           http://localhost:8000" -ForegroundColor White
    Write-Host "  API Docs:      http://localhost:8000/api/docs" -ForegroundColor White
    Write-Host "  Dashboard:     http://127.0.0.1:3000/" -ForegroundColor White
    Write-Host "  KalkNegar:     http://127.0.0.1:3000/kalknegar" -ForegroundColor White
    Write-Host "  KalkNegar (Direct): http://127.0.0.1:5180/kalknegar/" -ForegroundColor White
    Write-Host ""
    if ($SkipFrontend) {
        Write-Warning "Front-end dev servers were skipped (-SkipFrontend)."
        Write-Host "Start manually if needed:" -ForegroundColor Yellow
        Write-Host "  cd front_dashboard; npm run dev" -ForegroundColor White
        Write-Host "  cd front_kalknegar; npm run dev-host" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Optional services:" -ForegroundColor Yellow
    Write-Host "  - TileServer:    docker compose --profile maps up -d" -ForegroundColor White
    Write-Host "    TileServer URL: http://127.0.0.1:8480" -ForegroundColor White
    Write-Host ""
} finally {
    Pop-Location
}
