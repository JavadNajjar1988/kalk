param(
  [string]$Action = "upgrade",
  [string]$Revision = "head"
)

python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

if ($Action -eq "upgrade") {
  alembic -c alembic.ini upgrade $Revision
} elseif ($Action -eq "downgrade") {
  alembic -c alembic.ini downgrade $Revision
} else {
  Write-Error "Unknown action: $Action (use upgrade|downgrade)"
  exit 1
}
