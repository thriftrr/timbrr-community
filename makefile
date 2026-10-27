# timbrr-community — Timbrr's shared blocks (docs/README.md).
# src/layer is the Nuxt layer sites extend; src/starter is the plain site
# built on it, which is also the canvas a studio edits through in dev.

.PHONY: up install dev build manifest

# One command from a clean checkout to the starter on :3001.
up: install dev

install:
	cd src && npm install

dev:
	cd src && npm run dev

build:
	cd src && npm run build

# Print the block manifest the starter serves (needs `make dev` running).
manifest:
	curl -s http://localhost:3001/__timbrr/manifest.json
