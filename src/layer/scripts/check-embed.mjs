// Checks what an Embed block frames and what a Price calculator adds up to,
// and that every third party a block can load is declared with a cookie
// statement (schema/third-parties.js), with no build and no Vue:
//   node layer/scripts/check-embed.mjs
import { equal, ok, throws } from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildManifest, componentName } from '../schema/manifest.js';
import { SITE_LOADS, THIRD_PARTIES, cookieProblem, originMatches } from '../schema/third-parties.js';
import { calculatorTotal, embedFrame, priceNumber, streamSrc } from '../app/utils/blocks.js';
import { safeHref } from '../app/utils/timbrr.js';

// A link never leaves for another host by a back slash or a control character a browser drops.
for (const bad of ['//evil.example', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', 'javascript:alert(1)']) equal(safeHref(bad), undefined, JSON.stringify(bad));
equal(safeHref('/events/open-day'), '/events/open-day');

const RGP = 'https://app.rockgympro.com/b/s/?lk=abc123&bw=6f290f42e9fb4e12926bdb594e672d2a';

// An address alone, or the first one in a pasted embed code.
equal(embedFrame('https://calendly.com/widget?a=1'), 'https://calendly.com/widget?a=1');
equal(embedFrame('<iframe src="https://www.youtube.com/embed/x?a=1&amp;b=2" width="100%"></iframe>'), 'https://www.youtube.com/embed/x?a=1&b=2');
// Only a listed service: an unknown host, or one that only ends like a listed one, isn't framed.
for (const bad of ['https://example.com/widget', 'https://evilcalendly.com/x', 'https://calendly.com.evil.example/x']) equal(embedFrame(bad), undefined, bad);
// A script never reaches the page: only its address is read, and Rock Gym
// Pro's script address becomes the page for the same widget.
equal(embedFrame(`<script src="${RGP}"></script><script>alert(1)</script>`), 'https://app.rockgympro.com/b/?bw=6f290f42e9fb4e12926bdb594e672d2a');
equal(embedFrame('https://app.rockgympro.com/b/s/?lk=abc&bo=giftcard-92dcde09052743b8'), 'https://app.rockgympro.com/b/?bo=giftcard-92dcde09052743b8');
equal(embedFrame('https://app.rockgympro.com/b/s/?lk=abc'), undefined);
// Nothing but https.
for (const bad of ['', null, 'calendar', 'http://example.com', 'javascript:alert(1)', '//example.com', 'data:text/html,<p>']) equal(embedFrame(bad), undefined);

equal(priceNumber('$59'), 59);
equal(priceNumber('59.50'), 59.5);
equal(priceNumber('1,200'), 1200);
equal(priceNumber('free'), 0);

const data = { price: '$59', extra: '15', addons: [{ price: '15', per: 'each' }, { price: '30', per: 'once' }] };
equal(calculatorTotal(data, 1, []), 59);
equal(calculatorTotal(data, 3, []), 89);
equal(calculatorTotal(data, 3, [true]), 134);
equal(calculatorTotal(data, 3, [true, true]), 164);
equal(calculatorTotal({ price: '', extra: '', addons: [] }, 4, []), 0);

// A streamed video (the studio's docs/video.md): only Stream's player on a customer host, rebuilt from its parts.
const UID = '0123456789abcdef0123456789abcdef';
equal(streamSrc(`https://customer-abc123xyz.cloudflarestream.com/${UID}/iframe`), `https://customer-abc123xyz.cloudflarestream.com/${UID}/iframe`);
equal(streamSrc(`https://customer-abc123xyz.cloudflarestream.com/${UID}/iframe#media=AbCdEfGh12345678`), `https://customer-abc123xyz.cloudflarestream.com/${UID}/iframe`, 'the library id stays out of the frame');
for (const bad of [
 `http://customer-abc123xyz.cloudflarestream.com/${UID}/iframe`,
 `https://customer-abc123xyz.cloudflarestream.com.evil.example/${UID}/iframe`,
 `https://evil.example/customer-abc123xyz.cloudflarestream.com/${UID}/iframe`,
 `https://customer-abc123xyz.cloudflarestream.com/${UID}/iframe?autoplay=true`,
 `https://customer-abc123xyz.cloudflarestream.com/${UID}/manifest/video.m3u8`,
 `https://customer-abc123xyz.cloudflarestream.com/../${UID}/iframe`,
 `https://videodelivery.net/${UID}/iframe`,
 'javascript:alert(1)',
 '',
 null,
])
 equal(streamSrc(bad), undefined, String(bad));

console.log('ok  embedFrame, priceNumber, calculatorTotal');

// ---- Third parties: what a block can load, and what we say about it ----

const layerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(file, 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)]));

// An entry can't be used in a privacy policy without one definite thing about
// cookies. "May set cookies" is refused, and so is 'none' for a service we
// don't run: that has to come from our own code, not from memory.
equal(cookieProblem('none'), null);
equal(cookieProblem('to-be-verified'), null);
equal(cookieProblem(['vuid', '[clip_id]_password']), null);
for (const bad of ['may set cookies', 'maybe', '', undefined, null, [], ['it sets a few'], [''], 42]) ok(cookieProblem(bad), `cookieProblem accepted ${JSON.stringify(bad)}`);
const ids = new Set();
for (const entry of THIRD_PARTIES) {
 const where = `third party ${entry.id}`;
 ok(!ids.has(entry.id), `${where} is listed twice`);
 ids.add(entry.id);
 for (const key of ['name', 'what', 'collects', 'processor', 'source']) ok(typeof entry[key] === 'string' && entry[key].trim(), `${where} has no ${key}`);
 equal(cookieProblem(entry.cookies), null, `${where}: ${cookieProblem(entry.cookies)}`);
 ok(['own', 'load', 'link'].includes(entry.kind), `${where}: unknown kind ${entry.kind}`);
 if (entry.kind !== 'own') {
  ok(entry.cookies !== 'none', `${where} says no cookies, which only our own code can say`);
  ok(entry.origins.length || entry.anyOrigin, `${where} has no origin`);
  if (Array.isArray(entry.cookies)) ok(/https?:\/\//.test(entry.source), `${where} names cookies without the source's address`);
 }
}
for (const id of SITE_LOADS) ok(ids.has(id), `SITE_LOADS names ${id}, which isn't listed`);

// Where an address may appear without being a third party: our own, the
// standards' namespaces, and links a visitor clicks to a profile (nothing is
// loaded from them).
const IGNORED_HOSTS = ['localhost', '127.0.0.1', 'timbrr.app', 'www.w3.org', 'www.sitemaps.org', 'schema.org', 'analytics.invalid'];
const LINK_OUT = ['www.instagram.com', 'www.facebook.com', 'www.tiktok.com', 'x.com', 'www.youtube.com'];
const HOST = /https?:\/\/([a-z0-9][a-z0-9.-]*)/gi;
const hostsIn = (text) => [...text.matchAll(HOST)].map((match) => match[1].toLowerCase());
const entryFor = (host) => THIRD_PARTIES.find((entry) => originMatches(entry.origins, host));

// 1. Every address in the layer's code is ours, a link out, or listed.
const SITE_FILES = [join(layerDir, 'app/utils/brand.js'), join(layerDir, '../starter/nuxt.config.js')];
const sources = [...['app', 'server', 'modules'].flatMap((dir) => walk(join(layerDir, dir))), join(layerDir, '../starter/nuxt.config.js')].filter((file) => /\.(js|vue|mjs)$/.test(file) && !file.endsWith('analytics-script.js'));
for (const file of sources) {
 for (const host of hostsIn(read(file))) {
  if (IGNORED_HOSTS.some((ignored) => host === ignored || host.endsWith(`.${ignored}`)) || LINK_OUT.includes(host)) continue;
  ok(entryFor(host), `${file.replace(layerDir, 'layer')} loads ${host}, which schema/third-parties.js doesn't list`);
 }
}
// What every page loads has to be said of every site.
for (const file of SITE_FILES) {
 for (const host of hostsIn(read(file))) {
  const entry = entryFor(host);
  if (entry) ok(SITE_LOADS.includes(entry.id), `${file.replace(layerDir, 'layer')} loads ${host} on every page, so ${entry.id} belongs in SITE_LOADS`);
 }
}

// 2. A block declares what its components load: the addresses in them, and
// the helpers and components that bring a service in (`via`). A component
// reaches the Tb* components it names.
const componentsDir = join(layerDir, 'app/components');
function reach(file, seen = new Set()) {
 if (seen.has(file)) return seen;
 seen.add(file);
 for (const name of new Set(read(file).match(/\bTb[A-Z]\w*/g) ?? [])) {
  try {
   reach(join(componentsDir, `${name}.vue`), seen);
  } catch {
   // a name that isn't a component file (a CSS class, a helper)
  }
 }
 return seen;
}
// The ids a block's components need declared, from their text.
function loadsNeeded(text) {
 const words = new Set(text.match(/\b\w+\b/g));
 return THIRD_PARTIES.filter((entry) => entry.kind !== 'own' && (entry.via?.some((name) => words.has(name)) || hostsIn(text).some((host) => originMatches(entry.origins, host)))).map((entry) => entry.id);
}
equal(loadsNeeded("embedSrc(props.value)").join(), 'youtube,vimeo');
equal(loadsNeeded("<TbShopBuy />").join(), 'shopify');
equal(loadsNeeded('<iframe src="https://tile.openstreetmap.org/1/1/1.png">').join(), 'openstreetmap');
equal(loadsNeeded('no third party here').length, 0);
equal(loadsNeeded('streamSrc(props.data.video_url)').join(), 'cloudflare_stream');

const layer = { name: '@timbrr/community', version: '0.0.0', tier: 'community' };
const definitions = [];
for (const file of readdirSync(join(layerDir, 'blocks')).filter((name) => /\.m?js$/.test(name)).sort()) {
 definitions.push({ def: (await import(pathToFileURL(join(layerDir, 'blocks', file)).href)).default, layer });
}
const declared = new Set();
const undeclared = [];
for (const { def } of definitions) {
 const component = join(componentsDir, 'blocks', `${componentName(def.type).replace(/^Blocks/, '')}.global.vue`);
 let text;
 try {
  text = [...reach(component)].map(read).join('\n');
 } catch {
  continue; // no component of its own: nothing it can load
 }
 for (const id of loadsNeeded(text)) if (!def.loads?.includes(id)) undeclared.push(`block ${def.type} can load ${id}: add loads: ['${id}'] in blocks/${def.type}.js`);
 for (const id of def.loads ?? []) declared.add(id);
}
equal(undeclared.join('\n'), '');
// A listed service nothing declares is a stale entry.
for (const entry of THIRD_PARTIES) ok(entry.kind === 'own' || SITE_LOADS.includes(entry.id) || declared.has(entry.id), `${entry.id} is listed but no block declares it`);

// The manifest carries the list for the studio, and refuses a block that
// names a service it doesn't know.
const manifest = buildManifest('check', [layer], definitions);
equal(manifest.thirdParties.length, THIRD_PARTIES.length);
equal(manifest.siteLoads.join(), SITE_LOADS.join());
ok(manifest.blocks.find((block) => block.type === 'media').loads.includes('youtube'));
const media = definitions.find(({ def }) => def.type === 'media').def;
throws(() => buildManifest('check', [layer], [{ def: { ...media, loads: ['nope'] }, layer }]), /isn't in schema\/third-parties\.js/);

console.log(`ok  third parties: ${THIRD_PARTIES.length} listed, ${definitions.filter(({ def }) => def.loads?.length).length} blocks declare what they load`);
