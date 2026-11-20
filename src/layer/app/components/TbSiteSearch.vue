<script setup>
 // Site search's pop-up (the studio's docs/search.md, "Site"): the header's
 // search icon opens it, and so does `/` anywhere outside a text box. On a
 // phone it's a full-screen sheet. It is a native modal <dialog>, so the page
 // behind can't be reached while it's open, Escape closes it, and focus goes
 // back to whatever opened it.
 //
 // Before typing it shows the owner's suggestions, the searches kept on this
 // device and the site's pages. From the 2nd letter it asks the site's
 // /__timbrr/search, 150 ms after the last key, for the best 8, grouped by
 // kind with a tab per kind. The box is a combobox: ↑↓ move through the
 // results, Enter opens one, or goes to /search?q= with none picked.
 // Everything is drawn with the --site-* variables only.
 import { telHref } from '../../schema/frames.js';

 const props = defineProps({
  site: { type: Object, required: true }, // { name, nav, details, search }
 });
 defineExpose({ open });

 const uid = useId();
 const dialog = ref(null);
 const input = ref(null);
 const typed = ref('');
 const kind = ref(''); // '' is every kind
 const answer = ref(null);
 const counts = ref(null); // { q, total, kinds }: from the search over every kind, for the tabs
 const loading = ref(false);
 const failed = ref(''); // '', 'busy' or 'down'
 const active = ref(-1);
 const recent = ref([]);
 let opener = null;

 const words = computed(() => typed.value.replace(/\s+/g, ' ').trim().slice(0, 100));
 const asking = computed(() => words.value.length >= 2);
 const suggestions = computed(() => props.site.search?.suggestions ?? []);
 const jumps = computed(() => (props.site.nav ?? []).filter((item) => item?.label && safeHref(item.to)?.startsWith('/')).slice(0, 5));
 const phone = computed(() => String(props.site.details?.phone ?? '').trim());
 const email = computed(() => String(props.site.details?.email ?? '').trim());

 const groups = computed(() => {
  let at = 0;
  return groupHits(answer.value?.hits).map((group) => ({ ...group, label: kindName(group.kind, answer.value), rows: group.hits.map((hit) => ({ hit, at: at++ })) }));
 });
 const flat = computed(() => groups.value.flatMap((group) => group.rows.map((row) => row.hit)));
 const total = computed(() => counts.value?.total ?? answer.value?.total ?? 0);
 const tabs = computed(() => {
  const kinds = Object.entries(counts.value?.kinds ?? {});
  if (kinds.length < 2) return [];
  return [{ key: '', label: 'All', n: counts.value.total }, ...kinds.map(([key, n]) => ({ key, label: kindName(key, answer.value), n: Number(n) || 0 }))];
 });
 const found = computed(() => asking.value && answer.value && !failed.value);
 const nothing = computed(() => found.value && !loading.value && !flat.value.length);
 const said = computed(() => {
  if (!asking.value || loading.value) return '';
  if (failed.value) return failed.value === 'busy' ? 'Too many searches. Try again in a minute.' : "Couldn't search right now. Try again in a minute.";
  return total.value ? `${total.value} ${total.value === 1 ? 'result' : 'results'}` : 'No results';
 });
 const seeAll = computed(() => ({ path: '/search', query: { q: words.value, ...(kind.value ? { kind: kind.value } : {}) } }));

 let timer = null;
 let asked = 0;
 // A search is logged once it settles: a second with no typing, or a result
 // opened. Once per words in each opening of the pop-up.
 let settling = null;
 let logged = new Set();
 function settle() {
  clearTimeout(settling);
  const q = words.value.toLowerCase();
  if (q.length < 2 || logged.has(q)) return;
  logged.add(q);
  sendSearchNote('log', q);
 }
 watch(words, (value, before) => {
  if (value === before) return;
  active.value = -1;
  kind.value = '';
  clearTimeout(timer);
  clearTimeout(settling);
  if (asking.value) settling = setTimeout(settle, 1000);
  if (!asking.value) {
   asked++;
   answer.value = counts.value = null;
   failed.value = '';
   loading.value = false;
   return;
  }
  timer = setTimeout(ask, 150);
 });
 watch(kind, () => {
  active.value = -1;
  if (asking.value) ask();
 });

 async function ask() {
  const q = words.value;
  const n = ++asked;
  loading.value = true;
  try {
   const reply = await $fetch('/__timbrr/search', { query: { v: 2, q, per: 8, ...(kind.value ? { kind: kind.value } : {}) }, retry: false });
   if (n !== asked) return;
   answer.value = reply;
   failed.value = '';
   if (!kind.value) counts.value = { q, total: Number(reply?.total) || 0, kinds: reply?.facets?.kind ?? {} };
  } catch (error) {
   if (n !== asked) return;
   answer.value = null;
   failed.value = (error?.statusCode ?? error?.response?.status) === 429 ? 'busy' : 'down';
  } finally {
   if (n === asked) loading.value = false;
  }
 }

 function open(from) {
  if (!dialog.value || dialog.value.open) return;
  opener = from ?? document.activeElement;
  typed.value = '';
  logged = new Set();
  recent.value = recentSearches();
  dialog.value.showModal();
  input.value?.focus();
 }

 function close() {
  if (dialog.value?.open) dialog.value.close();
 }

 // After any close (Escape, Cancel, a click outside, a result): focus goes back.
 function closed() {
  clearTimeout(timer);
  clearTimeout(settling);
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
 }

 // A click on the scrim, outside the panel, closes it.
 function clicked(event) {
  if (event.target !== dialog.value) return;
  const box = dialog.value.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
 }

 function go(to, remember = true) {
  if (remember) recent.value = rememberSearch(words.value);
  close();
  navigateTo(to);
 }
 function openHit(hit) {
  if (!safeHref(hit?.path)?.startsWith('/')) return;
  settle();
  sendSearchNote('opened', words.value);
  go(hit.path);
 }
 // To /search, which logs the search as it loads, unless it was logged here already.
 function goSeeAll() {
  if (logged.has(words.value.toLowerCase())) handOverSearch(words.value);
  go(seeAll.value);
 }
 const search = (value) => {
  typed.value = value;
  input.value?.focus();
 };
 const forget = (value) => (recent.value = forgetSearch(value));

 function keys(event) {
  if (event.isComposing) return;
  const count = flat.value.length;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
   if (!count) return;
   event.preventDefault();
   active.value = event.key === 'ArrowDown' ? (active.value + 1) % count : (active.value - 1 + count) % count;
   nextTick(() => document.getElementById(`${uid}-o${active.value}`)?.scrollIntoView({ block: 'nearest' }));
  } else if (event.key === 'Enter') {
   event.preventDefault();
   if (active.value >= 0 && flat.value[active.value]) openHit(flat.value[active.value]);
   else if (asking.value) goSeeAll();
  }
 }

 // `/` from anywhere outside a text box.
 function slash(event) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
  const at = event.target;
  if (at?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
  event.preventDefault();
  open();
 }
 onMounted(() => document.addEventListener('keydown', slash));
 onBeforeUnmount(() => {
  document.removeEventListener('keydown', slash);
  clearTimeout(timer);
  clearTimeout(settling);
 });
</script>

<template>
 <dialog ref="dialog" class="tb-search" aria-label="Search this site" @click="clicked" @close="closed">
  <div class="tb-search__bar">
   <svg class="tb-search__icon" width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11l3.5 3.5" />
   </svg>
   <input
    ref="input"
    v-model="typed"
    class="tb-search__input"
    type="text"
    role="combobox"
    aria-label="Search this site"
    aria-autocomplete="list"
    :aria-expanded="flat.length ? 'true' : 'false'"
    :aria-controls="`${uid}-list`"
    :aria-activedescendant="active >= 0 ? `${uid}-o${active}` : undefined"
    :placeholder="site.name ? `Search ${site.name}` : 'Search'"
    maxlength="100"
    autocomplete="off"
    spellcheck="false"
    enterkeyhint="search"
    @keydown="keys"
   />
   <kbd class="tb-search__esc" aria-hidden="true">esc</kbd>
   <button type="button" class="tb-search__cancel" @click="close">Cancel</button>
  </div>

  <div v-if="asking && tabs.length" class="tb-search__tabs" role="group" aria-label="Show">
   <button v-for="tab in tabs" :key="tab.key" type="button" class="tb-search__tab" :aria-pressed="kind === tab.key ? 'true' : 'false'" @click="kind = tab.key">
    {{ tab.label }} <span class="tb-search__count">{{ tab.n }}</span>
   </button>
  </div>

  <div class="tb-search__body">
   <!-- Before typing -->
   <template v-if="!asking">
    <section v-if="suggestions.length" class="tb-search__group">
     <p class="tb-search__label">Popular here</p>
     <ul class="tb-search__chips">
      <li v-for="pick in suggestions" :key="pick"><button type="button" class="tb-search__chip" @click="search(pick)">{{ pick }}</button></li>
     </ul>
    </section>
    <section v-if="recent.length" class="tb-search__group">
     <p class="tb-search__label">Recent</p>
     <ul class="tb-search__list">
      <li v-for="pick in recent" :key="pick" class="tb-search__recent">
       <button type="button" class="tb-search__plain" @click="search(pick)">{{ pick }}</button>
       <button type="button" class="tb-search__remove" :aria-label="`Remove ${pick} from recent searches`" @click="forget(pick)">Remove</button>
      </li>
     </ul>
    </section>
    <section v-if="jumps.length" class="tb-search__group">
     <p class="tb-search__label">Jump to</p>
     <ul class="tb-search__list">
      <li v-for="item in jumps" :key="item.to"><NuxtLink :to="item.to" class="tb-search__plain" @click="close">{{ item.label }}</NuxtLink></li>
     </ul>
    </section>
   </template>

   <p v-else-if="failed" class="tb-search__note">{{ said }}</p>

   <!-- Found nothing -->
   <div v-else-if="nothing" class="tb-search__none">
    <p class="tb-search__none-title">Nothing for “{{ words }}”</p>
    <p v-if="answer.didYouMean">
     Did you mean <button type="button" class="tb-search__link" @click="search(answer.didYouMean)">{{ answer.didYouMean }}</button>?
    </p>
    <template v-if="suggestions.length">
     <p class="tb-search__label">Or try</p>
     <ul class="tb-search__chips">
      <li v-for="pick in suggestions" :key="pick"><button type="button" class="tb-search__chip" @click="search(pick)">{{ pick }}</button></li>
     </ul>
    </template>
    <p v-if="phone || email" class="tb-search__stuck">
     <strong>Still stuck?</strong>
     <a v-if="telHref(phone)" :href="telHref(phone)">Call {{ phone }}</a>
     <a v-if="email" :href="`mailto:${email}`">Email {{ email }}</a>
    </p>
   </div>

   <div v-show="asking && flat.length" :id="`${uid}-list`" role="listbox" aria-label="Results" class="tb-search__results" :aria-busy="loading ? 'true' : undefined">
    <p v-if="answer?.partial" class="tb-search__note">Nothing has every word. These have some of them.</p>
    <div v-for="group in groups" :key="group.kind" role="group" :aria-labelledby="`${uid}-g-${group.kind}`" class="tb-search__group">
     <p :id="`${uid}-g-${group.kind}`" class="tb-search__label">{{ group.label }}</p>
     <div v-for="row in group.rows" :id="`${uid}-o${row.at}`" :key="row.hit.id ?? row.hit.path" role="option" class="tb-search__option" :aria-selected="active === row.at ? 'true' : 'false'" @click="openHit(row.hit)" @mousemove="active = row.at">
      <TbSearchRow :hit="row.hit" :kind="row.hit.kindName || group.label" />
     </div>
    </div>
   </div>
  </div>

  <div v-if="found && total" class="tb-search__foot">
   <span class="tb-search__hints" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move <kbd>↵</kbd> to open</span>
   <NuxtLink :to="seeAll" class="tb-search__all" @click.prevent="goSeeAll">See all {{ total }} results <span aria-hidden="true">→</span></NuxtLink>
  </div>
  <p class="tb-search__said" role="status" aria-live="polite">{{ said }}</p>
 </dialog>
</template>

<style>
 html:has(.tb-search[open]) {
  overflow: hidden;
 }

 .tb-search {
  width: min(720px, 100% - 32px);
  max-height: min(640px, 100dvh - 16vh);
  margin: 10vh auto auto;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 0;
  background: var(--site-bg);
  box-shadow: var(--site-shadow);
  font-family: var(--site-font-body);
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-ink);
  flex-direction: column;
 }

 .tb-search[open] {
  display: flex;
 }

 .tb-search::backdrop {
  background: color-mix(in srgb, var(--site-dark) 55%, transparent);
 }

 .tb-search__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--site-border);
  padding: 16px 20px;
 }

 .tb-search__icon {
  flex: none;
  color: var(--site-accent);
 }

 .tb-search__input {
  flex: 1;
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 4px 0;
  background: transparent;
  font: inherit;
  font-family: var(--site-font-display);
  font-size: 22px;
  color: var(--site-heading);
 }

 .tb-search__input::placeholder {
  color: var(--site-muted);
  opacity: 1;
 }

 .tb-search__input:focus-visible {
  outline: 0;
 }

 .tb-search__bar:focus-within {
  box-shadow: inset 0 -2px 0 var(--site-accent);
 }

 .tb-search__esc,
 .tb-search__hints kbd {
  border: 1px solid var(--site-border);
  border-radius: calc(var(--site-radius) * 0.4);
  padding: 1px 6px;
  font-family: var(--site-font-mono);
  font-size: 11px;
  color: var(--site-muted);
 }

 .tb-search__cancel {
  display: none;
 }

 .tb-search__tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  border-bottom: 1px solid var(--site-border);
  padding: 10px 20px;
  scrollbar-width: none;
 }

 .tb-search__tab {
  flex: none;
  border: 0;
  border-radius: var(--site-control-radius);
  padding: 5px 12px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--site-body);
  cursor: pointer;
 }

 .tb-search__tab:hover {
  background: var(--site-surface);
 }

 .tb-search__tab[aria-pressed='true'] {
  background: var(--site-accent);
  color: var(--site-accent-ink);
 }

 .tb-search__count {
  margin-left: 4px;
  font-weight: 400;
  opacity: 0.75;
 }

 .tb-search__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px 12px;
 }

 .tb-search__group {
  padding-top: 8px;
 }

 .tb-search__label {
  margin: 0;
  padding: 6px 8px;
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 .tb-search__option {
  border-radius: calc(var(--site-radius) * 0.7);
  padding: 8px;
  cursor: pointer;
 }

 /* Flat tint, no bar (Jon's rule). */
 .tb-search__option[aria-selected='true'] {
  background: var(--site-surface);
 }

 .tb-search__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 4px 8px;
  list-style: none;
 }

 .tb-search__chip {
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 6px 12px;
  background: var(--site-bg);
  font: inherit;
  font-size: 14px;
  color: var(--site-ink);
  cursor: pointer;
 }

 .tb-search__chip:hover {
  background: var(--site-surface);
 }

 .tb-search__list {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-search__recent {
  display: flex;
  align-items: center;
 }

 .tb-search__plain {
  display: block;
  flex: 1;
  border: 0;
  border-radius: calc(var(--site-radius) * 0.7);
  padding: 8px;
  background: transparent;
  font: inherit;
  text-align: left;
  color: var(--site-heading);
  text-decoration: none;
  cursor: pointer;
 }

 .tb-search__plain:hover {
  background: var(--site-surface);
 }

 .tb-search__remove,
 .tb-search__link {
  border: 0;
  padding: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--site-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
 }

 .tb-search__link {
  padding: 0;
  font-size: inherit;
  font-weight: 600;
  color: var(--site-accent);
 }

 .tb-search__note {
  margin: 0;
  padding: 8px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-search__none {
  padding: 16px 8px;
 }

 .tb-search__none > p {
  margin: 0 0 8px;
  padding-inline: 8px;
 }

 .tb-search__none .tb-search__label,
 .tb-search__none .tb-search__chips {
  padding-inline: 8px;
 }

 .tb-search__none-title {
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: var(--site-heading-weight);
  color: var(--site-heading);
 }

 .tb-search__stuck {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 16px !important;
  border-radius: calc(var(--site-radius) * 0.7);
  padding: 12px 16px !important;
  background: var(--site-surface);
  font-size: 14px;
 }

 .tb-search__stuck a {
  font-weight: 600;
  color: var(--site-accent);
 }

 .tb-search__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--site-border);
  padding: 12px 20px;
  background: var(--site-surface);
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-search__hints kbd {
  margin-right: 3px;
 }

 .tb-search__all {
  margin-left: auto;
  font-weight: 600;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-search__all:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-search__said {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }

 /* The phone sheet: the whole screen, Cancel instead of esc, pills, and See all held at the bottom. */
 @media (max-width: 640px) {
  .tb-search {
   width: 100%;
   max-width: none;
   height: 100dvh;
   max-height: none;
   margin: 0;
   border: 0;
   border-radius: 0;
  }

  .tb-search__bar {
   padding: 10px 16px;
  }

  .tb-search__input {
   font-size: 18px;
  }

  .tb-search__esc,
  .tb-search__hints {
   display: none;
  }

  .tb-search__cancel {
   display: block;
   min-height: 44px;
   border: 0;
   padding: 0 4px;
   background: transparent;
   font: inherit;
   font-weight: 600;
   color: var(--site-accent);
   cursor: pointer;
  }

  .tb-search__tabs {
   padding-inline: 16px;
  }

  .tb-search__tab {
   min-height: 44px;
   border: 1px solid var(--site-border);
   border-radius: 999px;
   padding-inline: 16px;
  }

  .tb-search__tab[aria-pressed='true'] {
   border-color: var(--site-accent);
  }

  .tb-search__option,
  .tb-search__plain,
  .tb-search__remove,
  .tb-search__chip {
   min-height: 44px;
  }

  .tb-search__foot {
   border-top: 0;
   padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
   background: var(--site-bg);
  }

  .tb-search__all {
   flex: 1;
   margin: 0;
   border-radius: var(--site-control-radius);
   padding: 13px 16px;
   background: var(--site-accent);
   text-align: center;
   color: var(--site-accent-ink);
  }
 }
</style>
