import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A search box over a site's entries (docs/README.md § Collections). The
// studio keeps the entries and their search index; this block asks for
// the published ones that hold what a visitor typed, of the collections whose
// "Show in site search" is on. With no results page it shows what it
// finds under the box; with one, it sends the visitor there, and the Site
// search block on that page shows them. `within` keeps it to some collections
// (the studio's collection picker, in its "which collections" form: { collections: [keys] };
// none ticked is every collection that shows in site search).
export default defineBlock({
 type: 'collection_search',
 label: 'Site search',
 description: 'A search box over your entries',
 category: 'dynamic',
 icon: 'search',
 keywords: ['search', 'find', 'collections', 'entries', 'results', 'look up', 'query'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  placeholder: z.string().max(80).default(''),
  to: z.string().max(300).default(''),
  limit: z.number().int().min(1).max(20).default(10),
  empty: z.string().max(160).default(''),
  within: z.object({ collections: z.array(z.string().max(40)).max(30).default([]) }).prefault({}),
  results: z.enum(['list', 'cards']).default('list'),
  show_collection: z.boolean().default(true),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'placeholder', label: 'Words in the box', widget: 'text', placeholder: 'Search' },
  { key: 'to', label: 'Results page', widget: 'text', link: true, placeholder: '/search', help: 'Leave it empty to show results under the box. With a page here, searching goes to that page: put a Site search block on it too.' },
  { key: 'limit', label: 'Results at a time', widget: 'stepper', min: 1, max: 20 },
  { key: 'empty', label: 'When nothing matches', widget: 'text', placeholder: 'Nothing matches. Try other words.' },
  { key: 'within', label: 'Search in', widget: 'collection', pick: 'collections', help: 'With none ticked, it searches every collection that shows in site search.' },
  {
   key: 'results',
   label: 'Results as',
   widget: 'buttons',
   options: [
    { label: 'A list', value: 'list' },
    { label: 'Cards', value: 'cards' },
   ],
  },
  { key: 'show_collection', label: 'Name the collection on each result', widget: 'switch' },
 ],
 defaults: { tagline: '', headline: '', placeholder: '', to: '', limit: 10, empty: '', within: { collections: [] }, results: 'list', show_collection: true },
 wys: { tagline: [], headline: [] },
});
