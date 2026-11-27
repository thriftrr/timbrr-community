// A business's hours, as Site details keeps them (docs/blocks.md § Site
// details): seven rows, Monday first, each { closed, open, close } with
// 24-hour HH:MM times. Nothing here reads the clock on its own, so all of it
// can be tested: scripts/check-hours.mjs. (Nuxt auto-imports app/utils.)

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(time) {
 const match = TIME.exec(String(time ?? ''));
 return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// '17:00' → '5:00 pm'.
export function formatTime(time) {
 const total = toMinutes(time);
 if (total === null) return '';
 const hour = Math.floor(total / 60);
 const minute = String(total % 60).padStart(2, '0');
 return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'am' : 'pm'}`;
}

// The seven rows with their times in minutes, or null when they aren't
// seven good rows. Anything less isn't something to tell a visitor about.
function readRows(hours) {
 if (!Array.isArray(hours) || hours.length !== 7) return null;
 const rows = hours.map((row) => {
  if (row?.closed === true) return { closed: true };
  const open = toMinutes(row?.open);
  const close = toMinutes(row?.close);
  return open === null || close === null ? null : { closed: false, open, close, openAt: row.open, closeAt: row.close };
 });
 return rows.includes(null) ? null : rows;
}

// The week as it reads on a page: days in a row with the same hours share a
// line. [{ title: 'Mon – Fri', body: '9:00 am – 5:00 pm' }, { title: 'Sun',
// body: 'Closed' }]. Empty when the hours aren't set.
export function groupHours(hours) {
 const rows = readRows(hours);
 if (!rows) return [];
 const said = rows.map((row) => (row.closed ? 'Closed' : `${formatTime(row.openAt)} – ${formatTime(row.closeAt)}`));
 const groups = [];
 said.forEach((body, day) => {
  const last = groups.at(-1);
  if (last?.body === body) last.to = day;
  else groups.push({ from: day, to: day, body });
 });
 return groups.map(({ from, to, body }) => ({ title: from === to ? DAYS[from] : `${DAYS[from]} – ${DAYS[to]}`, body }));
}

// The weekday (Monday is 0), minute of the day and date ('2026-12-25') it is
// right now in a time zone, or null for a zone this browser doesn't know.
function localTime(timezone, now) {
 if (typeof timezone !== 'string' || !timezone) return null;
 try {
  const parts = new Intl.DateTimeFormat('en-US', {
   timeZone: timezone,
   weekday: 'short',
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
   hour: '2-digit',
   minute: '2-digit',
   hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const day = DAYS.indexOf(part('weekday'));
  const minute = Number(part('hour')) * 60 + Number(part('minute'));
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return day < 0 || !Number.isFinite(minute) || !DATE.test(date) ? null : { day, minute, date };
 } catch {
  return null;
 }
}

// '2026-12-25' plus some days, still a date. UTC only so a daylight saving
// shift can't move it: it is a calendar date, not a moment.
function addDays(date, days) {
 const moved = new Date(`${date}T00:00:00Z`);
 moved.setUTCDate(moved.getUTCDate() + days);
 return moved.toISOString().slice(0, 10);
}

// Days that aren't the week's, as the studio keeps them (Site details'
// `closedDays`): [{ from, to, note, open?, close? }], `to` the same as `from`
// for one day. With both `open` and `close` a span is special hours (those
// days open at different times); without, the business is shut.
function goodSpan(span) {
 return DATE.test(span?.from ?? '') && DATE.test(span?.to ?? '') && span.from <= span.to;
}

export function isSpecialHours(span) {
 return TIME.test(String(span?.open ?? '')) && TIME.test(String(span?.close ?? ''));
}

// The closed span a date falls in, or null. Special hours aren't closed.
export function closedOn(closedDays, date) {
 if (!Array.isArray(closedDays)) return null;
 return closedDays.find((span) => goodSpan(span) && !isSpecialHours(span) && span.from <= date && date <= span.to) ?? null;
}

// The special-hours span a date falls in, or null.
export function specialOn(closedDays, date) {
 if (!Array.isArray(closedDays)) return null;
 return closedDays.find((span) => goodSpan(span) && isSpecialHours(span) && span.from <= date && date <= span.to) ?? null;
}

// 'Dec 25', 'Dec 25 and 26', 'Dec 24 – 26', 'Dec 30 – Jan 2'.
function spanWords({ from, to }) {
 const name = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
 const day = (date) => Number(date.slice(8));
 if (from === to) return `${name(from)} ${day(from)}`;
 if (name(from) !== name(to)) return `${name(from)} ${day(from)} – ${name(to)} ${day(to)}`;
 return `${name(from)} ${day(from)}${addDays(from, 1) === to ? ' and ' : ' – '}${day(to)}`;
}

// 'Thu Dec 25'.
function dayWords(date) {
 const when = new Date(`${date}T00:00:00Z`);
 const part = (options) => when.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
 return `${part({ weekday: 'short' })} ${part({ month: 'short' })} ${when.getUTCDate()}`;
}

// The closed days a visitor should hear about now: those covering today or
// starting in the next 45 days, in order, as [{ words: 'Dec 25 and 26', note }].
// Special hours aren't closures. Empty without a zone this browser knows
// (better absent than wrong).
export function upcomingClosures(closedDays, timezone, now = new Date(), within = 45) {
 const local = localTime(timezone, now);
 if (!local || !Array.isArray(closedDays)) return [];
 const last = addDays(local.date, within);
 return closedDays
  .filter((span) => goodSpan(span) && !isSpecialHours(span) && span.to >= local.date && span.from <= last)
  .map((span) => ({ words: spanWords(span), note: typeof span.note === 'string' ? span.note.trim() : '' }));
}

// Every day that isn't the week's, closed or special hours, covering today
// or starting within `within` days, soonest first, each with the line a
// visitor reads:
//   { from, to, closed: true, today: false, note, line: 'Closed Thu Dec 25 (Christmas)' }
//   { …, closed: false, line: 'Thu Dec 24: 9:00 am – 2:00 pm (Christmas Eve)' }
// One covering today reads 'Closed today', 'Closed through Sat Dec 26' or
// 'Today: 9:00 am – 2:00 pm'. Empty without a zone this browser knows.
export function upcomingSpecialDays(closedDays, timezone, now = new Date(), within = 45) {
 const local = localTime(timezone, now);
 if (!local || !Array.isArray(closedDays)) return [];
 const last = addDays(local.date, within);
 return closedDays
  .filter((span) => goodSpan(span) && span.to >= local.date && span.from <= last)
  .sort((a, b) => a.from.localeCompare(b.from))
  .map((span) => {
   const closed = !isSpecialHours(span);
   const today = span.from <= local.date;
   const note = typeof span.note === 'string' ? span.note.trim() : '';
   const range = span.from === span.to ? dayWords(span.from) : `${dayWords(span.from)} – ${dayWords(span.to)}`;
   const through = span.to === local.date ? '' : dayWords(span.to);
   const when = closed
    ? today ? (through ? `Closed through ${through}` : 'Closed today') : `Closed ${range}`
    : `${today ? (through ? `Through ${through}` : 'Today') : range}: ${formatTime(span.open)} – ${formatTime(span.close)}`;
   return { from: span.from, to: span.to, closed, today, note, line: note ? `${when} (${note})` : when };
  });
}

// The header's automatic notice (Site details' `notice`): the soonest
// closure covering today or starting within `within` days, as one line, or ''.
export function closureNotice(closedDays, timezone, now = new Date(), within = 7) {
 return upcomingSpecialDays(closedDays, timezone, now, within).find((day) => day.closed)?.line ?? '';
}

// A close at or before the open runs past midnight. Open and close at the
// same time is the whole day.
function allDay(row) {
 return row.open === row.close;
}

function overnight(row) {
 return row.close <= row.open;
}

// The row a date keeps: a closed span shuts it, special hours replace the
// week's, else the week's own row for that weekday.
function rowOn(rows, closedDays, date, weekday) {
 if (closedOn(closedDays, date)) return { closed: true };
 const special = specialOn(closedDays, date);
 if (special) return { closed: false, open: toMinutes(special.open), close: toMinutes(special.close), openAt: special.open, closeAt: special.close };
 return rows[weekday];
}

// The first opening from `from` days ahead: { open: false, opens, label }.
// A week of closed days, or a closed span longer than a week, is plain 'Closed'.
function nextOpening(rows, local, closedDays, from) {
 for (let ahead = from; ahead <= 7; ahead += 1) {
  const day = (local.day + ahead) % 7;
  const row = rowOn(rows, closedDays, addDays(local.date, ahead), day);
  if (row.closed || (ahead === 0 && local.minute >= row.open)) continue;
  const time = formatTime(row.openAt);
  return { open: false, opens: { day: DAYS[day], time: row.openAt }, label: `Closed · opens ${ahead === 0 ? time : `${DAYS[day]} ${time}`}` };
 }
 return { open: false, opens: null, label: 'Closed' };
}

// Whether the business is open at `now`, in its own time zone:
//   { open: true, until: '17:00', label: 'Open until 5:00 pm' }
//   { open: false, opens: { day: 'Mon', time: '09:00' }, label: 'Closed · opens Mon 9:00 am' }
// `until` is null for a day open around the clock, `opens` null for a week
// with no opening. null means it can't be said: no hours, or no zone a
// browser knows. Better absent than wrong. A closed day (`closedDays`, see
// closedOn) beats the week: { open: false, label: 'Closed today · Merry
// Christmas' }, and the next opening skips such days. A special-hours day
// (specialOn) keeps its own times in place of the week's.
export function openNow(hours, timezone, now = new Date(), closedDays = []) {
 const rows = readRows(hours);
 const local = localTime(timezone, now);
 if (!rows || !local) return null;
 const shut = closedOn(closedDays, local.date);
 const today = rowOn(rows, closedDays, local.date, local.day);
 const yesterday = rowOn(rows, closedDays, addDays(local.date, -1), (local.day + 6) % 7);

 if (shut) {
  const note = typeof shut.note === 'string' ? shut.note.trim() : '';
  // The label is the closure's own; `opens` still says when it is over.
  return { open: false, opens: nextOpening(rows, local, closedDays, 1).opens, label: note ? `Closed today · ${note}` : 'Closed today' };
 }

 if (!today.closed) {
  const started = local.minute >= today.open;
  if (started && allDay(today)) return { open: true, until: null, label: 'Open now' };
  if (started && (overnight(today) || local.minute < today.close)) {
   return { open: true, until: today.closeAt, label: `Open until ${formatTime(today.closeAt)}` };
  }
 }
 // Last night's hours, still running.
 if (!yesterday.closed && overnight(yesterday) && !allDay(yesterday) && local.minute < yesterday.close) {
  return { open: true, until: yesterday.closeAt, label: `Open until ${formatTime(yesterday.closeAt)}` };
 }

 return nextOpening(rows, local, closedDays, 0);
}

// Today's date ('2026-12-25') in a time zone, or '' for one this browser
// doesn't know.
export function siteToday(timezone, now = new Date()) {
 return localTime(timezone, now)?.date ?? '';
}
