<script setup>
 // Deals as cards, three to a row with a short last row in the middle:
 // each with a warm edge along its top, a tag saying when it ends, the
 // deal, and a line about it. Two to a row on tablets, one on phones.
 defineProps({ data: { type: Object, required: true } });

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
</script>

<template>
 <section class="tb-section tb-specials">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-specials__list" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-card tb-specials__deal">
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-specials__ends" />
     <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-specials__title" />
     <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-specials__body" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* The deals' color: the site's eyebrow color, deepened toward its darkest
    shade, so the tag's small letters stay easy to read. */
 .tb-specials {
  --tb-specials-tone: color-mix(in srgb, var(--site-eyebrow) 60%, var(--site-dark));
 }

 .tb-specials__list {
  --tb-specials-across: 3;
  --tb-specials-gap: clamp(14px, 1.6vw, 18px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tb-specials-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* Each card takes its share of the row, less a hair, so rounding never
    pushes a full row's last card onto the next line. */
 .tb-specials .tb-specials__deal {
  flex: 0 0 calc((100% - (var(--tb-specials-across) - 1) * var(--tb-specials-gap)) / var(--tb-specials-across) - 0.1px);
  min-width: 0;
  border-top: 3px solid var(--tb-specials-tone);
  padding: clamp(18px, 2vw, 22px);
  overflow-wrap: break-word;
 }

 .tb-specials__ends {
  width: fit-content;
  max-width: 100%;
  margin: 0 0 12px;
  border-radius: 999px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--tb-specials-tone) 7%, var(--site-surface));
  font-family: var(--site-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--tb-specials-tone);
 }

 .tb-specials__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-specials__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-body);
 }

 @media (max-width: 820px) {
  .tb-specials__list {
   --tb-specials-across: 2;
  }
 }

 @media (max-width: 540px) {
  .tb-specials__list {
   --tb-specials-across: 1;
  }
 }
</style>
