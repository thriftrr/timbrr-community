// Checks the site's analytics parts with no build, server or studio
// (docs/analytics.md): the page script sends nothing under Do Not Track or
// Global Privacy Control, a dropped hit is tallied in its own small data
// point, and /how-we-count's helpers. The studio's analytics-layer-checks.mjs
// checks the rest.
//   node layer/scripts/check-analytics.mjs
import { deepEqual, equal, ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const lib = await import('../server/utils/analytics.js');
const script = (await import('../server/utils/analytics-script.js')).default;
const { analyticsSettings, countedLines, keptFor, HOW_WE_COUNT_PATH } = await import('../app/utils/how-we-count.js');

// ── The script under DNT and GPC: not one listener, not one request ──
function run({ nav = {}, win = {} }) {
 const calls = [];
 const listen = (where) => (type) => calls.push(`${where}:${type}`);
 const html = { dataset: { tbA: 'view,leave,seen,click,heat,event', tbP: '/about page-1' }, scrollHeight: 2000 };
 const window = { innerWidth: 1280, innerHeight: 800, scrollY: 0, addEventListener: listen('w'), ...win };
 const document = { documentElement: html, referrer: '', hidden: false, addEventListener: listen('d'), querySelectorAll: () => [] };
 const sandbox = {
  window,
  document,
  navigator: { sendBeacon: () => calls.push('beacon'), ...nav },
  location: { hostname: 'example.test', search: '' },
  performance: { now: () => 0 },
  MutationObserver: class {
   observe() {
    calls.push('mutation');
   }
  },
  URL,
  URLSearchParams,
  setTimeout: (fn) => (fn(), 1),
  clearTimeout: () => {},
 };
 runInNewContext(script, sandbox);
 return calls;
}
ok(run({}).includes('beacon'), 'with no signal the script listens and sends');
for (const [what, signal] of Object.entries({ 'navigator.doNotTrack': { nav: { doNotTrack: '1' } }, 'window.doNotTrack': { win: { doNotTrack: '1' } }, 'navigator.globalPrivacyControl': { nav: { globalPrivacyControl: true } } })) {
 deepEqual(run(signal), [], `${what}: no listener, no beacon`);
}
ok(run({ nav: { doNotTrack: '0', globalPrivacyControl: false } }).includes('beacon'), 'DNT 0 and GPC false still count');

// ── A dropped hit: one skipped data point, nothing identifying ──
const HEADERS = { host: 'example.test', origin: 'https://example.test', 'user-agent': 'Mozilla/5.0 (Macintosh) Safari/605.1.15' };
const body = JSON.stringify([
 { e: 'view', p: '/about', g: 'page-1', w: 1280 },
 { e: 'seen', p: '/about', g: 'page-1', b: 'block-1' },
]);
const config = async () => ({ on: true, id: 'site_0123', events: ['view', 'seen'], fields: [] });
const hit = async (extra) => {
 const writes = [];
 const result = await lib.handleHit({ binding: { writeDataPoint: (p) => writes.push(p) }, site: 'north-wall', headers: HEADERS, ip: '203.0.113.7', body, getSalt: async () => 'a'.repeat(64), getConfig: config, tally: true, ...extra });
 return { ...result, writes };
};
for (const [what, extra, reason] of [
 ['the draft cookie', { draft: true }, 'team'],
 ['a dev or staging address', { preview: true }, 'preview'],
 ['a bot', { headers: { ...HEADERS, 'user-agent': 'Googlebot/2.1' } }, 'bot'],
]) {
 const got = await hit(extra);
 equal(got.status, 204, what);
 equal(got.written, 0, `${what}: no event written`);
 equal(got.skipped, reason, `${what}: skipped as ${reason}`);
 deepEqual(got.writes, [{ indexes: ['site_0123'], blobs: [lib.SKIPPED, reason], doubles: [2, 1] }], `${what}: one skipped point, site id, reason, events and views`);
 ok(!JSON.stringify(got.writes).includes('203.0.113.7') && !/Mozilla|Googlebot|\/about|page-1/.test(JSON.stringify(got.writes)), `${what}: no IP, user agent, path or page`);
}
for (const [what, extra] of [
 ['DNT', { headers: { ...HEADERS, dnt: '1' } }],
 ['GPC', { headers: { ...HEADERS, 'sec-gpc': '1' } }],
 ['another origin', { headers: { ...HEADERS, origin: 'https://evil.test' } }],
 ['tally off (the studio checks call it so)', { draft: true, tally: false }],
 ['a body the script never sends', { draft: true, body: '{"x":1}' }],
 ['a site that is off', { draft: true, getConfig: async () => ({ on: false, id: 'site_0123', events: [] }) }],
 ['no site', { preview: true, site: '' }],
]) {
 const got = await hit(extra);
 equal(got.writes.length, 0, `${what}: nothing written`);
}
equal((await hit({})).writes.length, 2, 'a plain visitor is still counted, one point per event');
ok(!lib.EVENT_NAMES.includes(lib.SKIPPED) && !['view', 'leave', 'seen', 'click', 'heat', 'event'].includes(lib.SKIPPED), "'skipped' is never an event");
ok(/tally: true/.test(readFileSync(new URL('../server/routes/__timbrr/hit.post.js', import.meta.url), 'utf8')), 'the hit route turns the tally on');

// ── /how-we-count ──
equal(HOW_WE_COUNT_PATH, '/how-we-count');
deepEqual(analyticsSettings(undefined), { on: false, events: [], fields: [], retentionDays: 90, howWeCountLink: false });
deepEqual(analyticsSettings({ on: false, events: ['view'], howWeCountLink: true, retentionDays: 30 }), { on: false, events: [], fields: [], retentionDays: 30, howWeCountLink: false });
deepEqual(analyticsSettings({ on: true, events: ['view', 3], fields: ['country'], id: 'x' }), { on: true, events: ['view'], fields: ['country'], retentionDays: 90, howWeCountLink: false });
equal(analyticsSettings({ on: true, howWeCountLink: true }).howWeCountLink, true);
equal(analyticsSettings({ on: 'yes', howWeCountLink: true }).on, false);
equal(analyticsSettings({ on: true, retentionDays: 365 }).retentionDays, 365);
equal(analyticsSettings({ on: true, retentionDays: -1 }).retentionDays, 90);
equal(keptFor(90), '90 days');
equal(keptFor(365), '1 year');
equal(keptFor(1825), '5 years');
deepEqual(countedLines({ events: ['view'], fields: [] }), [['Pages that are opened', '.']]);
const allLines = countedLines({ events: ['view', 'leave', 'seen', 'click', 'heat', 'event'], fields: ['referrer', 'utm', 'country', 'device', 'agent'] });
equal(allLines.length, 10);
ok(!countedLines({ events: ['view', 'leave'], fields: ['referrer'] }).some(([bold]) => /country|Phone/.test(bold)), 'only what the site collects is listed');
const page = readFileSync(new URL('../app/pages/how-we-count.vue', import.meta.url), 'utf8');
ok(/if \(!home\.value\.analytics\.on\) throw createError\(\{ statusCode: 404/.test(page), '/how-we-count is a 404 when analytics is off');
ok(!/tb-eyebrow|noindex/.test(page) && /They count visits, not people's names\./.test(page), 'no eyebrow, indexable, no anonymity claim beyond the agreed line');
const footer = readFileSync(new URL('../app/components/TbSiteFooter.vue', import.meta.url), 'utf8');
ok(/props\.site\.analytics\?\.howWeCountLink \?/.test(footer), 'the footer link follows howWeCountLink');

console.log('ok  analytics: DNT/GPC send nothing, dropped hits tallied, /how-we-count');
