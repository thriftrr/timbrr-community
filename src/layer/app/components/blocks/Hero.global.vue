<script setup>
 // The page's opener: tagline, headline, a line or two about the business,
 // buttons and small print, beside a tall photo on either side. Centered
 // stacks the text in one column with the photo under it, when there is one.
 // Full bleed runs the photo edge to edge behind the words, darkened so
 // light text reads on any picture, and it's what a see-through header can
 // sit on: the header's height is added to the room above the words.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const bleed = computed(() => props.data.layout === 'bleed');
 const showImage = computed(() => props.data.layout !== 'centered' || Boolean(safeSrc(props.data.image.src)));

 // The buttons with a label, by place. One without says nothing, so it
 // isn't drawn.
 const buttons = computed(() =>
  props.data.buttons.flatMap((button, index) => (shows(`buttons.${index}.label`, button.label) ? [index] : [])),
 );
</script>

<template>
 <section class="tb-section tb-hero" :class="`tb-hero--${data.layout}`">
  <div class="tb-wrap tb-hero__inner">
   <div class="tb-hero__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText :data="data" field="headline" tag="h1" class="tb-hero__headline" />
    <TbRich v-if="shows('description', data.description)" :data="data" field="description" class="tb-hero__description" />
    <div v-if="buttons.length" class="tb-buttons">
     <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
    <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-note" />
   </div>
   <TbImage v-if="showImage" :image="data.image" ratio="4 / 5" :sizes="bleed ? '100vw' : undefined" class="tb-hero__image" eager />
  </div>
 </section>
</template>

<style>
 .tb-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
  gap: clamp(28px, 3.5vw, 44px);
  align-items: center;
 }

 .tb-hero--image_left .tb-hero__inner {
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
 }

 .tb-hero--image_left .tb-hero__image {
  order: -1;
 }

 .tb-hero__text {
  overflow-wrap: break-word;
 }

 .tb-hero .tb-eyebrow {
  margin-bottom: 14px;
 }

 .tb-hero .tb-hero__headline {
  font-size: clamp(32px, 2.4vw + 18px, 48px);
  line-height: 1.08;
 }

 .tb-hero__description {
  max-width: 28em;
  margin-top: 18px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  color: var(--site-body);
 }

 /* Centered: the text in one readable column, and the photo under it as a
    band whose height follows the screen rather than the tall shape. */
 .tb-hero--centered .tb-hero__inner {
  grid-template-columns: minmax(0, 1fr);
  text-align: center;
 }

 .tb-hero--centered .tb-hero__text {
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
 }

 .tb-hero--centered .tb-hero__description {
  margin-inline: auto;
 }

 .tb-hero--centered .tb-buttons {
  justify-content: center;
 }

 .tb-hero--centered .tb-hero__image {
  height: clamp(200px, 40vw, 480px);
 }

 /* Full bleed: the photo fills the block, a wash of the site's dark color
    over it, darkest behind the words, and the words over that. The photo
    stays where the other layouts put it, in the column, and is laid out
    against the block. Its height follows the width, never the window. The
    site's dark color and its ink are what's repainted here, not a band's
    (.tb-look), so a block set to Brand reads the same over a photo. */
 .tb-section.tb-hero--bleed {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  min-height: clamp(440px, 52vw, 680px);
  padding-block: calc(var(--site-space) * 1.4 + var(--tb-header-height, 0px)) calc(var(--site-space) * 1.4);
  overflow: hidden;
  background: var(--site-dark);
 }

 .tb-hero--bleed::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
   90deg,
   color-mix(in srgb, var(--site-dark) 86%, transparent),
   color-mix(in srgb, var(--site-dark) 56%, transparent)
  );
  pointer-events: none;
 }

 .tb-hero--bleed .tb-hero__image {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  border-radius: 0;
 }

 .tb-section.tb-hero--bleed .tb-hero__inner {
  --site-accent: var(--site-dark-ink);
  --site-accent-ink: var(--site-dark);
  --site-heading: var(--site-dark-ink);
  --site-ink: var(--site-dark-ink);
  --site-body: color-mix(in srgb, var(--site-dark-ink) 88%, var(--site-dark));
  --site-muted: color-mix(in srgb, var(--site-dark-ink) 72%, var(--site-dark));
  --site-eyebrow: color-mix(in srgb, var(--site-dark-ink) 80%, var(--site-dark));
  --site-border: color-mix(in srgb, var(--site-dark-ink) 22%, var(--site-dark));
  grid-template-columns: minmax(0, 1fr);
 }

 /* The words are what's lifted, not the column around them: the column has
    to stay unpositioned for the photo inside it to fill the block. */
 .tb-hero--bleed .tb-hero__text {
  position: relative;
  z-index: 1;
  max-width: 640px;
 }

 /* Small screens: text first, then the photo across the full width, cropped
    wider so it doesn't take the whole screen. */
 @media (max-width: 720px) {
  .tb-hero__inner,
  .tb-hero--image_left .tb-hero__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-hero--image_left .tb-hero__image {
   order: 0;
  }

  .tb-hero__image {
   height: clamp(240px, 68vw, 460px);
  }

  /* Words run the full width here, so the wash can't lighten past them. */
  .tb-hero--bleed::after {
   background: color-mix(in srgb, var(--site-dark) 74%, transparent);
  }
 }
</style>
