// Helpers more than one block uses. (Nuxt auto-imports app/utils.)

// The number to dial: its digits (and a leading +), less any extension. A
// number with words in it (1-800-FLOWERS, "or text us") isn't dialled at
// all, rather than dial the wrong number.
export function telHref(phone) {
 const number = String(phone ?? '').replace(/\s*(?:ext\.?|extension|x)\s*\d+\s*$/i, '');
 if (/[a-z]/i.test(number)) return undefined;
 const digits = number.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
 return /\d{3}/.test(digits) ? safeHref(`tel:${digits}`) : undefined;
}

export function mailHref(email) {
 const address = String(email ?? '').trim();
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? safeHref(`mailto:${address}`) : undefined;
}

// Rows under their headings, in the order each heading first turns up, each
// row keeping its place in the list, which is what its fields are named by.
// Rows with no heading come first. [{ name, rows: [{ row, index }] }].
export function groupRows(rows, key) {
 const groups = new Map();
 rows.forEach((row, index) => {
  const name = String(row[key] ?? '').trim();
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push({ row, index });
 });
 const named = [...groups.entries()].map(([name, list]) => ({ name, rows: list }));
 return named.sort((a, b) => Number(Boolean(a.name)) - Number(Boolean(b.name)));
}

// A link to a video, as the address of its player: YouTube's (the no-cookie
// one) or Vimeo's. Built from the id alone, so nothing typed into a page
// reaches an iframe's address. Any other link has no player, and comes back
// undefined.
const YOUTUBE_ID = /^[\w-]{6,20}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function embedSrc(link) {
 let url;
 try {
  url = new URL(String(link ?? '').trim());
 } catch {
  return undefined;
 }
 if (url.protocol !== 'https:') return undefined;
 const host = url.hostname.replace(/^(www|m)\./, '');
 const [first, second] = url.pathname.split('/').filter(Boolean);
 if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
  const id = host === 'youtu.be' ? first : first === 'watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(first) ? second : null;
  return YOUTUBE_ID.test(id ?? '') ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
 }
 if (host === 'vimeo.com' || host === 'player.vimeo.com') {
  const id = first === 'video' ? second : first;
  return VIMEO_ID.test(id ?? '') ? `https://player.vimeo.com/video/${id}` : undefined;
 }
 return undefined;
}

// Where a network keeps its profiles, for a handle typed on its own.
const PROFILES = [
 [/\binstagram\b/i, (name) => `https://www.instagram.com/${name}/`],
 [/\bfacebook\b/i, (name) => `https://www.facebook.com/${name}`],
 [/\btiktok\b/i, (name) => `https://www.tiktok.com/@${name}`],
 [/\byoutube\b/i, (name) => `https://www.youtube.com/@${name}`],
 [/^x\b|\btwitter\b/i, (name) => `https://x.com/${name}`],
];

// The account a handle names: "@yourshop", "/yourshop", "yourshop", or the
// profile's own address.
const HANDLE = /^(?:(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/)?[@/]?(\w[\w.-]{0,59})\/?$/i;

// A { title, body, to } row's link: its own, when it has one; else the
// profile its handle names on one of the networks above; else a full address
// typed as the handle. Otherwise the row is plain text.
export function profileHref(item) {
 const own = safeHref(item.to);
 if (own) return own;
 const handle = String(item.body ?? '').trim();
 const build = PROFILES.find(([network]) => network.test(String(item.title ?? '').trim()))?.[1];
 const name = HANDLE.exec(handle)?.[1];
 if (build && name) return safeHref(build(name));
 return /^https:\/\//i.test(handle) ? safeHref(handle) : undefined;
}
