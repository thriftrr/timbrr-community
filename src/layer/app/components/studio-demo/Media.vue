<script setup>
 // Media: the site's files, as in the studio. Folders and views on the left,
 // the files in the middle, the picked file's details on the right. Alt text,
 // tags and folders change here and the counts follow; Upload adds the
 // sample files one at a time. Nothing leaves the browser.
 import { MEDIA, MEDIA_FOLDERS, UPLOADS, artSrc } from '../../utils/studio-demo/sample.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));

 const files = ref(copy(MEDIA));
 const needsAlt = (file) => file.kind !== 'PDF' && !file.alt.trim();
 const VIEWS = [
  { key: 'unused', label: 'Unused', icon: 'eye', test: (file) => !file.usedOn.length, none: 'Every file is used on a page.' },
  { key: 'noalt', label: 'Needs alt text', icon: 'alert-triangle', test: needsAlt, none: 'Every picture has alt text. Screen readers can describe them all.' },
 ];

 // What's on the left: 'all', a folder's name, or one of the views.
 const place = ref('all');
 const placeLabel = computed(() => (place.value === 'all' ? 'All files' : (VIEWS.find((entry) => entry.key === place.value)?.label ?? place.value)));
 const inPlace = (file, key = place.value) => key === 'all' || (VIEWS.find((entry) => entry.key === key)?.test(file) ?? file.folder === key);
 const count = (key) => files.value.filter((file) => inPlace(file, key)).length;

 const query = ref('');
 const mode = ref('icons');
 const sort = ref('newest');
 const kb = (file) => parseFloat(file.size) * (file.size.includes('MB') ? 1024 : 1);
 const shown = computed(() => {
  const words = query.value.trim().toLowerCase();
  const list = files.value.filter((file) => inPlace(file) && (!words || [file.name, file.alt, ...file.tags].some((text) => text.toLowerCase().includes(words))));
  // The list is kept newest first, so Newest is the order it's in.
  if (sort.value === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort.value === 'largest') return [...list].sort((a, b) => kb(b) - kb(a));
  return list;
 });
 const emptyNote = computed(() => {
  if (query.value.trim()) return `Nothing in ${placeLabel.value} matches “${query.value.trim()}”. Search looks at names, alt text and tags.`;
  return VIEWS.find((entry) => entry.key === place.value)?.none ?? `Nothing in ${placeLabel.value} yet. Upload a file, or move one here from its details.`;
 });

 const selected = ref('m2');
 const file = computed(() => files.value.find((entry) => entry.id === selected.value) ?? null);
 // At a phone's width one pane shows at a time.
 const pane = ref('files');

 function go(key) {
  place.value = key;
  pane.value = 'files';
  demo.crumb.value = key === 'all' ? null : ['Media', placeLabel.value];
 }

 function pick(id) {
  selected.value = id;
  pane.value = 'detail';
 }

 const size = (entry) => (entry.kind === 'PDF' ? `PDF · ${entry.pages} page${entry.pages === 1 ? '' : 's'}` : `${entry.width.toLocaleString('en-US')} × ${entry.height.toLocaleString('en-US')}`);
 const used = (entry) => (entry.usedOn.length ? `Used on ${entry.usedOn.length} page${entry.usedOn.length === 1 ? '' : 's'}` : 'Not used yet');

 // Upload: the next sample file, after a short progress bar.
 let uid = 0;
 const left = copy(UPLOADS);
 const uploading = ref(null);
 let timer;
 function upload() {
  if (uploading.value) return;
  const next = left.shift();
  if (!next) {
   demo.toast('That’s every sample file. On your site, Upload takes pictures, PDFs and video from your computer.');
   return;
  }
  uploading.value = next;
  timer = setTimeout(() => {
   // It lands in the folder you're in, so you see it arrive.
   const folder = MEDIA_FOLDERS.includes(place.value) ? place.value : next.folder;
   const fresh = { ...next, id: `u${++uid}`, folder, alt: '', usedOn: [], added: 'Just now', isNew: true };
   files.value.unshift(fresh);
   uploading.value = null;
   query.value = '';
   if (!inPlace(fresh)) go('all');
   selected.value = fresh.id;
   demo.toast(`${fresh.name} is in ${folder}. Give it alt text so screen readers can describe it.`);
  }, 1200);
 }
 onBeforeUnmount(() => clearTimeout(timer));

 // Details
 const tag = ref('');
 function addTag() {
  const word = tag.value.trim().toLowerCase();
  if (word && !file.value.tags.includes(word)) file.value.tags.push(word);
  tag.value = '';
 }

 function remove() {
  const at = shown.value.findIndex((entry) => entry.id === selected.value);
  const gone = file.value;
  files.value = files.value.filter((entry) => entry.id !== gone.id);
  const rest = shown.value;
  selected.value = (rest[at] ?? rest[at - 1])?.id ?? null;
  pane.value = 'files';
  demo.toast(`${gone.name} deleted. Start over brings it back.`);
 }

 function replace() {
  demo.toast('Replacing is off in the demo. On your site, the new file takes this one’s place on every page that uses it.');
 }

 function download() {
  demo.toast(`Downloads are off in the demo. On your site, this saves the original ${file.value.name}.`);
 }

 // The lightbox: the files in view, one at a time, over the whole room.
 const lit = ref(-1);
 const box = ref(null);
 let back = null;
 const litFile = computed(() => shown.value[lit.value] ?? null);
 function openBox(id = selected.value) {
  const at = shown.value.findIndex((entry) => entry.id === id);
  if (at < 0) return;
  back = document.activeElement;
  selected.value = id;
  lit.value = at;
  nextTick(() => box.value?.focus());
 }
 function closeBox() {
  lit.value = -1;
  nextTick(() => back?.isConnected && back.focus());
 }
 function step(by) {
  const total = shown.value.length;
  lit.value = (lit.value + by + total) % total;
  selected.value = litFile.value.id;
 }
 function onBoxKey(event) {
  if (event.key === 'Escape') closeBox();
  else if (event.key === 'ArrowRight') step(1);
  else if (event.key === 'ArrowLeft') step(-1);
  else return;
  event.preventDefault();
 }
</script>

<template>
 <div class="me" :data-pane="pane">
  <div class="me-bar" :inert="litFile ? true : undefined">
   <h2 class="sd-title me-title">Media</h2>
   <div class="sd-seg me-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'folders'" @click="pane = 'folders'">Folders</button>
    <button type="button" :aria-pressed="pane === 'files'" @click="pane = 'files'">List</button>
    <button type="button" :aria-pressed="pane === 'detail'" :disabled="!file" @click="pane = 'detail'">Edit</button>
   </div>
   <button type="button" class="sd-btn sd-btn--primary me-upload" :disabled="Boolean(uploading)" @click="upload"><StudioDemoIcon name="upload" :size="14" />Upload</button>
  </div>

  <div class="me-main" :inert="litFile ? true : undefined">
   <nav class="me-folders sd-pane" aria-label="Folders">
    <button type="button" class="me-place" :aria-current="place === 'all' ? 'true' : undefined" @click="go('all')">
     <StudioDemoIcon name="media" :size="16" />
     <span class="me-place__name">All files</span>
     <span class="me-place__count">{{ count('all') }}</span>
    </button>
    <p class="me-group">Folders</p>
    <button v-for="name in MEDIA_FOLDERS" :key="name" type="button" class="me-place" :aria-current="place === name ? 'true' : undefined" @click="go(name)">
     <StudioDemoIcon name="folder" :size="16" />
     <span class="me-place__name">{{ name }}</span>
     <span class="me-place__count">{{ count(name) }}</span>
    </button>
    <p class="me-group">Views</p>
    <button v-for="entry in VIEWS" :key="entry.key" type="button" class="me-place" :class="{ 'is-warn': entry.key === 'noalt' && count('noalt') }" :aria-current="place === entry.key ? 'true' : undefined" @click="go(entry.key)">
     <StudioDemoIcon :name="entry.icon" :size="16" />
     <span class="me-place__name">{{ entry.label }}</span>
     <span class="me-place__count">{{ count(entry.key) }}</span>
    </button>
   </nav>

   <main class="me-files sd-pane" :aria-label="placeLabel">
    <div class="me-head">
     <h3 class="me-head__title">{{ placeLabel }}</h3>
     <p class="me-head__count" role="status">{{ shown.length }} file{{ shown.length === 1 ? '' : 's' }}<template v-if="query.trim()"> match</template></p>
     <div class="me-tools">
      <label class="me-search">
       <StudioDemoIcon name="search" :size="15" />
       <span class="sd-sr">Search files</span>
       <input v-model="query" type="search" placeholder="Search names, alt text, tags" @keydown.esc="query = ''" />
       <button v-if="query" type="button" class="me-search__clear" aria-label="Clear search" @click="query = ''"><StudioDemoIcon name="x" :size="14" /></button>
      </label>
      <div class="sd-seg me-mode" aria-label="Show files as">
       <button type="button" :aria-pressed="mode === 'icons'" @click="mode = 'icons'"><StudioDemoIcon name="layout-grid" :size="14" /><span>Icons</span></button>
       <button type="button" :aria-pressed="mode === 'list'" @click="mode = 'list'"><StudioDemoIcon name="list-rows" :size="14" /><span>List</span></button>
      </div>
      <label class="me-sort">
       <span class="sd-sr">Sort by</span>
       <select v-model="sort" class="sd-input">
        <option value="newest">Newest</option>
        <option value="name">Name</option>
        <option value="largest">Largest</option>
       </select>
      </label>
     </div>
    </div>

    <ul v-if="mode === 'icons' && (shown.length || uploading)" class="me-grid">
     <li v-if="uploading" class="me-tile is-uploading">
      <span class="me-tile__pic">
       <img :src="artSrc(uploading.art)" alt="" />
       <span class="me-progress" aria-hidden="true"><span /></span>
      </span>
      <span class="me-tile__name"><span class="me-tile__file">{{ uploading.name }}</span></span>
      <span class="me-tile__meta" role="status">Uploading…</span>
     </li>
     <li v-for="entry in shown" :key="entry.id">
      <button type="button" class="me-tile" :aria-pressed="entry.id === selected" @click="pick(entry.id)" @dblclick="openBox(entry.id)">
       <span class="me-tile__pic"><img :src="artSrc(entry.art)" :alt="entry.alt" /></span>
       <span class="me-tile__name">
        <span class="me-tile__file">{{ entry.name }}</span>
        <span v-if="entry.isNew" class="sd-badge sd-badge--live">New</span>
       </span>
       <span class="me-tile__meta">{{ size(entry) }}</span>
       <span class="me-tile__meta">
        {{ used(entry) }}
        <span v-if="needsAlt(entry)" class="me-flag" title="Needs alt text"><StudioDemoIcon name="alert-triangle" :size="13" /><span class="sd-sr">, needs alt text</span></span>
       </span>
      </button>
     </li>
    </ul>

    <table v-else-if="mode === 'list' && (shown.length || uploading)" class="me-table">
     <thead>
      <tr>
       <th scope="col">Name</th>
       <th scope="col" class="me-col-folder">Folder</th>
       <th scope="col">Size</th>
       <th scope="col">Used on</th>
       <th scope="col" class="me-col-added">Added</th>
      </tr>
     </thead>
     <tbody>
      <tr v-if="uploading" class="is-uploading">
       <td>
        <span class="me-row__name">
         <img :src="artSrc(uploading.art)" alt="" class="me-row__thumb" />
         <span class="me-row__file">{{ uploading.name }}<span class="me-progress" aria-hidden="true"><span /></span></span>
        </span>
       </td>
       <td class="me-col-folder" />
       <td>{{ uploading.size }}</td>
       <td colspan="2" role="status">Uploading…</td>
      </tr>
      <tr v-for="entry in shown" :key="entry.id" :class="{ 'is-selected': entry.id === selected }" @click="pick(entry.id)" @dblclick="openBox(entry.id)">
       <td>
        <button type="button" class="me-row__name" :aria-pressed="entry.id === selected">
         <img :src="artSrc(entry.art)" :alt="entry.alt" class="me-row__thumb" />
         <span class="me-row__file">{{ entry.name }}</span>
         <span v-if="entry.isNew" class="sd-badge sd-badge--live">New</span>
         <span v-if="needsAlt(entry)" class="me-flag" title="Needs alt text"><StudioDemoIcon name="alert-triangle" :size="13" /><span class="sd-sr">Needs alt text</span></span>
        </button>
       </td>
       <td class="me-col-folder">{{ entry.folder }}</td>
       <td>{{ entry.size }}</td>
       <td>{{ entry.usedOn.length ? entry.usedOn.join(', ') : 'Not used yet' }}</td>
       <td class="me-col-added">{{ entry.added }}</td>
      </tr>
     </tbody>
    </table>

    <div v-else class="me-empty">
     <StudioDemoIcon :name="query.trim() ? 'search' : place === 'noalt' || place === 'unused' ? 'check' : 'image'" :size="22" />
     <p>{{ emptyNote }}</p>
     <button v-if="query.trim()" type="button" class="sd-btn" @click="query = ''">Clear search</button>
    </div>
   </main>

   <aside class="me-detail" aria-label="File details">
    <p class="me-detail__bar sd-caps">File</p>
    <template v-if="file">
     <div class="me-detail__body sd-pane">
      <button type="button" class="me-preview" :aria-label="`Open ${file.name} large`" @click="openBox()">
       <img :src="artSrc(file.art)" :alt="file.alt" />
      </button>
      <div class="me-name">
       <div class="me-name__text">
        <p class="me-name__title">{{ file.name }}</p>
        <p class="me-name__kind">{{ file.size }} {{ file.kind === 'PDF' ? 'PDF' : file.kind === 'Logo' ? 'logo' : 'picture' }}</p>
       </div>
       <button type="button" class="sd-btn" @click="openBox()"><StudioDemoIcon name="eye" :size="14" />Open</button>
      </div>

      <section class="me-sec">
       <template v-if="file.kind !== 'PDF'">
        <label class="sd-label" :for="`me-alt-${file.id}`">Alt text</label>
        <textarea :id="`me-alt-${file.id}`" v-model="file.alt" class="sd-input" rows="3" placeholder="What’s in the picture, as you’d tell someone on the phone" :aria-describedby="`me-alt-note-${file.id}`" />
        <p v-if="needsAlt(file)" :id="`me-alt-note-${file.id}`" class="me-warn"><StudioDemoIcon name="alert-triangle" :size="14" />Screen readers will skip this picture.</p>
        <p v-else :id="`me-alt-note-${file.id}`" class="sd-help">Read out to people who can’t see the picture, and shown if it can’t load.</p>
       </template>
       <template v-else>
        <p class="sd-label">Alt text</p>
        <p class="sd-help">PDFs open as their own page, so they don’t need alt text.</p>
       </template>
      </section>

      <section class="me-sec">
       <p :id="`me-tags-${file.id}`" class="sd-label">Tags</p>
       <ul v-if="file.tags.length" class="me-tags" :aria-labelledby="`me-tags-${file.id}`">
        <li v-for="(word, index) in file.tags" :key="word">
         <StudioDemoIcon name="tag" :size="14" />
         <span>{{ word }}</span>
         <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon" :aria-label="`Remove tag ${word}`" @click="file.tags.splice(index, 1)"><StudioDemoIcon name="x" :size="14" /></button>
        </li>
       </ul>
       <p v-else class="sd-help me-tags__none">No tags yet. Add one below so search finds this file.</p>
       <form class="me-tag-add" @submit.prevent="addTag">
        <label class="sd-sr" :for="`me-tag-${file.id}`">New tag</label>
        <input :id="`me-tag-${file.id}`" v-model="tag" class="sd-input" placeholder="Add a tag" />
        <button type="submit" class="sd-btn" :disabled="!tag.trim()"><StudioDemoIcon name="plus" :size="14" />Add</button>
       </form>
      </section>

      <section class="me-sec">
       <label class="sd-label" :for="`me-folder-${file.id}`">Folder</label>
       <select :id="`me-folder-${file.id}`" v-model="file.folder" class="sd-input">
        <option v-for="name in MEDIA_FOLDERS" :key="name" :value="name">{{ name }}</option>
       </select>
      </section>

      <section class="me-sec">
       <p class="sd-label">About this file</p>
       <dl class="me-facts">
        <div><dt>Type</dt><dd>{{ file.kind }}</dd></div>
        <div><dt>Size</dt><dd>{{ file.size }}</dd></div>
        <div v-if="file.kind === 'PDF'"><dt>Pages</dt><dd>{{ file.pages }}</dd></div>
        <div v-else><dt>Dimensions</dt><dd>{{ size(file) }} px</dd></div>
        <div><dt>Added</dt><dd>{{ file.added }}</dd></div>
        <div><dt>Used on</dt><dd>{{ file.usedOn.length ? file.usedOn.join(', ') : 'Not used yet' }}</dd></div>
       </dl>
      </section>
     </div>
     <div class="me-actions">
      <button type="button" class="sd-btn" @click="replace"><StudioDemoIcon name="refresh-cw" :size="14" />Replace</button>
      <button type="button" class="sd-btn" @click="download"><StudioDemoIcon name="download" :size="14" />Download</button>
      <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon sd-btn--danger me-actions__delete" :aria-label="`Delete ${file.name}`" title="Delete" @click="remove"><StudioDemoIcon name="trash" :size="15" /></button>
     </div>
    </template>
    <div v-else class="me-nothing">
     <p class="me-name__title">No file picked</p>
     <p>Click a file to see its alt text, tags and where it’s used.</p>
    </div>
   </aside>
  </div>

  <div v-if="litFile" ref="box" class="me-box" role="dialog" aria-modal="true" :aria-label="litFile.name" tabindex="-1" @keydown="onBoxKey">
   <div class="me-box__top">
    <p class="me-box__name">{{ litFile.name }}</p>
    <p class="me-box__count">{{ lit + 1 }} of {{ shown.length }}</p>
    <button type="button" class="me-box__btn" aria-label="Close" title="Close (Esc)" @click="closeBox"><StudioDemoIcon name="x" :size="18" /></button>
   </div>
   <div class="me-box__stage">
    <button type="button" class="me-box__btn" aria-label="Previous file" :disabled="shown.length < 2" @click="step(-1)"><StudioDemoIcon name="chevron-left" :size="20" /></button>
    <img :src="artSrc(litFile.art)" :alt="litFile.alt" />
    <button type="button" class="me-box__btn" aria-label="Next file" :disabled="shown.length < 2" @click="step(1)"><StudioDemoIcon name="chevron-right" :size="20" /></button>
   </div>
   <p class="me-box__alt">{{ litFile.alt || (litFile.kind === 'PDF' ? size(litFile) : 'No alt text yet') }}</p>
  </div>
 </div>
</template>

<style>
 .me {
  --me-warn: #7a5410;

  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .me-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 6px 12px 6px 16px;
  background: var(--sd-raised);
 }

 .me-title {
  white-space: nowrap;
 }

 .me .me-panes {
  display: none;
 }

 /* The main action, always on the right. */
 .me-upload {
  margin-left: auto;
 }

 /* Search, view and sort belong to the file list, so they sit in its header. */
 .me-tools {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
 }

 .me-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 1 260px;
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

 .me-search:focus-within {
  border-color: var(--sd-brand);
  box-shadow: var(--sd-ring);
 }

 .me-search input {
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

 .me-search input::placeholder {
  color: var(--sd-faint);
 }

 .me-search input::-webkit-search-cancel-button {
  display: none;
 }

 .me-search__clear {
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

 .me-search__clear:hover {
  background: var(--sd-sunken);
  color: var(--sd-strong);
 }

 .me-mode button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
 }

 .me-sort select {
  width: 116px;
  min-height: 32px;
  padding-block: 5px;
 }

 .me-main {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr) 300px;
  min-height: 0;
 }

 /* Folders and views */
 .me-folders {
  border-right: 1px solid var(--sd-rule);
  padding: 10px 6px 12px;
  background: var(--sd-raised);
 }

 .me-group {
  padding: 16px 8px 4px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .me .me-place {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 6px;
  padding: 0 8px;
  background: none;
  font-size: 14px;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 /* Inside the pane, so the ring sits inside the row and isn't cut off. */
 .me-place:focus-visible {
  outline-offset: -2px;
 }

 .me-place:hover {
  background: var(--sd-sunken);
 }

 .me-place[aria-current] {
  background: var(--sd-soft);
  font-weight: 600;
 }

 .me-place .sd-icon {
  color: var(--sd-muted);
 }

 .me-place[aria-current] .sd-icon {
  color: var(--sd-brand);
 }

 .me-place.is-warn .sd-icon {
  color: var(--me-warn);
 }

 .me-place__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .me-place__count {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 /* The files */
 .me-files {
  padding: 0 20px 24px;
 }

 .me-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin: 0 -20px 4px;
  padding: 16px 20px 12px;
  background: var(--sd-paper);
 }

 .me-head__title {
  font: 700 17px/1.15 var(--sd-display);
  color: var(--sd-strong);
 }

 .me-head__count {
  font: 400 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .me-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 18px 14px;
 }

 .me-tile {
  display: grid;
  gap: 3px;
  align-content: start;
  width: 100%;
  border: 0;
  padding: 0;
  background: none;
  text-align: left;
  color: var(--sd-ink);
  cursor: pointer;
 }

 .me .me-tile:focus-visible {
  outline: none;
 }

 .me-tile__pic {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  margin-bottom: 6px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--sd-sunken);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06);
  transition: box-shadow 0.16s var(--sd-ease);
 }

 .me-tile__pic img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
 }

 .me-tile:hover .me-tile__pic {
  box-shadow:
   0 0 0 2px var(--sd-paper),
   0 0 0 4px color-mix(in srgb, var(--sd-brand) 35%, transparent);
 }

 .me-tile[aria-pressed='true'] .me-tile__pic {
  box-shadow:
   0 0 0 2px var(--sd-paper),
   0 0 0 4px var(--sd-brand);
 }

 .me-tile:focus-visible .me-tile__pic {
  outline: 2px solid var(--sd-brand);
  outline-offset: 5px;
 }

 .me-tile__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .me-tile__file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .me-tile__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .me-flag {
  display: inline-flex;
  color: var(--me-warn);
 }

 .me-tile.is-uploading {
  cursor: default;
 }

 .is-uploading img {
  opacity: 0.35;
  filter: grayscale(1);
 }

 /* Upload: a bar that fills in the time the file takes to arrive. */
 .me-progress {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: color-mix(in srgb, var(--sd-strong) 14%, transparent);
 }

 .me-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sd-brand);
  transform-origin: left;
  animation: me-fill 1.2s var(--sd-ease) both;
 }

 @keyframes me-fill {
  from {
   transform: scaleX(0.04);
  }
  to {
   transform: scaleX(1);
  }
 }

 /* List */
 .me-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
 }

 .me-table th {
  height: 36px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 10px;
  font: 500 12.5px/1 var(--sd-body);
  text-align: left;
  color: var(--sd-muted);
 }

 .me-table td {
  height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 10px;
  color: var(--sd-muted);
  white-space: nowrap;
 }

 .me-table :is(th, td):first-child {
  padding-left: 6px;
 }

 .me-table td:first-child {
  width: 100%;
  max-width: 0;
 }

 .me-table tbody tr {
  cursor: pointer;
 }

 .me-table tbody tr:hover {
  background: color-mix(in srgb, var(--sd-sunken) 60%, transparent);
 }

 .me-table tbody tr.is-selected {
  background: var(--sd-soft);
 }

 .me-table tr.is-uploading {
  cursor: default;
 }

 .me .me-row__name {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 0;
  background: none;
  font-size: 13.5px;
  font-weight: 600;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 .me-row__thumb {
  flex: none;
  width: 44px;
  height: 33px;
  border-radius: 5px;
  background: var(--sd-sunken);
  object-fit: contain;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06);
 }

 .me-row__file {
  position: relative;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
 }

 .me-row__file .me-progress {
  right: 0;
  bottom: -8px;
  left: 0;
 }

 .is-uploading .me-row__file {
  overflow: visible;
 }

 .me-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  max-width: 340px;
  margin: 48px auto 0;
  font-size: 13.5px;
  text-align: center;
  color: var(--sd-muted);
 }

 .me-empty .sd-icon {
  color: var(--sd-faint);
 }

 /* Details */
 .me-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  border-left: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .me-detail__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .me-preview {
  display: block;
  width: 100%;
  height: 196px;
  border: 0;
  border-bottom: 1px solid var(--sd-rule);
  padding: 14px;
  background: var(--sd-sunken);
  cursor: zoom-in;
 }

 .me-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
 }

 .me-preview:focus-visible {
  outline-offset: -3px;
 }

 .me-name {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 14px 12px 14px 16px;
 }

 .me-name__text {
  flex: 1;
  min-width: 0;
 }

 .me-name__title {
  overflow: hidden;
  font: 700 16px/1.2 var(--sd-display);
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-strong);
 }

 .me-name__kind {
  font: 400 13px/1.5 var(--sd-body);
  color: var(--sd-muted);
 }

 .me-sec {
  border-bottom: 1px solid var(--sd-rule);
  padding: 14px 16px 16px;
 }

 .me-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--me-warn);
 }

 .me-tags {
  margin: -2px 0 10px;
 }

 .me-tags li {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  border-bottom: 1px solid var(--sd-rule);
  font-size: 13px;
  color: var(--sd-strong);
 }

 .me-tags li .sd-icon {
  color: var(--sd-muted);
 }

 .me-tags li span {
  flex: 1;
 }

 .me-tags li .sd-btn--icon {
  width: 28px;
  height: 28px;
 }

 .me-tags__none {
  margin: 0 0 10px;
 }

 .me-tag-add {
  display: flex;
  gap: 8px;
 }

 .me-tag-add .sd-input {
  flex: 1;
  min-width: 0;
 }

 .me-tag-add .sd-btn {
  height: 34px;
 }

 .me-facts div {
  display: flex;
  gap: 12px;
  padding: 5px 0;
  font-size: 13px;
 }

 .me-facts dt {
  flex: none;
  width: 84px;
  color: var(--sd-muted);
 }

 .me-facts dd {
  min-width: 0;
  color: var(--sd-strong);
 }

 .me-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--sd-rule);
  padding: 10px 12px 10px 16px;
 }

 .me-actions__delete {
  margin-left: auto;
 }

 .me-nothing {
  padding: 24px 16px;
  font-size: 13.5px;
  color: var(--sd-muted);
 }

 .me-nothing p + p {
  margin-top: 6px;
 }

 /* The lightbox, over the whole room */
 .me-box {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: rgb(20 30 24 / 0.95);
  color: #f7f5ec;
  animation: me-in 0.2s var(--sd-ease);
 }

 .me .me-box:focus-visible {
  outline: none;
 }

 @keyframes me-in {
  from {
   opacity: 0;
  }
 }

 .me-box__top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 10px 10px 20px;
 }

 .me-box__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .me-box__count {
  font: 400 12.5px/1 var(--sd-body);
  color: #c9d1c8;
 }

 .me-box__btn {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.08);
  color: #f7f5ec;
  cursor: pointer;
 }

 .me-box__btn:hover {
  background: rgb(255 255 255 / 0.18);
 }

 .me-box__btn:disabled {
  opacity: 0.35;
  cursor: default;
 }

 .me .me-box :focus-visible {
  outline-color: #f7f5ec;
 }

 .me-box__stage {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 0;
  padding: 0 16px;
 }

 .me-box__stage img {
  flex: 1;
  min-width: 0;
  height: 100%;
  object-fit: contain;
 }

 .me-box__alt {
  justify-self: center;
  max-width: 60ch;
  padding: 12px 20px 18px;
  font-size: 13px;
  text-align: center;
  color: #c9d1c8;
 }

 /* Between a laptop and a phone: narrower side columns. */
 @container sd (max-width: 1060px) {
  .me-main {
   grid-template-columns: 176px minmax(0, 1fr) 272px;
  }

  .me-mode span,
  .me-col-added {
   display: none;
  }
 }

 /* A phone: one pane at a time. */
 @container sd (max-width: 760px) {
  .me-bar {
   flex-wrap: wrap;
   padding: 8px 12px;
  }

  .me .me-panes {
   display: flex;
   margin-right: auto;
  }

  /* The crumbs already name the room, so the panes take the left. */
  .me-title {
   display: none;
  }

  .me-tools {
   flex-basis: 100%;
  }

  .me-search {
   flex: 1;
  }

  .me-main {
   grid-template-columns: minmax(0, 1fr);
  }

  .me-folders,
  .me-detail,
  .me-files {
   display: none;
  }

  .me[data-pane='folders'] .me-folders,
  .me[data-pane='files'] .me-files {
   display: block;
  }

  .me[data-pane='detail'] .me-detail {
   display: grid;
   border-left: 0;
  }

  .me-files {
   padding: 0 12px 20px;
  }

  .me-head {
   margin-inline: -12px;
   padding-inline: 12px;
  }

  .me-grid {
   grid-template-columns: repeat(2, minmax(0, 1fr));
   gap: 16px 12px;
  }

  .me-col-folder {
   display: none;
  }

  .me-box__stage {
   gap: 6px;
   padding: 0 6px;
  }
 }
</style>
