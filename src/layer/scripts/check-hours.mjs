// Checks the hours logic Visit draws from, without a build:
//   node layer/scripts/check-hours.mjs
// Prints one line per case, or the first problem and exits 1. Every time is a
// fixed moment in America/Chicago, which is UTC-5 on the dates below.
import assert from 'node:assert/strict';
import { formatTime, groupHours, openNow } from '../app/utils/hours.js';

const ZONE = 'America/Chicago';
const at = (date, time) => new Date(`${date}T${time}:00-05:00`);
// October 2026: the 26th is a Monday.
const MON = '2026-10-26';
const TUE = '2026-10-27';
const SAT = '2026-10-31';
const SUN = '2026-11-01'; // Still UTC-5 until 2am, and the case below is earlier.

const open = (from, to) => ({ closed: false, open: from, close: to });
const closed = { closed: true, open: '', close: '' };
const week = [open('09:00', '17:00'), open('09:00', '17:00'), open('09:00', '17:00'), open('09:00', '17:00'), open('09:00', '17:00'), open('10:00', '14:00'), closed];
const lateMonday = [open('18:00', '02:00'), closed, closed, closed, closed, closed, closed];
const roundTheClock = Array.from({ length: 7 }, () => open('00:00', '00:00'));

const cases = {
 'a closed day': () => {
  const status = openNow(week, ZONE, at(SUN, '01:00'));
  assert.equal(status.open, false);
  assert.deepEqual(status.opens, { day: 'Mon', time: '09:00' });
  assert.equal(status.label, 'Closed · opens Mon 9:00 am');
 },
 'before opening': () => {
  const status = openNow(week, ZONE, at(MON, '08:59'));
  assert.equal(status.open, false);
  assert.equal(status.label, 'Closed · opens 9:00 am');
 },
 'during opening hours': () => {
  const status = openNow(week, ZONE, at(MON, '09:00'));
  assert.equal(status.open, true);
  assert.equal(status.until, '17:00');
  assert.equal(status.label, 'Open until 5:00 pm');
 },
 'after closing': () => {
  const status = openNow(week, ZONE, at(MON, '17:00'));
  assert.equal(status.open, false);
  assert.equal(status.label, 'Closed · opens Tue 9:00 am');
 },
 'overnight, before midnight': () => {
  const status = openNow(lateMonday, ZONE, at(MON, '23:00'));
  assert.equal(status.open, true);
  assert.equal(status.label, 'Open until 2:00 am');
 },
 'overnight, the morning after': () => {
  assert.equal(openNow(lateMonday, ZONE, at(TUE, '01:59')).open, true);
  assert.equal(openNow(lateMonday, ZONE, at(TUE, '02:00')).open, false);
 },
 'overnight, Sunday into Monday': () => {
  const late = [closed, closed, closed, closed, closed, closed, open('20:00', '01:00')];
  assert.equal(openNow(late, ZONE, at(MON, '00:30')).open, true);
 },
 'open around the clock': () => {
  assert.deepEqual(openNow(roundTheClock, ZONE, at(SAT, '03:00')), { open: true, until: null, label: 'Open now' });
 },
 'the same moment reads differently elsewhere': () => {
  assert.equal(openNow(week, 'Asia/Tokyo', at(MON, '12:00')).open, false);
 },
 'a week with no opening': () => {
  assert.deepEqual(openNow(Array(7).fill(closed), ZONE, at(MON, '12:00')), { open: false, opens: null, label: 'Closed' });
 },
 'an unknown time zone says nothing': () => {
  assert.equal(openNow(week, 'Mars/Olympus_Mons', at(MON, '12:00')), null);
 },
 'no time zone says nothing': () => {
  assert.equal(openNow(week, '', at(MON, '12:00')), null);
 },
 'hours that aren\'t set say nothing': () => {
  assert.equal(openNow([], ZONE, at(MON, '12:00')), null);
  assert.equal(openNow(undefined, ZONE, at(MON, '12:00')), null);
 },
 'a bad row says nothing': () => {
  assert.equal(openNow([open('nine', '17:00'), ...week.slice(1)], ZONE, at(MON, '12:00')), null);
 },
 'times read as they should': () => {
  assert.equal(formatTime('00:00'), '12:00 am');
  assert.equal(formatTime('12:30'), '12:30 pm');
  assert.equal(formatTime('17:05'), '5:05 pm');
  assert.equal(formatTime('25:00'), '');
 },
 'days in a row with the same hours share a line': () => {
  assert.deepEqual(groupHours(week), [
   { title: 'Mon – Fri', body: '9:00 am – 5:00 pm' },
   { title: 'Sat', body: '10:00 am – 2:00 pm' },
   { title: 'Sun', body: 'Closed' },
  ]);
 },
 'the same hours apart stay apart': () => {
  const split = [open('09:00', '17:00'), closed, open('09:00', '17:00'), closed, closed, closed, closed];
  assert.deepEqual(groupHours(split).map((row) => row.title), ['Mon', 'Tue', 'Wed', 'Thu – Sun']);
 },
 'no hours, no lines': () => {
  assert.deepEqual(groupHours([]), []);
 },
};

try {
 for (const [name, check] of Object.entries(cases)) {
  check();
  console.log(`ok  ${name}`);
 }
} catch (error) {
 console.error(`FAIL ${error.message}`);
 process.exit(1);
}
