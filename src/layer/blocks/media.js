import { z } from 'zod';
import { defineBlock, imageSchema } from '../schema/define.js';

export default defineBlock({
 type: 'media',
 label: 'Media',
 description: 'Single image',
 category: 'content',
 icon: 'image',
 schema: z.object({
  image: imageSchema.default({ src: '', alt: '' }),
  caption: z.string().max(200).default(''),
  width: z.enum(['contained', 'wide', 'full']).default('contained'),
 }),
 fields: [
  { key: 'image', label: 'Image', widget: 'image' },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true },
  {
   key: 'width',
   label: 'Width',
   widget: 'buttons',
   options: [
    { label: 'Contained', value: 'contained' },
    { label: 'Wide', value: 'wide' },
    { label: 'Full', value: 'full' },
   ],
  },
 ],
 defaults: { caption: '' },
 wys: { caption: [] },
});
