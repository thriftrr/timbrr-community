#!/usr/bin/env bash
# Give every site Worker the relay secret the studio checks form sends against
# (docs/README.md). The value is the studio's own NUXT_RELAY_SECRET, read from
# the studio's .env, so the two can't drift. It never appears on the command
# line, and nothing here is committed: this repo is public.
#   make secrets [studio_env=../timbrr/src/app/.env]
#
# Run this before the studio's `make secrets`, which holds the secret back until
# every Worker here has it.
set -euo pipefail
cd "$(dirname "$0")/.."
STUDIO_ENV="${1:-../../../timbrr/src/app/.env}"
[ -f "$STUDIO_ENV" ] || { echo "✘ the studio's .env isn't at $STUDIO_ENV (make secrets studio_env=path)"; exit 1; }
get () { grep -E "^$1=" "$STUDIO_ENV" | tail -1 | cut -d= -f2- || true; }
SECRET="$(get NUXT_RELAY_SECRET)"
[ -n "$SECRET" ] || { echo "✘ NUXT_RELAY_SECRET is empty in $STUDIO_ENV. Make one: openssl rand -hex 32"; exit 1; }

# '' is the top-level Worker (timbrr-canvas); the rest are the environments in
# wrangler.jsonc. A Worker of a client's own sets the same secret by hand.
for env in '' timbrr hosted preview; do
  printf '%s' "$SECRET" | npx wrangler secret put NUXT_TIMBRR_RELAY_SECRET ${env:+--env "$env"}
done
echo "✔ NUXT_TIMBRR_RELAY_SECRET on every site Worker. Now run \`make secrets\` in the studio."
