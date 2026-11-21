<script setup>
 // /how-we-count: "How this site counts visits", in the site's own header,
 // footer and look (which come with the home page's read, as on /search).
 // Only on a site with analytics on (a 404 otherwise), and only the things
 // this site collects (utils/how-we-count.js). Indexable like any page; site
 // search never lists it, since the studio's index only holds the site's own
 // pages and entries. The footer links here when the owner turns that on.
 definePageMeta({ layout: false });

 const here = useRequestURL();
 const { site: home, style } = await useTimbrrPage('/');
 if (!home.value.analytics.on) throw createError({ statusCode: 404, statusMessage: 'Page Not Found', message: `Nothing is published at ${HOW_WE_COUNT_PATH}.`, fatal: import.meta.client });
 const site = computed(() => ({ ...home.value, overHero: false }));

 const name = computed(() => site.value.name || site.value.domain || 'this site');
 const counted = computed(() => countedLines(site.value.analytics));
 const kept = computed(() => keptFor(site.value.analytics.retentionDays));
 const email = computed(() => String(site.value.details?.email ?? '').trim());

 const title = computed(() => ['How this site counts visits', site.value.name].filter(Boolean).join(' · '));
 const description = computed(() => `How ${name.value} counts visits: without cookies, and what is and isn't counted.`);
 useHead({ link: [{ rel: 'canonical', href: `${here.origin}${HOW_WE_COUNT_PATH}` }], htmlAttrs: { 'data-tb-p': HOW_WE_COUNT_PATH } });
 useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogUrl: `${here.origin}${HOW_WE_COUNT_PATH}` });
</script>

<template>
 <div class="tb-page" :style="style">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main tb-section tb-count-page">
   <div class="tb-wrap">
    <h1 class="tb-heading tb-count-page__title">How this site counts visits</h1>
    <p class="tb-count-page__lede">{{ name }} counts visits to learn which pages are useful. It does this without cookies, and without anything that names you.</p>

    <section class="tb-count-page__row" aria-labelledby="count-short">
     <h2 id="count-short">The short version</h2>
     <p>Nothing is stored on your phone or computer. No cookie, no ID, no banner to click. The numbers are totals. <b>They count visits, not people's names.</b></p>
    </section>

    <section class="tb-count-page__row" aria-labelledby="count-yes">
     <h2 id="count-yes">What is counted</h2>
     <ul>
      <li v-for="[bold, rest] in counted" :key="bold">
       <span><b>{{ bold }}</b>{{ rest }}</span>
      </li>
     </ul>
    </section>

    <section class="tb-count-page__row tb-count-page__row--no" aria-labelledby="count-no">
     <h2 id="count-no">What is never counted</h2>
     <ul>
      <li><span><b>Who you are.</b> No name, no email, no account.</span></li>
      <li><span><b>Your IP address.</b> It is used for a moment to tell one visit from another that day, and never kept.</span></li>
      <li><span><b>What you send.</b> Answers in this site's forms are not part of the numbers.</span></li>
      <li><span><b>What you type</b>, anywhere on the site.</span></li>
     </ul>
    </section>

    <section class="tb-count-page__row" aria-labelledby="count-dnt">
     <h2 id="count-dnt">If your browser says no</h2>
     <p>If your browser sends <b>Do Not Track</b> or <b>Global Privacy Control</b>, this site sends nothing at all. The counting stops before anything leaves your device.</p>
    </section>

    <section class="tb-count-page__row" aria-labelledby="count-kept">
     <h2 id="count-kept">How long it is kept</h2>
     <p>{{ kept }}. After that it is deleted.</p>
    </section>

    <section class="tb-count-page__row" aria-labelledby="count-who">
     <h2 id="count-who">Who counts</h2>
     <div>
      <p>The counting is done by Timbrr, the service this website runs on, for {{ name }}. The numbers are for {{ name }} to read. They are not sold or used for advertising.</p>
      <p v-if="email" class="tb-count-page__ask">
       Questions? Write to <a :href="`mailto:${email}`">{{ email }}</a>
      </p>
     </div>
    </section>
   </div>
  </main>
  <TbSiteFooter :site="site" />
 </div>
</template>

<style>
 .tb-count-page__title {
  font-size: calc(clamp(34px, 5vw, 56px) * var(--site-heading-scale));
 }

 .tb-count-page__lede {
  max-width: 46em;
  margin: 18px 0 clamp(24px, 4vw, 40px);
  font-size: clamp(18px, 1.6vw, 21px);
  color: var(--site-body);
 }

 .tb-count-page__row {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 12px 40px;
  padding-block: 20px;
  border-top: 1px solid var(--site-border);
  color: var(--site-ink);
 }

 .tb-count-page__row h2 {
  margin: 0;
  font-family: var(--site-font-display);
  font-weight: var(--site-heading-weight);
  font-size: calc(clamp(21px, 2vw, 26px) * var(--site-heading-scale));
  line-height: 1.25;
  letter-spacing: var(--site-heading-tracking);
  color: var(--site-heading);
 }

 .tb-count-page__row p,
 .tb-count-page__row ul {
  max-width: 42em;
  margin: 0;
 }

 .tb-count-page__row ul {
  padding: 0;
  list-style: none;
 }

 .tb-count-page__row li {
  display: flex;
  gap: 14px;
  padding-block: 3px;
 }

 .tb-count-page__row li::before {
  content: '';
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 0.6em;
  border-radius: 50%;
  background: var(--site-accent);
 }

 .tb-count-page__row--no li::before {
  border-radius: 1px;
  background: var(--site-ink);
  transform: rotate(45deg);
 }

 .tb-count-page__row b {
  font-weight: 600;
 }

 .tb-count-page__row .tb-count-page__ask {
  margin-top: 12px;
  font-size: 15px;
  color: var(--site-body);
 }

 .tb-count-page__ask a {
  color: inherit;
 }

 @media (max-width: 720px) {
  .tb-count-page__row {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
