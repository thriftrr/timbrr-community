// Block motion (docs/motion.md): how a block arrives as it scrolls into
// view. A block keeps its own in `block.motion`, beside its data, so every
// block type has it, the site's own blocks too; the site's choices live in
// `brand.motion` (Settings › Branding › Motion). This file has a twin in
// timbrr-community (src/layer/schema/motion.js) and the two must stay the
// same, byte for byte: scripts/check-motion.mjs diffs them. It imports
// nothing, so it runs in the studio, the layer and a check script.
//
//  cleanMotion(input)          a block's motion, clamped, unknown keys dropped, or null (follow the site)
//  cleanSiteMotion(input)      brand.motion the same way, or null (Off)
//  blockMotion(block, ctx)     what one block on a page does, every rule applied, or null
//  motionAttrs(effective)      its class, data attributes and custom properties, for its root
//  pageMotion(blocks, brand)   each top-level block's effective motion, and how many things move
//  calmer(motion)              a stagger made one fade (the page budget's "Calmer")
//  blockWords(data)            how many words a block shows
//  hasMotionItems(entry)       whether a block type marks items to stagger
//  motionHead(brand)           the CSS, the <head> snippet and the observer script, for a page with motion
//
// Nothing here refuses: out-of-range values are clamped, unknown ones
// dropped, so a save or a publish never fails over motion.

export const MOTION_LIMITS = Object.freeze({ ms: [150, 1200], delay: [0, 2000], px: 200, pct: 50, deg: 15, calmDeg: 5, scale: [0.85, 1.15], at: [0.1, 0.9], stagger: [0, 400], depth: [200, 4000], words: 120, budget: 12, slow: 3000 });
export const MOTION_DISTANCES = Object.freeze({ xs: 8, s: 16, m: 24, l: 48, xl: 96 });
export const MOTION_TIMES = Object.freeze({ quick: 280, normal: 480, calm: 800 });
export const MOTION_EASES = Object.freeze({
 smooth: 'cubic-bezier(.22,1,.36,1)',
 gentle: 'cubic-bezier(.65,0,.35,1)',
 settle: 'cubic-bezier(.34,1.56,.64,1)',
 spring: 'linear(0,.009,.035 2.1%,.141,.281 6.7%,.723 12.9%,.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,.991,.977 51%,.974 53.8%,.975 57.1%,.997 69.8%,1.003 76.9%,1)',
});
export const MOTION_INTENSITIES = Object.freeze([
 { key: 'off', label: 'Off', k: 0, note: 'Nothing moves. Motion set on blocks is kept for later.' },
 { key: 'subtle', label: 'Subtle', k: 0.6, note: 'Short moves. Most sites want this.' },
 { key: 'lively', label: 'Lively', k: 1.4, note: 'Longer moves, plus spring, deeper tilt and parallax.' },
]);
export const MOTION_PIVOTS = Object.freeze(['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']);
// Built-in blocks whose list items carry data-motion-item, so "One after another" has something to stagger.
export const MOTION_ITEM_TYPES = Object.freeze(['cards', 'events', 'feed', 'gallery', 'people', 'services', 'stats', 'team']);

// Whether a block type's items can arrive one after another (get_block_type's has_items).
export const hasMotionItems = (entry) => MOTION_ITEM_TYPES.includes(entry?.type) || (String(entry?.type ?? '').startsWith('own_') && (entry.fields ?? []).some((field) => field.widget === 'items'));

const REST = Object.freeze({ x: 0, y: 0, scale: 1, turn: 0, tiltX: 0, tiltY: 0, opacity: 1 });

// The presets, as data: where the block starts (`from`), its timing, and flags.
// `fade` isn't offered: it's what long text and "Calmer" fall back to.
export const MOTION_PRESETS = Object.freeze([
 { key: 'none', label: 'None', note: 'Stays put.' },
 { key: 'fade-up', label: 'Fade up', note: 'Rises a little as it fades in.', from: { y: 's', opacity: 0 } },
 { key: 'slide-in', label: 'Slide in', note: 'Comes in from the left. Change Sideways to come from the right.', from: { x: '-l', opacity: 0 } },
 { key: 'zoom', label: 'Zoom', note: 'Grows a touch as it fades in.', from: { scale: 0.92, opacity: 0 } },
 { key: 'rise-settle', label: 'Rise and settle', note: 'Rises, overshoots a hair, settles.', from: { y: 'm', scale: 0.98, opacity: 0 }, time: { ms: 640, ease: 'settle' } },
 { key: 'stagger', label: 'One after another', note: 'Its cards or rows arrive one by one. The block itself stays still.', from: { y: 's', opacity: 0 }, items: true },
 { key: 'parallax', label: 'Parallax', note: 'Its pictures drift as the page scrolls. Lively only.', scroll: true },
 { key: 'fade', label: 'Fade', note: 'Fades in where it is.', from: { opacity: 0 }, hidden: true },
]);
const PRESET = new Map(MOTION_PRESETS.map((preset) => [preset.key, preset]));

// The site's defaults for a site made from now on: existing sites have no
// brand.motion, which is Off, so nothing changes on a live site.
export const NEW_SITE_MOTION = Object.freeze({ intensity: 'subtle', preset: 'fade-up' });

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round = (n, places = 2) => Number(n.toFixed(places));
const DISTANCE_TOKEN = /^-?(?:xs|s|m|l|xl)$/;
const DISTANCE_SHARE = /^-?\d{1,3}(?:\.\d{1,2})?%$/;

// A distance: a token (`s`, `-l`), a share of the block's size (`25%`), or px (Pro).
function cleanDistance(value) {
 if (finite(value)) return Math.round(clamp(value, -MOTION_LIMITS.px, MOTION_LIMITS.px));
 if (typeof value !== 'string') return undefined;
 if (DISTANCE_TOKEN.test(value)) return value;
 if (DISTANCE_SHARE.test(value)) return `${round(clamp(parseFloat(value), -MOTION_LIMITS.pct, MOTION_LIMITS.pct))}%`;
 return undefined;
}

// A distance in px, for counting and for the panel; a share stays as it is.
export function distancePx(value) {
 if (finite(value)) return value;
 if (typeof value === 'string' && DISTANCE_TOKEN.test(value)) return (value.startsWith('-') ? -1 : 1) * MOTION_DISTANCES[value.replace('-', '')];
 return 0;
}
const distanceCss = (value) => (typeof value === 'string' && value.endsWith('%') ? value : `${distancePx(value)}px`);

function cleanEase(value) {
 if (typeof value === 'string' && Object.hasOwn(MOTION_EASES, value)) return value;
 if (Array.isArray(value) && value.length === 4 && value.every(finite)) {
  return [round(clamp(value[0], 0, 1), 3), round(clamp(value[1], -2, 3), 3), round(clamp(value[2], 0, 1), 3), round(clamp(value[3], -2, 3), 3)];
 }
 return undefined;
}
const easeCss = (ease) => (Array.isArray(ease) ? `cubic-bezier(${ease.join(',')})` : MOTION_EASES[ease] ?? MOTION_EASES.smooth);

const kept = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
const some = (object) => (Object.keys(object).length ? object : undefined);

// A block's motion as stored: only what it changes from its preset, every
// number inside its limits. Follow-the-site with nothing changed is null.
export function cleanMotion(input) {
 if (!isObject(input)) return null;
 const preset = input.preset === 'site' || PRESET.has(input.preset) ? input.preset : 'site';
 const from = isObject(input.from) ? input.from : {};
 const time = isObject(input.time) ? input.time : {};
 const trigger = isObject(input.trigger) ? input.trigger : {};
 const stagger = isObject(input.stagger) ? input.stagger : {};
 const deg = (value) => (finite(value) ? round(clamp(value, -MOTION_LIMITS.deg, MOTION_LIMITS.deg), 1) : undefined);
 const out = kept({
  trigger: some(kept({ at: finite(trigger.at) ? round(clamp(trigger.at, ...MOTION_LIMITS.at)) : undefined, plays: ['once', 'every'].includes(trigger.plays) ? trigger.plays : undefined })),
  from: some(
   kept({
    x: cleanDistance(from.x),
    y: cleanDistance(from.y),
    scale: finite(from.scale) ? round(clamp(from.scale, ...MOTION_LIMITS.scale)) : undefined,
    turn: deg(from.turn),
    tiltX: deg(from.tiltX),
    tiltY: deg(from.tiltY),
    opacity: finite(from.opacity) ? round(clamp(from.opacity, 0, 1)) : undefined,
   }),
  ),
  time: some(
   kept({
    ms: Object.hasOwn(MOTION_TIMES, time.ms) ? time.ms : finite(time.ms) ? Math.round(clamp(time.ms, ...MOTION_LIMITS.ms)) : undefined,
    delay: finite(time.delay) ? Math.round(clamp(time.delay, ...MOTION_LIMITS.delay)) : undefined,
    ease: cleanEase(time.ease),
   }),
  ),
  stagger: some(kept({ ms: finite(stagger.ms) ? Math.round(clamp(stagger.ms, ...MOTION_LIMITS.stagger)) : undefined, from: ['start', 'end', 'center'].includes(stagger.from) ? stagger.from : undefined })),
  phone: ['same', 'simpler', 'none'].includes(input.phone) ? input.phone : undefined,
  depth: finite(input.depth) ? Math.round(clamp(input.depth, ...MOTION_LIMITS.depth)) : undefined,
  pivot: MOTION_PIVOTS.includes(input.pivot) ? input.pivot : undefined,
 });
 if (preset === 'site' && !Object.keys(out).length) return null;
 return { v: 1, preset, ...out };
}

// brand.motion: Intensity, the preset new sections follow, and whether
// they play once or every time. Off with nothing else is null.
export function cleanSiteMotion(input) {
 if (!isObject(input)) return null;
 const out = kept({
  intensity: MOTION_INTENSITIES.some((entry) => entry.key === input.intensity) ? input.intensity : undefined,
  preset: PRESET.has(input.preset) && !PRESET.get(input.preset).hidden ? input.preset : undefined,
  plays: ['once', 'every'].includes(input.plays) ? input.plays : undefined,
 });
 return Object.keys(out).length ? out : null;
}

export const motionIntensity = (brand) => MOTION_INTENSITIES.find((entry) => entry.key === cleanSiteMotion(brand?.motion)?.intensity) ?? MOTION_INTENSITIES[0];

// Words a block shows: every string in its data, tags stripped. Pictures'
// addresses and keys are words to this count too; it only has to tell a
// heading-and-a-line block from an article.
export function blockWords(data) {
 let words = 0;
 const walk = (value, depth) => {
  if (depth > 6) return;
  if (typeof value === 'string') words += value.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word) && !/^(?:https?:|\/|#)/.test(word)).length;
  else if (Array.isArray(value)) value.forEach((entry) => walk(entry, depth + 1));
  else if (isObject(value)) Object.entries(value).forEach(([key, entry]) => key !== 'src' && key !== 'href' && walk(entry, depth + 1));
 };
 walk(data, 0);
 return words;
}

// How many things a block's stagger moves: its longest list, at least one.
export const motionItems = (data) => Math.max(1, ...Object.values(isObject(data) ? data : {}).map((value) => (Array.isArray(value) ? value.length : 0)));

// What one block does on a page, or null when it stays put. `first`: it's the
// page's first block (default None). `brand`: the site's brand.
export function blockMotion(block, { brand, first = false } = {}) {
 const site = cleanSiteMotion(brand?.motion);
 const intensity = site?.intensity ?? 'off';
 if (intensity === 'off' || !block || block.ref) return null;
 const own = cleanMotion(block.motion);
 let key = own && own.preset !== 'site' ? own.preset : first ? 'none' : (site.preset ?? 'none');
 if (key === 'none') return null;
 const lively = intensity === 'lively';
 if (PRESET.get(key).scroll && !lively) return null;
 const words = blockWords(block.data);
 const long = words > MOTION_LIMITS.words;
 if (long) key = 'fade';
 const preset = PRESET.get(key);
 const from = { ...REST, ...preset.from, ...(long ? { opacity: own?.from?.opacity ?? 0 } : own?.from) };
 if (!lively) for (const part of ['turn', 'tiltX', 'tiltY']) from[part] = clamp(from[part], -MOTION_LIMITS.calmDeg, MOTION_LIMITS.calmDeg);
 const time = { ms: 'normal', delay: 0, ease: 'smooth', ...preset.time, ...own?.time };
 if (time.ease === 'spring' && !lively) time.ease = 'settle';
 return {
  key,
  long,
  words,
  scroll: Boolean(preset.scroll),
  from,
  time: { ...time, ms: MOTION_TIMES[time.ms] ?? time.ms },
  at: own?.trigger?.at ?? 0.2,
  plays: own?.trigger?.plays ?? site.plays ?? 'once',
  stagger: preset.items ? { ms: 80, from: 'start', ...own?.stagger } : null,
  phone: own?.phone ?? 'simpler',
  depth: own?.depth ?? 1000,
  pivot: own?.pivot ?? 'center',
 };
}

// The root's class, data attributes and custom properties. Only what
// differs from the stylesheet's defaults is written, so a plain Fade up
// carries two properties.
export function motionAttrs(effective) {
 if (!effective) return null;
 const { from, time } = effective;
 const style = kept({
  '--m-x': from.x ? distanceCss(from.x) : undefined,
  '--m-y': from.y ? distanceCss(from.y) : undefined,
  '--m-s': from.scale !== 1 ? String(from.scale) : undefined,
  '--m-r': from.turn ? `${from.turn}deg` : undefined,
  '--m-tx': from.tiltX ? `${from.tiltX}deg` : undefined,
  '--m-ty': from.tiltY ? `${from.tiltY}deg` : undefined,
  '--m-o': from.opacity !== 1 ? String(from.opacity) : undefined,
  '--m-d': time.ms !== 480 ? `${time.ms}ms` : undefined,
  '--m-delay': time.delay ? `${time.delay}ms` : undefined,
  '--m-ease': time.ease !== 'smooth' ? easeCss(time.ease) : undefined,
  '--m-stag': effective.stagger && effective.stagger.ms !== 80 ? `${effective.stagger.ms}ms` : undefined,
  '--m-p': effective.depth !== 1000 ? `${effective.depth}px` : undefined,
  '--m-origin': effective.pivot !== 'center' ? effective.pivot : undefined,
 });
 const classes = ['m', effective.stagger && 'm-st', effective.scroll && 'm-px', effective.phone !== 'simpler' && `m-ph-${effective.phone}`].filter(Boolean).join(' ');
 const data = kept({
  'data-m-at': effective.at !== 0.2 ? String(effective.at) : undefined,
  'data-m-plays': effective.plays === 'every' ? 'every' : undefined,
  'data-m-from': effective.stagger && effective.stagger.from !== 'start' ? effective.stagger.from : undefined,
 });
 return { class: classes, style, data };
}

// Every top-level block's motion on a page: the first shown block defaults
// to None. `count` is how many things move (each stagger item counts),
// `slow` the blocks whose delay and duration pass MOTION_LIMITS.slow.
export function pageMotion(blocks, brand) {
 const shown = (Array.isArray(blocks) ? blocks : []).filter((block) => block && !block.hidden);
 const list = shown.map((block, index) => ({ id: block.id, motion: blockMotion(block, { brand, first: index === 0 }) }));
 const count = list.reduce((sum, { id, motion }) => sum + (motion ? (motion.stagger ? motionItems(shown.find((block) => block.id === id)?.data) : 1) : 0), 0);
 const slow = list.filter(({ motion }) => motion && motion.time.ms + motion.time.delay > MOTION_LIMITS.slow).map(({ id }) => id);
 return { list, count, over: count > MOTION_LIMITS.budget, slow, any: list.some(({ motion }) => motion) };
}

// "Calmer": a stagger becomes one fade of the whole block; anything else stays.
export const calmer = (motion) => ({ ...(cleanMotion(motion) ?? { v: 1 }), preset: 'fade' });

// ── What a page with motion adds to its head ──

const START =
 'opacity:var(--m-o,1);transform:perspective(var(--m-p,1000px)) translate(calc(var(--m-x,0px)*var(--m-k)),calc(var(--m-y,0px)*var(--m-k))) scale(calc(1 + (var(--m-s,1) - 1)*var(--m-k))) rotate(calc(var(--m-r,0deg)*var(--m-k))) rotateX(calc(var(--m-tx,0deg)*var(--m-k))) rotateY(calc(var(--m-ty,0deg)*var(--m-k)))';
const TIMING = 'var(--m-d,480ms) var(--m-ease,cubic-bezier(.22,1,.36,1))';
// The hidden start state is only ever under html.m-js (set by the head
// snippet), so with no script, in print and for crawlers everything shows.
// `.m-replay` is the canvas's Replay: the start state with no transition.
export const MOTION_CSS = [
 `.m,.m-i{transform-origin:var(--m-origin,center);transition:opacity ${TIMING} var(--m-delay,0ms),transform ${TIMING} var(--m-delay,0ms)}`,
 '.m-i{transition-delay:calc(var(--m-delay,0ms) + var(--i,0)*var(--m-stag,80ms))}',
 `html.m-js .m:not(.m-st):not(.m-px):not(.m-in),html.m-js .m-st:not(.m-in) .m-i,.m-replay:not(.m-st):not(.m-px),.m-replay .m-i{${START}}`,
 '.m-now,.m-now .m-i,.m-replay,.m-replay .m-i{transition:none}',
 '@supports (animation-timeline:view()){html.m-js .m-px img{animation:m-px linear both;animation-timeline:view()}@keyframes m-px{from{transform:translateY(calc(40px*var(--m-k)))}to{transform:translateY(calc(-40px*var(--m-k)))}}}',
 '@media (max-width:640px){' +
  'html.m-js .m:not(.m-ph-same):not(.m-st):not(.m-px):not(.m-in),html.m-js .m-st:not(.m-ph-same):not(.m-in) .m-i,.m-replay:not(.m-ph-same):not(.m-st):not(.m-px),.m-replay:not(.m-ph-same) .m-i{transform:translate(calc(var(--m-x,0px)*var(--m-k)*.5),calc(var(--m-y,0px)*var(--m-k)*.5))}' +
  '.m.m-ph-none,.m-ph-none .m-i{opacity:1!important;transform:none!important;transition:none!important}.m-ph-none img{animation:none!important}}',
 '@media (prefers-reduced-motion: reduce) {\n  .m, .m-i { opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; }\n}',
 '@media (prefers-reduced-motion: reduce){.m-px img{animation:none!important}}',
 '@media print{.m,.m-i{opacity:1!important;transform:none!important;transition:none!important}}',
].join('\n');

// Before first paint: the start state applies only where the observer can end it.
export const MOTION_HEAD_SCRIPT = "if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('m-js')";

// At the end of the body: marks each stagger's items (an own `--i`; a stagger
// with none fades as one), shows blocks already scrolled past at once, and
// adds m-in as each block comes on screen. One observer, and window.__tbMotion
// sets up whatever blocks are new (m-ok marks the done ones: a class, so a
// re-rendered element loses it with its m-in); the layer calls it after each
// in-site navigation, which doesn't run this script again.
export const MOTION_SCRIPT =
 "(()=>{const d=document,c=d.documentElement.classList;if(!c.contains('m-js'))return;" +
 "const o=window.__tbO||(window.__tbO=new IntersectionObserver(es=>es.forEach(e=>{const b=e.target,t=+(b.dataset.mAt||.2),every=b.dataset.mPlays==='every';" +
 "if(e.isIntersecting&&(e.intersectionRatio>=t||e.intersectionRect.height>=innerHeight*t)){b.classList.remove('m-now');b.classList.add('m-in');if(!every)o.unobserve(b)}" +
 "else if(every&&!e.isIntersecting&&e.boundingClientRect.top>0)b.classList.remove('m-in')}),{threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9]}));" +
 "(window.__tbMotion=()=>d.querySelectorAll('.m:not(.m-ok)').forEach(b=>{b.classList.add('m-ok');if(b.classList.contains('m-st')){const it=[...b.querySelectorAll('[data-motion-item]')],n=it.length,f=b.dataset.mFrom;" +
 "if(!n)b.classList.remove('m-st');it.forEach((e,i)=>{e.classList.add('m-i');e.style.setProperty('--i',f==='end'?n-1-i:f==='center'?Math.abs(i-(n-1)/2):i)})}" +
 "if(b.classList.contains('m-px'))return;if(b.getBoundingClientRect().bottom<0)b.classList.add('m-now','m-in');else o.observe(b)}))()})()";

// The page's head for its motion: nothing at all with Intensity Off or no
// block that moves. `canvas`: the studio's canvas, which never hides
// anything (no m-js, no observer) but needs the CSS for Replay.
export function motionHead(brand, { any = true, canvas = false } = {}) {
 const { k } = motionIntensity(brand);
 if (!k || !any) return null;
 return {
  css: `html{--m-k:${k}}\n${MOTION_CSS}`,
  head: canvas ? '' : MOTION_HEAD_SCRIPT,
  body: canvas ? '' : MOTION_SCRIPT,
 };
}
