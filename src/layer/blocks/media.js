import { z } from 'zod';
import { defineBlock, imageSchema } from '../schema/define.js';

export default defineBlock({
 type: 'media',
 label: 'Media',
 description: 'Single image',
 category: 'content',
 icon: 'media',
 schema: z.object({
  image: imageSchema.default({ src: '', alt: '' }),
  caption: z.string().max(200).default(''),
  width: z.enum(['normal', 'wide']).default('normal'),
 }),
 fields: [
  { key: 'image', label: 'Image', widget: 'image' },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true, ai: 'generate' },
  {
   key: 'width',
   label: 'Width',
   widget: 'buttons',
   options: [
    { label: 'Normal', value: 'normal' },
    { label: 'Wide', value: 'wide' },
   ],
  },
 ],
 defaults: { caption: 'Morning light, before we open.', width: 'normal' },
 wys: { caption: [] },
});
