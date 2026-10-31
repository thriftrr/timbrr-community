import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// A band of color with a small label, marking where a new part of the page
// starts. Pages are a flat list of blocks, so a section can't hold blocks
// of its own: the ones after it carry on below the band.
export default defineBlock({
 type: 'section',
 label: 'Section',
 description: 'Background, padding, width wrapper',
 category: 'layout',
 icon: 'section',
 retired: true,
 schema: z.object({
  tagline: z.string().max(60).default(''),
  bg: z.enum(['paper', 'white', 'pine']).default('paper'),
  padding: z.enum(['tight', 'normal', 'roomy']).default('normal'),
 }),
 fields: [
  {
   key: 'tagline',
   label: 'Label',
   widget: 'text',
   inline: true,
   placeholder: 'About us',
   help: "A word or two in the middle of the band, or leave it empty. Blocks don't go inside a section: the next one starts below the band.",
  },
  {
   key: 'bg',
   label: 'Background',
   widget: 'buttons',
   options: [
    { label: 'Paper', value: 'paper' },
    { label: 'White', value: 'white' },
    { label: 'Pine', value: 'pine' },
   ],
  },
  {
   key: 'padding',
   label: 'Padding',
   widget: 'buttons',
   options: [
    { label: 'Tight', value: 'tight' },
    { label: 'Normal', value: 'normal' },
    { label: 'Roomy', value: 'roomy' },
   ],
  },
 ],
 defaults: { tagline: 'About us', bg: 'paper', padding: 'normal' },
 wys: { tagline: [] },
});
