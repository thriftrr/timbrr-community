<script setup>
 // The site's header: its name (a link home), the menu, and a button when
 // the site has one. On a narrow screen the menu folds behind a Menu
 // button, a <details>, so it opens without any script. The details come
 // in one `site` object (docs/README.md § Header and footer); menu items
 // are NavItems, `{ label, kind, to, children?, layout?, desc? }`, and an
 // item with children opens a list under it (or, laid out 'mega', a panel
 // of cards) when the pointer or the keyboard gets there. Links go through
 // safeHref. The studio's canvas draws it over the page in Render view; a
 // site's own layout can put it on every page.
 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[], cta?: NavItem }
 });

 const name = computed(() => String(props.site.name || props.site.domain || ''));
 const items = computed(() => named(props.site.nav).map((item) => ({ ...item, children: named(item.children) })));
 const cta = computed(() => named([props.site.cta])[0] ?? null);

 // Items with a label to show; anything else is left out.
 function named(list) {
  return Array.isArray(list) ? list.filter((item) => typeof item?.label === 'string' && item.label.trim()) : [];
 }

 // Where an item goes: nowhere for a heading-only item, else its address
 // when it's one a visitor can safely follow.
 function href(item) {
  return item.kind === 'none' ? undefined : safeHref(item.to);
 }
</script>

<template>
 <header class="tb-site-header">
  <div class="tb-wrap tb-site-header__bar">
   <a href="/" class="tb-site-header__name">{{ name }}</a>

   <nav v-if="items.length" class="tb-site-header__nav" aria-label="Main">
    <ul class="tb-site-header__links">
     <li v-for="(item, index) in items" :key="index" class="tb-site-header__item">
      <component :is="href(item) ? 'a' : 'span'" :href="href(item)" class="tb-site-header__link">
       {{ item.label }}<span v-if="item.children.length" class="tb-site-header__caret" aria-hidden="true">▾</span>
      </component>
      <ul v-if="item.children.length" class="tb-site-header__panel" :class="{ 'tb-site-header__panel--mega': item.layout === 'mega' }">
       <li v-for="(child, at) in item.children" :key="at">
        <component :is="href(child) ? 'a' : 'span'" :href="href(child)" class="tb-site-header__sublink">
         <span class="tb-site-header__sublabel">{{ child.label }}</span>
         <span v-if="item.layout === 'mega' && child.desc" class="tb-site-header__desc">{{ child.desc }}</span>
        </component>
       </li>
      </ul>
     </li>
    </ul>
   </nav>

   <a v-if="cta" :href="href(cta)" class="tb-site-header__cta">{{ cta.label }}</a>

   <details v-if="items.length || cta" class="tb-site-header__menu">
    <summary class="tb-site-header__toggle">
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path class="tb-site-header__bars" d="M4 7h16M4 12h16M4 17h16" />
      <path class="tb-site-header__cross" d="M6 6l12 12M18 6L6 18" />
     </svg>
     <span class="tb-site-header__when-shut">Menu</span>
     <span class="tb-site-header__when-open">Close</span>
    </summary>
    <div class="tb-site-header__sheet">
     <nav v-if="items.length" aria-label="Main">
      <ul class="tb-site-header__stack">
       <li v-for="(item, index) in items" :key="index">
        <component :is="href(item) ? 'a' : 'span'" :href="href(item)" class="tb-site-header__row">{{ item.label }}</component>
        <ul v-if="item.children.length" class="tb-site-header__substack">
         <li v-for="(child, at) in item.children" :key="at">
          <component :is="href(child) ? 'a' : 'span'" :href="href(child)" class="tb-site-header__subrow">{{ child.label }}</component>
         </li>
        </ul>
       </li>
      </ul>
     </nav>
     <a v-if="cta" :href="href(cta)" class="tb-site-header__cta tb-site-header__cta--wide">{{ cta.label }}</a>
    </div>
   </details>
  </div>
 </header>
</template>

<style>
 /* A bar across the top of the page on the page's own background, ruled
    off from what's under it: the name on the left in the display face, the
    menu and the button on the right. */
 .tb-site-header {
  position: relative;
  border-bottom: 1px solid var(--site-border);
  background: var(--site-bg);
 }

 .tb-site-header__bar {
  display: flex;
  align-items: center;
  gap: 12px 28px;
  min-height: 68px;
  padding-block: 12px;
 }

 .tb-site-header__name {
  margin-right: auto;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--site-heading);
  text-decoration: none;
  overflow-wrap: anywhere;
 }

 .tb-site-header__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px 26px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-site-header__item {
  position: relative;
 }

 .tb-site-header__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding-block: 6px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--site-body);
  text-decoration: none;
  transition: color 120ms ease;
 }

 a.tb-site-header__link:hover,
 .tb-site-header__item:hover > .tb-site-header__link {
  color: var(--site-heading);
 }

 .tb-site-header__caret {
  font-size: 10px;
  color: var(--site-muted);
 }

 .tb-site-header__cta {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 9px 15px;
  background: var(--site-accent);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--site-accent-ink);
  text-decoration: none;
  white-space: nowrap;
  transition: filter 120ms ease;
 }

 .tb-site-header__cta:hover {
  filter: brightness(0.94);
 }

 .tb-site-header a:focus-visible,
 .tb-site-header__toggle:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
  border-radius: 4px;
 }

 .tb-site-header__cta:focus-visible {
  border-radius: 8px;
 }

 /* An item's own links: a list under it, or with the 'mega' layout a
    panel of cards with a line about each. Drawn but see-through until the
    pointer or the keyboard reaches the item, so Tab can walk into it. */
 .tb-site-header__panel {
  position: absolute;
  top: 100%;
  right: -12px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: 10px;
  padding: 6px;
  background: var(--site-bg);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--site-heading) 12%, transparent);
  list-style: none;
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition:
   opacity 120ms ease,
   transform 120ms ease;
 }

 .tb-site-header__item:hover > .tb-site-header__panel,
 .tb-site-header__item:focus-within > .tb-site-header__panel {
  opacity: 1;
  pointer-events: auto;
  transform: none;
 }

 .tb-site-header__sublink {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--site-heading);
  text-decoration: none;
 }

 a.tb-site-header__sublink:hover {
  background: var(--site-surface);
 }

 .tb-site-header__panel--mega {
  display: grid;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
  gap: 10px;
  padding: 12px;
 }

 .tb-site-header__panel--mega .tb-site-header__sublink {
  height: 100%;
  border: 1px solid var(--site-border);
  border-radius: 10px;
  padding: 13px 14px;
 }

 .tb-site-header__desc {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--site-body);
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-site-header__panel {
   transform: none;
   transition: none;
  }
 }

 /* Narrow screens: the name and a Menu button; the menu and the button
    drop down under the bar when it's open. */
 .tb-site-header__menu {
  display: none;
 }

 .tb-site-header__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--site-heading);
  list-style: none;
  cursor: pointer;
  user-select: none;
 }

 .tb-site-header__toggle::-webkit-details-marker {
  display: none;
 }

 .tb-site-header__menu[open] > .tb-site-header__toggle {
  background: var(--site-surface);
 }

 .tb-site-header__cross,
 .tb-site-header__when-open,
 .tb-site-header__menu[open] .tb-site-header__bars,
 .tb-site-header__menu[open] .tb-site-header__when-shut {
  display: none;
 }

 .tb-site-header__menu[open] .tb-site-header__cross,
 .tb-site-header__menu[open] .tb-site-header__when-open {
  display: inline;
 }

 .tb-site-header__sheet {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 30;
  border-bottom: 1px solid var(--site-border);
  padding: 4px var(--site-gutter) 20px;
  background: var(--site-bg);
  box-shadow: 0 14px 24px color-mix(in srgb, var(--site-heading) 10%, transparent);
 }

 .tb-site-header__stack,
 .tb-site-header__substack {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-site-header__stack > li + li {
  border-top: 1px solid var(--site-border);
 }

 .tb-site-header__row {
  display: block;
  padding-block: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--site-heading);
  text-decoration: none;
 }

 .tb-site-header__substack {
  padding: 0 0 10px 14px;
 }

 .tb-site-header__subrow {
  display: block;
  padding-block: 6px;
  font-size: 15px;
  color: var(--site-body);
  text-decoration: none;
 }

 .tb-site-header__cta--wide {
  display: flex;
  margin-top: 12px;
  padding-block: 12px;
  font-size: 15px;
 }

 @media (max-width: 720px) {
  .tb-site-header__bar {
   min-height: 60px;
  }

  .tb-site-header__name {
   font-size: 18px;
  }

  .tb-site-header__nav,
  .tb-site-header__bar > .tb-site-header__cta {
   display: none;
  }

  .tb-site-header__menu {
   display: block;
  }
 }
</style>
