<script setup>
 // The menu, like a board on the wall: on a band of the surface color, items
 // run down two columns, each with its price across from its name, a line
 // about it, and its section and dietary tags in small capitals under that.
 // Anything an item leaves empty isn't drawn. Phones take one column.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-menu">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-menu__list" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-menu__item">
     <div class="tb-menu__line">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-menu__name" />
      <TbText v-if="shows(`items.${index}.price`, item.price)" :data="data" :field="`items.${index}.price`" tag="p" class="tb-menu__price" />
     </div>
     <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-menu__description" />
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-menu__tags" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-section.tb-menu {
  background: var(--site-surface);
 }

 /* Two columns, kept close enough that a price is never far from its name. */
 .tb-menu__list {
  max-width: 920px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  columns: 2;
  column-gap: clamp(28px, 4vw, 44px);
 }

 .tb-menu__item {
  break-inside: avoid;
  border-bottom: 1px dashed color-mix(in srgb, var(--site-muted) 30%, var(--site-surface));
  padding: 13px 0;
  overflow-wrap: break-word;
 }

 .tb-menu__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
 }

 .tb-menu__name {
  min-width: 0;
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.4vw + 14.5px, 18px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 /* Semibold where the site loads that weight of its mono font, and never a
    faked bold where it doesn't. A price stays on one line unless it's long
    enough to crowd the name; then it wraps within half the row. */
 .tb-menu__price {
  flex: none;
  max-width: 50%;
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 15px;
  font-weight: 600;
  font-synthesis: none;
  text-align: right;
  color: var(--site-accent);
 }

 .tb-menu__description {
  margin-top: 3px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-body);
 }

 .tb-menu__tags {
  margin: 5px 0 0;
  font-family: var(--site-font-mono);
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--site-muted);
 }

 @media (max-width: 640px) {
  .tb-menu__list {
   columns: 1;
  }
 }
</style>
