// "How this site counts visits", the page at /how-we-count (pages/how-we-count.vue,
// docs/analytics.md): what the studio's `analytics` answer says, tidied, and
// the lines the page draws from it. Plain functions, checked by
// scripts/check-analytics.mjs.

export const HOW_WE_COUNT_PATH = '/how-we-count';
const KEEP_DEFAULT = 90; // days, the studio's included window

// The studio's { on, events, fields, id, retentionDays?, howWeCountLink? },
// or anything else (an older studio sends less, or nothing): off unless
// `on` is true; no link unless `howWeCountLink` is true.
export function analyticsSettings(value) {
 const picks = value && typeof value === 'object' ? value : {};
 const list = (names) => (Array.isArray(names) ? names.filter((name) => typeof name === 'string') : []);
 const days = Number.isInteger(picks.retentionDays) && picks.retentionDays > 0 && picks.retentionDays <= 3660 ? picks.retentionDays : KEEP_DEFAULT;
 const on = picks.on === true;
 return { on, events: on ? list(picks.events) : [], fields: on ? list(picks.fields) : [], retentionDays: days, howWeCountLink: on && picks.howWeCountLink === true };
}

// What is counted, one line per thing, only for what this site collects:
// the events its script sends and the optional details its Worker keeps.
// [bold, rest] pairs, in the order a visitor would think of them.
export function countedLines({ events = [], fields = [] } = {}) {
 const has = (name) => events.includes(name) || fields.includes(name);
 return [
  ['Pages that are opened', has('leave') ? ', how long they stay open and how far down people scroll.' : '.'],
  has('referrer') && ['Where you came from', ', by site name only, such as google.com or instagram.com.'],
  has('utm') && ['Which campaign brought you', ', when the link you followed names one.'],
  has('device') && ['Phone, tablet or computer', ', from the width of your screen.'],
  has('agent') && ['Your browser and system', ' by name only, such as Safari on iOS.'],
  has('country') && ['Your country', ', never your town.'],
  has('seen') && ['Which parts of a page come into view', '.'],
  has('click') && ['Taps on buttons and links', ' on the page, as which one, not what it says.'],
  has('heat') && ['Where on a section people tap', ', as a spot on that section.'],
  has('event') && ['Things done on the page', ', such as sending a form, playing a video or tapping a phone number. Never what was written or which number.'],
 ].filter(Boolean);
}

// 90 → "90 days", 365 → "1 year", 730 → "2 years".
export const keptFor = (days) => (days % 365 === 0 ? `${days / 365} ${days === 365 ? 'year' : 'years'}` : `${days} days`);
