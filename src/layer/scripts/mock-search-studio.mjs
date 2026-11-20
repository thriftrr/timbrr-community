// A stand-in studio for trying site search on this computer before the
// studio's search API is live: the three public reads the site asks for
// (epoch, page, search), for one site, `demo`, with search on. The search
// answers in the studio's new shape (docs/search.md, "Public API") from a
// handful of made-up hits. Development only: nothing in the layer imports it.
//   node layer/scripts/mock-search-studio.mjs            (port 4999; OPENS=page for the link mode)
//   cd starter && NUXT_TIMBRR_API=http://localhost:4999 NUXT_PUBLIC_SITE=demo npx nuxt dev --port 3011
// "zzz" finds nothing, "bouldr" offers "Did you mean bouldering", "down" is the studio failing.
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 4999);
const img = (seed) => ({ src: `https://picsum.photos/seed/${seed}/240/180`, alt: '' });
const HITS = [
 { kind: 'page', kindName: 'Page', title: 'Bouldering', path: '/bouldering', summary: 'Over 200 boulder problems, reset every week.', image: img('wall') },
 { kind: 'page', kindName: 'Page', title: 'Day pass prices', path: '/prices', summary: 'A day pass, a 10-visit punch card or a membership. Gear rental included.' },
 { kind: 'page', kindName: 'Page', title: 'Hours', path: '/hours', summary: 'Open every day from 6 am. Holiday hours are posted a week ahead.' },
 { kind: 'page', kindName: 'Page', title: 'Kids climbing', path: '/kids', summary: 'Climbing team, birthday parties and after-school boulder club.', image: img('kids') },
 { kind: 'classes', kindName: 'Class', title: 'Intro to bouldering', path: '/classes/intro', summary: 'Your first hour on the wall: falling, footwork and reading a problem.', date: '2026-11-24T18:00:00Z', values: { level: ['beginner'] } },
 { kind: 'classes', kindName: 'Class', title: 'Bouldering technique', path: '/classes/technique', summary: 'Heel hooks, drop knees and flagging for climbers who boulder V2 and up.', date: '2026-11-26T18:00:00Z', values: { level: ['intermediate'] } },
 { kind: 'classes', kindName: 'Class', title: 'Lead climbing', path: '/classes/lead', summary: 'Clip, fall and belay on lead. Bring your own harness.', date: '2026-12-02T18:00:00Z', values: { level: ['advanced'] } },
 { kind: 'classes', kindName: 'Class', title: 'Youth boulder club', path: '/classes/youth', summary: 'Ages 8 to 14, every Tuesday. Shoes and chalk included.', date: '2026-12-03T22:00:00Z', values: { level: ['beginner'] } },
 { kind: 'events', kindName: 'Event', title: 'Boulder bash comp', path: '/events/bash', summary: 'Our winter bouldering competition, with a kids category.', image: img('comp'), date: '2026-12-13T16:00:00Z' },
 { kind: 'events', kindName: 'Event', title: 'Film night: The Dawn Wall', path: '/events/film', summary: 'Popcorn, a big screen and a climbing film.', date: '2026-12-05T01:00:00Z' },
].map((hit, at) => ({ id: `h${at}`, values: {}, image: null, date: null, ...hit }));
const LEVELS = ['beginner', 'intermediate', 'advanced'];

// Each word matched from its start, in the title or the summary.
const starts = (text, word) => new RegExp(`\\b${word.replace(/[^a-z0-9]/g, '')}`, 'i').test(text);
function parts(text, words) {
 const re = new RegExp(`\\b(${words.map((word) => word.replace(/[^a-z0-9]/g, '')).filter(Boolean).join('|')})`, 'gi');
 const out = [];
 let last = 0;
 for (const match of text.matchAll(re)) {
  if (match.index > last) out.push({ text: text.slice(last, match.index) });
  out.push({ text: match[0], hit: true });
  last = match.index + match[0].length;
 }
 if (last < text.length) out.push({ text: text.slice(last) });
 return out;
}
function distance(a, b) {
 const row = Array.from({ length: b.length + 1 }, (_, i) => i);
 for (let i = 1; i <= a.length; i++) {
  let prev = row[0]++;
  for (let j = 1; j <= b.length; j++) [prev, row[j]] = [row[j], Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))];
 }
 return row[b.length];
}
const VOCAB = [...new Set(HITS.flatMap((hit) => `${hit.title} ${hit.summary}`.toLowerCase().match(/[a-z]{3,}/g)))];

function search(params) {
 const q = params.get('q') ?? '';
 const words = q.split(' ').filter(Boolean);
 const all = HITS.filter((hit) => words.every((word) => starts(`${hit.title} ${hit.summary}`, word)));
 const partial = !all.length;
 const matched = (partial ? HITS.filter((hit) => words.some((word) => starts(`${hit.title} ${hit.summary}`, word))) : all).slice(0, 50);
 const kinds = params.getAll('kind');
 const levels = params.getAll('level');
 let shown = matched.filter((hit) => (!kinds.length || kinds.includes(hit.kind)) && (!levels.length || hit.values.level?.some((level) => levels.includes(level))));
 if (params.get('sort') === 'newest') shown = [...shown].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
 const per = Number(params.get('per') ?? 20);
 const page = Number(params.get('page') ?? 1);
 const facets = { kind: {}, level: Object.fromEntries(LEVELS.map((level) => [level, 0])) };
 for (const hit of matched) facets.kind[hit.kind] = (facets.kind[hit.kind] ?? 0) + 1;
 for (const hit of matched.filter((one) => !kinds.length || kinds.includes(one.kind))) for (const level of hit.values.level ?? []) facets.level[level]++;
 const didYouMean = matched.length ? null : (words.map((word) => VOCAB.filter((known) => known[0] === word[0] && Math.abs(known.length - word.length) <= 2 && distance(known, word) <= 2)[0] ?? word).join(' ') || null);
 return {
  site: { slug: 'demo' },
  query: q,
  total: shown.length,
  page,
  pages: Math.max(1, Math.ceil(shown.length / per)),
  didYouMean: didYouMean === q ? null : didYouMean,
  partial: partial && matched.length > 0,
  hits: shown.slice((page - 1) * per, page * per).map((hit) => ({ ...hit, titleParts: parts(hit.title, words), snippet: parts(hit.summary, words), why: [] })),
  facets: params.get('facets') === 'false' ? {} : facets,
  kinds: { classes: 'Classes', events: 'Events' },
 };
}

const site = {
 slug: 'demo',
 name: 'North Wall',
 domain: '',
 accent: '#c2410c',
 brand: {},
 nav: [
  { label: 'Bouldering', to: '/bouldering' },
  { label: 'Classes', to: '/classes' },
  { label: 'Prices', to: '/prices' },
  { label: 'Hours', to: '/hours' },
 ],
 details: { phone: '(815) 555-0134', email: 'hello@northwall.test' },
 search: { on: process.env.SEARCH !== 'off', opens: process.env.OPENS === 'page' ? 'page' : 'popup', suggestions: ['Day pass prices', 'Hours', 'Kids classes'] },
};
const page = (path) => ({
 id: `p${path}`,
 title: path === '/' ? 'Home' : path.slice(1),
 path,
 blocks: [{ id: 'b1', type: 'hero', data: { headline: path === '/' ? 'Climb more. Every day.' : `The ${path.slice(1)} page`, tagline: 'North Wall' } }],
 frame: { header: { icons: { search: { on: true, to: '' } } }, footer: null },
 forms: {},
 meta: {},
});

createServer((req, res) => {
 const url = new URL(req.url, 'http://x');
 const send = (status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
 };
 const route = url.pathname.replace(/^\/api\/public\/sites\/demo\//, '');
 if (route === 'epoch') return send(200, { epoch: 1 });
 if (route === 'page') return send(200, { site, page: page(url.searchParams.get('path') ?? '/') });
 if (route === 'search') {
  if (url.searchParams.get('q') === 'down') return send(500, { statusCode: 500 });
  return send(200, url.searchParams.get('v') === '1' ? { site: { slug: 'demo' }, q: url.searchParams.get('q'), results: [], total: 0, page: 1, pages: 1 } : search(url.searchParams));
 }
 send(404, { statusCode: 404 });
}).listen(PORT, () => console.log(`mock studio on http://localhost:${PORT} (search ${site.search.on ? `on, ${site.search.opens}` : 'off'})`));
