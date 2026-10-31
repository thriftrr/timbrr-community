// Checks what schema/frames.js works out, with no build and no Vue:
//   node layer/scripts/check-frames.mjs
// Prints one line per group, or the first problem and exits 1.
import { deepEqual, equal, ok } from 'node:assert/strict';
import {
 FOOTER_DEFAULTS,
 HEADER_DEFAULTS,
 addressLines,
 footerData,
 footerFromSite,
 groupHours,
 headerData,
 headerFromSite,
 headerSchema,
 megaColumns,
 navItem,
 navList,
 telHref,
 upgradeFooter,
 upgradeHeader,
} from '../schema/frames.js';

const GROUPS = {
 'defaults': () => {
  equal(HEADER_DEFAULTS.layout, 'left');
  equal(HEADER_DEFAULTS.sticky, 'never');
  equal(HEADER_DEFAULTS.transparent, false);
  equal(HEADER_DEFAULTS.phone.style, 'accordion');
  deepEqual(HEADER_DEFAULTS.logo, { src: '', alt: '' });
  deepEqual(HEADER_DEFAULTS.icons.phone, { on: false });
  deepEqual(HEADER_DEFAULTS.icons.language, { on: false, to: '', label: '' });
  equal(FOOTER_DEFAULTS.layout, 'columns');
  deepEqual(FOOTER_DEFAULTS.newsletter, { on: false, headline: '', label: '', to: '' });
  deepEqual(FOOTER_DEFAULTS.contact, { hours: false, address: false, phone: false });
  deepEqual(FOOTER_DEFAULTS.legal_links, []);
 },

 'upgradeHeader, old shapes': () => {
  const menu = [{ label: 'Visit', kind: 'page', to: '/visit', layout: 'mega', children: [{ label: 'Hours', to: '/hours' }] }];
  const classic = upgradeHeader({ style: 'classic', menu, cta: { label: 'Book', to: '/book' }, bar: '' });
  equal(classic.layout, 'left');
  deepEqual(classic.menu, menu);
  deepEqual(classic.primary, { label: 'Book', to: '/book' });
  deepEqual(classic.announce, { on: false, text: '', to: '' });
  ok(!('style' in classic) && !('cta' in classic) && !('bar' in classic));

  equal(upgradeHeader({ style: 'minimal', menu: [] }).layout, 'left');

  const bar = upgradeHeader({ style: 'bar', menu: [], cta: { label: '', to: '' }, bar: 'Closed Monday' });
  equal(bar.layout, 'left');
  deepEqual(bar.announce, { on: true, text: 'Closed Monday', to: '' });

  // Words typed while the style was something else aren't thrown away.
  deepEqual(upgradeHeader({ style: 'classic', bar: 'Spare words' }).announce, { on: false, text: 'Spare words', to: '' });

  // Every key of the new shape is there.
  deepEqual(Object.keys(classic).sort(), Object.keys(HEADER_DEFAULTS).sort());
  ok(headerSchema.safeParse(classic).success);

  // Only one of the old keys is enough to tell, and a broken one is dropped.
  deepEqual(upgradeHeader({ cta: { label: 'Go', to: '/go' } }).primary, { label: 'Go', to: '/go' });
  deepEqual(upgradeHeader({ bar: 12, cta: 'nope', menu: 'nope' }).primary, { label: '', to: '' });
  deepEqual(upgradeHeader({ bar: 12, cta: 'nope', menu: 'nope' }).menu, []);
 },

 'upgradeHeader, new shapes and idempotence': () => {
  const fresh = { ...HEADER_DEFAULTS, layout: 'center', announce: { on: true, text: 'Hi', to: '/hi' } };
  equal(upgradeHeader(fresh), fresh);
  const partial = { menu: [{ label: 'A' }] };
  equal(upgradeHeader(partial), partial);
  // `layout` is the mark of the new shape, even beside a leftover old key.
  const mixed = { layout: 'button', style: 'bar', bar: 'Old' };
  equal(upgradeHeader(mixed), mixed);
  for (const old of [{ style: 'classic' }, { style: 'bar', bar: 'x', cta: { label: 'y', to: '/y' } }, { style: 'minimal', menu: [{ label: 'z' }] }, null, 'garbage']) {
   const once = upgradeHeader(old);
   deepEqual(upgradeHeader(once), once);
  }
 },

 'upgradeHeader, garbage': () => {
  for (const garbage of [null, undefined, 0, 12, '', 'header', true, [], [1, 2], () => {}]) {
   deepEqual(upgradeHeader(garbage), HEADER_DEFAULTS);
  }
 },

 'upgradeFooter': () => {
  const columns = [{ label: 'Shop', children: [{ label: 'Beans', to: '/beans' }] }];
  const full = upgradeFooter({ style: 'full', columns, legal: '© Me' });
  equal(full.layout, 'columns');
  deepEqual(full.columns, columns);
  equal(full.legal, '© Me');
  ok(!('style' in full));
  deepEqual(Object.keys(full).sort(), Object.keys(FOOTER_DEFAULTS).sort());

  equal(upgradeFooter({ style: 'slim', columns: [] }).layout, 'slim');
  equal(upgradeFooter({ style: 'nonsense' }).layout, 'columns');
  deepEqual(upgradeFooter({ style: 'full', columns: 'nope', legal: 3 }).columns, []);
  equal(upgradeFooter({ style: 'full', columns: 'nope', legal: 3 }).legal, '');

  const fresh = { ...FOOTER_DEFAULTS, layout: 'centered', legal: 'x' };
  equal(upgradeFooter(fresh), fresh);
  const partial = { columns: [], legal: 'y' };
  equal(upgradeFooter(partial), partial);
  for (const old of [{ style: 'slim' }, { style: 'full', legal: 'x' }, null]) {
   const once = upgradeFooter(old);
   deepEqual(upgradeFooter(once), once);
  }
  for (const garbage of [null, undefined, 0, 'footer', [], true]) deepEqual(upgradeFooter(garbage), FOOTER_DEFAULTS);
 },

 'headerFromSite, footerFromSite': () => {
  const site = {
   nav: [{ label: 'Visit', kind: 'page', to: '/visit' }, 'nope', null, { label: 'Beans', kind: 'none', layout: 'mega', children: [{ label: 'Shop', to: '/shop', desc: 'Weekly' }] }],
   cta: { label: 'Order', kind: 'external', to: 'https://x.test' },
  };
  const header = headerFromSite(site);
  equal(header.layout, 'left');
  equal(header.sticky, 'never');
  deepEqual(header.primary, { label: 'Order', to: 'https://x.test' });
  equal(header.menu.length, 2);
  equal(header.menu[1].layout, 'mega');
  equal(header.menu[1].children[0].desc, 'Weekly');
  ok(headerSchema.safeParse(header).success);

  deepEqual(headerFromSite({ cta: { label: 'Heading', kind: 'none', to: '/not' } }).primary, { label: 'Heading', to: '' });
  for (const nothing of [{}, null, undefined, { nav: 'x', cta: 'y' }]) {
   const empty = headerFromSite(nothing);
   deepEqual(empty.menu, []);
   deepEqual(empty.primary, { label: '', to: '' });
  }
  equal(footerFromSite(site).columns.length, 2);
  deepEqual(footerFromSite(null).columns, []);

  // A long menu is cut, not lost: past the schema's limit the whole list
  // would fall back to its default.
  const long = headerFromSite({ nav: Array.from({ length: 60 }, (_, at) => ({ label: `Item ${at}`, to: '/x' })) });
  equal(headerData(long).menu.length, 40);
  equal(headerData(headerFromSite({ nav: [{ label: 'y'.repeat(500), to: '/x' }] })).menu[0].label.length, 120);
 },

 'navItem': () => {
  const item = navItem({ label: 'A', kind: 'odd', to: '/a', layout: 'link', group: 'G', desc: 'D', extra: 1, children: [{ label: 'B', group: 'H', children: [{ label: 'C' }] }] }, 1);
  equal(item.layout, 'link');
  equal(item.group, 'G');
  equal(item.kind, undefined);
  ok(!('extra' in item));
  equal(item.children[0].group, 'H');
  deepEqual(item.children[0].children, []);
  equal(navItem({ label: 'A', layout: 'odd' }, 0).layout, undefined);
  equal(navList(Array.from({ length: 50 }, () => ({ label: 'x' })), 0).length, 40);
  deepEqual(navList('nope', 1), []);
 },

 'headerData, footerData': () => {
  // Either shape, or garbage, always comes out whole.
  deepEqual(headerData(null), HEADER_DEFAULTS);
  deepEqual(headerData('garbage'), HEADER_DEFAULTS);
  equal(headerData({ style: 'bar', bar: 'Hi' }).announce.text, 'Hi');
  deepEqual(headerData(headerData({ style: 'bar', bar: 'Hi' })), headerData({ style: 'bar', bar: 'Hi' }));
  // One bad value shows its default; the rest stays.
  const mended = headerData({ layout: 'sideways', primary: { label: 'Keep', to: '/keep' }, sticky: 12 });
  equal(mended.layout, 'left');
  equal(mended.sticky, 'never');
  equal(mended.primary.label, 'Keep');
  equal(footerData({ layout: 'slim', social: [{ network: 'myspace', to: 'https://x.test' }, { network: 'x', to: 'https://x.test' }] }).social[1].network, 'x');
  equal(footerData({ style: 'slim', legal: 'x' }).layout, 'slim');
 },

 'megaColumns': () => {
  const links = (count) => Array.from({ length: count }, (_, at) => ({ label: `L${at}` }));
  deepEqual(megaColumns(links(7)).map((column) => column.links.length), [3, 2, 2]);
  deepEqual(megaColumns(links(4)).map((column) => column.links.length), [2, 1, 1]);
  deepEqual(megaColumns(links(2)).map((column) => column.links.length), [1, 1]);
  ok(megaColumns(links(6)).every((column) => column.title === ''));
  deepEqual(megaColumns([]), []);
  deepEqual(megaColumns('nope'), []);

  const grouped = megaColumns([{ label: 'a', group: 'One' }, { label: 'b' }, { label: 'c', group: 'Two' }, { label: 'd', group: ' One ' }, { label: 'e', group: '  ' }]);
  deepEqual(grouped.map((column) => column.title), ['One', 'More', 'Two']);
  deepEqual(grouped[0].links.map((link) => link.label), ['a', 'd']);
  deepEqual(grouped[1].links.map((link) => link.label), ['b', 'e']);
 },

 'telHref': () => {
  equal(telHref('(815) 555-0142'), 'tel:8155550142');
  equal(telHref('+1 815 555 0142'), 'tel:+18155550142');
  equal(telHref('815-555-0142 x12'), 'tel:8155550142');
  equal(telHref('1-800-FLOWERS'), '');
  equal(telHref(''), '');
  equal(telHref(null), '');
 },

 'addressLines': () => {
  deepEqual(addressLines({ street: '1 Main St', city: 'Rockford', region: 'IL', postal: '61101' }), ['1 Main St', 'Rockford, IL 61101']);
  deepEqual(addressLines({ city: 'Rockford' }), ['Rockford']);
  deepEqual(addressLines({ region: 'IL', postal: '61101' }), ['IL 61101']);
  deepEqual(addressLines(null), []);
 },

 'groupHours': () => {
  const open = { closed: false, open: '09:00', close: '17:00' };
  const late = { closed: false, open: '10:00', close: '14:30' };
  const shut = { closed: true, open: '', close: '' };
  deepEqual(groupHours([open, open, open, open, open, late, shut]), [
   { days: 'Mon – Fri', hours: '9:00 am – 5:00 pm' },
   { days: 'Sat', hours: '10:00 am – 2:30 pm' },
   { days: 'Sun', hours: 'Closed' },
  ]);
  deepEqual(groupHours([open, shut, open, open, open, shut, shut]), [
   { days: 'Mon, Wed – Fri', hours: '9:00 am – 5:00 pm' },
   { days: 'Tue, Sat, Sun', hours: 'Closed' },
  ]);
  deepEqual(groupHours([shut, shut, shut, shut, shut, open, open])[1].days, 'Sat, Sun');
  equal(groupHours([{ open: '00:00', close: '12:00' }])[0].hours, '12:00 am – 12:00 pm');
  deepEqual(groupHours([]), []);
  deepEqual(groupHours(null), []);
  deepEqual(groupHours(['x', { open: '9', close: 'late' }]), []);
 },
};

let failed = false;
for (const [name, run] of Object.entries(GROUPS)) {
 try {
  run();
  console.log(`ok  ${name}`);
 } catch (error) {
  failed = true;
  console.error(`FAIL ${name}: ${error.message}`);
 }
}
if (failed) process.exit(1);
