<script setup>
 // The studio's canvas (docs/manifest.md § Canvas). The builder frames this
 // page and sends it the draft page over postMessage; it draws the blocks
 // with this site's own components and styles — exactly what the live site
 // will show — and reports clicks, edits, drops and its height back. Text is
 // typed in place, one field at a time; where the caret is (and which tools
 // that field allows) goes to the studio's format bar, and its tools come
 // back here. In Render view the site's own header and footer frame the
 // page, locked: they come from the site's pages, or from the Library when
 // the page has a frame of its own, not from blocks. A click on one says
 // which, and the studio takes it from there. A block of a global block or
 // template is locked too, and one double-click from the Library.
 // A header or footer open in the Library gets the stage instead of all of
 // that (TbFrameStage): a preview with a page to scroll, nothing to edit.
 //
 // With ?preview=1 it's the page exactly as the site draws it: no outlines,
 // tabs, typing or drop zones, and hidden blocks stay hidden (the tray's
 // previews and the builder's Preview use it). With &window=1 as well (the
 // builder's Preview) its frame is a fixed window and the page scrolls in
 // it, as on a visitor's screen. Either way it never fetches
 // a collection's entries (they come from the studio too, with the page),
 // never holds a token, and its links go nowhere. Every message is
 // checked against one origin: the configured studio, or localhost in
 // development.
 import { WYS_TOOLS } from '#timbrr/define';
 import { footerData, headerData, navItem, navList } from '../../../schema/frames.js';

 definePageMeta({ layout: false });

 const preview = useRoute().query.preview === '1';
 const windowed = preview && useRoute().query.window === '1';

 useHead({
  title: preview ? 'Preview' : 'Canvas',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  htmlAttrs: { 'data-timbrr-canvas': '', 'data-timbrr-window': windowed ? '' : undefined },
 });

 const config = useRuntimeConfig();
 const studio = String(config.public.studioOrigin ?? '').replace(/\/$/, '');

 const root = ref(null);
 const blocks = ref([]);
 const theme = ref({});
 const site = shallowRef(null); // the site's name, address, menu, details and frames, for its header and footer
 useHead({ htmlAttrs: { lang: () => site.value?.language ?? 'en' } });
 const forms = useTimbrrForms(); // the forms this page can show, as the site draws them
 // The entries its collection blocks draw, sent by the studio (composables/collections.js).
 // Set from the start, so a Collection list here never asks the site itself.
 const collections = useTimbrrCollections();
 collections.value = { lists: {}, raw: {} };
 const mode = ref('full'); // 'render': the page between the site's header and footer
 const stage = ref(false); // the studio asked for the stage, for a Library header or footer
 const sheet = ref(''); // 'system': the design system instead of a page (the Branding editor's preview)
 const connected = ref(false);
 const editable = ref(!preview); // false: a preview, or someone who can only look
 const library = ref(true); // false: this person can't open the Library
 const endZone = ref(true); // false: the document takes no more blocks, so nothing asks for one
 const ui = ref(1); // how much larger to draw the chrome, as the studio scales the frame down
 const selected = ref(null);
 const dragging = ref(null); // a block being moved inside the canvas
 const hovered = ref(null); // the locked placement under the pointer
 const dropIndex = ref(null);
 const dropSlots = ref([]); // every edge a drag could land on: [{ index, top }]
 const active = shallowRef(null); // { id, field, kind } being typed into
 const editor = shallowRef(null); // the open rich-text editor, if any
 const crop = ref(null); // the picture being cropped by hand: { id, field, x, y, zoom }
 let parentOrigin = null;
 let focused = null; // { id, field, key } the studio last heard has the caret

 // The block on the stage, if there is one. It's only ever a frame.
 const staged = computed(() => (stage.value && ['site_header', 'site_footer'].includes(blocks.value[0]?.type) ? blocks.value[0] : null));

 // A site with no name or address to show isn't framed at all, and the
 // stage draws its own.
 const framed = computed(() => !sheet.value && !staged.value && mode.value === 'render' && Boolean(site.value?.name || site.value?.domain));

 function allowed(origin) {
  if (studio) return origin === studio;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
 }

 function post(message) {
  if (parentOrigin && window.parent !== window) window.parent.postMessage({ v: 1, ...message }, parentOrigin);
 }

 // ── The site's header and footer ──
 // Only strings and plain menu items (NavItem: label, kind, to, layout,
 // desc, group; children one level down) get as far as the components, and
 // of Site details, its strings and the rows of its hours. A frame from the
 // Library stays beside the site's own menu, never merged into it, and comes
 // down to what its schema holds, in the shape the site draws: `false` (the
 // page has none), or its data, or null (draw the site's menu).

 const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

 function siteFrom(value, firstBlock, brand) {
  if (!value || typeof value !== 'object') return null;
  return {
   brand: normalizeBrand(brand),
   name: text(value.name, 120),
   domain: text(value.domain, 253),
   nav: navList(value.nav, 1),
   cta: buttonFrom(value.cta),
   details: detailsFrom(value.details),
   language: /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value.language ?? '') ? value.language : 'en',
   overHero: isHeroBleed(firstBlock),
   // The connected Shopify store ({ domain, token, apiVersion, shopUrl },
   // a public token), or null: the shop blocks read it straight from here.
   shop: shopConfig(value.shop),
   frame: {
    header: frameFrom(value.frame?.header, headerData),
    footer: frameFrom(value.frame?.footer, footerData),
   },
  };
 }

 function buttonFrom(value) {
  return value && typeof value === 'object' ? navItem(value, 0) : null;
 }

 function detailsFrom(value) {
  if (!value || typeof value !== 'object') return null;
  const strings = ['phone', 'email', 'street', 'city', 'region', 'postal', 'timezone', 'note'].map((key) => [key, text(value[key], 300)]);
  const hours = (Array.isArray(value.hours) ? value.hours : []).slice(0, 7).map((row) => ({ closed: row?.closed === true, open: text(row?.open, 5), close: text(row?.close, 5) }));
  return { ...Object.fromEntries(strings), hours };
 }

 function frameFrom(value, keep) {
  if (value === false) return false;
  return value && typeof value === 'object' ? keep(value) : null;
 }

 // What the note over the locked header or footer says.
 const chromeNote = (name, side) => `${name} comes from ${site.value?.frame[side] ? 'the Library' : 'your pages'}${library.value ? ' · click to open' : ''}`;

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
  // Where the field is in this document, so the studio can fly its
  // format bar out above it.
  const box = document.activeElement?.isContentEditable ? document.activeElement.getBoundingClientRect() : null;
  const rect = box ? { top: Math.round(box.top + window.scrollY), left: Math.round(box.left + window.scrollX), width: Math.round(box.width) } : null;
  const message = { type: 'timbrr:focus', id, field, kind, label, tools, active: on, href, rect };
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
   hovered,
   editable,
   library,
   active,
   editor,
   crop,
   activate,
   release,
   edit: (id, field, value) => post({ type: 'timbrr:edit', id, field, value }),
   focus,
   blur,
   open: (id) => post({ type: 'timbrr:open', id }),
   toolsFor,
   labelFor,
  });
 }

 // In every mode: the site_header and site_footer blocks read their name
 // from it, and a preview draws them too.
 provide(TIMBRR_SITE_KEY, site);

 // Someone who can only look: nothing stays open for typing.
 watch(editable, (value) => {
  if (!value && active.value) release(active.value.id, active.value.field);
  if (!value) crop.value = null;
 });

 // ── Cropping a picture by hand ──
 // A double-click on a picture its box crops (TbImage, data-image-crop) opens
 // it: drag moves the photo in its box, the wheel, a pinch or the slider
 // zooms, the arrow keys nudge it. Enter or a press anywhere else keeps it,
 // Escape puts it back, Reset asks the studio for the library's own. What's
 // kept goes to the studio as timbrr:crop (the placement's focal point and
 // zoom); the studio owns the page and sends it back. A locked block's
 // pictures are the Library's, and a double-click there opens that instead.

 const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
 const cropEl = () => (crop.value ? document.querySelector(`[data-block-id="${CSS.escape(crop.value.id)}"] [data-image-field="${CSS.escape(crop.value.field)}"]`) : null);
 const cropBar = ref({});
 let cropDrag = null;

 function cropImage(id, field) {
  const image = valueAt(blocks.value.find((block) => block.id === id)?.data, field);
  return image && typeof image === 'object' && image.src ? image : null;
 }

 function onDblClick(event) {
  if (preview || !editable.value || staged.value || crop.value) return;
  // A field of a form: the studio opens that form's Build with it selected. The
  // form is inert here, so the click lands on the block and the field is found
  // by where it was.
  const block = event.target.closest?.('[data-block-id]');
  const formField = block && [...block.querySelectorAll('[data-form-field]')].find((el) => {
   const box = el.getBoundingClientRect();
   return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  });
  if (formField && !block.dataset.blockId.includes('.')) {
   window.getSelection()?.removeAllRanges();
   post({ type: 'timbrr:formfield', id: block.dataset.blockId, field: formField.dataset.formField });
   return;
  }
  const el = event.target.closest?.('[data-image-crop]');
  const id = el?.closest('[data-block-id]')?.dataset.blockId;
  const field = el?.dataset.imageField;
  if (!id || !field || id.includes('.')) return;
  const image = cropImage(id, field);
  if (!image) return;
  const num = (value) => (Number.isFinite(Number(value)) ? clamp(Number(value), 0, 1) : 0.5);
  const rect = el.getBoundingClientRect();
  const page = document.querySelector('.tb-canvas__page').getBoundingClientRect();
  cropBar.value = { top: `${rect.bottom - page.top}px`, left: `${rect.left - page.left + rect.width / 2}px` };
  crop.value = { id, field, x: num(image.focal?.x), y: num(image.focal?.y), zoom: clamp(Number(image.zoom) || 1, 1, 4) };
  window.getSelection()?.removeAllRanges();
 }

 // The photo moves with the pointer: by how far there is to move at this
 // zoom (the drawn photo less the part of it the box shows).
 function cropMove(dx, dy) {
  const el = cropEl();
  const img = el?.querySelector('img');
  if (!img?.naturalWidth || !el.clientWidth || !el.clientHeight) return;
  const { x, y, zoom } = crop.value;
  const fit = Math.max(el.clientWidth / img.naturalWidth, el.clientHeight / img.naturalHeight);
  const slackX = img.naturalWidth * fit - el.clientWidth / zoom;
  const slackY = img.naturalHeight * fit - el.clientHeight / zoom;
  crop.value = {
   ...crop.value,
   x: slackX > 0.5 ? clamp(x - dx / zoom / slackX, 0, 1) : x,
   y: slackY > 0.5 ? clamp(y - dy / zoom / slackY, 0, 1) : y,
  };
 }

 function cropZoom(zoom) {
  if (crop.value && Number.isFinite(zoom)) crop.value = { ...crop.value, zoom: clamp(zoom, 1, 4) };
 }

 function cropKeep() {
  if (!crop.value) return;
  const { id, field, x, y, zoom } = crop.value;
  const round = (n, by) => Math.round(n * by) / by;
  const focal = { x: round(x, 1000), y: round(y, 1000) };
  // Drawn here at once; the studio's copy follows.
  const image = cropImage(id, field);
  if (image) Object.assign(image, { focal, zoom: round(zoom, 100) });
  crop.value = null;
  post({ type: 'timbrr:crop', id, field, focal, zoom: round(zoom, 100) });
 }

 function cropReset() {
  if (!crop.value) return;
  const { id, field } = crop.value;
  crop.value = null;
  post({ type: 'timbrr:crop', id, field, reset: true });
 }

 // True when the key was the crop's.
 function cropKey(event) {
  if (!crop.value) return false;
  if (event.key === 'Escape') crop.value = null;
  else if (event.key === 'Enter' && !event.target.closest?.('button')) cropKeep();
  else if (event.target.closest?.('.tb-canvas__crop')) return true; // the slider's and the buttons' own keys
  else if (event.key.startsWith('Arrow')) {
   const step = event.shiftKey ? 0.1 : 0.01;
   const { x, y } = crop.value;
   crop.value = {
    ...crop.value,
    x: clamp(x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 1),
    y: clamp(y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), 0, 1),
   };
  } else if (event.key === '+' || event.key === '=') cropZoom(crop.value.zoom + 0.1);
  else if (event.key === '-') cropZoom(crop.value.zoom - 0.1);
  else return true;
  event.preventDefault();
  return true;
 }

 function onPointerMove(event) {
  if (!cropDrag || !crop.value) return;
  cropMove(event.clientX - cropDrag.x, event.clientY - cropDrag.y);
  cropDrag = { x: event.clientX, y: event.clientY };
 }

 function onPointerUp() {
  cropDrag = null;
 }

 function onWheel(event) {
  if (!crop.value || !cropEl()?.contains(event.target)) return;
  event.preventDefault();
  cropZoom(crop.value.zoom * Math.exp(-event.deltaY * 0.0025));
 }

 // The studio records its sessions with rrweb and can't see into this frame,
 // so when it asks, rrweb here passes what happens on the canvas up to the
 // studio's. Asked again, it sends the whole page afresh: the studio has
 // taken a new snapshot of its own. rrweb loads only when asked, so a
 // site's visitors never download it. It posts to any parent, which gives
 // nothing away: this page only ever holds what its parent sent it.
 let rrweb = null;
 async function joinRecording() {
  if (rrweb) return void (await rrweb).record.takeFullSnapshot();
  rrweb = import('rrweb');
  (await rrweb).record({ recordCrossOriginIframes: true, sampling: { mousemove: 100, scroll: 150 } });
 }

 function onMessage(event) {
  if (event.source !== window.parent || !allowed(event.origin)) return;
  const message = event.data;
  if (!message || message.v !== 1) return;
  parentOrigin = event.origin;
  if (message.type === 'timbrr:record') {
   joinRecording();
   return;
  }
  if (message.type === 'timbrr:doc') {
   blocks.value = Array.isArray(message.blocks) ? message.blocks : [];
   theme.value = message.theme && typeof message.theme === 'object' ? message.theme : {};
   site.value = siteFrom(message.site, blocks.value[0], theme.value.brand);
   forms.value = message.forms && typeof message.forms === 'object' ? message.forms : {};
   const sent = message.collections && typeof message.collections === 'object' ? message.collections : {};
   collections.value = { lists: sent.lists && typeof sent.lists === 'object' ? sent.lists : {}, raw: sent.raw && typeof sent.raw === 'object' ? sent.raw : {} };
   mode.value = message.mode === 'render' ? 'render' : 'full';
   stage.value = message.stage === true;
   sheet.value = message.sheet === 'system' ? 'system' : '';
   editable.value = !preview && message.editable !== false;
   library.value = message.library !== false;
   endZone.value = message.endZone !== false;
   connected.value = true;
   // Measured every time, since what's absolute (a header's panels) moves the
   // page's height without moving its box. A preview answers every page with
   // its size, even an unchanged one: the frame it's in may have shrunk to
   // measure it.
   nextTick(() => reportSize(preview));
   return;
  }
  // A preview only ever draws the page it's sent.
  if (preview) return;
  // A block from the studio's tray, carried over the page by the studio
  // (its frame can't take the drop itself; see Drops below).
  if (message.type === 'timbrr:dragover') {
   if (takesDrops.value && Number.isFinite(message.y)) placeDrop(message.y);
   return;
  }
  if (message.type === 'timbrr:dragleave') {
   clearDrop();
   return;
  }
  if (message.type === 'timbrr:drop') {
   if (takesDrops.value && Number.isFinite(message.y)) {
    placeDrop(message.y);
    if (dropIndex.value !== null) post({ type: 'timbrr:drop', kind: 'add', index: dropIndex.value });
   }
   clearDrop();
   return;
  }
  if (message.type === 'timbrr:select') {
   selected.value = message.id ?? null;
   // Picked with the keyboard or the outline: it comes into view, in the
   // studio's own scroller too (the frame is as tall as the page).
   if (selected.value) nextTick(() => document.querySelector(`[data-block-id="${CSS.escape(String(selected.value))}"]`)?.scrollIntoView({ block: 'nearest' }));
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

 // The header section a click on the stage belongs to, by what it hit; the
 // bar's own background is its look. The phone menu's toggle is none.
 const HEADER_PARTS = [
  ['.tb-site-header__notice, .tb-site-header__utility', 'announce'],
  ['.tb-site-header__name', 'logo'],
  ['.tb-site-header__nav', 'menu'],
  ['.tb-site-header__cta, .tb-site-header__icons', 'buttons'],
  ['.tb-site-header__menu', ''],
  ['.tb-site-header', 'look'],
 ];
 function headerPart(target) {
  const found = HEADER_PARTS.find(([selector]) => target.closest?.(selector));
  return found?.[1] ?? '';
 }
 // What exactly was clicked, for the studio's small box beside it: a menu
 // item (`item`, its place in the menu), a button (`button`, primary or
 // secondary), the logo or the announcement, and where it is in this frame.
 function headerTarget(target) {
  const el = target.closest?.('[data-tb-item], [data-tb-button], .tb-site-header__name, .tb-site-header__notice');
  if (!el) return {};
  const box = el.getBoundingClientRect();
  const rect = { x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) };
  if (el.dataset.tbItem !== undefined) return { item: Number(el.dataset.tbItem), rect };
  if (el.dataset.tbButton) return { button: el.dataset.tbButton, rect };
  return { rect };
 }

 // Links never take the canvas anywhere. Clicking a block selects it, and
 // clicking anywhere else selects nothing. A click on the header or footer
 // also says which it was, and one on an image which field it is, for the
 // studio to open. The stage has nothing to select, and the studio's panel
 // stays open: a click there says which part of the header it landed on, so
 // the panel can open that part's section.
 function onClick(event) {
  if (event.target.closest?.('a')) event.preventDefault();
  if (preview) return;
  if (staged.value) {
   const part = headerPart(event.target);
   if (part) post({ type: 'timbrr:part', id: staged.value.id, part, ...headerTarget(event.target) });
   return;
  }
  const frame = event.target.closest?.('[data-block-id]');
  const id = frame?.dataset.blockId ?? null;
  selected.value = id;
  const side = event.target.closest?.('[data-chrome]')?.dataset.chrome;
  const field = frame && event.target.closest?.('[data-image-field]')?.dataset.imageField;
  post({ type: 'timbrr:click', id, ...(side ? { side } : {}), ...(field ? { field } : {}) });
 }

 // Keys pressed in here never reach the studio, so F (flag something) and the
 // keys for the selected block go over, unless they're being typed into
 // something. The studio says what each does (blockAction, docs/manifest.md).
 const BLOCK_KEYS = ['Delete', 'Backspace', 'n', 'd', 'h', 'ArrowUp', 'ArrowDown'];
 const BLOCK_ALT_KEYS = ['ArrowUp', 'ArrowDown'];

 const typingHere = (event) => Boolean(active.value || event.target.closest?.('input, textarea, select, [contenteditable]'));

 function flagKey(event) {
  if (event.key?.toLowerCase() !== 'f' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  return !typingHere(event);
 }

 function blockKey(event) {
  if (preview || !editable.value || staged.value || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  const key = event.key?.length === 1 ? event.key.toLowerCase() : event.key;
  // A bare arrow moves the selection; with nothing selected it's the page's.
  if (!event.altKey && key.startsWith('Arrow') && !selected.value) return null;
  return (event.altKey ? BLOCK_ALT_KEYS : BLOCK_KEYS).includes(key) && !typingHere(event) ? key : null;
 }

 // A key pressed while a locked block is selected goes nowhere, so the
 // studio says why. One that's going into an open field isn't that.
 function onKeyDown(event) {
  if (cropKey(event)) return;
  if (event.repeat) return;
  if (flagKey(event)) {
   post({ type: 'timbrr:flag' });
   return;
  }
  // Undo and redo are the studio's (its History), unless a field here has
  // the caret: then they're that text's own.
  const letter = event.key?.toLowerCase();
  if (!preview && (event.metaKey || event.ctrlKey) && !event.altKey && (letter === 'z' || letter === 'y') && !typingHere(event)) {
   event.preventDefault();
   post({ type: 'timbrr:key', key: letter, mod: true, shift: event.shiftKey, ctrl: event.ctrlKey });
   return;
  }
  const key = blockKey(event);
  if (key) {
   event.preventDefault();
   post({ type: 'timbrr:key', key, alt: event.altKey });
   return;
  }
  if (!editable.value || staged.value || active.value) return;
  if (event.key?.length !== 1 || event.ctrlKey || event.metaKey) return;
  const id = placementOf(selected.value);
  if (blocks.value.some((block) => block.lock?.id === id)) post({ type: 'timbrr:locked', id });
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
  if (crop.value) {
   if (cropEl()?.contains(event.target)) {
    event.preventDefault();
    cropDrag = { x: event.clientX, y: event.clientY };
   } else if (!event.target.closest?.('.tb-canvas__crop')) cropKeep();
  }
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

 const takesDrops = computed(() => editable.value && !staged.value);

 function accepts(event) {
  if (!takesDrops.value) return false;
  const types = [...(event.dataTransfer?.types ?? [])];
  return types.includes('application/x-timbrr-block') || types.includes('application/x-timbrr-move');
 }

 function frames() {
  return [...document.querySelectorAll('[data-block-id]')];
 }

 // The target goes on the edge between two blocks, or under the last one,
 // never inside a locked chunk: the top half of a block is the edge above
 // it, the bottom half the one below. Over the header it's the top of the
 // page, over the footer the end. While a drag is on, every edge it could
 // land on shows a slot (`dropSlots`), and the one it would land on now
 // is lit; an edge beside the block being moved shows none and takes no
 // drop, since nothing would change. `y` is in this page's pixels; the
 // page never scrolls, so that's clientY.
 function placeDrop(y) {
  const list = frames();
  const page = document.querySelector('.tb-canvas__page')?.getBoundingClientRect();
  if (!page) return;
  const rects = list.map((el) => el.getBoundingClientRect());
  const moved = list.map((el) => el.classList.contains('is-dragging'));
  const { index, slots } = dropTargets(
   rects.map((rect, at) => ({ top: rect.top, bottom: rect.bottom, lock: list[at].dataset.lockId ?? '', moved: moved[at] })),
   y,
  );
  dropIndex.value = index;
  // `room` is the space above the line in this document, which never scrolls: the first edge often has none.
  dropSlots.value = slots.map((slot) => ({ index: slot.index, top: slot.y - page.top, room: Math.max(0, slot.y) }));
 }

 function clearDrop() {
  dropIndex.value = null;
  dropSlots.value = [];
 }

 // A block moved by its tab is dragged inside this page, which the studio
 // can't see: it's told where the pointer is, so it can scroll its room
 // when that's near the top or bottom (the page itself never scrolls).
 let saidAt = null;
 function dragAt(y) {
  if (y === saidAt) return;
  saidAt = y;
  post({ type: 'timbrr:dragat', y });
 }

 function onDragOver(event) {
  if (!accepts(event)) return;
  event.preventDefault();
  placeDrop(event.clientY);
  dragAt(Math.round(event.clientY));
 }

 function onDragLeave(event) {
  if (event.relatedTarget) return;
  clearDrop();
  dragAt(null);
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
  clearDrop();
  saidAt = null; // the drop itself stops the studio's scrolling
  dragging.value = null;
 }

 // A drag that ends anywhere else (Escape, outside the page) leaves no line.
 function onDragEnd() {
  clearDrop();
  dragAt(null);
  dragging.value = null;
 }

 // ── Size ──
 // The studio sizes the frame to the page, so the page never scrolls
 // itself. It's the page that's measured, not the window, so the frame
 // shrinks again when the page does. The stage is the exception: its frame
 // has a fixed height and the page scrolls inside it, so it reports nothing.
 // A window preview (&window=1) scrolls too, but still reports: the studio
 // shows the page once it's drawn.

 let observer;
 let lastHeight = -1;
 function reportSize(again = false) {
  const el = root.value;
  if (!el || !parentOrigin || staged.value) return;
  const height = Math.ceil(Math.max(el.scrollHeight, el.getBoundingClientRect().height));
  if (height === lastHeight && !again) return;
  lastHeight = height;
  // `window`: this frame scrolls itself, so the studio keeps its size (an
  // older canvas leaves it out, and the studio sizes the frame to the page).
  post({ type: 'timbrr:size', height, ...(windowed ? { window: true } : {}) });
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
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('dblclick', onDblClick, true);
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('keydown', onKeyDown);
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
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  document.removeEventListener('pointercancel', onPointerUp);
  document.removeEventListener('dblclick', onDblClick, true);
  document.removeEventListener('wheel', onWheel);
  document.removeEventListener('focusin', onFocusIn, true);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('dragend', onDragEnd);
  observer?.disconnect();
 });

 // The studio's theme: the brand color and the brand (utils/brand.js),
 // applied the way a live page applies them (composables/page.js).
 const brandOnly = computed(() => brandStyle(theme.value.accent, theme.value.brand));
 useBrandHead(brandOnly, () => theme.value.brand);
 const themeStyle = computed(() => ({ ...brandOnly.value, '--tb-ui': ui.value }));
</script>

<template>
 <div ref="root" class="tb-canvas" :class="{ 'is-preview': preview }" :style="themeStyle" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
  <template v-if="connected">
   <template v-if="framed">
    <TbSiteHeader v-if="preview" :site="site" />
    <div v-else-if="site.frame.header !== false" class="tb-canvas__chrome" data-chrome="header">
     <TbSiteHeader :site="site" inert />
     <span class="tb-canvas__note">
      <button type="button" class="tb-canvas__pill"><span class="tb-canvas__pill-mark" aria-hidden="true">⟲</span>{{ chromeNote('Header', 'header') }}</button>
     </span>
    </div>
   </template>

   <TbDesignSystem v-if="sheet === 'system'" :brand="theme.brand" :accent="theme.accent" />
   <TbFrameStage v-else-if="staged" :site="site" :block="staged" />
   <main v-else class="tb-canvas__page">
    <TbBlocks :blocks="blocks" />
    <template v-if="!preview">
     <div v-if="editable && endZone" class="tb-canvas__end" :class="{ 'is-empty': !blocks.length, 'is-over': dropIndex !== null }">
      <span class="tb-canvas__end-label">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
       </svg>
       Drop a block here
      </span>
      <span v-if="!blocks.length" class="tb-canvas__end-hint">or click one in the tray to add it</span>
     </div>
     <p v-else-if="!blocks.length" class="tb-canvas__nothing">Nothing on this page yet.</p>
     <template v-if="blocks.length">
      <span v-for="slot in dropSlots" :key="slot.index" class="tb-canvas__slot" :class="{ 'is-over': slot.index === dropIndex }" :style="{ top: `${slot.top}px`, '--tb-room': `${slot.room}px` }" aria-hidden="true">
       <span class="tb-canvas__slot-mark">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
        <span class="tb-canvas__slot-text">Drop here</span>
       </span>
      </span>
     </template>
     <div v-if="crop" class="tb-canvas__crop" :style="cropBar" role="toolbar" aria-label="Crop this picture">
      <span class="tb-canvas__crop-hint">Drag the picture to move it</span>
      <label class="tb-canvas__crop-zoom">
       <span>Zoom</span>
       <input type="range" min="1" max="4" step="0.01" :value="crop.zoom" @input="cropZoom(Number($event.target.value))" />
      </label>
      <button type="button" @click="cropReset">Reset</button>
      <button type="button" @click="crop = null">Cancel</button>
      <button type="button" class="is-primary" @click="cropKeep">Done</button>
     </div>
    </template>
   </main>

   <template v-if="framed">
    <TbSiteFooter v-if="preview" :site="site" />
    <div v-else-if="site.frame.footer !== false" class="tb-canvas__chrome tb-canvas__chrome--footer" data-chrome="footer">
     <TbSiteFooter :site="site" inert />
     <span class="tb-canvas__note">
      <button type="button" class="tb-canvas__pill"><span class="tb-canvas__pill-mark" aria-hidden="true">⟲</span>{{ chromeNote('Footer', 'footer') }}</button>
     </span>
    </div>
   </template>
  </template>
  <p v-else-if="!preview" class="tb-canvas__waiting">Waiting for the studio…</p>
 </div>
</template>
