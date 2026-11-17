import { createError, defineEventHandler, readBody, setResponseHeader } from 'h3';
import { groveHooks } from '#timbrr/grove-hooks';
import { editorRings } from '#timbrr/grove-hook';

// POST /__timbrr/grove-rings: { grove: { key, … }, rings } in, { rings }
// out, as this site's editor hooks adjust them (defineGroveHook's `editor`,
// docs/grove-hooks.md). The studio asks it, when the manifest says
// groveHooks.editor, before its sapling editor draws a grove's form, and
// keeps only the settings a hook may change. Nothing here is a secret or
// stored: it only reads what it's sent through the site's own functions.
const KEY = /^[a-z][a-z0-9_]{0,39}$/;
const MAX_BYTES = 512 * 1024;

export default defineEventHandler(async (event) => {
 setResponseHeader(event, 'cache-control', 'no-store');
 if (Number(event.node?.req?.headers?.['content-length'] ?? 0) > MAX_BYTES) throw createError({ statusCode: 413, message: 'Too big.' });
 const body = await readBody(event).catch(() => null);
 const grove = body?.grove;
 if (!grove || typeof grove !== 'object' || !KEY.test(String(grove.key ?? '')) || !Array.isArray(body.rings) || body.rings.length > 200) {
  throw createError({ statusCode: 400, message: 'Send { grove: { key }, rings: [...] }.' });
 }
 return { rings: editorRings(groveHooks, { key: grove.key, name: String(grove.name ?? ''), singular: String(grove.singular ?? '') }, body.rings) };
});
