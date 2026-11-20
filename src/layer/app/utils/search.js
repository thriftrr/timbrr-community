// Site search in the browser (the studio's docs/search.md, "Site"): the
// owner's settings as the page brings them, the names a kind or a filter
// shows, hits in groups, and the searches kept on this device.

const OPENS = ['popup', 'page'];

// `site.search` from the studio, { on, opens, suggestions }; an older studio
// sends none, which is off.
export function searchSettings(value) {
 const from = value && typeof value === 'object' ? value : {};
 return {
  on: from.on === true,
  opens: OPENS.includes(from.opens) ? from.opens : 'popup',
  suggestions: (Array.isArray(from.suggestions) ? from.suggestions : [])
   .filter((words) => typeof words === 'string' && words.trim())
   .map((words) => words.trim().slice(0, 60))
   .slice(0, 5),
 };
}

// A key or a value's slug as words: classes → Classes, day-pass → Day pass.
export const slugWords = (slug) => {
 const words = String(slug ?? '').replace(/[-_]+/g, ' ').trim();
 return words.charAt(0).toUpperCase() + words.slice(1);
};

// The name a kind goes by, in a tab or over a group: the studio's name for
// it when the answer has one (`kinds`), else its key in words.
export const kindName = (kind, answer) => answer?.kinds?.[kind] || (kind === 'page' ? 'Pages' : slugWords(kind));

// Hits grouped by kind, each group in the order its first hit came.
export function groupHits(hits) {
 const groups = [];
 for (const hit of Array.isArray(hits) ? hits : []) {
  let group = groups.find((entry) => entry.kind === hit.kind);
  if (!group) groups.push((group = { kind: hit.kind, hits: [] }));
  group.hits.push(hit);
 }
 return groups;
}

// A hit's date as a tile: { day: '14', month: 'Nov' }, or null.
export function dateTile(date) {
 const when = typeof date === 'string' ? new Date(date) : null;
 if (!when || Number.isNaN(when.getTime())) return null;
 return { day: String(when.getUTCDate()), month: when.toLocaleString('en', { month: 'short', timeZone: 'UTC' }) };
}

// Recent searches, on this device only. Storage can be off or full; then
// there are none and nothing is kept.
const RECENT = 'tb-search-recent';
const RECENT_MOST = 5;
export function recentSearches() {
 try {
  const list = JSON.parse(localStorage.getItem(RECENT) ?? '[]');
  return Array.isArray(list) ? list.filter((words) => typeof words === 'string').slice(0, RECENT_MOST) : [];
 } catch {
  return [];
 }
}
function keepRecent(list) {
 try {
  localStorage.setItem(RECENT, JSON.stringify(list.slice(0, RECENT_MOST)));
 } catch {
  // not kept
 }
 return recentSearches();
}
export const rememberSearch = (words) => {
 const q = String(words ?? '').trim().slice(0, 100);
 return q.length >= 2 ? keepRecent([q, ...recentSearches().filter((one) => one.toLowerCase() !== q.toLowerCase())]) : recentSearches();
};
export const forgetSearch = (words) => keepRecent(recentSearches().filter((one) => one !== words));
