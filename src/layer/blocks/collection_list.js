import { z } from 'zod';
import { defineBlock, collectionSourceSchema, headlineField, taglineField } from '../schema/define.js';

// A list of a site's entries (docs/README.md § Collections): the studio keeps
// the entries (events, staff, routes) and this block asks for the
// published ones of one collection, sorted and narrowed as `source` says. Each
// links to its own page when its collection has an address. Cards, a list, a
// table, a grid of pictures or a row that scrolls sideways; the first can
// be drawn large; visitors can narrow it by up to three fields (`choices`).
const PICTURED = ['cards', 'grid', 'carousel'];

export default defineBlock({
 type: 'collection_list',
 label: 'Collection list',
 description: 'Entries of one of your collections',
 category: 'dynamic',
 icon: 'feed',
 keywords: ['collections', 'entries', 'list', 'events', 'posts', 'blog', 'directory', 'collection', 'carousel', 'filter', 'related'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  source: collectionSourceSchema,
  layout: z.enum(['cards', 'list', 'table', 'grid', 'carousel']).default('cards'),
  columns: z.enum(['2', '3', '4']).default('3'),
  featured: z.boolean().default(false),
  count: z.boolean().default(false),
  // true and false are what a list kept before `more` and `none` existed.
  paging: z.union([z.enum(['pages', 'more', 'none']), z.boolean()]).default('pages'),
  empty: z.string().max(160).default(''),
  empty_label: z.string().max(60).default(''),
  empty_to: z.string().max(2000).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'source', label: 'What to list', widget: 'collection' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'select',
   options: [
    { label: 'Cards', value: 'cards' },
    { label: 'List', value: 'list' },
    { label: 'Table', value: 'table' },
    { label: 'Grid of pictures', value: 'grid' },
    { label: 'A row that scrolls sideways', value: 'carousel' },
   ],
  },
  {
   key: 'columns',
   label: 'Across',
   widget: 'buttons',
   when: { layout: ['cards', 'grid'] },
   options: [
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
   ],
  },
  { key: 'featured', label: 'Show the first one large', widget: 'switch', when: { layout: [...PICTURED, 'list'] } },
  { key: 'count', label: 'Say how many there are', widget: 'switch', help: 'Above the list: “12 events”.' },
  {
   key: 'paging',
   label: 'When there are more',
   widget: 'buttons',
   options: [
    { label: 'Pages', value: 'pages' },
    { label: 'Load more', value: 'more' },
    { label: 'Stop', value: 'none' },
   ],
  },
  { key: 'empty', label: 'When there are none', widget: 'text', inline: true, placeholder: 'Nothing here yet.' },
  { key: 'empty_label', label: 'Button when there are none', widget: 'text', placeholder: 'See all events', help: 'Leave it empty for no button.' },
  { key: 'empty_to', label: 'That button goes to', widget: 'text', link: true, when: { empty_label: { filled: true } }, placeholder: '/events' },
 ],
 defaults: { tagline: '', headline: '', layout: 'cards', columns: '3', featured: false, count: false, paging: 'pages', empty: '', empty_label: '', empty_to: '' },
 wys: { tagline: [], headline: [], empty: [] },
});
