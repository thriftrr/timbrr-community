import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// Retired: the Sapling ring (blocks/grove_ring.js) took its place, with the
// same data under the Groves names (docs/README.md § Groves). Pages saved
// with this one keep it until the studio's convert-blocks moves them, and
// the studio serves it as a Sapling ring in the meantime, so on the canvas
// it draws only a note to convert the page. Its shape stays as it was kept.
const NUMBERS = ['number', 'range'];
const LINKS = ['link', 'email', 'phone', 'file'];

export default defineBlock({
 type: 'content_field',
 label: 'Sapling ring (old)',
 description: 'One ring of a sapling: on its own page, or any page',
 category: 'dynamic',
 icon: 'text',
 retired: true,
 keywords: ['groves', 'sapling', 'ring', 'template', 'value'],
 schema: z.object({
  field: z.string().max(40).default('title'),
  from: z.object({ type: z.string().max(40).default(''), entry: z.string().max(64).default('') }).default({ type: '', entry: '' }),
  kind: z.string().max(20).default(''),
  show: z.enum(['value', 'labeled', 'heading']).default('value'),
  date_style: z.enum(['long', 'short', 'weekday', 'numeric', 'month']).default('long'),
  number_style: z.enum(['plain', 'grouped', 'decimals']).default('plain'),
  number_before: z.string().max(12).default(''),
  number_after: z.string().max(24).default(''),
  image_shape: z.enum(['wide', 'photo', 'square', 'tall', 'natural']).default('wide'),
  image_size: z.enum(['small', 'medium', 'full']).default('full'),
  link_text: z.string().max(120).default(''),
  // Set by the studio as it served the page; never by a person.
  entry: z
   .object({ key: z.string(), label: z.string(), kind: z.string(), value: z.any(), text: z.string(), rows: z.array(z.any()).optional(), fields: z.array(z.any()).optional() })
   .nullable()
   .optional(),
 }),
 fields: [
  { key: 'field', label: 'Field', widget: 'content_field' },
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
   when: { kind: 'date' },
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
  { key: 'link_text', label: 'Link text', widget: 'text', when: { kind: LINKS }, placeholder: 'Visit the website', help: 'Shown in place of the address. Leave empty to show the address.' },
 ],
 defaults: { field: 'title', show: 'value' },
 wys: {},
});
