import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

export default defineBlock({
 type: 'divider',
 label: 'Divider',
 description: 'Rule or decorative break',
 category: 'layout',
 icon: 'divider',
 schema: z.object({
  style: z.enum(['line', 'dots', 'leaf']).default('line'),
 }),
 fields: [
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Line', value: 'line' },
    { label: 'Dots', value: 'dots' },
    { label: 'Leaf', value: 'leaf' },
   ],
  },
 ],
 defaults: { style: 'line' },
 wys: {},
});
