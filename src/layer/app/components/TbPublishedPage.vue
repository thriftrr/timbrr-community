<script setup>
 // A published page as pages/[...slug].vue draws it, for the routes the
 // layer keeps (/members, /join, /account) when the owner published a page of
 // their own at that address: theirs wins.
 const { site, page, blocks, style } = await useTimbrrPage();
 const framed = computed(() => Boolean(site.value.name || site.value.domain));
 const locked = computed(() => (page.value.access?.locked === true ? page.value.access : null));
</script>

<template>
 <div class="tb-page" :style="style">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader v-if="framed" :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main">
   <TbBlocks :blocks="blocks" />
   <TbMembersGate v-if="locked" :access="locked" />
  </main>
  <TbSiteFooter v-if="framed" :site="site" />
 </div>
</template>
