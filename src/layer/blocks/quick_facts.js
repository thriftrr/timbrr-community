import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// A strip of an entry's quick facts in a collection's page design (docs/README.md
// § Collections, "The page design"): Ages 7–17 · Free with membership ·
// 8 weeks · Starts Jan 12. Each collection picks up to four of its fields, in
// order (the studio's `quick_facts` widget saves them to the collection), and
// the studio sets `facts` to the entry's values for them as it serves the
// page and on the canvas. A fact the entry leaves empty isn't drawn.
export default defineBlock({
 type: 'quick_facts',
 label: 'Quick facts',
 description: "A strip of an entry's key facts, in a collection's page design",
 category: 'dynamic',
 icon: 'stats',
 keywords: ['collections', 'entry', 'facts', 'details', 'strip', 'summary', 'template'],
 schema: z.object({
  // Set by the studio as it serves the page; never by a person.
  facts: z
   .array(z.object({ key: z.string().max(40), label: z.string().max(120), text: z.string().max(500) }))
   .max(4)
   .optional(),
 }),
 fields: [{ key: 'facts', label: 'Quick facts', widget: 'quick_facts' }],
 defaults: {},
 wys: {},
});
