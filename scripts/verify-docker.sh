#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="novashop-ci"
COMPOSE=(docker compose -p "$PROJECT")

CURL_OUTPUT=/dev/null

if [[ "${OSTYPE:-}" == msys* ]]; then
  CURL_OUTPUT=NUL
fi

cleanup() {
  local exit_code=$?
  trap - EXIT

  if (( exit_code != 0 )); then
    echo "::group::Docker Compose logs"
    "${COMPOSE[@]}" logs --no-color || true
    echo "::endgroup::"
  fi

  "${COMPOSE[@]}" down -v --remove-orphans || true
  exit "$exit_code"
}

trap cleanup EXIT

echo "Checking required environment variables..."
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"

echo "Validating Docker Compose configuration..."
"${COMPOSE[@]}" config --quiet

echo "Building Docker images..."
"${COMPOSE[@]}" build backend frontend

echo "Checking backend runtime image..."
docker run --rm --entrypoint sh novashop-backend:local -c '
  set -eu
  test -f dist/server.js
  test -f dist/db/runMigrations.js
  test -f dist/db/seed.js
  test -d migrations
  test -d seed-data
  test ! -e src
  test ! -e node_modules/tsx
  test ! -e node_modules/typescript
'

echo "Starting application..."
"${COMPOSE[@]}" up -d --wait backend frontend

echo "Checking backend health..."
curl --fail --silent --show-error --retry 5 \
  --retry-delay 1 --retry-connrefused \
  http://localhost:4100/health

curl --fail --silent --show-error --retry 5 \
  --retry-delay 1 --retry-connrefused \
  http://localhost:4100/health/db

echo "Checking frontend..."
curl --fail --silent --show-error \
  http://localhost:8080/ -o "$CURL_OUTPUT"

curl --fail --silent --show-error \
  http://localhost:8080/cart -o "$CURL_OUTPUT"

echo "Checking missing static asset..."
missing_status=$(curl --silent --show-error \
  -o "$CURL_OUTPUT" -w '%{http_code}' \
  http://localhost:8080/assets/missing.js)

if [[ "$missing_status" != "404" ]]; then
  echo "Expected 404 for missing asset, got $missing_status"
  exit 1
fi

echo "Checking CORS..."
cors_headers=$(curl --fail --silent --show-error -D - \
  -o "$CURL_OUTPUT" \
  -H 'Origin: http://localhost:8080' \
  http://localhost:4100/health)

grep -qi '^access-control-allow-origin: http://localhost:8080$' \
  <<< "${cors_headers//$'\r'/}"

echo "Checking repeat migrations..."
migration_output=$("${COMPOSE[@]}" run --rm --no-deps migrate)
echo "$migration_output"

grep -q 'No pending migrations.' <<< "$migration_output"

echo "Preparing expected migration filenames..."
shopt -s nullglob
migration_files=(backend/migrations/*.sql)

if (( ${#migration_files[@]} == 0 )); then
  echo "No SQL migration files found"
  exit 1
fi

expected_migrations=$(
  printf '%s\n' "${migration_files[@]##*/}" | LC_ALL=C sort
)

echo "Running concurrent migration verification..."

for round in 1 2 3 4 5; do
  database="novashop_race_${round}"
  echo "Round $round: $database"

  "${COMPOSE[@]}" exec -T db \
    createdb -U novashop "$database"

  database_url="postgres://novashop:${POSTGRES_PASSWORD}@db:5432/${database}"

  "${COMPOSE[@]}" run --rm --no-deps \
    -e "DATABASE_URL=$database_url" \
    --entrypoint sh migrate -c '
      node dist/db/runMigrations.js >/tmp/m1.log 2>&1 & p1=$!
      node dist/db/runMigrations.js >/tmp/m2.log 2>&1 & p2=$!

      r1=0
      r2=0

      wait "$p1" || r1=$?
      wait "$p2" || r2=$?

      echo "--- Process 1 (exit $r1) ---"
      cat /tmp/m1.log

      echo "--- Process 2 (exit $r2) ---"
      cat /tmp/m2.log

      [ "$r1" -eq 0 ] && [ "$r2" -eq 0 ]
    '

  actual_migrations=$(
    "${COMPOSE[@]}" exec -T db \
      psql -X -v ON_ERROR_STOP=1 -U novashop -d "$database" \
      -At -c 'SELECT filename FROM schema_migrations ORDER BY filename COLLATE "C";'
  )

  if [[ "$actual_migrations" != "$expected_migrations" ]]; then
    echo "Migration list mismatch in $database"
    echo "Expected:"
    printf '%s\n' "$expected_migrations"
    echo "Actual:"
    printf '%s\n' "$actual_migrations"
    exit 1
  fi

  repeat_output=$(
    "${COMPOSE[@]}" run --rm --no-deps \
      -e "DATABASE_URL=$database_url" migrate
  )

  grep -q 'No pending migrations.' <<< "$repeat_output"

  echo "Round $round passed."
done

echo "Docker verification passed."
