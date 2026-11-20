import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema } from '../schema/define.js';

// The rooms of the studio the demo can open on, in the rail's order.
export const STUDIO_DEMO_ROOMS = ['editor', 'collections', 'library', 'forms', 'media', 'people', 'branding'];

// A working copy of the Timbrr studio, for a page that sells it: the rail,
// and in each room the real thing in miniature, on a made-up plumber's site.
// Visitors add blocks, type, upload, invite, change the brand; nothing they do
// leaves their browser, and Start over puts the room back. It opens on one
// room and the rail goes to the others. On the studio's canvas it holds still
// so a click selects the block; Preview and the site are where it runs.
export default defineBlock({
 type: 'studio_demo',
 label: 'Studio demo',
 description: 'A working copy of the studio visitors can try',
 category: 'content',
 loads: ['google_fonts'],
 icon: 'monitor',
 advanced: true,
 keywords: ['demo', 'try it', 'editor', 'studio', 'product tour', 'sandbox', 'interactive', 'screenshot'],
 schema: z.object({
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  room: z.enum(STUDIO_DEMO_ROOMS).default('editor'),
  caption: z.string().max(200).default(''),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Text', widget: 'html', inline: true, ai: 'improve' },
  {
   key: 'room',
   label: 'Opens on',
   widget: 'select',
   help: 'Where the demo starts. Visitors can open the rest from its side rail.',
   options: [
    { label: 'Page editor', value: 'editor' },
    { label: 'Collections', value: 'collections' },
    { label: 'Library', value: 'library' },
    { label: 'Forms', value: 'forms' },
    { label: 'Media', value: 'media' },
    { label: 'People & access', value: 'people' },
    { label: 'Branding', value: 'branding' },
   ],
  },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true, help: 'Under the demo. Say that the site in it is made up.' },
 ],
 defaults: {
  headline: 'Try it before you talk to anyone',
  body: richText('Add a block, change the words, switch to a phone. It all runs here in your browser, and nothing is saved.'),
  room: 'editor',
  caption: 'A working copy of the studio on a made-up plumber’s site. Nothing you change here is saved.',
 },
 wys: { headline: [], body: ['bold', 'italic', 'link'], caption: [] },
});
