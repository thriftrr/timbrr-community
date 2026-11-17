import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// One ring of a sapling (docs/README.md § Groves). In the Library template
// a grove's sapling pages are drawn with, it's a ring of the sapling the
// page is showing; on any other page it names its sapling itself (`from`).
// Either way the studio binds the value in as `sapling` when it serves the
// page ({ key, label, kind, value, text }), and this draws it by its kind.
// With no sapling it draws nothing; the canvas shows which ring it stands
// for.
//
// `kind` is the picked ring's kind, kept by the studio's picker so the
// choices that only suit one kind (a date's style, a number's format, a
// picture's shape, a link's words) show for it and no other. What's drawn
// always goes by the kind the sapling's value really has.
//
// `via` is a relation ring of the page's sapling: the block then shows the
// ring of the first sapling that one names (an event's coach's photo). The
// studio resolves it as it serves the page; the picker sets it.
const DATES = ['date', 'datetime'];
const NUMBERS = ['number', 'range'];
const LINKS = ['link', 'email', 'phone', 'file'];

export default defineBlock({
 type: 'grove_ring',
 label: 'Sapling ring',
 description: 'One ring of a sapling: on its own page, or any page',
 category: 'dynamic',
 icon: 'text',
 keywords: ['groves', 'sapling', 'ring', 'template', 'value'],
 schema: z.object({
  ring: z.string().max(40).default('title'),
  from: z.object({ grove: z.string().max(40).default(''), sapling: z.string().max(64).default('') }).default({ grove: '', sapling: '' }),
  kind: z.string().max(20).default(''),
  via: z.string().max(40).default(''),
  show: z.enum(['value', 'labeled', 'heading']).default('value'),
  date_style: z.enum(['long', 'short', 'weekday', 'numeric', 'month']).default('long'),
  number_style: z.enum(['plain', 'grouped', 'decimals']).default('plain'),
  number_before: z.string().max(12).default(''),
  number_after: z.string().max(24).default(''),
  image_shape: z.enum(['wide', 'photo', 'square', 'tall', 'natural']).default('wide'),
  image_size: z.enum(['small', 'medium', 'full']).default('full'),
  link_text: z.string().max(120).default(''),
  // Words drawn when the sapling holds nothing in this ring. Empty draws nothing.
  empty: z.string().max(160).default(''),
  // Set by the studio as it serves the page; never by a person. A
  // repeater comes with `rows` and a group with `rings`: what's inside,
  // each read the same way, however deep.
  sapling: z
   .object({ key: z.string(), label: z.string(), kind: z.string(), value: z.any(), text: z.string(), rows: z.array(z.any()).optional(), rings: z.array(z.any()).optional() })
   .nullable()
   .optional(),
 }),
 fields: [
  // Picks `ring`, and sets `kind` and `from` beside it.
  { key: 'ring', label: 'Ring', widget: 'grove_ring' },
  {
   key: 'show',
   label: 'Show it as',
   widget: 'buttons',
   options: [
    { label: 'Value', value: 'value' },
    { label: 'With its name', value: 'labeled' },
    { label: 'Heading', value: 'heading' },
   ],
  },
  {
   key: 'date_style',
   label: 'Date style',
   widget: 'select',
   when: { kind: DATES },
   options: [
    { label: 'September 3, 2030', value: 'long' },
    { label: 'Sep 3, 2030', value: 'short' },
    { label: 'Tuesday, September 3', value: 'weekday' },
    { label: '9/3/2030', value: 'numeric' },
    { label: 'September 2030', value: 'month' },
   ],
  },
  {
   key: 'number_style',
   label: 'Number format',
   widget: 'select',
   when: { kind: NUMBERS },
   options: [
    { label: 'As typed: 1250', value: 'plain' },
    { label: 'With commas: 1,250', value: 'grouped' },
    { label: 'With cents: 1,250.00', value: 'decimals' },
   ],
  },
  { key: 'number_before', label: 'Before the number', widget: 'text', when: { kind: NUMBERS }, placeholder: '$' },
  { key: 'number_after', label: 'After the number', widget: 'text', when: { kind: NUMBERS }, placeholder: ' a night' },
  {
   key: 'image_shape',
   label: 'Picture shape',
   widget: 'select',
   when: { kind: 'image' },
   options: [
    { label: 'Wide (16:9)', value: 'wide' },
    { label: 'Photo (3:2)', value: 'photo' },
    { label: 'Square', value: 'square' },
    { label: 'Tall (4:5)', value: 'tall' },
    { label: 'As uploaded', value: 'natural' },
   ],
  },
  {
   key: 'image_size',
   label: 'Picture size',
   widget: 'buttons',
   when: { kind: 'image' },
   options: [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Full', value: 'full' },
   ],
  },
  { key: 'empty', label: 'When it holds nothing', widget: 'text', placeholder: 'To be announced', help: 'Leave it empty to show nothing.' },
  { key: 'link_text', label: 'Link text', widget: 'text', when: { kind: LINKS }, placeholder: 'Visit the website', help: 'Shown in place of the address. Leave empty to show the address.' },
 ],
 defaults: { ring: 'title', show: 'value', empty: '' },
 wys: {},
});
