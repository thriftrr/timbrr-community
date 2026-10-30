// Small helpers the blocks and the canvas share. (Nuxt auto-imports app/utils.)

// A value at a dotted path: 'items.0.title'.
export function valueAt(data, path) {
 return String(path)
  .split('.')
  .reduce((value, key) => (value == null ? undefined : value[key]), data);
}

// Only links a visitor can safely follow: the web, mail, phone, this site.
export function safeHref(href) {
 const value = String(href ?? '').trim();
 return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) ? value : undefined;
}

// Images from the web or this site; anything else isn't shown. A local
// studio serves its library over plain http on localhost, so development
// addresses of that one shape pass too: nothing on the web resolves there.
export function safeSrc(src) {
 const value = String(src ?? '').trim();
 return /^(https:\/\/|\/(?!\/)|http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?\/)/i.test(value) ? value : undefined;
}

// Paper or near-black text on a brand color, by luminance.
export function inkOn(hex) {
 const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
 if (!match) return '#f7f5ec';
 const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
 const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
 return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.45 ? '#1f2a22' : '#f7f5ec';
}

// The srcset for a photo from the studio's media library. Its address is
// `<origin>/<id>/<version>/master.webp`, and beside the master the library
// keeps a WebP at each of these widths that's narrower than it, named
// w480.webp and so on; the master itself is the widest candidate. This is
// a copy of mediaSrcset in the studio's shared/utils/media.js (with its
// MEDIA_WIDTHS and MEDIA_PATH), since the layer can't import the studio:
// keep the two in step. `width` is the master's, from the image field;
// without it nothing can be said about which variants exist.
const MEDIA_WIDTHS = [480, 960, 1600];
const MEDIA_MASTER = /(?:^|\/)[A-Za-z0-9_-]{16}\/[0-9a-f]{8}\/master\.webp$/;

export function mediaSrcset(src, width) {
 const address = String(src ?? '').split(/[?#]/)[0];
 if (!MEDIA_MASTER.test(address) || !(width > 0)) return '';
 const base = address.slice(0, address.length - 'master.webp'.length);
 const entries = MEDIA_WIDTHS.filter((w) => w < width).map((w) => `${base}w${w}.webp ${w}w`);
 entries.push(`${address} ${Math.round(width)}w`);
 return entries.join(', ');
}
