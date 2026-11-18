<script setup>
 // A Map field's value: { lat, lng, zoom, label } as a picture of the map,
 // OpenStreetMap's tiles with a pin, the tiles' credit, and a link that
 // opens the place on openstreetmap.org. No map script runs on the page.
 const props = defineProps({
  value: { type: Object, required: true },
  height: { type: Number, default: 320 },
 });
 const TILE = 256;
 const WIDTH = 768; // three tiles across; the frame shows its middle
 const zoom = computed(() => Math.min(18, Math.max(1, Math.round(Number(props.value.zoom)) || 14)));
 const point = computed(() => {
  const sin = Math.min(0.9999, Math.max(-0.9999, Math.sin((props.value.lat * Math.PI) / 180)));
  const size = TILE * 2 ** zoom.value;
  return { x: ((props.value.lng + 180) / 360) * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
 });
 const tiles = computed(() => {
  const count = 2 ** zoom.value;
  const cx = Math.floor(point.value.x / TILE);
  const cy = Math.floor(point.value.y / TILE);
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
   for (let dx = -1; dx <= 1; dx++) {
    const ty = cy + dy;
    if (ty < 0 || ty >= count) continue;
    out.push({ key: `${dx}${dy}`, src: `https://tile.openstreetmap.org/${zoom.value}/${(((cx + dx) % count) + count) % count}/${ty}.png`, left: (dx + 1) * TILE, top: (dy + 1) * TILE });
   }
  }
  return out;
 });
 // Where the pin sits inside the three-by-three tiles.
 const pin = computed(() => ({ x: point.value.x - (Math.floor(point.value.x / TILE) - 1) * TILE, y: point.value.y - (Math.floor(point.value.y / TILE) - 1) * TILE }));
 const open = computed(() => `https://www.openstreetmap.org/?mlat=${props.value.lat}&mlon=${props.value.lng}#map=${zoom.value}/${props.value.lat}/${props.value.lng}`);
</script>

<template>
 <figure class="tb-field-map">
  <div class="tb-field-map__view" :style="{ height: `${height}px` }">
   <div class="tb-field-map__tiles" :style="{ width: `${WIDTH}px`, height: `${WIDTH}px`, left: `calc(50% - ${pin.x}px)`, top: `calc(50% - ${pin.y}px)` }">
    <img v-for="tile in tiles" :key="tile.key" :src="tile.src" alt="" loading="lazy" width="256" height="256" :style="{ left: `${tile.left}px`, top: `${tile.top}px` }" />
   </div>
   <span class="tb-field-map__pin" aria-hidden="true" />
   <a class="tb-field-map__credit" href="https://www.openstreetmap.org/copyright" rel="noopener">© OpenStreetMap contributors</a>
  </div>
  <figcaption>
   <span v-if="value.label">{{ value.label }} · </span>
   <a :href="open" class="tb-field-value__link" rel="noopener">Open map</a>
  </figcaption>
 </figure>
</template>

<style>
 .tb-field-map {
  display: grid;
  gap: 8px;
  margin: 0;
 }

 .tb-field-map__view {
  position: relative;
  overflow: hidden;
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-field-map__tiles {
  position: absolute;
 }

 .tb-field-map__tiles img {
  position: absolute;
  width: 256px;
  height: 256px;
  max-width: none;
 }

 .tb-field-map__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -20px 0 0 -10px;
  border: 3px solid #fff;
  border-radius: 50% 50% 50% 0;
  background: var(--site-accent);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  transform: rotate(-45deg);
 }

 .tb-field-map__credit {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 2px 6px;
  background: rgb(255 255 255 / 0.85);
  font-size: 11px;
  color: #333;
 }

 .tb-field-map figcaption {
  font-size: 14px;
  color: var(--site-muted);
 }
</style>
