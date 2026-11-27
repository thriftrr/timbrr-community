import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema } from '../schema/define.js';

// Copy (FB-161): a headline and some words, and nothing else. No picture, no
// buttons, no layout of its own: only the look every block has (background,
// spacing, a line above). For the plain "say something" section that Text &
// image made people strip down by hand. It's first in the tray's Content
// group, and it goes in a Split's column.
export default defineBlock({
 type: 'copy',
 label: 'Copy',
 description: 'A headline and text. Nothing else.',
 category: 'content',
 icon: 'copy_block', // not 'copy': that name is the studio's Duplicate icon
 inside: true,
 keywords: ['text', 'words', 'paragraph', 'headline', 'heading', 'prose', 'rich text', 'about', 'intro', 'article'],
 schema: z.object({
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
 }),
 fields: [headlineField, { key: 'body', label: 'Text', widget: 'html', inline: true, ai: 'write' }],
 defaults: {
  headline: 'New to climbing? Start on the ground.',
  body: richText(
   'Your first visit includes shoe rental, a 20-minute safety intro and a coach on the floor. Most people are on the wall within half an hour, with no experience and no partner needed.',
  ),
 },
 wys: {
  headline: [],
  body: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
 },
});
