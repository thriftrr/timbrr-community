<script setup>
 // A published page: whatever the studio has published at this address,
 // drawn the way the studio's canvas draws it in Render view (the 1:1
 // rule): the site's header, the page's blocks and the site's footer, in
 // the site's brand color. useTimbrrPage fetches it (on the server for a
 // first visit, so crawlers get the whole page; in the browser as the menu
 // moves between pages) and sets its head tags. An address with nothing
 // published is a 404 (error.vue). A site's own page wins over this one for
 // its address, like the starter's index.vue for /.
 definePageMeta({ layout: false });

 const { site, blocks, style } = await useTimbrrPage();

 // As on the canvas: a site with no name or address to show isn't framed.
 const framed = computed(() => Boolean(site.value.name || site.value.domain));
</script>

<template>
 <div class="tb-page" :style="style">
  <TbSiteHeader v-if="framed" :site="site" />
  <main class="tb-page__main">
   <TbBlocks :blocks="blocks" />
  </main>
  <TbSiteFooter v-if="framed" :site="site" />
 </div>
</template>
