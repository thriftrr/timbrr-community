import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// Retired: the Site search block under its Collections name
// (blocks/collection_search.js) took its place, with the same data. Pages saved
// with this one keep it until the studio's convert-blocks moves them, and
// the studio serves it as the new one in the meantime, so on the canvas it
// draws only a note to convert the page.
export default defineBlock({
 type: 'content_search',
 label: 'Site search (old)',
 description: 'A search box over your entries',
 category: 'dynamic',
 icon: 'search',
 retired: true,
 keywords: ['search', 'find', 'collections', 'entries', 'results', 'look up', 'query'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  placeholder: z.string().max(80).default(''),
  to: z.string().max(300).default(''),
  limit: z.number().int().min(1).max(20).default(10),
  empty: z.string().max(160).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'placeholder', label: 'Words in the box', widget: 'text', placeholder: 'Search' },
  { key: 'to', label: 'Results page', widget: 'text', link: true, placeholder: '/search', help: 'Leave it empty to show results under the box. With a page here, searching goes to that page: put a Site search block on it too.' },
  { key: 'limit', label: 'Results at a time', widget: 'stepper', min: 1, max: 20 },
  { key: 'empty', label: 'When nothing matches', widget: 'text', placeholder: 'Nothing matches. Try other words.' },
 ],
 defaults: { tagline: '', headline: '', placeholder: '', to: '', limit: 10, empty: '' },
 wys: { tagline: [], headline: [] },
});
