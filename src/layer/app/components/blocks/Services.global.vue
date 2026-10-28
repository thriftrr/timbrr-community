<script setup>
 // What the business does, as cards two across: each service's name and a
 // line about it, with what it starts at in a small tag on the right. A
 // service with no price shows none. Phones take one card per row.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-services">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-services__list" :class="{ 'tb-services__list--one': data.items.length === 1 }" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-card tb-services__item">
     <div class="tb-services__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-services__title" />
      <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-services__body" />
     </div>
     <TbText v-if="shows(`items.${index}.price`, item.price)" :data="data" :field="`items.${index}.price`" tag="p" class="tb-services__price" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-services__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 1.6vw, 16px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* One service on its own stays card-sized rather than spanning half the
    page off to one side. */
 .tb-services__list--one {
  grid-template-columns: minmax(0, 1fr);
  max-width: 560px;
  margin-inline: auto;
 }

 /* The words on the left, the price on the right. When a price is too long
    to leave the words room, it drops under them instead. */
 .tb-services .tb-services__item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 16px;
  padding: clamp(18px, 2vw, 22px);
 }

 .tb-services__text {
  flex: 1 1 10em;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-services__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-services__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-body);
 }

 /* Semibold where the site loads that weight of its mono font, and never a
    faked bold where it doesn't. */
 .tb-services__price {
  flex: none;
  max-width: 100%;
  margin: 0;
  border-radius: 7px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
  font-family: var(--site-font-mono);
  font-size: 14px;
  font-weight: 600;
  font-synthesis: none;
  line-height: 1.3;
  color: var(--site-accent);
  overflow-wrap: break-word;
 }

 @media (max-width: 700px) {
  .tb-services__list {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
