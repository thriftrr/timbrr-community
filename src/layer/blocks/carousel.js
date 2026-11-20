import { z } from 'zod';
import { defineBlock, imageSchema } from '../schema/define.js';

// One slide at a time, with Previous and Next, dots and a count. A slide is
// a picture, a title, a few words and a button, and every one of them is
// optional: a slide with only a picture is fine, and so is one with only
// words. A slide with nothing in it isn't drawn. It never moves on its own.
// Slides are typed in here, like Feed's rows.
export default defineBlock({
 type: 'carousel',
 label: 'Carousel',
 description: 'Slides you click through, one at a time',
 category: 'dynamic',
 icon: 'carousel',
 keywords: ['slider', 'slideshow', 'slides', 'rotator', 'banner', 'highlights', 'news', 'gallery'],
 inside: true,
 schema: z.object({
  items: z
   .array(
    z.object({
     image: imageSchema.default({ src: '', alt: '' }),
     title: z.string().max(120).default(''),
     body: z.string().max(400).default(''),
     button_label: z.string().max(60).default(''),
     button_to: z.string().max(2000).default(''),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  {
   key: 'items',
   label: 'Slides',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   help: 'Every part of a slide is optional. A slide with nothing in it is left out.',
   subfields: [
    { key: 'image', label: 'Featured image', widget: 'image' },
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'body', label: 'Short description', widget: 'text', inline: true },
    { key: 'button_label', label: 'Button', widget: 'text', inline: true, placeholder: 'Sign up' },
    { key: 'button_to', label: 'Button links to', widget: 'text', link: true, placeholder: '/contact or https://…', when: { button_label: { filled: true } } },
   ],
  },
 ],
 defaults: {
  items: [
   { title: 'Open mic night', body: 'Every first Friday. Sign up at the counter and bring a friend.', button_label: 'Learn more', button_to: '/events' },
   { title: 'Youth league starts in March', body: 'Six weeks of climbing, games and snacks for ages 8 to 12. Spots are limited and fill fast.', button_label: 'Sign up', button_to: '/contact' },
   { title: 'New route setting', body: 'Fresh problems on every wall, every other Tuesday.' },
  ],
 },
});
