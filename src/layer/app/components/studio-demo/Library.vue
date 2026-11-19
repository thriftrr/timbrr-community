<script setup>
 // The Library: what the site shares between pages. A shared block is one
 // block on many pages, so a change here reaches all of them at once. A
 // template is the blocks a new page starts with. The header and footer are
 // the same on every page.
 import { BLOCKS, FRAMES, SHARED, TEMPLATES } from '../../utils/studio-demo/sample.js';
 import { themeStyle } from '../../utils/studio-demo/theme.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));
 const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

 const VIEWS = [
  ['shared', 'Shared blocks'],
  ['templates', 'Templates'],
  ['frames', 'Header & footer'],
 ];
 const view = ref('shared');
 // At a phone's width one pane shows at a time.
 const pane = ref('list');

 // Each shared block keeps what's live beside what you're typing, so the
 // room can say when there's something to publish.
 const shared = ref(SHARED.map((entry) => ({ ...copy(entry), live: copy(entry.data) })));
 const pickedShared = ref(shared.value[0].id);
 const item = computed(() => shared.value.find((entry) => entry.id === pickedShared.value));
 const itemChanged = computed(() => !same(item.value.data, item.value.live));
 // One-line fields can't be empty: the block would show a gap on every page.
 const itemMissing = computed(() => item.value.fields.filter(([key, , kind]) => kind !== 'area' && !String(item.value.data[key]).trim()).map(([key]) => key));

 const templates = TEMPLATES;
 const pickedTemplate = ref(templates[0].id);
 const template = computed(() => templates.find((entry) => entry.id === pickedTemplate.value));

 const frames = reactive(copy(FRAMES));
 const framesLive = ref(copy(FRAMES));
 const framesChanged = computed(() => !same(frames, framesLive.value));
 const frameErrors = computed(() => ({
  button: frames.button.trim() ? '' : 'Add a button label. The header’s button needs words.',
  phone: frames.phone.replace(/\D/g, '').length >= 7 ? '' : 'Add a phone number with at least 7 digits.',
 }));
 const framesOk = computed(() => !frameErrors.value.button && !frameErrors.value.phone);

 // "Home, Contact, Boilers and Emergencies"
 const list = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
 const pages = (count) => `${count} page${count === 1 ? '' : 's'}`;
 const label = (type) => BLOCKS[type]?.label ?? type;

 watch(
  [view, pickedShared, pickedTemplate],
  () => {
   const name = { shared: item.value.name, templates: template.value.name, frames: null }[view.value];
   demo.crumb.value = ['Library', VIEWS.find(([key]) => key === view.value)[1], name].filter(Boolean);
  },
  { immediate: true },
 );

 function pick(kind, id) {
  if (kind === 'shared') pickedShared.value = id;
  else pickedTemplate.value = id;
  pane.value = 'edit';
 }

 function show(next) {
  view.value = next;
  pane.value = 'list';
 }

 function publishShared() {
  item.value.live = copy(item.value.data);
  demo.toast(`Publishing is off in the demo. On your own site, ${item.value.name} goes live on ${list(item.value.usedOn)} at once.`, { link: true });
 }

 function discardShared() {
  item.value.data = copy(item.value.live);
 }

 function newPage() {
  demo.toast(`On your site this makes a draft page with the ${template.value.name} blocks, ready to fill in. Nothing goes live until you publish it.`);
 }

 function publishFrames() {
  framesLive.value = copy(frames);
  demo.toast('Publishing is off in the demo. On your own site, the new header and footer go live on every page at once.', { link: true });
 }

 function discardFrames() {
  Object.assign(frames, copy(framesLive.value));
 }
</script>

<template>
 <div class="li" :data-pane="pane" :data-view="view">
  <div class="li-bar">
   <h2 class="sd-title li-title">Library</h2>
   <div class="li-tabs" role="tablist" aria-label="Library">
    <button v-for="[key, name] in VIEWS" :key="key" type="button" role="tab" :aria-selected="view === key" @click="show(key)">{{ name }}</button>
   </div>
   <!-- A phone has no room for tabs and the pane switch, so the tabs fold into this. -->
   <select class="sd-input li-pick" aria-label="Library" :value="view" @change="show($event.target.value)">
    <option v-for="[key, name] in VIEWS" :key="key" :value="key">{{ name }}</option>
   </select>
   <div class="sd-seg li-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'list'" @click="pane = 'list'">{{ view === 'frames' ? 'Edit' : 'List' }}</button>
    <button type="button" :aria-pressed="pane === 'edit'" @click="pane = 'edit'">{{ view === 'frames' ? 'Preview' : 'Edit' }}</button>
   </div>
   <!-- Status, then the main action, for whatever the tab has open. -->
   <div class="li-acts">
    <template v-if="view === 'shared'">
     <span class="li-status" role="status">{{ itemChanged ? 'Changes not published' : 'Up to date' }}</span>
     <button v-if="itemChanged" type="button" class="sd-btn sd-btn--ghost" @click="discardShared">Discard</button>
     <button type="button" class="sd-btn sd-btn--primary" :disabled="!itemChanged || itemMissing.length > 0" @click="publishShared">Publish</button>
    </template>
    <button v-else-if="view === 'templates'" type="button" class="sd-btn sd-btn--primary" @click="newPage"><StudioDemoIcon name="plus" :size="14" />New page<span class="sd-sr"> from this template</span></button>
    <template v-else>
     <span class="li-status" role="status">{{ framesChanged ? 'Changes not published' : 'Up to date' }}</span>
     <button v-if="framesChanged" type="button" class="sd-btn sd-btn--ghost" @click="discardFrames">Discard</button>
     <button type="button" class="sd-btn sd-btn--primary" :disabled="!framesChanged || !framesOk" @click="publishFrames">Publish</button>
    </template>
   </div>
  </div>

  <!-- Shared blocks -->
  <div v-if="view === 'shared'" class="li-main">
   <aside class="li-list" aria-label="Shared blocks">
    <p class="li-list__bar sd-caps">{{ shared.length }} shared blocks</p>
    <div class="sd-pane">
     <button v-for="entry in shared" :key="entry.id" type="button" class="li-row" :aria-pressed="entry.id === pickedShared" @click="pick('shared', entry.id)">
      <span class="li-row__icon" aria-hidden="true"><StudioDemoIcon name="library" :size="16" /></span>
      <span class="li-row__text">
       <b>{{ entry.name }}</b>
       <span>Used on {{ pages(entry.usedOn.length) }}</span>
      </span>
      <span v-if="!same(entry.data, entry.live)" class="li-row__dot" title="Changes not published"><span class="sd-sr">Changes not published</span></span>
     </button>
    </div>
    <p class="li-list__foot">One block, used on many pages. Change it here and every page that uses it follows.</p>
   </aside>

   <section class="li-detail" :aria-label="item.name">
    <div class="li-head">
     <span class="li-head__icon" aria-hidden="true"><StudioDemoIcon name="library" :size="18" /></span>
     <div class="li-head__name">
      <p class="li-head__title">{{ item.name }}</p>
      <p class="li-head__kind">Used on {{ pages(item.usedOn.length) }}</p>
     </div>
     <span v-if="itemChanged" class="sd-badge sd-badge--draft">Draft</span>
     <span v-else class="sd-badge sd-badge--live">Live</span>
    </div>
    <p class="li-reach">
     <StudioDemoIcon name="globe" :size="15" />
     <span>Publishing changes it on <b>{{ list(item.usedOn) }}</b> at once.</span>
    </p>
    <div class="li-work">
     <div class="li-fields sd-pane">
      <div v-for="[key, name, kind] in item.fields" :key="`${item.id}-${key}`" class="sd-field">
       <label class="sd-label" :for="`li-${item.id}-${key}`">{{ name }}</label>
       <textarea v-if="kind === 'area'" :id="`li-${item.id}-${key}`" v-model="item.data[key]" class="sd-input" rows="3" />
       <input v-else :id="`li-${item.id}-${key}`" v-model="item.data[key]" class="sd-input" :aria-invalid="itemMissing.includes(key)" :aria-describedby="itemMissing.includes(key) ? `li-${item.id}-${key}-err` : null" />
       <p v-if="itemMissing.includes(key)" :id="`li-${item.id}-${key}-err`" class="sd-help li-error"><StudioDemoIcon name="alert-triangle" :size="13" />Fill this in, or it shows empty on {{ pages(item.usedOn.length) }}.</p>
      </div>
     </div>
     <div class="li-stage sd-pane" aria-label="Preview">
      <p class="sd-caps li-stage__cap">Preview</p>
      <div class="sd-site li-site" :style="themeStyle(demo.theme)">
       <section v-if="item.id === 'hours'" class="li-hours">
        <h3>{{ item.name }}</h3>
        <dl>
         <div v-for="[key, name] in item.fields.filter(([field]) => field !== 'note')" :key="key">
          <dt>{{ name }}</dt>
          <dd>{{ item.data[key] || '—' }}</dd>
         </div>
        </dl>
        <p v-if="item.data.note">{{ item.data.note }}</p>
       </section>
       <section v-else class="li-banner">
        <p>{{ item.data.text }}</p>
        <span v-if="item.data.button" class="li-banner__button">{{ item.data.button }}</span>
       </section>
      </div>
     </div>
    </div>
   </section>
  </div>

  <!-- Templates -->
  <div v-else-if="view === 'templates'" class="li-main">
   <aside class="li-list" aria-label="Templates">
    <p class="li-list__bar sd-caps">{{ templates.length }} templates</p>
    <div class="sd-pane">
     <button v-for="entry in templates" :key="entry.id" type="button" class="li-row" :aria-pressed="entry.id === pickedTemplate" @click="pick('template', entry.id)">
      <span class="li-row__icon" aria-hidden="true"><StudioDemoIcon name="layout-grid" :size="16" /></span>
      <span class="li-row__text">
       <b>{{ entry.name }}</b>
       <span class="li-row__blocks" aria-hidden="true"><StudioDemoIcon v-for="(type, index) in entry.blocks" :key="index" :name="type" :size="14" /></span>
       <span>Used by {{ pages(entry.usedBy) }}</span>
      </span>
     </button>
    </div>
    <p class="li-list__foot">A template is the blocks a new page starts with. Changing a page later leaves its template alone.</p>
   </aside>

   <section class="li-detail" :aria-label="template.name">
    <div class="li-head">
     <span class="li-head__icon" aria-hidden="true"><StudioDemoIcon name="layout-grid" :size="18" /></span>
     <div class="li-head__name">
      <p class="li-head__title">{{ template.name }}</p>
      <p class="li-head__kind">Used by {{ pages(template.usedBy) }}</p>
     </div>
    </div>
    <div class="li-outline sd-pane">
     <p class="li-outline__bar sd-caps">{{ template.blocks.length }} blocks, top to bottom</p>
     <ol>
      <li class="li-outline__frame"><StudioDemoIcon name="pages" :size="15" />Header<span>Same on every page</span></li>
      <li v-for="(type, index) in template.blocks" :key="index">
       <span class="li-outline__num">{{ index + 1 }}</span>
       <StudioDemoIcon :name="type" :size="16" />
       <b>{{ label(type) }}</b>
      </li>
      <li class="li-outline__frame"><StudioDemoIcon name="pages" :size="15" />Footer<span>Same on every page</span></li>
     </ol>
     <p class="li-outline__note">A new page gets these blocks with their starting words, as a draft. Swap the words for your own, then publish.</p>
    </div>
   </section>
  </div>

  <!-- Header & footer -->
  <div v-else class="li-main">
   <aside class="li-list" aria-label="Header and footer fields">
    <p class="li-list__bar sd-caps">3 fields</p>
    <div class="sd-pane">
     <section class="li-group">
      <h3 class="li-group__head">Header</h3>
      <div class="sd-field">
       <label class="sd-label" for="li-frame-button">Button label</label>
       <input id="li-frame-button" v-model="frames.button" class="sd-input" :aria-invalid="Boolean(frameErrors.button)" :aria-describedby="frameErrors.button ? 'li-frame-button-err' : null" />
       <p v-if="frameErrors.button" id="li-frame-button-err" class="sd-help li-error"><StudioDemoIcon name="alert-triangle" :size="13" />{{ frameErrors.button }}</p>
      </div>
     </section>
     <section class="li-group">
      <h3 class="li-group__head">Footer</h3>
      <div class="sd-field">
       <label class="sd-label" for="li-frame-phone">Phone</label>
       <input id="li-frame-phone" v-model="frames.phone" class="sd-input" type="tel" inputmode="tel" :aria-invalid="Boolean(frameErrors.phone)" :aria-describedby="frameErrors.phone ? 'li-frame-phone-err' : null" />
       <p v-if="frameErrors.phone" id="li-frame-phone-err" class="sd-help li-error"><StudioDemoIcon name="alert-triangle" :size="13" />{{ frameErrors.phone }}</p>
      </div>
      <div class="sd-field">
       <label class="sd-label" for="li-frame-blurb">About the business</label>
       <textarea id="li-frame-blurb" v-model="frames.blurb" class="sd-input" rows="3" />
       <p class="sd-help">A line or two. It sits at the bottom of every page.</p>
      </div>
     </section>
    </div>
    <p class="li-list__foot">One header and one footer for every page.</p>
   </aside>

   <section class="li-detail" aria-label="Header and footer">
    <div class="li-head">
     <span class="li-head__icon" aria-hidden="true"><StudioDemoIcon name="pages" :size="18" /></span>
     <div class="li-head__name">
      <p class="li-head__title">Header &amp; footer</p>
      <p class="li-head__kind">Used on every page</p>
     </div>
     <span v-if="framesChanged" class="sd-badge sd-badge--draft">Draft</span>
     <span v-else class="sd-badge sd-badge--live">Live</span>
    </div>
    <p class="li-reach">
     <StudioDemoIcon name="globe" :size="15" />
     <span>One header and one footer for every page. Publishing changes them <b>everywhere at once</b>.</span>
    </p>
    <div class="li-stage sd-pane" aria-label="Preview">
     <div class="sd-site li-site li-site--page" :style="themeStyle(demo.theme)">
      <StudioDemoSite type="header" :data="{ button: frames.button }" />
      <!-- A plain stand-in for the page's own blocks: they sit between the frames but are not part of them. -->
      <div class="li-ghost">
       <p>This page’s own blocks</p>
      </div>
      <p v-if="frames.blurb.trim()" class="li-blurb">{{ frames.blurb }}</p>
      <StudioDemoSite type="footer" :data="{ phone: frames.phone }" />
     </div>
    </div>
   </section>
  </div>
 </div>
</template>

<style>
 .li {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .li-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .li-title {
  white-space: nowrap;
 }

 .li-tabs {
  display: flex;
  align-self: stretch;
  gap: 22px;
  margin-left: 12px;
  min-width: 0;
  margin-right: auto;
 }

 .li-tabs button {
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 0;
  background: none;
  font-size: 14px;
  white-space: nowrap;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .li-tabs button:hover {
  color: var(--sd-strong);
 }

 .li-tabs button[aria-selected='true'] {
  border-bottom-color: var(--sd-strong);
  font-weight: 600;
  color: var(--sd-strong);
 }

 .li .li-panes,
 .li .li-pick {
  display: none;
 }

 .li-main {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  min-height: 0;
 }

 /* The list on the left */
 .li-list {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .li-list__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .li-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  border: 0;
  border-bottom: 1px solid var(--sd-rule);
  padding: 12px 16px;
  background: none;
  text-align: left;
  color: var(--sd-ink);
  cursor: pointer;
  transition: background-color 0.16s var(--sd-ease);
 }

 .li-row:hover {
  background: var(--sd-field);
 }

 .li-row[aria-pressed='true'] {
  background: var(--sd-soft);
 }

 .li-row__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--sd-sunken);
  color: var(--sd-strong);
 }

 .li-row[aria-pressed='true'] .li-row__icon {
  background: var(--sd-raised);
 }

 .li-row__text {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
 }

 .li-row__text b {
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .li-row__text > span {
  font-size: 12px;
  color: var(--sd-muted);
 }

 .li-row__blocks {
  display: flex;
  gap: 6px;
  padding: 2px 0;
 }

 .li-row__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: #b8860b;
 }

 .li-list__foot {
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 .li-group {
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px 18px;
 }

 .li-group__head {
  display: flex;
  align-items: center;
  height: 48px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .sd-help.li-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--sd-danger);
 }

 .li-error .sd-icon {
  flex: none;
  margin-top: 2px;
 }

 /* The open item on the right */
 .li-detail {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: var(--sd-raised);
 }

 .li-acts {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
 }

 /* Publish keeps its place like every other room; it wakes up once there is a change. */
 .li-status {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
  white-space: nowrap;
 }

 .li-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 12px 16px;
 }

 .li-head__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sd-soft);
  color: var(--sd-strong);
 }

 .li-head__name {
  flex: 1;
  min-width: 140px;
 }

 .li-head__title {
  font: 700 17px/1.15 var(--sd-display);
  color: var(--sd-strong);
 }

 .li-head__kind {
  font: 400 13px/1.4 var(--sd-body);
  color: var(--sd-muted);
 }

 .li-reach {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 10px 16px;
  background: var(--sd-soft);
  font-size: 13px;
  color: var(--sd-ink);
 }

 .li-reach .sd-icon {
  flex: none;
  color: var(--sd-brand);
 }

 .li-reach b {
  color: var(--sd-strong);
 }

 .li-work {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 0;
 }

 .li-fields {
  border-right: 1px solid var(--sd-rule);
  padding: 16px;
 }

 .li-fields .sd-field + .sd-field {
  margin-top: 16px;
 }

 .li-stage {
  padding: 22px;
  background: var(--sd-sunken);
 }

 .li-stage__cap {
  max-width: 620px;
  margin: 0 auto 10px;
 }

 .li-site {
  max-width: 620px;
  margin: 0 auto;
  border-radius: 6px;
 }

 .li-site--page {
  max-width: 820px;
 }

 /* The shared blocks, drawn in the site's own look */
 .li-hours {
  padding: 32px 36px;
  font-family: var(--s-body-font);
  color: var(--s-text);
 }

 .li-hours h3 {
  font: 700 22px/1.2 var(--s-head-font);
  color: var(--s-heading);
 }

 .li-hours dl {
  margin-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--s-heading) 14%, var(--s-paper));
 }

 .li-hours dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--s-heading) 14%, var(--s-paper));
  padding: 10px 0;
  font-size: 14px;
 }

 .li-hours dd {
  font-weight: 600;
  text-align: right;
  color: var(--s-heading);
 }

 .li-hours > p {
  margin-top: 14px;
  font-size: 13.5px;
 }

 .li-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 20px;
  padding: 20px 28px;
  background: var(--s-brand);
  font-family: var(--s-body-font);
  color: var(--s-brand-ink);
 }

 .li-banner p {
  flex: 1;
  min-width: 180px;
  font: 600 16px/1.35 var(--s-head-font);
 }

 .li-banner__button {
  border-radius: calc(var(--s-corners) * 0.8);
  padding: 10px 16px;
  background: var(--s-brand-ink);
  font: 600 14px/1 var(--s-body-font);
  color: var(--s-brand);
 }

 .li-ghost {
  display: grid;
  place-items: center;
  min-height: 240px;
  padding: 24px 28px;
  background: color-mix(in srgb, var(--s-text) 6%, var(--s-paper));
  font: 500 14px/1.4 var(--sd-body);
  color: var(--s-text);
 }

 /* The footer's line about the business: drawn as part of the footer band. */
 .li-blurb {
  padding: 22px 28px 0;
  background: var(--s-dark);
  font: 13.5px/1.5 var(--s-body-font);
  color: color-mix(in srgb, #fff 88%, var(--s-dark));
 }

 /* A template's blocks */
 .li-outline ol {
  list-style: none;
 }

 .li-outline__bar {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
 }

 .li-outline li {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-top: 1px solid var(--sd-rule);
  padding: 0 16px;
  font-size: 14px;
  color: var(--sd-strong);
 }

 .li-outline li:last-child {
  border-bottom: 1px solid var(--sd-rule);
 }

 .li-outline li .sd-icon {
  flex: none;
  color: var(--sd-muted);
 }

 .li-outline li b {
  flex: 1;
  min-width: 0;
  font-weight: 600;
 }

 .li-outline__num {
  width: 18px;
  font: 500 12.5px/1 var(--sd-body);
  text-align: right;
  color: var(--sd-muted);
 }

 .li-outline .li-outline__frame {
  height: 40px;
  background: var(--sd-field);
  font-size: 13px;
  color: var(--sd-muted);
 }

 .li-outline__frame .sd-icon {
  margin-left: 30px;
 }

 .li-outline__frame span {
  margin-left: auto;
  font-size: 12px;
 }

 .li-outline__note {
  padding: 14px 16px;
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 /* Between a laptop and a phone: the open item stacks its fields over the preview. */
 @container sd (max-width: 1060px) {
  .li-main {
   grid-template-columns: 248px minmax(0, 1fr);
  }

  /* The preview first, so you see what the block is before you change it. */
  .li-work {
   display: flex;
   flex-direction: column-reverse;
   justify-content: flex-end;
   overflow: auto;
  }

  .li-work > .sd-pane {
   overflow: visible;
  }

  .li-fields {
   border-top: 1px solid var(--sd-rule);
   border-right: 0;
  }
 }

 /* A phone: one pane at a time. */
 @container sd (max-width: 760px) {
  /* One row: the tabs as a menu, then the pane switch, then the action. */
  .li-bar {
   gap: 8px;
   padding: 0 12px;
  }

  .li-title {
   display: none;
  }

  .li-tabs {
   display: none;
  }

  .li .li-pick {
   display: block;
   flex: 0 1 auto;
   width: auto;
   min-width: 0;
   min-height: 32px;
   padding-top: 0;
   padding-bottom: 0;
  }

  .li .li-panes {
   display: flex;
   flex: none;
  }

  .li-status {
   display: none;
  }

  .li-main {
   grid-template-columns: minmax(0, 1fr);
  }

  .li[data-pane='list'] .li-detail,
  .li[data-pane='edit'] .li-list {
   display: none;
  }

  .li-list {
   border-right: 0;
  }

  .li-stage {
   padding: 12px;
  }

  .li-hours {
   padding: 24px 20px;
  }

  .li-outline__frame span {
   display: none;
  }
 }
</style>
