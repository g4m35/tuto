#!/usr/bin/env bash
set -euo pipefail

CONFIRM_TOKEN="${CONFIRM_RESTORE:-}"
BACKUP_FILE="${1:-}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"

if [[ "${CONFIRM_TOKEN}" != "I_UNDERSTAND_THIS_OVERWRITES_DATA" ]]; then
  echo "Set CONFIRM_RESTORE=I_UNDERSTAND_THIS_OVERWRITES_DATA to run a restore." >&2
  exit 1
fi

if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then
  echo "Provide a valid backup file as the first argument." >&2
  exit 1
fi

if [[ -z "${TARGET_DATABASE_URL}" ]]; then
  echo "TARGET_DATABASE_URL must be set for restores." >&2
  exit 1
fi

pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname "${TARGET_DATABASE_URL}" \
  "${BACKUP_FILE}"

echo "Restore completed for ${TARGET_DATABASE_URL}"
