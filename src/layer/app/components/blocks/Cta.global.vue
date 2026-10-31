<script setup>
 // The push to act: a tagline, a headline saying what to do next, a sentence
 // or two about it, one or two buttons and small print under them, all
 // centered. A band is the same words in one slim row, buttons to the right.
 // On the page's own background it draws on a deep shade of the brand color;
 // any other background is the block's look (site.css), and it just uses it.
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
 <section class="tb-section tb-cta" :class="[`tb-cta--${data.style}`, { 'tb-cta--deep': data.background === 'page' }]">
  <div class="tb-wrap tb-cta__inner">
   <div class="tb-cta__words">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow tb-cta__tagline" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading tb-cta__headline" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-cta__body" />
   </div>
   <div v-if="buttons.length" class="tb-buttons tb-cta__buttons">
    <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
   </div>
   <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-note tb-cta__note" />
  </div>
 </section>
</template>

<style>
 .tb-cta {
  padding-block: calc(var(--site-space) * 1.1);
  text-align: center;
 }

 .tb-cta__inner {
  overflow-wrap: break-word;
 }

 .tb-cta__words > :first-child {
  margin-top: 0;
 }

 .tb-cta .tb-cta__tagline {
  margin-bottom: 12px;
 }

 .tb-cta .tb-cta__headline {
  max-width: 19em;
  margin-inline: auto;
  font-size: clamp(28px, 2.2vw + 14px, 38px);
 }

 .tb-cta__body {
  max-width: 34em;
  margin: 16px auto 0;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-cta .tb-cta__buttons {
  justify-content: center;
  margin-top: 28px;
 }

 .tb-cta .tb-cta__note {
  margin-top: 16px;
 }

 /* On the page's background: the deep band, and its ink at three strengths:
    full for the headline and buttons, softer for the body, softest for the
    tagline and small print. Deep enough that even the softest reads clearly
    (4.5:1) on every accent the studio offers. */
 .tb-cta--deep {
  --tb-cta-band: color-mix(in srgb, var(--site-accent) 62%, #000);
  --tb-cta-soft: color-mix(in srgb, var(--site-accent-ink) 58%, var(--site-accent));
  background: var(--tb-cta-band);
  color: color-mix(in srgb, var(--site-accent-ink) 80%, var(--site-accent));
 }

 .tb-cta--deep .tb-cta__tagline,
 .tb-cta--deep .tb-cta__note {
  color: var(--tb-cta-soft);
 }

 .tb-cta--deep .tb-cta__headline {
  color: var(--site-accent-ink);
 }

 .tb-cta--deep .tb-cta__body {
  color: inherit;
 }

 .tb-cta--deep .tb-cta__body a,
 .tb-cta--deep .tb-cta__body :is(h2, h3) {
  color: var(--site-accent-ink);
 }

 .tb-cta--deep .tb-button--solid {
  border-color: var(--site-accent-ink);
  background: var(--site-accent-ink);
  color: var(--tb-cta-band);
 }

 .tb-cta--deep .tb-button--outline {
  border-color: color-mix(in srgb, var(--site-accent-ink) 45%, transparent);
  color: var(--site-accent-ink);
 }

 .tb-cta--deep .tb-button--outline:hover {
  background: color-mix(in srgb, var(--site-accent-ink) 10%, transparent);
 }

 .tb-cta--deep .tb-button:focus-visible {
  outline: 2px solid var(--site-accent-ink);
  outline-offset: 3px;
 }

 /* Band: one slim row, the words on the left and the buttons on the right,
    small print under the words' row. */
 .tb-section.tb-cta--band {
  padding-block: calc(var(--site-space) * 0.3);
  text-align: left;
 }

 .tb-cta--band .tb-cta__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px clamp(16px, 2.4vw, 28px);
 }

 .tb-cta--band .tb-cta__words {
  flex: 1 1 280px;
  min-width: 0;
 }

 .tb-cta--band .tb-cta__tagline {
  margin-bottom: 2px;
 }

 .tb-cta--band .tb-cta__headline {
  max-width: none;
  margin-inline: 0;
  font-size: clamp(18px, 0.6vw + 15px, 21px);
 }

 .tb-cta--band .tb-cta__body {
  max-width: none;
  margin: 2px 0 0;
  font-size: 15.5px;
  line-height: 1.45;
 }

 .tb-cta--band .tb-cta__body:first-child {
  margin-top: 0;
 }

 .tb-cta--band .tb-cta__buttons {
  flex: none;
  justify-content: flex-start;
  margin-top: 0;
 }

 .tb-cta--band .tb-cta__note {
  flex: 1 0 100%;
  margin-top: 0;
 }
</style>
