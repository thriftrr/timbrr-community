<script setup>
 // Where the business goes: a few lines about the area and the
 // neighborhoods (or towns) as chips, beside a drawn map with the ring they
 // sit in and a pin at its middle. The map is a picture, not an embed, so
 // the page never waits on a map service.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const hasAreas = computed(() => props.data.items.some((item, index) => shows(`items.${index}.title`, item.title)));
</script>

<template>
 <section class="tb-section tb-service-area">
  <div class="tb-wrap tb-service-area__inner">
   <div class="tb-service-area__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-service-area__body" />
    <ul v-if="hasAreas" class="tb-service-area__areas" role="list">
     <template v-for="(item, index) in data.items" :key="index">
      <TbText v-if="shows(`items.${index}.title`, item.title)" :data="data" :field="`items.${index}.title`" tag="li" class="tb-service-area__area" />
     </template>
    </ul>
   </div>
   <div class="tb-service-area__map" aria-hidden="true">
    <span class="tb-service-area__ring" />
    <svg class="tb-service-area__pin" viewBox="0 0 24 24" width="36" height="36">
     <path d="M12 22s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12z" />
     <circle cx="12" cy="10" r="2.5" />
    </svg>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-service-area__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  gap: clamp(28px, 4vw, 44px);
  align-items: center;
 }

 .tb-service-area__text {
  overflow-wrap: break-word;
 }

 .tb-service-area__text > :first-child {
  margin-top: 0;
 }

 .tb-service-area__body {
  max-width: 34em;
  margin-top: 14px;
  font-size: clamp(16px, 0.4vw + 14px, 17.5px);
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-service-area__areas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
 }

 .tb-service-area__area {
  border: 1px solid var(--site-border);
  border-radius: 999px;
  padding: 6px 13px;
  background: var(--site-surface);
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--site-heading);
 }

 /* The map: a street grid in a tint of the brand color, the ring the areas
    sit in, and a pin at its middle. The ring follows the map's height, so
    it stays round when the map is wider than tall. */
 .tb-service-area__map {
  --tb-service-area-paper: color-mix(in srgb, var(--site-surface), var(--site-bg));
  --tb-service-area-land: color-mix(in srgb, var(--site-accent) 10%, var(--tb-service-area-paper));
  --tb-service-area-line: color-mix(in srgb, var(--site-accent) 20%, var(--tb-service-area-paper));
  --tb-service-area-cell: clamp(26px, 3vw, 34px);
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--site-radius);
  background-color: var(--tb-service-area-land);
  background-image:
   linear-gradient(var(--tb-service-area-line) 1px, transparent 1px),
   linear-gradient(90deg, var(--tb-service-area-line) 1px, transparent 1px);
  background-size: var(--tb-service-area-cell) var(--tb-service-area-cell);
 }

 .tb-service-area__ring {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 64%;
  aspect-ratio: 1 / 1;
  border: 2px dashed var(--site-accent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--site-accent) 14%, transparent);
  transform: translate(-50%, -50%);
 }

 .tb-service-area__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--site-accent);
  transform: translate(-50%, -100%);
 }

 .tb-service-area__pin path {
  fill: currentColor;
 }

 .tb-service-area__pin circle {
  fill: var(--site-accent-ink);
 }

 /* Small screens: the areas first, then the map across the width, cropped
    wider so it doesn't take the whole screen. */
 @media (max-width: 720px) {
  .tb-service-area__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-service-area__map {
   aspect-ratio: 16 / 10;
  }
 }
</style>
