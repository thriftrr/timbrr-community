// node scripts/check-languages.mjs — what the site draws for Languages (the
// studio's docs/languages.md): the switcher's list, hreflang links and the
// first-visit banner's choice. Pure, no Nuxt.
import assert from 'node:assert/strict';
import { alternateLinks, bannerFor, languageList } from '../app/utils/languages.js';

const list = languageList([
 { code: 'en', label: 'EN', href: '/menu', current: true, banner: '' },
 { code: 'es', label: 'ES', href: '/es/menu', current: false, banner: 'Este sitio también está en español.' },
 { code: 'fr', label: 'FR', href: 'https://evil.example/', banner: 'x' },
 { code: '<x>', label: 'X', href: '/x' },
]);
assert.deepEqual(list.map((one) => one.code), ['en', 'es'], 'only codes and paths on this site');
assert.deepEqual(languageList([{ code: 'en', label: 'EN', href: '/' }]), [], 'one language: no switcher');
assert.deepEqual(languageList(undefined), [], 'an older studio: nothing');

assert.equal(bannerFor(list, ['es-MX', 'en'])?.code, 'es', 'es-MX finds es');
assert.equal(bannerFor(list, ['en-US', 'es']), null, 'the first preferred language is this page’s: no banner');
assert.equal(bannerFor(list, ['de']), null, 'not one of ours');
assert.equal(bannerFor([list[0], { ...list[1], banner: '' }], ['es']), null, 'a blank line is no banner');
assert.equal(bannerFor(list.map((one) => ({ ...one, current: one.code === 'es' })), ['es']), null, 'already there');

const links = alternateLinks([{ lang: 'en', path: '/menu' }, { lang: 'es', path: '/es/menu' }], 'https://bakery.example');
assert.deepEqual(links, [
 { rel: 'alternate', hreflang: 'en', href: 'https://bakery.example/menu' },
 { rel: 'alternate', hreflang: 'es', href: 'https://bakery.example/es/menu' },
 { rel: 'alternate', hreflang: 'x-default', href: 'https://bakery.example/menu' },
]);
assert.deepEqual(alternateLinks([{ lang: 'en', path: '/menu' }], 'https://x.example'), [], 'one version: none');
assert.deepEqual(alternateLinks([{ lang: 'en', path: '//evil' }, { lang: 'es', path: '/es' }], 'https://x.example'), [], 'a bad path is dropped');
console.log('check-languages: all passed');
