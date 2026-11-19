// Small guards a stranger's site leans on: rich text has loose size and depth
// caps (and the studio sees the size ones in the manifest), a visitor's IPv6
// address counts as its /64, a form id never finds Object's own keys, and the
// Site search block's results page is only ever a page of this site.
// Run: node scripts/check-limits.mjs
import { equal, ok } from 'node:assert/strict';
import { z } from 'zod';
import { richDocSchema, richTextSchema } from '../schema/define.js';
import { addressOf } from '../server/utils/visitor.js';
import { formNamed } from '../app/utils/forms.js';
import { safeHref } from '../app/utils/timbrr.js';

const nest = (n) => (n ? { type: 'paragraph', content: [nest(n - 1)] } : { type: 'text', text: 'x' });
ok(richDocSchema.safeParse({ type: 'doc', content: [nest(10)] }).success, 'a normal nested list parses');
ok(!richDocSchema.safeParse({ type: 'doc', content: [nest(30)] }).success, 'a very deep document is refused');
ok(richDocSchema.safeParse({ type: 'doc', content: Array(1000).fill({ type: 'paragraph' }) }).success);
ok(!richDocSchema.safeParse({ type: 'doc', content: Array(1001).fill({ type: 'paragraph' }) }).success);
ok(!richDocSchema.safeParse({ type: 'doc', content: [{ type: 'paragraph', content: Array(201).fill({ type: 'text', text: 'x' }) }] }).success);
ok(!richDocSchema.safeParse({ type: 'doc', content: [{ type: 'text', text: 'x', marks: Array(9).fill({ type: 'bold' }) }] }).success);
ok(richTextSchema.safeParse('an older plain string').success);
const json = JSON.stringify(z.toJSONSchema(richTextSchema, { io: 'input', unrepresentable: 'throw' }));
ok(json.includes('"maxItems":1000') && json.includes('"maxItems":200') && json.includes('"maxItems":8'), 'the caps reach the manifest');

equal(addressOf('203.0.113.9'), '203.0.113.9');
equal(addressOf('::ffff:203.0.113.9'), '203.0.113.9');
equal(addressOf('2001:db8:1:2:aaaa::1'), '2001:db8:1:2::/64');
equal(addressOf('2001:db8:1:2:bbbb:cccc:dddd:eeee'), '2001:db8:1:2::/64');
equal(addressOf('2001:db8::1'), '2001:db8:0:0::/64');
equal(addressOf(addressOf('2001:db8:1:2::9')), '2001:db8:1:2::/64', 'the studio reading it again gets the same');

const forms = { signup: { id: 'signup', fields: [] }, broken: { id: 'broken' } };
equal(formNamed(forms, 'signup'), forms.signup);
for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'broken', '', undefined]) equal(formNamed(forms, id), null, String(id));
equal(formNamed({}, 'signup'), null);

// The block keeps only what safeHref passes and starts with one slash.
const results = (to) => (safeHref(to)?.startsWith('/') ? safeHref(to).replace(/[?#].*$/, '') : '');
equal(results('/search?x=1'), '/search');
for (const bad of ['/\\evil.example', '//evil.example', 'https://evil.example', '/\tx', 'javascript:alert(1)', '#top', '']) equal(results(bad), '', bad);

console.log('limits: ok');
