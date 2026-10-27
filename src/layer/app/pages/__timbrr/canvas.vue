<script setup>
 // The studio's canvas (docs/manifest.md § Canvas). The builder frames this
 // page and sends it the draft page over postMessage; it draws the blocks
 // with this site's own components and styles — exactly what the live site
 // will show — and reports clicks, edits, drops and its height back. It
 // never fetches content and never holds a token. Every message is checked
 // against one origin: the configured studio, or localhost in development.
 definePageMeta({ layout: false });

 useHead({
  title: 'Canvas',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  htmlAttrs: { 'data-timbrr-canvas': '' },
 });

 const config = useRuntimeConfig();
 const studio = String(config.public.studioOrigin ?? '').replace(/\/$/, '');

 const blocks = ref([]);
 const theme = ref({});
 const connected = ref(false);
 const selected = ref(null);
 const dragging = ref(null); // a block being moved inside the canvas
 const dropIndex = ref(null);
 const dropTop = ref(0);
 let parentOrigin = null;

 function allowed(origin) {
  if (studio) return origin === studio;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
 }

 function post(message) {
  if (parentOrigin && window.parent !== window) window.parent.postMessage({ v: 1, ...message }, parentOrigin);
 }

 provide(CANVAS_KEY, {
  selected,
  dragging,
  edit: (id, field, value) => post({ type: 'timbrr:edit', id, field, value }),
 });

 function onMessage(event) {
  if (event.source !== window.parent || !allowed(event.origin)) return;
  const message = event.data;
  if (!message || message.v !== 1) return;
  parentOrigin = event.origin;
  if (message.type === 'timbrr:doc') {
   blocks.value = Array.isArray(message.blocks) ? message.blocks : [];
   theme.value = message.theme ?? {};
   connected.value = true;
  } else if (message.type === 'timbrr:select') {
   selected.value = message.id ?? null;
  }
 }

 // Clicking a block selects it. Links never navigate the canvas away.
 function onClick(event) {
  if (event.target.closest('a')) event.preventDefault();
  const frame = event.target.closest('[data-block-id]');
  const id = frame?.dataset.blockId ?? null;
  selected.value = id;
  post({ type: 'timbrr:click', id });
 }

 // ── Drops: a block from the studio's tray, or one moved by its tab ──

 function accepts(event) {
  const types = [...(event.dataTransfer?.types ?? [])];
  return types.includes('application/x-timbrr-block') || types.includes('application/x-timbrr-move');
 }

 function frames() {
  return [...document.querySelectorAll('[data-block-id]')];
 }

 function onDragOver(event) {
  if (!accepts(event)) return;
  event.preventDefault();
  const list = frames();
  let index = list.findIndex((el) => {
   const rect = el.getBoundingClientRect();
   return event.clientY < rect.top + rect.height / 2;
  });
  if (index < 0) index = list.length;
  dropIndex.value = index;
  const root = document.querySelector('.tb-canvas__page').getBoundingClientRect();
  const edge = list[index]?.getBoundingClientRect().top ?? list.at(-1)?.getBoundingClientRect().bottom ?? root.top;
  dropTop.value = edge - root.top;
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

 // The studio sizes the frame to the page, so the page never scrolls itself.
 let observer;
 let lastHeight = 0;
 function reportSize() {
  const height = document.documentElement.scrollHeight;
  if (height === lastHeight) return;
  lastHeight = height;
  post({ type: 'timbrr:size', height });
 }

 watch(connected, () => nextTick(reportSize));

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

 onMounted(() => {
  window.addEventListener('message', onMessage);
  document.addEventListener('click', onClick, true);
  observer = new ResizeObserver(reportSize);
  observer.observe(document.body);
  hello();
 });

 onBeforeUnmount(() => {
  clearTimeout(helloTimer);
  window.removeEventListener('message', onMessage);
  document.removeEventListener('click', onClick, true);
  observer?.disconnect();
 });

 const themeStyle = computed(() =>
  theme.value.accent ? { '--site-accent': theme.value.accent, '--site-accent-ink': inkOn(theme.value.accent) } : {},
 );
</script>

<template>
 <div class="tb-canvas" :style="themeStyle" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
  <main v-if="connected" class="tb-canvas__page">
   <TbBlocks :blocks="blocks" />
   <div class="tb-canvas__end" :class="{ 'is-empty': !blocks.length }">
    {{ blocks.length ? 'Drag a block here, or click one in the tray to add it at the end.' : 'This page is empty. Drag a block here, or click one in the tray.' }}
   </div>
   <span v-if="dropIndex !== null" class="tb-canvas__drop" :style="{ top: `${dropTop}px` }" aria-hidden="true" />
  </main>
  <p v-else class="tb-canvas__waiting">Waiting for the studio…</p>
 </div>
</template>
