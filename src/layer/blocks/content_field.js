import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// One field of a content entry (docs/README.md § Content). In the Library
// template a content type's entry pages are drawn with, it's a field of the
// entry the page is showing; on any other page it names its entry itself
// (`from`). Either way the studio binds the value in as `entry` when it
// serves the page ({ key, label, kind, value, text }), and this draws it by
// its kind. With no entry it draws nothing; the canvas shows which field it
// stands for.
//
// `kind` is the picked field's kind, kept by the studio's picker so the
// choices that only suit one kind (a date's style, a number's format, a
// picture's shape, a link's words) show for it and no other. What's drawn
// always goes by the kind the entry's value really has.
const NUMBERS = ['number', 'range'];
const LINKS = ['link', 'email', 'phone', 'file'];

export default defineBlock({
 type: 'content_field',
 label: 'Entry field',
 description: 'One field of a content entry: on its own page, or any page',
 category: 'dynamic',
 icon: 'text',
 keywords: ['content', 'entry', 'field', 'template', 'value', 'custom field'],
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
  // Set by the studio as it serves the page; never by a person. A
  // repeater comes with `rows` and a group with `fields`: what's inside,
  // each read the same way, however deep.
  entry: z
   .object({ key: z.string(), label: z.string(), kind: z.string(), value: z.any(), text: z.string(), rows: z.array(z.any()).optional(), fields: z.array(z.any()).optional() })
   .nullable()
   .optional(),
 }),
 fields: [
  // Picks `field`, and sets `kind` and `from` beside it.
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
