// Grove hooks in a site's own code (docs/grove-hooks.md): files in the
// site's grove-hooks/ folder, each `export default defineGroveHook({ … })`,
// gathered by modules/grove-hooks.js into #timbrr/grove-hooks. Plain
// functions with no Nuxt in them, so the app, the site's server and the
// check scripts all read the same rules.
//
//   grove   the grove's key (required)
//   ring    a ring's key, or
//   kind    every ring of that kind (text, number, date…); neither: every ring
//   format(value, { ring, sapling, grove })  what to draw in place of the
//           value, as plain words; return undefined to leave it be
//   editor(ring, { grove })  changes to what the studio's sapling editor shows
//           for the ring (EDITOR_SETTINGS); never what the studio accepts

const KEY = /^[a-z][a-z0-9_]{0,39}$/;

// What an editor hook may change. The studio keeps only these, and only
// where they don't loosen the grove's own rule.
export const EDITOR_SETTINGS = ['label', 'help', 'placeholder', 'prepend', 'append', 'options', 'min', 'max', 'step', 'default', 'readOnly', 'hidden', 'required'];

export function defineGroveHook(hook) {
 const where = `defineGroveHook(${JSON.stringify(hook?.grove ?? '')})`;
 if (!hook || typeof hook !== 'object') throw new Error('defineGroveHook takes { grove, ring?, kind?, format?, editor? }');
 if (!KEY.test(String(hook.grove ?? ''))) throw new Error(`${where}: grove must be a grove's key`);
 if (hook.ring !== undefined && !KEY.test(String(hook.ring))) throw new Error(`${where}: ring must be a ring's key`);
 if (hook.kind !== undefined && !KEY.test(String(hook.kind))) throw new Error(`${where}: kind must be a ring kind`);
 if (hook.format !== undefined && typeof hook.format !== 'function') throw new Error(`${where}: format must be a function`);
 if (hook.editor !== undefined && typeof hook.editor !== 'function') throw new Error(`${where}: editor must be a function`);
 if (!hook.format && !hook.editor) throw new Error(`${where}: give it a format or an editor function`);
 return Object.freeze({ ...hook });
}

const fits = (hook, grove, ring) => hook.grove === grove && (hook.ring ? hook.ring === ring.key : !hook.kind || hook.kind === ring.kind);

// The manifest's flag: which kinds of hook the site has.
export const groveHookFlags = (hooks) => ({ format: hooks.some((hook) => hook.format), editor: hooks.some((hook) => hook.editor) });

// A ring's value as the hooks draw it: the value as given when no hook
// formats it, else the first matching hook's answer as plain words. A hook
// that throws is skipped (and said in the console), never the page.
export function formatRingValue(hooks, ring, value, sapling, grove) {
 const key = typeof grove === 'string' ? grove : grove?.key;
 for (const hook of hooks) {
  if (!hook.format || !fits(hook, key, ring)) continue;
  try {
   const out = hook.format(value, { ring, sapling, grove });
   if (out !== undefined && out !== null) return String(out);
  } catch (error) {
   console.error(`[grove-hooks] format ${key}.${ring?.key}:`, error?.message ?? error);
  }
 }
 return value;
}

// A grove's rings as its editor hooks adjust them, for the studio. Each
// ring's changes are kept to EDITOR_SETTINGS (`key` and `kind` never move),
// from every matching hook in order; rings inside a group or a repeater too.
export function editorRings(hooks, grove, rings) {
 const mine = hooks.filter((hook) => hook.editor && hook.grove === grove?.key);
 const walk = (list) =>
  (Array.isArray(list) ? list : []).map((ring) => {
   if (!ring || typeof ring !== 'object' || !KEY.test(String(ring.key ?? ''))) return ring;
   let out = { ...ring };
   for (const hook of mine) {
    if (!fits(hook, grove.key, ring)) continue;
    try {
     const change = hook.editor({ ...out }, { grove });
     if (change && typeof change === 'object') for (const setting of EDITOR_SETTINGS) if (change[setting] !== undefined) out[setting] = change[setting];
    } catch (error) {
     console.error(`[grove-hooks] editor ${grove.key}.${ring.key}:`, error?.message ?? error);
    }
   }
   if (Array.isArray(ring.subrings)) out = { ...out, subrings: walk(ring.subrings) };
   return out;
  });
 return walk(rings);
}
