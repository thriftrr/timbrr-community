import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField } from '../schema/define.js';

export default defineBlock({
 type: 'cta',
 label: 'Call to action',
 description: 'Banner + buttons',
 category: 'cta',
 icon: 'megaphone',
 schema: z.object({
  headline: z.string().max(160).default(''),
  description: z.string().max(400).default(''),
  tone: z.enum(['accent', 'dark', 'soft']).default('accent'),
  buttons: z.array(buttonSchema).max(2).default([]),
 }),
 fields: [
  headlineField,
  { key: 'description', label: 'Description', widget: 'textarea', inline: true, ai: 'improve' },
  {
   key: 'tone',
   label: 'Color',
   widget: 'buttons',
   options: [
    { label: 'Brand', value: 'accent' },
    { label: 'Dark', value: 'dark' },
    { label: 'Soft', value: 'soft' },
   ],
  },
  buttonsField,
 ],
 defaults: {
  headline: 'Ready when you are.',
  description: 'Tell people the one thing to do next.',
  buttons: [{ label: 'Get in touch', to: '/contact', style: 'solid' }],
 },
 wys: { headline: ['italic'], description: [] },
});
