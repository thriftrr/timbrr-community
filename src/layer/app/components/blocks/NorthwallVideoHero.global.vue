<script setup>
 // The page's opener over a looping video: the picture first, the video
 // over it once it can play, a shade of the site's dark color over both, and
 // the words on top. The video never starts for anyone who's asked for less
 // motion, and never on the studio's canvas, where it would only distract;
 // either way the picture stands in. Anything that moves for more than a
 // few seconds needs a way to stop it, so there's a pause button in the
 // corner. A see-through header sits over the top, as on a full-bleed Hero.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();

 const src = computed(() => (canvas ? undefined : safeSrc(props.data.video_url)));
 const player = ref(null);
 const playing = ref(false);
 // Once it has moved it stays over the picture, so a pause holds its frame.
 const started = ref(false);

 const buttons = computed(() => props.data.buttons.flatMap((button, index) => (shows(`buttons.${index}.label`, button.label) ? [index] : [])));

 // The button follows the video itself (its play and pause events), and the
 // video shows once frames are moving. play() is refused where autoplay is
 // off (low power mode, a browser setting); the picture stays and the
 // button offers to start it.
 async function play() {
  try {
   await player.value?.play();
  } catch {
   playing.value = false;
  }
 }

 function toggle() {
  if (playing.value) player.value?.pause();
  else play();
 }

 onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
 });
</script>

<template>
 <section class="tb-section nw-vhero" :class="[`nw-vhero--${data.words}`, `nw-vhero--${data.height}`, `nw-vhero--shade-${data.shade}`, { 'nw-vhero--peaks': data.edge === 'peaks' }]">
  <TbImage :image="data.image" field="image" sizes="100vw" class="nw-vhero__picture" eager />
  <video
   v-if="src"
   ref="player"
   :src="src"
   muted
   loop
   playsinline
   preload="metadata"
   disablepictureinpicture
   aria-hidden="true"
   tabindex="-1"
   class="nw-vhero__video"
   :class="{ 'nw-vhero__video--on': started }"
   @play="playing = true"
   @playing="started = true"
   @pause="playing = false"
  ></video>
  <div class="nw-vhero__inner">
   <div class="tb-wrap">
    <div class="nw-vhero__text">
     <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
     <TbText :data="data" field="headline" tag="h1" class="nw-vhero__headline" />
     <TbRich v-if="shows('description', data.description)" :data="data" field="description" class="nw-vhero__description" />
     <div v-if="buttons.length" class="tb-buttons">
      <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
     </div>
    </div>
   </div>
  </div>
  <button v-if="src" type="button" class="nw-vhero__pause" :aria-label="playing ? 'Pause background video' : 'Play background video'" @click="toggle">
   <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path v-if="playing" d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />
    <path v-else d="M4.5 2.3v11.4L13.5 8z" />
   </svg>
  </button>
  <svg v-if="data.edge === 'peaks'" class="nw-vhero__peaks" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
   <path d="M0 140V98l92-54 58 36 98-72 82 64 56-32 118 68 112-50 68 32 132-80 94 60 62-28 148 72 112-42 88 38 120-58v88z" />
  </svg>
 </section>
</template>

<style>
 /* The block is the screen: its height is the window's, less nothing, and
    never so short the words crowd. The site's dark color is under it all,
    so it reads before anything loads. */
 .tb-section.nw-vhero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  min-height: max(520px, 100svh);
  padding-block: calc(var(--site-space) * 1.2 + var(--tb-header-height, 0px)) calc(var(--site-space) * 1.2);
  overflow: hidden;
  background: var(--site-dark);
 }

 .tb-section.nw-vhero--tall {
  min-height: clamp(440px, 62vw, 720px);
 }

 .tb-section.nw-vhero--bottom {
  align-items: flex-end;
 }

 .nw-vhero .nw-vhero__picture,
 .nw-vhero .nw-vhero__video {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  border-radius: 0;
  object-fit: cover;
 }

 /* The video comes in over the picture once it's moving, so a frame that's
    still loading never sits there; paused, it holds where it stopped. */
 .nw-vhero__video {
  opacity: 0;
  pointer-events: none;
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1);
 }

 .nw-vhero__video--on {
  opacity: 1;
 }

 /* The shade: the site's dark color, a little deeper toward the bottom
    where the words of Bottom left sit. */
 .nw-vhero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, color-mix(in srgb, var(--site-dark) var(--nw-shade), transparent), color-mix(in srgb, var(--site-dark) calc(var(--nw-shade) + 18%), transparent));
  pointer-events: none;
 }

 .nw-vhero--shade-light {
  --nw-shade: 34%;
 }

 .nw-vhero--shade-medium {
  --nw-shade: 52%;
 }

 .nw-vhero--shade-dark {
  --nw-shade: 70%;
 }

 /* Light words on the shade, as on a full-bleed Hero: the dark band's ink
    stands in for every color the words use. */
 .tb-section.nw-vhero .nw-vhero__inner {
  --site-accent: var(--site-dark-ink);
  --site-accent-ink: var(--site-dark);
  --site-heading: var(--site-dark-ink);
  --site-ink: var(--site-dark-ink);
  --site-body: color-mix(in srgb, var(--site-dark-ink) 90%, var(--site-dark));
  --site-eyebrow: color-mix(in srgb, var(--site-dark-ink) 84%, var(--site-dark));
  /* The section is a flex row; this fills it, and the page's column sits
     inside with its usual gutters. */
  flex: 1 1 auto;
  min-width: 0;
 }

 .nw-vhero__text {
  max-width: 680px;
  overflow-wrap: break-word;
 }

 .nw-vhero--center .nw-vhero__text {
  max-width: 820px;
  margin-inline: auto;
  text-align: center;
 }

 .nw-vhero--center .tb-buttons {
  justify-content: center;
 }

 .nw-vhero .tb-eyebrow {
  margin-bottom: 14px;
 }

 .nw-vhero .nw-vhero__headline {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: calc(clamp(38px, 4.2vw + 18px, 84px) * var(--site-heading-scale));
  font-weight: var(--site-heading-weight);
  line-height: 1.02;
  letter-spacing: var(--site-heading-tracking);
  color: var(--site-heading);
  text-wrap: balance;
 }

 .nw-vhero__description {
  max-width: 34em;
  margin-top: 18px;
  font-size: clamp(17px, 0.6vw + 14.5px, 21px);
  line-height: 1.5;
  color: var(--site-body);
 }

 .nw-vhero--center .nw-vhero__description {
  margin-inline: auto;
 }

 .nw-vhero .tb-buttons {
  margin-top: 26px;
 }

 /* Pause, in the corner: a quiet disc that's still a full-size target. */
 .nw-vhero__pause {
  position: absolute;
  right: max(16px, env(safe-area-inset-right));
  bottom: 16px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1.5px solid color-mix(in srgb, var(--site-dark-ink) 55%, transparent);
  border-radius: 50%;
  padding: 0;
  background: color-mix(in srgb, var(--site-dark) 55%, transparent);
  color: var(--site-dark-ink);
  cursor: pointer;
  transition: background-color 120ms ease;
 }

 .nw-vhero__pause:hover {
  background: color-mix(in srgb, var(--site-dark) 85%, transparent);
 }

 .nw-vhero__pause:focus-visible {
  outline: 2px solid var(--site-dark-ink);
  outline-offset: 2px;
 }

 /* Peaks: a ridge in the page's color across the bottom, so the video
    ends in a skyline instead of a line. Everything else clears it. */
 .nw-vhero__peaks {
  position: absolute;
  inset: auto 0 -1px;
  z-index: 1;
  display: block;
  width: 100%;
  height: clamp(44px, 9vw, 130px);
  fill: var(--site-bg);
  pointer-events: none;
 }

 .tb-section.nw-vhero--peaks {
  padding-bottom: calc(var(--site-space) * 1.2 + clamp(44px, 9vw, 130px));
 }

 .nw-vhero--peaks .nw-vhero__pause {
  bottom: calc(clamp(44px, 9vw, 130px) + 8px);
 }

 /* On the canvas a click on the picture has to reach it, past the words'
    column. The words still take theirs. */
 .tb-frame .nw-vhero__inner {
  pointer-events: none;
 }

 .tb-frame .nw-vhero__text > * {
  pointer-events: auto;
 }

 /* The canvas is taller than a screen, so full screen there is a fixed
    height that still looks like one. */
 .tb-frame .tb-section.nw-vhero--full {
  min-height: 680px;
 }

 @media (prefers-reduced-motion: reduce) {
  .nw-vhero__video {
   transition: none;
  }
 }
</style>
