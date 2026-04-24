#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://tuto.chat}"
BACKEND_URL="${BACKEND_URL:-}"

check_url() {
  local label="$1"
  local url="$2"

  echo "Checking ${label}: ${url}"
  curl --fail --silent --show-error --max-time 15 "${url}" > /dev/null
}

check_url "home" "${BASE_URL}/"
check_url "pricing" "${BASE_URL}/pricing"
check_url "support" "${BASE_URL}/support"
check_url "privacy" "${BASE_URL}/privacy"
check_url "terms" "${BASE_URL}/terms"
check_url "refund policy" "${BASE_URL}/refund-policy"
check_url "web health" "${BASE_URL}/api/health"
check_url "deeptutor health" "${BASE_URL}/api/health/deeptutor"

if [[ -n "${BACKEND_URL}" ]]; then
  check_url "backend status" "${BACKEND_URL%/}/api/v1/system/status"
fi

echo "Production smoke checks passed."
