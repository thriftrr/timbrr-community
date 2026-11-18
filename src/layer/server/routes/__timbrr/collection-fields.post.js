import { createError, defineEventHandler, readBody, setResponseHeader } from 'h3';
import { collectionHooks } from '#timbrr/collection-hooks';
import { editorFields } from '#timbrr/collection-hook';

// POST /__timbrr/collection-fields: { collection: { key, … }, fields } in, { fields }
// out, as this site's editor hooks adjust them (defineCollectionHook's `editor`,
// docs/collection-hooks.md). The studio asks it, when the manifest says
// collectionHooks.editor, before its entry editor draws a collection's form, and
// keeps only the settings a hook may change. Nothing here is a secret or
// stored: it only reads what it's sent through the site's own functions.
const KEY = /^[a-z][a-z0-9_]{0,39}$/;
const MAX_BYTES = 512 * 1024;

export default defineEventHandler(async (event) => {
 setResponseHeader(event, 'cache-control', 'no-store');
 if (Number(event.node?.req?.headers?.['content-length'] ?? 0) > MAX_BYTES) throw createError({ statusCode: 413, message: 'Too big.' });
 const body = await readBody(event).catch(() => null);
 const collection = body?.collection;
 if (!collection || typeof collection !== 'object' || !KEY.test(String(collection.key ?? '')) || !Array.isArray(body.fields) || body.fields.length > 200) {
  throw createError({ statusCode: 400, message: 'Send { collection: { key }, fields: [...] }.' });
 }
 return { fields: editorFields(collectionHooks, { key: collection.key, name: String(collection.name ?? ''), singular: String(collection.singular ?? '') }, body.fields) };
});
