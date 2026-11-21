// collection-hooks/class-price.js, in a site's own code (docs/collection-hooks.md).
// An editor hook gets the field and the collection, never an entry, so it can't
// tell a full class from one with places left: it locks Price for every class.
// To lock only the full ones, check the entry in a before webhook instead.
import { defineCollectionHook } from '#timbrr/collection-hook';

export default defineCollectionHook({
 collection: 'classes',
 field: 'price',
 description: 'Locks the Price field of every class in the editor and says why. The editor can’t see which class is open, so it locks them all; a before webhook is the way to lock only full ones.',
 editor: () => ({ readOnly: true, help: 'This class is full, so its price is locked.' }),
});
