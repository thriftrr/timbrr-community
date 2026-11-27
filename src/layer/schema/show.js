// Show windows (docs/scheduling.md, "Block show windows"): a block shown only
// from one time, until another, or between the two, such as holiday hours or a
// sale banner. A block keeps its own in `block.show`, beside its data, as
// { from?, until? }: wall-clock times, 'YYYY-MM-DDTHH:mm', in the site's time
// zone (Site details › Time zone, UTC when there's none). `until` is the first
// minute it no longer shows. The site's layer decides at each request whether
// the block is shown, so a window opens and closes without a publish.
//
// This file has a twin in timbrr-community (src/layer/schema/show.js) and the
// two must stay the same, byte for byte: scripts/check-scheduling.mjs diffs
// them. It imports nothing, so it runs in the studio, the layer and a check
// script.
//
//  cleanBlockShow(input)         a block's window, cleaned, or null (always shown)
//  zonedMs(local, zone)          a wall-clock time in a zone, as UTC milliseconds
//  localAt(ms, zone)             the other way: 'YYYY-MM-DDTHH:mm' in the zone
//  showState(show, zone, now)    'before' | 'on' | 'after'
//  shownNow(block, zone, now)    whether a visitor sees it now
//  joinShow(outer, inner)        a placed shared section's window over its own blocks'
//  showLabel(show)               "Shows Dec 20 – Dec 26"
//
// Nothing here refuses: a time that isn't one is dropped, and an `until` that
// isn't after `from` is dropped, so a save never fails over a window.

export const SHOW_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function usableZone(zone) {
 if (typeof zone !== 'string' || !zone) return 'UTC';
 try {
  new Intl.DateTimeFormat('en-US', { timeZone: zone });
  return zone;
 } catch {
  return 'UTC';
 }
}

function cleanAt(value) {
 if (typeof value !== 'string' || !SHOW_AT.test(value)) return '';
 const ms = Date.parse(`${value}:00Z`);
 return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 16) !== value ? '' : value;
}

export function cleanBlockShow(input) {
 if (!input || typeof input !== 'object') return null;
 const from = cleanAt(input.from);
 let until = cleanAt(input.until);
 if (from && until && until <= from) until = '';
 if (!from && !until) return null;
 return { ...(from ? { from } : {}), ...(until ? { until } : {}) };
}

// How far the zone is ahead of UTC at that instant, in ms.
function offsetAt(ms, zone) {
 const parts = Object.fromEntries(
  new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
   .formatToParts(new Date(ms))
   .map((part) => [part.type, Number(part.value)]),
 );
 return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(ms / 1000) * 1000;
}

// The wall-clock time `local` in `zone`, as UTC ms. A time that a clock change
// skips (2:30 AM on a spring-forward night) lands an hour on; one it repeats
// takes the first.
export function zonedMs(local, zone) {
 const at = cleanAt(local);
 if (!at) return NaN;
 const tz = usableZone(zone);
 const guess = Date.parse(`${at}:00Z`);
 const first = guess - offsetAt(guess, tz);
 const shift = offsetAt(first, tz);
 const second = guess - shift;
 return offsetAt(second, tz) === shift ? second : first;
}

export function localAt(ms, zone) {
 const at = Number(ms);
 if (!Number.isFinite(at)) return '';
 return new Date(at + offsetAt(at, usableZone(zone))).toISOString().slice(0, 16);
}

export function showState(show, zone, now = Date.now()) {
 const clean = cleanBlockShow(show);
 if (!clean) return 'on';
 if (clean.from && now < zonedMs(clean.from, zone)) return 'before';
 if (clean.until && now >= zonedMs(clean.until, zone)) return 'after';
 return 'on';
}

export function shownNow(block, zone, now = Date.now()) {
 return showState(block?.show, zone, now) === 'on';
}

// Both windows at once: the later start and the earlier end. Null for none.
export function joinShow(outer, inner) {
 const a = cleanBlockShow(outer);
 const b = cleanBlockShow(inner);
 if (!a || !b) return a ?? b;
 const from = [a.from, b.from].filter(Boolean).sort().at(-1);
 const until = [a.until, b.until].filter(Boolean).sort()[0];
 return { ...(from ? { from } : {}), ...(until ? { until } : {}) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dayWords(at) {
 return `${MONTHS[Number(at.slice(5, 7)) - 1]} ${Number(at.slice(8, 10))}`;
}
function timeWords(at) {
 const hour = Number(at.slice(11, 13));
 return `${hour % 12 || 12}:${at.slice(14, 16)} ${hour < 12 ? 'AM' : 'PM'}`;
}
// A start at midnight is that day; an end at midnight is the day before
// (until Dec 27 12:00 AM shows through Dec 26). Other times are said.
function startWords(at) {
 return at.endsWith('T00:00') ? dayWords(at) : `${dayWords(at)}, ${timeWords(at)}`;
}
function endWords(at) {
 if (!at.endsWith('T00:00')) return `${dayWords(at)}, ${timeWords(at)}`;
 return dayWords(new Date(Date.parse(`${at}:00Z`) - 86_400_000).toISOString().slice(0, 16));
}

export function showLabel(show) {
 const clean = cleanBlockShow(show);
 if (!clean) return '';
 if (clean.from && clean.until) return `Shows ${startWords(clean.from)} – ${endWords(clean.until)}`;
 if (clean.from) return `Shows from ${startWords(clean.from)}`;
 return `Shows until ${endWords(clean.until)}`;
}
