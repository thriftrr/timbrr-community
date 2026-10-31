import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// The map is a drawing, not an embed: the page never loads a map script.
// The directions button (and the map) open the street and city in Google
// Maps.
export default defineBlock({
 type: 'location',
 label: 'Location',
 description: 'Address, map, directions',
 category: 'dynamic',
 icon: 'location',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  address: z.string().max(120).default(''),
  city: z.string().max(120).default(''),
  parking: richTextSchema.default(richText('')),
  note: z.string().max(60).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'address', label: 'Street', widget: 'text', inline: true, placeholder: '123 Main Street' },
  { key: 'city', label: 'City, state, zip', widget: 'text', inline: true },
  { key: 'parking', label: 'Parking & transit', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'note',
   label: 'Directions label',
   widget: 'text',
   inline: true,
   placeholder: 'Get directions',
   help: 'The button opens the street and city in Google Maps.',
  },
 ],
 defaults: {
  tagline: 'Find us',
  headline: 'On Main Street, across from the park',
  address: '123 Main Street',
  city: 'Springfield, IL 62701',
  parking: richText('Free lot behind the building, bike racks out front. The bus stops at the corner, a two-minute walk.'),
  note: 'Get directions',
 },
 wys: { tagline: [], headline: [], address: [], city: [], parking: ['bold'], note: [] },
});
