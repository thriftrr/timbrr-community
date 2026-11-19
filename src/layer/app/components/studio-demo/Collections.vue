<script setup>
 // Collections: the site's own kinds of things (services, people, areas).
 // The list on the left, the chosen collection's entries in the middle, and
 // the open entry on the right, as in the studio. New entries start as
 // drafts; Publish puts them on every page that lists the collection.
 import { COLLECTIONS, artSrc } from '../../utils/studio-demo/sample.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));

 const ICONS = { services: 'tag', team: 'people', areas: 'map-pin' };
 // The pictures a service can pick from, out of the site's Media.
 const ARTS = ['boiler', 'pipes', 'zones', 'plan'];

 const cols = ref(copy(COLLECTIONS));
 const at = ref(cols.value[0].key);
 const col = computed(() => cols.value.find((entry) => entry.key === at.value));
 // The first entry starts open, the way the Editor starts on a page.
 const openId = ref(cols.value[0].entries[0]?.id ?? null);
 const entry = computed(() => col.value.entries.find((item) => item.id === openId.value) ?? null);
 // At a phone's width one pane shows at a time.
 const pane = ref('table');

 const status = ref('saved');
 let saving;
 function touch() {
  status.value = 'saving';
  clearTimeout(saving);
  saving = setTimeout(() => (status.value = 'saved'), 700);
 }
 onBeforeUnmount(() => clearTimeout(saving));

 const query = ref('');
 const rows = computed(() => {
  const words = query.value.trim().toLowerCase();
  return words ? col.value.entries.filter((item) => item.name.toLowerCase().includes(words)) : col.value.entries;
 });

 const ticked = ref([]);
 const tickedRows = computed(() => col.value.entries.filter((item) => ticked.value.includes(item.id)));
 const allTicked = computed(() => rows.value.length > 0 && rows.value.every((item) => ticked.value.includes(item.id)));
 function tickAll() {
  ticked.value = allTicked.value ? [] : rows.value.map((item) => item.id);
 }

 // Publish with no name shows the error on the field, not a toast.
 const tried = ref(false);
 const nameError = computed(() => tried.value && entry.value && !entry.value.name.trim());

 watch(at, () => {
  ticked.value = [];
  query.value = '';
  openId.value = col.value.entries[0]?.id ?? null;
  tried.value = false;
 });

 const title = (item) => item.name.trim() || `New ${col.value.one}`;
 const plural = (count) => `${count} ${count === 1 ? col.value.one : col.value.one === 'person' ? 'people' : `${col.value.one}s`}`;
 const liveCount = (group) => group.entries.filter((item) => item.status === 'live').length;
 const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
 // Only collections with their own pages have an address per entry.
 const address = computed(() => (entry.value && col.value.address.startsWith(demo.site.domain) ? `${col.value.address}/${slug(entry.value.name) || '…'}` : ''));

 watchEffect(() => {
  demo.crumb.value = entry.value ? ['Collections', col.value.name, title(entry.value)] : ['Collections', col.value.name];
 });

 function pick(key) {
  at.value = key;
  pane.value = 'table';
 }

 const root = ref(null);
 function open(id) {
  openId.value = id;
  tried.value = false;
  pane.value = 'entry';
 }

 function close() {
  openId.value = null;
  pane.value = 'table';
 }

 let uid = 0;
 function add() {
  const fresh = { id: `n${++uid}`, status: 'draft', changed: false, updated: 'Just now' };
  for (const [key] of col.value.fields) fresh[key] = '';
  if (col.value.key === 'services') fresh.art = null;
  col.value.entries.unshift(fresh);
  query.value = '';
  open(fresh.id);
  touch();
  nextTick(() => root.value?.querySelector(`#co-${fresh.id}-name`)?.focus());
 }

 function edit() {
  entry.value.updated = 'Just now';
  if (entry.value.status === 'live') entry.value.changed = true;
  touch();
 }

 function publish() {
  if (!entry.value.name.trim()) {
   tried.value = true;
   root.value?.querySelector(`#co-${entry.value.id}-name`)?.focus();
   return;
  }
  Object.assign(entry.value, { status: 'live', changed: false, updated: 'Just now' });
  demo.toast(`Publishing is off in the demo. On your own site, every page that lists ${col.value.name} shows it.`, { link: true });
 }

 function toDraft() {
  Object.assign(entry.value, { status: 'draft', changed: false, updated: 'Just now' });
  demo.toast(`${title(entry.value)} is a draft again. It’s off the site until you publish it.`);
 }

 function remove() {
  const name = title(entry.value);
  col.value.entries.splice(col.value.entries.indexOf(entry.value), 1);
  ticked.value = ticked.value.filter((id) => id !== openId.value);
  close();
  demo.toast(`${name} deleted. Start over brings it back.`);
 }

 function bulk(next) {
  const items = tickedRows.value;
  // An entry with no name can't go on the site, so it stays a draft.
  const moving = next === 'live' ? items.filter((item) => item.name.trim()) : items;
  for (const item of moving) Object.assign(item, { status: next, changed: false, updated: 'Just now' });
  ticked.value = [];
  const left = items.length - moving.length;
  if (next === 'draft') demo.toast(`${plural(moving.length)} moved to draft. They’re off the site until you publish them.`);
  else demo.toast(`${plural(moving.length)} published. Every page that lists ${col.value.name} shows them.${left ? ` ${left} with no name stayed a draft.` : ''}`);
 }

 const stateLine = computed(() => {
  if (!entry.value) return '';
  if (entry.value.status === 'draft') return 'Draft — not on the site yet';
  return entry.value.changed ? 'Live — your changes aren’t on the site yet' : 'Live';
 });
</script>

<template>
 <div ref="root" class="co" :data-pane="pane">
  <div class="co-bar">
   <h2 class="sd-title co-title">Collections</h2>
   <div class="sd-seg co-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'list'" @click="pane = 'list'">Collections</button>
    <button type="button" :aria-pressed="pane === 'table'" @click="pane = 'table'">List</button>
    <button type="button" :aria-pressed="pane === 'entry'" :disabled="!entry" @click="pane = 'entry'">Edit</button>
   </div>
   <span class="co-status" role="status">{{ status === 'saving' ? 'Saving draft…' : 'Draft saved' }}</span>
   <button type="button" class="sd-btn sd-btn--primary" @click="add"><StudioDemoIcon name="plus" :size="14" />New {{ col.one }}</button>
  </div>

  <div class="co-main">
   <nav class="co-list" aria-label="Collections">
    <p class="co-list__bar sd-caps">{{ cols.length }} collections</p>
    <div class="sd-pane co-list__rows">
     <button v-for="group in cols" :key="group.key" type="button" class="co-col" :aria-current="group.key === at ? 'true' : undefined" @click="pick(group.key)">
      <StudioDemoIcon :name="ICONS[group.key]" :size="16" />
      <span class="co-col__name">{{ group.name }}</span>
      <span class="co-col__count">{{ group.entries.length }}</span>
     </button>
    </div>
    <p class="co-hint">A collection is a kind of thing your site lists. A block on any page shows its live entries.</p>
   </nav>

   <main class="co-table" :aria-label="col.name">
    <div class="co-head">
     <div class="co-head__name">
      <p class="co-head__title">{{ col.name }}</p>
      <p class="co-head__kind">{{ col.address }} · {{ liveCount(col) }} of {{ col.entries.length }} live</p>
     </div>
     <label class="co-search">
      <StudioDemoIcon name="search" :size="15" />
      <span class="sd-sr">Search {{ col.name }}</span>
      <input v-model="query" type="search" :placeholder="`Search ${col.name.toLowerCase()}`" />
      <button v-if="query" type="button" class="co-search__clear" aria-label="Clear search" @click="query = ''"><StudioDemoIcon name="x" :size="14" /></button>
     </label>
    </div>

    <div v-if="ticked.length" class="co-ticked" role="group" aria-label="Selected entries">
     <span class="co-ticked__count">{{ ticked.length }} selected</span>
     <button type="button" class="sd-btn sd-btn--primary" @click="bulk('live')">Publish</button>
     <button type="button" class="sd-btn" @click="bulk('draft')">Move to draft</button>
     <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon" aria-label="Clear selection" title="Clear selection" @click="ticked = []"><StudioDemoIcon name="x" :size="15" /></button>
    </div>

    <div class="sd-pane co-rows">
     <table v-if="rows.length" class="co-grid">
      <colgroup>
       <col class="co-grid__tick" />
       <col />
       <col class="co-grid__second" />
       <col class="co-grid__state" />
       <col class="co-grid__when" />
      </colgroup>
      <thead>
       <tr>
        <th scope="col">
         <input type="checkbox" class="co-tick" :checked="allTicked" :indeterminate="ticked.length > 0 && !allTicked" :aria-label="`Select every ${col.one}`" @change="tickAll" />
        </th>
        <th v-for="[key, name] in col.columns" :key="key" scope="col">{{ name }}</th>
        <th scope="col">Status</th>
        <th scope="col">Updated</th>
       </tr>
      </thead>
      <tbody>
       <tr v-for="item in rows" :key="item.id" :class="{ 'is-open': item.id === openId, 'is-ticked': ticked.includes(item.id) }" @click="open(item.id)">
        <td @click.stop>
         <input v-model="ticked" type="checkbox" class="co-tick" :value="item.id" :aria-label="`Select ${title(item)}`" />
        </td>
        <td>
         <button type="button" class="co-open" :class="{ 'is-blank': !item.name.trim() }" @click.stop="open(item.id)">
          <img v-if="item.art" class="co-thumb" :src="artSrc(item.art)" alt="" />
          <span>{{ title(item) }}</span>
         </button>
        </td>
        <td v-for="[key] in col.columns.slice(1)" :key="key" class="co-grid__plain">{{ item[key] || '—' }}</td>
        <td>
         <span class="sd-badge" :class="item.status === 'live' ? 'sd-badge--live' : 'sd-badge--draft'">{{ item.status === 'live' ? 'Live' : 'Draft' }}</span>
         <span v-if="item.changed" class="co-changed" title="Changes not published yet">Changed</span>
        </td>
        <td class="co-grid__plain co-grid__muted">{{ item.updated }}</td>
       </tr>
      </tbody>
     </table>
     <div v-else-if="query" class="co-empty">
      <p class="co-empty__title">Nothing in {{ col.name }} called “{{ query.trim() }}”</p>
      <p>Check the spelling, or add it as a new {{ col.one }}.</p>
      <div class="co-empty__do">
       <button type="button" class="sd-btn" @click="query = ''">Clear search</button>
       <button type="button" class="sd-btn sd-btn--primary" @click="add"><StudioDemoIcon name="plus" :size="14" />New {{ col.one }}</button>
      </div>
     </div>
     <div v-else class="co-empty">
      <p class="co-empty__title">No {{ col.name.toLowerCase() }} yet</p>
      <p>Pages that list {{ col.name }} show nothing until you add one.</p>
      <div class="co-empty__do">
       <button type="button" class="sd-btn sd-btn--primary" @click="add"><StudioDemoIcon name="plus" :size="14" />New {{ col.one }}</button>
      </div>
     </div>
    </div>
   </main>

   <aside class="co-entry" aria-label="Entry">
    <div class="co-entry__bar">
     <p class="sd-caps">Entry</p>
     <button v-if="entry" type="button" class="sd-btn sd-btn--ghost sd-btn--icon" aria-label="Close entry" title="Close" @click="close"><StudioDemoIcon name="x" :size="15" /></button>
    </div>
    <template v-if="entry">
     <div class="co-ehead">
      <img v-if="entry.art" class="co-ehead__pic" :src="artSrc(entry.art)" alt="" />
      <span v-else class="co-ehead__icon" aria-hidden="true"><StudioDemoIcon :name="ICONS[col.key]" :size="18" /></span>
      <div class="co-ehead__name">
       <p class="co-ehead__title" :class="{ 'is-blank': !entry.name.trim() }">{{ title(entry) }}</p>
      </div>
      <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon sd-btn--danger" :aria-label="`Delete ${title(entry)}`" title="Delete" @click="remove"><StudioDemoIcon name="trash" :size="15" /></button>
     </div>
     <div class="co-state" :class="`is-${entry.status}`">
      <!-- Nothing to publish: say so in words, not with a dead button. -->
      <p class="co-state__line"><span class="co-state__dot" aria-hidden="true" />{{ stateLine }}<span v-if="entry.status === 'live' && !entry.changed" class="co-state__ok">Up to date</span></p>
      <div class="co-state__do">
       <button v-if="entry.status === 'live'" type="button" class="sd-btn sd-btn--ghost" @click="toDraft">Move to draft</button>
       <button v-if="entry.status === 'draft' || entry.changed" type="button" class="sd-btn sd-btn--primary" @click="publish">Publish</button>
      </div>
     </div>
     <div class="sd-pane co-entry__body">
      <div v-for="[key, name, kind] in col.fields" :key="key" class="sd-field">
       <label class="sd-label" :for="`co-${entry.id}-${key}`">{{ name }}</label>
       <textarea v-if="kind === 'area'" :id="`co-${entry.id}-${key}`" v-model="entry[key]" class="sd-input" rows="3" @input="edit" />
       <input
        v-else
        :id="`co-${entry.id}-${key}`"
        v-model="entry[key]"
        class="sd-input"
        :aria-invalid="key === 'name' && nameError ? 'true' : undefined"
        :aria-describedby="key === 'name' && nameError ? `co-${entry.id}-error` : undefined"
        @input="edit"
       />
       <p v-if="key === 'name' && nameError" :id="`co-${entry.id}-error`" class="co-error"><StudioDemoIcon name="alert-triangle" :size="13" />Give this {{ col.one }} a name before you publish it.</p>
       <p v-if="key === 'name' && address" class="sd-help co-address">{{ address }}</p>
      </div>
      <div v-if="'art' in entry" class="sd-field">
       <p id="co-art" class="sd-label">Picture</p>
       <div class="co-arts" role="group" aria-labelledby="co-art">
        <button v-for="(key, index) in ARTS" :key="key" type="button" class="co-art" :aria-pressed="entry.art === key" :aria-label="`Picture ${index + 1}`" @click="(entry.art = key), edit()">
         <img :src="artSrc(key)" alt="" />
        </button>
       </div>
       <p class="sd-help">From the site’s Media.</p>
      </div>
     </div>
     <p class="co-entry__note">Pages that list {{ col.name }} show live entries only.</p>
    </template>
    <div v-else class="co-nothing">
     <p class="co-ehead__title">{{ col.name }}</p>
     <p>Click an entry to change it, or add a new {{ col.one }}.</p>
     <p class="co-nothing__fields">Every {{ col.one }} has: {{ col.fields.map(([, name]) => name).join(', ') }}.</p>
    </div>
   </aside>
  </div>
 </div>
</template>

<style>
 .co {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .co-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .co-title {
  white-space: nowrap;
 }

 /* Status, then the main action, always on the right. */
 .co-status {
  margin-left: auto;
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .co .co-panes {
  display: none;
 }

 .co-main {
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr) 304px;
  min-height: 0;
 }

 /* Collections list */
 .co-list {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .co-list__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .co-list__rows {
  padding: 6px;
 }

 .co-col {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  border: 0;
  border-radius: 6px;
  padding: 0 10px;
  background: none;
  font-size: 14px;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 .co-col:hover {
  background: var(--sd-sunken);
 }

 .co-col[aria-current] {
  background: var(--sd-soft);
  font-weight: 600;
 }

 .co-col .sd-icon {
  color: var(--sd-muted);
 }

 .co-col[aria-current] .sd-icon {
  color: var(--sd-brand);
 }

 .co-col__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .co-col__count {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .co-hint {
  border-top: 1px solid var(--sd-rule);
  padding: 11px 14px;
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 /* Entries */
 .co-table {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: var(--sd-raised);
 }

 .co-head {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 10px 16px;
 }

 .co-head__name {
  flex: 1;
  min-width: 0;
 }

 .co-head__title {
  font: 700 17px/1.15 var(--sd-display);
  color: var(--sd-strong);
 }

 .co-head__kind {
  margin-top: 3px;
  overflow: hidden;
  font: 400 12.5px/1.4 var(--sd-body);
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-muted);
 }

 .co-search {
  display: flex;
  flex: 0 1 230px;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  height: 34px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  padding: 0 4px 0 10px;
  background: var(--sd-field);
  color: var(--sd-muted);
  transition:
   border-color 0.16s var(--sd-ease),
   box-shadow 0.16s var(--sd-ease);
 }

 .co-search:focus-within {
  border-color: var(--sd-brand);
  box-shadow: var(--sd-ring);
 }

 .co-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: none;
  font: inherit;
  font-size: 13px;
  color: var(--sd-ink);
  outline: none;
 }

 .co-search input::placeholder {
  color: var(--sd-faint);
 }

 .co-search input::-webkit-search-cancel-button {
  display: none;
 }

 .co-search__clear {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .co-search__clear:hover {
  background: var(--sd-sunken);
  color: var(--sd-strong);
 }

 .co-ticked {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 10px 0 16px;
  background: var(--sd-soft);
 }

 .co-ticked__count {
  margin-right: auto;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .co-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
 }

 .co-grid__tick {
  width: 44px;
 }

 .co-grid__second {
  width: 26%;
 }

 .co-grid__state {
  width: 132px;
 }

 .co-grid__when {
  width: 96px;
 }

 .co-grid th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 36px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 10px;
  background: var(--sd-raised);
  font: 500 12.5px/1 var(--sd-body);
  text-align: left;
  color: var(--sd-muted);
 }

 .co-grid td {
  height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 10px;
  font-size: 13.5px;
  color: var(--sd-ink);
 }

 .co-grid :is(th, td):first-child {
  padding: 0 0 0 16px;
 }

 .co-grid tbody tr {
  cursor: pointer;
  transition: background-color 0.12s var(--sd-ease);
 }

 .co-grid tbody tr:hover {
  background: var(--sd-field);
 }

 .co-grid tbody tr.is-ticked {
  background: color-mix(in srgb, var(--sd-soft) 60%, var(--sd-raised));
 }

 .co-grid tbody tr.is-open {
  background: var(--sd-soft);
 }

 /* The Live badge is soft green too, so it lifts off a soft row. */
 .co-grid tr:is(.is-open, .is-ticked) .sd-badge--live {
  background: var(--sd-raised);
 }

 .co-grid__plain {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .co-grid__muted {
  font: 400 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .co-tick {
  display: block;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--sd-brand);
  cursor: pointer;
 }

 .co-open {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  border: 0;
  border-radius: 4px;
  padding: 0;
  background: none;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 .co-open span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .co-open:hover span {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .co-open.is-blank,
 .co-ehead__title.is-blank {
  font-style: italic;
  color: var(--sd-muted);
 }

 .co-thumb {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
 }

 .co-changed {
  margin-left: 6px;
  font: 500 12.5px/1 var(--sd-body);
  color: #6b4d12;
 }

 .co-empty {
  max-width: 380px;
  margin: 0 auto;
  padding: 64px 24px;
  font-size: 13.5px;
  text-align: center;
  color: var(--sd-muted);
 }

 .co-empty__title {
  margin-bottom: 6px;
  font: 700 16px/1.25 var(--sd-display);
  color: var(--sd-strong);
  overflow-wrap: anywhere;
 }

 .co-empty__do {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
 }

 /* The open entry */
 .co-entry {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  min-height: 0;
  border-left: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .co-entry__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 6px 0 16px;
 }

 .co-entry__bar .sd-btn {
  width: 28px;
  height: 28px;
 }

 .co-ehead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 10px 14px 16px;
 }

 .co-ehead__icon,
 .co-ehead__pic {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sd-soft);
  color: var(--sd-strong);
  object-fit: cover;
 }

 .co-ehead__name {
  flex: 1;
  min-width: 0;
 }

 .co-ehead__title {
  overflow: hidden;
  font: 700 17px/1.15 var(--sd-display);
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-strong);
 }

 .co-state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  border-block: 1px solid var(--sd-rule);
  padding: 10px 12px 10px 16px;
  background: var(--sd-field);
 }

 .co-state__line {
  display: flex;
  flex: 1 1 140px;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .co-state__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b58a2a;
 }

 .co-state.is-live .co-state__dot {
  background: var(--sd-brand);
 }

 .co-state__do {
  display: flex;
  gap: 6px;
  margin-left: auto;
 }

 .co-state__ok {
  font-weight: 400;
  color: var(--sd-muted);
 }

 .co-entry__body {
  padding: 16px;
 }

 .co-entry__body .sd-field + .sd-field {
  margin-top: 16px;
 }

 .co-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sd-danger);
 }

 .co-address {
  overflow-wrap: anywhere;
  font-family: var(--sd-mono);
  font-size: 11.5px;
 }

 .co-arts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
 }

 .co-art {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: none;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
 }

 .co-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
 }

 .co-art:hover {
  opacity: 0.86;
 }

 .co-art[aria-pressed='true'] {
  overflow: visible;
  box-shadow:
   0 0 0 2px var(--sd-raised),
   0 0 0 4px var(--sd-brand);
 }

 .co-art[aria-pressed='true'] img {
  border-radius: 6px;
 }

 .co-entry__note {
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .co-nothing {
  padding: 24px 16px;
  font-size: 13.5px;
  color: var(--sd-muted);
 }

 .co-nothing p + p {
  margin-top: 6px;
 }

 .co-nothing .co-nothing__fields {
  margin-top: 14px;
  border-top: 1px solid var(--sd-rule);
  padding-top: 14px;
  font-size: 12.5px;
 }

 /* Between a laptop and a phone: narrower list and entry. */
 @container sd (max-width: 1060px) {
  .co-main {
   grid-template-columns: 180px minmax(0, 1fr) 280px;
  }

  .co-hint {
   display: none;
  }

  .co-grid__when {
   width: 84px;
  }
 }

 /* A phone: one pane at a time. */
 @container sd (max-width: 760px) {
  .co .co-panes {
   display: flex;
   margin-right: auto;
  }

  /* The crumbs already name the room, so the panes take the left. */
  .co-title,
  .co-status {
   display: none;
  }

  .co-main {
   grid-template-columns: minmax(0, 1fr);
  }

  .co-list,
  .co-entry,
  .co[data-pane='list'] .co-table,
  .co[data-pane='entry'] .co-table {
   display: none;
  }

  .co[data-pane='list'] .co-list,
  .co[data-pane='entry'] .co-entry {
   display: grid;
   border: 0;
  }

  .co-hint {
   display: block;
  }

  .co-head {
   flex-wrap: wrap;
   gap: 10px;
  }

  .co-search {
   flex: 1 1 100%;
  }

  /* Updated goes first; the status keeps its place. */
  .co-grid col.co-grid__when,
  .co-grid :is(th, td):last-child {
   display: none;
  }

  .co-grid__second {
   width: 32%;
  }

  .co-grid__state {
   width: 76px;
  }

  .co-changed {
   display: none;
  }
 }
</style>
