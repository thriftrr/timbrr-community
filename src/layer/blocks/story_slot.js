import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// Where each entry's own story goes in a collection's page design (docs/README.md
// § Collections, "Page builder"). A collection's Page builder field holds a free
// list of blocks per entry; the design marks its place with this block, and
// says which blocks may go there, which a new entry starts with, how many it
// holds and whether it can be left empty (the studio's `story_slot` widget
// sets all of them). The studio holds to them as an entry's story is saved.
//
// Served, the studio puts the entry's blocks in this block's place, as the
// page's own. On the canvas it sets `story` to the previewed entry's blocks,
// which this draws inside a dashed frame as the site will draw them; with no
// entry, or an empty story, the frame says what goes there.
export default defineBlock({
 type: 'story_slot',
 label: 'Story slot',
 description: "Where each entry's own blocks go, in a collection's page design",
 category: 'dynamic',
 icon: 'layers',
 keywords: ['collections', 'entry', 'story', 'body', 'page builder', 'slot', 'template'],
 schema: z.object({
  // The Page builder field it draws: '' is the collection's first.
  field: z.string().max(40).default(''),
  allow: z.enum(['any', 'only']).default('any'),
  only: z.array(z.string().max(48)).max(60).default([]),
  starters: z.array(z.string().max(48)).max(12).default([]),
  // 0: no limit.
  max: z.int().min(0).max(60).default(0),
  // Off: an entry needs a block in its story before it's published.
  empty: z.boolean().default(true),
  // Set by the studio on the canvas; never by a person.
  story: z.array(z.any()).max(60).optional(),
 }),
 fields: [{ key: 'field', label: 'Story', widget: 'story_slot' }],
 defaults: { field: '', allow: 'any', only: [], starters: [], max: 0, empty: true },
 without: ['background', 'spacing', 'above', 'below', 'divider'],
 wys: {},
});
