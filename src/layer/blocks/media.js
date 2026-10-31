import { z } from 'zod';
import { defineBlock, imageSchema } from '../schema/define.js';

// One picture, video or player. A video is a file at an address, played by
// the browser, with the image as its poster. An embed link is a YouTube or
// Vimeo address, drawn in that service's player; anything else stays a plain
// link (embedSrc, app/utils/blocks.js).
export default defineBlock({
 type: 'media',
 label: 'Media',
 description: 'One image or video, full width or contained',
 category: 'content',
 icon: 'media',
 keywords: ['image', 'photo', 'picture', 'video', 'youtube', 'vimeo', 'embed'],
 schema: z.object({
  kind: z.enum(['image', 'video', 'embed']).default('image'),
  image: imageSchema.default({ src: '', alt: '' }),
  video_url: z.string().max(2000).default(''),
  embed_url: z.string().max(2000).default(''),
  caption: z.string().max(200).default(''),
  width: z.enum(['normal', 'wide']).default('normal'),
 }),
 fields: [
  {
   key: 'kind',
   label: 'Shows',
   widget: 'buttons',
   options: [
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
    { label: 'Embed link', value: 'embed' },
   ],
  },
  { key: 'image', label: 'Image', widget: 'image', help: 'With a video, shown until it plays.' },
  { key: 'video_url', label: 'Video address', widget: 'text', placeholder: 'https://…/clip.mp4', help: 'A link to an .mp4 or .webm file. For YouTube or Vimeo, use Embed link.' },
  { key: 'embed_url', label: 'Embed link', widget: 'text', placeholder: 'https://youtu.be/…', help: 'A YouTube or Vimeo link. Anything else shows as a plain link.' },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true, ai: 'generate' },
  {
   key: 'width',
   label: 'Width',
   widget: 'buttons',
   options: [
    { label: 'Normal', value: 'normal' },
    { label: 'Wide', value: 'wide' },
   ],
  },
 ],
 defaults: { kind: 'image', caption: 'Morning light, before we open.', width: 'normal' },
 wys: { caption: [] },
});
