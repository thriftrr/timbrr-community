import { z } from 'zod';
import { defineBlock, richText, richTextSchema } from '../schema/define.js';

// A bar across the page for news that can't wait: a closure, a hiring
// sign, an emergency. The message, then an optional link that says where
// to read more. Pine is the brand color, clay its warm partner, ink the
// site's darkest shade.
export default defineBlock({
 type: 'announcement',
 label: 'Announcement bar',
 description: 'Closures, hiring, emergency',
 category: 'cta',
 icon: 'announcement',
 retired: true,
 schema: z.object({
  text: richTextSchema.default(richText('')),
  link: z.string().max(60).default(''),
  to: z.string().max(2000).default(''),
  tone: z.enum(['pine', 'clay', 'ink']).default('pine'),
 }),
 fields: [
  { key: 'text', label: 'Message', widget: 'html', inline: true, ai: 'generate', placeholder: 'Closed Monday for the holiday' },
  { key: 'link', label: 'Link label', widget: 'text', inline: true, placeholder: 'Holiday hours', help: 'Leave it empty for no link.' },
  { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/contact or https://…' },
  {
   key: 'tone',
   label: 'Tone',
   widget: 'buttons',
   options: [
    { label: 'Pine', value: 'pine' },
    { label: 'Clay', value: 'clay' },
    { label: 'Ink', value: 'ink' },
   ],
  },
 ],
 defaults: {
  text: richText('Closed Thursday for Thanksgiving. Back Friday at 9 am.'),
  link: 'Holiday hours',
  to: '/contact',
  tone: 'pine',
 },
 wys: { text: ['bold'], link: [], to: [] },
});
