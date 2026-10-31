import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// Empty room between two blocks. A line between them is the divider's job.
export default defineBlock({
 type: 'spacer',
 label: 'Spacer',
 description: 'Vertical whitespace by size',
 category: 'layout',
 icon: 'spacer',
 retired: true,
 schema: z.object({
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
 }),
 fields: [
  {
   key: 'size',
   label: 'Size',
   widget: 'buttons',
   options: [
    { label: 'S', value: 'sm' },
    { label: 'M', value: 'md' },
    { label: 'L', value: 'lg' },
    { label: 'XL', value: 'xl' },
   ],
  },
 ],
 defaults: { size: 'md' },
 wys: {},
});
