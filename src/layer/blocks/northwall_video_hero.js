import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// A page's opener over a silent, looping video that fills the screen. The
// picture is what shows first, what stays for anyone who's asked their
// device for less motion, and what's there if the video can't play, so it
// always has something behind the words. The video is a file at an address
// (an .mp4 or .webm; a phone's .mov won't play everywhere), never a player
// from another service.
export default defineBlock({
 type: 'northwall_video_hero',
 label: 'Video hero',
 description: 'A headline over a full-screen background video',
 category: 'common',
 icon: 'hero',
 owner: 'North Wall',
 keywords: ['hero', 'video', 'background video', 'banner', 'opener', 'full screen', 'loop'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  description: richTextSchema.default(richText('')),
  video_url: z.string().max(2000).default(''),
  image: imageSchema.default({ src: '', alt: '' }),
  words: z.enum(['center', 'left', 'bottom']).default('center'),
  height: z.enum(['full', 'tall']).default('full'),
  shade: z.enum(['light', 'medium', 'dark']).default('medium'),
  edge: z.enum(['straight', 'peaks']).default('straight'),
  buttons: z.array(buttonSchema).max(2).default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'description', label: 'Description', widget: 'html', inline: true, ai: 'improve' },
  { key: 'video_url', label: 'Video address', widget: 'text', placeholder: 'https://…/clip.mp4', help: 'A link to an .mp4 or .webm file. It plays silently, on a loop. Keep it short: 10 to 20 seconds, a few MB.' },
  { key: 'image', label: 'Picture', widget: 'image', help: 'Shown until the video plays, and in its place for anyone who has asked for less motion.' },
  {
   key: 'words',
   label: 'Words',
   widget: 'buttons',
   options: [
    { label: 'Centered', value: 'center' },
    { label: 'Left', value: 'left' },
    { label: 'Bottom left', value: 'bottom' },
   ],
  },
  {
   key: 'height',
   label: 'Height',
   widget: 'buttons',
   options: [
    { label: 'Full screen', value: 'full' },
    { label: 'Tall', value: 'tall' },
   ],
  },
  {
   key: 'shade',
   label: 'Shade over the video',
   widget: 'buttons',
   options: [
    { label: 'Light', value: 'light' },
    { label: 'Medium', value: 'medium' },
    { label: 'Dark', value: 'dark' },
   ],
   help: 'Darker makes the words easier to read over a busy video.',
  },
  {
   key: 'edge',
   label: 'Bottom edge',
   widget: 'buttons',
   options: [
    { label: 'Straight', value: 'straight' },
    { label: 'Peaks', value: 'peaks' },
   ],
   help: 'Peaks cuts a mountain ridge into the bottom, in the page color.',
  },
  { ...buttonsField, max: 2 },
 ],
 defaults: {
  tagline: '',
  headline: 'Looking to climb?',
  description: richText('No booking and no experience needed. Come in any time we are open.'),
  video_url: '',
  words: 'center',
  height: 'full',
  shade: 'medium',
  edge: 'straight',
  buttons: [{ label: 'Plan your visit', to: '/contact', style: 'solid' }],
 },
 wys: { tagline: [], headline: [], description: ['bold', 'italic', 'link'], 'buttons.*.label': [] },
});
