#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL_VALUE="${DATABASE_URL:-${POSTGRES_URL:-}}"

if [[ -z "${DATABASE_URL_VALUE}" ]]; then
  echo "DATABASE_URL or POSTGRES_URL must be set before running web migrations." >&2
  exit 1
fi

for migration in "${ROOT_DIR}"/web/migrations/*.sql; do
  echo "Applying $(basename "${migration}")"
  psql "${DATABASE_URL_VALUE}" -v ON_ERROR_STOP=1 -f "${migration}"
done

echo "Web migrations applied successfully."
