<script setup>
 // The site's footer, on the site's dark band: its name, the menu as a
 // column of links, and the small print. A menu item with links under it
 // gets a column of its own, headed by its label. The same `site` details
 // as TbSiteHeader (docs/README.md § Header and footer); links go through
 // safeHref. The studio's canvas draws it under the page in Render view; a
 // site's own layout can put it on every page.
 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[] }
 });

 const name = computed(() => String(props.site.name || props.site.domain || ''));
 const year = new Date().getFullYear();

 // The items without links under them share one column, unheaded; each
 // item with some is a column of those links.
 const columns = computed(() => {
  const items = named(props.site.nav).map((item) => ({ ...item, children: named(item.children) }));
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

 function href(item) {
  return item.kind === 'none' ? undefined : safeHref(item.to);
 }
</script>

<template>
 <footer class="tb-site-footer">
  <div class="tb-wrap tb-site-footer__main" :style="{ '--tb-site-footer-columns': Math.max(1, columns.length) }">
   <div class="tb-site-footer__brand">
    <a href="/" class="tb-site-footer__name">{{ name }}</a>
   </div>
   <nav v-if="columns.length" class="tb-site-footer__nav" aria-label="Footer">
    <div v-for="(column, index) in columns" :key="index" class="tb-site-footer__column">
     <p v-if="column.heading" class="tb-site-footer__heading">{{ column.heading }}</p>
     <ul class="tb-site-footer__links">
      <li v-for="(link, at) in column.links" :key="at">
       <component :is="href(link) ? 'a' : 'span'" :href="href(link)" class="tb-site-footer__link">{{ link.label }}</component>
      </li>
     </ul>
    </div>
   </nav>
  </div>
  <div class="tb-wrap tb-site-footer__fine">
   <span>© {{ year }} {{ name }}</span>
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
</style>
