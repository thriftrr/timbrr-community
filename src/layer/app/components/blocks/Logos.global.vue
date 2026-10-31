<script setup>
 // Names and logos under a small label: a centered row of outlined tiles, or
 // a wall of even cells. Rows with a tier sit together under it. A logo
 // that's a link is one.
 //
 // Scrolling is two copies of the strip, moving together by one strip's
 // width, so it loops without a seam. The second copy is for the eye alone.
 // It's CSS, paused under the pointer and off for anyone who asked for less
 // motion, and off on the canvas, where the names are typed in place.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);
 const moving = computed(() => props.data.scrolling && !typing.value);

 // A logo stands in for the name, so it's described by the name when it has
 // no description of its own.
 const logos = computed(() =>
  props.data.items.map((item) => (safeSrc(item.image.src) ? { ...item.image, alt: item.image.alt.trim() || item.title } : null)),
 );
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
 const groups = computed(() => (moving.value ? [] : groupRows(props.data.items, 'tier')));
 const hasHead = computed(() => shows('tagline', props.data.tagline) || shows('headline', props.data.headline));
</script>

<template>
 <section class="tb-section tb-logos" :class="[`tb-logos--${data.layout}`, { 'tb-logos--moving': moving }]">
  <div class="tb-wrap">
   <header v-if="hasHead" class="tb-logos__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="moving && data.items.length" class="tb-logos__strip">
    <ul v-for="copy in 2" :key="copy" class="tb-logos__list" role="list" :aria-hidden="copy === 2 ? 'true' : undefined">
     <li v-for="(item, index) in data.items" :key="index" class="tb-logos__logo" :class="{ 'tb-logos__logo--image': logos[index] }">
      <component :is="hrefs[index] ? 'a' : 'span'" :href="hrefs[index]" :tabindex="copy === 2 && hrefs[index] ? -1 : undefined" class="tb-logos__mark">
       <TbImage v-if="logos[index]" :image="logos[index]" ratio="auto" class="tb-logos__image" />
       <span v-else>{{ item.title }}</span>
      </component>
     </li>
    </ul>
   </div>
   <template v-else>
    <div v-for="group in groups" :key="group.name" class="tb-logos__group">
     <h3 v-if="group.name" class="tb-logos__tier">{{ group.name }}</h3>
     <ul class="tb-logos__list" role="list">
      <li v-for="{ row, index } in group.rows" :key="index" class="tb-logos__logo" :class="{ 'tb-logos__logo--image': logos[index] }">
       <component :is="hrefs[index] ? 'a' : 'span'" :href="hrefs[index]" class="tb-logos__mark">
        <TbImage v-if="logos[index]" :image="logos[index]" ratio="auto" class="tb-logos__image" />
        <TbText v-else :data="data" :field="`items.${index}.title`" />
       </component>
      </li>
     </ul>
    </div>
   </template>
  </div>
 </section>
</template>

<style>
 /* A row of names sits a little tighter in the page than a full section. */
 .tb-section.tb-logos {
  padding-block: calc(var(--site-space) * 0.75);
  text-align: center;
 }

 .tb-logos__head {
  max-width: 620px;
  margin: 0 auto clamp(16px, 1.6vw, 20px);
 }

 .tb-logos__head .tb-eyebrow:last-child {
  margin-bottom: 0;
 }

 .tb-logos__group + .tb-logos__group {
  margin-top: clamp(20px, 2.4vw, 28px);
 }

 .tb-logos__tier {
  margin: 0 0 12px;
  font-family: var(--site-font-mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--site-muted);
 }

 .tb-logos__list {
  --tb-logos-gap: clamp(10px, 1.2vw, 14px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tb-logos-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* Tiles in a row share its height; a name or a logo sits in the middle. */
 .tb-logos__logo {
  --tb-logos-pad: clamp(11px, 1.1vw, 14px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(110px, 8vw + 30px, 132px);
  max-width: 100%;
  border: 1px solid var(--site-border);
  border-radius: calc(var(--site-radius) * 0.7);
  padding: var(--tb-logos-pad) clamp(18px, 1.9vw, 24px);
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.35vw + 13.5px, 18px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--site-body);
  overflow-wrap: anywhere;
 }

 /* A logo is a little taller than a name; its tile gives up the padding to
    stay the same height. */
 .tb-logos__logo--image {
  padding-block: calc(var(--tb-logos-pad) - 5px);
 }

 .tb-logos__mark {
  color: inherit;
  text-decoration: none;
 }

 a.tb-logos__mark:hover {
  color: var(--site-accent);
 }

 .tb-logos .tb-logos__image {
  width: auto;
  max-width: 8em;
  height: calc(1.2em + 10px);
  border-radius: 0;
  object-fit: contain;
 }

 /* Wall: even cells that fill the page's width. */
 .tb-logos--wall .tb-logos__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
 }

 .tb-logos--wall .tb-logos__logo {
  min-width: 0;
  min-height: clamp(76px, 7vw, 96px);
  background: var(--site-surface);
 }

 /* Scrolling: past the page's column to the window's edges, each copy at
    least as wide as the band, so there's never a gap to see through. */
 .tb-section.tb-logos--moving {
  overflow: hidden;
 }

 .tb-logos__strip {
  --tb-logos-gap: clamp(10px, 1.2vw, 14px);
  display: flex;
  gap: var(--tb-logos-gap);
  width: 100vw;
  margin-inline: calc(50% - 50vw);
 }

 .tb-logos--moving .tb-logos__list {
  flex: none;
  flex-wrap: nowrap;
  justify-content: space-around;
  min-width: 100%;
  animation: tb-logos-scroll 36s linear infinite;
 }

 .tb-logos__strip:hover .tb-logos__list,
 .tb-logos__strip:focus-within .tb-logos__list {
  animation-play-state: paused;
 }

 @keyframes tb-logos-scroll {
  to {
   transform: translateX(calc(-100% - var(--tb-logos-gap)));
  }
 }

 /* Less motion: one still row, wrapping as any other. */
 @media (prefers-reduced-motion: reduce) {
  .tb-logos--moving .tb-logos__list {
   flex: 1 1 auto;
   flex-wrap: wrap;
   justify-content: center;
   min-width: 0;
   animation: none;
  }

  .tb-logos--moving .tb-logos__list[aria-hidden] {
   display: none;
  }

  .tb-logos__strip {
   width: auto;
   margin-inline: 0;
  }
 }

 /* Phones: two even columns, and an odd last tile centered under them. */
 @media (max-width: 480px) {
  .tb-logos--row:not(.tb-logos--moving) .tb-logos__list {
   display: grid;
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tb-logos--row:not(.tb-logos--moving) .tb-logos__logo {
   min-width: 0;
  }

  .tb-logos--row:not(.tb-logos--moving) .tb-logos__logo:last-child:nth-child(odd) {
   grid-column: 1 / -1;
   justify-self: center;
   width: calc(50% - var(--tb-logos-gap) / 2);
  }
 }
</style>
