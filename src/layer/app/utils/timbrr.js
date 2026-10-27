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

// Images from the web or this site; anything else isn't shown.
export function safeSrc(src) {
 const value = String(src ?? '').trim();
 return /^(https:\/\/|\/(?!\/))/i.test(value) ? value : undefined;
}

// Paper or near-black text on a brand color, by luminance.
export function inkOn(hex) {
 const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
 if (!match) return '#f7f5ec';
 const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
 const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
 return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.45 ? '#1f2a22' : '#f7f5ec';
}
