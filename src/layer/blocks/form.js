import { z } from 'zod';
import { defineBlock, imageSchema, richText, richTextSchema } from '../schema/define.js';

// A form from the site's Forms, by id: the studio holds it, its fields, emails
// and everything anyone sent (the studio's docs/forms.md), and every page
// showing it updates when it's published. All the block says is which one, its
// heading on this page when that differs or none at all, and how it sits on the
// page: on its own, or 50/50 with a photo and words of the block's own beside it.
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
  { key: 'headline', label: 'Heading on this page', widget: 'text', help: "Leave empty to use the form's own heading." },
  { key: 'hide_title', label: 'Hide heading', widget: 'switch', help: "Starts at the form's first line, with no heading above it." },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Full width', value: 'full' },
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
   help: 'For the 50/50 layout. On phones the content sits above the form.',
  },
  { key: 'content_heading', label: 'Heading beside the form', widget: 'text', inline: true, help: 'For the 50/50 layout.' },
  { key: 'content_body', label: 'Text beside the form', widget: 'html', inline: true, ai: 'write', help: 'For the 50/50 layout.' },
  { key: 'image', label: 'Image beside the form', widget: 'image', help: 'For the 50/50 layout.' },
 ],
 defaults: { form: '', headline: '' },
 wys: {
  headline: [],
  content_heading: [],
  content_body: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
 },
});
