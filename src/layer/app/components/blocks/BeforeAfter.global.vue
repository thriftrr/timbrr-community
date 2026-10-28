<script setup>
 // Two photos of the same place in one frame, before on the left and after
 // on the right, split by a line anyone can drag: a mouse or a finger
 // anywhere on the photos, or the arrow keys once the slider has focus (it's
 // a range input under the line). Until the page's JavaScript runs, or
 // without it, the two sit side by side in the same frame, so nothing shifts
 // when the slider wakes up.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const frame = ref(null);
 const range = ref(null);
 const live = ref(false);
 const at = ref(50); // the line, as a percent of the frame's width from the left
 let pointer = null; // the pointer moving the line

 onMounted(() => {
  live.value = true;
 });

 function slideTo(clientX) {
  const box = frame.value?.getBoundingClientRect();
  if (!box?.width) return;
  at.value = Math.min(100, Math.max(0, Math.round(((clientX - box.left) / box.width) * 1000) / 10));
 }

 // A mouse moves the line where it presses; a finger only by sliding
 // sideways, so scrolling past the block never moves it. A label being
 // typed into (in the studio's canvas) is left alone.
 function onPointerDown(event) {
  if (!live.value || event.button !== 0 || event.target.isContentEditable) return;
  pointer = event.pointerId;
  frame.value.setPointerCapture?.(event.pointerId);
  if (event.pointerType === 'mouse') {
   event.preventDefault();
   slideTo(event.clientX);
  }
 }

 function onPointerMove(event) {
  if (event.pointerId === pointer) slideTo(event.clientX);
 }

 // Letting go of the mouse leaves the slider focused, so the arrow keys
 // carry on from there, the way a plain range input behaves.
 function onPointerEnd(event) {
  if (event.pointerId !== pointer) return;
  pointer = null;
  if (event.type === 'pointerup' && event.pointerType === 'mouse') range.value?.focus({ preventScroll: true });
 }

 // What a screen reader hears: the labels, or plain words when they're empty.
 const names = computed(() => ({
  before: props.data.before.trim() || 'before',
  after: props.data.after.trim() || 'after',
 }));
 const rangeText = computed(() => {
  const shown = Math.round(at.value);
  return `${shown}% ${names.value.before}, ${100 - shown}% ${names.value.after}`;
 });
</script>

<template>
 <section class="tb-section tb-before-after">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <figure class="tb-before-after__figure">
    <div
     ref="frame"
     class="tb-before-after__frame"
     :class="{ 'is-live': live }"
     :style="{ '--tb-before-after-at': `${at}%` }"
     @pointerdown="onPointerDown"
     @pointermove="onPointerMove"
     @pointerup="onPointerEnd"
     @pointercancel="onPointerEnd"
     @lostpointercapture="onPointerEnd"
     @dragstart.prevent
    >
     <div class="tb-before-after__side tb-before-after__side--before">
      <TbImage :image="data.before_image" ratio="auto" class="tb-before-after__image" draggable="false" />
      <TbText v-if="shows('before', data.before)" :data="data" field="before" class="tb-before-after__label" />
     </div>
     <div class="tb-before-after__side tb-before-after__side--after">
      <TbImage :image="data.after_image" ratio="auto" class="tb-before-after__image" draggable="false" />
      <TbText v-if="shows('after', data.after)" :data="data" field="after" class="tb-before-after__label" />
     </div>
     <input
      v-if="live"
      ref="range"
      v-model.number="at"
      type="range"
      min="0"
      max="100"
      step="1"
      class="tb-before-after__range"
      :aria-label="`Compare ${names.before} and ${names.after}`"
      :aria-valuetext="rangeText"
     />
     <span class="tb-before-after__line" aria-hidden="true" />
     <span v-if="live" class="tb-before-after__knob" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
       <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
      </svg>
     </span>
    </div>
    <TbText v-if="shows('caption', data.caption)" :data="data" field="caption" tag="figcaption" class="tb-before-after__caption" />
   </figure>
  </div>
 </section>
</template>

<style>
 .tb-before-after__figure {
  margin: 0;
 }

 /* Side by side to begin with: each photo fills its half. Live, the two
    stack and the before photo is cut off at the line. The frame keeps one
    shape either way. */
 .tb-before-after__frame {
  --tb-before-after-knob: 48px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  aspect-ratio: 2 / 1;
  overflow: hidden;
  border-radius: var(--site-radius);
  background: var(--site-surface);
  isolation: isolate;
 }

 .tb-before-after__frame.is-live {
  cursor: ew-resize;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
 }

 .tb-before-after__frame [contenteditable] {
  cursor: text;
  -webkit-user-select: text;
  user-select: text;
 }

 .tb-before-after__side {
  position: relative;
  min-width: 0;
  overflow: hidden;
 }

 .tb-before-after__frame.is-live > .tb-before-after__side {
  position: absolute;
  inset: 0;
 }

 .tb-before-after__frame.is-live > .tb-before-after__side--before {
  z-index: 1;
  clip-path: inset(0 calc(100% - var(--tb-before-after-at, 50%)) 0 0);
 }

 .tb-before-after__side .tb-before-after__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  -webkit-user-drag: none;
 }

 /* Until there are photos, the before side shows washed out. */
 .tb-before-after__side--before .tb-image--empty {
  filter: grayscale(0.85) brightness(0.96);
 }

 .tb-before-after__label {
  position: absolute;
  top: clamp(10px, 1.4vw, 16px);
  max-width: calc(100% - 28px);
  border-radius: 999px;
  padding: 5px 12px;
  background: color-mix(in srgb, var(--site-dark) 62%, transparent);
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  letter-spacing: 0.1em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--site-dark-ink);
  overflow-wrap: anywhere;
 }

 .tb-before-after__side--before .tb-before-after__label {
  left: clamp(10px, 1.4vw, 16px);
 }

 .tb-before-after__side--after .tb-before-after__label {
  right: clamp(10px, 1.4vw, 16px);
 }

 .tb-before-after__frame.is-live .tb-before-after__label {
  max-width: calc(50% - 28px);
 }

 /* The slider itself: over the photos, invisible, reached by Tab. The
    pointer goes through it to the frame. Its focus shows on the knob. */
 .tb-before-after__range {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  pointer-events: none;
 }

 .tb-before-after__line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--tb-before-after-at, 50%);
  z-index: 3;
  width: 3px;
  background: var(--site-bg);
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.12);
  transform: translateX(-50%);
  pointer-events: none;
 }

 /* The knob follows the line, but stops short of the edges so neither it
    nor its focus ring is ever cut off. */
 .tb-before-after__knob {
  position: absolute;
  top: 50%;
  left: clamp(var(--tb-before-after-knob) / 2 + 8px, var(--tb-before-after-at, 50%), 100% - var(--tb-before-after-knob) / 2 - 8px);
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tb-before-after-knob);
  height: var(--tb-before-after-knob);
  border-radius: 50%;
  background: var(--site-bg);
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.28);
  color: var(--site-heading);
  transform: translate(-50%, -50%);
  pointer-events: none;
 }

 .tb-before-after__range:focus-visible ~ .tb-before-after__knob {
  outline: 3px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-before-after__caption {
  margin-top: 12px;
  font-size: 15px;
  font-style: italic;
  line-height: 1.5;
  color: var(--site-muted);
  text-align: center;
 }

 /* Small screens: a taller frame, so each side still shows something. */
 @media (max-width: 720px) {
  .tb-before-after__frame {
   --tb-before-after-knob: 40px;
   aspect-ratio: 4 / 3;
  }
 }
</style>
