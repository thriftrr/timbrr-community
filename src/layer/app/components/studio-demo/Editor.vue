<script setup>
 // The page editor: the block list on the left, the page in the middle, the
 // inspector on the right, as in the studio. Add a block (it goes after the
 // selected one), click it, type, and the page changes as you go.
 import { BLOCKS, START_PAGE, TRAY_GROUPS, startLook } from '../../utils/studio-demo/sample.js';
 import { themeStyle } from '../../utils/studio-demo/theme.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));

 let uid = 0;
 const make = (type) => ({ id: `b${++uid}`, type, data: copy(BLOCKS[type].data), look: startLook(type) });
 const blocks = ref(START_PAGE.map(make));
 const selected = ref(blocks.value[0].id);
 const block = computed(() => blocks.value.find((entry) => entry.id === selected.value) ?? null);
 const def = computed(() => (block.value ? BLOCKS[block.value.type] : null));
 const tab = ref('content');
 const open = ref('text');
 const device = ref('desktop');
 // At a phone's width one pane shows at a time.
 const pane = ref('page');
 const fresh = ref(null);

 const status = ref('saved');
 let saving;
 function touch() {
  status.value = 'saving';
  clearTimeout(saving);
  saving = setTimeout(() => (status.value = 'saved'), 700);
 }
 onBeforeUnmount(() => clearTimeout(saving));

 // The block list, narrowed by what's typed, in the studio's groups.
 const query = ref('');
 const search = ref(null);
 const groups = computed(() => {
  const words = query.value.trim().toLowerCase();
  return TRAY_GROUPS.map((group) => ({
   group,
   items: Object.entries(BLOCKS)
    .filter(([, entry]) => entry.group === group && (!words || entry.label.toLowerCase().includes(words)))
    .map(([type, entry]) => {
     const at = words ? entry.label.toLowerCase().indexOf(words) : -1;
     return { type, label: entry.label, before: at < 0 ? entry.label : entry.label.slice(0, at), match: at < 0 ? '' : entry.label.slice(at, at + words.length), after: at < 0 ? '' : entry.label.slice(at + words.length) };
    }),
  })).filter((entry) => entry.items.length);
 });
 const first = computed(() => groups.value[0]?.items[0]?.type ?? null);

 const page = ref(null);
 function add(type) {
  const next = make(type);
  const at = blocks.value.findIndex((entry) => entry.id === selected.value);
  blocks.value.splice(at < 0 ? blocks.value.length : at + 1, 0, next);
  const after = at < 0 ? null : blocks.value[at];
  selected.value = next.id;
  tab.value = 'content';
  open.value = 'text';
  query.value = '';
  fresh.value = next.id;
  pane.value = 'page';
  touch();
  demo.toast(after ? `${BLOCKS[type].label} added after ${BLOCKS[after.type].label}. Its words are on the right.` : `${BLOCKS[type].label} added. Its words are on the right.`);
  nextTick(() => page.value?.querySelector(`[data-block="${next.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
 }

 function select(id) {
  selected.value = id;
  open.value = 'text';
  if (pane.value === 'blocks') pane.value = 'page';
 }

 function act(action, id = selected.value) {
  const at = blocks.value.findIndex((entry) => entry.id === id);
  if (at < 0) return;
  const target = blocks.value[at];
  if (action === 'up' && at > 0) blocks.value.splice(at - 1, 2, target, blocks.value[at - 1]);
  if (action === 'down' && at < blocks.value.length - 1) blocks.value.splice(at, 2, blocks.value[at + 1], target);
  if (action === 'copy') {
   const twin = { ...copy(target), id: `b${++uid}` };
   blocks.value.splice(at + 1, 0, twin);
   selected.value = twin.id;
   fresh.value = twin.id;
  }
  if (action === 'remove') {
   blocks.value.splice(at, 1);
   selected.value = (blocks.value[at] ?? blocks.value[at - 1])?.id ?? null;
   demo.toast(`${BLOCKS[target.type].label} removed. Start over brings it back.`);
  }
  touch();
 }

 function addItem() {
  const items = block.value.data.items;
  items.push(copy(BLOCKS[block.value.type].data.items[0]));
  touch();
 }

 function removeItem(index) {
  block.value.data.items.splice(index, 1);
  touch();
 }

 const label = (type) => BLOCKS[type].label;
 const peek = computed(() => {
  if (!block.value) return '';
  const [key] = def.value.fields[0];
  return block.value.data[key];
 });
 const BACKGROUNDS = [
  ['page', 'Page'],
  ['soft', 'Soft'],
  ['brand', 'Brand'],
  ['dark', 'Dark'],
 ];
 const swatch = (key) => ({ page: demo.theme.paper, soft: demo.theme.soft, brand: demo.theme.brand, dark: demo.theme.dark })[key];
 const SPACES = [
  ['tight', 'Tight'],
  ['normal', 'Normal'],
  ['roomy', 'Roomy'],
 ];

 // N jumps to the block search, as in the studio, while you're in the demo.
 const root = ref(null);
 function onKey(event) {
  if (event.key !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
  event.preventDefault();
  pane.value = 'blocks';
  nextTick(() => search.value?.focus());
 }

 function publish() {
  demo.toast('Publishing is off in the demo. On your own site, this page goes live.', { link: true });
 }
</script>

<template>
 <div ref="root" class="ed" :data-pane="pane" @keydown="onKey">
  <div class="ed-bar">
   <h2 class="sd-title ed-title">Home</h2>
   <div class="sd-seg ed-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'blocks'" @click="pane = 'blocks'">List</button>
    <button type="button" :aria-pressed="pane === 'page'" @click="pane = 'page'">Preview</button>
    <button type="button" :aria-pressed="pane === 'edit'" :disabled="!block" @click="pane = 'edit'">Edit</button>
   </div>
   <span class="ed-status" role="status">{{ status === 'saving' ? 'Saving draft…' : 'Draft saved' }}</span>
   <button type="button" class="sd-btn sd-btn--primary" @click="publish">Publish</button>
  </div>

  <div class="ed-main">
   <aside class="ed-tray" aria-label="Blocks">
    <div class="ed-tray__find">
     <label class="ed-search">
      <StudioDemoIcon name="search" :size="15" />
      <span class="sd-sr">Search blocks</span>
      <input ref="search" v-model="query" type="search" placeholder="Search blocks" @keydown.enter.prevent="first && add(first)" />
      <kbd class="sd-kbd" aria-hidden="true">N</kbd>
     </label>
    </div>
    <p class="ed-source"><span class="ed-source__tile" aria-hidden="true">T</span>Timbrr Core</p>
    <div class="ed-tray__list sd-pane">
     <template v-for="entry in groups" :key="entry.group">
      <p class="ed-group">{{ entry.group }}</p>
      <button v-for="item in entry.items" :key="item.type" type="button" class="ed-row" :class="{ 'is-first': query && item.type === first }" @click="add(item.type)">
       <StudioDemoIcon :name="item.type" :size="16" />
       <span class="ed-row__name">{{ item.before }}<mark v-if="item.match">{{ item.match }}</mark>{{ item.after }}</span>
       <span class="ed-row__add" aria-hidden="true">Add</span>
      </button>
     </template>
     <p v-if="!groups.length" class="ed-none">No block called that. When you need one that isn’t here, it can be built for your site.</p>
    </div>
    <p class="ed-hint">
     <template v-if="block">Adds after <b>{{ label(block.type) }}</b>.</template>
     <template v-else>Adds at the end of the page.</template>
    </p>
   </aside>

   <main class="ed-stage" aria-label="The page">
    <div class="ed-stage__bar">
     <p class="sd-caps">{{ demo.site.domain }}/</p>
     <div class="sd-seg ed-device" aria-label="Show the page as">
      <button type="button" :aria-pressed="device === 'desktop'" @click="device = 'desktop'"><StudioDemoIcon name="monitor" :size="14" /><span>Computer</span></button>
      <button type="button" :aria-pressed="device === 'phone'" @click="device = 'phone'"><StudioDemoIcon name="smartphone" :size="14" /><span>Phone</span></button>
     </div>
    </div>
    <div class="ed-canvas sd-pane">
     <div ref="page" class="sd-site ed-page" :class="{ 'is-phone': device === 'phone' }" :style="themeStyle(demo.theme)">
      <StudioDemoSite type="header" />
      <div
       v-for="entry in blocks"
       :key="entry.id"
       class="ed-block"
       :class="{ 'is-selected': entry.id === selected, 'is-fresh': entry.id === fresh }"
       :data-block="entry.id"
       tabindex="0"
       role="button"
       :aria-pressed="entry.id === selected"
       :aria-label="`${label(entry.type)} block`"
       @click="select(entry.id)"
       @keydown.enter.self.prevent="select(entry.id)"
       @keydown.space.self.prevent="select(entry.id)"
       @animationend="fresh = null"
      >
       <StudioDemoSite :type="entry.type" :data="entry.data" :look="entry.look" />
       <span class="ed-block__tag" aria-hidden="true">{{ label(entry.type) }}</span>
       <span v-if="entry.id === selected" class="ed-block__tools">
        <button type="button" :aria-label="`Move ${label(entry.type)} up`" title="Move up" @click.stop="act('up', entry.id)"><StudioDemoIcon name="arrow-up" :size="15" /></button>
        <button type="button" :aria-label="`Move ${label(entry.type)} down`" title="Move down" @click.stop="act('down', entry.id)"><StudioDemoIcon name="arrow-down" :size="15" /></button>
        <button type="button" :aria-label="`Duplicate ${label(entry.type)}`" title="Duplicate" @click.stop="act('copy', entry.id)"><StudioDemoIcon name="copy" :size="15" /></button>
        <button type="button" :aria-label="`Remove ${label(entry.type)}`" title="Remove" @click.stop="act('remove', entry.id)"><StudioDemoIcon name="trash" :size="15" /></button>
       </span>
      </div>
      <p v-if="!blocks.length" class="ed-empty">This page is empty. Add a block from the list.</p>
      <StudioDemoSite type="footer" />
     </div>
    </div>
   </main>

   <aside class="ed-inspector" aria-label="Inspector">
    <p class="ed-inspector__bar sd-caps">Block</p>
    <template v-if="block">
     <div class="ed-head">
      <span class="ed-head__icon" aria-hidden="true"><StudioDemoIcon :name="block.type" :size="18" /></span>
      <div class="ed-head__name">
       <p class="ed-head__title">{{ def.label }}</p>
      </div>
      <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon" :aria-label="`Duplicate ${def.label}`" title="Duplicate" @click="act('copy')"><StudioDemoIcon name="copy" :size="15" /></button>
      <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon sd-btn--danger" :aria-label="`Remove ${def.label}`" title="Remove" @click="act('remove')"><StudioDemoIcon name="trash" :size="15" /></button>
     </div>
     <div class="ed-tabs" role="tablist" aria-label="Block settings">
      <button type="button" role="tab" :aria-selected="tab === 'content'" @click="tab = 'content'">Content</button>
      <button type="button" role="tab" :aria-selected="tab === 'style'" @click="tab = 'style'">Style</button>
     </div>
     <div class="sd-pane ed-inspector__body" role="tabpanel">
      <template v-if="tab === 'content'">
       <section class="ed-sec" :class="{ 'is-open': open === 'text' }">
        <button type="button" class="ed-sec__head" :aria-expanded="open === 'text'" @click="open = open === 'text' ? '' : 'text'">
         <b>Text</b>
         <span class="ed-sec__peek">{{ peek }}</span>
         <StudioDemoIcon name="chevron-down" :size="16" />
        </button>
        <div v-if="open === 'text'" class="ed-sec__body">
         <div v-for="[key, name, kind] in def.fields" :key="key" class="sd-field">
          <label class="sd-label" :for="`ed-${block.id}-${key}`">{{ name }}</label>
          <textarea v-if="kind === 'area'" :id="`ed-${block.id}-${key}`" v-model="block.data[key]" class="sd-input" rows="3" @input="touch" />
          <input v-else :id="`ed-${block.id}-${key}`" v-model="block.data[key]" class="sd-input" @input="touch" />
         </div>
        </div>
       </section>
       <section v-if="def.item" class="ed-sec" :class="{ 'is-open': open === 'items' }">
        <button type="button" class="ed-sec__head" :aria-expanded="open === 'items'" @click="open = open === 'items' ? '' : 'items'">
         <b>{{ def.item.name }}s</b>
         <span class="ed-sec__peek">{{ block.data.items.length }} {{ def.item.name.toLowerCase() }}{{ block.data.items.length === 1 ? '' : 's' }}</span>
         <StudioDemoIcon name="chevron-down" :size="16" />
        </button>
        <div v-if="open === 'items'" class="ed-sec__body">
         <div v-for="(item, index) in block.data.items" :key="index" class="ed-item">
          <div class="ed-item__head">
           <p class="sd-caps">{{ def.item.name }} {{ index + 1 }}</p>
           <button v-if="block.data.items.length > 1" type="button" class="sd-btn sd-btn--ghost sd-btn--icon" :aria-label="`Remove ${def.item.name.toLowerCase()} ${index + 1}`" @click="removeItem(index)"><StudioDemoIcon name="x" :size="14" /></button>
          </div>
          <div v-for="[key, name, kind] in def.item.fields" :key="key" class="sd-field">
           <label class="sd-label" :for="`ed-${block.id}-${index}-${key}`">{{ name }}</label>
           <textarea v-if="kind === 'area'" :id="`ed-${block.id}-${index}-${key}`" v-model="item[key]" class="sd-input" rows="2" @input="touch" />
           <input v-else :id="`ed-${block.id}-${index}-${key}`" v-model="item[key]" class="sd-input" @input="touch" />
          </div>
         </div>
         <button v-if="block.data.items.length < 6" type="button" class="sd-btn ed-add" @click="addItem"><StudioDemoIcon name="plus" :size="14" />Add a {{ def.item.name.toLowerCase() }}</button>
        </div>
       </section>
      </template>
      <div v-else class="ed-style">
       <div class="sd-field">
        <p class="sd-label" id="ed-bg">Background</p>
        <div class="ed-swatches" role="group" aria-labelledby="ed-bg">
         <button v-for="[key, name] in BACKGROUNDS" :key="key" type="button" class="ed-swatch" :aria-pressed="block.look.background === key" @click="(block.look.background = key), touch()">
          <span class="ed-swatch__chip" :style="{ background: swatch(key) }" />
          {{ name }}
         </button>
        </div>
       </div>
       <div v-for="[key, name] in [['above', 'Space above'], ['below', 'Space below']]" :key="key" class="sd-field">
        <p :id="`ed-${key}`" class="sd-label">{{ name }}</p>
        <div class="sd-seg" role="group" :aria-labelledby="`ed-${key}`">
         <button v-for="[value, word] in SPACES" :key="value" type="button" :aria-pressed="block.look[key] === value" @click="(block.look[key] = value), touch()">{{ word }}</button>
        </div>
       </div>
       <div class="sd-field ed-line">
        <span id="ed-line" class="sd-label">Line above</span>
        <button type="button" class="sd-switch" role="switch" :aria-checked="block.look.divider" aria-labelledby="ed-line" @click="(block.look.divider = !block.look.divider), touch()" />
       </div>
      </div>
     </div>
     <p class="ed-inspector__note">Colors and fonts come from the site’s branding, so every choice here looks right.</p>
    </template>
    <div v-else class="ed-nothing">
     <p class="ed-head__title">Home</p>
     <p>Click a block on the page to change it, or add one from the list.</p>
    </div>
   </aside>
  </div>
 </div>
</template>

<style>
 .ed {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .ed-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .ed-title {
  white-space: nowrap;
 }

 /* Status, then the main action, always on the right. */
 .ed-status {
  margin-left: auto;
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .ed-device button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
 }

 .ed .ed-panes {
  display: none;
 }

 .ed-main {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 296px;
  min-height: 0;
 }

 /* Block list */
 .ed-tray {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  /* stops the track growing to its min-content width past the 236px column */
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .ed-tray__find {
  border-bottom: 1px solid var(--sd-rule);
  padding: 12px;
 }

 .ed-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  padding: 0 8px 0 10px;
  background: var(--sd-field);
  color: var(--sd-muted);
  transition:
   border-color 0.16s var(--sd-ease),
   box-shadow 0.16s var(--sd-ease);
 }

 .ed-search:focus-within {
  border-color: var(--sd-brand);
  box-shadow: var(--sd-ring);
 }

 .ed-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 13px;
  color: var(--sd-ink);
  outline: none;
 }

 .ed-search input::placeholder {
  color: var(--sd-faint);
 }

 .ed-search input::-webkit-search-cancel-button {
  display: none;
 }

 .ed-source {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .ed-source__tile {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--sd-deep);
  font: 700 10px/1 var(--sd-display);
  color: var(--sd-on-brand);
 }

 .ed-tray__list {
  padding: 4px 6px 12px;
 }

 .ed-group {
  padding: 14px 8px 4px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .ed-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 0 8px;
  background: none;
  font-size: 14px;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 .ed-row:is(:hover, :focus-visible, .is-first) {
  background: var(--sd-soft);
 }

 /* Inside the pane, so the ring sits inside the row and isn't cut off. */
 .ed-row:focus-visible {
  outline-offset: -2px;
 }

 .ed-row .sd-icon {
  color: var(--sd-muted);
 }

 .ed-row__name {
  flex: 1;
  min-width: 0;
 }

 .ed-row mark {
  border-radius: 2px;
  background: var(--sd-gold);
  color: inherit;
 }

 .ed-row__add {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-brand);
  opacity: 0;
 }

 .ed-row:is(:hover, :focus-visible, .is-first) .ed-row__add {
  opacity: 1;
 }

 .ed-none {
  padding: 14px 8px;
  font-size: 13px;
  color: var(--sd-muted);
 }

 .ed-hint {
  border-top: 1px solid var(--sd-rule);
  padding: 11px 14px;
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 .ed-hint b {
  color: var(--sd-strong);
 }

 /* The page */
 .ed-stage {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
 }

 /* The canvas's own header, like the inspector's: where it is, and how to show it. */
 .ed-stage__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .ed-canvas {
  padding: 22px;
  background: var(--sd-sunken);
 }

 .ed-page {
  max-width: 860px;
  margin: 0 auto;
  border-radius: 6px;
  transition: max-width 0.4s var(--sd-ease);
 }

 .ed-page.is-phone {
  max-width: 390px;
 }

 .ed-block {
  position: relative;
  cursor: pointer;
 }

 .ed-block::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  outline: 2px solid transparent;
  outline-offset: -2px;
  pointer-events: none;
  transition: outline-color 0.16s var(--sd-ease);
 }

 .ed-block:hover::after {
  outline-color: color-mix(in srgb, var(--sd-brand) 38%, transparent);
 }

 .ed-block.is-selected::after {
  outline-color: var(--sd-brand);
 }

 .ed-block:focus-visible {
  outline: none;
 }

 .ed-block:focus-visible::after {
  outline: 3px solid var(--sd-brand);
 }

 .ed-block.is-fresh {
  animation: ed-arrive 0.6s var(--sd-ease);
 }

 @keyframes ed-arrive {
  from {
   clip-path: inset(0 0 100% 0);
   opacity: 0.4;
  }
  to {
   clip-path: inset(0 0 0 0);
   opacity: 1;
  }
 }

 .ed-block__tag {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: none;
  border-radius: 0 0 6px 0;
  padding: 5px 8px;
  background: var(--sd-brand);
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-on-brand);
 }

 .ed-block.is-selected .ed-block__tag {
  display: block;
 }

 .ed-block__tools {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  background: var(--sd-raised);
  box-shadow: 0 6px 16px -8px rgb(20 40 28 / 0.35);
 }

 .ed-block__tools button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border: 0;
  background: none;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .ed-block__tools button:hover {
  background: var(--sd-soft);
  color: var(--sd-strong);
 }

 .ed-empty {
  padding: 56px 24px;
  font-size: 14px;
  text-align: center;
  color: var(--sd-muted);
 }

 /* Inspector */
 .ed-inspector {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  min-height: 0;
  border-left: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .ed-inspector__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .ed-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 10px 0 16px;
 }

 .ed-head__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sd-soft);
  color: var(--sd-strong);
 }

 .ed-head__name {
  flex: 1;
  min-width: 0;
 }

 .ed-head__title {
  font: 700 17px/1.15 var(--sd-display);
  color: var(--sd-strong);
 }

 .ed-tabs {
  display: flex;
  gap: 22px;
  margin-top: 12px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .ed-tabs button {
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 8px 0 10px;
  background: none;
  font-size: 14px;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .ed-tabs button[aria-selected='true'] {
  border-bottom-color: var(--sd-strong);
  font-weight: 600;
  color: var(--sd-strong);
 }

 .ed-sec {
  border-bottom: 1px solid var(--sd-rule);
 }

 .ed-sec__head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  border: 0;
  padding: 0 16px;
  background: none;
  text-align: left;
  cursor: pointer;
 }

 .ed-sec__head b {
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .ed-sec__peek {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-muted);
 }

 .ed-sec__head .sd-icon {
  color: var(--sd-muted);
  transition: rotate 0.2s var(--sd-ease);
 }

 .ed-sec.is-open .ed-sec__peek {
  visibility: hidden;
 }

 .ed-sec.is-open .ed-sec__head .sd-icon {
  rotate: 180deg;
 }

 .ed-sec__body {
  padding: 0 16px 18px;
 }

 .ed-item + .ed-item {
  margin-top: 18px;
 }

 .ed-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 6px;
 }

 .ed-add {
  width: 100%;
  margin-top: 16px;
 }

 .ed-style {
  padding: 16px;
 }

 .ed-style .sd-field + .sd-field {
  margin-top: 18px;
 }

 .ed-swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
 }

 .ed-swatch {
  display: grid;
  justify-items: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  padding: 6px 0 4px;
  background: none;
  font-size: 12px;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .ed-swatch__chip {
  width: 100%;
  height: 30px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
 }

 .ed-swatch[aria-pressed='true'] {
  font-weight: 600;
  color: var(--sd-strong);
 }

 .ed-swatch[aria-pressed='true'] .ed-swatch__chip {
  box-shadow:
   inset 0 0 0 1px rgb(0 0 0 / 0.12),
   0 0 0 2px var(--sd-raised),
   0 0 0 4px var(--sd-brand);
 }

 .ed-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
 }

 .ed-line .sd-label {
  margin: 0;
 }

 .ed-inspector__note {
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .ed-nothing {
  padding: 24px 16px;
  font-size: 13.5px;
  color: var(--sd-muted);
 }

 .ed-nothing p + p {
  margin-top: 6px;
 }

 /* Between a laptop and a phone: the block list folds away. */
 @container sd (max-width: 1060px) {
  .ed-main {
   grid-template-columns: minmax(0, 1fr) 288px;
  }

  .ed-tray {
   display: none;
  }

  .ed[data-pane='blocks'] .ed-tray {
   position: absolute;
   inset: 99px auto 0 60px;
   z-index: 6;
   display: grid;
   width: 248px;
   box-shadow: 12px 0 28px -18px rgb(20 40 28 / 0.4);
  }

  .ed .ed-panes {
   display: flex;
  }

  .ed .ed-panes button:last-child {
   display: none;
  }
 }

 /* A phone: one pane at a time. */
 @container sd (max-width: 760px) {
  .ed-stage__bar {
   display: none;
  }

  .ed .ed-panes button:last-child {
   display: block;
  }

  .ed-main {
   grid-template-columns: minmax(0, 1fr);
  }

  .ed[data-pane='blocks'] .ed-tray {
   position: static;
   width: auto;
   box-shadow: none;
  }

  .ed-inspector {
   display: none;
  }

  .ed[data-pane='blocks'] .ed-stage,
  .ed[data-pane='edit'] .ed-stage {
   display: none;
  }

  .ed[data-pane='edit'] .ed-inspector {
   display: grid;
  }

  .ed-canvas {
   padding: 12px;
  }

  /* The crumbs already name the page, so the panes take the left. */
  .ed-title,
  .ed-status {
   display: none;
  }

  .ed .ed-panes {
   margin-right: auto;
  }
 }
</style>
