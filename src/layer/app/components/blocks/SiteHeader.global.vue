<script setup>
 // The site's header as a block, in the studio's Library. It's drawn by the
 // same component a page uses, with this block as the page's header, so
 // what's built is what the site shows. The site's name comes from the
 // canvas; with no site to read, as on the starter's block shelf, a
 // placeholder stands in.
 const props = defineProps({ data: { type: Object, required: true } });

 const site = useTimbrrSite();
 const framed = computed(() => ({
  name: site?.value?.name || site?.value?.domain || 'Your site',
  frame: { header: props.data },
 }));
</script>

<template>
 <TbSiteHeader :site="framed" />
</template>
