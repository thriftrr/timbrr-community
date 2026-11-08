// A site's brand (docs/sites.md, "Branding"): the design tokens its blocks
// read, as data. The studio edits and saves it (sites.brand); the site's code
// turns it into --site-* variables and a font link, the same way on a live
// page as on the canvas. The same file lives in the studio at
// src/app/shared/utils/brand.js: change both together.
//
// Everything is checked on the way in and again on the way out, because the
// values end up inside CSS: colors are #rrggbb, numbers are clamped to their
// range, fonts come from the list below, images are https or site-relative.
// The brand color itself stays sites.accent; it's in BRAND_COLORS for the
// editor, under `accent`.

export const BRAND_COLORS = [
 { key: 'accent', variable: '--site-accent', label: 'Brand', note: 'Buttons, links and highlights.', fallback: '#2f6b4f' },
 { key: 'accentInk', variable: '--site-accent-ink', label: 'Text on brand', note: 'Picked for contrast unless set.', fallback: '' },
 { key: 'heading', variable: '--site-heading', label: 'Headings', note: 'Titles and big numbers.', fallback: '#3b2a1b' },
 { key: 'ink', variable: '--site-ink', label: 'Text', note: 'Strong body text and labels.', fallback: '#4a3a2b' },
 { key: 'body', variable: '--site-body', label: 'Body copy', note: 'Paragraphs.', fallback: '#6b5a48' },
 { key: 'muted', variable: '--site-muted', label: 'Quiet text', note: 'Captions and small print.', fallback: '#9a8b66' },
 { key: 'eyebrow', variable: '--site-eyebrow', label: 'Eyebrow', note: 'The small line over a heading.', fallback: '#8a6d2f' },
 { key: 'bg', variable: '--site-bg', label: 'Page', note: 'The page background.', fallback: '#ffffff' },
 { key: 'surface', variable: '--site-surface', label: 'Soft band', note: 'Soft sections and cards.', fallback: '#fbf8f0' },
 { key: 'border', variable: '--site-border', label: 'Lines', note: 'Borders and dividers.', fallback: '#efe9da' },
 { key: 'dark', variable: '--site-dark', label: 'Dark band', note: 'Dark sections and the footer.', fallback: '#3b2a1b' },
 { key: 'darkInk', variable: '--site-dark-ink', label: 'Text on dark', note: 'Text on dark sections.', fallback: '#f7f5ec' },
];

// Google Fonts families a site can pick, with the weights to ask for: a
// variable font as a range, a static one as a list. `stack` is what follows
// the family if it doesn't load.
export const BRAND_FONTS = [
 { name: 'Bitter', axis: 'wght@100..900', kind: 'serif' },
 { name: 'Fraunces', axis: 'wght@100..900', kind: 'serif' },
 { name: 'Playfair Display', axis: 'wght@400..900', kind: 'serif' },
 { name: 'Lora', axis: 'wght@400..700', kind: 'serif' },
 { name: 'Roboto Slab', axis: 'wght@100..900', kind: 'serif' },
 { name: 'DM Serif Display', axis: 'wght@400', kind: 'serif' },
 { name: 'Public Sans', axis: 'wght@100..900', kind: 'sans' },
 { name: 'Inter', axis: 'wght@100..900', kind: 'sans' },
 { name: 'DM Sans', axis: 'wght@100..1000', kind: 'sans' },
 { name: 'Work Sans', axis: 'wght@100..900', kind: 'sans' },
 { name: 'Source Sans 3', axis: 'wght@200..900', kind: 'sans' },
 { name: 'Nunito Sans', axis: 'wght@200..1000', kind: 'sans' },
 { name: 'Karla', axis: 'wght@200..800', kind: 'sans' },
 { name: 'Manrope', axis: 'wght@200..800', kind: 'sans' },
 { name: 'Outfit', axis: 'wght@100..900', kind: 'sans' },
 { name: 'Montserrat', axis: 'wght@100..900', kind: 'sans' },
 { name: 'Archivo', axis: 'wght@100..900', kind: 'sans' },
 { name: 'Space Grotesk', axis: 'wght@300..700', kind: 'sans' },
 { name: 'Lato', axis: 'wght@400;700;900', kind: 'sans' },
 { name: 'Poppins', axis: 'wght@400;500;600;700;800', kind: 'sans' },
 { name: 'IBM Plex Mono', axis: 'wght@400;500;600', kind: 'mono' },
 { name: 'JetBrains Mono', axis: 'wght@100..800', kind: 'mono' },
 { name: 'DM Mono', axis: 'wght@300;400;500', kind: 'mono' },
 { name: 'Space Mono', axis: 'wght@400;700', kind: 'mono' },
];
const STACKS = { serif: 'Georgia, serif', sans: 'system-ui, sans-serif', mono: 'ui-monospace, monospace' };

export const BRAND_FONT_ROLES = [
 { key: 'display', variable: '--site-font-display', label: 'Headings', fallback: 'Bitter' },
 { key: 'body', variable: '--site-font-body', label: 'Body', fallback: 'Public Sans' },
 { key: 'mono', variable: '--site-font-mono', label: 'Labels', fallback: 'IBM Plex Mono' },
];

// Numbers: the range the editor offers, the step, the default (today's look),
// and how the value becomes CSS.
export const BRAND_NUMBERS = [
 { key: 'textSize', group: 'type', label: 'Body size', min: 14, max: 20, step: 0.5, fallback: 16, unit: 'px', variable: '--site-text-size', css: (v) => `${v}px` },
 { key: 'headingScale', group: 'type', label: 'Heading size', min: 0.8, max: 1.4, step: 0.05, fallback: 1, unit: '×', variable: '--site-heading-scale', css: (v) => String(v) },
 { key: 'headingWeight', group: 'type', label: 'Heading weight', min: 400, max: 900, step: 100, fallback: 800, unit: '', variable: '--site-heading-weight', css: (v) => String(v) },
 { key: 'headingTracking', group: 'type', label: 'Heading letter spacing', min: -0.04, max: 0.04, step: 0.005, fallback: -0.01, unit: 'em', variable: '--site-heading-tracking', css: (v) => `${v}em` },
 { key: 'radius', group: 'shape', label: 'Corners', min: 0, max: 32, step: 1, fallback: 12, unit: 'px', variable: '--site-radius', css: (v) => `${v}px` },
 { key: 'controlRadius', group: 'shape', label: 'Button corners', min: 0, max: 30, step: 1, fallback: 9, unit: 'px', variable: '--site-control-radius', css: (v) => (v >= 30 ? '999px' : `${v}px`) },
 { key: 'max', group: 'layout', label: 'Page width', min: 880, max: 1400, step: 20, fallback: 1080, unit: 'px', variable: '--site-max', css: (v) => `${v}px` },
 { key: 'space', group: 'layout', label: 'Section spacing', min: 0.6, max: 1.5, step: 0.05, fallback: 1, unit: '×', variable: '--site-space-scale', css: (v) => String(v) },
];

export const BRAND_SHADOWS = [
 { key: 'none', label: 'None', css: 'none' },
 { key: 'soft', label: 'Soft', css: '0 6px 16px color-mix(in srgb, var(--site-heading) 10%, transparent)' },
 { key: 'strong', label: 'Strong', css: '0 14px 32px color-mix(in srgb, var(--site-heading) 18%, transparent)' },
];

const HEX = /^#[0-9a-f]{6}$/;
const SRC = /^(?:https:\/\/[^\s"'()<>\\]{1,1990}|\/[^\s"'()<>\\]{0,1990})$/;
const ALT_MAX = 300;

function number(value, spec) {
 const n = Number(value);
 if (!Number.isFinite(n)) return undefined;
 const clamped = Math.min(spec.max, Math.max(spec.min, n));
 return Number((Math.round(clamped / spec.step) * spec.step).toFixed(4));
}

function image(value) {
 if (!value || typeof value !== 'object' || !SRC.test(String(value.src ?? ''))) return undefined;
 const out = { src: String(value.src) };
 if (value.alt) out.alt = String(value.alt).slice(0, ALT_MAX);
 if (typeof value.id === 'string' && /^[A-Za-z0-9_-]{16}$/.test(value.id)) out.id = value.id;
 for (const side of ['width', 'height']) {
  const n = Number(value[side]);
  if (Number.isInteger(n) && n >= 1 && n <= 12000) out[side] = n;
 }
 return out;
}

// Only what's valid, nothing else; unknown keys and bad values are dropped,
// so an empty object is the default look. `accent` is never kept here.
export function normalizeBrand(input) {
 const raw = input && typeof input === 'object' ? input : {};
 const out = {};
 const colors = {};
 for (const { key } of BRAND_COLORS) {
  if (key === 'accent') continue;
  const value = String(raw.colors?.[key] ?? '').toLowerCase();
  if (HEX.test(value)) colors[key] = value;
 }
 if (Object.keys(colors).length) out.colors = colors;
 const fonts = {};
 for (const { key } of BRAND_FONT_ROLES) {
  const name = raw.fonts?.[key];
  if (BRAND_FONTS.some((font) => font.name === name)) fonts[key] = name;
 }
 if (Object.keys(fonts).length) out.fonts = fonts;
 for (const spec of BRAND_NUMBERS) {
  const value = raw[spec.key] === undefined || raw[spec.key] === '' ? undefined : number(raw[spec.key], spec);
  if (value !== undefined) out[spec.key] = value;
 }
 if (BRAND_SHADOWS.some((shadow) => shadow.key === raw.shadow)) out.shadow = raw.shadow;
 const logo = image(raw.logo);
 if (logo) out.logo = logo;
 const favicon = image(raw.favicon);
 if (favicon) out.favicon = favicon;
 return out;
}

function stackOf(name, fallback) {
 const font = BRAND_FONTS.find((entry) => entry.name === name) ?? BRAND_FONTS.find((entry) => entry.name === fallback);
 return `'${font.name}', ${STACKS[font.kind]}`;
}

// The brand as CSS variables, for a style attribute or a :root rule. Only
// what the brand sets: everything else keeps the stylesheet's default.
export function brandVars(input) {
 const brand = normalizeBrand(input);
 const vars = {};
 for (const { key, variable } of BRAND_COLORS) {
  if (brand.colors?.[key]) vars[variable] = brand.colors[key];
 }
 for (const { key, variable, fallback } of BRAND_FONT_ROLES) {
  if (brand.fonts?.[key]) vars[variable] = stackOf(brand.fonts[key], fallback);
 }
 for (const spec of BRAND_NUMBERS) {
  if (brand[spec.key] !== undefined) vars[spec.variable] = spec.css(brand[spec.key]);
 }
 if (brand.shadow) vars['--site-shadow'] = BRAND_SHADOWS.find((shadow) => shadow.key === brand.shadow).css;
 return vars;
}

// The same, as one CSS declaration list.
export function brandCss(input) {
 return Object.entries(brandVars(input))
  .map(([name, value]) => `${name}:${value}`)
  .join(';');
}

// The Google Fonts stylesheet for the brand's own fonts, or '' when it uses
// the defaults (which the site's code already loads).
export function brandFontsHref(input) {
 const brand = normalizeBrand(input);
 const names = [...new Set(BRAND_FONT_ROLES.map(({ key, fallback }) => brand.fonts?.[key]).filter((name, index) => name && name !== BRAND_FONT_ROLES[index].fallback))];
 if (!names.length) return '';
 const families = names.map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:${BRAND_FONTS.find((font) => font.name === name).axis}`);
 return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

// Relative luminance contrast of two #rrggbb colors, 1 to 21.
export function contrastRatio(a, b) {
 const lum = (hex) => {
  const [r, g, bl] = [1, 3, 5].map((i) => {
   const c = parseInt(hex.slice(i, i + 2), 16) / 255;
   return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
 };
 if (!HEX.test(a) || !HEX.test(b)) return 0;
 const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
 return (hi + 0.05) / (lo + 0.05);
}
