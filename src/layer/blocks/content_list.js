import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// Retired: the Grove list (blocks/grove_list.js) took its place, with the
// same data under the Groves names (docs/README.md § Groves). Pages saved
// with this one keep it until the studio's convert-blocks moves them, and
// the studio serves it as a Grove list in the meantime, so on the canvas it
// draws only a note to convert the page. Its shape stays as it was kept.
export default defineBlock({
 type: 'content_list',
 label: 'Grove list (old)',
 description: 'Saplings of one of your groves',
 category: 'dynamic',
 icon: 'feed',
 retired: true,
 keywords: ['groves', 'saplings', 'list', 'events', 'posts', 'blog', 'directory', 'collection'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  source: z
   .object({
    type: z.string().max(40).default(''),
    sort: z.string().max(40).default('published'),
    dir: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().int().min(1).max(50).default(12),
    filter: z.object({ field: z.string().max(40), op: z.enum(['eq', 'gte', 'lte']), value: z.string().max(200) }).nullable().default(null),
    show: z.array(z.string().max(40)).max(12).default([]),
    // Only saplings that point at the sapling the page is showing. The
    // studio set `relatedTo`; never a person.
    related: z.boolean().default(false),
    relatedTo: z.string().max(64).default(''),
    // Only saplings on one branch: set by the studio on a branch's page.
    term: z.object({ taxonomy: z.string().max(40), term: z.string().max(63) }).nullable().default(null),
   })
   .default({ type: '', sort: 'published', dir: 'desc', limit: 12, filter: null, show: [], related: false, relatedTo: '', term: null }),
  layout: z.enum(['cards', 'list', 'table']).default('cards'),
  columns: z.enum(['2', '3', '4']).default('3'),
  paging: z.boolean().default(true),
  empty: z.string().max(160).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'source', label: 'What to list', widget: 'content' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Cards', value: 'cards' },
    { label: 'List', value: 'list' },
    { label: 'Table', value: 'table' },
   ],
  },
  {
   key: 'columns',
   label: 'Cards across',
   widget: 'buttons',
   when: { layout: 'cards' },
   options: [
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
   ],
  },
  { key: 'paging', label: 'Pages when there are more', widget: 'switch' },
  { key: 'empty', label: 'When there are none', widget: 'text', inline: true, placeholder: 'Nothing here yet.' },
 ],
 defaults: { tagline: '', headline: '', layout: 'cards', columns: '3', paging: true, empty: '' },
 wys: { tagline: [], headline: [], empty: [] },
});
