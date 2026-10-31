// A published page, the way the site serves it (docs/README.md § Serving
// pages): the page at an address, from the site's own /__timbrr/page; its
// head tags (title, description, canonical address, share previews); and
// the site's brand color, set the way the studio's canvas sets it, so the
// page is exactly what the builder showed. Await it in a page's setup:
//
//   const { site, page, blocks, style } = await useTimbrrPage();
//
// The address is the route's own unless one is given (a site's own
// pages/index.vue could draw the published home page with '/'). No
// published page there is a 404, and the studio not answering a 502: both
// are thrown as fatal errors, so Nuxt shows error.vue on the server and in
// the browser alike.

const HEX = /^#[0-9a-f]{6}$/i;
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const LOCAL = /^(?:localhost|127\.0\.0\.1|\[::1\])$/;

export async function useTimbrrPage(path) {
 const route = useRoute();
 const address = computed(() => toValue(path) ?? route.path);
 // /__timbrr/ is the studio's (the canvas, the manifest, the page reads),
 // never a page. Asking for one there could only ever loop back here.
 if (address.value.startsWith('/__timbrr/')) throw pageError(true, address.value);
 const here = useRequestURL();
 // No second try: a 502 means the site's server already gave the studio
 // its chance (and its 8 seconds).
 const fetched = useFetch('/__timbrr/page', { query: { path: address }, retry: false });

 // The site as its header and footer draw it: { name, domain, nav, accent,
 // frame, details, overHero }. `frame` is the page's header and footer from
 // the Library (docs/README.md § Header and footer), null from an older
 // studio; `details` the business's phone, address and hours, null from one;
 // `overHero` whether the page opens on a full-bleed hero, the one thing a
 // see-through header can sit over.
 const page = computed(() => fetched.data.value?.page ?? {});
 const blocks = computed(() => (Array.isArray(page.value.blocks) ? page.value.blocks : []));
 const site = computed(() => {
  const value = fetched.data.value?.site ?? {};
  const frame = page.value.frame;
  return {
   name: text(value.name),
   domain: text(value.domain),
   accent: text(value.accent),
   nav: Array.isArray(value.nav) ? value.nav : [],
   frame: frame && typeof frame === 'object' ? frame : null,
   details: value.details && typeof value.details === 'object' ? value.details : null,
   overHero: isHeroBleed(blocks.value[0]),
  };
 });
 // Every block reads the site from here, on a live page as on the canvas.
 provide(TIMBRR_SITE_KEY, site);

 // The brand color, exactly as the canvas applies the studio's theme.
 const style = computed(() => (HEX.test(site.value.accent) ? { '--site-accent': site.value.accent, '--site-accent-ink': inkOn(site.value.accent) } : {}));

 // Where the site lives: https://<its domain>, or this host until it has one.
 const origin = computed(() => {
  if (DOMAIN.test(site.value.domain)) return `https://${site.value.domain.toLowerCase()}`;
  return LOCAL.test(here.hostname) ? here.origin : `https://${here.host}`;
 });

 // Head tags. The page's own settings (meta) win; the title falls back to
 // "<page> · <site>" (Home: the site's name), share previews fall back to
 // the search settings and the title, and addresses are made absolute.
 const head = computed(() => {
  if (typeof page.value.path !== 'string') return {};
  const meta = page.value.meta ?? {};
  const seo = meta.seo ?? {};
  const social = meta.social ?? {};
  const fallback = page.value.path === '/' ? site.value.name : [text(page.value.title), site.value.name].filter(Boolean).join(' · ');
  const title = text(seo.title) || fallback || text(page.value.title);
  const description = text(seo.description) || undefined;
  const canonical = /^https:\/\//i.test(text(meta.canonical)) ? meta.canonical : origin.value + page.value.path;
  const image = absolute(text(social.image), origin.value);
  return {
   title,
   description,
   canonical,
   robots: seo.noindex === true ? 'noindex' : undefined,
   shareTitle: text(social.title) || title,
   shareDescription: text(social.description) || description,
   image,
  };
 });

 useHead({
  htmlAttrs: { lang: 'en' },
  link: () => (head.value.canonical ? [{ rel: 'canonical', href: head.value.canonical }] : []),
 });
 useSeoMeta({
  title: () => head.value.title,
  description: () => head.value.description,
  robots: () => head.value.robots,
  ogType: () => (head.value.title ? 'website' : undefined),
  ogSiteName: () => site.value.name || undefined,
  ogUrl: () => head.value.canonical,
  ogTitle: () => head.value.shareTitle,
  ogDescription: () => head.value.shareDescription,
  ogImage: () => head.value.image,
  twitterCard: () => (head.value.title ? (head.value.image ? 'summary_large_image' : 'summary') : undefined),
  twitterTitle: () => head.value.shareTitle,
  twitterDescription: () => head.value.shareDescription,
  twitterImage: () => head.value.image,
 });

 await fetched;
 // A dev or staging address whose access ran out while it was open: going
 // back through the server lands on the studio's gate.
 if (import.meta.client && fetched.error.value?.statusCode === 401) {
  window.location.reload();
  return new Promise(() => {});
 }
 if (fetched.error.value || !fetched.data.value?.page) throw pageError(fetched.error.value?.statusCode === 404, address.value);
 return { site, page, blocks, style };
}

// The error page (error.vue) for an address: nothing published there (404)
// or the studio failing (502). Fatal only in the browser, which is what
// shows it after a move between pages; the server shows it for any error,
// and would log a fatal one with its stack, which a mistyped address
// doesn't need. The studio failing is logged by the site's server
// (server/utils/studio.js).
function pageError(missing, address) {
 return createError({
  statusCode: missing ? 404 : 502,
  statusMessage: missing ? 'Page Not Found' : 'Bad Gateway',
  message: missing ? `Nothing is published at ${address}.` : `Couldn't get ${address} from the studio.`,
  fatal: import.meta.client,
 });
}

function text(value) {
 return typeof value === 'string' ? value.trim() : '';
}

// A page that opens on a full-bleed hero, the only thing a see-through
// header can sit over. The canvas asks the same.
export function isHeroBleed(block) {
 return block?.type === 'hero' && block.data?.layout === 'bleed';
}

// A share image's full address: an https one as it is, a path on the site
// on the site's address. Anything else isn't shown.
function absolute(src, origin) {
 if (/^https:\/\//i.test(src)) return src;
 return /^\/(?!\/)/.test(src) ? origin + src : undefined;
}
