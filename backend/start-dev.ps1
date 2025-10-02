param(
  [switch]$Compose
)

if ($Compose) {
  docker-compose up -d
  Write-Host "Docker services started. API at http://localhost:8000"
  exit 0
}

python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:UVICORN_WORKERS=1
uvicorn app.main:app --reload --port 8000
