import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A small table: session dates, sizes, what's included. Every row holds
// five cells and the block shows the first two to five, so changing the
// number of columns never loses what was typed in the others.
const cell = z.string().max(200).default('');
const CELLS = ['c1', 'c2', 'c3', 'c4', 'c5'];

export default defineBlock({
 type: 'northwall_table',
 label: 'Table',
 description: 'Dates, sizes or specs in rows and columns',
 category: 'content',
 icon: 'table',
 owner: 'North Wall',
 keywords: ['grid', 'schedule', 'sessions', 'dates', 'specs', 'sizes', 'comparison', 'rows', 'columns'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  columns: z.enum(['2', '3', '4', '5']).default('2'),
  header: z.boolean().default(true),
  rows: z
   .array(z.object({ c1: cell, c2: cell, c3: cell, c4: cell, c5: cell }))
   .max(40)
   .default([]),
  note: z.string().max(300).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'columns',
   label: 'Columns',
   widget: 'stepper',
   min: 2,
   max: 5,
  },
  { key: 'header', label: 'First row is the headings', widget: 'switch' },
  {
   key: 'rows',
   label: 'Rows',
   widget: 'items',
   itemLabel: 'c1',
   max: 40,
   // A row only asks for the columns the table shows.
   subfields: CELLS.map((key, index) => ({ key, label: `Column ${index + 1}`, widget: 'text', inline: true, ...(index > 1 ? { when: { columns: ['3', '4', '5'].slice(index - 2) } } : {}) })),
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the table. Leave it empty for none.' },
 ],
 defaults: {
  tagline: '',
  headline: 'Sessions',
  columns: '2',
  header: true,
  rows: [
   { c1: 'Session', c2: 'Dates' },
   { c1: 'Session 1', c2: 'June 15, 17 and 19' },
   { c1: 'Session 2', c2: 'July 13, 15 and 17' },
   { c1: 'Session 3', c2: 'August 3, 5 and 7' },
  ],
  note: '',
 },
 wys: { tagline: [], headline: [], note: [], ...Object.fromEntries(CELLS.map((key) => [`rows.*.${key}`, []])) },
});
