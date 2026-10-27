import { defineEventHandler, setHeader } from 'h3';
import { useRuntimeConfig } from '#imports';
import { definitions, layers } from '#timbrr/blocks';
import { buildManifest } from '#timbrr/manifest';

// /__timbrr/manifest.json: what this site can render, for any studio that
// edits it. Prerendered into a static build; cheap enough per request.
export default defineEventHandler((event) => {
 setHeader(event, 'cache-control', 'public, max-age=60');
 return buildManifest(String(useRuntimeConfig(event).public.site ?? ''), layers, definitions);
});
