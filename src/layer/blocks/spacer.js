import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

export default defineBlock({
 type: 'spacer',
 label: 'Spacer',
 description: 'Room between blocks, or a line',
 category: 'layout',
 icon: 'separator-horizontal',
 schema: z.object({
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  line: z.enum(['none', 'line']).default('none'),
 }),
 fields: [
  {
   key: 'size',
   label: 'Size',
   widget: 'buttons',
   options: [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
   ],
  },
  {
   key: 'line',
   label: 'Line',
   widget: 'buttons',
   options: [
    { label: 'None', value: 'none' },
    { label: 'Line', value: 'line' },
   ],
  },
 ],
 defaults: {},
 wys: {},
});
