<script setup>
 // The site's header as a block, in the studio's Library. It's drawn by the
 // same component a page uses, with this block as the page's header, so
 // what's built is what the site shows. The site's name and details come
 // from the canvas; with no site to read, as on the starter's block shelf, a
 // placeholder stands in. The Library's stage doesn't come through here:
 // this is the header alone, with no hero to be see-through over.
 // `showMenu` is never saved: the studio's hover preview of a phone menu
 // style sets it, to draw the menu opened (FB-111).
 const props = defineProps({ data: { type: Object, required: true } });

 const site = useTimbrrSite();
 const framed = computed(() => ({
  name: site?.value?.name || site?.value?.domain || 'Your site',
  details: site?.value?.details,
  frame: { header: props.data },
 }));
</script>

<template>
 <!-- An open phone menu hangs below the bar, past a page that's only the
      header; a screen's height (--tb-screen on the canvas) keeps it in view. -->
 <div v-if="data.showMenu" style="min-height: var(--tb-screen, 100svh)">
  <TbSiteHeader :site="framed" show-menu />
 </div>
 <TbSiteHeader v-else :site="framed" />
</template>
