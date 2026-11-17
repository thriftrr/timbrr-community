import { z } from 'zod';
import { defineBlock, groveSourceSchema } from '../schema/define.js';

// Repeat for each sapling (docs/README.md § Groves, "Grove blocks"): the
// blocks after this one, up to an "End of the repeat" (this block with
// `end` on), are drawn once for each sapling `source` lists, each copy
// filled with that sapling's tokens and rings. It's what a grove block in
// the studio's Library is made of, and works on any page.
//
// The studio does the repeating as it serves the page: the site gets this
// block alone, with `items` (one list of blocks for each sapling, at most 20
// saplings of 10 blocks) in place of the area, and draws them as a grid. On
// the canvas the area is drawn once, under a band that says it repeats.
export default defineBlock({
 type: 'grove_repeat',
 label: 'Repeat for each sapling',
 description: 'Blocks drawn once for each sapling of a grove',
 category: 'dynamic',
 icon: 'grid',
 keywords: ['groves', 'saplings', 'repeat', 'loop', 'each', 'grove block', 'template'],
 schema: z.object({
  source: groveSourceSchema,
  columns: z.enum(['1', '2', '3', '4']).default('3'),
  gap: z.enum(['small', 'medium', 'large']).default('medium'),
  empty: z.string().max(160).default(''),
  end: z.boolean().default(false),
  // Set by the studio as it serves the page; never by a person.
  items: z.array(z.array(z.any()).max(10)).max(20).optional(),
 }),
 fields: [
  { key: 'source', label: 'Repeat for each of', widget: 'grove', when: { end: { not: true } }, help: 'Up to 20 saplings.' },
  {
   key: 'columns',
   label: 'Across',
   widget: 'buttons',
   when: { end: { not: true } },
   options: ['1', '2', '3', '4'].map((value) => ({ label: value, value })),
  },
  {
   key: 'gap',
   label: 'Room between',
   widget: 'buttons',
   when: { end: { not: true } },
   options: [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
   ],
  },
  { key: 'empty', label: 'When there are none', widget: 'text', when: { end: { not: true } }, placeholder: 'Nothing here yet.' },
  { key: 'end', label: 'This is the end of the repeat', widget: 'switch', help: 'The blocks between a repeat and its end are what repeats. With no end, every block after it does.' },
 ],
 presets: [{ key: 'end', label: 'End of the repeat', description: 'Where the repeated blocks stop', data: { end: true } }],
 defaults: { columns: '3', gap: 'medium', empty: '', end: false },
 without: ['divider'],
 wys: {},
});
