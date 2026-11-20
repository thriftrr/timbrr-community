import { z } from 'zod';
import { defineBlock, headlineField, tableSchema, taglineField } from '../schema/define.js';

// Rows and columns: session dates, sizes, what's included, a comparison.
// The grid is one field (`table`, the studio's table editor): cells can be
// merged, each column lines up left, center or right, and the first row and
// the first column can be headings. Cells hold plain text.
const cells = (...texts) => texts.map((text) => ({ text }));

export default defineBlock({
 type: 'table',
 label: 'Table',
 description: 'Dates, sizes, specs or a comparison in rows and columns',
 category: 'content',
 icon: 'table',
 inside: true,
 keywords: ['grid', 'schedule', 'sessions', 'dates', 'specs', 'sizes', 'comparison', 'rows', 'columns', 'cells', 'spreadsheet', 'timetable'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  table: tableSchema,
  style: z.enum(['plain', 'striped', 'bordered', 'compact']).default('plain'),
  caption: z.string().max(300).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'table',
   label: 'Table',
   widget: 'table',
   help: 'Click a cell and type. Paste from a spreadsheet, or a Markdown table, to fill it in one go.',
  },
  {
   key: 'style',
   label: 'Look',
   widget: 'buttons',
   options: [
    { label: 'Plain', value: 'plain' },
    { label: 'Striped', value: 'striped' },
    { label: 'Bordered', value: 'bordered' },
    { label: 'Compact', value: 'compact' },
   ],
  },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true, help: 'Says what the table shows, under it. Leave it empty for none.' },
 ],
 defaults: {
  tagline: '',
  headline: 'Sessions',
  table: {
   align: ['left', 'left'],
   rows: [cells('Session', 'Dates'), cells('Session 1', 'June 15, 17 and 19'), cells('Session 2', 'July 13, 15 and 17'), cells('Session 3', 'August 3, 5 and 7')],
   header_row: true,
   header_col: true,
  },
  style: 'plain',
  caption: '',
 },
 wys: { tagline: [], headline: [], caption: [], 'table.rows.*.*.text': [] },
});
