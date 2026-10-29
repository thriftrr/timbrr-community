<script setup>
 // The studio's canvas (docs/manifest.md § Canvas). The builder frames this
 // page and sends it the draft page over postMessage; it draws the blocks
 // with this site's own components and styles — exactly what the live site
 // will show — and reports clicks, edits, drops and its height back. Text is
 // typed in place, one field at a time; where the caret is (and which tools
 // that field allows) goes to the studio's format bar, and its tools come
 // back here. In Render view the site's own header and footer frame the
 // page, locked: they come from the site's pages, not from blocks.
 //
 // With ?preview=1 it's the page exactly as the site draws it: no outlines,
 // tabs, typing or drop zones, and hidden blocks stay hidden (the tray's
 // previews and the builder's Preview use it). Either way it never fetches
 // content, never holds a token, and its links go nowhere. Every message is
 // checked against one origin: the configured studio, or localhost in
 // development.
 import { WYS_TOOLS } from '#timbrr/define';

 definePageMeta({ layout: false });

 const preview = useRoute().query.preview === '1';

 useHead({
  title: preview ? 'Preview' : 'Canvas',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  htmlAttrs: { 'data-timbrr-canvas': '' },
 });

 const config = useRuntimeConfig();
 const studio = String(config.public.studioOrigin ?? '').replace(/\/$/, '');

 const root = ref(null);
 const blocks = ref([]);
 const theme = ref({});
 const site = shallowRef(null); // the site's name, address and menu, for its header and footer
 const mode = ref('full'); // 'render': the page between the site's header and footer
 const connected = ref(false);
 const editable = ref(!preview); // false: a preview, or someone who can only look
 const ui = ref(1); // how much larger to draw the chrome, as the studio scales the frame down
 const selected = ref(null);
 const dragging = ref(null); // a block being moved inside the canvas
 const dropIndex = ref(null);
 const dropTop = ref(0);
 const active = shallowRef(null); // { id, field, kind } being typed into
 const editor = shallowRef(null); // the open rich-text editor, if any
 let parentOrigin = null;
 let focused = null; // { id, field, key } the studio last heard has the caret

 // A site with no name or address to show isn't framed at all.
 const framed = computed(() => mode.value === 'render' && Boolean(site.value?.name || site.value?.domain));

 function allowed(origin) {
  if (studio) return origin === studio;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
 }

 function post(message) {
  if (parentOrigin && window.parent !== window) window.parent.postMessage({ v: 1, ...message }, parentOrigin);
 }

 // ── The site's header and footer ──
 // Only strings and plain menu items (NavItem: label, kind, to, layout,
 // desc; children one level down) get as far as the components.

 const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

 function navItem(item, depth) {
  return {
   label: text(item.label, 120),
   kind: ['page', 'external', 'none'].includes(item.kind) ? item.kind : undefined,
   to: text(item.to, 2000),
   layout: item.layout === 'mega' ? 'mega' : 'dropdown',
   desc: text(item.desc, 200),
   children: depth > 0 ? navList(item.children, depth - 1) : [],
  };
 }

 function navList(list, depth) {
  return Array.isArray(list)
   ? list
      .filter((item) => item && typeof item === 'object')
      .slice(0, 40)
      .map((item) => navItem(item, depth))
   : [];
 }

 function siteFrom(value) {
  if (!value || typeof value !== 'object') return null;
  return {
   name: text(value.name, 120),
   domain: text(value.domain, 253),
   nav: navList(value.nav, 1),
   cta: value.cta && typeof value.cta === 'object' ? navItem(value.cta, 0) : null,
  };
 }

 // ── Fields: their tools and names, from the block's definition ──

 const DEFAULT_TOOLS = ['bold', 'italic'];

 // A rich field's tools: the block's `wys` for its path (an item's field
 // as 'items.*.body'), or bold and italic when it doesn't say.
 function toolsFor(def, path) {
  const wys = def?.wys ?? {};
  const pattern = String(path).replace(/\.\d+(?=\.|$)/g, '.*');
  const tools = wys[path] ?? wys[pattern] ?? DEFAULT_TOOLS;
  return WYS_TOOLS.filter((tool) => tools.includes(tool));
 }

 // A field's name for the studio: 'Description', or for a field in a list
 // the row and the field, 'Cards 2 · Title'.
 function labelFor(def, path) {
  const keys = String(path).split('.');
  const parts = [];
  let fields = def?.fields ?? [];
  for (let i = 0; i < keys.length; i += 1) {
   const field = fields.find((entry) => entry.key === keys[i]);
   if (!field) break;
   if (field.widget === 'items' && /^\d+$/.test(keys[i + 1] ?? '')) {
    parts.push(`${field.label} ${Number(keys[i + 1]) + 1}`);
    i += 1;
   } else parts.push(field.label);
   fields = field.subfields ?? [];
  }
  return parts.join(' · ') || keys.at(-1);
 }

 // ── Typing in place ──

 function activate(field) {
  active.value = field;
 }

 // Give up the field (Escape, a click elsewhere, or it went away). The
 // studio hears even if the caret had already gone out to it, since its
 // format bar may still be showing this field.
 function release(id, field) {
  if (active.value?.id !== id || active.value?.field !== field) {
   blur(id, field);
   return;
  }
  active.value = null;
  focused = null;
  post({ type: 'timbrr:blur' });
 }

 // The caret is in a field: say which, what it allows and what's on there
 // (only when that changed), and select its block.
 function focus({ id, field, kind, label, tools = [], active: on = [], href = null }) {
  const message = { type: 'timbrr:focus', id, field, kind, label, tools, active: on, href };
  const key = JSON.stringify(message);
  if (focused?.key === key) return;
  focused = { id, field, key };
  if (selected.value !== id) {
   selected.value = id;
   post({ type: 'timbrr:click', id });
  }
  post(message);
 }

 function blur(id, field) {
  if (focused?.id !== id || focused?.field !== field) return;
  focused = null;
  post({ type: 'timbrr:blur' });
 }

 // A preview provides nothing, so every block draws exactly as it does on
 // the site: no frames, no typing, hidden blocks left out.
 if (!preview) {
  provide(CANVAS_KEY, {
   selected,
   dragging,
   editable,
   active,
   editor,
   activate,
   release,
   edit: (id, field, value) => post({ type: 'timbrr:edit', id, field, value }),
   focus,
   blur,
   toolsFor,
   labelFor,
  });
 }

 // Someone who can only look: nothing stays open for typing.
 watch(editable, (value) => {
  if (!value && active.value) release(active.value.id, active.value.field);
 });

 function onMessage(event) {
  if (event.source !== window.parent || !allowed(event.origin)) return;
  const message = event.data;
  if (!message || message.v !== 1) return;
  parentOrigin = event.origin;
  if (message.type === 'timbrr:doc') {
   blocks.value = Array.isArray(message.blocks) ? message.blocks : [];
   theme.value = message.theme && typeof message.theme === 'object' ? message.theme : {};
   site.value = siteFrom(message.site);
   mode.value = message.mode === 'render' ? 'render' : 'full';
   editable.value = !preview && message.editable !== false;
   connected.value = true;
   // A preview answers every page with its size, even an unchanged one:
   // the frame it's in may have shrunk to measure it.
   if (preview) nextTick(() => reportSize(true));
   return;
  }
  // A preview only ever draws the page it's sent.
  if (preview) return;
  // A block from the studio's tray, carried over the page by the studio
  // (its frame can't take the drop itself; see Drops below).
  if (message.type === 'timbrr:dragover') {
   if (editable.value && Number.isFinite(message.y)) placeDrop(message.y);
   return;
  }
  if (message.type === 'timbrr:dragleave') {
   dropIndex.value = null;
   return;
  }
  if (message.type === 'timbrr:drop') {
   if (editable.value && Number.isFinite(message.y)) {
    placeDrop(message.y);
    post({ type: 'timbrr:drop', kind: 'add', index: dropIndex.value });
   }
   dropIndex.value = null;
   return;
  }
  if (message.type === 'timbrr:select') {
   selected.value = message.id ?? null;
  } else if (message.type === 'timbrr:view' && Number.isFinite(message.scale) && message.scale > 0) {
   // The studio shows this page scaled down to fit; the outlines, tabs and
   // drop zone are drawn up by as much, so they read at their real size.
   ui.value = Math.min(5, Math.max(1, 1 / message.scale));
  } else if (message.type === 'timbrr:format' && typeof message.tool === 'string') {
   editor.value?.format(message.tool, typeof message.href === 'string' ? message.href : '');
  } else if (message.type === 'timbrr:release') {
   // The studio's keyboard went somewhere else (the inspector, the tray):
   // the open editor goes back to text.
   const open = editor.value;
   if (open) release(open.id, open.field);
  }
 }

 // Links never take the canvas anywhere. Clicking a block selects it, and
 // clicking anywhere else (the header and footer included) selects nothing.
 function onClick(event) {
  if (event.target.closest?.('a')) event.preventDefault();
  if (preview) return;
  const frame = event.target.closest?.('[data-block-id]');
  const id = frame?.dataset.blockId ?? null;
  selected.value = id;
  post({ type: 'timbrr:click', id });
 }

 // A middle click doesn't open a link elsewhere either, and forms never send.
 function onAuxClick(event) {
  if (event.target.closest?.('a')) event.preventDefault();
 }

 function onSubmit(event) {
  event.preventDefault();
 }

 // A press anywhere outside the open rich-text editor closes it, even
 // when the caret had gone out to the studio.
 function onPointerDown(event) {
  const open = editor.value;
  if (open && !open.el.contains(event.target)) release(open.id, open.field);
 }

 // So does the keyboard moving to anything else on this page (Tab).
 function onFocusIn(event) {
  const open = editor.value;
  if (open && !open.el.contains(event.target)) release(open.id, open.field);
 }

 // ── Drops: a block from the studio's tray, or one moved by its tab ──
 // A move is a drag inside this page, and comes as drag events. A block
 // from the tray starts in the studio's page, and the browser lets a drag
 // drop only into documents of the origin it started in, so this frame
 // can't take it: the studio takes it over the frame and sends where it
 // is as timbrr:dragover / timbrr:drop (in this page's pixels), answered
 // with timbrr:drop as a native drop would be. The native path stays for
 // a canvas on the studio's own origin.

 function accepts(event) {
  if (!editable.value) return false;
  const types = [...(event.dataTransfer?.types ?? [])];
  return types.includes('application/x-timbrr-block') || types.includes('application/x-timbrr-move');
 }

 function frames() {
  return [...document.querySelectorAll('[data-block-id]')];
 }

 // The line goes on the edge between two blocks, or under the last one.
 // Over the header it's the top of the page, over the footer the end. `y`
 // is in this page's pixels; the page never scrolls, so that's clientY.
 function placeDrop(y) {
  const list = frames();
  let index = list.findIndex((el) => {
   const rect = el.getBoundingClientRect();
   return y < rect.top + rect.height / 2;
  });
  if (index < 0) index = list.length;
  dropIndex.value = index;
  const page = document.querySelector('.tb-canvas__page')?.getBoundingClientRect();
  if (!page) return;
  const edge = list[index]?.getBoundingClientRect().top ?? list.at(-1)?.getBoundingClientRect().bottom ?? page.top;
  dropTop.value = edge - page.top;
 }

 function onDragOver(event) {
  if (!accepts(event)) return;
  event.preventDefault();
  placeDrop(event.clientY);
 }

 function onDragLeave(event) {
  if (!event.relatedTarget) dropIndex.value = null;
 }

 function onDrop(event) {
  if (!accepts(event) || dropIndex.value === null) return;
  event.preventDefault();
  const id = event.dataTransfer.getData('application/x-timbrr-move');
  post(
   id
    ? { type: 'timbrr:drop', kind: 'move', id, index: dropIndex.value }
    : { type: 'timbrr:drop', kind: 'add', blockType: event.dataTransfer.getData('application/x-timbrr-block'), index: dropIndex.value },
  );
  dropIndex.value = null;
  dragging.value = null;
 }

 // A drag that ends anywhere else (Escape, outside the page) leaves no line.
 function onDragEnd() {
  dropIndex.value = null;
  dragging.value = null;
 }

 // ── Size ──
 // The studio sizes the frame to the page, so the page never scrolls
 // itself. It's the page that's measured, not the window, so the frame
 // shrinks again when the page does.

 let observer;
 let lastHeight = -1;
 function reportSize(again = false) {
  const el = root.value;
  if (!el || !parentOrigin) return;
  const height = Math.ceil(Math.max(el.scrollHeight, el.getBoundingClientRect().height));
  if (height === lastHeight && !again) return;
  lastHeight = height;
  post({ type: 'timbrr:size', height });
 }

 watch(connected, () => nextTick(() => reportSize()));

 // Say hello to whichever studio framed us; its reply's origin becomes the
 // only one we talk to. The hello carries nothing. It repeats until the
 // studio answers, since on a first load the frame can be up before the
 // studio is listening.
 let helloTimer;
 let hellos = 0;
 function hello() {
  if (connected.value || window.parent === window || hellos++ > 60) return;
  window.parent.postMessage({ v: 1, type: 'timbrr:ready', manifestVersion: 1 }, studio || '*');
  helloTimer = setTimeout(hello, 250);
 }

 // ── Block code ──
 // Each block's component loads the first time it's drawn (they're global
 // components, loaded on demand). Loaded ahead in the idle time after the
 // page is up, so a block hovered in the tray or added from it draws at
 // once. A site's own blocks live in its layer, out of reach from here,
 // and load on their first draw.
 const blockCode = import.meta.glob('../../components/blocks/*.global.vue');
 function warmBlocks() {
  for (const load of Object.values(blockCode)) load().catch(() => {});
 }

 onMounted(() => {
  window.addEventListener('message', onMessage);
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onAuxClick, true);
  document.addEventListener('submit', onSubmit, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('dragend', onDragEnd);
  observer = new ResizeObserver(() => reportSize());
  observer.observe(root.value);
  hello();
  if ('requestIdleCallback' in window) requestIdleCallback(warmBlocks, { timeout: 2000 });
  else setTimeout(warmBlocks, 1000);
 });

 onBeforeUnmount(() => {
  clearTimeout(helloTimer);
  window.removeEventListener('message', onMessage);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('auxclick', onAuxClick, true);
  document.removeEventListener('submit', onSubmit, true);
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('focusin', onFocusIn, true);
  document.removeEventListener('dragend', onDragEnd);
  observer?.disconnect();
 });

 const themeStyle = computed(() => ({
  ...(theme.value.accent ? { '--site-accent': theme.value.accent, '--site-accent-ink': inkOn(theme.value.accent) } : {}),
  '--tb-ui': ui.value,
 }));
</script>

<template>
 <div ref="root" class="tb-canvas" :class="{ 'is-preview': preview }" :style="themeStyle" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
  <template v-if="connected">
   <template v-if="framed">
    <TbSiteHeader v-if="preview" :site="site" />
    <div v-else class="tb-canvas__chrome">
     <TbSiteHeader :site="site" inert />
     <span class="tb-canvas__note" aria-hidden="true">
      <span class="tb-canvas__pill"><span class="tb-canvas__pill-mark">⟲</span>Header and footer come from your pages</span>
     </span>
    </div>
   </template>

   <main class="tb-canvas__page">
    <TbBlocks :blocks="blocks" />
    <template v-if="!preview">
     <div v-if="editable" class="tb-canvas__end" :class="{ 'is-empty': !blocks.length, 'is-over': dropIndex !== null }">
      <span class="tb-canvas__end-label">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
       </svg>
       Drop a block here
      </span>
      <span v-if="!blocks.length" class="tb-canvas__end-hint">or click one in the tray to add it</span>
     </div>
     <p v-else-if="!blocks.length" class="tb-canvas__nothing">Nothing on this page yet.</p>
     <span v-if="dropIndex !== null && blocks.length" class="tb-canvas__drop" :style="{ top: `${dropTop}px` }" aria-hidden="true" />
    </template>
   </main>

   <template v-if="framed">
    <TbSiteFooter v-if="preview" :site="site" />
    <div v-else class="tb-canvas__chrome tb-canvas__chrome--footer">
     <TbSiteFooter :site="site" inert />
     <span class="tb-canvas__note" aria-hidden="true">
      <span class="tb-canvas__pill"><span class="tb-canvas__pill-mark">⟲</span>Header and footer come from your pages</span>
     </span>
    </div>
   </template>
  </template>
  <p v-else-if="!preview" class="tb-canvas__waiting">Waiting for the studio…</p>
 </div>
</template>
