import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// The latest of something: posts, events or job openings. Its rows are typed
// in here, since there are no collections to pull from yet, and `source` is
// what kind of thing they are, which only changes the words on their links.
// Nothing here knows when an event is over or a job is filled: a date is
// words as they should read, so the list's help says to take rows off.
export default defineBlock({
 type: 'feed',
 label: 'Feed',
 description: 'Latest posts, events or job openings',
 category: 'dynamic',
 icon: 'feed',
 keywords: ['blog', 'posts', 'updates', 'calendar', 'schedule', 'careers', 'hiring', 'work here'],
 presets: [
  {
   key: 'news',
   label: 'News',
   description: 'Latest posts',
   data: { source: 'news', display: 'grid' },
  },
  {
   key: 'events',
   label: 'Events',
   description: 'What’s coming up',
   data: {
    source: 'events',
    display: 'list',
    tagline: 'Upcoming',
    headline: 'On the calendar',
    items: [
     { eyebrow: 'Sat · Nov 14', title: 'Open house', meta: '10:00 am – 2:00 pm · free', body: richText('Bring a friend and have a look around.'), to: '/contact' },
     { eyebrow: 'Thu · Nov 19', title: 'Beginner workshop', meta: '6:00 pm · $25 · 12 spots', to: '/contact' },
     { eyebrow: 'Sat · Dec 5', title: 'Holiday party', meta: '5:00 pm · free · snacks on us', to: '/contact' },
    ],
   },
  },
  {
   key: 'jobs',
   label: 'Job openings',
   description: 'Careers list, no page rebuild',
   data: {
    source: 'jobs',
    display: 'list',
    tagline: 'Work here',
    headline: "We're hiring",
    items: [
     { eyebrow: 'Open', title: 'Front counter (part-time)', meta: '20 hrs/wk · $17/hr · weekends', to: '/contact' },
     { eyebrow: 'Open', title: 'Shift lead', meta: 'Full-time · $22/hr · Tue – Sat', to: '/contact' },
    ],
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  source: z.enum(['news', 'events', 'jobs']).default('news'),
  display: z.enum(['grid', 'list', 'slider']).default('grid'),
  items: z
   .array(
    z.object({
     eyebrow: z.string().max(40).default(''),
     title: z.string().max(160).default(''),
     meta: z.string().max(200).default(''),
     body: richTextSchema.default(richText('')),
     image: imageSchema.default({ src: '', alt: '' }),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(20)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'source',
   label: 'Kind',
   widget: 'buttons',
   options: [
    { label: 'News', value: 'news' },
    { label: 'Events', value: 'events' },
    { label: 'Jobs', value: 'jobs' },
   ],
   help: 'Sets the words on each link: Read more, RSVP or Apply.',
  },
  {
   key: 'display',
   label: 'Display',
   widget: 'buttons',
   options: [
    { label: 'Grid', value: 'grid' },
    { label: 'List', value: 'list' },
    { label: 'Slider', value: 'slider' },
   ],
  },
  {
   key: 'items',
   label: 'Items',
   widget: 'items',
   itemLabel: 'title',
   max: 20,
   help: "Take an item off once it's over or filled. It stays on the page until you do.",
   subfields: [
    { key: 'eyebrow', label: 'Date or status', widget: 'text', inline: true, placeholder: 'Sat · Nov 14' },
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'meta', label: 'Details', widget: 'text', inline: true, placeholder: 'Time · place · price', help: 'One short line under the title.' },
    { key: 'body', label: 'Summary', widget: 'html', inline: true },
    { key: 'image', label: 'Image', widget: 'image', help: "Shown in a grid or a slider, not in a list." },
    { key: 'to', label: 'Links to', widget: 'text', link: true, help: 'With a link, the whole item opens it. Leave it empty for no link.' },
   ],
  },
 ],
 defaults: {
  tagline: 'News',
  headline: "What's new",
  source: 'news',
  display: 'grid',
  items: [
   {
    eyebrow: 'Nov 2',
    title: 'Winter hours start Monday',
    body: richText('We open an hour later on weekdays through February. Weekend hours stay the same.'),
   },
   {
    eyebrow: 'Oct 19',
    title: 'New this season',
    body: richText('A few new favorites just came in. Stop by and see them before they sell out.'),
   },
   {
    eyebrow: 'Oct 5',
    title: 'Thanks for ten good years',
    body: richText('We opened our doors ten years ago this week. Thank you for every visit since.'),
   },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.eyebrow': [],
  'items.*.title': [],
  'items.*.meta': [],
  'items.*.body': ['bold', 'italic', 'link'],
 },
});
