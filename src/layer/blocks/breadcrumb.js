import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// The way back: "Classes › Bread" above a page's title. Each step is words and
// an address; one with no address is where the visitor is (the last, usually).
// On an entry's page the words can hold the entry's tokens ({collection},
// {category}), which the studio fills as it serves the page (docs/collections.md,
// "Tokens"); an address made from one is kept to the site's own lower-case
// paths, so '/classes/category/{category}' finds the Bread page.
export default defineBlock({
 type: 'breadcrumb',
 label: 'Breadcrumb',
 description: 'Classes › Bread: the way back',
 category: 'content',
 icon: 'breadcrumb',
 keywords: ['breadcrumb', 'trail', 'path', 'back', 'navigation', 'collection'],
 schema: z.object({
  items: z
   .array(z.object({ label: z.string().max(80).default(''), to: z.string().max(2000).default('') }))
   .max(6)
   .default([]),
 }),
 fields: [
  {
   key: 'items',
   label: 'Steps',
   widget: 'items',
   itemLabel: 'label',
   max: 6,
   subfields: [
    { key: 'label', label: 'Words', widget: 'text', inline: true, placeholder: 'Classes' },
    { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/classes', help: 'Leave it empty for the page the visitor is on.' },
   ],
  },
 ],
 defaults: { items: [{ label: 'Home', to: '/' }, { label: 'This page', to: '' }] },
 wys: {},
});
