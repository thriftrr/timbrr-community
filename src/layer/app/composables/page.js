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
// A BCP 47 tag, as the studio's Settings stores it (sites.seo.language): <html lang>, WCAG 3.1.1.
const LANGUAGE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const LOCAL = /^(?:localhost|127\.0\.0\.1|\[::1\])$/;

export async function useTimbrrPage(path) {
 const route = useRoute();
 const address = computed(() => toValue(path) ?? route.path);
 // /__timbrr/ is the studio's (the canvas, the manifest, the page reads),
 // never a page. Asking for one there could only ever loop back here.
 if (address.value.startsWith('/__timbrr/')) throw pageError(true, address.value);
 const here = useRequestURL();
 const nuxtApp = useNuxtApp(); // navigateTo after an await needs the app it started in
 const forms = useTimbrrForms();
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
   brand: normalizeBrand(value.brand),
   overHero: isHeroBleed(blocks.value[0]),
   language: LANGUAGE.test(value.language ?? '') ? value.language : 'en',
  };
 });
 // On a dev or staging address (the note the server writes says it is one),
 // the page follows its draft: every two seconds, while the tab is showing,
 // it asks whether the draft changed and reads it again only if so. The
 // studio saves a moment after each change, so this is what "live" means.
 // It stops once the visitor's access has gone, or after a run of failures.
 const LIVE_MS = 2000;
 const LIVE_GIVE_UP = 15;
 onMounted(() => {
  const when = document.getElementById('timbrr-preview-when');
  if (!when) return;
  let stamp = null;
  let misses = 0;
  let busy = false;
  const said = () => (when.textContent = ` · updated ${new Date().toLocaleTimeString()}`);
  const missed = (status) => {
   if (status === 401 || ++misses >= LIVE_GIVE_UP) clearInterval(timer);
  };
  // A failed read empties the page (Nuxt sets its data back to the default),
  // so the copy on screen is put back and the stamp isn't taken: the next
  // tick tries again. Access gone: the reload lands on the studio's gate.
  const reread = async () => {
   const before = fetched.data.value;
   await fetched.refresh();
   const status = fetched.error.value ? (fetched.error.value.statusCode ?? 0) : null;
   if (status === null) return true;
   fetched.data.value = before;
   fetched.error.value = undefined;
   fetched.status.value = 'success';
   missed(status);
   if (status === 401) window.location.reload();
   return false;
  };
  const check = async () => {
   if (document.hidden || busy) return;
   busy = true;
   try {
    const answer = await $fetch('/__timbrr/stamp', { query: { path: address.value }, retry: false }).catch((error) => ({ failed: error?.statusCode ?? error?.response?.status ?? 0 }));
    if (answer.failed !== undefined) return missed(answer.failed);
    // The first answer isn't known to match what was read (a save can land
    // while the page loads, or while the tab is hidden), so it's read once
    // more; after that, only when the stamp moves.
    if (answer.stamp !== stamp) {
     if (!(await reread())) return;
     if (stamp !== null) said();
    }
    misses = 0;
    stamp = answer.stamp;
   } finally {
    busy = false;
   }
  };
  const timer = setInterval(check, LIVE_MS);
  // Back on this tab: don't wait for the next tick.
  const onShow = () => !document.hidden && check();
  document.addEventListener('visibilitychange', onShow);
  onBeforeUnmount(() => {
   clearInterval(timer);
   document.removeEventListener('visibilitychange', onShow);
  });
 });

 // Every block reads the site from here, on a live page as on the canvas.
 provide(TIMBRR_SITE_KEY, site);

 // The brand color, exactly as the canvas applies the studio's theme.
 // The brand (utils/brand.js) sets the rest of the --site-* variables. They
 // go on :root too, so the page's own background and type follow.
 const style = computed(() => brandStyle(site.value.accent, site.value.brand));
 useBrandHead(style, () => site.value.brand);

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
  htmlAttrs: { lang: () => site.value.language },
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

 // The forms the page shows, for the blocks and footer that name one. This has
 // to be set up before the await: a watcher made after it belongs to no
 // component, outlives the page, and would empty the next page's forms when this
 // page's data is cleared.
 watch(page, (value) => (forms.value = value.forms ?? {}));
 await fetched;
 forms.value = page.value.forms ?? {};
 // A dev or staging address whose access ran out while it was open: going
 // back through the server lands on the studio's gate.
 if (import.meta.client && fetched.error.value?.statusCode === 401) {
  window.location.reload();
  return new Promise(() => {});
 }
 // An old address of an entry's: the studio says where it lives now (a
 // 301 on the server, a plain move in the browser). Only a path on this
 // site is followed; anything else is the 404 it came with.
 const moved = fetched.error.value?.statusCode === 404 ? fetched.error.value.data?.data?.redirect?.to : null;
 if (sitePath(moved) && moved !== address.value) {
  await nuxtApp.runWithContext(() => navigateTo(moved, { redirectCode: 301, replace: true }));
  // The browser waits for the move; the server's answer is the 301 itself, whatever renders.
  if (import.meta.client) return new Promise(() => {});
  return { site, page, blocks, style };
 }
 if (fetched.error.value || !fetched.data.value?.page) throw pageError(fetched.error.value?.statusCode === 404, address.value);
 return { site, page, blocks, style };
}

// A path on this site, never another site's address or a protocol.
const sitePath = (value) => typeof value === 'string' && /^\/(?![/\\])[a-z0-9/_-]*$/i.test(value) && value.length <= 500;

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
// Blocks that fill the top of the page edge to edge with a picture or a
// video, so a see-through header can sit over them: a Hero set to full
// bleed, and North Wall's video hero in any of its layouts.
const ALWAYS_BLEEDS = new Set(['northwall_video_hero']);
export function isHeroBleed(block) {
 return (block?.type === 'hero' && block.data?.layout === 'bleed') || ALWAYS_BLEEDS.has(block?.type);
}

// A share image's full address: an https one as it is, a path on the site
// on the site's address. Anything else isn't shown.
function absolute(src, origin) {
 if (/^https:\/\//i.test(src)) return src;
 return /^\/(?!\/)/.test(src) ? origin + src : undefined;
}

// The brand color and the brand's variables, as one style object: what the
// page root (and the canvas) set. The text on the brand color is worked out
// for contrast unless the brand sets it.
export function brandStyle(accent, brand) {
 const vars = brandVars(brand);
 if (HEX.test(accent ?? '')) {
  // The brand color is also link and label text on the page and its bands,
  // and a button's fill under paper ink, so on a light page it's darkened
  // until it reads 4.5:1 against the darkest of those, whatever the owner
  // picked. Darkening can't help on a dark page, so there it stays as picked.
  const page = vars['--site-bg'] ?? '#ffffff';
  const light = HEX.test(page) && contrastRatio('#000000', page) > contrastRatio('#ffffff', page);
  const darkest = [page, vars['--site-surface'], '#f7f5ec'].filter((c) => HEX.test(c ?? '')).sort((a, b) => contrastRatio('#000000', a) - contrastRatio('#000000', b))[0];
  const safe = light ? nudgeAccent(accent, darkest, 4.5) : accent;
  vars['--site-accent'] = safe;
  vars['--site-accent-ink'] ??= inkOn(safe);
 }
 return vars;
}

// The brand in the page's head: its variables on :root (the body's own
// background and type read them), its fonts, and its icon. Every value has
// passed normalizeBrand, so none can close the rule or add another.
export function useBrandHead(style, brand) {
 useHead({
  style: () => {
   const css = Object.entries(toValue(style))
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
   const faces = brandFontFaces(toValue(brand));
   return [...(css ? [{ key: 'timbrr-brand', innerHTML: `:root{${css}}` }] : []), ...(faces ? [{ key: 'timbrr-brand-faces', innerHTML: faces }] : [])];
  },
  link: () => {
   const value = normalizeBrand(toValue(brand));
   const href = brandFontsHref(value);
   return [
    ...(href ? [{ key: 'timbrr-brand-fonts', rel: 'stylesheet', href }] : []),
    ...(value.favicon ? [{ key: 'timbrr-brand-icon', rel: 'icon', href: value.favicon.src }] : []),
   ];
  },
 });
}
