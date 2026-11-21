// Checks the plain parts of a Collection list drawn as rows or people, and the
// query it asks the studio with (docs/README.md § Collections):
//   node layer/scripts/check-collection-rows.mjs
// Fields found by name, dates and places in words, months as filters, the
// sentences of an empty list, and several answers of one field as a filter.
import assert from 'node:assert/strict';
import { askedWords, dateParts, dropWords, entryHref, facetMonths, findField, insteadWords, monthLabels, monthOf, monthRange, neededKeys, noneFound, placesWords, rowButtonWords, rowKeys, sortOptions, whenWords } from '../app/utils/collection-rows.js';

// The query builder is Nuxt-free in what it reads, but sits in a composable file.
globalThis.useState = () => ({ value: null });
const source = await import('../app/composables/collections.js').catch(() => null);

const fields = [
 { key: 'starts', label: 'Date', kind: 'datetime' },
 { key: 'ends', label: 'Finishes', kind: 'time' },
 { key: 'teacher', label: 'Teacher', kind: 'relation' },
 { key: 'price', label: 'Price', kind: 'number' },
 { key: 'places', label: 'Places', kind: 'number' },
 { key: 'photo', label: 'Photo', kind: 'image' },
 { key: 'more', label: 'Booking link', kind: 'link' },
];

const cases = {
 'a field is found by its name or its key, in any case': () => {
  assert.equal(findField(fields, ' PRICE ').key, 'price');
  assert.equal(findField(fields, 'starts').key, 'starts');
  assert.equal(findField(fields, 'nothing'), undefined);
  assert.equal(findField(fields, ''), undefined);
 },
 'a row draws the fields it names; a picture and a date default to the first of their kind': () => {
  const keys = rowKeys({ row_price: 'price', row_places: 'Places', row_line: ['Teacher', 'Nope'], row_link: 'Booking link', row_end: 'Finishes' }, fields);
  assert.deepEqual(keys, { picture: 'photo', date: 'starts', end: 'ends', price: 'price', places: 'places', link: 'more', line: ['teacher'] });
  assert.deepEqual(rowKeys({}, []), { picture: '', date: '', end: '', price: '', places: '', link: '', line: [] });
  assert.deepEqual(neededKeys(keys), ['photo', 'starts', 'ends', 'price', 'places', 'more', 'teacher']);
 },
 'a date line in words, with its end': () => {
  assert.equal(whenWords('2026-12-05T10:00'), 'Sat Dec 5 · 10:00');
  assert.equal(whenWords('2026-12-05T10:00', '14:00'), 'Sat Dec 5 · 10:00 – 14:00');
  assert.equal(whenWords('2026-12-05T10:00', '2026-12-05T13:30'), 'Sat Dec 5 · 10:00 – 13:30');
  assert.equal(whenWords('2026-12-05T10:00', '2026-12-06T13:30'), 'Sat Dec 5 · 10:00');
  assert.equal(whenWords('2026-12-05'), 'Sat Dec 5');
  assert.equal(whenWords('soon'), '');
  assert.deepEqual(dateParts('2027-01-09T10:00'), { year: 2027, month: 1, day: 9, time: '10:00' });
 },
 'places left: a number says how many, 0 says Full, anything else says nothing': () => {
  assert.deepEqual(placesWords(8), { full: false, left: 8, words: '8 places left' });
  assert.equal(placesWords('1').words, '1 place left');
  assert.deepEqual(placesWords(0), { full: true, left: 0, words: 'Full' });
  assert.equal(placesWords(-2).full, true);
  assert.equal(placesWords(''), null);
  assert.equal(placesWords('{places}'), null);
  assert.equal(placesWords(null), null);
 },
 'months: a heading, a filter and the options from a date field\'s answers': () => {
  assert.equal(monthOf('2027-01-09T10:00'), '2027-01');
  assert.deepEqual(monthLabels(['2026-12', '2027-01']), { '2026-12': 'December', '2027-01': 'January' });
  assert.deepEqual(monthLabels(['2026-01', '2027-01']), { '2026-01': 'January 2026', '2027-01': 'January 2027' });
  assert.deepEqual(monthRange('2027-02'), { from: '2027-02-01', to: '2027-02-28t99' });
  assert.equal(monthRange('2028-02').to, '2028-02-29t99');
  assert.ok('2027-01-31t23:59' <= monthRange('2027-01').to && '2027-02-01' > monthRange('2027-01').to && '2027-01-31' <= monthRange('2027-01').to);
  const rows = [{ value: '2026-12-05t10:00', count: 1 }, { value: '2026-12-05t14:00', count: 1 }, { value: '2027-01-09t10:00', count: 2 }, { value: 'never' }];
  assert.deepEqual(facetMonths(rows), [{ value: '2026-12', label: 'December', count: 2 }, { value: '2027-01', label: 'January', count: 2 }]);
 },
 'the orders on offer follow the fields a row names': () => {
  const keys = rowKeys({ row_price: 'price' }, fields);
  assert.deepEqual(sortOptions(keys, fields).map((one) => one.value), ['date', 'date_desc', 'price', 'price_desc', 'title']);
  assert.deepEqual(sortOptions({ date: '', price: '' }, fields).map((one) => one.value), ['title']);
 },
 'an address typed with a token stays on the site\'s own lower-case paths': () => {
  assert.equal(entryHref('/classes/category/Bread'), '/classes/category/bread');
  assert.equal(entryHref('/classes/category/Sweet Bread'), '/classes/category/sweet-bread');
  assert.equal(entryHref('https://Example.com/A'), 'https://Example.com/A');
  assert.equal(entryHref('/a?b=C'), '/a?b=C');
 },
 'a person\'s link says their first name': () => {
  assert.equal(rowButtonWords('More about [name]', 'Mara Quinn'), 'More about Mara');
  assert.equal(rowButtonWords('See [title]', 'Mara Quinn'), 'See Mara Quinn');
 },
 'an empty list says what was asked, what there is instead and how to loosen it': () => {
  const level = { kind: 'choice', ui: 'select', name: 'Level', answer: ['Beginner'] };
  const bread = { kind: 'choice', ui: 'buttons', name: 'Category', answer: ['Bread'] };
  const january = { kind: 'month', answer: ['January'] };
  const active = [bread, level, january];
  assert.equal(noneFound(active, 'classes'), 'No Beginner Bread classes in January.');
  assert.equal(noneFound([bread], 'classes'), 'No Bread classes.');
  assert.equal(askedWords([{ ...bread, answer: ['Bread', 'Pastry'] }], 'classes'), 'Bread or Pastry classes');
  assert.equal(insteadWords(active, level, 2, 'classes', 'class'), 'There are 2 Bread classes in January, just not Beginner ones.');
  assert.equal(insteadWords(active, january, 1, 'classes', 'class'), 'There is 1 Beginner Bread class, just not in January.');
  assert.equal(dropWords(active, level, 'classes'), 'Show every level in January');
  assert.equal(dropWords(active, january, 'classes'), 'Show Beginner Bread classes in any month');
 },
 'several answers of one field go out as one filter; one answer stays an answer': () => {
  if (!source) return 'skipped';
  const choices = [{ field: 'category', ui: 'buttons' }, { field: 'level', ui: 'select' }];
  const query = source.collectionQuery({ collection: 'classes', choices, filters: [{ field: 'starts', op: 'gte', value: 'today' }] }, { answers: { category: 'a|b', level: 'c' } });
  assert.deepEqual(query.f, ['starts:gte:today', 'category:in:a|b']);
  assert.equal(query['c.level'], 'c');
  assert.equal('c.category' in query, false);
  assert.equal(query.facets, 'category,level');
 },
};

let failed = false;
for (const [name, run] of Object.entries(cases)) {
 try {
  const said = await run();
  console.log(`  ✓ ${name}${said ? ` (${said})` : ''}`);
 } catch (error) {
  failed = true;
  console.log(`  ✗ ${name}\n    ${error.message.split('\n').join('\n    ')}`);
 }
}
console.log(failed ? 'check-collection-rows: FAILED' : 'check-collection-rows: ok');
process.exit(failed ? 1 : 0);
