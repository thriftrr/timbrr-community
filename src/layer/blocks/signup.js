import { z } from 'zod';
import { defineBlock, headlineField } from '../schema/define.js';

// Sign-up (the studio's docs/marketing.md): one email box and a button that
// put a visitor on the site's own email list. Free and always on. The
// studio sends "Confirm your address" first (double opt-in), so nobody is
// mailed who didn't confirm. It replaces the retired Text / email club,
// which never sent anything; pages that still hold that block draw it as
// before. `text_me` adds a "Text me too" box: the phone is kept with the
// consent, but texts aren't sent yet.
export default defineBlock({
 type: 'signup',
 label: 'Sign-up',
 description: 'Visitors join your email list',
 category: 'cta',
 icon: 'mail',
 keywords: ['newsletter', 'email', 'list', 'subscribe', 'join', 'mailing', 'club', 'marketing', 'sign up'],
 schema: z.object({
  headline: z.string().max(160).default(''),
  body: z.string().max(400).default(''),
  ask_name: z.boolean().default(false),
  text_me: z.boolean().default(false),
  consent: z.string().max(400).default(''),
  submit_label: z.string().max(40).default(''),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Words', widget: 'textarea', inline: true, ai: 'generate' },
  { key: 'submit_label', label: 'Button', widget: 'text', inline: true, placeholder: 'Sign me up' },
  { key: 'ask_name', label: 'Ask for their first name', widget: 'switch' },
  { key: 'text_me', label: '"Text me too"', widget: 'switch', help: "Adds a phone number box. Numbers are kept with their consent, but texts aren't sent yet." },
  { key: 'consent', label: 'Small print', widget: 'textarea', inline: true, help: "Shown under the box and kept with each sign-up. Say what you'll send and how often." },
 ],
 defaults: {
  headline: 'Get our news',
  body: 'New things, events and the occasional offer. No spam.',
  ask_name: false,
  text_me: false,
  consent: "We'll email now and then. Every email has a link to stop them.",
  submit_label: 'Sign me up',
 },
 wys: { headline: [], body: [], consent: [], submit_label: [] },
});
