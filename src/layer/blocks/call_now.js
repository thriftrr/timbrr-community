import { z } from 'zod';
import { defineBlock, headlineField } from '../schema/define.js';

// The number dials when it's tapped. The hours line is typed in, not
// worked out from the site's hours, so it says nothing that can go stale
// ("open now") unless someone types it.
export default defineBlock({
 type: 'call_now',
 label: 'Call now',
 description: 'Click-to-call, mobile-first',
 category: 'cta',
 icon: 'call_now',
 schema: z.object({
  headline: z.string().max(120).default(''),
  phone: z.string().max(40).default(''),
  body: z.string().max(120).default(''),
  note: z.string().max(120).default(''),
 }),
 fields: [
  headlineField,
  { key: 'phone', label: 'Phone', widget: 'text', inline: true, placeholder: '(555) 555-0123', help: 'On a phone, tapping it starts a call.' },
  { key: 'body', label: 'Hours line', widget: 'text', inline: true, placeholder: 'Open Mon–Sat · 9:00 am – 6:00 pm', help: 'When someone picks up.' },
  { key: 'note', label: 'Note', widget: 'text', inline: true },
 ],
 defaults: {
  headline: 'Questions? Give us a call.',
  phone: '(555) 555-0123',
  body: 'Open Mon–Sat · 9:00 am – 6:00 pm',
  note: 'Tap to call on mobile',
 },
 wys: { headline: [], phone: [], body: [], note: [] },
});
