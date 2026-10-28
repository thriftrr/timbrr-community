<script setup>
 // The latest posts, three across: each a photo, its date in small
 // capitals, a title and a few lines from it. A post with a link has its
 // title link there, and on the site the whole card follows it; in the
 // studio's canvas the words stay clickable for typing instead. Narrower
 // screens go two across, then one.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
</script>

<template>
 <section class="tb-section tb-news">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-news__list" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-news__post" :class="{ 'tb-news__post--stretched': hrefs[index] && !typing }">
     <TbImage :image="item.image" ratio="3 / 2" class="tb-news__image" />
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-eyebrow tb-news__date" />
     <h3 v-if="hrefs[index]" class="tb-news__title">
      <a :href="hrefs[index]" class="tb-news__link">
       <TbText :data="data" :field="`items.${index}.title`" />
      </a>
     </h3>
     <TbText v-else :data="data" :field="`items.${index}.title`" tag="h3" class="tb-news__title" />
     <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-news__excerpt" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-news .tb-section__head {
  margin-bottom: clamp(20px, 2.4vw, 26px);
 }

 .tb-news__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(28px, 3.4vw, 36px) clamp(16px, 2vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-news__post {
  min-width: 0;
  overflow-wrap: break-word;
 }

 /* Until a post has its photo, its tile is a warm panel, each a little
    different, so a row of them reads as three posts rather than one block
    of color. */
 .tb-news .tb-news__image.tb-image--empty {
  background: linear-gradient(135deg, var(--site-eyebrow), var(--site-dark));
 }

 .tb-news__post:nth-child(3n + 2) .tb-news__image.tb-image--empty {
  background: linear-gradient(158deg, color-mix(in srgb, var(--site-eyebrow) 62%, var(--site-surface)), var(--site-dark));
 }

 .tb-news__post:nth-child(3n) .tb-news__image.tb-image--empty {
  background: linear-gradient(181deg, color-mix(in srgb, var(--site-eyebrow) 65%, var(--site-dark)), var(--site-dark));
 }

 .tb-news .tb-news__date {
  margin: 14px 0 0;
 }

 .tb-news__title {
  margin: 6px 0 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-news__image + .tb-news__title {
  margin-top: 14px;
 }

 .tb-news__excerpt {
  margin-top: 7px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-body);
 }

 /* A linked title: underlined under the pointer, in the brand color. */
 .tb-news__link {
  color: inherit;
  text-decoration: none;
 }

 .tb-news__link:hover,
 .tb-news__post--stretched:hover .tb-news__link {
  text-decoration: underline;
  text-decoration-color: var(--site-accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
 }

 .tb-news__link:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 /* On the site the whole card follows the link. */
 .tb-news__post--stretched {
  position: relative;
 }

 .tb-news__post--stretched .tb-news__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--site-radius);
 }

 .tb-news__post--stretched .tb-news__link:focus-visible {
  outline: 0;
 }

 .tb-news__post--stretched .tb-news__link:focus-visible::after {
  outline: 2px solid var(--site-accent);
  outline-offset: 6px;
 }

 /* Narrower screens: two across, then one. */
 @media (max-width: 700px) {
  .tb-news__list {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 480px) {
  .tb-news__list {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
