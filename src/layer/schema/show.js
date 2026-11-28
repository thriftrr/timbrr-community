// Show windows (docs/scheduling.md, "Block show windows"): a block shown only
// from one time, until another, or between the two, such as holiday hours or a
// sale banner. A block keeps its own in `block.show`, beside its data, as
// { from?, until? }: UTC instants, ISO strings to the minute,
// '2026-12-20T06:00:00.000Z'. No time zone is kept: whoever picks a time picks
// it in their own browser's zone, which turns it into an instant, and anyone
// reading it sees it in theirs. `until` is the first minute it no longer
// shows. The site's layer decides at each request whether the block is shown,
// by comparing the instants with now, so a window opens and closes without a
// publish.
//
// This file has a twin in timbrr-community (src/layer/schema/show.js) and the
// two must stay the same, byte for byte: scripts/check-scheduling.mjs diffs
// them. It imports nothing, so it runs in the studio, the layer and a check
// script.
//
//  cleanBlockShow(input)         a block's window, cleaned, or null (always shown)
//  showMs(at)                    one of its times as UTC ms (NaN when it isn't one)
//  showState(show, now)          'before' | 'on' | 'after'
//  shownNow(block, now)          whether a visitor sees it now
//  joinShow(outer, inner)        a placed shared section's window over its own blocks'
//  showLabel(show, zone)         "Shows Dec 20 – Dec 26", in `zone` (the
//                                runtime's own when left out: call it in a browser)
//
// Nothing here refuses: a time that isn't one is dropped (the old wall-clock
// form, 'YYYY-MM-DDTHH:mm', included), and an `until` that isn't after `from`
// is dropped, so a save never fails over a window.

export const SHOW_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/;

// An instant, rounded down to the minute, as toISOString writes it; or ''.
function cleanAt(value) {
 if (typeof value !== 'string' || !SHOW_AT.test(value)) return '';
 const ms = Date.parse(value);
 if (Number.isNaN(ms)) return '';
 const iso = new Date(ms - (ms % 60_000)).toISOString();
 return iso.slice(0, 16) === value.slice(0, 16) ? iso : '';
}

export function showMs(at) {
 const clean = cleanAt(at);
 return clean ? Date.parse(clean) : NaN;
}

export function cleanBlockShow(input) {
 if (!input || typeof input !== 'object') return null;
 const from = cleanAt(input.from);
 let until = cleanAt(input.until);
 if (from && until && Date.parse(until) <= Date.parse(from)) until = '';
 if (!from && !until) return null;
 return { ...(from ? { from } : {}), ...(until ? { until } : {}) };
}

export function showState(show, now = Date.now()) {
 const clean = cleanBlockShow(show);
 if (!clean) return 'on';
 if (clean.from && now < Date.parse(clean.from)) return 'before';
 if (clean.until && now >= Date.parse(clean.until)) return 'after';
 return 'on';
}

export function shownNow(block, now = Date.now()) {
 return showState(block?.show, now) === 'on';
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

function words(ms, zone, options) {
 return new Intl.DateTimeFormat('en-US', { ...(zone ? { timeZone: zone } : {}), ...options }).format(new Date(ms));
}
function atMidnight(ms, zone) {
 return words(ms, zone, { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }) === '00:00';
}
function dayWords(ms, zone) {
 return words(ms, zone, { month: 'short', day: 'numeric' });
}
function timeWords(ms, zone) {
 return words(ms, zone, { hour: 'numeric', minute: '2-digit' });
}
// A start at midnight is that day; an end at midnight is the day before
// (until Dec 27 12:00 AM shows through Dec 26). Other times are said.
function startWords(ms, zone) {
 return atMidnight(ms, zone) ? dayWords(ms, zone) : `${dayWords(ms, zone)}, ${timeWords(ms, zone)}`;
}
function endWords(ms, zone) {
 return atMidnight(ms, zone) ? dayWords(ms - 60_000, zone) : `${dayWords(ms, zone)}, ${timeWords(ms, zone)}`;
}

export function showLabel(show, zone) {
 const clean = cleanBlockShow(show);
 if (!clean) return '';
 let tz = typeof zone === 'string' && zone ? zone : undefined;
 try {
  if (tz) new Intl.DateTimeFormat('en-US', { timeZone: tz });
 } catch {
  tz = 'UTC';
 }
 const from = clean.from ? Date.parse(clean.from) : NaN;
 const until = clean.until ? Date.parse(clean.until) : NaN;
 if (clean.from && clean.until) return `Shows ${startWords(from, tz)} – ${endWords(until, tz)}`;
 if (clean.from) return `Shows from ${startWords(from, tz)}`;
 return `Shows until ${endWords(until, tz)}`;
}
