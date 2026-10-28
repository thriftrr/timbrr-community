<script setup>
 // Gift cards: a picture of the card, tilted, beside a few words and a
 // button to the checkout. The card is drawn in the site's dark color with
 // the name the block gives it and a line of small print; it's a picture,
 // so screen readers skip it (except in the studio's canvas, where its
 // words are typed in place). Small screens put the card above the words.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

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
 <section class="tb-section tb-gift-cards">
  <div class="tb-wrap tb-gift-cards__inner">
   <div class="tb-gift-cards__visual">
    <div class="tb-gift-cards__card" :aria-hidden="typing ? undefined : 'true'">
     <TbText v-if="shows('card_name', data.card_name)" :data="data" field="card_name" class="tb-gift-cards__name" />
     <TbText v-if="shows('card_note', data.card_note)" :data="data" field="card_note" class="tb-gift-cards__note" />
    </div>
   </div>
   <div class="tb-gift-cards__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-gift-cards__body" />
    <div v-if="buttons.length" class="tb-buttons">
     <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-gift-cards__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: clamp(28px, 4vw, 48px);
  align-items: center;
 }

 /* The card keeps the design's proportions at any width: its corners,
    padding, shadow and type are measured against the column it sits in.
    The padding leaves room for the tilt. */
 .tb-gift-cards__visual {
  container-type: inline-size;
  padding: clamp(8px, 1.4vw, 16px);
 }

 .tb-gift-cards__card {
  display: flex;
  flex-direction: column;
  aspect-ratio: 1.6;
  border-radius: 4.2cqi;
  padding: 5.5cqi;
  background: linear-gradient(135deg, color-mix(in oklab, var(--site-dark) 55%, var(--site-eyebrow)), var(--site-dark));
  box-shadow: 0 4.2cqi 9cqi color-mix(in srgb, var(--site-dark) 25%, transparent);
  color: var(--site-dark-ink);
  overflow-wrap: anywhere;
  transform: rotate(-3deg);
 }

 .tb-gift-cards__name {
  font-family: var(--site-font-display);
  font-size: max(15px, 4.6cqi);
  font-weight: 800;
  line-height: 1.15;
 }

 /* The small print sits along the bottom, with or without a name above. */
 .tb-gift-cards__note {
  margin-top: auto;
  padding-top: 8px;
  font-family: var(--site-font-mono);
  font-size: max(10px, 3cqi);
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--site-dark-ink) 70%, transparent);
 }

 .tb-gift-cards__text {
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-gift-cards__body {
  margin-top: 14px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-gift-cards .tb-buttons {
  margin-top: 22px;
 }

 .tb-gift-cards__text > :first-child {
  margin-top: 0;
 }

 /* Small screens: the card first, at a size that fits a phone, then the
    words under it. */
 @media (max-width: 720px) {
  .tb-gift-cards__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-gift-cards__visual {
   width: 100%;
   max-width: 360px;
  }
 }
</style>
