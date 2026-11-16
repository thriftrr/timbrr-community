import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A search box over a site's content entries (docs/README.md § Content).
// The studio keeps the entries and their search index; this block asks for
// the published ones that hold what a visitor typed, of the content types
// whose "Show in site search" is on. With no results page it shows what it
// finds under the box; with one, it sends the visitor there, and the Site
// search block on that page shows them.
export default defineBlock({
 type: 'content_search',
 label: 'Site search',
 description: 'A search box over your content entries',
 category: 'dynamic',
 icon: 'search',
 keywords: ['search', 'find', 'content', 'entries', 'results', 'look up', 'query'],
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
