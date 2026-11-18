// Collection hooks in a site's own code (docs/collection-hooks.md): files in the
// site's collection-hooks/ folder, each `export default defineCollectionHook({ … })`,
// gathered by modules/collection-hooks.js into #timbrr/collection-hooks. Plain
// functions with no Nuxt in them, so the app, the site's server and the
// check scripts all read the same rules.
//
//   collection   the collection's key (required)
//   field    a field's key, or
//   kind    every field of that kind (text, number, date…); neither: every field
//   format(value, { field, entry, collection })  what to draw in place of the
//           value, as plain words; return undefined to leave it be
//   editor(field, { collection })  changes to what the studio's entry editor shows
//           for the field (EDITOR_SETTINGS); never what the studio accepts

const KEY = /^[a-z][a-z0-9_]{0,39}$/;

// What an editor hook may change. The studio keeps only these, and only
// where they don't loosen the collection's own rule.
export const EDITOR_SETTINGS = ['label', 'help', 'placeholder', 'prepend', 'append', 'options', 'min', 'max', 'step', 'default', 'readOnly', 'hidden', 'required'];

export function defineCollectionHook(hook) {
 const where = `defineCollectionHook(${JSON.stringify(hook?.collection ?? '')})`;
 if (!hook || typeof hook !== 'object') throw new Error('defineCollectionHook takes { collection, field?, kind?, format?, editor? }');
 if (!KEY.test(String(hook.collection ?? ''))) throw new Error(`${where}: collection must be a collection's key`);
 if (hook.field !== undefined && !KEY.test(String(hook.field))) throw new Error(`${where}: field must be a field's key`);
 if (hook.kind !== undefined && !KEY.test(String(hook.kind))) throw new Error(`${where}: kind must be a field kind`);
 if (hook.format !== undefined && typeof hook.format !== 'function') throw new Error(`${where}: format must be a function`);
 if (hook.editor !== undefined && typeof hook.editor !== 'function') throw new Error(`${where}: editor must be a function`);
 if (!hook.format && !hook.editor) throw new Error(`${where}: give it a format or an editor function`);
 return Object.freeze({ ...hook });
}

const fits = (hook, collection, field) => hook.collection === collection && (hook.field ? hook.field === field.key : !hook.kind || hook.kind === field.kind);

// The manifest's flag: which kinds of hook the site has.
export const collectionHookFlags = (hooks) => ({ format: hooks.some((hook) => hook.format), editor: hooks.some((hook) => hook.editor) });

// A field's value as the hooks draw it: the value as given when no hook
// formats it, else the first matching hook's answer as plain words. A hook
// that throws is skipped (and said in the console), never the page.
export function formatFieldValue(hooks, field, value, entry, collection) {
 const key = typeof collection === 'string' ? collection : collection?.key;
 for (const hook of hooks) {
  if (!hook.format || !fits(hook, key, field)) continue;
  try {
   const out = hook.format(value, { field, entry, collection });
   if (out !== undefined && out !== null) return String(out);
  } catch (error) {
   console.error(`[collection-hooks] format ${key}.${field?.key}:`, error?.message ?? error);
  }
 }
 return value;
}

// A collection's fields as its editor hooks adjust them, for the studio. Each
// field's changes are kept to EDITOR_SETTINGS (`key` and `kind` never move),
// from every matching hook in order; fields inside a group or a repeater too.
export function editorFields(hooks, collection, fields) {
 const mine = hooks.filter((hook) => hook.editor && hook.collection === collection?.key);
 const walk = (list) =>
  (Array.isArray(list) ? list : []).map((field) => {
   if (!field || typeof field !== 'object' || !KEY.test(String(field.key ?? ''))) return field;
   let out = { ...field };
   for (const hook of mine) {
    if (!fits(hook, collection.key, field)) continue;
    try {
     const change = hook.editor({ ...out }, { collection });
     if (change && typeof change === 'object') for (const setting of EDITOR_SETTINGS) if (change[setting] !== undefined) out[setting] = change[setting];
    } catch (error) {
     console.error(`[collection-hooks] editor ${collection.key}.${field.key}:`, error?.message ?? error);
    }
   }
   if (Array.isArray(field.subfields)) out = { ...out, subfields: walk(field.subfields) };
   return out;
  });
 return walk(fields);
}
