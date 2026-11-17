import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// Retired: the Collection list (blocks/collection_list.js) took its place on 2026-11-17, when
// groves, saplings, rings and branches became collections, entries, fields
// and values. Pages saved with this one keep it until the studio's
// convert-blocks moves them, and the studio serves it as the new one in the
// meantime, so on the canvas it draws only a note to convert the page. Its
// data is kept as it was, unread.
export default defineBlock({
 type: 'grove_list',
 label: 'Collection list (old)',
 description: 'A list of entries of one collection',
 category: 'dynamic',
 icon: 'feed',
 retired: true,
 keywords: [],
 schema: z.looseObject({}),
 fields: [],
 defaults: {},
});
