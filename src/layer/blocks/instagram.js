import { z } from 'zod';
import { defineBlock, imageSchema } from '../schema/define.js';

// Not a live feed: the tiles are photos added in the studio, so the page
// never waits on Instagram or breaks when it changes.
export default defineBlock({
 type: 'instagram',
 label: 'Instagram feed',
 description: 'Latest posts from the account',
 category: 'dynamic',
 icon: 'instagram',
 advanced: true,
 keywords: ['instagram', 'social', 'photos'],
 schema: z.object({
  handle: z.string().max(100).default(''),
  headline: z.string().max(120).default(''),
  items: z
   .array(
    z.object({
     image: imageSchema.default({ src: '', alt: '' }),
     caption: z.string().max(120).default(''),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  {
   key: 'handle',
   label: 'Handle',
   widget: 'text',
   inline: true,
   placeholder: '@yourshop',
   help: 'The Follow button opens this account on Instagram.',
  },
  { key: 'headline', label: 'Headline', widget: 'text', inline: true },
  {
   key: 'items',
   label: 'Tiles',
   widget: 'items',
   itemLabel: 'caption',
   max: 12,
   help: "Tiles don't update from Instagram on their own. Swap in new posts now and then.",
   subfields: [
    { key: 'image', label: 'Image', widget: 'image' },
    { key: 'caption', label: 'Caption', widget: 'text', inline: true, help: 'Shows over the photo on hover.' },
   ],
  },
 ],
 defaults: {
  handle: '@yourshop',
  headline: 'Lately',
  items: [
   { caption: 'Opening up' },
   { caption: 'New this week' },
   { caption: 'Behind the scenes' },
   { caption: 'Meet the team' },
   { caption: 'Customer favorite' },
   { caption: 'Coming soon' },
  ],
 },
 wys: { handle: [], headline: [], 'items.*.caption': [] },
});
