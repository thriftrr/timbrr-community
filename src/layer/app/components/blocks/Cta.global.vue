<script setup>
 // The push to act, on a band in a deep shade of the brand color: a
 // tagline, a headline saying what to do next, a sentence or two about it,
 // one or two buttons and small print under them, all centered.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();

 // Words to show: a string with something in it, or a rich-text document
 // with some text.
 function hasWords(node) {
  if (typeof node === 'string') return node.trim() !== '';
  if (node?.type === 'text') return Boolean(node.text?.trim());
  return Array.isArray(node?.content) && node.content.some(hasWords);
 }

 // An empty field isn't drawn, except on the studio's canvas while it's
 // being typed into, so clearing it to start over doesn't lose the caret.
 function shows(field, value) {
  if (hasWords(value)) return true;
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }

 // The buttons with a label, by place. One without says nothing, so it
 // isn't drawn.
 const buttons = computed(() =>
  props.data.buttons.flatMap((button, index) => (shows(`buttons.${index}.label`, button.label) ? [index] : [])),
 );
</script>

<template>
 <section class="tb-section tb-cta">
  <div class="tb-wrap tb-cta__inner">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow tb-cta__tagline" />
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading tb-cta__headline" />
   <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-cta__body" />
   <div v-if="buttons.length" class="tb-buttons tb-cta__buttons">
    <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
   </div>
   <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-note tb-cta__note" />
  </div>
 </section>
</template>

<style>
 /* The band, and its ink at three strengths: full for the headline and
    buttons, softer for the body, softest for the tagline and small print.
    Deep enough that even the softest reads clearly (4.5:1) on every accent
    the studio offers. */
 .tb-cta {
  --tb-cta-band: color-mix(in srgb, var(--site-accent) 62%, #000);
  --tb-cta-soft: color-mix(in srgb, var(--site-accent-ink) 58%, var(--site-accent));
  padding-block: calc(var(--site-space) * 1.1);
  background: var(--tb-cta-band);
  color: color-mix(in srgb, var(--site-accent-ink) 80%, var(--site-accent));
  text-align: center;
 }

 .tb-cta__inner {
  overflow-wrap: break-word;
 }

 .tb-cta .tb-cta__inner > :first-child {
  margin-top: 0;
 }

 .tb-cta .tb-cta__tagline {
  margin-bottom: 12px;
  color: var(--tb-cta-soft);
 }

 .tb-cta .tb-cta__headline {
  max-width: 19em;
  margin-inline: auto;
  font-size: clamp(28px, 2.2vw + 14px, 38px);
  color: var(--site-accent-ink);
 }

 .tb-cta__body {
  max-width: 34em;
  margin: 16px auto 0;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.6;
 }

 .tb-cta .tb-cta__body a,
 .tb-cta .tb-cta__body :is(h2, h3) {
  color: var(--site-accent-ink);
 }

 .tb-cta .tb-cta__buttons {
  justify-content: center;
  margin-top: 28px;
 }

 .tb-cta .tb-button--solid {
  border-color: var(--site-accent-ink);
  background: var(--site-accent-ink);
  color: var(--tb-cta-band);
 }

 .tb-cta .tb-button--outline {
  border-color: color-mix(in srgb, var(--site-accent-ink) 45%, transparent);
  color: var(--site-accent-ink);
 }

 .tb-cta .tb-button--outline:hover {
  background: color-mix(in srgb, var(--site-accent-ink) 10%, transparent);
 }

 .tb-cta .tb-button:focus-visible {
  outline: 2px solid var(--site-accent-ink);
  outline-offset: 3px;
 }

 .tb-cta .tb-cta__note {
  margin-top: 16px;
  color: var(--tb-cta-soft);
 }
</style>
