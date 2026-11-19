// The made-up site's theme as CSS variables, and the contrast sums the
// Branding room shows. Same arithmetic as WCAG 2: relative luminance, then
// (lighter + 0.05) / (darker + 0.05).

function channels(hex) {
 const value = String(hex).replace('#', '');
 const full = value.length === 3 ? [...value].map((part) => part + part).join('') : value.padEnd(6, '0').slice(0, 6);
 return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16) / 255);
}

function luminance(hex) {
 const [r, g, b] = channels(hex).map((part) => (part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4));
 return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
 const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
 return (light + 0.05) / (dark + 0.05);
}

// White or near-black, whichever reads better on a color.
export function inkOn(color) {
 return contrast(color, '#ffffff') >= contrast(color, '#141a20') ? '#ffffff' : '#141a20';
}

export const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value).trim());

const stack = (font) => `'${font}', ${['Bitter', 'Fraunces'].includes(font) ? 'Georgia, serif' : 'system-ui, sans-serif'}`;

export function themeStyle(theme) {
 return {
  '--s-brand': theme.brand,
  '--s-brand-ink': inkOn(theme.brand),
  '--s-heading': theme.heading,
  '--s-text': theme.text,
  '--s-soft': theme.soft,
  '--s-dark': theme.dark,
  '--s-paper': theme.paper,
  '--s-head-font': stack(theme.headingFont),
  '--s-body-font': stack(theme.bodyFont),
  '--s-corners': `${theme.corners}px`,
 };
}
