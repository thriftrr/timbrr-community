// What Google and other search engines read about the business: schema.org
// structured data (JSON-LD) built from Site details, the brand and the page.
// The studio says which kind of business it is (`site.listing.type`, from the
// site's business type); without that it's a LocalBusiness when there's an
// address, a phone or hours, else an Organization. Pure, so it can be tested
// without a build: scripts/check-listing.mjs. (Nuxt auto-imports app/utils.)
//
// Never raw HTML: jsonLdText escapes every character that could end the
// <script> it sits in, so no text typed into the studio can (docs/blocks.md,
// "No raw HTML" in the studio's repo).
import { socialLinks } from '../../schema/frames.js';
import { isSpecialHours, siteToday } from './hours.js';

const TYPE = /^[A-Z][A-Za-z]{1,40}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY = /^[A-Z]{2}$/;
const PRICE = /^\${1,4}$/;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// A picture's full address: https as it is, a path on the site's address.
function absolute(src, origin) {
 const value = text(src);
 if (/^https:\/\//i.test(value)) return value;
 return /^\/(?!\/)/.test(value) ? origin + value : undefined;
}

// Which schema.org type the business is.
export function listingType(site) {
 const given = text(site?.listing?.type);
 if (TYPE.test(given)) return given;
 const details = site?.details ?? {};
 const local = text(details.street) || text(details.city) || text(details.phone) || (Array.isArray(details.hours) && details.hours.length === 7);
 return local ? 'LocalBusiness' : 'Organization';
}

// The week as openingHoursSpecification: days with the same hours share one.
// A day open around the clock is 00:00 to 23:59. Empty when not seven good rows.
export function openingHours(hours) {
 if (!Array.isArray(hours) || hours.length !== 7) return [];
 const groups = new Map();
 for (const [index, row] of hours.entries()) {
  if (row?.closed === true) continue;
  if (!TIME.test(String(row?.open)) || !TIME.test(String(row?.close))) return [];
  const closes = row.open === row.close ? '23:59' : row.close;
  const opens = row.open === row.close ? '00:00' : row.open;
  const key = `${opens}-${closes}`;
  if (!groups.has(key)) groups.set(key, { '@type': 'OpeningHoursSpecification', dayOfWeek: [], opens, closes });
  groups.get(key).dayOfWeek.push(DAY_NAMES[index]);
 }
 return [...groups.values()];
}

// Closed days and special hours that aren't over yet (by `today`, the site's
// date), as specialOpeningHoursSpecification. Closed is 00:00 to 00:00.
export function specialHours(closedDays, today) {
 if (!Array.isArray(closedDays)) return [];
 return closedDays
  .filter((span) => DATE.test(span?.from ?? '') && DATE.test(span?.to ?? '') && span.from <= span.to && (!today || span.to >= today))
  .map((span) => {
   const special = isSpecialHours(span);
   return { '@type': 'OpeningHoursSpecification', validFrom: span.from, validThrough: span.to, opens: special ? span.open : '00:00', closes: special ? span.close : '00:00' };
  });
}

// The business itself, or null without a name.
export function businessNode({ site, origin, image, legacySocial = [], now = new Date() }) {
 const name = text(site?.name);
 if (!name) return null;
 const details = site?.details ?? {};
 const type = listingType(site);
 const node = { '@context': 'https://schema.org', '@type': type, '@id': `${origin}/#business`, name, url: `${origin}/` };
 const logo = absolute(site?.brand?.logo?.src, origin);
 if (logo) node.logo = logo;
 const picture = image || logo;
 if (picture) node.image = picture;
 if (text(details.phone)) node.telephone = text(details.phone);
 if (text(details.email)) node.email = text(details.email);
 const address = {
  streetAddress: text(details.street),
  addressLocality: text(details.city),
  addressRegion: text(details.region),
  postalCode: text(details.postal),
  addressCountry: COUNTRY.test(text(details.country)) ? text(details.country) : '',
 };
 if (address.streetAddress || address.addressLocality) node.address = { '@type': 'PostalAddress', ...Object.fromEntries(Object.entries(address).filter(([, value]) => value)) };
 const sameAs = socialLinks(details, legacySocial).map((row) => row.href).filter((href) => /^https:\/\//i.test(href));
 if (sameAs.length) node.sameAs = sameAs;
 // Opening hours and a price range belong to a place you can go, not an Organization.
 if (type !== 'Organization') {
  const week = openingHours(details.hours);
  if (week.length) node.openingHoursSpecification = week;
  const special = specialHours(details.closedDays, siteToday(details.timezone, now));
  if (special.length) node.specialOpeningHoursSpecification = special;
  if (PRICE.test(text(details.priceRange))) node.priceRange = text(details.priceRange);
 }
 return node;
}

// Everything a page says: on the home page the business and the WebSite; on
// a page with a Visit block the business; elsewhere a BreadcrumbList (Home,
// the menu item the page sits under if there is one, then the page).
export function listingGraph({ site, path, title, origin, image, blocks = [], legacySocial = [], now = new Date() }) {
 if (typeof path !== 'string' || !origin) return [];
 const out = [];
 const name = text(site?.name);
 const home = path === '/';
 const visit = Array.isArray(blocks) && blocks.some((block) => block?.type === 'visit');
 if (home || visit) {
  const business = businessNode({ site, origin, image, legacySocial, now });
  if (business) out.push(business);
 }
 if (home && name) out.push({ '@context': 'https://schema.org', '@type': 'WebSite', name, url: `${origin}/` });
 if (!home) {
  const items = [{ name: name || 'Home', item: `${origin}/` }];
  const parent = (Array.isArray(site?.nav) ? site.nav : []).find((entry) => typeof entry?.to === 'string' && entry.to !== '/' && path.startsWith(`${entry.to}/`));
  if (parent && text(parent.label)) items.push({ name: text(parent.label), item: origin + parent.to });
  items.push({ name: text(title) || path, item: origin + path });
  out.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, ...entry })) });
 }
 return out;
}

// JSON for inside a <script>: <, >, & and the two line separators become
// \u escapes, so the text can never close the script or open a comment.
export function jsonLdText(value) {
 return JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
}
