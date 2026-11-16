import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A list of a site's content entries (docs/README.md § Content): the
// studio keeps the entries (events, staff, routes) and this block asks for
// the published ones of one type, sorted and narrowed as `source` says.
// Each links to its own page when its type has an address.
export default defineBlock({
 type: 'content_list',
 label: 'Content list',
 description: 'Entries of one of your content types',
 category: 'dynamic',
 icon: 'feed',
 keywords: ['content', 'entries', 'list', 'events', 'posts', 'blog', 'directory', 'collection', 'custom post type'],
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
    // Only entries that point at the entry the page is showing (a relation
    // field of theirs names it). The studio adds `relatedTo`, that entry's
    // id, as it serves an entry's page; never a person.
    related: z.boolean().default(false),
    relatedTo: z.string().max(64).default(''),
    // Only entries with one term: set by the studio on a term's own page.
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
