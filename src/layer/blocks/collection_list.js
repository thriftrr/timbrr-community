import { z } from 'zod';
import { defineBlock, collectionSourceSchema, headlineField, taglineField } from '../schema/define.js';

// A list of a site's entries (docs/README.md § Collections): the studio keeps
// the entries (events, staff, routes) and this block asks for the
// published ones of one collection, sorted and narrowed as `source` says. Each
// links to its own page when its collection has an address. Cards, a list, a
// table, a grid of pictures or a row that scrolls sideways; the first can
// be drawn large; visitors can narrow it by up to three fields (`choices`).
//
// Rows ("Rows with pictures") and People draw each entry from the fields the
// owner names, by the name the editor shows for them (or their key): a
// picture, a date line, a quiet line under the title, a price, places left
// (a number; 0 says Full) and a button. Rows add the visitor's controls:
// `choices` as buttons (the first set to buttons) and menus, an order and a
// month, all kept in the address; the empty list says what to loosen
// (app/utils/collection-rows.js).
const ROWS = ['rows', 'person'];
const PICTURED = ['cards', 'grid', 'carousel'];

export default defineBlock({
 type: 'collection_list',
 label: 'Collection list',
 description: 'Shows entries from a collection',
 category: 'dynamic',
 loads: ['youtube', 'vimeo', 'openstreetmap'],
 icon: 'feed',
 keywords: ['collections', 'entries', 'list', 'events', 'posts', 'blog', 'directory', 'collection', 'carousel', 'filter', 'related'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  source: collectionSourceSchema,
  layout: z.enum(['cards', 'list', 'table', 'grid', 'carousel', 'rows', 'person']).default('cards'),
  columns: z.enum(['2', '3', '4']).default('3'),
  featured: z.boolean().default(false),
  count: z.boolean().default(false),
  // true and false are what a list kept before `more` and `none` existed.
  paging: z.union([z.enum(['pages', 'more', 'none']), z.boolean()]).default('pages'),
  empty: z.string().max(160).default(''),
  empty_label: z.string().max(60).default(''),
  empty_to: z.string().max(2000).default(''),
  // A link at the top right of the list: "See all Bread classes".
  more_label: z.string().max(80).default(''),
  more_to: z.string().max(2000).default(''),
  // Rows and People: the fields each entry is drawn from, named as the editor shows them.
  row_picture: z.string().max(60).default(''),
  row_date: z.string().max(60).default(''),
  row_end: z.string().max(60).default(''),
  row_line: z.array(z.string().max(60)).max(4).default([]),
  row_price: z.string().max(60).default(''),
  row_places: z.string().max(60).default(''),
  row_button: z.string().max(60).default(''),
  row_link: z.string().max(60).default(''),
  row_about: z.string().max(60).default(''),
  row_group: z.boolean().default(false),
  row_sort: z.boolean().default(false),
  row_month: z.boolean().default(false),
  ending: z.boolean().default(false),
  ending_text: z.string().max(160).default(''),
  ending_label: z.string().max(80).default(''),
  ending_to: z.string().max(2000).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'source', label: 'Show', widget: 'collection' },
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
    { label: 'Rows with pictures', value: 'rows' },
    { label: 'People', value: 'person' },
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
  { key: 'more_label', label: 'Link at the top right', widget: 'text', placeholder: 'See all events', help: 'Leave it empty for none.' },
  { key: 'more_to', label: 'That link goes to', widget: 'text', link: true, when: { more_label: { filled: true } }, placeholder: '/events' },
  { key: 'row_picture', label: 'Picture', widget: 'text', when: { layout: ROWS }, placeholder: 'Photo', help: 'The name of a picture field. Leave it empty for the first one.' },
  { key: 'row_date', label: 'Date line', widget: 'text', when: { layout: 'rows' }, placeholder: 'Date', help: 'The name of a date field, in the brand color above the title. Leave it empty for the first one.' },
  { key: 'row_end', label: 'Ends at', widget: 'text', when: { layout: 'rows' }, placeholder: 'Finishes', help: 'A time field, or another date: "10:00 – 14:00".' },
  { key: 'row_line', label: 'Under the title', widget: 'tags', max: 4, when: { layout: ROWS }, placeholder: 'Field name', help: 'Names of fields, shown in a quiet line: a teacher, a level.' },
  { key: 'row_price', label: 'Price', widget: 'text', when: { layout: 'rows' }, placeholder: 'Price', help: 'The name of a number field, shown large.' },
  { key: 'row_places', label: 'Places left', widget: 'text', when: { layout: 'rows' }, placeholder: 'Places', help: 'The name of a number field: "8 places left", and "Full" at 0 (no button then).' },
  { key: 'row_button', label: 'Button', widget: 'text', when: { layout: ROWS }, placeholder: 'Book', help: 'On People it is a link under them: “More about [name]” uses their first name.' },
  { key: 'row_link', label: 'Button goes to', widget: 'text', when: { layout: 'rows' }, placeholder: 'Booking link', help: 'The name of a link field. Leave it empty to open the entry’s own page.' },
  { key: 'row_about', label: 'Name the topic in empty messages', widget: 'text', when: { layout: 'rows' }, placeholder: '{value}', help: 'For a list that holds to one thing, like a category’s page: “No Beginner Bread classes in January.”' },
  { key: 'row_group', label: 'Heading for each month', widget: 'switch', when: { layout: 'rows' }, help: 'Needs a date field, and the list in date order.' },
  { key: 'row_sort', label: 'Let visitors change the order', widget: 'switch', when: { layout: 'rows' } },
  { key: 'row_month', label: 'Let visitors pick a month', widget: 'switch', when: { layout: 'rows' } },
  { key: 'ending', label: 'Say when that is everything', widget: 'switch', when: { layout: 'rows' }, help: 'A closing line under the last row.' },
  { key: 'ending_text', label: 'Closing line', widget: 'text', when: { layout: 'rows', ending: true }, placeholder: 'That’s every class for now.' },
  { key: 'ending_label', label: 'Closing link', widget: 'text', when: { layout: 'rows', ending: true }, placeholder: 'Get an email when they do' },
  { key: 'ending_to', label: 'That link goes to', widget: 'text', link: true, when: { layout: 'rows', ending: true, ending_label: { filled: true } }, placeholder: '/contact' },
  { key: 'empty', label: 'When there are none', widget: 'text', inline: true, placeholder: 'Nothing here yet.' },
  { key: 'empty_label', label: 'Button when there are none', widget: 'text', placeholder: 'See all events', help: 'Leave it empty for no button. In rows it is a quiet link: “Get an email when one’s added”.' },
  { key: 'empty_to', label: 'That button goes to', widget: 'text', link: true, when: { empty_label: { filled: true } }, placeholder: '/events' },
 ],
 defaults: { tagline: '', headline: '', layout: 'cards', columns: '3', featured: false, count: false, paging: 'pages', empty: '', empty_label: '', empty_to: '', more_label: '', more_to: '', row_picture: '', row_date: '', row_end: '', row_line: [], row_price: '', row_places: '', row_button: '', row_link: '', row_about: '', row_group: false, row_sort: false, row_month: false, ending: false, ending_text: '', ending_label: '', ending_to: '' },
 wys: { tagline: [], headline: [], empty: [] },
});
