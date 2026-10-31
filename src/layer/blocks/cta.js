import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// A push to act: words and one or two buttons. Banner is a full section,
// band a slim row across the page for a short message, like a closure. What
// used to be separate blocks (Call now, Gift cards, an announcement) are
// presets of this one. A number to call is a button whose address is `tel:`.
export default defineBlock({
 type: 'cta',
 label: 'Call to action',
 description: 'A headline and one or two buttons',
 category: 'cta',
 icon: 'cta',
 keywords: ['cta', 'cta banner', 'banner', 'band', 'button', 'call', 'phone', 'donate', 'gift', 'announcement', 'alert', 'closure'],
 presets: [
  {
   key: 'call_now',
   label: 'Call now',
   description: 'Click-to-call, mobile-first',
   data: {
    style: 'banner',
    tagline: '',
    headline: 'Questions? Give us a call.',
    body: richText('Open Mon–Sat · 9:00 am – 6:00 pm'),
    buttons: [{ label: '(555) 555-0123', to: 'tel:+15555550123', style: 'solid' }],
    note: 'Tap to call on mobile',
   },
  },
  {
   key: 'gift_cards',
   label: 'Gift cards',
   description: 'Link to gift card checkout',
   data: {
    style: 'banner',
    tagline: 'The easy gift',
    headline: 'Gift cards, any amount',
    body: richText('Digital cards land in their inbox in a minute. Printed ones are at the register.'),
    buttons: [{ label: 'Buy a gift card', to: '/gift-cards', style: 'solid' }],
    note: '',
   },
  },
  {
   key: 'book',
   label: 'Book',
   description: 'Send people to your booking page',
   data: {
    style: 'banner',
    tagline: 'Appointments',
    headline: 'Book a time that works for you',
    body: richText('Pick a day and a time online in about a minute. Same-day is fine when we have room.'),
    buttons: [{ label: 'Book now', to: '/book', style: 'solid' }],
    note: '',
   },
  },
  {
   key: 'donate',
   label: 'Donate link',
   description: 'Send people to your donation page',
   data: {
    style: 'banner',
    tagline: 'Support the work',
    headline: 'Help us keep the doors open',
    body: richText('Every gift, large or small, goes straight to the people we serve.'),
    buttons: [{ label: 'Donate', to: '/donate', style: 'solid' }],
    note: 'Gifts are tax-deductible',
   },
  },
  {
   key: 'announcement',
   label: 'Announcement',
   description: 'Closures, hiring, emergency',
   data: {
    style: 'band',
    background: 'brand',
    tagline: '',
    headline: '',
    body: richText('Closed Thursday for Thanksgiving. Back Friday at 9 am.'),
    buttons: [{ label: 'Holiday hours', to: '/contact', style: 'outline' }],
    note: '',
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  style: z.enum(['banner', 'band']).default('banner'),
  buttons: z.array(buttonSchema).max(2).default([]),
  note: z.string().max(120).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Banner', value: 'banner' },
    { label: 'Band', value: 'band' },
   ],
   help: 'A band is one slim row across the page.',
  },
  {
   ...buttonsField,
   max: 2,
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the buttons.' },
 ],
 defaults: {
  tagline: 'Work with us',
  headline: "Let's talk about what you need.",
  body: richText("Big job or small, tell us a little about it and we'll get back to you with a plan and a fair price."),
  style: 'banner',
  buttons: [{ label: 'Start a conversation', to: '/contact', style: 'solid' }],
  note: 'Replies within one business day',
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], note: [], 'buttons.*.label': [] },
});
