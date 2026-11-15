import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// Another service's page, shown in a frame: a booking calendar, a class
// list, a gift card shop. Only ever an address in a sandboxed frame, never
// a pasted script, so nothing from the other service runs as part of the
// site (embedFrame, app/utils/blocks.js). Pasting the service's whole embed
// code works too: the address is all that's read from it.
export default defineBlock({
 type: 'northwall_embed',
 label: 'Embed',
 description: 'A booking calendar, schedule or shop from another service',
 category: 'dynamic',
 icon: 'embed',
 owner: 'North Wall',
 keywords: ['widget', 'iframe', 'calendar', 'schedule', 'booking', 'rock gym pro', 'gift cards', 'third party'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  url: z.string().max(2000).default(''),
  title: z.string().max(120).default(''),
  height: z.enum(['short', 'medium', 'tall']).default('medium'),
  width: z.enum(['normal', 'wide']).default('normal'),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'url',
   label: 'Address or embed code',
   widget: 'textarea',
   placeholder: 'https://…',
   help: 'Paste the address the service gave you, or its whole embed code. Only the address is used.',
  },
  {
   key: 'title',
   label: 'What it is',
   widget: 'text',
   placeholder: 'Class calendar',
   help: 'Read out by screen readers. Leave it empty to use the headline.',
  },
  {
   key: 'height',
   label: 'Height',
   widget: 'buttons',
   options: [
    { label: 'Short', value: 'short' },
    { label: 'Medium', value: 'medium' },
    { label: 'Tall', value: 'tall' },
   ],
   help: 'Anything longer scrolls inside the frame.',
  },
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
 defaults: { tagline: '', headline: 'Book online', url: '', title: '', height: 'medium', width: 'normal' },
 wys: { tagline: [], headline: [] },
});
