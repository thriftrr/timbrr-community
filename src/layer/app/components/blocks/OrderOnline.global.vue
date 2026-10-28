<script setup>
 // Ordering ahead, on a dark band: a headline and a line about it on the
 // left; on the right how long an order takes, in a pill, and the buttons
 // that go to wherever people order. On narrower screens the right side
 // drops under the words.
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
 <section class="tb-section tb-order-online">
  <div class="tb-wrap tb-order-online__inner">
   <div v-if="shows('headline', data.headline) || shows('body', data.body)" class="tb-order-online__text">
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading tb-order-online__headline" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-order-online__body" />
   </div>
   <div v-if="shows('eta', data.eta) || buttons.length" class="tb-order-online__actions">
    <TbText v-if="shows('eta', data.eta)" :data="data" field="eta" tag="p" class="tb-order-online__eta" />
    <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
   </div>
  </div>
 </section>
</template>

<style>
 .tb-order-online {
  padding-block: calc(var(--site-space) * 0.75);
  background: var(--site-dark);
  color: color-mix(in srgb, var(--site-dark-ink) 82%, var(--site-dark));
 }

 .tb-order-online__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px 32px;
 }

 .tb-order-online__text {
  flex: 1 1 320px;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-order-online__text > :first-child {
  margin-top: 0;
 }

 .tb-order-online .tb-order-online__headline {
  font-size: clamp(25px, 1.8vw + 14px, 32px);
  line-height: 1.15;
  color: var(--site-dark-ink);
 }

 .tb-order-online__body {
  margin-top: 10px;
  font-size: clamp(16px, 0.3vw + 14.5px, 17px);
  line-height: 1.55;
 }

 .tb-order-online .tb-order-online__body a,
 .tb-order-online .tb-order-online__body :is(h2, h3) {
  color: var(--site-dark-ink);
 }

 .tb-order-online__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  max-width: 100%;
 }

 .tb-order-online__eta {
  flex: none;
  max-width: 100%;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--site-dark-ink) 35%, transparent);
  border-radius: 999px;
  padding: 7px 13px;
  font-family: var(--site-font-mono);
  font-size: 12px;
  line-height: 1.3;
  color: var(--site-dark-ink);
 }

 .tb-order-online .tb-button {
  padding: 13px 22px;
 }

 .tb-order-online .tb-button--solid {
  border-color: var(--site-dark-ink);
  background: var(--site-dark-ink);
  color: var(--site-dark);
 }

 .tb-order-online .tb-button--outline {
  border-color: color-mix(in srgb, var(--site-dark-ink) 45%, transparent);
  color: var(--site-dark-ink);
 }

 .tb-order-online .tb-button--outline:hover {
  background: color-mix(in srgb, var(--site-dark-ink) 10%, transparent);
 }

 .tb-order-online .tb-button:focus-visible {
  outline: 2px solid var(--site-dark-ink);
  outline-offset: 3px;
 }
</style>
