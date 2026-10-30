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
 const published = slug ? await useTimbrrPage('/') : null;
 const site = published?.site;
 const blocks = published?.blocks;
 const style = published?.style;

 // As on the canvas: a site with no name or address to show isn't framed.
 const framed = computed(() => Boolean(site?.value.name || site?.value.domain));
</script>

<template>
 <div v-if="published" class="tb-page" :style="style">
  <TbSiteHeader v-if="framed" :site="site" />
  <main class="tb-page__main">
   <TbBlocks :blocks="blocks" />
  </main>
  <TbSiteFooter v-if="framed" :site="site" />
 </div>
 <main v-else>
  <TbBlocks :blocks="shelf" />
 </main>
</template>
