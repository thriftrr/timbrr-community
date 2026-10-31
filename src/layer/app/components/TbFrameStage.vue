<script setup>
 // A header or footer from the Library, on a stand-in page (docs/manifest.md
 // § The stage). The block's data goes in as this page's frame and it's drawn
 // by the same component a real page uses, so what's on the stage is what the
 // site shows. Its hero is always full-bleed, so a see-through header has
 // something to be see-through over.
 //
 // Unlike the rest of the canvas this page scrolls, in the frame's own
 // document, so sticky, slide-away and see-through all run as they would on a
 // live page. The studio gives the frame a fixed height. The header's own
 // controls work, by clicking them. Nothing here can be selected or typed
 // into, and the stand-in page is hidden from anything reading the frame.
 const props = defineProps({
  site: { type: Object, default: null },
  block: { type: Object, required: true },
 });

 useHead({ htmlAttrs: { 'data-timbrr-stage': '' } });

 const side = computed(() => (props.block.type === 'site_footer' ? 'footer' : 'header'));
 const framed = computed(() => ({
  ...props.site,
  name: props.site?.name || props.site?.domain || 'Your site',
  overHero: true,
  frame: { [side.value]: props.block.data ?? {} },
 }));
</script>

<template>
 <div class="tb-stage">
  <TbSiteHeader v-if="side === 'header'" :site="framed" />
  <div class="tb-stage__page" aria-hidden="true">
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
  padding-block: calc(var(--tb-header-height, 0px) + 72px) 56px;
  background: repeating-linear-gradient(135deg, var(--site-dark) 0 10px, color-mix(in srgb, var(--site-dark) 92%, var(--site-dark-ink)) 10px 20px);
  color: var(--site-dark-ink);
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
  font-weight: 800;
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
