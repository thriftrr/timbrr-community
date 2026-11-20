<script setup>
 // The site's front door. With a site set up here (NUXT_PUBLIC_SITE) it's
 // the published home page, drawn exactly as pages/[...slug].vue draws any
 // other address; a site's own index.vue wins over the catch-all for /, so
 // without this the home page published in the studio would never show.
 // With no site (the shared canvas, `make dev`) it's the shelf: every block
 // this site has with its starting content, the community shelf at a
 // glance, and a quick check that they all render.
 import { definitions } from '#timbrr/blocks';

 definePageMeta({ layout: false });

 const slug = String(useRuntimeConfig().public.site ?? '').trim();
 if (!slug) useHead({ title: 'Timbrr starter — every block' });

 const shelf = definitions.map(({ def }) => ({ id: def.type, type: def.type, data: def.defaults ?? {} }));
 // A Split on the shelf holds a few blocks, so it shows what a column does to them (docs/sub-blocks.md).
 const inSplit = shelf.find((block) => block.type === 'split');
 if (inSplit) {
  const child = (type) => ({ id: `shelf-${type}`, type, data: definitions.find(({ def }) => def.type === type)?.def.defaults ?? {} });
  inSplit.data = { ...inSplit.data, ratio: '35-65', columns: [[child('cta')], [child('cards'), child('carousel')]] };
 }
 const published = slug ? await useTimbrrPage('/') : null;
 const site = published?.site;
 const blocks = published?.blocks;
 const style = published?.style;

 // As on the canvas: a site with no name or address to show isn't framed.
 const framed = computed(() => Boolean(site?.value.name || site?.value.domain));
</script>

<template>
 <div v-if="published" class="tb-page" :style="style">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader v-if="framed" :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main">
   <TbBlocks :blocks="blocks" />
  </main>
  <TbSiteFooter v-if="framed" :site="site" />
 </div>
 <main v-else id="main">
  <TbBlocks :blocks="shelf" />
 </main>
</template>
