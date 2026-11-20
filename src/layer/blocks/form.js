import { z } from 'zod';
import { defineBlock, imageSchema, richText, richTextSchema } from '../schema/define.js';

// A form from the site's Forms, by id: the studio holds it, its fields, emails
// and everything anyone sent (the studio's docs/forms.md), and every page
// showing it updates when it's published. All the block says is which one, its
// heading and intro on this page (the block's own words, empty for none), and
// how it sits on the page: on its own, or 50/50 with a photo and words of the
// block's own beside it.
//
// `heading` and `lede` are the block's words. A block that has `heading` draws
// them; one that doesn't (saved before the form's words moved here) still draws
// what it did, the form's own title and intro, until scripts/convert-blocks.mjs
// has filled them in. `headline` and `hide_title` are that older way and stay
// in the schema, unedited, for those blocks.
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
 loads: ['turnstile'],
 icon: 'form',
 keywords: ['contact', 'email', 'newsletter', 'signup', 'sign up', 'quote', 'estimate', 'inquiry', 'catering', 'booking'],
 schema: z.object({
  form: z.string().max(64).default(''),
  // No default, on purpose: a block with no `heading` at all is one that hasn't
  // been converted yet, which the page can only tell if nothing fills it in.
  heading: z.string().max(160).optional(),
  lede: richTextSchema.optional(),
  headline: z.string().max(160).default(''),
  hide_title: z.boolean().default(false),
  layout: z.enum(['full', 'split']).default('full'),
  content_side: z.enum(['left', 'right']).default('left'),
  content_heading: z.string().max(160).default(''),
  content_body: richTextSchema.default(richText('')),
  image: imageSchema.default({ src: '', alt: '' }),
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
  { key: 'heading', label: 'Heading', widget: 'text', fallback: 'headline', help: 'Leave empty for no heading.' },
  { key: 'lede', label: 'Intro', widget: 'html', help: 'A few words under the heading. Leave empty for none.' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Form only', value: 'full' },
    { label: '50/50', value: 'split' },
   ],
   help: 'With nothing to put beside it, a 50/50 form draws full width.',
  },
  {
   key: 'content_side',
   label: 'Content side',
   widget: 'buttons',
   options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
   ],
   when: { layout: 'split' },
   help: 'On phones the content sits above the form.',
  },
  { key: 'content_heading', label: 'Heading beside the form', widget: 'text', inline: true, when: { layout: 'split' } },
  { key: 'content_body', label: 'Text beside the form', widget: 'html', inline: true, ai: 'write', when: { layout: 'split' } },
  { key: 'image', label: 'Image beside the form', widget: 'image', when: { layout: 'split' } },
 ],
 defaults: { form: '', heading: '', lede: '' },
 wys: {
  content_heading: [],
  content_body: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
 },
});
