import { z } from 'zod';
import { defineBlock } from '../schema/define.js';
import { SPLIT_COLUMN_BLOCKS, SPLIT_RATIOS } from '../app/utils/split.js';

// Splits the page into two to four columns, each holding a short list of
// ordinary blocks (docs/sub-blocks.md). A block says whether it may go in a
// column (`inside`) and draws a compact form there. The children are kept in
// `columns`, one list for each column, as the blocks they are: id, type, data.
// Their ids stay unique across the page.
const child = z.object({
 id: z.string().max(64),
 type: z.string().max(48),
 data: z.record(z.string(), z.unknown()).default({}),
});

export default defineBlock({
 type: 'split',
 label: 'Split',
 description: 'Columns that each hold blocks',
 category: 'layout',
 icon: 'split',
 keywords: ['columns', 'side by side', 'two columns', 'three columns', 'halves', 'thirds', 'layout'],
 schema: z.object({
  ratio: z.enum(Object.keys(SPLIT_RATIOS)).default('halves'),
  gap: z.enum(['tight', 'normal', 'roomy']).default('normal'),
  align: z.enum(['top', 'middle', 'bottom']).default('top'),
  phone_first: z.enum(['left', 'right']).default('left'),
  columns: z.array(z.array(child).max(SPLIT_COLUMN_BLOCKS)).min(2).max(4).default([[], []]),
 }),
 fields: [
  {
   key: 'ratio',
   label: 'Ratio',
   widget: 'buttons',
   // `bars` is each column's share, for a studio to draw the choice as bars.
   options: Object.entries(SPLIT_RATIOS).map(([value, { label, widths }]) => ({ label, value, bars: widths })),
   help: 'Below 860px wide every split is one column.',
  },
  {
   key: 'align',
   label: 'Line up',
   widget: 'buttons',
   options: [
    { label: 'Top', value: 'top' },
    { label: 'Middle', value: 'middle' },
    { label: 'Bottom', value: 'bottom' },
   ],
  },
  {
   key: 'gap',
   label: 'Gap',
   widget: 'buttons',
   options: [
    { label: 'Tight', value: 'tight' },
    { label: 'Normal', value: 'normal' },
    { label: 'Roomy', value: 'roomy' },
   ],
  },
  {
   key: 'phone_first',
   label: 'On a phone, first',
   widget: 'buttons',
   options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
   ],
   help: 'The columns stack on a phone. Right puts them in the opposite order.',
  },
  { key: 'columns', label: 'In the columns', widget: 'blocks' },
 ],
 defaults: { ratio: 'halves', gap: 'normal', align: 'top', phone_first: 'left', columns: [[], []] },
});
