// Checks the structured data (JSON-LD) the site's pages carry, without a build:
//   node layer/scripts/check-listing.mjs
// Prints one line per case, or the first problem and exits 1.
import assert from 'node:assert/strict';
import { businessNode, jsonLdText, listingGraph, listingType, openingHours, specialHours } from '../app/utils/listing.js';

const ORIGIN = 'https://harbourbakery.com';
const NOW = new Date('2026-12-20T16:00:00Z'); // Sunday Dec 20 in Chicago
const open = (from, to) => ({ closed: false, open: from, close: to });
const closed = { closed: true, open: '09:00', close: '17:00' };
const week = [open('07:30', '16:00'), open('07:30', '16:00'), open('07:30', '16:00'), open('07:30', '16:00'), open('07:30', '16:00'), open('08:00', '14:00'), closed];
const details = {
 phone: '(815) 555-0142',
 email: 'hello@harbourbakery.com',
 street: '214 Main Street',
 city: 'Galena',
 region: 'IL',
 postal: '61036',
 country: 'US',
 timezone: 'America/Chicago',
 priceRange: '$$',
 hours: week,
 social: { instagram: 'https://instagram.com/harbourbakery' },
 closedDays: [
  { from: '2026-12-01', to: '2026-12-02', note: 'past' },
  { from: '2026-12-24', to: '2026-12-24', note: 'Christmas Eve', open: '09:00', close: '14:00' },
  { from: '2026-12-25', to: '2026-12-26', note: 'Christmas' },
 ],
};
const site = { name: 'Harbour Bakery', listing: { type: 'Bakery' }, details, brand: { logo: { src: '/media/logo.png' } }, nav: [{ label: 'About', to: '/about' }] };

const cases = {
 'the studio picks the type': () => {
  assert.equal(listingType(site), 'Bakery');
  assert.equal(listingType({ ...site, listing: { type: 'bad type<' } }), 'LocalBusiness');
 },
 'without a type: LocalBusiness with a place, Organization without': () => {
  assert.equal(listingType({ name: 'x', details: { phone: '1' } }), 'LocalBusiness');
  assert.equal(listingType({ name: 'x', details: { street: '', city: '' } }), 'Organization');
  assert.equal(listingType({ name: 'x' }), 'Organization');
 },
 'the week groups days with the same hours': () => {
  assert.deepEqual(openingHours(week), [
   { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:30', closes: '16:00' },
   { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '14:00' },
  ]);
  assert.deepEqual(openingHours(Array.from({ length: 7 }, () => open('00:00', '00:00')))[0], { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' });
  assert.deepEqual(openingHours([]), []);
  assert.deepEqual(openingHours([open('nine', '17:00'), ...week.slice(1)]), []);
 },
 'special days that are not over': () => {
  assert.deepEqual(specialHours(details.closedDays, '2026-12-20'), [
   { '@type': 'OpeningHoursSpecification', validFrom: '2026-12-24', validThrough: '2026-12-24', opens: '09:00', closes: '14:00' },
   { '@type': 'OpeningHoursSpecification', validFrom: '2026-12-25', validThrough: '2026-12-26', opens: '00:00', closes: '00:00' },
  ]);
 },
 'the business, whole': () => {
  const node = businessNode({ site, origin: ORIGIN, image: 'https://media.timbrr.app/a/b/share.webp', now: NOW });
  assert.equal(node['@type'], 'Bakery');
  assert.equal(node.url, `${ORIGIN}/`);
  assert.equal(node.logo, `${ORIGIN}/media/logo.png`);
  assert.equal(node.image, 'https://media.timbrr.app/a/b/share.webp');
  assert.equal(node.telephone, '(815) 555-0142');
  assert.deepEqual(node.address, { '@type': 'PostalAddress', streetAddress: '214 Main Street', addressLocality: 'Galena', addressRegion: 'IL', postalCode: '61036', addressCountry: 'US' });
  assert.deepEqual(node.sameAs, ['https://instagram.com/harbourbakery']);
  assert.equal(node.priceRange, '$$');
  assert.equal(node.openingHoursSpecification.length, 2);
  assert.equal(node.specialOpeningHoursSpecification.length, 2);
 },
 'an Organization gets no hours or price': () => {
  const node = businessNode({ site: { name: 'Friends of the Park', details: { email: 'hi@park.org', timezone: 'America/Chicago', priceRange: '$', closedDays: details.closedDays } }, origin: ORIGIN, now: NOW });
  assert.equal(node['@type'], 'Organization');
  assert.equal(node.openingHoursSpecification, undefined);
  assert.equal(node.specialOpeningHoursSpecification, undefined);
  assert.equal(node.priceRange, undefined);
  assert.equal(node.email, 'hi@park.org');
  assert.equal(node.address, undefined, 'nothing without data');
 },
 'the home page: business and WebSite': () => {
  const graph = listingGraph({ site, path: '/', title: 'Home', origin: ORIGIN, now: NOW });
  assert.deepEqual(graph.map((node) => node['@type']), ['Bakery', 'WebSite']);
 },
 'a page with Visit: the business and a breadcrumb': () => {
  const graph = listingGraph({ site, path: '/about/visit', title: 'Visit us', origin: ORIGIN, blocks: [{ type: 'visit' }], now: NOW });
  assert.deepEqual(graph.map((node) => node['@type']), ['Bakery', 'BreadcrumbList']);
  assert.deepEqual(graph[1].itemListElement.map((item) => item.name), ['Harbour Bakery', 'About', 'Visit us']);
 },
 'another page: only a breadcrumb': () => {
  const graph = listingGraph({ site, path: '/menu', title: 'Menu', origin: ORIGIN, blocks: [{ type: 'hero' }], now: NOW });
  assert.deepEqual(graph.map((node) => node['@type']), ['BreadcrumbList']);
  assert.deepEqual(graph[0].itemListElement[1], { '@type': 'ListItem', position: 2, name: 'Menu', item: `${ORIGIN}/menu` });
 },
 'nothing can close the script': () => {
  const graph = listingGraph({ site: { ...site, name: 'Bad</script><script>alert(1)</script> \u2028& co' }, path: '/', origin: ORIGIN, now: NOW });
  const said = jsonLdText(graph);
  assert.ok(!/[<>&\u2028\u2029]/.test(said), said);
  assert.equal(JSON.parse(said)[0].name, 'Bad</script><script>alert(1)</script> \u2028& co');
 },
 'no name, no business': () => {
  assert.equal(businessNode({ site: { details }, origin: ORIGIN }), null);
  assert.deepEqual(listingGraph({ site: {}, path: '/', origin: ORIGIN }), []);
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
