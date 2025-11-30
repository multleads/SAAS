#!/usr/bin/env bash
# Apply Render env vars and trigger deploy for the backend service
# Usage:
#   export RENDER_API_KEY="rnd_EWck5U8nRafYiHEWC16paTqu7NU1"
#   ./scripts/apply_render_envs.sh

set -euo pipefail

SERVICE_ID="srv-d4m5mindiees739rvubg"
# Default DB string (will be used unless DATABASE_URL env var is set)
: ${DATABASE_URL:="postgresql://postgres:D30h70$!@db.bhmnvzhryfnucktsugsl.supabase.co:5432/postgres"}

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "ERROR: RENDER_API_KEY is not set. Export it and re-run."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required but not installed. Install jq and re-run."
  exit 1
fi

API_BASE="https://api.render.com/v1"
AUTH_HEADER=( -H "Authorization: Bearer ${RENDER_API_KEY}" )

set_env_var() {
  local key="$1"
  local value="$2"
  local is_secret="$3" # true|false

  echo "Setting env var: $key (secret=$is_secret)"

  # Check if var exists
  local existing_id
  existing_id=$(curl -s "${API_BASE}/services/${SERVICE_ID}/env-vars" "${AUTH_HEADER[@]}" | jq -r ".[] | select(.key==\"${key}\") | .id" )

  if [ "$existing_id" != "null" ] && [ -n "$existing_id" ]; then
    echo " - updating existing var id=$existing_id"
    curl -s -X PATCH "${API_BASE}/services/${SERVICE_ID}/env-vars/${existing_id}" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "{\"value\": \"${value}\", \"isSecret\": ${is_secret} }" | jq .
  else
    echo " - creating new var"
    curl -s -X POST "${API_BASE}/services/${SERVICE_ID}/env-vars" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "{\"key\": \"${key}\", \"value\": \"${value}\", \"isSecret\": ${is_secret} }" | jq .
  fi
}

echo "Applying environment variables to Render service ${SERVICE_ID}"

# Set DATABASE_URL as secret
set_env_var "DATABASE_URL" "$DATABASE_URL" true

# Public/non-secret vars
set_env_var "REACT_APP_SITE_URL" "https://appmultleads.netlify.app" false
set_env_var "CORS_ORIGIN" "https://appmultleads.netlify.app" false
set_env_var "FRONTEND_URL" "https://appmultleads.netlify.app" false

echo "Triggering deploy on branch 'main'..."
curl -s -X POST "${API_BASE}/services/${SERVICE_ID}/deploys" \
  "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
  -d '{"branch":"main"}' | jq .

echo "Done. Check Render dashboard for build logs and deploy status."

exit 0
