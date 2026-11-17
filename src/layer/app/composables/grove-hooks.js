import { groveHooks } from '#timbrr/grove-hooks';
import { formatRingValue } from '#timbrr/grove-hook';

// The site's grove hooks (defineGroveHook, docs/grove-hooks.md) for drawing.
// format(ring, value, sapling, grove): the value as given when no hook
// formats this ring, else the hook's answer as a string, which the caller
// draws as plain text (never as markup). TbRingValue calls it first.
export function useGroveHooks() {
 return {
  hooks: groveHooks,
  format: (ring, value, sapling, grove) => (groveHooks.length ? formatRingValue(groveHooks, ring, value, sapling, grove) : value),
 };
}
