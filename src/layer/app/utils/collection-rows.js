// The plain parts of a Collection list drawn as rows or people (docs/README.md §
// Collections): which field a row's words come from, dates and places in
// words, the visitor's month and order, and the sentences of an empty
// list. No Nuxt in here, so scripts/check-collection-rows.mjs reads them too.

const norm = (text) => String(text ?? '').trim().toLowerCase();
const DATES = ['date', 'datetime'];

// A field by what an owner types: its name as the editor shows it, or its key.
export const findField = (fields, name) => {
 const wanted = norm(name);
 return wanted ? (fields ?? []).find((field) => norm(field.label) === wanted || field.key === wanted) : undefined;
};

// The fields a row draws, as keys. A name that matches nothing draws
// nothing; a picture and a date left empty are the first of their kind.
// `fields` is the collection's own list, or what entries carry when that
// hasn't come.
export function rowKeys(data, fields) {
 const list = fields ?? [];
 const named = (name) => findField(list, name)?.key ?? '';
 return {
  picture: named(data.row_picture) || list.find((field) => field.kind === 'image')?.key || '',
  date: named(data.row_date) || list.find((field) => DATES.includes(field.kind))?.key || '',
  end: named(data.row_end),
  price: named(data.row_price),
  places: named(data.row_places),
  link: named(data.row_link),
  line: (Array.isArray(data.row_line) ? data.row_line : []).map(named).filter(Boolean),
 };
}

// The keys a row needs asked for, beside whatever `show` already names.
export const neededKeys = (keys) => [...new Set([keys.picture, keys.date, keys.end, keys.price, keys.places, keys.link, ...keys.line].filter(Boolean))];

// ── Dates, as the studio keeps them ('2026-12-05' or '2026-12-05T10:00') ──

const PARTS = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;
export function dateParts(value) {
 const match = PARTS.exec(String(value ?? ''));
 return match ? { year: +match[1], month: +match[2], day: +match[3], time: match[4] ? `${match[4]}:${match[5]}` : '' } : null;
}
const at = (parts) => new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

// "Sat Dec 5 · 10:00 – 14:00": the end is a time, or a date and time on the same day.
export function whenWords(start, end) {
 const from = dateParts(start);
 if (!from) return '';
 const day = at(from).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
 const to = /^\d{2}:\d{2}$/.test(String(end ?? '')) ? end : dateParts(end)?.time && dateParts(end).day === from.day && dateParts(end).month === from.month ? dateParts(end).time : '';
 return [day, from.time && (to ? `${from.time} – ${to}` : from.time)].filter(Boolean).join(' · ');
}

export const monthOf = (value) => {
 const parts = dateParts(value);
 return parts ? `${parts.year}-${String(parts.month).padStart(2, '0')}` : '';
};
const monthName = (key) => at({ year: +key.slice(0, 4), month: +key.slice(5, 7), day: 1 }).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });

// "December", with the year only where two headings would say the same.
export function monthLabels(keys) {
 const names = keys.map(monthName);
 return Object.fromEntries(keys.map((key, index) => [key, names.indexOf(names[index]) !== names.lastIndexOf(names[index]) ? `${names[index]} ${key.slice(0, 4)}` : names[index]]));
}

// What a month is as a pair of filters on a date field: on or after its
// first day, on or before its last (`t99` closes the day for a field that
// keeps a time; the studio compares as lower-case text).
export function monthRange(key) {
 const year = +key.slice(0, 4);
 const month = +key.slice(5, 7);
 const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
 return { from: `${key}-01`, to: `${key}-${String(last).padStart(2, '0')}t99` };
}

// A date field's answers (the studio counts each distinct value) as months, in order.
export function facetMonths(rows) {
 const counts = new Map();
 for (const row of rows ?? []) {
  const key = monthOf(row.value);
  if (key) counts.set(key, (counts.get(key) ?? 0) + (row.count ?? 1));
 }
 const keys = [...counts.keys()].sort();
 const labels = monthLabels(keys);
 return keys.map((key) => ({ value: key, label: labels[key], count: counts.get(key) }));
}

// ── Places left ──

// "8 places left", "1 place left", "Full" (0 or fewer); null when it isn't a number.
export function placesWords(value) {
 if (value === '' || value === null || value === undefined) return null;
 const number = Number(value);
 if (!Number.isFinite(number)) return null;
 if (number <= 0) return { full: true, left: 0, words: 'Full' };
 return { full: false, left: number, words: `${number} ${number === 1 ? 'place' : 'places'} left` };
}

// ── What a visitor can ask for ──

// The orders on offer: the date field either way, price, and title. The
// first whose sort and direction are the block's own is what no pick means.
export function sortOptions(keys, fields) {
 const kind = (key) => fields.find((field) => field.key === key)?.kind;
 return [
  ...(keys.date ? [{ value: 'date', label: 'Soonest first', sort: keys.date, dir: 'asc' }, { value: 'date_desc', label: 'Latest first', sort: keys.date, dir: 'desc' }] : []),
  ...(keys.price && kind(keys.price) === 'number' ? [{ value: 'price', label: 'Price, low to high', sort: keys.price, dir: 'asc' }, { value: 'price_desc', label: 'Price, high to low', sort: keys.price, dir: 'desc' }] : []),
  { value: 'title', label: 'A to Z', sort: 'title', dir: 'asc' },
 ];
}

// An address an owner or a token typed, kept to this site's own lower-case
// paths ('/classes/category/{category}' comes back as '/classes/category/Bread').
export function entryHref(to) {
 const text = String(to ?? '').trim();
 return text.startsWith('/') && !/[?#]/.test(text) ? text.toLowerCase().replace(/\s+/g, '-') : text;
}

// "More about [name]": the first word of an entry's title, or all of it.
export const rowButtonWords = (label, title) => String(label ?? '').replace(/\[name\]/gi, String(title ?? '').split(/\s+/)[0] ?? '').replace(/\[title\]/gi, String(title ?? ''));

// ── An empty list, in words ──

const join = (labels) => labels.join(' or ');
const plural = (count, one, many) => (count === 1 ? one : many);

// What was asked, as the words an empty list says. `active` is the narrowing
// the visitor made: [{ kind: 'choice'|'month', label, ui, answer }], `noun` the
// collection's name in lower case. Choices set in a menu come before the
// one set in buttons, and the month last: "Beginner Bread classes in January".
export function askedWords(active, noun, { month: withMonth = true } = {}) {
 const choices = active.filter((one) => one.kind === 'choice');
 const month = active.find((one) => one.kind === 'month');
 const ordered = [...choices.filter((one) => one.ui !== 'buttons'), ...choices.filter((one) => one.ui === 'buttons')];
 return `${[...ordered.map((one) => join(one.answer)), noun].join(' ')}${month && withMonth ? ` in ${month.answer[0]}` : ''}`;
}

export const noneFound = (active, noun) => `No ${askedWords(active, noun)}.`;

// The sentence under it, when taking away one of the things asked leaves some:
// `dropped` is what came away and `left` how many there are then.
export function insteadWords(active, dropped, left, noun, singular) {
 const rest = active.filter((one) => one !== dropped);
 const what = askedWords(rest, left === 1 ? singular : noun, { month: false });
 const inMonth = rest.find((one) => one.kind === 'month');
 if (dropped.kind === 'month') return `There ${plural(left, 'is', 'are')} ${left} ${what}, just not in ${dropped.answer[0]}.`;
 return `There ${plural(left, 'is', 'are')} ${left} ${what}${inMonth ? ` in ${inMonth.answer[0]}` : ''}, just not ${join(dropped.answer)} ones.`;
}

// What a button says that takes one thing away.
export function dropWords(active, dropped, noun) {
 const rest = active.filter((one) => one !== dropped);
 const inMonth = rest.find((one) => one.kind === 'month');
 if (dropped.kind === 'month') return `Show ${askedWords(rest, noun)} in any month`;
 return `Show every ${String(dropped.name).toLowerCase()}${inMonth ? ` in ${inMonth.answer[0]}` : ''}`;
}
