<script setup>
 // Quotes from customers on a soft band, two to a row: each in a card,
 // signed with who said it and who they are. A quote on its own, or the
 // odd one out at the end, sits in the middle.
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
  const active = canvas?.active?.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }
</script>

<template>
 <section class="tb-section tb-testimonials">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-testimonials__grid" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-testimonials__item">
     <figure class="tb-testimonials__card">
      <blockquote class="tb-testimonials__quote">
       <TbRich :data="data" :field="`items.${index}.quote`" />
      </blockquote>
      <figcaption v-if="shows(`items.${index}.name`, item.name) || shows(`items.${index}.role`, item.role)" class="tb-testimonials__by">
       <TbText v-if="shows(`items.${index}.name`, item.name)" :data="data" :field="`items.${index}.name`" class="tb-testimonials__name" />
       <span v-if="hasWords(item.name) && hasWords(item.role)" class="tb-testimonials__dot" aria-hidden="true">·</span>
       <TbText v-if="shows(`items.${index}.role`, item.role)" :data="data" :field="`items.${index}.role`" class="tb-testimonials__role" />
      </figcaption>
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-testimonials {
  background: var(--site-surface);
 }

 .tb-testimonials__grid {
  --tb-testimonials-gap: clamp(14px, 1.8vw, 20px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tb-testimonials-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-testimonials__item {
  display: flex;
  min-width: 0;
 }

 /* A card left on its own in the last row sits in the middle, the same
    width as the others. */
 .tb-testimonials__item:last-child:nth-child(odd) {
  grid-column: 1 / -1;
  justify-self: center;
  width: calc((100% - var(--tb-testimonials-gap)) / 2);
 }

 .tb-testimonials__card {
  flex: 1;
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(20px, 2.4vw, 26px);
  background: var(--site-bg);
  overflow-wrap: break-word;
 }

 .tb-testimonials__quote {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(18px, 0.5vw + 14.5px, 20.5px);
  font-weight: 600;
  line-height: 1.4;
  color: var(--site-heading);
 }

 /* Who said it, then (lighter) who they are. */
 .tb-testimonials__by {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 7px;
  margin-top: 14px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--site-body);
 }

 .tb-testimonials__dot {
  color: color-mix(in srgb, var(--site-muted) 60%, var(--site-bg));
 }

 .tb-testimonials__role {
  font-weight: 400;
  color: var(--site-muted);
 }

 /* Phones: one card per row. */
 @media (max-width: 640px) {
  .tb-testimonials__grid {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-testimonials__item:last-child:nth-child(odd) {
   justify-self: stretch;
   width: auto;
  }
 }
</style>
