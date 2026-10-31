<script setup>
 // The site's footer as a block, in the studio's Library. It's drawn by the
 // same component a page uses, with this block as the page's footer, so
 // what's built is what the site shows. The site's name and details come
 // from the canvas; with no site to read, as on the starter's block shelf, a
 // placeholder stands in.
 const props = defineProps({ data: { type: Object, required: true } });

 const site = useTimbrrSite();
 const framed = computed(() => ({
  name: site?.value?.name || site?.value?.domain || 'Your site',
  details: site?.value?.details,
  frame: { footer: props.data },
 }));
</script>

<template>
 <TbSiteFooter :site="framed" />
</template>
