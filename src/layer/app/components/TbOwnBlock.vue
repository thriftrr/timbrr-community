<script setup>
 // A site's own block (the studio's docs/own-blocks.md): one interpreter for
 // every block an owner builds. It reads the block's definition from its
 // scope (def.own, made by ownBlockDef in schema/own-block.js) and walks its
 // layout: four kinds of box (stack, row, grid, split, TbOwnNode) holding atoms
 // (TbOwnAtom). No code is generated and nothing a definition says becomes
 // markup or a style value: every style key is a class over --site-* tokens.
 //
 // Heading levels are worked out, never picked: the block's first heading
 // outside a list is the block's own (useHeadingTag: h2, or the page's h1 if
 // it's the one that draws it), every later one an h3. Phones stack on their
 // own (the CSS below). On the canvas, what the content is missing (a picture
 // with no alt text, a vague link) is listed under the block; the live site
 // leaves such a picture out rather than draw it with no words.
 import { ownBlockData, ownBlockWarnings } from '../../schema/own-block.js';

 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const scope = useBlockScope();
 const doc = computed(() => scope?.def?.own ?? null);
 const headTag = useHeadingTag();

 // Every field by the key an atom names it by: 'title', or 'cards.title' in a list.
 const fields = computed(() => {
  const map = new Map();
  for (const field of doc.value?.fields ?? []) {
   map.set(field.key, field);
   if (field.kind === 'items') for (const sub of field.fields ?? []) map.set(`${field.key}.${sub.key}`, sub);
  }
  return map;
 });
 // The first heading atom outside a list's grid, in reading order.
 function firstHeading(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.atom) return node.atom === 'heading' ? node : null;
  if (node.kind === 'grid' && node.field) return null;
  const children = node.kind === 'split' ? [...(node.slots?.media ?? []), ...(node.slots?.text ?? [])] : (node.items ?? []);
  for (const child of children) {
   const found = firstHeading(child);
   if (found) return found;
  }
  return null;
 }
 const first = computed(() => firstHeading(doc.value?.layout));
 const warnings = computed(() => (canvas && doc.value ? ownBlockWarnings(doc.value, data.value) : []));

 // Parts owners can't change (fixed) always draw their starting value.
 const data = computed(() => (doc.value ? ownBlockData(doc.value, props.data) : props.data));
 provide(OWN_BLOCK_KEY, { data, fields, first, headTag });
</script>

<template>
 <section class="tb-section tb-own" :data-own-type="doc?.type">
  <div v-if="doc" class="tb-wrap" :class="{ 'tb-wrap--narrow': doc.layout.kind === 'stack' && doc.layout.width === 'narrow', 'tb-wrap--wide': doc.layout.width === 'wide' }">
   <TbOwnNode :node="doc.layout" />
   <ul v-if="warnings.length" class="tb-own__warnings" aria-label="What this block is missing">
    <li v-for="warning in warnings" :key="warning.field">{{ warning.message }}</li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* ── An own block: four layouts and the token scales, nothing else ── */
 .tb-own {
  --tb-own-gap-s: calc(10px * var(--site-space-scale));
  --tb-own-gap-m: calc(20px * var(--site-space-scale));
  --tb-own-gap-l: calc(36px * var(--site-space-scale));
  overflow-wrap: break-word;
 }
 .tb-own :is(p, h2, h3, ul, figure) {
  margin: 0;
 }
 .tb-own__stack {
  display: flex;
  flex-direction: column;
  gap: var(--tb-own-gap, var(--tb-own-gap-m));
 }
 .tb-own__stack--center {
  align-items: center;
  text-align: center;
 }
 .tb-own__row {
  display: flex;
  gap: var(--tb-own-gap, var(--tb-own-gap-m));
  align-items: flex-start;
 }
 .tb-own__row > * {
  flex: 1 1 0;
  min-width: 0;
 }
 .tb-own__row--wrap {
  flex-wrap: wrap;
 }
 .tb-own__row--center {
  align-items: center;
 }
 .tb-own__row--end {
  align-items: flex-end;
 }
 .tb-own__grid {
  display: grid;
  grid-template-columns: repeat(var(--tb-own-columns, 3), minmax(0, 1fr));
  gap: var(--tb-own-gap, var(--tb-own-gap-l));
 }
 .tb-own__item {
  display: flex;
  flex-direction: column;
  gap: var(--tb-own-item-gap, var(--tb-own-gap-s));
  min-width: 0;
 }
 .tb-own__item--row {
  flex-direction: row;
  align-items: center;
 }
 .tb-own__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--tb-own-gap-l);
  align-items: start;
 }
 .tb-own__split--40-60 {
  grid-template-columns: 2fr 3fr;
 }
 .tb-own__split--60-40 {
  grid-template-columns: 3fr 2fr;
 }
 .tb-own__split--right .tb-own__side--media {
  order: 2;
 }
 .tb-own__split--center {
  align-items: center;
 }
 .tb-own__split--end {
  align-items: end;
 }
 .tb-own__side {
  display: flex;
  flex-direction: column;
  gap: var(--tb-own-gap-m);
  min-width: 0;
 }
 .tb-own--gap-s {
  --tb-own-gap: var(--tb-own-gap-s);
 }
 .tb-own--gap-m {
  --tb-own-gap: var(--tb-own-gap-m);
 }
 .tb-own--gap-l {
  --tb-own-gap: var(--tb-own-gap-l);
 }

 .tb-own__stack--end {
  align-items: flex-end;
  text-align: end;
 }

 /* A box's own look (ownBoxLook in schema/own-block.js): numbers arrive as
    custom properties in whole pixels; every other choice is a token. */
 .tb-own--pad {
  padding: var(--tb-own-pad);
 }
 .tb-own--fill {
  border-radius: var(--tb-own-radius, 0);
 }
 .tb-own--fill-page {
  background: var(--site-bg);
 }
 .tb-own--radius {
  border-radius: var(--tb-own-radius);
  overflow: hidden;
 }
 .tb-own--corners-site:not(.tb-own__picture) {
  border-radius: var(--site-radius);
  overflow: hidden;
 }
 .tb-own--corners-round:not(.tb-own__picture) {
  overflow: hidden;
 }
 .tb-own--hug {
  align-self: flex-start;
  width: fit-content;
  max-width: 100%;
 }
 .tb-own__row > .tb-own--hug {
  flex: 0 0 auto;
 }
 .tb-own__stack--center > .tb-own--hug {
  align-self: center;
 }
 .tb-own--justify-start {
  justify-content: flex-start;
 }
 .tb-own--justify-center {
  justify-content: center;
 }
 .tb-own--justify-end {
  justify-content: flex-end;
 }
 .tb-own--justify-between {
  justify-content: space-between;
 }

 /* A quote: the words, set off. */
 .tb-own__quote {
  margin: 0;
  padding-left: 18px;
  border-left: 3px solid var(--site-accent);
  font-family: var(--site-font-display);
  font-size: calc(22px * var(--site-heading-scale));
  line-height: 1.4;
  color: var(--site-heading);
 }
 .tb-own__quote.tb-own--size-s {
  font-size: 17px;
 }
 .tb-own__quote.tb-own--size-l {
  font-size: calc(clamp(24px, 3vw, 32px) * var(--site-heading-scale));
 }
 .tb-own__quote p {
  margin: 0;
  white-space: pre-line;
 }

 /* Overlay: the picture fills the block and the words sit over it, on a scrim. */
 .tb-own__split--behind {
  grid-template-columns: minmax(0, 1fr);
  position: relative;
  overflow: hidden;
  border-radius: var(--tb-own-radius, var(--site-radius));
 }
 .tb-own__split--behind > .tb-own__side {
  grid-area: 1 / 1;
 }
 .tb-own__split--behind > .tb-own__side--media :is(figure, img, picture) {
  height: 100%;
  border-radius: 0;
 }
 .tb-own__split--behind > .tb-own__side--media img {
  object-fit: cover;
 }
 .tb-own__split--behind > .tb-own__side--text {
  position: relative;
  z-index: 1;
  align-self: end;
  padding: var(--tb-own-gap-l);
  background: linear-gradient(to top, color-mix(in srgb, var(--site-dark) 85%, transparent), transparent);
 }

 /* A list that slides: as many across as its columns, the rest a swipe away. */
 .tb-own__grid--carousel {
  grid-auto-flow: column;
  grid-template-columns: none;
  grid-auto-columns: calc((100% - (var(--tb-own-columns, 3) - 1) * var(--tb-own-gap, var(--tb-own-gap-l))) / var(--tb-own-columns, 3));
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  padding-bottom: 8px;
 }
 .tb-own__grid--carousel > .tb-own__item {
  scroll-snap-align: start;
 }
 .tb-own__grid--carousel:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 4px;
 }

 /* Phones: rows and splits stack in order, grids go to one column (or two when the block says). */
 @media (max-width: 720px) {
  .tb-own__row:not(.tb-own__item) {
   flex-direction: column;
   align-items: stretch;
  }
  .tb-own__split,
  .tb-own__grid {
   grid-template-columns: minmax(0, 1fr);
  }
  .tb-own__grid--phone-2 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tb-own__split--right .tb-own__side--media {
   order: 0;
  }
  .tb-own__split--text-first .tb-own__side--media {
   order: 2;
  }
  .tb-own__past-phone {
   display: none;
  }
  .tb-own__grid--carousel {
   grid-template-columns: none;
   grid-auto-columns: 82%;
  }
  .tb-own__split--behind {
   grid-template-columns: minmax(0, 1fr);
  }
  /* What a box or an atom sets differently on Mobile (ownBoxLook, ownAtomLook). */
  .tb-own--m-gap {
   gap: var(--tb-own-m-gap);
  }
  .tb-own--m-pad {
   padding: var(--tb-own-m-pad);
  }
  .tb-own__row.tb-own--m-row {
   flex-direction: row;
  }
  .tb-own__stack.tb-own--m-align-start,
  .tb-own__row.tb-own--m-align-start {
   align-items: flex-start;
  }
  .tb-own__stack.tb-own--m-align-center,
  .tb-own__row.tb-own--m-align-center {
   align-items: center;
  }
  .tb-own__stack.tb-own--m-align-end,
  .tb-own__row.tb-own--m-align-end {
   align-items: flex-end;
  }
  .tb-own--m-align-start {
   text-align: start;
  }
  .tb-own--m-align-center {
   text-align: center;
  }
  .tb-own--m-align-end {
   text-align: end;
  }
  .tb-own--m-justify-start {
   justify-content: flex-start;
  }
  .tb-own--m-justify-center {
   justify-content: center;
  }
  .tb-own--m-justify-end {
   justify-content: flex-end;
  }
  .tb-own--m-justify-between {
   justify-content: space-between;
  }
  .tb-own--m-hidden {
   display: none !important;
  }
  .tb-own__heading.tb-own--m-size-s {
   font-size: calc(20px * var(--site-heading-scale));
  }
  .tb-own__heading.tb-own--m-size-m {
   font-size: calc(22px * var(--site-heading-scale));
  }
  .tb-own__heading.tb-own--m-size-l {
   font-size: calc(26px * var(--site-heading-scale));
  }
  .tb-own__heading.tb-own--m-size-xl {
   font-size: calc(34px * var(--site-heading-scale));
  }
  .tb-own__number.tb-own--m-size-s {
   font-size: calc(18px * var(--site-heading-scale));
  }
  .tb-own__number.tb-own--m-size-m {
   font-size: calc(24px * var(--site-heading-scale));
  }
  .tb-own__number.tb-own--m-size-l {
   font-size: calc(26px * var(--site-heading-scale));
  }
  .tb-own__number.tb-own--m-size-xl {
   font-size: calc(40px * var(--site-heading-scale));
  }
  .tb-own__quote.tb-own--m-size-s {
   font-size: 17px;
  }
  .tb-own__quote.tb-own--m-size-m {
   font-size: 20px;
  }
  .tb-own__quote.tb-own--m-size-l {
   font-size: 24px;
  }
  :is(.tb-own__text, .tb-own__rich, .tb-own__when).tb-own--m-size-s {
   font-size: 0.875em;
  }
  :is(.tb-own__text, .tb-own__rich, .tb-own__when).tb-own--m-size-m {
   font-size: 1em;
  }
  .tb-own__icon.tb-own--m-size-s {
   width: 18px;
   height: 18px;
  }
  .tb-own__icon.tb-own--m-size-m {
   width: 24px;
   height: 24px;
  }
  .tb-own__icon.tb-own--m-size-l {
   width: 36px;
   height: 36px;
  }
 }

 /* ── Atoms ── */
 .tb-own__heading {
  font-size: calc(clamp(26px, 3.2vw, 34px) * var(--site-heading-scale));
 }
 .tb-own__heading.tb-own--size-s {
  font-size: calc(20px * var(--site-heading-scale));
 }
 .tb-own__heading.tb-own--size-m {
  font-size: calc(clamp(22px, 2.4vw, 27px) * var(--site-heading-scale));
 }
 .tb-own__heading.tb-own--size-xl {
  font-size: calc(clamp(34px, 5vw, 54px) * var(--site-heading-scale));
 }
 .tb-own__text {
  display: block;
  color: var(--site-body);
  line-height: 1.6;
  white-space: pre-line;
 }
 .tb-own__rich {
  color: var(--site-body);
  line-height: 1.6;
 }
 .tb-own--size-s:is(.tb-own__text, .tb-own__rich, .tb-own__when) {
  font-size: 0.875em;
 }
 .tb-own__number {
  font-family: var(--site-font-display);
  font-weight: var(--site-heading-weight);
  line-height: 1.1;
  color: var(--site-heading);
  font-size: calc(clamp(26px, 3.2vw, 34px) * var(--site-heading-scale));
 }
 .tb-own__number.tb-own--size-s {
  font-size: calc(18px * var(--site-heading-scale));
 }
 .tb-own__number.tb-own--size-m {
  font-size: calc(24px * var(--site-heading-scale));
 }
 .tb-own__number.tb-own--size-xl {
  font-size: calc(clamp(40px, 6vw, 64px) * var(--site-heading-scale));
 }
 .tb-own__when {
  color: var(--site-body);
 }
 .tb-own__link {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
 }
 .tb-own__icon {
  width: 24px;
  height: 24px;
  color: var(--site-accent);
 }
 .tb-own__icon.tb-own--size-s {
  width: 18px;
  height: 18px;
 }
 .tb-own__icon.tb-own--size-l {
  width: 36px;
  height: 36px;
 }
 .tb-own__picture {
  overflow: hidden;
  border-radius: var(--site-radius);
 }
 .tb-own__divider {
  width: 100%;
  border: 0;
  border-top: 1px solid var(--site-border);
 }
 .tb-own__space {
  height: var(--tb-own-gap-m);
 }
 .tb-own__space.tb-own--size-s {
  height: var(--tb-own-gap-s);
 }
 .tb-own__space.tb-own--size-l {
  height: var(--tb-own-gap-l);
 }
 .tb-own__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  list-style: none;
 }
 .tb-own__tags li {
  padding: 2px 10px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  font-size: 13px;
  color: var(--site-body);
 }
 .tb-own__hours {
  border-collapse: collapse;
  color: var(--site-body);
 }
 .tb-own__hours :is(th, td) {
  padding: 4px 16px 4px 0;
  border-bottom: 1px solid var(--site-border);
  text-align: left;
  font-weight: 400;
 }
 .tb-own .tb-buttons {
  margin-top: 0;
 }
 .tb-own .tb-eyebrow {
  margin: 0;
 }

 /* Style keys: each a choice from a Branding scale. */
 .tb-own--color-heading {
  color: var(--site-heading);
 }
 .tb-own--color-ink {
  color: var(--site-ink);
 }
 .tb-own--color-body {
  color: var(--site-body);
 }
 .tb-own--color-muted {
  color: var(--site-muted);
 }
 .tb-own--color-eyebrow {
  color: var(--site-eyebrow);
 }
 .tb-own--color-accent {
  color: var(--site-accent);
 }
 .tb-own--font-display {
  font-family: var(--site-font-display);
 }
 .tb-own--font-body {
  font-family: var(--site-font-body);
 }
 .tb-own--font-mono {
  font-family: var(--site-font-mono);
 }
 .tb-own--weight-regular {
  font-weight: 400;
 }
 .tb-own--weight-strong {
  font-weight: 600;
 }
 .tb-own--align-start {
  text-align: start;
  justify-content: flex-start;
 }
 .tb-own--align-center {
  text-align: center;
  justify-content: center;
 }
 .tb-own--align-end {
  text-align: end;
  justify-content: flex-end;
 }
 .tb-own--corners-none {
  border-radius: 0;
 }
 .tb-own--corners-round {
  border-radius: var(--site-control-radius);
 }
 .tb-own--shadow-soft {
  box-shadow: var(--site-shadow);
 }
 .tb-own--shadow-strong {
  box-shadow: 0 14px 36px color-mix(in srgb, var(--site-heading) 22%, transparent);
 }

 /* The canvas only: what the content is missing. */
 .tb-own__warnings {
  margin: 16px 0 0;
  padding: 8px 12px;
  border-left: 3px solid #b45309;
  background: #fffbeb;
  color: #78350f;
  font: 13px/1.5 system-ui, sans-serif;
  list-style: none;
 }
</style>
