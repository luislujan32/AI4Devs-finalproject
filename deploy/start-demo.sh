#!/usr/bin/env bash
set -euo pipefail

export NODE_ENV=production
export PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-${RENDER_EXTERNAL_URL:-}}"
export SCREENINGROOM_PUBLIC_DEMO=1 API_PORT=3001 MAILPIT_HTTP_PORT=8026
export MP_UI_BIND_ADDR=127.0.0.1:8026 MP_SMTP_BIND_ADDR=127.0.0.1:1025
export MP_WEBROOT=/buzon/ MP_MAX_MESSAGES=100 MP_MAX_AGE=1d MP_QUIET=true
export XDG_CONFIG_HOME=/tmp/caddy-config XDG_DATA_HOME=/tmp/caddy-data

node deploy/seed-demo.mjs
export MP_UI_AUTH="revisor:${DEMO_MAIL_PASSWORD}"

pids=()
cleanup() {
  if (( ${#pids[@]} )); then
    kill "${pids[@]}" 2>/dev/null || true
    wait || true
  fi
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

mailpit &
pids+=("$!")
node apps/api/dist/main.js &
pids+=("$!")
caddy run --config deploy/Caddyfile --adapter caddyfile &
pids+=("$!")

# Render can restart the service if any component stops.
wait -n
exit 1
