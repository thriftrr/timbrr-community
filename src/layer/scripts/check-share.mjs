// Checks a form's share page and what the visitor's browser keeps of a form
// with steps, with no build, no server and no studio (the studio's
// docs/forms.md, "Share link" and "Saved progress"):
//   node layer/scripts/check-share.mjs
// The page's address, who may frame it and who may index it (only the share
// page is framed by anyone, and never indexed), what /__timbrr/share asks the
// studio and says back, and the helpers that keep answers in localStorage:
// never a file, never past seven days, never what a form no longer holds.
import { registerHooks } from 'node:module';
import { deepEqual, equal, ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({ resolve: (name, context, next) => (name === '#imports' ? { url: 'data:text/javascript,export const useRuntimeConfig = (e) => e.config;', shortCircuit: true } : next(name, context)) });

const { SHARE_SLUG, isSharePath } = await import('../server/utils/share.js');
const { default: headers } = await import('../modules/runtime/canvas-headers.js');
const { default: share } = await import('../server/routes/__timbrr/share.js');
const { KEEP_DAYS, keepFingerprint, keepKey, keepable, keptWhen, readKept, sweepKept } = await import('../app/utils/form-keep.js');

// ── The address ──
for (const yes of ['/f/cake-order', '/f/cake-order/', '/F/Cake-Order', '/f/a']) ok(isSharePath(yes), yes);
for (const no of ['/f', '/f/', '/f/a/b', '/forms/x', '/about/f/x', '/__timbrr/share', '/', '']) ok(!isSharePath(no), no || '(empty)');
for (const yes of ['a', 'cake-order', 'a1-b2', 'x'.repeat(60)]) ok(SHARE_SLUG.test(yes), yes);
for (const no of ['', '-a', 'a-', 'A', 'a b', 'a/b', 'a.b', 'x'.repeat(61)]) ok(!SHARE_SLUG.test(no), JSON.stringify(no));

// ── Framing and indexing ──
function request(path, { site = 'north', studioOrigin = 'https://studio.example', scriptPolicy = '' } = {}) {
 const out = {};
 const event = {
  node: { req: { url: path, headers: { host: 'north.example' }, method: 'GET', connection: {} }, res: { setHeader: (name, value) => (out[name.toLowerCase()] = value), getHeader: (name) => out[name.toLowerCase()], removeHeader() {} } },
  path,
  context: {},
  config: { public: { site, studioOrigin }, timbrr: { scriptPolicy } },
 };
 return { event, out };
}
const page = request('/f/cake-order');
headers(page.event);
equal(page.out['content-security-policy'].split(';')[0], 'frame-ancestors *', 'the share page may be framed by any site');
equal(page.out['x-robots-tag'], 'noindex, nofollow', 'and is never indexed');
const other = request('/about');
headers(other.event);
equal(other.out['content-security-policy'].split(';')[0], "frame-ancestors 'self' https://studio.example", 'every other page keeps its framing rule');
equal(other.out['x-robots-tag'], undefined, 'and is indexed as before');
const local = request('/menu', { studioOrigin: '' });
headers(local.event);
ok(local.out['content-security-policy'].startsWith("frame-ancestors 'self' http://localhost:*"), 'development still frames from localhost');
const canvas = request('/__timbrr/canvas');
headers(canvas.event);
equal(canvas.out['x-robots-tag'], 'noindex, nofollow');
ok(canvas.out['content-security-policy'].includes("'self' https://studio.example"), 'the canvas is framed by the studio only');
const marketing = request('/f/x', { scriptPolicy: 'enforce' });
headers(marketing.event);
ok(marketing.out['content-security-policy'].includes('frame-ancestors *') && marketing.out['content-security-policy'].includes('script-src'), 'a site that limits its scripts still does on the share page');

// ── The read ──
const API = 'http://studio.test';
const calls = [];
let answer = () => new Response('{}', { status: 404 });
globalThis.fetch = async (url) => {
 calls.push(String(url));
 return answer(String(url));
};
async function ask(query, { preview = false } = {}) {
 const out = {};
 const event = {
  node: { req: { url: `/__timbrr/share?${query}`, headers: { host: 'north.example' }, method: 'GET', connection: {} }, res: { statusCode: 200, setHeader: (name, value) => (out[name.toLowerCase()] = value), getHeader: (name) => out[name.toLowerCase()], removeHeader() {} } },
  path: `/__timbrr/share?${query}`,
  context: preview ? { timbrrPreview: { slug: 'north', kind: 'dev' } } : {},
  config: { public: { site: 'north' }, timbrr: { api: API } },
 };
 const body = await share(event);
 return { status: event.node.res.statusCode, body, headers: out };
}
const FORM = { site: { name: 'North' }, form: { id: 'f1', fields: [{ id: 'a', type: 'text', label: 'Name' }] } };
answer = (url) => (url === `${API}/api/public/sites/north/share/cake-order` ? Response.json(FORM) : new Response('{}', { status: 404 }));
let got = await ask('slug=Cake-Order');
equal(got.status, 200);
deepEqual(got.body, FORM, 'the studio answer goes to the page as it is, the address in lower case');
equal(got.headers['x-robots-tag'], 'noindex');
equal(got.headers['cache-control'], 'public, max-age=60');
got = await ask('slug=never-on');
equal(got.status, 404);
equal(got.body.message, 'This form is closed.', 'a link that is off, or never was, is closed');
calls.length = 0;
for (const bad of ['', 'slug=', 'slug=..%2Fx', `slug=${'x'.repeat(61)}`, 'slug=a b', 'slug=-a']) {
 got = await ask(bad);
 equal(got.status, 404, bad);
}
equal(calls.length, 0, 'what is not an address never reaches the studio');
answer = () => new Response('', { status: 503 });
got = await ask('slug=cake-order');
equal(got.status, 502);
equal(got.headers['cache-control'], 'no-store', 'the studio failing is said, and never kept');
answer = () => Response.json({ site: {}, form: { id: 'f1' } });
equal((await ask('slug=cake-order')).status, 502, 'an answer with no fields to draw is not a form');
answer = (url) => (url.includes('/api/preview/') ? Response.json(FORM) : new Response('{}', { status: 404 }));
got = await ask('slug=cake-order', { preview: true });
ok(calls.at(-1).startsWith(`${API}/api/preview/sites/north/share/cake-order`), 'a dev address reads the working copy');
equal(got.headers['cache-control'], 'no-store', 'which is never kept');

// ── Kept answers ──
const FORM_DOC = {
 id: 'f1',
 fields: [
  { id: 'occ', type: 'select', label: 'Occasion', options: [{ l: 'Birthday' }, { l: 'Wedding' }] },
  { id: 'n', type: 'number', label: 'Servings' },
  { id: 'flav', type: 'checkbox', label: 'Flavors', options: [{ l: 'Vanilla' }, { l: 'Lemon' }] },
  { id: 'photo', type: 'file', label: 'Photo', files: { types: ['JPG'], max: 10 } },
  { id: 'p2', type: 'page', label: 'You' },
  { id: 'who', type: 'name', label: 'Name' },
  { id: 'agree', type: 'consent', label: 'I agree' },
  { id: 'src', type: 'hidden', label: 'Source' },
  { id: 'est', type: 'calc', label: 'Estimate' },
 ],
};
const typed = { occ: 'Wedding', n: 120, flav: ['Lemon', 'Gone'], photo: { name: 'cake.jpg', size: 5 }, who: 'Hannah', agree: true, src: 'ad', est: 5, ghost: 'x' };
deepEqual(keepable(FORM_DOC, typed), { occ: 'Wedding', n: 120, flav: ['Lemon'], who: 'Hannah', agree: true }, 'a file, a hidden field, a total and a field the form lacks are never kept');
deepEqual(keepable(FORM_DOC, { occ: 'Funeral', who: '', agree: false, flav: [] }), {}, 'a choice the form no longer has, empty and unticked answers are not kept');
ok(keepFingerprint(FORM_DOC) === keepFingerprint(structuredClone(FORM_DOC)), 'a form fingerprints the same every time');
const changed = structuredClone(FORM_DOC);
changed.fields[0].options.push({ l: 'Graduation' });
ok(keepFingerprint(changed) !== keepFingerprint(FORM_DOC), 'a changed option is another form');
changed.fields[0].options.pop();
changed.fields[5].label = 'Your name';
ok(keepFingerprint(changed) !== keepFingerprint(FORM_DOC), 'so is a renamed field');
ok(keepKey('north.example', FORM_DOC).startsWith('tb-form:north.example:f1:') && keepKey('north.example', FORM_DOC) !== keepKey('south.example', FORM_DOC), 'a copy is for one site and one form');

const NOW = Date.UTC(2026, 10, 20, 15);
const stored = (at, extra = {}) => JSON.stringify({ at, step: 1, values: keepable(FORM_DOC, typed), ...extra });
const back = readKept(stored(NOW - 3600_000), FORM_DOC, 2, NOW);
deepEqual(back.values, { occ: 'Wedding', n: 120, flav: ['Lemon'], who: 'Hannah', agree: true });
equal(back.step, 1);
ok(readKept(stored(NOW - (KEEP_DAYS * 24 - 1) * 3600_000), FORM_DOC, 2, NOW), 'a copy a little under a week old is still good');
equal(readKept(stored(NOW - (KEEP_DAYS * 24 + 1) * 3600_000), FORM_DOC, 2, NOW), null, 'one a little over is gone');
equal(readKept(stored(NOW + 3 * 24 * 3600_000), FORM_DOC, 2, NOW), null, 'and so is one from the future');
equal(readKept(stored(NOW, { step: 9 }), FORM_DOC, 2, NOW).step, 1, 'a step past the last is the last');
equal(readKept(stored(NOW, { step: -3 }), FORM_DOC, 2, NOW).step, 0);
equal(readKept(stored(NOW, { step: 'x' }), FORM_DOC, 2, NOW).step, 0);
for (const bad of ['', 'nope', '[]', 'null', '{"at":"x","values":{}}', JSON.stringify({ at: NOW, step: 0, values: {} }), JSON.stringify({ at: NOW, step: 0, values: { photo: { name: 'a.jpg' }, src: 'x', occ: 'Funeral' } })]) equal(readKept(bad, FORM_DOC, 2, NOW), null, bad.slice(0, 40));
equal(readKept(JSON.stringify({ at: NOW, step: 0, values: { photo: 'cake.jpg', who: 'Hannah' } }), FORM_DOC, 2, NOW).values.photo, undefined, 'a file is not read back even if one was written');

equal(keptWhen(NOW - 3600_000, NOW), 'earlier today');
equal(keptWhen(new Date(2026, 10, 19, 23).getTime(), new Date(2026, 10, 20, 9).getTime()), 'yesterday', "by the visitor's own calendar");
equal(keptWhen(NOW - 3 * 24 * 3600_000, NOW), '3 days ago');

const storage = {
 'tb-form:a:1:x': JSON.stringify({ at: NOW - 8 * 24 * 3600_000 }),
 'tb-form:a:2:y': JSON.stringify({ at: NOW - 3600_000 }),
 'tb-form:a:3:z': 'not json',
 'other-key': 'keep me',
 getItem(key) {
  return key in this ? this[key] : null;
 },
 removeItem(key) {
  delete this[key];
 },
};
sweepKept(storage, NOW);
deepEqual(Object.keys(storage).filter((key) => !['getItem', 'removeItem'].includes(key)), ['tb-form:a:2:y', 'other-key'], 'old and broken copies go, a fresh one and anything else stay');

// ── The visitor's form ──
const source = readFileSync(fileURLToPath(new URL('../app/components/TbForm.vue', import.meta.url)), 'utf8');
for (const [what, text] of [
 ['the thank-you takes focus', 'thanks.value?.focus()'],
 ['it can be focused', 'tabindex="-1" class="tb-form__sent"'],
 ['and still reads out as a status', '<div role="status"><div v-if="sent"'],
 ['the check says it could not load', "We couldn't load a quick check."],
 ['and offers Try again', '>Try again</button>'],
 ['Send waits for it, with the reason', ':disabled="sending || checkFailed"'],
 ['a failed Send leads to the summary', 'things to fix'],
 ['a file field says its size and types', 'photos(field)'],
 ['answers are cleared on Start again', 'function startAgain()'],
]) ok(source.includes(text), what);

console.log('check-share: ok');
