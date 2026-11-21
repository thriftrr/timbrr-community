<script setup>
 // A form's share page, /f/<slug> (the studio's docs/forms.md, "Share link"):
 // the form on a page of its own, with no page of the site holding it. It is
 // what a QR code in a shop window opens, and what an embed frames. The site's
 // header is its logo or name and nothing else (no menu to click away to), then
 // the live form, which sends, checks and thanks exactly as the Form block's
 // does (TbForm), then the site's name, address and domain in a line. A link
 // that's off, or was never on, is "This form is closed": a 404, friendly,
 // and never indexed (the server adds the header, modules/runtime/canvas-headers.js).
 // It wins over a site's own page at /f/<something>. `?name=value` still fills
 // fields in, as on any page, which is how a link from a page can pass a field on.
 import { addressLines } from '../../../schema/frames.js';

 definePageMeta({ layout: false });

 const route = useRoute();
 const slug = computed(() => String(route.params.slug ?? '').toLowerCase());
 const forms = useTimbrrForms();

 const { data, error } = await useFetch('/__timbrr/share', { key: `tb-share-${slug.value}`, query: { slug }, retry: false, default: () => null });
 // The studio failing isn't "closed": that's an error page that says to try again.
 const status = error.value?.statusCode;
 if (error.value && status !== 404) throw createError({ statusCode: status === 401 ? 401 : 502, statusMessage: 'Bad Gateway', message: "Couldn't get this form from the studio.", fatal: import.meta.client });

 const form = computed(() => (data.value && Array.isArray(data.value.form?.fields) ? data.value.form : null));
 const closed = computed(() => !form.value);
 if (import.meta.server && closed.value) setResponseStatus(useRequestEvent(), 404);
 if (form.value) forms.value = { ...forms.value, [form.value.id]: form.value };

 const text = (value) => (typeof value === 'string' ? value.trim() : '');
 const site = computed(() => {
  const value = data.value?.site ?? {};
  return { name: text(value.name), domain: text(value.domain), accent: text(value.accent), brand: normalizeBrand(value.brand), details: value.details ?? null, language: /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value.language ?? '') ? value.language : 'en' };
 });
 provide(TIMBRR_SITE_KEY, site);
 const style = computed(() => brandStyle(site.value.accent, site.value.brand));
 useBrandHead(style, () => site.value.brand);

 const logo = computed(() => {
  const image = site.value.brand?.logo;
  const src = safeSrc(image?.src);
  return src ? { src, alt: image.alt || site.value.name, width: image.width, height: image.height } : null;
 });
 const heading = computed(() => (form.value && !form.value.hideHeader ? text(form.value.title) : ''));
 const lede = computed(() => (form.value && !form.value.hideHeader ? (form.value.intro ?? '') : ''));
 const line = computed(() => [site.value.name, ...addressLines(site.value.details)].filter(Boolean).join(' · '));

 useHead({ htmlAttrs: { lang: () => site.value.language } });
 useSeoMeta({
  title: () => (closed.value ? 'This form is closed' : [heading.value, site.value.name].filter(Boolean).join(' · ') || site.value.name),
  robots: 'noindex, nofollow',
 });
</script>

<template>
 <main v-if="closed" class="tb-error tb-share-closed">
  <div class="tb-wrap tb-wrap--narrow">
   <h1 class="tb-heading">This form is closed.</h1>
   <p class="tb-lede">It isn't taking answers right now. If someone sent you here, ask them for another way to reach out.</p>
  </div>
 </main>
 <div v-else class="tb-page tb-share" :style="style">
  <header class="tb-share__head">
   <div class="tb-wrap tb-wrap--wide">
    <img v-if="logo" class="tb-share__logo" :src="logo.src" :alt="logo.alt" :width="logo.width" :height="logo.height" />
    <span v-else-if="site.name" class="tb-share__name tb-heading">{{ site.name }}</span>
   </div>
  </header>
  <main id="main" tabindex="-1" class="tb-page__main tb-share__main">
   <div class="tb-wrap tb-share__inner">
    <h1 v-if="heading" class="tb-heading tb-share__title">{{ heading }}</h1>
    <TbForm :form="form" heading="" :intro="lede" />
   </div>
  </main>
  <footer v-if="line || site.domain" class="tb-share__foot">
   <div class="tb-wrap tb-wrap--wide tb-share__foot-row">
    <span>{{ line }}</span>
    <span v-if="site.domain">{{ site.domain }}</span>
   </div>
  </footer>
 </div>
</template>

<style>
 .tb-share__head {
  padding-block: 22px;
  border-bottom: 1px solid var(--site-border);
 }

 .tb-share__logo {
  display: block;
  max-width: 220px;
  max-height: 44px;
  width: auto;
  height: auto;
 }

 .tb-share__name {
  font-size: 22px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-share__main {
  padding-block: clamp(32px, 6vw, 64px);
 }

 .tb-share__inner {
  max-width: 640px;
 }

 .tb-share__title {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
 }

 .tb-share__foot {
  padding-block: 22px;
  background: var(--site-dark);
  color: var(--site-dark-ink);
  font-size: 14px;
 }

 .tb-share__foot-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 24px;
 }
</style>
