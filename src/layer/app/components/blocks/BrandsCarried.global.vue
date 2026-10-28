<script setup>
 // The brands a business sells, as a centered row of outlined tiles under a
 // small label: a brand's logo when it has one, its name set like a
 // wordmark when it doesn't. Phones lay the tiles two by two.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // A logo stands in for the brand's name, so it's described by the name
 // when it has no description of its own.
 const logos = computed(() =>
  props.data.items.map((item) => (safeSrc(item.image.src) ? { src: item.image.src, alt: item.image.alt.trim() || item.title } : null)),
 );
</script>

<template>
 <section class="tb-section tb-brands-carried">
  <div class="tb-wrap">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="h2" class="tb-eyebrow tb-brands-carried__tagline" />
   <ul v-if="data.items.length" class="tb-brands-carried__list" role="list">
    <li
     v-for="(item, index) in data.items"
     :key="index"
     class="tb-brands-carried__brand"
     :class="{ 'tb-brands-carried__brand--logo': logos[index] }"
    >
     <TbImage v-if="logos[index]" :image="logos[index]" ratio="auto" class="tb-brands-carried__logo" />
     <TbText v-else :data="data" :field="`items.${index}.title`" class="tb-brands-carried__name" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* A row of names sits a little tighter in the page than a full section. */
 .tb-section.tb-brands-carried {
  padding-block: calc(var(--site-space) * 0.75);
  text-align: center;
 }

 /* The label is the block's heading, drawn as the small tagline. */
 .tb-brands-carried .tb-brands-carried__tagline {
  margin: 0 0 clamp(16px, 1.6vw, 20px);
  font-weight: 400;
 }

 .tb-brands-carried__list {
  --tb-brands-carried-gap: clamp(10px, 1.2vw, 14px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tb-brands-carried-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* Tiles in a row share its height; a name or a logo sits in the middle. */
 .tb-brands-carried__brand {
  --tb-brands-carried-pad: clamp(11px, 1.1vw, 14px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(110px, 8vw + 30px, 132px);
  max-width: 100%;
  border: 1px solid var(--site-border);
  border-radius: calc(var(--site-radius) * 0.7);
  padding: var(--tb-brands-carried-pad) clamp(18px, 1.9vw, 24px);
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.35vw + 13.5px, 18px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--site-body);
  overflow-wrap: anywhere;
 }

 /* A logo is a little taller than a name; its tile gives up the padding
    to stay the same height. */
 .tb-brands-carried__brand--logo {
  padding-block: calc(var(--tb-brands-carried-pad) - 5px);
 }

 .tb-brands-carried .tb-brands-carried__logo {
  width: auto;
  max-width: 8em;
  height: calc(1.2em + 10px);
  border-radius: 0;
  object-fit: contain;
 }

 /* Phones: two even columns, and an odd last tile centered under them. */
 @media (max-width: 480px) {
  .tb-brands-carried__list {
   display: grid;
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tb-brands-carried__brand {
   min-width: 0;
  }

  .tb-brands-carried__brand:last-child:nth-child(odd) {
   grid-column: 1 / -1;
   justify-self: center;
   width: calc(50% - var(--tb-brands-carried-gap) / 2);
  }
 }
</style>
