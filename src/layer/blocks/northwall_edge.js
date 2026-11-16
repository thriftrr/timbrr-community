import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// North Wall's mountain ridge, as a block of its own: it goes between two
// blocks, cuts into the bottom of the one above (it's pulled up over it by
// its own height) and leaves room under it. Its Background is the color of
// the ridge and of that room, so pick the color of the block below. It holds
// no words.
export default defineBlock({
 type: 'northwall_edge',
 label: 'Ridge edge',
 description: 'A mountain ridge cut into the block above',
 category: 'layout',
 icon: 'divider',
 owner: 'North Wall',
 keywords: ['edge', 'ridge', 'peaks', 'mountain', 'separator', 'divider', 'spacer', 'shape'],
 without: ['divider'],
 schema: z.object({
  height: z.enum(['low', 'medium', 'tall']).default('medium'),
  flip: z.boolean().default(false),
 }),
 fields: [
  {
   key: 'height',
   label: 'Ridge height',
   widget: 'buttons',
   options: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'Tall', value: 'tall' },
   ],
  },
  { key: 'flip', label: 'Peaks on the right', widget: 'switch' },
 ],
 defaults: { height: 'medium', flip: false, spacing: 'tight' },
 wys: {},
});
