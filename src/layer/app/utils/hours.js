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

// Whole days the business is shut whatever the week says, as the studio
// keeps them: [{ from, to, note }], to the same as from for one day. The
// span a date falls in, or null.
export function closedOn(closedDays, date) {
 if (!Array.isArray(closedDays)) return null;
 return closedDays.find((span) => DATE.test(span?.from ?? '') && DATE.test(span?.to ?? '') && span.from <= date && date <= span.to) ?? null;
}

// 'Dec 25', 'Dec 25 and 26', 'Dec 24 – 26', 'Dec 30 – Jan 2'.
function spanWords({ from, to }) {
 const name = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
 const day = (date) => Number(date.slice(8));
 if (from === to) return `${name(from)} ${day(from)}`;
 if (name(from) !== name(to)) return `${name(from)} ${day(from)} – ${name(to)} ${day(to)}`;
 return `${name(from)} ${day(from)}${addDays(from, 1) === to ? ' and ' : ' – '}${day(to)}`;
}

// The closed days a visitor should hear about now: those covering today or
// starting in the next 45 days, in order, as [{ words: 'Dec 25 and 26', note }]. Empty without a zone this browser knows (better absent than wrong).
export function upcomingClosures(closedDays, timezone, now = new Date(), within = 45) {
 const local = localTime(timezone, now);
 if (!local || !Array.isArray(closedDays)) return [];
 const last = addDays(local.date, within);
 return closedDays
  .filter((span) => DATE.test(span?.from ?? '') && DATE.test(span?.to ?? '') && span.to >= local.date && span.from <= last)
  .map((span) => ({ words: spanWords(span), note: typeof span.note === 'string' ? span.note.trim() : '' }));
}

// A close at or before the open runs past midnight. Open and close at the
// same time is the whole day.
function allDay(row) {
 return row.open === row.close;
}

function overnight(row) {
 return row.close <= row.open;
}

// The first opening from `from` days ahead: { open: false, opens, label }.
// A week of closed days, or a closed span longer than a week, is plain 'Closed'.
function nextOpening(rows, local, awake, from) {
 for (let ahead = from; ahead <= 7; ahead += 1) {
  const day = (local.day + ahead) % 7;
  const row = rows[day];
  if (row.closed || (ahead === 0 && local.minute >= row.open) || !awake(ahead)) continue;
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
// Christmas' }, and the next opening skips such days.
export function openNow(hours, timezone, now = new Date(), closedDays = []) {
 const rows = readRows(hours);
 const local = localTime(timezone, now);
 if (!rows || !local) return null;
 const shut = closedOn(closedDays, local.date);
 const today = rows[local.day];
 const yesterday = rows[(local.day + 6) % 7];
 const awake = (ahead) => !closedOn(closedDays, addDays(local.date, ahead));

 if (shut) {
  const note = typeof shut.note === 'string' ? shut.note.trim() : '';
  // The label is the closure's own; `opens` still says when it is over.
  return { open: false, opens: nextOpening(rows, local, awake, 1).opens, label: note ? `Closed today · ${note}` : 'Closed today' };
 }

 if (!today.closed) {
  const started = local.minute >= today.open;
  if (started && allDay(today)) return { open: true, until: null, label: 'Open now' };
  if (started && (overnight(today) || local.minute < today.close)) {
   return { open: true, until: today.closeAt, label: `Open until ${formatTime(today.closeAt)}` };
  }
 }
 // Last night's hours, still running.
 if (!yesterday.closed && awake(-1) && overnight(yesterday) && !allDay(yesterday) && local.minute < yesterday.close) {
  return { open: true, until: yesterday.closeAt, label: `Open until ${formatTime(yesterday.closeAt)}` };
 }

 return nextOpening(rows, local, awake, 0);
}
