import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// A contact form: a line of intro over boxes for a name, an email address
// and a message. The form draws as designed, but sending isn't wired up
// yet: its button doesn't send anything, and the button label's help says
// so in the studio.
export default defineBlock({
 type: 'form',
 label: 'Form',
 description: 'Contact / catering inquiry',
 category: 'dynamic',
 icon: 'form',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  intro: richTextSchema.default(richText('')),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'intro', label: 'Intro', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'submit_label',
   label: 'Button label',
   widget: 'text',
   inline: true,
   help: "Sending isn't switched on yet: visitors see the form, but pressing the button doesn't send anything.",
  },
 ],
 defaults: {
  tagline: 'Say hi',
  headline: 'Get in touch',
  intro: richText('Questions, orders or just a hello. We read every message.'),
  submit_label: 'Send message',
 },
 wys: { tagline: [], headline: [], intro: ['bold', 'italic'], submit_label: [] },
});
