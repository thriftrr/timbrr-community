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
 import { addressLines, footerData, footerFromSite, groupHours, paletteVar, socialLinks, telHref } from '../../schema/frames.js';

 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[], details?, frame?: { footer } }
 });

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

 // The icons come from Site details (FB-122), when the switch is on. A footer
 // not converted yet has no switch and follows its own old list, which is
 // drawn with Site details' until convert-blocks has moved it there.
 const social = computed(() => {
  const legacy = footer.value?.social ?? [];
  if (!(footer.value?.showSocial ?? legacy.length > 0)) return [];
  return socialLinks(props.site.details, legacy)
   .map((row) => ({ ...row, href: safeHref(row.href) }))
   .filter((row) => row.href);
 });

 // The footer's own colors and font, from the palette (FB-123): the band's
 // two colors (--tb-foot-bg and --tb-foot-ink, which start as the dark band's)
 // are set on the footer itself, so every rule under it follows.
 const look = computed(() => {
  const { colors, font } = footer.value?.look ?? { colors: {}, font: '' };
  const style = {};
  if (paletteVar(colors.bg)) style['--tb-foot-bg'] = paletteVar(colors.bg);
  if (paletteVar(colors.ink)) style['--tb-foot-ink'] = paletteVar(colors.ink);
  return { style, font };
 });

 // From Site details, each only when its switch is on and there's something
 // to show.
 const details = computed(() => props.site.details ?? null);
 const hours = computed(() => (footer.value?.contact.hours ? groupHours(details.value?.hours) : []));
 const address = computed(() => (footer.value?.contact.address ? addressLines(details.value) : []));
 const phone = computed(() => (footer.value?.contact.phone ? String(details.value?.phone ?? '').trim() : ''));
 const hasContact = computed(() => Boolean(hours.value.length || address.value.length || phone.value));

 const legalLinks = computed(() => named(footer.value?.legal_links).map(linked));
 const legal = computed(() => footer.value?.legal.trim() || `© ${year} ${name.value}`);

 // The floating button, when it's on and has both words and somewhere to go.
 const floating = computed(() => {
  const row = footer.value?.floating;
  if (!row?.on || !row.label.trim()) return null;
  const link = linkTo(row);
  return link.is === 'span' ? null : { label: row.label, link };
 });

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
 <footer v-if="footer" class="tb-site-footer" :class="[`tb-site-footer--${footer.layout}`, look.font && `tb-site-footer--font-${look.font}`, { 'tb-site-footer--floating': floating }]" :style="look.style">
  <component :is="floating.link.is" v-if="floating" :to="floating.link.to" :href="floating.link.href" class="tb-site-float">{{ floating.label }}</component>
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
  --tb-foot-bg: var(--site-dark);
  --tb-foot-ink: var(--site-dark-ink);
  background: var(--tb-foot-bg);
  color: color-mix(in srgb, var(--tb-foot-ink) 70%, var(--site-muted));
 }

 /* Which of the brand's two text fonts it's set in (look.font). */
 .tb-site-footer--font-display {
  font-family: var(--site-font-display);
 }

 .tb-site-footer--font-body {
  font-family: var(--site-font-body);
 }

 /* The floating button: the brand color in the bottom corner of the screen,
    over the page as it scrolls and clear of a phone's home bar. It sits
    under the header's menus (30 and up). The footer leaves room below its
    small print, so at the end of the page the button covers nothing. */
 .tb-site-float {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 20;
  display: inline-flex;
  align-items: center;
  max-width: calc(100vw - 32px);
  min-height: 48px;
  border-radius: var(--site-control-radius);
  padding: 12px 20px;
  background: var(--site-accent);
  box-shadow: 0 10px 24px -8px rgb(0 0 0 / 0.45);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--site-accent-ink);
  text-decoration: none;
  transition:
   transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
   filter 120ms ease;
 }

 .tb-site-float:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
 }

 .tb-site-float:focus-visible {
  outline: 2px solid var(--site-accent-ink);
  outline-offset: -5px;
 }

 .tb-site-footer--floating {
  padding-bottom: 72px;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-site-float {
   transition: none;
  }

  .tb-site-float:hover {
   transform: none;
  }
 }

 @media print {
  .tb-site-float {
   display: none;
  }
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
  border-bottom: 1px solid color-mix(in srgb, var(--tb-foot-ink) 12%, transparent);
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
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--tb-foot-ink);
 }

 .tb-site-footer__button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: var(--site-control-radius);
  padding: 10px 16px;
  background: var(--tb-foot-ink);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--tb-foot-bg);
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
  font-weight: var(--site-heading-weight);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--tb-foot-ink);
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
  border-radius: var(--site-control-radius);
  color: inherit;
  transition: color 120ms ease;
 }

 .tb-site-footer__network:hover {
  background: color-mix(in srgb, var(--tb-foot-ink) 12%, transparent);
  color: var(--tb-foot-ink);
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
  color: color-mix(in srgb, var(--site-eyebrow) 55%, var(--tb-foot-ink));
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
  color: var(--tb-foot-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-site-footer a:focus-visible {
  outline: 2px solid var(--tb-foot-ink);
  outline-offset: 3px;
  border-radius: calc(var(--site-radius) / 3);
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
  border-top: 1px solid color-mix(in srgb, var(--tb-foot-ink) 12%, transparent);
  padding-block: 16px 20px;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--tb-foot-ink) 62%, var(--tb-foot-bg));
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
