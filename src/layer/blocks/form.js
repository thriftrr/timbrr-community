import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// A form, and `purpose` says which boxes it has: a contact form's name, email
// and message; a quote's name, phone, service and photos; or the one box
// beside a button of an email signup or a text club. The form draws as
// designed, but sending isn't wired up yet: its button doesn't send anything,
// and the button label's help says so in the studio. `services`, `placeholder`,
// `channel` and `consent` belong to some purposes and are kept by all of them,
// so switching back loses nothing.
const TEXT_CONSENT = 'By joining you agree to receive texts from us. Msg & data rates may apply. Reply STOP to opt out.';

export default defineBlock({
 type: 'form',
 label: 'Form',
 description: 'Contact, newsletter signup, quote request',
 category: 'dynamic',
 icon: 'form',
 keywords: ['contact', 'email', 'newsletter', 'signup', 'sign up', 'quote', 'estimate', 'inquiry', 'text club', 'sms'],
 presets: [
  {
   key: 'email_signup',
   label: 'Email signup',
   description: 'One box for an email address',
   data: {
    purpose: 'signup',
    tagline: 'Stay in the loop',
    headline: 'Get our newsletter',
    intro: richText('News, events and the occasional deal, about once a month.'),
    placeholder: 'Email address',
    submit_label: 'Sign up',
   },
  },
  {
   key: 'contact',
   label: 'Contact',
   description: 'Name, email and a message',
   data: {
    purpose: 'contact',
    tagline: 'Say hi',
    headline: 'Get in touch',
    intro: richText('Questions, orders or just a hello. We read every message.'),
    submit_label: 'Send message',
   },
  },
  {
   key: 'request_quote',
   label: 'Request a quote',
   description: 'Name, phone, service, photo',
   data: {
    purpose: 'quote',
    tagline: 'Quotes & estimates',
    headline: 'Tell us what you need',
    intro: richText('What, where and when, plus a photo or two if it helps. A real person replies within one business day.'),
    services: [{ name: 'One-time job' }, { name: 'Regular service' }, { name: 'Something else' }],
    submit_label: 'Request a quote',
   },
  },
  {
   key: 'text_club',
   label: 'Text club',
   description: 'Loyalty signup with consent',
   data: {
    purpose: 'text_club',
    background: 'soft',
    tagline: '',
    headline: 'Join the text club',
    intro: richText('New arrivals, events and the occasional deal. Two texts a month, tops.'),
    placeholder: 'Phone number',
    channel: 'phone',
    consent: TEXT_CONSENT,
    submit_label: 'Join',
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  intro: richTextSchema.default(richText('')),
  purpose: z.enum(['contact', 'signup', 'quote', 'text_club']).default('contact'),
  services: z
   .array(z.object({ name: z.string().max(80).default('') }))
   .max(20)
   .default([]),
  placeholder: z.string().max(60).default(''),
  channel: z.enum(['phone', 'email']).default('phone'),
  consent: z.string().max(500).default(''),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'intro', label: 'Intro', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'purpose',
   label: 'Purpose',
   widget: 'select',
   options: [
    { label: 'Contact', value: 'contact' },
    { label: 'Email signup', value: 'signup' },
    { label: 'Quote request', value: 'quote' },
    { label: 'Text club', value: 'text_club' },
   ],
   help: 'Decides which boxes the form has.',
  },
  {
   key: 'services',
   label: 'Services',
   widget: 'items',
   itemLabel: 'name',
   max: 20,
   help: "For a quote request: the choices in the form's Service menu. With none, the menu is left out.",
   subfields: [{ key: 'name', label: 'Service', widget: 'text' }],
  },
  { key: 'placeholder', label: 'Box hint', widget: 'text', inline: true, help: 'For an email signup or text club: the hint inside the empty box.' },
  {
   key: 'channel',
   label: 'Sign up with',
   widget: 'buttons',
   options: [
    { label: 'Phone', value: 'phone' },
    { label: 'Email', value: 'email' },
   ],
   help: 'For a text club: what the box asks for.',
  },
  {
   key: 'consent',
   label: 'Consent copy',
   widget: 'textarea',
   inline: true,
   help: "For a text club: shown under the box. Say who's sending, how often, and how to stop.",
  },
  {
   key: 'submit_label',
   label: 'Button label',
   widget: 'text',
   inline: true,
   help: "Sending isn't switched on yet: visitors see the form, but pressing the button doesn't send anything.",
  },
 ],
 defaults: {
  tagline: 'Say hi',
  headline: 'Get in touch',
  intro: richText('Questions, orders or just a hello. We read every message.'),
  purpose: 'contact',
  submit_label: 'Send message',
 },
 wys: { tagline: [], headline: [], intro: ['bold', 'italic'], placeholder: [], consent: [], submit_label: [] },
});
