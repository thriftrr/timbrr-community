import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema } from '../schema/define.js';

// A sign-up band for a text or email club: one box beside a button, with
// the consent copy under it. The form draws as designed, but sending isn't
// wired up yet: its button doesn't send anything, and the button label's
// help says so in the studio. `channel` decides what the box asks for, so
// phones show the right keyboard and offer the right autofill.
export default defineBlock({
 type: 'text_club',
 label: 'Text / email club',
 description: 'Loyalty signup with consent',
 category: 'cta',
 icon: 'text_club',
 schema: z.object({
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  placeholder: z.string().max(60).default(''),
  channel: z.enum(['phone', 'email']).default('phone'),
  consent: z.string().max(500).default(''),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  { key: 'placeholder', label: 'Field placeholder', widget: 'text', inline: true, help: 'The hint inside the empty box.' },
  {
   key: 'channel',
   label: 'Sign up with',
   widget: 'buttons',
   options: [
    { label: 'Phone', value: 'phone' },
    { label: 'Email', value: 'email' },
   ],
   help: 'What the box asks for.',
  },
  {
   key: 'consent',
   label: 'Consent copy',
   widget: 'textarea',
   inline: true,
   help: "Shown under the box. Say who's sending, how often, and how to stop.",
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
  headline: 'Join the text club',
  body: richText('New arrivals, events and the occasional deal. Two texts a month, tops.'),
  placeholder: 'Phone number',
  channel: 'phone',
  consent: 'By joining you agree to receive texts from us. Msg & data rates may apply. Reply STOP to opt out.',
  submit_label: 'Join',
 },
 wys: { headline: [], body: ['bold', 'italic', 'link'], placeholder: [], consent: [], submit_label: [] },
});
