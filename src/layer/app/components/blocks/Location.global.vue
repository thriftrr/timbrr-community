<script setup>
 // How to find the place: the street and city, a line or two on parking and
 // transit, and a button that opens the address in Google Maps, beside a
 // drawn map with a pin. The map is a picture, not an embed (no map script,
 // nothing to wait on). Tapping it opens Google Maps too; the button is the
 // link a keyboard or a screen reader gets, so the map stays out of both.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // Google Maps, searching for the street and city. No address, no link.
 const directions = computed(() => {
  const place = [props.data.address, props.data.city]
   .map((line) => line.trim())
   .filter(Boolean)
   .join(', ');
  return place ? safeHref(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`) : undefined;
 });
</script>

<template>
 <section class="tb-section tb-location">
  <div class="tb-wrap tb-location__inner">
   <div class="tb-location__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <address v-if="shows('address', data.address) || shows('city', data.city)" class="tb-location__address">
     <TbText v-if="shows('address', data.address)" :data="data" field="address" tag="p" class="tb-location__street" />
     <TbText v-if="shows('city', data.city)" :data="data" field="city" tag="p" class="tb-location__city" />
    </address>
    <TbRich v-if="shows('parking', data.parking)" :data="data" field="parking" class="tb-location__parking" />
    <div v-if="directions && shows('note', data.note)" class="tb-location__action">
     <a :href="directions" class="tb-button tb-button--solid" rel="noopener">
      <TbText :data="data" field="note" />
     </a>
    </div>
   </div>
   <component
    :is="directions ? 'a' : 'div'"
    :href="directions"
    :rel="directions ? 'noopener' : undefined"
    :tabindex="directions ? -1 : undefined"
    class="tb-location__map"
    aria-hidden="true"
   >
    <span class="tb-location__road tb-location__road--main" />
    <span class="tb-location__road tb-location__road--cross" />
    <svg class="tb-location__pin" viewBox="0 0 24 24" width="40" height="40">
     <path d="M12 22s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12z" />
     <circle cx="12" cy="10" r="2.5" />
    </svg>
   </component>
  </div>
 </section>
</template>

<style>
 .tb-location__inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(28px, 4vw, 40px);
  align-items: stretch;
 }

 /* The text runs down the left; the button sits at the bottom, level with
    the bottom of the map. */
 .tb-location__text {
  display: flex;
  flex-direction: column;
  overflow-wrap: break-word;
 }

 .tb-location__text > :first-child {
  margin-top: 0;
 }

 .tb-location__address {
  margin-top: 20px;
  font-style: normal;
 }

 .tb-location__street {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(19px, 0.5vw + 16px, 22px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-location__city {
  margin: 3px 0 0;
  font-size: 16.5px;
  line-height: 1.5;
  color: var(--site-body);
 }

 .tb-location__parking {
  max-width: 32em;
  margin-top: 16px;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-location__action {
  margin-top: auto;
  padding-top: 22px;
 }

 /* The map: a street grid in a tint of the brand color, two roads and a
    pin. At least as tall as the text beside it. */
 .tb-location__map {
  --tb-location-paper: color-mix(in srgb, var(--site-surface), var(--site-bg));
  --tb-location-land: color-mix(in srgb, var(--site-accent) 10%, var(--tb-location-paper));
  --tb-location-line: color-mix(in srgb, var(--site-accent) 20%, var(--tb-location-paper));
  --tb-location-cell: clamp(26px, 3vw, 34px);
  position: relative;
  display: block;
  min-height: clamp(240px, 28vw, 300px);
  overflow: hidden;
  border-radius: var(--site-radius);
  background-color: var(--tb-location-land);
  background-image:
   linear-gradient(var(--tb-location-line) 1px, transparent 1px),
   linear-gradient(90deg, var(--tb-location-line) 1px, transparent 1px);
  background-size: var(--tb-location-cell) var(--tb-location-cell);
 }

 .tb-location__road {
  position: absolute;
  background: var(--site-surface);
 }

 .tb-location__road--main {
  top: 46%;
  right: -6%;
  left: -6%;
  height: clamp(12px, 1.4vw, 17px);
  transform: rotate(-6deg);
 }

 .tb-location__road--cross {
  top: 0;
  bottom: 0;
  left: 38%;
  width: clamp(9px, 1vw, 12px);
 }

 .tb-location__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--site-accent);
  transform: translate(-50%, -100%);
  transition: transform 160ms ease;
 }

 .tb-location__pin path {
  fill: currentColor;
 }

 .tb-location__pin circle {
  fill: var(--site-accent-ink);
 }

 /* A map that opens Google Maps lifts its pin under the pointer. */
 a.tb-location__map:hover .tb-location__pin {
  transform: translate(-50%, calc(-100% - 4px));
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-location__pin {
   transition: none;
  }

  a.tb-location__map:hover .tb-location__pin {
   transform: translate(-50%, -100%);
  }
 }

 /* Small screens: the address first, then the map across the width, cropped
    wider so it doesn't take the whole screen. */
 @media (max-width: 720px) {
  .tb-location__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-location__map {
   min-height: 0;
   aspect-ratio: 16 / 10;
  }
 }
</style>
