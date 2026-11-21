// collection-hooks/class-price.js, in a site's own code (docs/collection-hooks.md).
// An editor hook gets the field and the collection, never an entry, so what it
// changes holds for every class: here Price can't be changed in the editor.
// To refuse a change through the API too, or only for some entries, use a
// before webhook instead.
import { defineCollectionHook } from '#timbrr/collection-hook';

export default defineCollectionHook({
 collection: 'classes',
 field: 'price',
 description: 'Price can’t be changed in the editor, and says who sets it.',
 editor: () => ({ readOnly: true, help: 'Prices are set for the season. Ask Priya to change one.' }),
});
