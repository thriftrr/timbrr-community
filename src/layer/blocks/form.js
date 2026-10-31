import { z } from 'zod';
import { defineBlock, richText, richTextSchema } from '../schema/define.js';

// A form from the site's Forms, by id: the studio holds it, its fields, emails
// and everything anyone sent (the studio's docs/forms.md), and every page
// showing it updates when it's published. All the block says is which one, its
// heading on this page when that differs, and how it sits on the page.
//
// `tagline` through `submit_label` are what a block held before forms were
// their own thing. They stay in the schema, unedited, so a page that still has
// them keeps saving and drawing (TbFormLegacy) until scripts/convert-forms.mjs
// has moved it; a later release removes them.
export default defineBlock({
 type: 'form',
 label: 'Form',
 description: 'Contact, newsletter signup, quote request',
 category: 'dynamic',
 icon: 'form',
 keywords: ['contact', 'email', 'newsletter', 'signup', 'sign up', 'quote', 'estimate', 'inquiry', 'catering', 'booking'],
 schema: z.object({
  form: z.string().max(64).default(''),
  headline: z.string().max(160).default(''),
  tagline: z.string().max(80).default(''),
  intro: richTextSchema.default(richText('')),
  purpose: z.enum(['contact', 'signup', 'quote', 'text_club']).default('contact'),
  services: z
   .array(z.object({ name: z.string().max(80).default('') }))
   .max(20)
   .default([]),
  placeholder: z.string().max(60).default(''),
  channel: z.enum(['phone', 'email']).default('phone'),
  consent: z.string().max(500).default(''),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  { key: 'form', label: 'Which form', widget: 'form' },
  { key: 'headline', label: 'Heading on this page', widget: 'text', help: "Leave empty to use the form's own heading." },
 ],
 defaults: { form: '', headline: '' },
 wys: { headline: [] },
});
