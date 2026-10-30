<script setup>
 // The site's footer, on the site's dark band: its name, the menu as a
 // column of links, and the small print. A menu item with links under it
 // gets a column of its own, headed by its label. The same `site` details
 // as TbSiteHeader (docs/README.md § Header and footer); links go through
 // safeHref, and a page on this site through the router, as in the header.
 // The studio's canvas draws it under the page in Render view, and a
 // published page (pages/[...slug].vue) draws it the same way.
 //
 // A page can have a footer from the Library: `site.frame.footer`. `false`
 // draws nothing; a frame's data replaces the menu with its own columns,
 // can replace the © line with small print of its own, and picks a style
 // (full, or slim: one row, without the headings); null or missing is the
 // site's own menu, as above. The site_footer block draws through here too,
 // so its small print is typed in place.
 import { NuxtLink } from '#components';

 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[], frame?: { footer } }
 });

 const STYLES = ['full', 'slim'];

 const canvas = useCanvas();
 const scope = useBlockScope();
 const shows = useFieldShown();

 const chosen = computed(() => props.site.frame?.footer);
 const frame = computed(() => (chosen.value && typeof chosen.value === 'object' ? chosen.value : null));
 const style = computed(() => (STYLES.includes(frame.value?.style) ? frame.value.style : 'full'));
 const name = computed(() => String(props.site.name || props.site.domain || ''));
 const year = new Date().getFullYear();

 // The frame's small print, with words to show. On the canvas, while the
 // block can be edited, it's always there to type into.
 const typing = computed(() => Boolean(canvas?.editable.value && scope));
 const legal = computed(() => Boolean(frame.value) && (typing.value || shows('legal', frame.value.legal)));

 // The items without links under them share one column, unheaded; each
 // item with some is a column of those links.
 const columns = computed(() => {
  const items = named(frame.value ? frame.value.columns : props.site.nav).map((item) => ({ ...item, link: linkTo(item), children: named(item.children).map((child) => ({ ...child, link: linkTo(child) })) }));
  const loose = items.filter((item) => !item.children.length);
  return [
   ...(loose.length ? [{ heading: '', links: loose }] : []),
   ...items.filter((item) => item.children.length).map((item) => ({ heading: item.label, links: item.children })),
  ];
 });

 // Items with a label to show; anything else is left out.
 function named(list) {
  return Array.isArray(list) ? list.filter((item) => typeof item?.label === 'string' && item.label.trim()) : [];
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
 <footer v-if="chosen !== false" class="tb-site-footer" :class="`tb-site-footer--${style}`">
  <div class="tb-wrap tb-site-footer__main" :style="{ '--tb-site-footer-columns': Math.max(1, columns.length) }">
   <div class="tb-site-footer__brand">
    <NuxtLink to="/" class="tb-site-footer__name">{{ name }}</NuxtLink>
   </div>
   <nav v-if="columns.length" class="tb-site-footer__nav" aria-label="Footer">
    <div v-for="(column, index) in columns" :key="index" class="tb-site-footer__column">
     <p v-if="column.heading && style !== 'slim'" class="tb-site-footer__heading">{{ column.heading }}</p>
     <ul class="tb-site-footer__links">
      <li v-for="(entry, at) in column.links" :key="at">
       <component :is="entry.link.is" :to="entry.link.to" :href="entry.link.href" class="tb-site-footer__link">{{ entry.label }}</component>
      </li>
     </ul>
    </div>
   </nav>
  </div>
  <div class="tb-wrap tb-site-footer__fine">
   <TbText v-if="legal" :data="frame" field="legal" />
   <span v-else>© {{ year }} {{ name }}</span>
   <span>Built on Timbrr</span>
  </div>
 </footer>
</template>

<style>
 /* The dark band closing the page: the name in the display face, then the
    links in columns, then a ruled-off line of small print. */
 .tb-site-footer {
  background: var(--site-dark);
  color: color-mix(in srgb, var(--site-dark-ink) 70%, var(--site-muted));
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

 .tb-site-footer__fine {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 24px;
  border-top: 1px solid color-mix(in srgb, var(--site-dark-ink) 12%, transparent);
  padding-block: 16px 20px;
  font-size: 12.5px;
  color: var(--site-muted);
 }

 @media (max-width: 640px) {
  .tb-site-footer__main {
   flex-direction: column;
  }

  .tb-site-footer__brand,
  .tb-site-footer__nav {
   flex: none;
  }

  .tb-site-footer__nav {
   flex-wrap: wrap;
  }

  .tb-site-footer__column {
   flex-basis: 140px;
  }
 }

 /* Slim, a style a frame can pick: one row, the name and then every link
    without its heading, over the small print with no rule between. Themes
    restyle this footer with :root rules (TbSiteHeader says why that
    matters); these stay on properties themes leave alone. */
 .tb-site-footer--slim .tb-site-footer__main {
  align-items: center;
  padding-block: 22px 12px;
 }

 .tb-site-footer--slim .tb-site-footer__brand {
  flex: none;
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
