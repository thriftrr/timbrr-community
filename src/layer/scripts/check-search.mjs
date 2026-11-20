// Checks site search's plain parts with no build, server or studio: what
// the site's /__timbrr/search sends the studio (server/utils/site-search.js)
// and the browser's helpers (app/utils/search.js).
//   node layer/scripts/check-search.mjs
import { deepEqual, equal } from 'node:assert/strict';

const { siteSearchParams, tidyWords, emptySiteSearch } = await import('../server/utils/site-search.js');
const { searchSettings, slugWords, kindName, groupHits, dateTile, recentSearches, rememberSearch, forgetSearch } = await import('../app/utils/search.js');

// ── What the studio is asked ──
equal(tidyWords('  Day   PASS '), 'day pass');
equal(tidyWords(['x']), '');
equal(tidyWords('a'.repeat(150)).length, 100);
// Lists sorted and deduped, comma or repeated; filters kept only when they look like keys and values; the same search is one address.
equal(String(siteSearchParams({ q: 'Boulder', kind: ['classes,page', 'page'], level: ['intermediate', 'beginner'], sort: 'newest', page: '2', per: '8' })), 'q=boulder&kind=classes&kind=page&level=beginner&level=intermediate&sort=newest&page=2&per=8');
equal(String(siteSearchParams({ q: 'x', kind: 'Bad Key', 'no-good': 'a', level: '<b>', sort: 'oldest', page: '999', per: '100', facets: 'false' })), 'q=x&page=50&per=20&facets=false');
// The old block's own parameters are never taken for filters.
equal(String(siteSearchParams({ q: 'x', limit: '5', p: '2', collections: 'a', v: '2' })), 'q=x&page=1&per=20');
deepEqual(emptySiteSearch('a').hits, []);

// ── The owner's settings, as the page brings them ──
deepEqual(searchSettings(undefined), { on: false, opens: 'popup', suggestions: [] });
deepEqual(searchSettings({ on: true, opens: 'page', suggestions: [' Hours ', '', 3, 'a', 'b', 'c', 'd', 'e'] }), { on: true, opens: 'page', suggestions: ['Hours', 'a', 'b', 'c', 'd'] });
equal(searchSettings({ on: 'yes', opens: 'drawer' }).on, false);
equal(searchSettings({ opens: 'drawer' }).opens, 'popup');

// ── Names and groups ──
equal(slugWords('day-pass_prices'), 'Day pass prices');
equal(kindName('page'), 'Pages');
equal(kindName('classes'), 'Classes');
equal(kindName('classes', { kinds: { classes: 'Lessons' } }), 'Lessons');
deepEqual(
 groupHits([{ kind: 'page', id: 1 }, { kind: 'classes', id: 2 }, { kind: 'page', id: 3 }]).map((group) => [group.kind, group.hits.map((hit) => hit.id)]),
 [['page', [1, 3]], ['classes', [2]]],
);
deepEqual(groupHits(null), []);
deepEqual(dateTile('2026-11-14T18:00:00Z'), { day: '14', month: 'Nov' });
equal(dateTile('soon'), null);
equal(dateTile(null), null);

// ── Recent searches: this device only, newest first, five at most ──
const kept = new Map();
globalThis.localStorage = { getItem: (key) => kept.get(key) ?? null, setItem: (key, value) => kept.set(key, value) };
deepEqual(recentSearches(), []);
for (const words of ['one', 'two', 'three', 'four', 'five', 'six']) rememberSearch(words);
deepEqual(recentSearches(), ['six', 'five', 'four', 'three', 'two']);
deepEqual(rememberSearch('FOUR'), ['FOUR', 'six', 'five', 'three', 'two']);
deepEqual(rememberSearch('x'), ['FOUR', 'six', 'five', 'three', 'two']); // under two letters isn't kept
deepEqual(forgetSearch('six'), ['FOUR', 'five', 'three', 'two']);
// Storage off (a private window, blocked): nothing, and nothing thrown.
globalThis.localStorage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
deepEqual(rememberSearch('boulder'), []);
kept.set('tb-search-recent', '{"not":"a list"}');
globalThis.localStorage = { getItem: (key) => kept.get(key) ?? null, setItem: () => {} };
deepEqual(recentSearches(), []);

console.log('check-search: ok');
