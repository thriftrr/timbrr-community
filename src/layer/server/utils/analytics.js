// Timbrr Analytics, the site Worker's side (docs/analytics.md, the studio's
// docs/adr/0023-web-analytics.md). /__timbrr/hit calls handleHit with what it
// read off the request; nothing here touches Nuxt or h3, so it runs as it is
// in the studio's check-analytics.mjs.
//
// Counts without a cookie: a visitor is SHA-256(the day's salt + site + IP +
// user agent), the salt comes from the studio and changes every UTC day, and
// the IP and user agent are only ever fed to the hash. One Analytics Engine
// data point per event, in the layout below (the studio's nightly task reads
// it by these positions, so changing one is a migration).

// The data point: index1 is the site's id (the studio sends it with what the
// owner picked, so a purged slug that a new site reuses never reads the old
// site's events). blob1 is always the event, so a query starts with
// WHERE blob1 = 'view'. A field an event doesn't have is '' (or 0).
export const BLOBS = ['event', 'visitor', 'path', 'page', 'block', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'country', 'device', 'browser', 'os', 'width', 'kind', 'dest', 'name'];
export const DOUBLES = ['seconds', 'depth', 'x', 'y', 'button'];

export const EVENT_NAMES = ['form_sent', 'shop_handoff', 'video_play', 'booking_open', 'outbound', 'file_download', 'phone_tap', 'email_tap'];
const MAX_BODY = 4096; // bytes; ten small events are about a kilobyte
const MAX_EVENTS = 10;
const HOST = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/;
const ID = /^[A-Za-z0-9._-]{1,100}$/;
const PLAIN = /^[^\u0000-\u001f\u007f]{0,64}$/;

// Browsers and tools that aren't people. Matched on the user agent; Cloudflare's
// verified-bot category (cf.verifiedBotCategory) is the other half.
const BOT = /bot|crawl|spider|slurp|scrape|fetch|headless|lighthouse|pagespeed|pingdom|uptime|monitor|facebookexternalhit|preview|curl|wget|python|axios|java\/|go-http|okhttp|libwww|httpclient|phantom|selenium|puppeteer|playwright/i;

export function isBot(userAgent, verifiedBotCategory) {
 return !userAgent || BOT.test(userAgent) || Boolean(verifiedBotCategory);
}

// Hex of SHA-256(text), the first `length` characters.
export async function sha256Hex(text, length = 64) {
 const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
 return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  .join('')
  .slice(0, length);
}

// One visitor for one day on one site. 128 bits of the hash is plenty to tell
// visitors apart and keeps each data point small.
export const visitorHash = (salt, site, ip, userAgent) => sha256Hex([salt, site, ip, userAgent].join('\u0000'), 32);

export const utcDay = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

// ── The salt ──
// Asked of the studio with the relay secret, and kept in caches.default under
// a made-up address for the rest of the UTC day. Not the studio's address: the
// edge cache can answer a plain request for the address it holds, and a salt
// must never be one. A salt that isn't today's, or no answer, is null and the
// hit isn't counted: there is no weaker salt to fall back on.
const here = new Map(); // the isolate's own copy: day → salt
export async function fetchSalt({ api, secret, cache = globalThis.caches?.default, fetcher = fetch, now = Date.now() }) {
 const day = utcDay(now);
 if (here.has(day)) return here.get(day);
 const key = `https://analytics.invalid/salt/${day}`;
 try {
  const kept = await cache?.match(key);
  if (kept) {
   const salt = (await kept.json())?.salt;
   if (typeof salt === 'string') return remember(day, salt);
  }
  if (!secret || !/^https?:\/\/[^/]/.test(api)) return null;
  const res = await fetcher(`${api}/api/public/analytics/salt`, { headers: { accept: 'application/json', 'x-timbrr-relay': secret }, signal: AbortSignal.timeout(4000) });
  if (res.status !== 200) throw new Error(`it answered ${res.status}`);
  const body = await res.json();
  if (body?.day !== day || !/^[0-9a-f]{64}$/.test(body?.salt ?? '')) throw new Error("it didn't send today's salt");
  const left = Math.max(60, Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - now) / 1000));
  await cache?.put(key, new Response(JSON.stringify({ salt: body.salt }), { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${left}` } })).catch(() => {});
  return remember(day, body.salt);
 } catch (error) {
  console.error(`[timbrr] Couldn't get the analytics salt from the studio: ${error.message}`);
  return null;
 }
}

function remember(day, salt) {
 here.clear(); // yesterday's goes the moment today's is known
 here.set(day, salt);
 return salt;
}

// ── What is counted ──
// Why this request isn't counted, or null when it is. Nothing is read from a
// request that fails one of these but its headers.
export function notCounted({ preview, site, headers, draft, cf }) {
 if (preview) return 'preview'; // dev and staging addresses
 if (!site) return 'no site'; // the builder's canvas, or a Worker with no site
 if (headers['sec-gpc'] === '1') return 'gpc';
 if (headers.dnt === '1') return 'dnt';
 if (draft) return 'draft'; // the client's own team
 if (isBot(headers['user-agent'], cf?.verifiedBotCategory)) return 'bot';
 const host = headers.host ?? '';
 if (headers.origin && safeHost(headers.origin) !== host) return 'cross-origin';
 const from = headers.referer ?? '';
 if (/^https?:\/\/[^/]+\/__timbrr\//.test(from)) return 'canvas';
 return null;
}

const safeHost = (url) => {
 try {
  return new URL(url).host;
 } catch {
  return null;
 }
};

// ── What the script may send ──
// Each event's fields, with what each must be. Anything not listed, or the
// wrong shape, refuses the whole request: nothing is written.
const int = (min, max) => (v) => Number.isInteger(v) && v >= min && v <= max;
const isHost = (v) => v === '' || (typeof v === 'string' && HOST.test(v));
const isId = (v) => typeof v === 'string' && ID.test(v);
const isPlain = (v) => typeof v === 'string' && PLAIN.test(v);
const SHAPES = {
 view: { r: isHost, us: isPlain, um: isPlain, uc: isPlain, w: int(0, 20000) },
 leave: { s: int(0, 86400), d: (v) => int(0, 100)(v) && v % 10 === 0 },
 seen: { b: isId },
 click: { b: isId, i: int(0, 999), k: (v) => v === 'link' || v === 'button', h: isHost, w: int(0, 20000) },
 heat: { b: isId, x: int(0, 100), y: int(0, 100), w: int(0, 20000) },
 event: { n: (v) => EVENT_NAMES.includes(v) },
};
const REQUIRED = { seen: ['b'], click: ['b', 'i', 'k'], heat: ['b', 'x', 'y'], leave: ['s', 'd'], event: ['n'], view: [] };

// The events in a request body, or null when anything about it is off.
export function validateHit(text) {
 if (typeof text !== 'string' || text.length > MAX_BODY || new TextEncoder().encode(text).length > MAX_BODY) return null;
 let list;
 try {
  list = JSON.parse(text);
 } catch {
  return null;
 }
 if (!Array.isArray(list) || !list.length || list.length > MAX_EVENTS) return null;
 for (const item of list) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const shape = SHAPES[item.e];
  if (!shape) return null;
  if (typeof item.p !== 'string' || item.p.length > 512 || !item.p.startsWith('/') || /[?#\s]/.test(item.p) || item.p.startsWith('/__timbrr')) return null;
  if (item.g !== undefined && !isId(item.g)) return null;
  for (const [key, value] of Object.entries(item)) {
   if (key === 'e' || key === 'p' || key === 'g') continue;
   if (!shape[key]?.(value)) return null;
  }
  if (REQUIRED[item.e].some((key) => item[key] === undefined)) return null;
 }
 return list;
}

// ── What is written ──
export const deviceOf = (width) => (!width ? '' : width < 768 ? 'phone' : width < 1024 ? 'tablet' : 'desktop');
export const widthBand = (width) => (!width ? '' : width < 480 ? '<480' : width < 768 ? '480-767' : width < 1024 ? '768-1023' : width < 1440 ? '1024-1439' : '1440+');

// The browser and operating system, named from the user agent, which is then
// forgotten. Order matters: Edge and Opera say Chrome, Chrome says Safari.
export function describeAgent(ua) {
 const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other';
 const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /cros/i.test(ua) ? 'ChromeOS' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other';
 return { browser, os };
}

// One event as an Analytics Engine data point.
export function dataPoint(site, e, { visitor, country, browser, os }) {
 const blobs = { event: e.e, visitor, path: e.p.length > 1 && e.p.endsWith('/') ? e.p.slice(0, -1).toLowerCase() : e.p.toLowerCase(), page: e.g ?? '', block: e.b ?? '', referrer: e.r ?? '', utm_source: e.us ?? '', utm_medium: e.um ?? '', utm_campaign: e.uc ?? '', country, kind: e.k ?? '', dest: e.h ?? '', name: e.n ?? '' };
 if (e.e === 'view' || e.e === 'heat' || e.e === 'click') Object.assign(blobs, { device: deviceOf(e.w), width: widthBand(e.w) });
 if (e.e === 'view') Object.assign(blobs, { browser, os });
 const doubles = { seconds: e.s ?? 0, depth: e.d ?? 0, x: e.x ?? 0, y: e.y ?? 0, button: e.i ?? 0 };
 return { indexes: [site], blobs: BLOBS.map((name) => blobs[name] ?? ''), doubles: DOUBLES.map((name) => doubles[name]) };
}

// What the route reads off a request, as plain data (so it runs as it is in
// the studio's checks): a dev or staging address (the preview middleware set
// context.timbrrPreview), or the studio's draft cookie, is not a visitor.
//   headers    the request's, lowercase names (h3's getHeaders);  context: event.context
//   previewCookie  the draft cookie's name;  fallbackIp: where the IP comes from when Cloudflare didn't say
export function hitInput({ headers = {}, context = {}, previewCookie, fallbackIp = '' }) {
 const draft = String(headers.cookie ?? '').split(';').some((part) => part.trim().startsWith(`${previewCookie}=`) && part.trim().length > previewCookie.length + 1);
 return { preview: Boolean(context.timbrrPreview), draft, headers, cf: context.cloudflare?.request?.cf, ip: headers['cf-connecting-ip'] ?? fallbackIp };
}

// The whole route: what was read off the request in, how many events were
// written out ({ status, written }). Always 204 for a request that is
// well-formed or isn't counted, so nothing says why; 400 for one that isn't
// well-formed. No binding is a 204 and nothing else: a site Worker deployed
// before analytics, or one whose config lacks it, never errors.
//   binding    the Analytics Engine dataset (env.TIMBRR_HITS), if any
//   site       the site's slug (only to know there is one); preview, draft: this is a dev address, or the draft cookie came along
//   headers    the request's, lowercase names; cf: request.cf; ip: the visitor's address
//   body       the text posted;   getSalt: () => today's salt or null
//   getConfig  () => the studio's { on, events, id } for this site, or null: only
//              events the owner picked are written, and nothing when it's off
//              (or when there is no getConfig, or the studio is too old to say,
//              or sends no id: the id is index1 and part of the visitor hash)
export async function handleHit({ binding, site, preview = false, draft = false, headers = {}, cf, ip, body, getSalt, getConfig }) {
 if (typeof binding?.writeDataPoint !== 'function') return { status: 204, written: 0 };
 if (notCounted({ preview, site, headers, draft, cf })) return { status: 204, written: 0 };
 const events = validateHit(body);
 if (!events) return { status: 400, written: 0 };
 if (!ip) return { status: 204, written: 0 };
 const config = await getConfig?.();
 const picked = config?.on === true && typeof config.id === 'string' && config.id && Array.isArray(config.events) ? events.filter((e) => config.events.includes(e.e)) : [];
 if (!picked.length) return { status: 204, written: 0 };
 const salt = await getSalt();
 if (!salt) return { status: 204, written: 0 };
 const who = { visitor: await visitorHash(salt, config.id, ip, headers['user-agent']), country: String(cf?.country ?? headers['cf-ipcountry'] ?? '').slice(0, 2), ...describeAgent(headers['user-agent']) };
 for (const e of picked) binding.writeDataPoint(dataPoint(config.id, e, who));
 return { status: 204, written: picked.length };
}
