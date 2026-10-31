<script setup>
 // Quotes from customers, signed with who said them and who they are, and a
 // small photo when there is one. Several sit two to a row in cards, the odd
 // one out in the middle. One large is the first quote alone, set big.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const large = computed(() => props.data.layout === 'one');
 const quotes = computed(() => (large.value ? props.data.items.slice(0, 1) : props.data.items));
 const signed = (item, index) => shows(`items.${index}.name`, item.name) || shows(`items.${index}.role`, item.role);
</script>

<template>
 <section class="tb-section tb-quotes" :class="`tb-quotes--${data.layout}`">
  <div class="tb-wrap" :class="{ 'tb-wrap--narrow': large }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="quotes.length" class="tb-quotes__list" role="list">
    <li v-for="(item, index) in quotes" :key="index" class="tb-quotes__item">
     <figure class="tb-quotes__card">
      <blockquote class="tb-quotes__quote">
       <TbRich :data="data" :field="`items.${index}.quote`" />
      </blockquote>
      <figcaption v-if="signed(item, index)" class="tb-quotes__by">
       <TbImage v-if="safeSrc(item.image.src)" :image="item.image" ratio="1 / 1" sizes="40px" class="tb-quotes__photo" />
       <span class="tb-quotes__who">
        <TbText v-if="shows(`items.${index}.name`, item.name)" :data="data" :field="`items.${index}.name`" class="tb-quotes__name" />
        <TbText v-if="shows(`items.${index}.role`, item.role)" :data="data" :field="`items.${index}.role`" class="tb-quotes__role" />
       </span>
      </figcaption>
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-quotes__list {
  --tb-quotes-gap: clamp(14px, 1.8vw, 20px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tb-quotes-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-quotes__item {
  display: flex;
  min-width: 0;
 }

 /* A card left on its own in the last row sits in the middle, the same
    width as the others. */
 .tb-quotes--several .tb-quotes__item:last-child:nth-child(odd) {
  grid-column: 1 / -1;
  justify-self: center;
  width: calc((100% - var(--tb-quotes-gap)) / 2);
 }

 .tb-quotes__card {
  flex: 1;
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(20px, 2.4vw, 26px);
  background: var(--site-bg);
  overflow-wrap: break-word;
 }

 .tb-quotes__quote {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(18px, 0.5vw + 14.5px, 20.5px);
  font-weight: 600;
  line-height: 1.4;
  color: var(--site-heading);
 }

 /* Who said it, then (lighter) who they are. */
 .tb-quotes__by {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 1.4;
  color: var(--site-body);
 }

 .tb-quotes .tb-quotes__photo {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
 }

 .tb-quotes__who {
  display: flex;
  flex-wrap: wrap;
  gap: 0 7px;
  min-width: 0;
 }

 .tb-quotes__name {
  font-weight: 600;
 }

 .tb-quotes__role {
  color: var(--site-muted);
 }

 /* One large: no card, the quote itself is the block. */
 .tb-quotes--one .tb-quotes__list {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-quotes--one .tb-quotes__card {
  border: 0;
  padding: 0;
  background: none;
  text-align: center;
 }

 .tb-quotes--one .tb-quotes__quote {
  font-size: clamp(24px, 1.6vw + 16px, 34px);
  line-height: 1.3;
 }

 .tb-quotes--one .tb-quotes__by {
  justify-content: center;
  margin-top: 20px;
 }

 /* Phones: one card per row. */
 @media (max-width: 640px) {
  .tb-quotes__list {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-quotes--several .tb-quotes__item:last-child:nth-child(odd) {
   justify-self: stretch;
   width: auto;
  }
 }
</style>
