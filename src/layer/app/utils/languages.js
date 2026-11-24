// Languages (the studio's docs/languages.md): what a page answer's
// `site.languages` and `page.alternates` may hold, checked here because the
// studio's answer reaches the page's head and header. Pure, so
// scripts/check-languages.mjs runs them without Nuxt.

const CODE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const PATH = /^\/(?![/\\])[a-z0-9/_-]*$/i;

// The switcher's languages: [{ code, label, href, current, banner }], or []
// when fewer than two (nothing to switch between).
export function languageList(value) {
 const list = (Array.isArray(value) ? value : [])
  .filter((one) => CODE.test(one?.code ?? '') && PATH.test(one?.href ?? '') && one.href.length <= 500)
  .slice(0, 8)
  .map((one) => ({ code: one.code, label: String(one.label ?? one.code).slice(0, 8), native: String(one.native ?? '').slice(0, 40), href: one.href, current: one.current === true, banner: typeof one.banner === 'string' ? one.banner.slice(0, 160) : '' }));
 return list.length > 1 ? list : [];
}

// hreflang links: every version of the page, and x-default the first (the
// main language). [] for a page in one language only.
export function alternateLinks(value, origin) {
 const list = (Array.isArray(value) ? value : []).filter((one) => CODE.test(one?.lang ?? '') && PATH.test(one?.path ?? ''));
 if (list.length < 2) return [];
 return [...list.map((one) => ({ rel: 'alternate', hreflang: one.lang, href: origin + one.path })), { rel: 'alternate', hreflang: 'x-default', href: origin + list[0].path }];
}

// The first-visit banner: the first of the browser's languages that is a
// live language other than this page's, with a line to say. Its primary
// subtag is enough (es-MX finds es). Null for none. It never redirects.
export function bannerFor(languages, wanted) {
 const current = languages.find((one) => one.current);
 for (const tag of Array.isArray(wanted) ? wanted : []) {
  const lower = String(tag).toLowerCase();
  const found = languages.find((one) => one.code.toLowerCase() === lower) ?? languages.find((one) => one.code.toLowerCase().split('-')[0] === lower.split('-')[0]);
  if (!found) continue;
  return found === current || !found.banner ? null : found;
 }
 return null;
}
