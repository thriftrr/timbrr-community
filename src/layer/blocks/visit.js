import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Hours, address, map and phone, read from the site's own details
// (docs/blocks.md § Visit), so they're typed once and every block agrees.
// `custom` is typed text that wins over those details, key by key, for this
// block alone. It's where a converted Hours, Location or Contact details keeps
// what it had, and `links`, `areas` and the area's words are what the old
// Contact details and Service area held that Site details has no place for.
const switches = { show_hours: false, show_address: false, show_map: false, show_phone: false, show_open_now: false };

export default defineBlock({
 type: 'visit',
 label: 'Visit',
 description: 'Hours, address, map and phone from Settings',
 category: 'dynamic',
 icon: 'visit',
 keywords: ['open', 'opening hours', 'address', 'map', 'directions', 'phone', 'contact', 'find us', 'where'],
 presets: [
  {
   key: 'hours',
   label: 'Hours',
   description: 'When you’re open, and whether you are now',
   data: { ...switches, show_hours: true, show_open_now: true, tagline: 'Hours', headline: 'Come by' },
  },
  {
   key: 'location',
   label: 'Location',
   description: 'Address, map, directions',
   data: { ...switches, show_address: true, show_map: true, tagline: 'Find us', headline: 'Where to find us' },
  },
  {
   key: 'contact_details',
   label: 'Contact details',
   description: 'Phone and email',
   data: { ...switches, show_phone: true, tagline: 'Say hi', headline: 'Get in touch' },
  },
  {
   key: 'service_area',
   label: 'Service area',
   description: 'The places you go',
   data: {
    ...switches,
    tagline: 'We come to you',
    headline: 'Where we work',
    area_body: richText('Free estimates and no trip charge anywhere in the areas below. Just outside the list? Ask. We often make the trip anyway.'),
    areas: [{ title: 'Downtown' }, { title: 'Midtown' }, { title: 'Old Town' }, { title: 'Riverside' }, { title: 'North End' }, { title: 'West Side' }, { title: 'Lakeside' }],
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  show_hours: z.boolean().default(true),
  show_open_now: z.boolean().default(true),
  show_address: z.boolean().default(true),
  show_map: z.boolean().default(true),
  show_phone: z.boolean().default(true),
  links: z
   .array(
    z.object({
     title: z.string().max(40).default(''),
     body: z.string().max(100).default(''),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(8)
   .default([]),
  area_headline: z.string().max(160).default(''),
  area_body: richTextSchema.default(richText('')),
  areas: z
   .array(z.object({ title: z.string().max(80).default('') }))
   .max(24)
   .default([]),
  custom: z
   .object({
    phone: z.string().max(40).default(''),
    email: z.string().max(120).default(''),
    address: z.string().max(240).default(''),
    hours: z
     .array(z.object({ title: z.string().max(40).default(''), body: z.string().max(60).default('') }))
     .max(10)
     .default([]),
    note: z.string().max(1000).default(''),
    map_url: z.string().max(2000).default(''),
   })
   .prefault({}),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'show_hours', label: 'Hours', widget: 'switch' },
  { key: 'show_open_now', label: 'Open now', widget: 'switch', help: 'Worked out from your hours and time zone in Site settings. With neither, it just doesn’t show.' },
  { key: 'show_address', label: 'Address', widget: 'switch' },
  { key: 'show_map', label: 'Map', widget: 'switch', help: 'A drawn map that opens the address in Google Maps, not a live map.' },
  { key: 'show_phone', label: 'Phone and email', widget: 'switch' },
  {
   key: 'links',
   label: 'Social',
   widget: 'items',
   itemLabel: 'title',
   max: 8,
   subfields: [
    { key: 'title', label: 'Network', widget: 'text', inline: true, placeholder: 'Instagram' },
    { key: 'body', label: 'Handle', widget: 'text', inline: true, placeholder: '@yourshop' },
    { key: 'to', label: 'Links to', widget: 'text', link: true, help: 'Not needed for Instagram, Facebook, TikTok, X or YouTube: the handle is enough.' },
   ],
  },
  { key: 'area_headline', label: 'Service area headline', widget: 'text', inline: true, placeholder: 'Where we work' },
  { key: 'area_body', label: 'Service area text', widget: 'html', inline: true },
  {
   key: 'areas',
   label: 'Service areas',
   widget: 'items',
   itemLabel: 'title',
   max: 24,
   subfields: [{ key: 'title', label: 'Area', widget: 'text', inline: true, placeholder: 'Neighborhood or town' }],
  },
  {
   key: 'custom',
   label: 'Use different details',
   widget: 'group',
   help: 'Anything you fill in here wins over Site settings, for this block only.',
   subfields: [
    { key: 'phone', label: 'Phone', widget: 'text' },
    { key: 'email', label: 'Email', widget: 'text' },
    { key: 'address', label: 'Address', widget: 'textarea' },
    {
     key: 'hours',
     label: 'Hours',
     widget: 'items',
     itemLabel: 'title',
     max: 10,
     subfields: [
      { key: 'title', label: 'Days', widget: 'text', placeholder: 'Mon – Fri' },
      { key: 'body', label: 'Hours', widget: 'text', placeholder: '9:00 am – 5:00 pm' },
     ],
    },
    { key: 'note', label: 'Note', widget: 'textarea' },
    { key: 'map_url', label: 'Map link', widget: 'text', link: true },
   ],
  },
 ],
 defaults: {
  tagline: 'Visit',
  headline: 'Come see us',
  show_hours: true,
  show_open_now: true,
  show_address: true,
  show_map: true,
  show_phone: true,
 },
 wys: {
  tagline: [],
  headline: [],
  'links.*.title': [],
  'links.*.body': [],
  area_headline: [],
  area_body: ['bold', 'italic', 'link'],
  'areas.*.title': [],
 },
});
