<script setup>
 // A block's image. Until there is one, a quiet panel in the brand color
 // holds its place (and, in the studio's canvas, says what goes there).
 // Images load lazily, except an `eager` one: the photo at the top of a
 // page, which visitors see first.
 //
 // A picture picked from the studio's media library carries more than an
 // address (docs/manifest.md § Widgets), and each part is used when it's
 // there: its size goes on the element, so the page doesn't shift as it
 // loads; a `srcset` is built from the library's smaller copies
 // (mediaSrcset, app/utils/timbrr.js), so a phone fetches a phone-sized
 // file; its ThumbHash is drawn behind it until the photo is in, decoded
 // here in the browser (app/utils/thumbhash.js), never on the server; and
 // the crop keeps the subject by anchoring on the focal point. A pasted
 // address has none of these and draws as it always did.
 //
 // A placement can also be zoomed in (`zoom`, 1 to 4, about the focal
 // point). Only then, and while the studio's canvas is cropping this picture
 // (canvas.crop, pages/__timbrr/canvas.vue), the photo sits in a box that
 // clips it; every other picture is the one <img> it always was.
 //
 // `field` is the image's path in its block's data, as TbText's is. It's for
 // the studio's canvas alone: there a click says which image it was, and the
 // inspector opens on it. Anywhere else, and in a block that can't be edited,
 // it adds nothing to the page.
 const props = defineProps({
  image: { type: Object, default: null },
  field: { type: String, default: '' },
  ratio: { type: String, default: '4 / 3' },
  eager: { type: Boolean, default: false },
  // How wide the picture is drawn, for the browser's choice from srcset:
  // a page's column by default. A block that draws one smaller says so.
  sizes: { type: String, default: '(min-width: 1120px) 1120px, 100vw' },
 });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const src = computed(() => safeSrc(props.image?.src));
 const clickable = computed(() => (canvas?.editable.value && props.field ? props.field : undefined));

 const size = computed(() => {
  const width = Number(props.image?.width);
  const height = Number(props.image?.height);
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 ? { width, height } : null;
 });
 const srcset = computed(() => (src.value && size.value ? mediaSrcset(src.value, size.value.width) : ''));

 // Where the subject is, as the crop's anchor. Anything that isn't a pair
 // of numbers leaves the crop centered, which is what object-fit does alone.
 // The crop being made on the canvas, when it's this picture's.
 const cropping = computed(() => {
  const crop = canvas?.crop?.value;
  return crop && scope && crop.id === scope.id && crop.field === props.field ? crop : null;
 });
 const zoom = computed(() => {
  const z = Number(cropping.value ? cropping.value.zoom : props.image?.zoom);
  return Number.isFinite(z) ? Math.min(4, Math.max(1, z)) : 1;
 });
 const boxed = computed(() => Boolean(cropping.value) || zoom.value > 1);
 // Only a picture its box crops can be cropped by hand.
 const croppable = computed(() => (clickable.value && props.ratio !== 'auto' ? '' : undefined));

 const position = computed(() => {
  const focal = cropping.value ?? props.image?.focal;
  const x = Number(focal?.x);
  const y = Number(focal?.y);
  if (!focal || !Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const clamp = (n) => Math.min(1, Math.max(0, n));
  return `${(clamp(x) * 100).toFixed(1)}% ${(clamp(y) * 100).toFixed(1)}%`;
 });

 // ── The placeholder ──
 // Decoded once the component is in the browser: the server renders the
 // element without it (decoding a picture for every photo on every request
 // would be waste), and a photo the browser already has by the time the
 // page hydrates never shows one at all.

 const img = ref(null);
 const loaded = ref(false);
 const placeholder = ref('');

 function decode(hash) {
  if (typeof hash !== 'string' || !hash || hash.length > 64) return '';
  try {
   const bytes = Uint8Array.from(atob(hash), (char) => char.charCodeAt(0));
   return bytes.length >= 5 ? thumbHashToDataURL(bytes) : '';
  } catch {
   return '';
  }
 }

 function settle() {
  loaded.value = Boolean(img.value?.complete && img.value.naturalWidth);
  placeholder.value = loaded.value ? '' : decode(props.image?.placeholder);
 }

 onMounted(settle);
 // Another picture (on the studio's canvas, as someone picks one): the old
 // placeholder would be the wrong colors behind it.
 watch(src, () => nextTick(settle));

 const style = computed(() => ({
  aspectRatio: props.ratio,
  objectPosition: boxed.value ? undefined : position.value,
  backgroundImage: placeholder.value && !loaded.value ? `url(${placeholder.value})` : undefined,
 }));
 const zoomStyle = computed(() => ({
  objectPosition: position.value,
  transformOrigin: position.value ?? '50% 50%',
  transform: `scale(${zoom.value})`,
 }));
</script>

<template>
 <span v-if="src && boxed" class="tb-image tb-image--boxed" :class="{ 'tb-image--placeholder': placeholder && !loaded, 'is-cropping': cropping }" :style="style" :data-image-field="clickable" :data-image-crop="croppable">
  <img
   ref="img"
   :src="src"
   :srcset="srcset || undefined"
   :sizes="srcset ? sizes : undefined"
   :alt="image.alt"
   class="tb-image__zoom"
   :style="zoomStyle"
   draggable="false"
   :loading="eager ? 'eager' : 'lazy'"
   :fetchpriority="eager ? 'high' : undefined"
   @load="loaded = true"
  />
 </span>
 <img
  v-else-if="src"
  ref="img"
  :src="src"
  :srcset="srcset || undefined"
  :sizes="srcset ? sizes : undefined"
  :width="size?.width"
  :height="size?.height"
  :alt="image.alt"
  class="tb-image"
  :class="{ 'tb-image--placeholder': placeholder && !loaded }"
  :style="style"
  :data-image-field="clickable"
  :data-image-crop="croppable"
  :loading="eager ? 'eager' : 'lazy'"
  :fetchpriority="eager ? 'high' : undefined"
  @load="loaded = true"
 />
 <div v-else class="tb-image tb-image--empty" :style="{ aspectRatio: ratio }" role="presentation" :data-image-field="clickable">
  <span v-if="canvas?.editable.value" class="tb-image__hint">Add an image in the panel on the right</span>
 </div>
</template>

<style>
 /* The placeholder fills the box the photo will: a 32-pixel picture
    stretched over the element is blur enough, with nothing to repaint
    when the photo lands. */
 /* A zoomed picture: the box keeps the block's shape and clips the photo,
    which fills it and is scaled about its focal point. */
 .tb-image--boxed {
  position: relative;
  overflow: hidden;
 }

 .tb-image__zoom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
 }

 .tb-image--boxed.is-cropping {
  outline: calc(2px * var(--tb-ui, 1)) solid var(--site-accent);
  outline-offset: calc(2px * var(--tb-ui, 1));
  cursor: grab;
  touch-action: none;
  user-select: none;
 }

 .tb-image--placeholder {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
 }
</style>
