#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL_VALUE="${DATABASE_URL:-${POSTGRES_URL:-}}"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/.backups}"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_FILE="${1:-${BACKUP_DIR}/tuto-postgres-${TIMESTAMP}.dump}"

if [[ -z "${DATABASE_URL_VALUE}" ]]; then
  echo "DATABASE_URL or POSTGRES_URL must be set before taking a backup." >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_FILE}")"

pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "${OUTPUT_FILE}" \
  "${DATABASE_URL_VALUE}"

echo "Backup written to ${OUTPUT_FILE}"
