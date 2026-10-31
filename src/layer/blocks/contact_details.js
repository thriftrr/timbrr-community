import { z } from 'zod';
import { defineBlock, taglineField } from '../schema/define.js';

// Typed into the block for now; it doesn't read the site's settings. The
// number dials, the email opens a new message, and a handle links to its
// profile (or to the row's own link).
export default defineBlock({
 type: 'contact_details',
 label: 'Contact details',
 description: 'Phone, email, socials from settings',
 category: 'dynamic',
 icon: 'contact_details',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  phone: z.string().max(40).default(''),
  email: z.string().max(120).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(40).default(''),
     body: z.string().max(100).default(''),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(8)
   .default([]),
 }),
 fields: [
  taglineField,
  { key: 'phone', label: 'Phone', widget: 'text', inline: true, placeholder: '(555) 555-0123', help: 'On a phone, tapping it starts a call.' },
  { key: 'email', label: 'Email', widget: 'text', inline: true, placeholder: 'hello@example.com' },
  {
   key: 'items',
   label: 'Social',
   widget: 'items',
   itemLabel: 'title',
   max: 8,
   subfields: [
    { key: 'title', label: 'Network', widget: 'text', inline: true, placeholder: 'Instagram' },
    { key: 'body', label: 'Handle', widget: 'text', inline: true, placeholder: '@yourshop' },
    {
     key: 'to',
     label: 'Links to',
     widget: 'text',
     link: true,
     help: 'Not needed for Instagram, Facebook, TikTok, X or YouTube: the handle is enough.',
    },
   ],
  },
 ],
 defaults: {
  tagline: 'Say hi',
  phone: '(555) 555-0123',
  email: 'hello@example.com',
  items: [
   { title: 'Instagram', body: '@yourshop' },
   { title: 'Facebook', body: '/yourshop' },
  ],
 },
 wys: { tagline: [], phone: [], email: [], 'items.*.title': [], 'items.*.body': [], 'items.*.to': [] },
});
