import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// The workhorse: a few paragraphs with a photo on either side, or on their
// own. It took over from Rich text and Story, so it holds what both held:
// `alignment` from the one, the signed-off `note` from the other.
export default defineBlock({
 type: 'text_image',
 label: 'Text & image',
 description: 'Words, with a photo on either side or none',
 category: 'content',
 icon: 'text_image',
 keywords: ['text', 'paragraph', 'copy', 'about', 'prose', 'photo'],
 presets: [
  {
   key: 'richtext',
   label: 'Rich text',
   description: 'Words on their own, in one readable column',
   data: {
    image_side: 'none',
    tagline: 'Good to know',
    headline: 'A note on how we work',
    body: {
     type: 'doc',
     content: [
      {
       type: 'paragraph',
       content: [
        { type: 'text', text: "We're a small team, and we like it that way: you'll see the same faces every time you come in or call. Send us a question and you'll hear back " },
        { type: 'text', text: 'within one business day', marks: [{ type: 'bold' }] },
        { type: 'text', text: ', usually much sooner.' },
       ],
      },
     ],
    },
   },
  },
  {
   key: 'story',
   label: 'Story',
   description: 'A photo beside the story of the place',
   data: {
    image_side: 'left',
    tagline: 'Since 2019',
    headline: 'It started in a one-room shop.',
    body: richText(
     'We opened with two people, a few borrowed tools and a handful of neighbors who took a chance on us. The shop is bigger now and so is the team, and plenty of those first customers still come by every week.',
    ),
    note: '— Sam Rivera, owner',
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  note: z.string().max(120).default(''),
  image_side: z.enum(['left', 'right', 'none']).default('right'),
  alignment: z.enum(['left', 'center']).default('left'),
  image: imageSchema.default({ src: '', alt: '' }),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'write' },
  { key: 'note', label: 'Sign-off', widget: 'text', inline: true, placeholder: '— Name, role', help: 'Small print under the words. Leave it empty for none.' },
  {
   key: 'image_side',
   label: 'Image',
   widget: 'buttons',
   options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'None', value: 'none' },
   ],
  },
  {
   key: 'alignment',
   label: 'Alignment',
   widget: 'buttons',
   options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
   ],
   help: 'For words with no image.',
  },
  { key: 'image', label: 'Photo', widget: 'image' },
 ],
 defaults: {
  tagline: 'About us',
  headline: 'A small shop that knows its customers',
  body: richText("We've been on this street for years, and we still know most people by name. Come in with a question and you'll get a straight answer, even if the answer is that you don't need us."),
  image_side: 'right',
  alignment: 'left',
 },
 wys: {
  tagline: [],
  headline: [],
  body: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
  note: [],
 },
});
