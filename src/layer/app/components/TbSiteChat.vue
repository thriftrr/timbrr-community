<script setup>
 // Site chat (the studio's docs/site-chat.md): a button in the bottom corner
 // of the live site and a dialog where a visitor asks the site's assistant.
 // It says it's an assistant, always. Anything it can't answer offers "Ask
 // the team to reply", which sends the chat to the site's contact form. The
 // chat's id lives in this tab's sessionStorage (no cookie); messages are
 // drawn as text. Loaded lazily, only on a site with chat on, drawn only in
 // the browser.
 const props = defineProps({ name: { type: String, required: true } });
 const KEY = 'tb-chat';
 const MAX = 200;
 const mounted = ref(false);
 const dialog = ref(null);
 const input = ref(null);
 const state = reactive({ id: null, messages: [], text: '', asking: false, canHandOver: false, offer: false, handing: false, name: '', email: '', sent: false, closed: false, error: '' });

 onMounted(() => {
  mounted.value = true;
  try {
   const kept = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
   if (kept && typeof kept.id === 'string' && Array.isArray(kept.messages)) Object.assign(state, { id: kept.id, messages: kept.messages.slice(-30), canHandOver: kept.canHandOver === true, sent: kept.sent === true });
  } catch {}
 });
 function keep() {
  try {
   sessionStorage.setItem(KEY, JSON.stringify({ id: state.id, messages: state.messages, canHandOver: state.canHandOver, sent: state.sent }));
  } catch {}
 }

 let opener = null;
 function open() {
  if (!dialog.value || dialog.value.open) return;
  opener = document.activeElement;
  dialog.value.showModal();
  input.value?.focus();
 }
 function close() {
  if (dialog.value?.open) dialog.value.close();
 }
 function closed() {
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
 }
 // A click on the backdrop (the dialog itself, outside its box) closes it.
 function clicked(event) {
  if (event.target === dialog.value) close();
 }

 const problem = (error, fallback) => {
  const status = error?.statusCode ?? error?.response?.status;
  if (status === 410) state.closed = true;
  return status === 410 ? 'Chat is closed right now.' : (error?.data?.message ?? fallback);
 };

 async function ask() {
  const text = state.text.trim().slice(0, MAX);
  if (!text || state.asking || state.closed) return;
  state.asking = true;
  state.error = '';
  state.messages.push({ role: 'visitor', text });
  state.text = '';
  try {
   const reply = await $fetch('/__timbrr/chat/ask', { method: 'POST', body: { id: state.id, text, page: location.pathname || '/' }, retry: false });
   state.id = reply.id;
   state.messages.push({ role: 'assistant', text: String(reply.reply?.text ?? '') });
   state.canHandOver = reply.canHandOver === true;
   state.offer = reply.handOver === true;
  } catch (error) {
   state.error = problem(error, "Couldn't ask that. Try again in a minute.");
  } finally {
   state.asking = false;
   keep();
  }
 }

 async function handOver() {
  if (state.handing) return;
  state.handing = true;
  state.error = '';
  try {
   await $fetch('/__timbrr/chat/handover', { method: 'POST', body: { id: state.id, name: state.name.trim(), email: state.email.trim() }, retry: false });
   state.sent = true;
   state.offer = false;
   keep();
  } catch (error) {
   state.error = problem(error, "Couldn't send it. Try again in a minute.");
  } finally {
   state.handing = false;
  }
 }
</script>

<template>
 <div v-if="mounted && !state.closed" class="tb-chat">
  <button type="button" class="tb-chat__open" aria-haspopup="dialog" @click="open">{{ props.name }}</button>
  <dialog ref="dialog" class="tb-chat__dialog" :aria-label="props.name" @click="clicked" @close="closed">
   <header class="tb-chat__head">
    <div>
     <p class="tb-chat__name">{{ props.name }}</p>
     <p class="tb-chat__who">An assistant. Not a person. Chats are kept 90 days.</p>
    </div>
    <button type="button" class="tb-chat__close" aria-label="Close" @click="close">×</button>
   </header>
   <ol class="tb-chat__log" aria-live="polite">
    <li v-for="(one, at) in state.messages" :key="at" class="tb-chat__msg" :class="`is-${one.role}`">{{ one.text }}</li>
    <li v-if="state.asking" class="tb-chat__msg is-assistant is-waiting">…</li>
   </ol>
   <p v-if="state.error" class="tb-chat__error" role="alert">{{ state.error }}</p>
   <div v-if="state.sent" class="tb-chat__note">Sent. The team will answer by email.</div>
   <form v-else-if="state.offer && state.id && state.canHandOver" class="tb-chat__hand" @submit.prevent="handOver">
    <p class="tb-chat__note">Sends this chat to the team. They answer by email.</p>
    <label class="tb-chat__label">Name <input v-model="state.name" class="tb-chat__input" autocomplete="name" maxlength="200" required /></label>
    <label class="tb-chat__label">Email <input v-model="state.email" class="tb-chat__input" type="email" autocomplete="email" maxlength="254" required /></label>
    <button type="submit" class="tb-chat__button" :disabled="state.handing">{{ state.handing ? 'Sending…' : 'Ask the team to reply' }}</button>
   </form>
   <button v-else-if="state.id && state.canHandOver" type="button" class="tb-chat__quiet" @click="state.offer = true">Ask the team instead</button>
   <form class="tb-chat__ask" @submit.prevent="ask">
    <label class="tb-chat__sr" for="tb-chat-text">Your question</label>
    <input id="tb-chat-text" ref="input" v-model="state.text" class="tb-chat__input" :maxlength="MAX" placeholder="Type your question…" autocomplete="off" />
    <button type="submit" class="tb-chat__send" :disabled="state.asking" aria-label="Send">›</button>
   </form>
  </dialog>
 </div>
</template>

<style>
 .tb-chat__open {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 40;
  min-height: 44px;
  padding: 10px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--site-accent, #2f6b4f);
  color: var(--site-accent-ink, #fff);
  box-shadow: var(--site-shadow);
  font: 600 15px/1.2 var(--site-font-body, system-ui, sans-serif);
  cursor: pointer;
 }

 .tb-chat__dialog {
  width: min(380px, 100% - 32px);
  max-height: min(600px, 100dvh - 32px);
  margin: auto 16px 16px auto;
  padding: 0;
  border: 1px solid var(--site-border, #e5e5e5);
  border-radius: var(--site-radius, 12px);
  background: var(--site-bg, #fff);
  color: var(--site-ink, #222);
  box-shadow: var(--site-shadow);
  font: 15px/1.5 var(--site-font-body, system-ui, sans-serif);
  flex-direction: column;
 }

 .tb-chat__dialog[open] {
  display: flex;
 }

 .tb-chat__dialog::backdrop {
  background: color-mix(in srgb, var(--site-heading, #000) 20%, transparent);
 }

 .tb-chat__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--site-accent, #2f6b4f);
  color: var(--site-accent-ink, #fff);
 }

 .tb-chat__name {
  margin: 0;
  font-weight: 700;
 }

 .tb-chat__who {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
 }

 .tb-chat__close {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: none;
  color: inherit;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
 }

 .tb-chat__log {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
 }

 .tb-chat__msg {
  padding: 12px 16px;
  border-bottom: 1px solid var(--site-border, #eee);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
 }

 .tb-chat__msg.is-visitor {
  background: var(--site-surface, #f7f7f7);
  font-weight: 600;
 }

 .tb-chat__error,
 .tb-chat__note {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--site-muted, #666);
 }

 .tb-chat__error {
  color: var(--site-heading, #222);
 }

 .tb-chat__hand {
  display: grid;
  gap: 8px;
  padding: 8px 16px 12px;
  border-bottom: 1px solid var(--site-border, #eee);
 }

 .tb-chat__label {
  display: grid;
  gap: 2px;
  font-size: 13px;
 }

 .tb-chat__input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--site-border, #ccc);
  border-radius: var(--site-control-radius, 8px);
  background: var(--site-bg, #fff);
  color: inherit;
  font: inherit;
 }

 .tb-chat__button {
  min-height: 44px;
  border: 0;
  border-radius: var(--site-control-radius, 8px);
  background: var(--site-accent, #2f6b4f);
  color: var(--site-accent-ink, #fff);
  font: 600 15px/1.2 var(--site-font-body, system-ui, sans-serif);
  cursor: pointer;
 }

 .tb-chat__quiet {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  background: none;
  color: var(--site-accent, #2f6b4f);
  font: inherit;
  font-size: 14px;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
 }

 .tb-chat__ask {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--site-border, #eee);
 }

 .tb-chat__ask .tb-chat__input {
  flex: 1;
  min-width: 0;
 }

 .tb-chat__send {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: var(--site-control-radius, 8px);
  background: var(--site-accent, #2f6b4f);
  color: var(--site-accent-ink, #fff);
  font-size: 22px;
  cursor: pointer;
 }

 .tb-chat__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
 }

 @media (max-width: 30rem) {
  .tb-chat__dialog {
   width: 100%;
   max-width: none;
   max-height: 100dvh;
   margin: auto 0 0;
   border-radius: var(--site-radius, 12px) var(--site-radius, 12px) 0 0;
  }
 }

 @media (prefers-reduced-motion: no-preference) {
  .tb-chat__open {
   transition: transform 0.15s ease;
  }

  .tb-chat__open:hover {
   transform: translateY(-1px);
  }
 }
</style>
