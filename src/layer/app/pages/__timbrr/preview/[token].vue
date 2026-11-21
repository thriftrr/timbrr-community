<script setup>
 // A preview link (the studio's docs/publishing.md, "Preview links"): a
 // page's working copy, not live yet, drawn exactly as the site draws its
 // pages, for someone the team shared it with. No account: the token in the
 // address is the key, and the studio checks it on every read. A slim bar
 // over the page says what this is and who shared it, and "Leave a comment"
 // lets them pick a block and say something about it. Open comments show as
 // numbered pins on their blocks. Everything people wrote is shown as text,
 // never as HTML. Never indexed (noindex here, in the answer's headers and
 // in the studio's).
 import { definitions } from '#timbrr/blocks';

 definePageMeta({ layout: false });
 const route = useRoute();
 const token = String(route.params.token ?? '');
 const { site, blocks, style, data } = await useTimbrrPage(route.path, { source: `/__timbrr/share/${encodeURIComponent(token)}` });
 useSeoMeta({ robots: 'noindex, nofollow' });
 useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] });

 const framed = computed(() => Boolean(site.value.name || site.value.domain));
 const preview = computed(() => data.value?.preview ?? {});
 const comments = ref(Array.isArray(data.value?.comments) ? data.value.comments : []);
 const MAX = 1000;
 const NAME_MAX = 80;

 // The page's own blocks, by id, with a name a person can tell apart.
 const labels = new Map(definitions.map(({ def }) => [def.type, def.label]));
 const named = computed(() =>
  blocks.value.map((block, at) => {
   const caption = [block.data?.headline, block.data?.title, block.data?.heading].find((value) => typeof value === 'string' && value.trim());
   const label = labels.get(block.type) ?? 'Block';
   return { id: block.id, name: caption ? `${label}: ${caption.length > 40 ? `${caption.slice(0, 39)}…` : caption}` : `${label} (${at + 1})` };
  }),
 );
 const nameOf = (id) => named.value.find((block) => block.id === id)?.name ?? 'A block';
 const threads = computed(() => {
  const by = new Map();
  for (const comment of comments.value) {
   if (!named.value.some((block) => block.id === comment.blockId)) continue;
   if (!by.has(comment.blockId)) by.set(comment.blockId, []);
   by.get(comment.blockId).push(comment);
  }
  // Numbered in the page's order.
  return named.value.filter((block) => by.has(block.id)).map((block, at) => ({ number: at + 1, blockId: block.id, comments: by.get(block.id) }));
 });

 // Pins: one per block with open comments, at its top right corner.
 const main = ref(null);
 const spots = ref({});
 function place() {
  if (!main.value) return;
  const box = main.value.getBoundingClientRect();
  const next = {};
  for (const thread of threads.value) {
   const el = main.value.querySelector(`[data-block-id="${CSS.escape(thread.blockId)}"]`);
   if (!el) continue;
   const r = el.getBoundingClientRect();
   next[thread.blockId] = { top: `${r.top - box.top + 12}px`, left: `${Math.min(r.right - box.left, box.width) - 44}px` };
  }
  spots.value = next;
 }
 let observer = null;
 onMounted(() => {
  place();
  observer = new ResizeObserver(place);
  observer.observe(main.value);
  window.addEventListener('keydown', onKey);
 });
 onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('keydown', onKey);
 });
 watch(threads, () => nextTick(place));

 // Picking a block, then writing.
 const picking = ref(false);
 const open = ref(null); // { blockId, mode: 'thread' | 'new' }
 const form = reactive({ blockId: '', name: '', body: '' });
 const sending = ref(false);
 const problem = ref('');
 onMounted(() => {
  try {
   form.name = localStorage.getItem('timbrr-preview-name') ?? '';
  } catch {
   // no storage here: they type it again
  }
 });
 function startPicking() {
  open.value = null;
  picking.value = true;
 }
 function onPageClick(event) {
  if (!picking.value) return;
  // A block of the page itself, never one inside a Split's column.
  const id = topBlockOf(event.target);
  event.preventDefault();
  event.stopPropagation();
  if (id) compose(id);
 }
 function topBlockOf(target) {
  let el = target.closest?.('[data-block-id]');
  let found = '';
  while (el) {
   if (named.value.some((block) => block.id === el.dataset.blockId)) found = el.dataset.blockId;
   el = el.parentElement?.closest('[data-block-id]');
  }
  return found;
 }
 function compose(blockId) {
  picking.value = false;
  problem.value = '';
  form.blockId = blockId || named.value[0]?.id || '';
  form.body = '';
  open.value = { blockId: form.blockId, mode: 'new' };
 }
 function openThread(blockId) {
  picking.value = false;
  problem.value = '';
  form.blockId = blockId;
  form.body = '';
  open.value = { blockId, mode: 'thread' };
 }
 function close() {
  open.value = null;
  picking.value = false;
 }
 function onKey(event) {
  if (event.key === 'Escape' && (open.value || picking.value)) close();
 }

 async function send() {
  if (sending.value) return;
  problem.value = '';
  if (!form.name.trim()) return (problem.value = 'Add your name, so the team knows who said it.');
  if (!form.body.trim()) return (problem.value = 'Write a comment first.');
  sending.value = true;
  try {
   const answer = await post();
   comments.value = [...comments.value, answer.comment];
   try {
    localStorage.setItem('timbrr-preview-name', form.name.trim());
   } catch {
    // fine without it
   }
   form.body = '';
   open.value = { blockId: form.blockId, mode: 'thread' };
  } catch (error) {
   problem.value = error?.data?.message ?? "Couldn't send that. Try again in a minute.";
  } finally {
   sending.value = false;
  }
 }

 // The Human check, when the studio asks for it (a 428 with its key), as a
 // form send does (TbForm).
 const check = ref(null);
 async function post(human = '') {
  const res = await fetch(`/__timbrr/share/${encodeURIComponent(token)}/comments`, {
   method: 'POST',
   headers: { 'content-type': 'application/json' },
   body: JSON.stringify({ blockId: form.blockId, name: form.name, body: form.body, ...(human ? { token: human } : {}) }),
  });
  const answer = await res.json().catch(() => null);
  if (res.status === 428 && answer?.siteKey && !human) return post(await humanToken(answer.siteKey));
  if (!res.ok || !answer?.comment) throw { data: { message: answer?.message ?? { 413: 'That comment is too long.', 429: "That's a lot of comments at once. Try again in a while." }[res.status] } };
  return answer;
 }
 function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.async = true;
   script.onload = () => resolve(window.turnstile);
   script.onerror = () => reject(new Error("Couldn't load the check."));
   document.head.append(script);
  });
 }
 async function humanToken(siteKey) {
  const turnstile = await loadTurnstile();
  return new Promise((resolve, reject) => {
   check.value.textContent = '';
   turnstile.render(check.value, { sitekey: siteKey, callback: resolve, 'error-callback': () => reject({ data: { message: "The check didn't pass. Try again." } }) });
  });
 }

 const when = (at) => new Date(at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
 const initials = (name) =>
  String(name ?? '')
   .split(/\s+/)
   .filter(Boolean)
   .slice(0, 2)
   .map((word) => word[0].toUpperCase())
   .join('') || '·';
 const openComments = computed(() => comments.value.length);
 const thread = computed(() => threads.value.find((one) => one.blockId === open.value?.blockId) ?? null);
</script>

<template>
 <div class="tb-share" :class="{ 'is-picking': picking }">
  <div class="tb-share__bar" role="region" aria-label="Preview">
   <span class="tb-share__eye" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
   </span>
   <p class="tb-share__what">
    <strong>Preview of {{ preview.title || 'this page' }}</strong>
    <span class="tb-share__dim"> · not live yet</span>
    <span v-if="preview.sharedBy" class="tb-share__dim"> · Shared by {{ preview.sharedBy }}{{ preview.siteName ? `, ${preview.siteName}` : '' }}</span>
   </p>
   <span class="tb-share__count">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    {{ openComments }} {{ openComments === 1 ? 'comment' : 'comments' }}
   </span>
   <button type="button" class="tb-share__leave" :aria-pressed="picking ? 'true' : 'false'" @click="picking ? close() : startPicking()">
    {{ picking ? 'Cancel' : '+ Leave a comment' }}
   </button>
  </div>
  <p v-if="picking" class="tb-share__hint" role="status">
   Click the part of the page you want to comment on.
   <button type="button" class="tb-share__link" @click="compose('')">Or pick it from a list</button>
  </p>

  <div class="tb-page" :style="style">
   <a href="#main" class="tb-skip">Skip to main content</a>
   <TbSiteHeader v-if="framed" :site="site" />
   <main id="main" ref="main" tabindex="-1" class="tb-page__main tb-share__main" @click.capture="onPageClick">
    <TbBlocks :blocks="blocks" />
    <button
     v-for="one in threads"
     v-show="spots[one.blockId]"
     :key="one.blockId"
     type="button"
     class="tb-share__pin"
     :style="spots[one.blockId]"
     :aria-label="`${one.comments.length} ${one.comments.length === 1 ? 'comment' : 'comments'} on ${nameOf(one.blockId)}`"
     @click.stop="openThread(one.blockId)"
    >
     {{ one.number }}
    </button>
   </main>
   <TbSiteFooter v-if="framed" :site="site" />
  </div>

  <section v-if="open" class="tb-share__panel" role="dialog" aria-modal="false" :aria-label="`Comments on ${nameOf(open.blockId)}`">
   <header class="tb-share__panel-head">
    <p class="tb-share__panel-title">{{ nameOf(open.blockId) }}</p>
    <button type="button" class="tb-share__x" aria-label="Close" @click="close">×</button>
   </header>
   <ol v-if="thread" class="tb-share__thread">
    <li v-for="comment in thread.comments" :key="comment.id">
     <span class="tb-share__avatar" :class="{ 'is-team': comment.team }" aria-hidden="true">{{ initials(comment.name) }}</span>
     <div>
      <p>
       <strong>{{ comment.name }}</strong>
      <span class="tb-share__dim">{{ comment.team ? `${preview.siteName || 'Team'} · ` : '' }}{{ when(comment.createdAt) }}</span>
      </p>
      <p class="tb-share__body">{{ comment.body }}</p>
     </div>
    </li>
   </ol>
   <form class="tb-share__form" @submit.prevent="send">
    <label v-if="open.mode === 'new'" class="tb-share__field">
     <span>Which part</span>
     <select v-model="form.blockId" @change="open.blockId = form.blockId">
      <option v-for="block in named" :key="block.id" :value="block.id">{{ block.name }}</option>
     </select>
    </label>
    <label class="tb-share__field">
     <span>Your name</span>
     <input v-model="form.name" :maxlength="NAME_MAX" autocomplete="name" required />
    </label>
    <label class="tb-share__field">
     <span>{{ thread ? 'Reply' : 'Comment' }}</span>
     <textarea v-model="form.body" :maxlength="MAX" rows="3" required :placeholder="thread ? `Reply to ${thread.comments.at(-1).name}` : 'What should change here?'" />
     <small class="tb-share__dim">{{ form.body.length }} / {{ MAX }}</small>
    </label>
    <div ref="check" />
    <p v-if="problem" class="tb-share__problem" role="alert">{{ problem }}</p>
    <div class="tb-share__actions">
     <button type="button" class="tb-share__ghost" @click="close">Cancel</button>
     <button type="submit" class="tb-share__leave" :disabled="sending">{{ sending ? 'Sending…' : 'Send' }}</button>
    </div>
   </form>
  </section>
 </div>
</template>

<style>
 /* Timbrr's own chrome over the site, in Timbrr's colors, not the site's. */
 .tb-share {
  --share-ink: #254832;
  --share-text: #3a4a3f;
  --share-muted: #5d6b60;
  --share-border: #e0e8d8;
  --share-pine: #2f6b4f;
  --share-info: #2d5a7a;
  --share-info-soft: #e7eff5;
 }

 .tb-share__bar {
  position: sticky;
  top: 0;
  z-index: 60;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  min-height: 48px;
  border-bottom: 1px solid var(--share-border);
  padding: 6px 20px;
  background: #fff;
  font: 14px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--share-text);
 }

 .tb-share__eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--share-info-soft);
  color: var(--share-info);
 }

 .tb-share__what {
  flex: 1;
  min-width: 200px;
  margin: 0;
 }

 .tb-share__what strong {
  color: var(--share-ink);
 }

 .tb-share__dim {
  color: var(--share-muted);
  font-weight: 400;
 }

 .tb-share__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--share-ink);
 }

 .tb-share__leave {
  border: 0;
  border-radius: 8px;
  padding: 8px 14px;
  background: var(--share-pine);
  font: 600 13px/1.3 system-ui, sans-serif;
  color: #fff;
  cursor: pointer;
 }

 .tb-share__leave:disabled {
  opacity: 0.6;
 }

 .tb-share__leave:focus-visible,
 .tb-share__ghost:focus-visible,
 .tb-share__pin:focus-visible,
 .tb-share__x:focus-visible,
 .tb-share__link:focus-visible {
  outline: 2px solid var(--share-info);
  outline-offset: 2px;
 }

 .tb-share__hint {
  position: sticky;
  top: 48px;
  z-index: 59;
  margin: 0;
  padding: 8px 20px;
  background: var(--share-info-soft);
  font: 13px/1.4 system-ui, sans-serif;
  color: var(--share-info);
 }

 .tb-share__link {
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
 }

 .tb-share__main {
  position: relative;
 }

 .tb-share.is-picking .tb-share__main [data-block-id] {
  cursor: crosshair;
 }

 .tb-share.is-picking .tb-share__main [data-block-id]:hover {
  outline: 2px dashed var(--share-info);
  outline-offset: -2px;
 }

 .tb-share__pin {
  position: absolute;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid #fff;
  border-radius: 50% 50% 50% 0;
  background: var(--share-info);
  box-shadow: 0 0 0 2px var(--share-info), 0 4px 10px rgb(0 0 0 / 0.2);
  font: 700 13px/1 system-ui, sans-serif;
  color: #fff;
  cursor: pointer;
 }

 .tb-share__panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 70;
  width: min(360px, calc(100vw - 32px));
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  border: 1px solid var(--share-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.16);
  font: 14px/1.45 system-ui, sans-serif;
  color: var(--share-text);
 }

 .tb-share__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--share-border);
  padding: 10px 14px;
 }

 .tb-share__panel-title {
  margin: 0;
  overflow: hidden;
  font: 500 11px/1.3 ui-monospace, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--share-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .tb-share__x {
  border: 0;
  background: none;
  font-size: 20px;
  line-height: 1;
  color: var(--share-muted);
  cursor: pointer;
 }

 .tb-share__thread {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 14px;
  list-style: none;
 }

 .tb-share__thread li {
  display: flex;
  gap: 10px;
 }

 .tb-share__thread p {
  margin: 0;
 }

 .tb-share__thread strong {
  margin-right: 6px;
  color: var(--share-ink);
 }

 .tb-share__avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--share-info-soft);
  font: 700 11px/1 system-ui, sans-serif;
  color: var(--share-info);
 }

 .tb-share__avatar.is-team {
  background: var(--share-ink);
  color: #fff;
 }

 .tb-share__body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
 }

 .tb-share__form {
  display: grid;
  gap: 10px;
  border-top: 1px solid var(--share-border);
  padding: 14px;
 }

 .tb-share__field {
  display: grid;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--share-muted);
 }

 .tb-share__field input,
 .tb-share__field select,
 .tb-share__field textarea {
  width: 100%;
  border: 1px solid #c9d3c4;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fcfbf7;
  font: 400 14px/1.4 system-ui, sans-serif;
  color: var(--share-text);
 }

 .tb-share__field small {
  justify-self: end;
  font-weight: 400;
 }

 .tb-share__problem {
  margin: 0;
  font-size: 13px;
  color: #9a4f45;
 }

 .tb-share__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
 }

 .tb-share__ghost {
  border: 1px solid var(--share-border);
  border-radius: 8px;
  padding: 8px 14px;
  background: #fff;
  font: 600 13px/1.3 system-ui, sans-serif;
  color: var(--share-ink);
  cursor: pointer;
 }

 @media (max-width: 640px) {
  .tb-share__bar {
   padding: 6px 16px;
  }

  .tb-share__panel {
   right: 16px;
   bottom: 16px;
  }
 }
</style>
