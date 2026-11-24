<script setup>
 // The first-visit banner (the studio's docs/languages.md): when the
 // browser's language is one of the site's live languages other than this
 // page's, one closable line in that language links to the same page there.
 // It never redirects. Closing it is kept in this browser (localStorage: no
 // cookie, nothing sent anywhere), so it shows once.
 const props = defineProps({ languages: { type: Array, default: () => [] } });
 const KEY = 'tb-language-banner';
 const shown = ref(null);
 onMounted(() => {
  let closed = false;
  try {
   closed = localStorage.getItem(KEY) === '1';
  } catch {}
  if (!closed) shown.value = bannerFor(props.languages, navigator.languages ?? [navigator.language]);
 });
 function close() {
  shown.value = null;
  try {
   localStorage.setItem(KEY, '1');
  } catch {}
 }
</script>

<template>
 <aside v-if="shown" class="tb-language-banner" :lang="shown.code" aria-label="Language">
  <a :href="shown.href" :hreflang="shown.code" class="tb-language-banner__link">{{ shown.banner }}</a>
  <button type="button" class="tb-language-banner__close" aria-label="Close" @click="close">×</button>
 </aside>
</template>

<style>
 .tb-language-banner {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--site-body, #333) 15%, transparent);
  background: var(--site-surface, #f7f5ec);
  color: var(--site-body, #222);
  font-size: 14px;
 }

 .tb-language-banner__link {
  color: inherit;
  text-underline-offset: 3px;
 }

 .tb-language-banner__close {
  min-width: 32px;
  min-height: 32px;
  border: 0;
  background: none;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
 }
</style>
