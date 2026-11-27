<script setup>
 // A header or footer from the Library, on a stand-in page (docs/manifest.md
 // § The stage). The block's data goes in as this page's frame and it's drawn
 // by the same component a real page uses, so what's on the stage is what the
 // site shows.
 //
 // Unlike the rest of the canvas this page scrolls, in the frame's own
 // document, so sticky and slide-away run as they would on a
 // live page. The studio gives the frame a fixed height. The header's own
 // controls work, by clicking them. Nothing here can be selected or typed
 // into, and the stand-in page is hidden from anything reading the frame.
 //
 // A footer gets only the end of a page above it, short, so it's in view the
 // moment the stage opens. It used to sit under the whole stand-in page, a
 // screen and a half down, and the stage looked empty (the studio's FB-158).
 // A footer taller than the frame starts scrolled to the bottom.
 const props = defineProps({
  site: { type: Object, default: null },
  block: { type: Object, required: true },
 });

 useHead({ htmlAttrs: { 'data-timbrr-stage': '' } });

 const side = computed(() => (props.block.type === 'site_footer' ? 'footer' : 'header'));
 onMounted(() => {
  if (side.value !== 'footer') return;
  requestAnimationFrame(() => window.scrollTo(0, document.documentElement.scrollHeight));
 });

 const framed = computed(() => ({
  ...props.site,
  name: props.site?.name || props.site?.domain || 'Your site',
  frame: { [side.value]: props.block.data ?? {} },
 }));
</script>

<template>
 <div class="tb-stage">
  <TbSiteHeader v-if="side === 'header'" :site="framed" />
  <div v-if="side === 'footer'" class="tb-stage__page tb-stage__page--end" aria-hidden="true">
   <div class="tb-wrap tb-stage__end">
    <span class="tb-stage__hint">the end of a page · for context</span>
    <span class="tb-stage__end-line">The last section of a page</span>
    <span class="tb-stage__row tb-stage__row--line" />
    <span class="tb-stage__end-button" />
   </div>
  </div>
  <div v-else class="tb-stage__page" aria-hidden="true">
   <div class="tb-stage__hero">
    <div class="tb-wrap">
     <span class="tb-stage__hint">hero image</span>
     <p class="tb-stage__line">A page of your site, for this {{ side }} to sit on.</p>
    </div>
   </div>
   <div class="tb-wrap tb-stage__rows">
    <span class="tb-stage__row" />
    <span class="tb-stage__row" />
    <span class="tb-stage__row" />
    <span class="tb-stage__row tb-stage__row--line" />
    <span class="tb-stage__row tb-stage__row--wide" />
    <span class="tb-stage__row" />
    <span class="tb-stage__row" />
    <span class="tb-stage__row" />
    <span class="tb-stage__row tb-stage__row--wide" />
   </div>
  </div>
  <TbSiteFooter v-if="side === 'footer'" :site="framed" />
 </div>
</template>

<style>
 /* site.css keeps the canvas from scrolling, since the studio sizes its frame
    to the page. On the stage the frame's size is fixed and the page scrolls. */
 html[data-timbrr-canvas][data-timbrr-stage] {
  overflow: hidden auto;
 }

 html[data-timbrr-canvas][data-timbrr-stage] body {
  overflow: visible;
 }

 .tb-stage {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
 }

 .tb-stage__page {
  flex: 1 0 auto;
  user-select: none;
 }

 .tb-stage__hero {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 460px;
  padding-block: 72px 56px;
  background: repeating-linear-gradient(135deg, var(--site-dark) 0 10px, color-mix(in srgb, var(--site-dark) 92%, var(--site-dark-ink)) 10px 20px);
  color: var(--site-dark-ink);
 }

 /* A footer's stage: the end of a page, then the footer at the bottom of the frame. */
 .tb-stage__page--end {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
 }

 .tb-stage__end {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-block: 48px;
  opacity: 0.55;
 }

 .tb-stage__end-line {
  font-family: var(--site-font-display);
  font-size: clamp(22px, 3vw, 30px);
  font-weight: var(--site-heading-weight);
  line-height: 1.15;
  color: var(--site-ink);
 }

 .tb-stage__end .tb-stage__row--line {
  width: min(420px, 60%);
  height: 12px;
 }

 .tb-stage__end-button {
  width: 132px;
  height: 40px;
  border-radius: var(--site-radius);
  background: var(--site-accent, var(--site-dark));
 }

 .tb-stage__hint {
  display: block;
  margin-bottom: 12px;
  font-family: var(--site-font-mono);
  font-size: 11px;
  opacity: 0.6;
 }

 .tb-stage__line {
  max-width: 560px;
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(28px, 4vw, 38px);
  font-weight: var(--site-heading-weight);
  line-height: 1.1;
 }

 .tb-stage__rows {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding-block: var(--site-space);
 }

 .tb-stage__row {
  height: 160px;
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-stage__row--line {
  grid-column: 1 / -1;
  width: 60%;
  height: 14px;
 }

 .tb-stage__row--wide {
  grid-column: 1 / -1;
  height: 240px;
 }

 @media (max-width: 640px) {
  .tb-stage__rows {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
