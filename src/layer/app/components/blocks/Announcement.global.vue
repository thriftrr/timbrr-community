<script setup>
 // A bar across the page for news that can't wait: the message, a link to
 // read more, and a × that puts the bar away for this visit to the page.
 // On the brand color (Pine), a deep warm shade of the eyebrow color (Clay)
 // or the site's darkest shade (Ink). On phones the message wraps and the
 // × moves to the bar's right edge. With nothing to say, the site skips it.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const href = computed(() => safeHref(props.data.to));
 const dismissed = ref(false);

 // Words to show: a string with something in it, or a rich-text document
 // with some text.
 function hasWords(node) {
  if (typeof node === 'string') return node.trim() !== '';
  if (node?.type === 'text') return Boolean(node.text?.trim());
  return Array.isArray(node?.content) && node.content.some(hasWords);
 }

 // An empty link label isn't drawn, except on the canvas while it's being
 // typed into, so clearing it to start over doesn't lose the caret.
 function shows(field, value) {
  if (hasWords(value)) return true;
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }

 // The message is the bar, so while the canvas is being edited it's always
 // there to type into.
 const editing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);
 const message = computed(() => editing.value || hasWords(props.data.text));
 const showLink = computed(() => shows('link', props.data.link));

 // In the studio's canvas the bar stays put, as its links stay put there:
 // it's the page being worked on, not a visit.
 function dismiss() {
  if (!canvas) dismissed.value = true;
 }
</script>

<template>
 <section v-if="!dismissed && (message || showLink)" class="tb-announcement" :class="`tb-announcement--${data.tone}`" aria-label="Announcement">
  <div class="tb-wrap tb-announcement__inner">
   <TbRich v-if="message" :data="data" field="text" class="tb-announcement__text" />
   <a v-if="showLink" :href="href" class="tb-announcement__link"><TbText :data="data" field="link" /></a>
   <button type="button" class="tb-announcement__close" aria-label="Hide announcement" @click="dismiss">
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
     <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    </svg>
   </button>
  </div>
 </section>
</template>

<style>
 .tb-announcement {
  background: var(--site-accent);
  font-size: 15px;
  line-height: 1.45;
  color: var(--site-accent-ink);
 }

 .tb-announcement--clay {
  background: color-mix(in srgb, var(--site-eyebrow) 60%, var(--site-dark));
  color: var(--site-dark-ink);
 }

 .tb-announcement--ink {
  background: var(--site-dark);
  color: var(--site-dark-ink);
 }

 /* One centered line: the message, its link, the ×. When it doesn't fit,
    the message takes its own line and the rest goes under it. */
 .tb-announcement__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 16px;
  padding-block: 13px;
  text-align: center;
 }

 .tb-announcement__text {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: break-word;
 }

 .tb-announcement__text strong {
  font-weight: 800;
 }

 .tb-announcement .tb-announcement__text :is(a, h2, h3) {
  color: inherit;
 }

 .tb-announcement__link {
  min-width: 0;
  border-radius: 2px;
  font-weight: 700;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  overflow-wrap: break-word;
 }

 .tb-announcement__link:hover {
  text-decoration-thickness: 2px;
 }

 .tb-announcement__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
 }

 /* A 30px target around a small ×, pulled in so it doesn't make the bar
    taller or sit far from the link. */
 .tb-announcement__close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: -6px -7px -6px -4px;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  transition:
   opacity 120ms ease,
   background-color 120ms ease;
 }

 .tb-announcement__close:hover {
  background: color-mix(in srgb, currentColor 14%, transparent);
  opacity: 1;
 }

 .tb-announcement__close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
  opacity: 1;
 }

 /* Phones: the × at the bar's right edge, with room kept for it on both
    sides so the words stay centered. */
 @media (max-width: 600px) {
  .tb-announcement {
   font-size: 14px;
  }

  .tb-announcement__inner {
   position: relative;
   padding-inline: 30px;
  }

  .tb-announcement__close {
   position: absolute;
   top: 50%;
   right: -8px;
   margin: 0;
   translate: 0 -50%;
  }
 }
</style>
