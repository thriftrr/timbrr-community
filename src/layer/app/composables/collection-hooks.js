import { collectionHooks } from '#timbrr/collection-hooks';
import { formatFieldValue } from '#timbrr/collection-hook';

// The site's collection hooks (defineCollectionHook, docs/collection-hooks.md) for drawing.
// format(field, value, entry, collection): the value as given when no hook
// formats this field, else the hook's answer as a string, which the caller
// draws as plain text (never as markup). TbFieldValue calls it first.
export function useCollectionHooks() {
 return {
  hooks: collectionHooks,
  format: (field, value, entry, collection) => (collectionHooks.length ? formatFieldValue(collectionHooks, field, value, entry, collection) : value),
 };
}
