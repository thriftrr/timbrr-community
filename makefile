# timbrr-community — Timbrr's shared blocks (docs/README.md).
# src/layer is the Nuxt layer sites extend; src/starter is the plain site
# built on it, which is also the canvas a studio edits through in dev.

.PHONY: up install dev build deploy deploy-timbrr deploy-preview manifest check

# One command from a clean checkout to the starter on :3001.
up: install dev

install:
	cd src && npm install

dev:
	cd src && npm run dev

build:
	cd src && npm run build

# Ship the starter as the studio's canvas, https://canvas.timbrr.app. The
# studio's origin, the only page allowed to frame the canvas, is a var in
# src/starter/wrangler.jsonc, read per request.
deploy:
	cd src && npm run build
	cd src/starter && npx wrangler deploy --config .output/server/wrangler.json

# Ship the same build again as the Timbrr marketing site, https://timbrr.app:
# the `timbrr` environment in src/starter/wrangler.jsonc gives it its own
# Worker name, the apex route and the vars that make it the studio's
# built-in `timbrr` site. The studio keeps its own paths through its routes.
deploy-timbrr:
	cd src && npm run build
	cd src/starter && npx wrangler deploy --config .output/server/wrangler.json --env timbrr

# Ship the same build as every site's dev and staging addresses,
# *.dev.timbrr.app and *.staging.timbrr.app: the `preview` environment in
# src/starter/wrangler.jsonc.
deploy-preview:
	cd src && npm run build
	cd src/starter && npx wrangler deploy --config .output/server/wrangler.json --env preview

# Print the block manifest the starter serves (needs `make dev` running).
manifest:
	curl -s http://localhost:3001/__timbrr/manifest.json

# Check every block definition the way the build does, without building.
check:
	cd src && node layer/scripts/check-blocks.mjs
