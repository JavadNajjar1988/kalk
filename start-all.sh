#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./start-all.sh [options]

Options:
  --rebuild           Build Docker images with --no-cache before starting
  --purge             Remove all containers/volumes before starting
  --env-file FILE     Pass a custom .env file to docker compose
  --port-wait SECS    Seconds to wait for dev servers (default: 60)
  --skip-frontend     Do not start the Vite dev servers (API only)
  -h, --help          Show this help message
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f docker-compose.yml ]]; then
  echo "start-all.sh must be run from the repository root (docker-compose.yml not found)." >&2
  exit 1
fi

REBUILD=false
PURGE=false
PORT_WAIT=60
ENV_FILE=""
SKIP_FRONTEND=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rebuild) REBUILD=true ;;
    --purge) PURGE=true ;;
    --env-file)
      ENV_FILE="${2:-}"
      if [[ -z "$ENV_FILE" ]]; then
        echo "--env-file requires a value" >&2
        usage
        exit 1
      fi
      shift
      ;;
    --port-wait)
      PORT_WAIT="${2:-}"
      if ! [[ "$PORT_WAIT" =~ ^[0-9]+$ ]]; then
        echo "--port-wait requires an integer" >&2
        exit 1
      fi
      shift
      ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Command '$1' not found. $2" >&2
    exit 1
  fi
}

ensure_cmd docker "Install Docker and ensure it is running."
if ! docker compose version >/dev/null 2>&1; then
  echo "'docker compose' command not available. Please install Docker Compose v2." >&2
  exit 1
fi

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file '$ENV_FILE' not found." >&2
    exit 1
  fi
  echo "Using env file: $ENV_FILE"
fi

if "$PURGE"; then
  echo "Purging previous containers and volumes..."
  docker compose down -v --remove-orphans
  # remove standalone tileserver if it exists
  if tileserver_id=$(docker ps -aq -f name=kalk-tileserver); then
    if [[ -n "$tileserver_id" ]]; then
      docker rm -f "$tileserver_id" >/dev/null 2>&1 || true
    fi
  fi
fi

if "$REBUILD"; then
  echo "Rebuilding Docker images..."
  docker compose down
  docker compose build --no-cache
fi

compose_args=(up -d)
if [[ -n "$ENV_FILE" ]]; then
  compose_args=(--env-file "$ENV_FILE" "${compose_args[@]}")
fi

echo "Starting Docker services..."
docker compose "${compose_args[@]}"

install_node_modules() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing dependencies for $dir..."
    if ! (cd "$dir" && npm ci); then
      echo "npm ci failed, falling back to npm install in $dir"
      (cd "$dir" && npm install)
    fi
  fi
}

PIDS_FILE=".vite-dev-pids"
if ! "$SKIP_FRONTEND"; then
  ensure_cmd node "Install Node.js LTS from https://nodejs.org/"
  ensure_cmd npm "Install Node.js LTS (npm is bundled)."

  install_node_modules front_dashboard
  install_node_modules front_kalknegar

  rm -f "$PIDS_FILE"

  if [[ -d "front_dashboard" ]]; then
    echo "Starting front_dashboard dev server..."
    (cd front_dashboard && nohup npm run dev >/tmp/front_dashboard.dev.log 2>&1 & echo $! >> "../$PIDS_FILE")
  fi

  if [[ -d "front_kalknegar" ]]; then
    echo "Starting front_kalknegar dev server..."
    (cd front_kalknegar && nohup npm run dev-host >/tmp/front_kalknegar.dev.log 2>&1 & echo $! >> "../$PIDS_FILE")
  fi

  wait_for_port() {
    local port="$1"
    local success=false
    for ((i=0; i<PORT_WAIT; i++)); do
      if curl --silent --head "http://127.0.0.1:$port" >/dev/null 2>&1; then
        success=true
        break
      fi
      sleep 1
    done
    if ! $success; then
      echo "Warning: port $port did not open within $PORT_WAIT seconds. Check logs in /tmp/*.dev.log"
    fi
  }

  wait_for_port 3000
  wait_for_port 5173
else
  echo "Skipping frontend startup (--skip-frontend)."
fi

get_api_container_id() {
  docker compose ps -q api 2>/dev/null | tr -d '\r'
}

echo "Waiting for API container..."
api_id=""
for ((i=0; i<30; i++)); do
  api_id="$(get_api_container_id)"
  if [[ -n "$api_id" ]]; then
    break
  fi
  sleep 1
done

healthy=false
if [[ -n "$api_id" ]]; then
  for ((i=0; i<60; i++)); do
    health="$(docker inspect -f '{{.State.Health.Status}}' "$api_id" 2>/dev/null || true)"
    if [[ "$health" == "healthy" ]]; then
      healthy=true
      break
    fi
    sleep 1
  done
fi

if ! $healthy; then
  echo "API health check not yet healthy, probing port 8000..."
  for ((i=0; i<PORT_WAIT; i++)); do
    if curl --silent --head http://127.0.0.1:8000 >/dev/null 2>&1; then
      healthy=true
      break
    fi
    sleep 1
  done
fi

echo "Running database migrations inside API container..."
attempts=0
max_attempts=10
while (( attempts < max_attempts )); do
  if docker compose exec -T api sh -lc "alembic -c alembic.ini upgrade head"; then
    echo "Migrations applied successfully."
    break
  fi
  ((attempts++))
  echo "Migration attempt $attempts failed, retrying in 5 seconds..."
  sleep 5
done

if (( attempts == max_attempts )); then
  echo "Failed to apply migrations after $max_attempts attempts. Showing last 200 lines of API logs."
  docker compose logs --no-color --tail=200 api
fi

cat <<'EOF'

Started services:
  - API:        http://localhost:8000 (Swagger: http://localhost:8000/api/docs)
  - Dashboard:  http://127.0.0.1:3000/
  - KalkNegar:  http://localhost:5173/kalknegar/

Optional services:
  - TileServer: docker compose --profile maps up -d  (http://127.0.0.1:8480)

Use CTRL+C to stop the Vite dev servers or run `docker compose down` to stop containers.

EOF

if [[ -f "$PIDS_FILE" ]]; then
  echo "Active Vite dev server PIDs are recorded in $PIDS_FILE (for manual cleanup if needed)."
fi
