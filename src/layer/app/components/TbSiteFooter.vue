<script setup>
 // The site's footer, on the site's dark band (docs/README.md § Header and
 // footer; the data is footerSchema in schema/frames.js). Three layouts:
 // columns of links, everything centered, or one slim row. Around them, a
 // newsletter row, the business's hours, address and phone from Site details,
 // social links, and the small print. The newsletter is words and a link,
 // not a box: forms don't send yet, and a box that swallows an address on a
 // live site is worse than a link.
 //
 // `site.frame.footer` says what to draw: `false` draws nothing, an object is
 // a footer from the Library, in the old shape or the new (footerData), and
 // null or missing turns the site's own menu into footer data, so there's
 // only this one way through. The studio's canvas draws it under the page in
 // Render view, and a published page (pages/[...slug].vue) draws it the same
 // way. Links go through safeHref, and a page on this site through the
 // router, as in the header.
 import { NuxtLink } from '#components';
 import { addressLines, footerData, footerFromSite, groupHours, telHref } from '../../schema/frames.js';

 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[], details?, frame?: { footer } }
 });

 // Drawn from one path each, filled or stroked to suit the mark.
 const NETWORKS = {
  instagram: {
   label: 'Instagram',
   line: true,
   path: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.25 6.75h.01',
  },
  facebook: {
   label: 'Facebook',
   path: 'M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3h2.5V21z',
  },
  x: {
   label: 'X',
   path: 'M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3H8l4.4 5.8zm-1.1 16.2h1.7L7 4.7H5.1z',
  },
  youtube: {
   label: 'YouTube',
   path: 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.5 12a31 31 0 0 0 .5 3.8 3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8zM10 15V9l5.2 3z',
  },
  linkedin: {
   label: 'LinkedIn',
   path: 'M5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3.3 9h3.4v11.5H3.3zM9 9h3.3v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.4v6.4h-3.4v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8H9z',
  },
  tiktok: {
   label: 'TikTok',
   path: 'M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.6-.3-3.9-1.1v5.9c0 3.7-2.7 6.3-6.1 6.3s-6-2.7-6-5.9c0-3.7 3.1-6.4 7-5.8v3.3c-1.9-.4-3.6.7-3.6 2.5 0 1.5 1.1 2.7 2.7 2.7 1.7 0 2.6-1.1 2.6-3V3z',
  },
 };

 const chosen = computed(() => props.site.frame?.footer);
 const footer = computed(() => {
  if (chosen.value === false) return null;
  return footerData(chosen.value && typeof chosen.value === 'object' ? chosen.value : footerFromSite(props.site));
 });
 const name = computed(() => String(props.site.name || props.site.domain || ''));
 const year = new Date().getFullYear();

 // The items without links under them share one column, unheaded; each
 // item with some is a column of those links.
 const columns = computed(() => {
  const items = named(footer.value?.columns).map((item) => ({ ...linked(item), children: item.layout === 'link' ? [] : named(item.children).map(linked) }));
  const loose = items.filter((item) => !item.children.length);
  return [
   ...(loose.length ? [{ heading: '', links: loose }] : []),
   ...items.filter((item) => item.children.length).map((item) => ({ heading: item.label, links: item.children })),
  ];
 });

 const forms = useTimbrrForms();
 const newsletterForm = computed(() => {
  const row = footer.value?.newsletter;
  return row?.on && row.form ? (forms.value[row.form] ?? null) : null;
 });

 const newsletter = computed(() => {
  const row = footer.value?.newsletter;
  if (!row?.on || !(row.headline.trim() || row.label.trim() || newsletterForm.value)) return null;
  return linked(row);
 });

 const social = computed(() =>
  (footer.value?.social ?? [])
   .map((row) => ({ ...NETWORKS[row.network], network: row.network, href: safeHref(row.to) }))
   .filter((row) => row.href),
 );

 // From Site details, each only when its switch is on and there's something
 // to show.
 const details = computed(() => props.site.details ?? null);
 const hours = computed(() => (footer.value?.contact.hours ? groupHours(details.value?.hours) : []));
 const address = computed(() => (footer.value?.contact.address ? addressLines(details.value) : []));
 const phone = computed(() => (footer.value?.contact.phone ? String(details.value?.phone ?? '').trim() : ''));
 const hasContact = computed(() => Boolean(hours.value.length || address.value.length || phone.value));

 const legalLinks = computed(() => named(footer.value?.legal_links).map(linked));
 const legal = computed(() => footer.value?.legal.trim() || `© ${year} ${name.value}`);

 // Items with a label to show; anything else is left out.
 function named(list) {
  return Array.isArray(list) ? list.filter((item) => typeof item?.label === 'string' && item.label.trim()) : [];
 }

 function linked(item) {
  return { ...item, link: linkTo(item) };
 }

 // A page on this site through the router, anything else safe as a plain
 // link, and nowhere to go as just the label (TbSiteHeader's linkTo).
 function linkTo(item) {
  const to = item.kind === 'none' ? undefined : safeHref(item.to);
  if (!to) return { is: 'span' };
  return to.startsWith('/') ? { is: NuxtLink, to } : { is: 'a', href: to };
 }
</script>

<template>
 <footer v-if="footer" class="tb-site-footer" :class="`tb-site-footer--${footer.layout}`">
  <div v-if="newsletter" class="tb-site-footer__newsletter">
   <div class="tb-wrap tb-site-footer__newsletter-row">
    <p v-if="newsletter.headline.trim()" class="tb-site-footer__newsletter-words">{{ newsletter.headline }}</p>
    <TbForm v-if="newsletterForm" :form="newsletterForm" compact class="tb-site-footer__newsletter-form" />
    <component :is="newsletter.link.is" v-else-if="newsletter.label.trim()" :to="newsletter.link.to" :href="newsletter.link.href" class="tb-site-footer__button">{{ newsletter.label }}</component>
   </div>
  </div>

  <div class="tb-wrap tb-site-footer__main" :style="{ '--tb-site-footer-columns': Math.max(1, columns.length) }">
   <div class="tb-site-footer__brand">
    <NuxtLink to="/" class="tb-site-footer__name">{{ name }}</NuxtLink>
    <ul v-if="social.length" class="tb-site-footer__social">
     <li v-for="row in social" :key="row.network + row.href">
      <a class="tb-site-footer__network" :href="row.href" :aria-label="row.label">
       <svg width="18" height="18" viewBox="0 0 24 24" :fill="row.line ? 'none' : 'currentColor'" :stroke="row.line ? 'currentColor' : 'none'" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path :d="row.path" />
       </svg>
      </a>
     </li>
    </ul>
   </div>

   <nav v-if="columns.length" class="tb-site-footer__nav" aria-label="Footer">
    <div v-for="(column, index) in columns" :key="index" class="tb-site-footer__column">
     <p v-if="column.heading && footer.layout !== 'slim'" class="tb-site-footer__heading">{{ column.heading }}</p>
     <ul class="tb-site-footer__links">
      <li v-for="(entry, at) in column.links" :key="at">
       <component :is="entry.link.is" :to="entry.link.to" :href="entry.link.href" class="tb-site-footer__link">{{ entry.label }}</component>
      </li>
     </ul>
    </div>
   </nav>

   <div v-if="hasContact" class="tb-site-footer__contact">
    <div v-if="hours.length">
     <p class="tb-site-footer__heading">Hours</p>
     <dl class="tb-site-footer__hours">
      <div v-for="row in hours" :key="row.days" class="tb-site-footer__hours-row">
       <dt>{{ row.days }}</dt>
       <dd>{{ row.hours }}</dd>
      </div>
     </dl>
    </div>
    <div v-if="address.length">
     <p class="tb-site-footer__heading">Visit</p>
     <address class="tb-site-footer__address">
      <template v-for="(line, index) in address" :key="index">
       {{ line }}<br v-if="index < address.length - 1" />
      </template>
     </address>
    </div>
    <div v-if="phone">
     <p class="tb-site-footer__heading">Call</p>
     <a v-if="telHref(phone)" :href="telHref(phone)" class="tb-site-footer__link">{{ phone }}</a>
     <span v-else>{{ phone }}</span>
    </div>
   </div>
  </div>

  <div class="tb-wrap tb-site-footer__fine">
   <span>{{ legal }}</span>
   <ul v-if="legalLinks.length" class="tb-site-footer__legal-links">
    <li v-for="(entry, index) in legalLinks" :key="index">
     <component :is="entry.link.is" :to="entry.link.to" :href="entry.link.href" class="tb-site-footer__link">{{ entry.label }}</component>
    </li>
   </ul>
   <span class="tb-site-footer__built">Built on Timbrr</span>
  </div>
 </footer>
</template>

<style>
 /* The dark band closing the page: the name in the display face, then the
    links in columns, then a ruled-off line of small print. Every color is
    the dark band's ink mixed down, so it reads on whatever --site-dark is. */
 .tb-site-footer {
  background: var(--site-dark);
  color: color-mix(in srgb, var(--site-dark-ink) 70%, var(--site-muted));
 }

 /* The newsletter: its words and a form, or a button to wherever the sign-up
    lives. */
 .tb-site-footer__newsletter-form {
  flex: 1 1 320px;
  min-width: 0;
  max-width: 460px;
 }

 /* The words around the boxes take the footer's colors; the boxes keep their
    own, which are the page's. */
 .tb-site-footer__newsletter-form .tb-form__label,
 .tb-site-footer__newsletter-form .tb-form__optional,
 .tb-site-footer__newsletter-form .tb-form__consent-row,
 .tb-site-footer__newsletter-form .tb-form__help,
 .tb-site-footer__newsletter-form .tb-form__sent {
  color: inherit;
 }

 .tb-site-footer__newsletter-form .tb-form__error {
  color: inherit;
  font-weight: 600;
 }

 .tb-site-footer__newsletter {
  border-bottom: 1px solid color-mix(in srgb, var(--site-dark-ink) 12%, transparent);
 }

 .tb-site-footer__newsletter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 28px;
  padding-block: 22px;
 }

 .tb-site-footer__newsletter-words {
  flex: 1 1 280px;
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--site-dark-ink);
 }

 .tb-site-footer__button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 10px 16px;
  background: var(--site-dark-ink);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--site-dark);
  text-decoration: none;
  transition: filter 120ms ease;
 }

 a.tb-site-footer__button:hover {
  filter: brightness(0.92);
 }

 .tb-site-footer__main {
  display: flex;
  gap: 28px 40px;
  padding-block: clamp(36px, 5vw, 52px) clamp(28px, 4vw, 36px);
 }

 .tb-site-footer__brand {
  flex: 1.4 1 0;
  min-width: 0;
 }

 .tb-site-footer__name {
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--site-dark-ink);
  text-decoration: none;
  overflow-wrap: anywhere;
 }

 .tb-site-footer__social {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 0 -9px;
  padding: 0;
  list-style: none;
 }

 .tb-site-footer__network {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: inherit;
  transition: color 120ms ease;
 }

 .tb-site-footer__network:hover {
  background: color-mix(in srgb, var(--site-dark-ink) 12%, transparent);
  color: var(--site-dark-ink);
 }

 .tb-site-footer__nav {
  display: flex;
  flex: var(--tb-site-footer-columns, 1) 1 0;
  gap: 24px 32px;
  min-width: 0;
 }

 .tb-site-footer__column {
  flex: 1 1 0;
  min-width: 0;
 }

 .tb-site-footer__heading {
  margin: 0 0 10px;
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--site-eyebrow) 55%, var(--site-dark-ink));
 }

 .tb-site-footer__links {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14.5px;
  line-height: 1.5;
 }

 .tb-site-footer__link {
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: color 120ms ease;
 }

 a.tb-site-footer__link:hover,
 .tb-site-footer__name:hover {
  color: var(--site-dark-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-site-footer a:focus-visible {
  outline: 2px solid var(--site-dark-ink);
  outline-offset: 3px;
  border-radius: 4px;
 }

 /* What Site details has: one more column in the row. */
 .tb-site-footer__contact {
  display: flex;
  flex: 1.2 1 0;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  font-size: 14.5px;
  line-height: 1.5;
 }

 .tb-site-footer__hours {
  display: grid;
  gap: 2px;
  margin: 0;
 }

 .tb-site-footer__hours-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 14px;
 }

 .tb-site-footer__hours dd {
  margin: 0;
 }

 .tb-site-footer__address {
  font-style: normal;
 }

 .tb-site-footer__fine {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 24px;
  border-top: 1px solid color-mix(in srgb, var(--site-dark-ink) 12%, transparent);
  padding-block: 16px 20px;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--site-dark-ink) 62%, var(--site-dark));
 }

 .tb-site-footer__legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-site-footer__built {
  margin-left: auto;
 }

 @media (max-width: 640px) {
  .tb-site-footer__main {
   flex-direction: column;
  }

  .tb-site-footer__brand,
  .tb-site-footer__nav,
  .tb-site-footer__contact {
   flex: none;
  }

  .tb-site-footer__nav {
   flex-wrap: wrap;
  }

  .tb-site-footer__column {
   flex-basis: 140px;
  }

  .tb-site-footer__hours-row {
   justify-content: flex-start;
  }

  .tb-site-footer__built {
   margin-left: 0;
  }
 }

 /* Centered: everything on one axis, down the middle of the band. */
 .tb-site-footer--centered .tb-site-footer__newsletter-row {
  flex-direction: column;
  text-align: center;
 }

 .tb-site-footer--centered .tb-site-footer__newsletter-words {
  flex: none;
 }

 .tb-site-footer--centered .tb-site-footer__main {
  flex-direction: column;
  align-items: center;
  text-align: center;
 }

 .tb-site-footer--centered .tb-site-footer__brand,
 .tb-site-footer--centered .tb-site-footer__nav,
 .tb-site-footer--centered .tb-site-footer__contact {
  flex: none;
 }

 .tb-site-footer--centered .tb-site-footer__social {
  justify-content: center;
  margin-left: 0;
 }

 .tb-site-footer--centered .tb-site-footer__nav {
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px 48px;
  width: 100%;
 }

 .tb-site-footer--centered .tb-site-footer__column {
  flex: 0 1 auto;
 }

 .tb-site-footer--centered .tb-site-footer__contact {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 48px;
 }

 .tb-site-footer--centered .tb-site-footer__hours-row {
  justify-content: center;
 }

 .tb-site-footer--centered .tb-site-footer__fine {
  justify-content: center;
  text-align: center;
 }

 .tb-site-footer--centered .tb-site-footer__built {
  width: 100%;
  margin-left: 0;
 }

 /* Slim: one row, the name and then every link without its heading, over the
    small print with no rule between. Themes restyle this footer with :root
    rules (TbSiteHeader says why that matters); these stay on properties
    themes leave alone. */
 .tb-site-footer--slim .tb-site-footer__main {
  flex-wrap: wrap;
  align-items: center;
  padding-block: 22px 12px;
 }

 .tb-site-footer--slim .tb-site-footer__brand {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px 16px;
 }

 .tb-site-footer--slim .tb-site-footer__social {
  margin: 0;
 }

 .tb-site-footer--slim .tb-site-footer__nav {
  flex: 1 1 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 22px;
 }

 /* Shrinks with the row, so its links wrap instead of running off it. */
 .tb-site-footer--slim .tb-site-footer__column {
  flex: 0 1 auto;
 }

 .tb-site-footer--slim .tb-site-footer__links {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px 22px;
 }

 .tb-site-footer--slim .tb-site-footer__contact {
  flex: 1 0 100%;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 32px;
  font-size: 13.5px;
 }

 .tb-site-footer--slim .tb-site-footer__heading {
  display: none;
 }

 .tb-site-footer--slim .tb-site-footer__hours {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 16px;
 }

 .tb-site-footer--slim .tb-site-footer__fine {
  border-top: 0;
  padding-block: 0 18px;
 }

 @media (max-width: 640px) {
  .tb-site-footer--slim .tb-site-footer__main {
   align-items: flex-start;
  }

  .tb-site-footer--slim .tb-site-footer__nav {
   flex: none;
   justify-content: flex-start;
  }
 }
</style>
