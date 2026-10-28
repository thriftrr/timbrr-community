# timbrr-community — Timbrr's shared blocks (docs/README.md).
# src/layer is the Nuxt layer sites extend; src/starter is the plain site
# built on it, which is also the canvas a studio edits through in dev.

.PHONY: up install dev build deploy manifest check

# One command from a clean checkout to the starter on :3001.
up: install dev

install:
	cd src && npm install

dev:
	cd src && npm run dev

build:
	cd src && npm run build

# Ship the starter as the studio's canvas, https://canvas.timbrr.app. The
# studio's origin is read at build time: it's the only page allowed to
# frame the canvas.
deploy:
	cd src && npm run build
	cd src/starter && npx wrangler deploy --config .output/server/wrangler.json

# Print the block manifest the starter serves (needs `make dev` running).
manifest:
	curl -s http://localhost:3001/__timbrr/manifest.json

# Check every block definition the way the build does, without building.
check:
	cd src && node layer/scripts/check-blocks.mjs
