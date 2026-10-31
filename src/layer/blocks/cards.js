import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// Two to four across: features, services, steps, promises. It took over from
// Columns, Grid, Services and Trust badges, so one row holds what any of
// them held, and `style` says which parts show: an image only in Image, an
// icon only in Icon, the eyebrow as a label or, in Number and Steps, as the
// number itself. A card with an address links there whatever its style.
const CARD_ICONS = ['check', 'star', 'shield', 'heart', 'leaf', 'clock', 'pin', 'phone', 'wrench', 'truck', 'calendar', 'chat'];

export default defineBlock({
 type: 'cards',
 label: 'Cards',
 description: 'Features, services, steps, promises',
 category: 'common',
 icon: 'cards',
 keywords: ['features', 'columns', 'grid', 'how it works', 'benefits', 'prices'],
 presets: [
  {
   key: 'services',
   label: 'Services',
   description: 'What you do, with what it starts at',
   data: {
    style: 'price',
    columns: '2',
    tagline: 'What we do',
    headline: 'Services, and what they cost',
    items: [
     { title: 'Consultations', body: richText("Tell us what you need and we'll talk through the options."), price: 'Free' },
     { title: 'Full service', body: richText('Our most popular option, done start to finish.'), price: 'from $90' },
     { title: 'Same-day service', body: richText("Call before noon and we'll do our best to fit you in today."), price: 'from $140' },
     { title: 'By the hour', body: richText("For anything that doesn't fit a package. One-hour minimum."), price: '$60/hr' },
    ],
   },
  },
  {
   key: 'trust_badges',
   label: 'Trust badges',
   description: 'Licensed, insured, years in',
   data: {
    style: 'badge',
    columns: '4',
    background: 'soft',
    spacing: 'tight',
    tagline: '',
    headline: '',
    items: [
     { title: 'Since 2015', body: 'Family owned' },
     { title: 'Licensed & insured', body: 'Covered on every job' },
     { title: 'Upfront prices', body: 'No surprise fees' },
     { title: 'Satisfaction guaranteed', body: "Or we'll make it right" },
    ],
   },
  },
  {
   key: 'columns',
   label: 'Columns',
   description: 'How it works, in steps',
   data: {
    style: 'steps',
    columns: '3',
    tagline: 'How it works',
    headline: 'Three simple steps',
    items: [
     { eyebrow: '1', title: 'Get in touch', body: richText('Call, write or stop by and tell us what you need.') },
     { eyebrow: '2', title: 'Get a price', body: richText('A clear price up front, before anything starts.') },
     { eyebrow: '3', title: 'Done right', body: richText('We do what we said, when we said we would.') },
    ],
   },
  },
  {
   key: 'grid',
   label: 'Grid',
   description: 'Plain cards, no heading',
   data: { style: 'plain', tagline: '', headline: '' },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  intro: richTextSchema.default(richText('')),
  style: z.enum(['plain', 'icon', 'image', 'number', 'steps', 'badge', 'price']).default('plain'),
  columns: z.enum(['2', '3', '4']).default('3'),
  display: z.enum(['grid', 'slider']).default('grid'),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default('New card'),
     eyebrow: z.string().max(40).default(''),
     body: richTextSchema.default(richText('')),
     price: z.string().max(40).default(''),
     image: imageSchema.default({ src: '', alt: '' }),
     icon: z.enum(CARD_ICONS).default('check'),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'intro', label: 'Intro', widget: 'html', inline: true, ai: 'write' },
  {
   key: 'style',
   label: 'Style',
   widget: 'select',
   options: [
    { label: 'Plain', value: 'plain' },
    { label: 'Icon', value: 'icon' },
    { label: 'Image', value: 'image' },
    { label: 'Number', value: 'number' },
    { label: 'Steps', value: 'steps' },
    { label: 'Badge', value: 'badge' },
    { label: 'Price', value: 'price' },
   ],
  },
  {
   key: 'columns',
   label: 'Columns',
   widget: 'buttons',
   options: [
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
   ],
  },
  {
   key: 'display',
   label: 'Display',
   widget: 'buttons',
   options: [
    { label: 'Grid', value: 'grid' },
    { label: 'Slider', value: 'slider' },
   ],
  },
  {
   key: 'items',
   label: 'Cards',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   subfields: [
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'eyebrow', label: 'Eyebrow', widget: 'text', inline: true, help: 'A small label over the title. With Number or Steps it replaces the number.' },
    { key: 'body', label: 'Body', widget: 'html', inline: true },
    { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: 'from $90', help: 'Leave it empty to show no price.' },
    { key: 'image', label: 'Image', widget: 'image', help: 'Shown when the style is Image.' },
    {
     key: 'icon',
     label: 'Icon',
     widget: 'select',
     help: 'Shown when the style is Icon.',
     options: [
      { label: 'Check', value: 'check' },
      { label: 'Star', value: 'star' },
      { label: 'Shield', value: 'shield' },
      { label: 'Heart', value: 'heart' },
      { label: 'Leaf', value: 'leaf' },
      { label: 'Clock', value: 'clock' },
      { label: 'Pin', value: 'pin' },
      { label: 'Phone', value: 'phone' },
      { label: 'Wrench', value: 'wrench' },
      { label: 'Truck', value: 'truck' },
      { label: 'Calendar', value: 'calendar' },
      { label: 'Chat', value: 'chat' },
     ],
    },
    { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/services or https://…', help: 'With a link, the whole card opens it.' },
   ],
  },
 ],
 defaults: {
  tagline: 'Why us',
  headline: 'What you can count on',
  style: 'plain',
  columns: '3',
  display: 'grid',
  items: [
   { title: 'Locally owned', body: richText('Run by people who live nearby.') },
   { title: 'Fair prices', body: richText('Posted up front. No surprises.') },
   { title: 'Easy to reach', body: richText('A real person answers the phone.') },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  intro: ['bold', 'italic', 'link'],
  'items.*.title': [],
  'items.*.eyebrow': [],
  'items.*.body': ['bold', 'italic', 'link'],
  'items.*.price': [],
 },
});
