import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// A quote request: a few words over a short form for a name, a phone
// number, the service wanted and photos of the job. The form draws as
// designed, but sending isn't wired up yet: its button doesn't send
// anything, and the button label's help says so in the studio.
export default defineBlock({
 type: 'request_quote',
 label: 'Request a quote',
 description: 'Name, phone, service, photo',
 category: 'cta',
 icon: 'request_quote',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  services: z
   .array(z.object({ name: z.string().max(80).default('') }))
   .max(20)
   .default([]),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'services',
   label: 'Services',
   widget: 'items',
   itemLabel: 'name',
   max: 20,
   help: "The choices in the form's Service menu. With none, the menu is left out.",
   subfields: [{ key: 'name', label: 'Service', widget: 'text' }],
  },
  {
   key: 'submit_label',
   label: 'Button label',
   widget: 'text',
   inline: true,
   help: "Sending isn't switched on yet: visitors see the form, but pressing the button doesn't send anything.",
  },
 ],
 defaults: {
  tagline: 'Quotes & estimates',
  headline: 'Tell us what you need',
  body: richText('What, where and when, plus a photo or two if it helps. A real person replies within one business day.'),
  services: [{ name: 'One-time job' }, { name: 'Regular service' }, { name: 'Something else' }],
  submit_label: 'Request a quote',
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], 'services.*.name': [], submit_label: [] },
});
