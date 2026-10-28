<script setup>
 // Plans side by side, one to four: each tier's name, its price and what
 // that's per, what it includes, and its button (none when the label is
 // empty). Every card in a row ends at the same place, so the buttons line
 // up however much each tier says. Narrower screens stack the cards.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const across = computed(() => Math.max(1, Math.min(4, props.data.tiers.length)));
</script>

<template>
 <section class="tb-section tb-pricing">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.tiers.length" class="tb-pricing__tiers" :class="`tb-pricing__tiers--${across}`" role="list">
    <li v-for="(tier, index) in data.tiers" :key="index" class="tb-card tb-pricing__tier">
     <TbText :data="data" :field="`tiers.${index}.name`" tag="h3" class="tb-pricing__name" />
     <p class="tb-pricing__price">
      <TbText :data="data" :field="`tiers.${index}.price`" class="tb-pricing__amount" />
      <TbText v-if="shows(`tiers.${index}.period`, tier.period)" :data="data" :field="`tiers.${index}.period`" class="tb-pricing__period" />
     </p>
     <TbRich v-if="shows(`tiers.${index}.features`, tier.features)" :data="data" :field="`tiers.${index}.features`" class="tb-pricing__features" />
     <div v-if="shows(`tiers.${index}.label`, tier.label)" class="tb-pricing__action">
      <TbButton :data="data" :field="`tiers.${index}`" />
     </div>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* Two tiers sit in a column a little wider than a reading line; three or
    four use the page's width. */
 .tb-pricing__tiers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 20px);
  max-width: 780px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
 }

 .tb-pricing__tiers--1 {
  grid-template-columns: minmax(0, 1fr);
  max-width: 400px;
 }

 .tb-pricing__tiers--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: none;
 }

 .tb-pricing__tiers--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: none;
 }

 /* Each card is a column, with its button pushed to the bottom. */
 .tb-pricing .tb-pricing__tier {
  display: flex;
  flex-direction: column;
  border-radius: calc(var(--site-radius) + 2px);
  padding: clamp(22px, 2.4vw, 26px);
  overflow-wrap: break-word;
 }

 .tb-pricing__name {
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 .tb-pricing__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 5px;
  margin: 10px 0 0;
 }

 .tb-pricing__amount {
  min-width: 0;
  font-family: var(--site-font-display);
  font-size: clamp(30px, 1vw + 24px, 36px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--site-heading);
 }

 .tb-pricing__period {
  font-size: 15px;
  color: var(--site-muted);
 }

 .tb-pricing__features {
  margin-top: 12px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-body);
 }

 /* A feature per line reads as a short list, so its lines stay close. */
 .tb-pricing .tb-pricing__features p {
  margin: 0;
 }

 .tb-pricing .tb-pricing__features p + p {
  margin-top: 0.35em;
 }

 .tb-pricing__action {
  margin-top: auto;
  padding-top: 20px;
 }

 /* Narrower screens: four tiers go two by two, then everything stacks in
    one column of cards. */
 @media (max-width: 960px) {
  .tb-pricing__tiers--4 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
   max-width: 780px;
  }
 }

 @media (max-width: 760px) {
  .tb-pricing__tiers--3 {
   grid-template-columns: minmax(0, 1fr);
   max-width: 440px;
  }
 }

 @media (max-width: 560px) {
  .tb-pricing__tiers--2,
  .tb-pricing__tiers--4 {
   grid-template-columns: minmax(0, 1fr);
   max-width: 440px;
  }
 }
</style>
