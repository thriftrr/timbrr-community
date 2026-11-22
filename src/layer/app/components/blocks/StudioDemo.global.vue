<script setup>
 // A working copy of the Timbrr studio (blocks/studio_demo.js): the side
 // rail and one room at a time, on a made-up site. Rooms keep their own
 // state; the site's look is shared, so a new brand color in Branding shows
 // in the page editor too. Start over gives the room a fresh copy. On the
 // studio's canvas it's inert, so a click selects the block and nothing in
 // it moves; Preview and the site are where it runs.
 import { SITE, THEME } from '../../utils/studio-demo/sample.js';
 import Editor from '../studio-demo/Editor.vue';
 import Collections from '../studio-demo/Collections.vue';
 import Library from '../studio-demo/Library.vue';
 import Forms from '../studio-demo/Forms.vue';
 import Media from '../studio-demo/Media.vue';
 import People from '../studio-demo/People.vue';
 import Branding from '../studio-demo/Branding.vue';

 const props = defineProps({ data: { type: Object, required: true } });

 const shows = useFieldShown();
 const canvas = useCanvas();
 const frozen = computed(() => Boolean(canvas));

 const RAIL = [
  { room: 'editor', label: 'Pages', icon: 'pages', crumb: ['Pages', 'Home'], component: Editor, try: 'Change the headline. The page changes as you type.' },
  { room: 'collections', label: 'Collections', icon: 'collections', crumb: ['Collections'], component: Collections, try: 'Open a service and change its price. Publish puts it on every page that lists it.' },
  { room: 'library', label: 'Library', icon: 'library', crumb: ['Library'], component: Library, try: 'Change the opening hours. All four pages that use them change too.' },
  { room: 'forms', label: 'Forms', icon: 'forms', crumb: ['Forms', 'Request a visit'], component: Forms, try: 'Add a field from the left, then name it on the right.' },
  { room: 'media', label: 'Media', icon: 'media', crumb: ['Media'], component: Media, try: 'Upload a picture, then give it alt text so screen readers can describe it.' },
  { room: 'people', label: 'People & access', icon: 'people', crumb: ['People & access'], component: People, try: 'Invite someone and pick what they can do.' },
  { room: 'branding', label: 'Site settings', icon: 'settings', crumb: ['Site settings', 'Branding'], component: Branding, try: 'Pick a new brand color. Every page changes with it.' },
 ];

 const room = ref(RAIL.some((item) => item.room === props.data.room) ? props.data.room : 'editor');
 watch(
  () => props.data.room,
  (next) => {
   if (RAIL.some((item) => item.room === next)) room.value = next;
  },
 );
 const current = computed(() => RAIL.find((item) => item.room === room.value));
 // A room can say where in it you are (Collections → Services → Boiler service).
 const crumb = ref(null);
 // A tabbed room can swap the try line for one that fits the tab; null keeps the room's own.
 const tryText = ref(null);
 watch(room, () => {
  crumb.value = null;
  tryText.value = null;
 });
 const trail = computed(() => crumb.value ?? current.value.crumb);

 // Each room calls done() when its try task is met; the band then says so
 // and points at the next room and a real site. Kept per room, so coming
 // back still shows it, and Start over clears it.
 const finished = reactive(new Set());
 const isDone = computed(() => finished.has(room.value));
 const next = computed(() => RAIL[(RAIL.indexOf(current.value) + 1) % RAIL.length]);
 const done = () => finished.add(room.value);

 const theme = reactive({ ...THEME });
 const fresh = ref(0);
 function startOver() {
  if (room.value === 'branding') Object.assign(theme, THEME);
  crumb.value = null;
  tryText.value = null;
  finished.delete(room.value);
  fresh.value += 1;
  toast('Back to how it started');
 }

 const message = ref('');
 // The big moments (Publish, Save, Invite) end with a way to start a real site.
 const signup = ref(false);
 let timer;
 function hide(wait) {
  clearTimeout(timer);
  timer = setTimeout(() => (message.value = ''), wait);
 }
 // Pointing at or tabbing to the toast keeps it up.
 const hold = () => clearTimeout(timer);
 function toast(text, { link = false } = {}) {
  message.value = '';
  clearTimeout(timer);
  // A tick apart, so the same words twice are read out twice.
  nextTick(() => {
   message.value = text;
   signup.value = link;
   // Longer with a link, so there's time to reach it.
   hide(link ? 7000 : 3200);
  });
 }
 onBeforeUnmount(() => clearTimeout(timer));

 provide('studioDemo', { site: SITE, theme, toast, done, crumb, tryText, go: (next) => (room.value = next) });

 useHead({
  link: [
   { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
   { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
   // Archivo, Bitter and Fraunces are heading choices for the made-up site in Branding;
   // the studio chrome itself only uses Public Sans and IBM Plex Mono.
   {
    rel: 'stylesheet',
    // impeccable-disable-next-line overused-font -- Fraunces is a Branding pick for the made-up site, not studio chrome.
    href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Bitter:wght@600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:wght@400;500;600;700&display=swap',
   },
  ],
 });
</script>

<template>
 <section class="tb-section tb-studio-demo">
  <div v-if="shows('headline', data.headline) || shows('body', data.body)" class="tb-wrap tb-studio-demo__words">
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading tb-studio-demo__headline" />
   <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-studio-demo__body" />
  </div>
  <div class="tb-wrap tb-wrap--wide tb-studio-demo__stage">
   <div class="sd" :inert="frozen || undefined" role="region" aria-roledescription="demo" :aria-label="`The Timbrr studio, open on ${current.label}, with a made-up site`">
    <header class="sd-top">
     <span class="sd-logo" aria-hidden="true"><StudioDemoIcon name="tree-pine" :size="17" /></span>
     <ol class="sd-crumbs">
      <li class="sd-crumbs__site">
       <span class="sd-site-tile" aria-hidden="true">O</span>
       {{ SITE.name }}
      </li>
      <li v-for="(part, index) in trail" :key="index" :aria-current="index === trail.length - 1 ? 'location' : undefined">{{ part }}</li>
     </ol>
     <button type="button" class="sd-btn sd-btn--ghost sd-top__reset" @click="startOver">
      <StudioDemoIcon name="rotate-ccw" :size="14" />
      Start over
     </button>
     <span class="sd-avatar" :title="SITE.owner.name">{{ SITE.owner.initials }}</span>
    </header>
    <div class="sd-body">
     <nav class="sd-rail" aria-label="Studio">
      <button
       v-for="item in RAIL"
       :key="item.room"
       type="button"
       class="sd-rail__item"
       :class="{ 'is-active': item.room === room }"
       :aria-current="item.room === room ? 'page' : undefined"
       @click="room = item.room"
      >
       <StudioDemoIcon :name="item.icon" :size="19" />
       <span class="sd-rail__label">{{ item.label }}</span>
      </button>
     </nav>
     <div class="sd-room">
      <div class="sd-try" :class="{ 'is-done': isDone }" aria-live="polite">
       <template v-if="isDone">
        <StudioDemoIcon name="check" :size="16" class="sd-try__check" />
        <span>Done. That's how it works on your site too.</span>
        <button type="button" class="sd-try__link" @click="room = next.room">Next: {{ next.label }}</button>
        <a class="sd-try__link" href="/forestrr/start">Start yours</a>
       </template>
       <template v-else>{{ tryText ?? current.try }}</template>
      </div>
      <component :is="current.component" :key="`${room}-${fresh}`" />
     </div>
    </div>
    <p class="sd-toast" :class="{ 'is-on': message, 'has-link': message && signup }" role="status" aria-live="polite" @mouseenter="hold" @mouseleave="message && hide(2400)" @focusin="hold" @focusout="message && hide(2400)">
     {{ message }}
     <a v-if="message && signup" class="sd-toast__link" href="/forestrr/start">Start yours</a>
    </p>
    <p v-if="frozen" class="sd-frozen">Runs in Preview and on the site</p>
   </div>
   <p v-if="shows('caption', data.caption)" class="tb-studio-demo__caption">
    <TbText :data="data" field="caption" />
   </p>
  </div>
 </section>
</template>

<style>
 .tb-studio-demo__words {
  margin-bottom: clamp(24px, 3vw, 36px);
  text-align: center;
 }

 .tb-studio-demo .tb-studio-demo__headline {
  max-width: 20em;
  margin-inline: auto;
  font-size: calc(clamp(28px, 2.2vw + 14px, 40px) * var(--site-heading-scale, 1));
 }

 .tb-studio-demo__body {
  max-width: 38em;
  margin: 14px auto 0;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-studio-demo__caption {
  margin: 14px 0 0;
  font-size: 14px;
  text-align: center;
  color: var(--site-muted, var(--site-body));
 }

 /* ── The studio ── its own palette and type, the studio's light theme,
    whatever the site around it looks like. */
 .sd {
  --sd-paper: #f7f5ec;
  --sd-raised: #ffffff;
  --sd-field: #fcfbf7;
  --sd-sunken: #eeede4;
  --sd-soft: #ecf2ef;
  --sd-tint: #cfe0cb;
  --sd-ink: #3a4a3f;
  --sd-strong: #254832;
  --sd-muted: #5d6b60;
  --sd-faint: #667368;
  --sd-border: #e0e8d8;
  --sd-rule: #ebeae1;
  --sd-brand: #2f6b4f;
  --sd-deep: #254832;
  --sd-on-brand: #f7f5ec;
  --sd-danger: #a83a28;
  --sd-gold: #f3e3b8;
  --sd-display: 'Bitter', Georgia, serif;
  --sd-body: 'Public Sans', system-ui, sans-serif;
  --sd-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --sd-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --sd-ring: 0 0 0 3px color-mix(in srgb, var(--sd-brand) 18%, transparent);

  position: relative;
  container: sd / inline-size;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: clamp(560px, 72vh, 700px);
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: 14px;
  background: var(--sd-raised);
  box-shadow:
   0 1px 2px rgb(37 72 50 / 0.06),
   0 28px 56px -28px rgb(37 72 50 / 0.38);
  font: 400 13.5px/1.45 var(--sd-body);
  color: var(--sd-ink);
  text-align: left;
  caret-color: var(--sd-brand);
  -webkit-font-smoothing: antialiased;
 }

 .sd *,
 .sd *::before,
 .sd *::after {
  box-sizing: border-box;
 }

 .sd ::selection {
  background: var(--sd-tint);
  color: var(--sd-strong);
 }

 .sd :focus-visible {
  outline: 2px solid var(--sd-brand);
  outline-offset: 2px;
 }

 /* Resets at no weight, so every class below wins over them. */
 :where(.sd) :where(h1, h2, h3, h4, p, ul, ol, dl, dd, figure, blockquote) {
  margin: 0;
 }

 :where(.sd) :where(ul, ol) {
  padding: 0;
  list-style: none;
 }

 .sd :where(button, input, textarea, select) {
  font: inherit;
  color: inherit;
 }

 .sd-icon {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
 }

 .sd-top {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 52px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 14px;
  background: var(--sd-raised);
 }

 .sd-logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--sd-deep);
  color: var(--sd-on-brand);
 }

 .sd-crumbs {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
  font-size: 13.5px;
  color: var(--sd-muted);
 }

 .sd-crumbs li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
 }

 .sd-crumbs li + li::before {
  content: '/';
  color: color-mix(in srgb, var(--sd-muted) 55%, transparent);
 }

 .sd-crumbs li:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .sd-site-tile {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #1f3a5c;
  font: 700 11px/1 var(--sd-body);
  color: #fff;
 }

 .sd-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--sd-tint);
  font: 600 11.5px/1 var(--sd-body);
  color: var(--sd-strong);
 }

 .sd-body {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  min-height: 0;
 }

 .sd-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border-right: 1px solid var(--sd-border);
  padding: 12px 0;
  background: var(--sd-raised);
 }

 /* Icon over its name, so a first-time visitor reads the rooms without
    hovering each one. */
 .sd-rail__item {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  width: 64px;
  min-height: 52px;
  border: 0;
  border-radius: 10px;
  padding: 6px 2px;
  background: none;
  color: var(--sd-faint);
  cursor: pointer;
  transition:
   background-color 0.16s var(--sd-ease),
   color 0.16s var(--sd-ease);
 }

 .sd-rail__item:hover {
  background: var(--sd-sunken);
  color: var(--sd-strong);
 }

 .sd-rail__item.is-active {
  background: var(--sd-soft);
  color: var(--sd-brand);
 }

 .sd-rail__label {
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-wrap: balance;
 }

 .sd-room {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: var(--sd-paper);
 }

 .sd-room > :not(.sd-try) {
  height: 100%;
  min-height: 0;
 }

 /* What to try first: one line, a soft band across the room, no card. */
 .sd-try {
  margin: 0;
  border-bottom: 1px solid var(--sd-border);
  padding: 9px 16px;
  background: var(--sd-soft);
  font-size: 13px;
  line-height: 1.4;
  color: var(--sd-strong);
  text-wrap: pretty;
 }

 .sd-try.is-done {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  padding-block: 7px;
 }

 .sd-try__check {
  margin-right: -6px;
  color: var(--sd-brand);
 }

 .sd-try__link {
  border: 0;
  padding: 2px 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--sd-brand);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
 }

 .sd-try__link:hover {
  color: var(--sd-strong);
 }

 .sd-toast {
  position: absolute;
  bottom: 18px;
  left: 50%;
  z-index: 20;
  max-width: min(92%, 460px);
  translate: -50% 12px;
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--sd-strong);
  font-size: 13px;
  line-height: 1.4;
  color: var(--sd-on-brand);
  box-shadow: 0 10px 28px -10px rgb(20 40 28 / 0.5);
  pointer-events: none;
  opacity: 0;
  transition:
   opacity 0.2s var(--sd-ease),
   translate 0.32s var(--sd-ease);
 }

 .sd-toast.is-on {
  translate: -50% 0;
  opacity: 1;
 }

 .sd-toast.has-link {
  pointer-events: auto;
 }

 .sd-toast__link {
  margin-left: 4px;
  font-weight: 700;
  color: var(--sd-gold);
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .sd-toast__link:focus-visible {
  outline-color: var(--sd-gold);
 }

 .sd-frozen {
  position: absolute;
  top: 64px;
  right: 14px;
  z-index: 21;
  border-radius: 8px;
  padding: 6px 10px;
  background: var(--sd-strong);
  font-size: 12px;
  font-weight: 600;
  color: var(--sd-on-brand);
 }

 /* ── What every room draws with ── */

 .sd-pane {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--sd-muted) 35%, transparent) transparent;
 }

 .sd-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--sd-raised);
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-strong);
  white-space: nowrap;
  cursor: pointer;
  transition:
   background-color 0.16s var(--sd-ease),
   border-color 0.16s var(--sd-ease),
   color 0.16s var(--sd-ease);
 }

 .sd-btn:hover {
  border-color: color-mix(in srgb, var(--sd-brand) 30%, var(--sd-border));
  background: var(--sd-field);
 }

 .sd-btn:disabled {
  opacity: 0.5;
  cursor: default;
 }

 .sd-btn--primary {
  border-color: var(--sd-brand);
  background: var(--sd-brand);
  color: var(--sd-on-brand);
 }

 .sd-btn--primary:hover {
  border-color: var(--sd-deep);
  background: var(--sd-deep);
 }

 .sd-btn--ghost {
  border-color: transparent;
  background: none;
  color: var(--sd-muted);
 }

 .sd-btn--ghost:hover {
  border-color: transparent;
  background: var(--sd-sunken);
  color: var(--sd-strong);
 }

 .sd-btn--icon {
  width: 32px;
  padding: 0;
 }

 .sd-btn--danger {
  color: var(--sd-danger);
 }

 .sd-field + .sd-field {
  margin-top: 12px;
 }

 .sd-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .sd-help {
  margin-top: 6px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .sd-input {
  display: block;
  width: 100%;
  min-height: 34px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--sd-field);
  font: inherit;
  font-size: 13px;
  color: var(--sd-ink);
  transition:
   border-color 0.16s var(--sd-ease),
   box-shadow 0.16s var(--sd-ease);
 }

 textarea.sd-input {
  resize: vertical;
  line-height: 1.45;
 }

 .sd-input::placeholder {
  color: var(--sd-faint);
 }

 .sd-input:focus {
  border-color: var(--sd-brand);
  outline: none;
  box-shadow: var(--sd-ring);
 }

 .sd-input[aria-invalid='true'] {
  border-color: var(--sd-danger);
 }

 select.sd-input {
  appearance: none;
  padding-right: 30px;
  background: var(--sd-field)
   url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235d6b60' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
   no-repeat right 10px center;
 }

 .sd-seg {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
 }

 .sd-seg button {
  flex: 1;
  min-height: 32px;
  border: 0;
  border-left: 1px solid var(--sd-border);
  padding: 0 10px;
  background: var(--sd-raised);
  font-size: 13px;
  color: var(--sd-muted);
  cursor: pointer;
 }

 .sd-seg button:first-child {
  border-left: 0;
  border-radius: 7px 0 0 7px;
 }

 /* Round the end buttons too, so the pressed ring follows the corner. */
 .sd-seg button:last-child {
  border-radius: 0 7px 7px 0;
 }

 .sd-seg button:only-child {
  border-radius: 7px;
 }

 .sd-seg button[aria-pressed='true'] {
  background: var(--sd-soft);
  font-weight: 600;
  color: var(--sd-strong);
  box-shadow: inset 0 0 0 1px var(--sd-brand);
 }

 .sd-switch {
  position: relative;
  flex: none;
  width: 36px;
  height: 20px;
  border: 0;
  border-radius: 10px;
  background: #cfd6cd;
  cursor: pointer;
  transition: background-color 0.16s var(--sd-ease);
 }

 .sd-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  transition: translate 0.2s var(--sd-ease);
 }

 .sd-switch[aria-checked='true'] {
  background: var(--sd-brand);
 }

 .sd-switch[aria-checked='true']::after {
  translate: 16px 0;
 }

 .sd-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  padding: 2px 7px;
  background: var(--sd-sunken);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--sd-muted);
  white-space: nowrap;
 }

 .sd-badge--live {
  background: var(--sd-soft);
  color: var(--sd-brand);
 }

 .sd-badge--draft {
  background: var(--sd-gold);
  color: #6b4d12;
 }

 .sd-caps {
  font: 500 11px/1 var(--sd-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sd-muted);
 }

 .sd-title {
  font: 700 22px/1.15 var(--sd-display);
  letter-spacing: -0.01em;
  color: var(--sd-strong);
 }

 .sd-kbd {
  border: 1px solid var(--sd-border);
  border-radius: 4px;
  padding: 1px 5px;
  font: 500 10px/1.4 var(--sd-mono);
  color: var(--sd-muted);
 }

 .sd-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
 }

 /* The made-up site, wherever a room shows it: a container, so its blocks
    stack at a phone's width. */
 .sd-site {
  container: ss / inline-size;
  overflow: hidden;
  background: var(--s-paper);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
 }

 /* ── Narrow: the rail becomes a row of tabs under the top bar, and each
    room shows one pane at a time (their own @container sd rules). ── */
 @container sd (max-width: 760px) {
  .sd-body {
   grid-template-columns: 1fr;
   grid-template-rows: auto minmax(0, 1fr);
  }

  .sd-rail {
   flex-direction: row;
   justify-content: space-between;
   overflow-x: auto;
   border-right: 0;
   border-bottom: 1px solid var(--sd-border);
   padding: 6px 8px;
   scrollbar-width: none;
  }

  /* Seven rooms share the row, each icon keeps its name under it in
     small type: bare icons alone left Library and Forms a guess. */
  .sd-rail__item {
   flex: 1 1 auto;
   min-width: 0;
   width: auto;
   min-height: 44px;
   gap: 2px;
   padding: 4px 1px;
  }

  /* A long name wraps to two lines rather than lose its end. */
  .sd-rail__label {
   max-width: 100%;
   font-size: 10px;
  }

  .sd-top__reset {
   width: 32px;
   padding: 0;
   font-size: 0;
  }

  .sd-crumbs li:not(:last-child) {
   display: none;
  }

  /* Only the last crumb shows, so it has nothing to divide from. */
  .sd-crumbs li:last-child::before {
   content: none;
  }
 }

 @media (prefers-reduced-motion: reduce) {
  .sd *,
  .sd-toast {
   transition-duration: 0.01ms !important;
   animation-duration: 0.01ms !important;
  }
 }
</style>
