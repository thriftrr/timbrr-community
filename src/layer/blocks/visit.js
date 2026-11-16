import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Hours, address, map and phone, read from the site's own details
// (docs/blocks.md § Visit), so they're typed once and every block agrees.
// `custom` is typed text that wins over those details, key by key, for this
// block alone. It's where a converted Hours, Location or Contact details keeps
// what it had, and `links`, `areas` and the area's words are what the old
// Contact details and Service area held that Site details has no place for.
// What a Visit can show, in the order the inspector lists them.
const PARTS = ['hours', 'open_now', 'address', 'map', 'phone'];

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
   data: { show: ['hours', 'open_now'], tagline: 'Hours', headline: 'Come by' },
  },
  {
   key: 'location',
   label: 'Location',
   description: 'Address, map, directions',
   data: { show: ['address', 'map'], tagline: 'Find us', headline: 'Where to find us' },
  },
  {
   key: 'contact_details',
   label: 'Contact details',
   description: 'Phone and email',
   data: { show: ['phone'], tagline: 'Say hi', headline: 'Get in touch' },
  },
  {
   key: 'service_area',
   label: 'Service area',
   description: 'The places you go',
   data: {
    show: [],
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
  // Which parts show. A block saved before this list existed has five
  // switches instead (show_hours…): the component reads those until the
  // studio's convert-blocks script has moved the page over, so `show` has no
  // default of its own. New blocks get all five from `defaults`.
  show: z.array(z.enum(PARTS)).max(PARTS.length).optional(),
  show_hours: z.boolean().optional(),
  show_open_now: z.boolean().optional(),
  show_address: z.boolean().optional(),
  show_map: z.boolean().optional(),
  show_phone: z.boolean().optional(),
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
  {
   key: 'show',
   label: 'Show',
   widget: 'checks',
   options: [
    { label: 'Hours', value: 'hours' },
    { label: 'Open now', value: 'open_now', help: 'Worked out from your hours and time zone in Site settings. With neither, it just doesn’t show.' },
    { label: 'Address', value: 'address' },
    { label: 'Map', value: 'map', help: 'A drawn map that opens the address in Google Maps, not a live map.' },
    { label: 'Phone and email', value: 'phone' },
   ],
  },
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
   // One short name each, typed as tags; saved as rows of { title }, as
   // they always were, so the canvas still edits each one in place.
   widget: 'tags',
   of: 'title',
   max: 24,
   placeholder: 'Neighborhood or town',
  },
  {
   key: 'custom',
   label: 'Use different details',
   widget: 'group',
   help: 'Anything you fill in here wins over Site settings, for this block only.',
   subfields: [
    { key: 'phone', label: 'Phone', widget: 'text', format: 'tel', when: { '^show': 'phone' } },
    { key: 'email', label: 'Email', widget: 'text', format: 'email', when: { '^show': 'phone' } },
    { key: 'address', label: 'Address', widget: 'textarea', when: { '^show': 'address' } },
    {
     key: 'hours',
     when: { '^show': 'hours' },
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
    { key: 'map_url', label: 'Map link', widget: 'text', link: true, when: { '^show': ['address', 'map'] } },
   ],
  },
 ],
 defaults: {
  tagline: 'Visit',
  headline: 'Come see us',
  show: PARTS,
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
