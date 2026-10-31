<script setup>
 // The site's header, the one component that draws one (docs/README.md §
 // Header and footer; the data is headerSchema in schema/frames.js). Three
 // rows, an announcement, small utility links and the bar, in three layouts:
 // the logo left beside the menu, the logo centered over it, or the logo and
 // a button with the whole menu behind a Menu toggle.
 //
 // `site.frame.header` says what to draw: `false` draws nothing, an object is
 // a header from the Library, in the old shape or the new (headerData), and
 // null or missing turns the site's own menu and button into header data, so
 // there's only this one way through. The studio's canvas draws it over the
 // page in Render view, a published page (pages/[...slug].vue) draws it the
 // same way, and on the Library's stage (TbFrameStage) it runs live.
 //
 // A menu item opens by hover, focus or click. Hover and focus open it
 // loosely and it goes when they leave; a click pins it, and a second click,
 // Escape or a click elsewhere shuts it. That split is what stops a click
 // from shutting the menu its own hover or focus just opened. On a phone the
 // menu is one <details> with one nested <details> per item, so it opens
 // with no script at all.
 //
 // The header itself is `.tb-site-header`, so a theme's rules keep reaching
 // what they always did. The shell around it is the one root element: it's
 // what sticks, and a see-through header's shell takes up no room, so the
 // hero runs up behind the header.
 import { NuxtLink } from '#components';
 import { headerData, headerFromSite, megaColumns, telHref } from '../../schema/frames.js';

 const props = defineProps({
  site: { type: Object, required: true }, // { name, domain, nav: NavItem[], cta?: NavItem, details?, overHero?, frame?: { header } }
 });

 const uid = useId();
 const bar = ref(null); // the header
 const sheet = ref(null); // the phone menu or the overlay, a <details>
 const live = ref(false); // true once the page's script is running
 const open = ref(null); // the index of the open menu item
 const pinned = ref(null); // the one a click opened
 const sheetOpen = ref(false);
 const scrolled = ref(false);
 const hidden = ref(false); // scrolled away, with sticky set to 'up'

 const chosen = computed(() => props.site.frame?.header);
 const header = computed(() => {
  if (chosen.value === false) return null;
  return headerData(chosen.value && typeof chosen.value === 'object' ? chosen.value : headerFromSite(props.site));
 });
 const layout = computed(() => header.value?.layout);
 const name = computed(() => String(props.site.name || props.site.domain || ''));
 const logo = computed(() => {
  const image = header.value?.logo;
  const src = safeSrc(image?.src);
  if (!src) return null;
  return { src, alt: image.alt || name.value, width: image.width, height: image.height, srcset: image.width ? mediaSrcset(src, image.width) : '' };
 });

 const items = computed(() =>
  named(header.value?.menu).map((item) => {
   const children = item.layout === 'link' ? [] : named(item.children).map(linked);
   const kind = !children.length ? 'link' : item.layout === 'mega' ? 'mega' : 'dropdown';
   return { ...linked(item), kind, children, columns: kind === 'mega' ? megaColumns(children) : [] };
  }),
 );
 const announce = computed(() => {
  const notice = header.value?.announce;
  return notice?.on && notice.text.trim() ? linked(notice) : null;
 });
 const utility = computed(() => (header.value?.utility.on ? named(header.value.utility.links).map(linked) : []));
 const primary = computed(() => button(header.value?.primary));
 const secondary = computed(() => button(header.value?.secondary));

 const phone = computed(() => String(props.site.details?.phone ?? '').trim());
 const dial = computed(() => telHref(phone.value));
 const icons = computed(() => {
  const set = header.value?.icons;
  if (!set) return [];
  return [
   set.search.on && { key: 'search', label: 'Search', link: linkTo(set.search) },
   set.account.on && { key: 'account', text: 'Sign in', link: linkTo(set.account) },
   set.cart.on && { key: 'cart', label: 'Cart', link: linkTo(set.cart) },
   set.phone.on && phone.value && { key: 'phone', text: phone.value, link: linkTo({ to: dial.value }) },
   set.language.on && { key: 'language', text: set.language.label.trim() || 'EN', link: linkTo(set.language) },
  ].filter(Boolean);
 });

 // What stays on the bar on a phone. The button layout always has its button
 // up there, so only the other two pin.
 const pins = computed(() => {
  const wanted = header.value?.phone.pins;
  if (!wanted) return {};
  return {
   phone: wanted.phone && dial.value ? linkTo({ to: dial.value }) : null,
   cart: wanted.cart ? linkTo(header.value.icons.cart) : null,
   button: wanted.button && layout.value !== 'button' ? primary.value : null,
  };
 });
 const anyPin = computed(() => Boolean(pins.value.phone || pins.value.cart || pins.value.button));

 // Icons have no place of their own on a phone's bar, so what isn't pinned
 // there goes in the menu with the utility links.
 const menuIcons = computed(() => icons.value.filter((icon) => !pins.value[icon.key]));
 const hasMenu = computed(() => Boolean(items.value.length || utility.value.length || secondary.value || menuIcons.value.length || (primary.value && layout.value !== 'button')));

 // Too much for the bar: it gives way to the phone menu sooner. The sum is
 // the studio's nudge about a crowded bar.
 const crowded = computed(() => {
  if (layout.value !== 'left') return false;
  const words = [...items.value.map((item) => item.label), primary.value?.label ?? '', secondary.value?.label ?? ''];
  return words.join('').length + icons.value.length * 4 > 70;
 });

 const seeThrough = computed(() => Boolean(header.value?.transparent && props.site.overHero));
 const clear = computed(() => seeThrough.value && !scrolled.value && open.value === null && !sheetOpen.value);
 const away = computed(() => header.value?.sticky === 'up' && hidden.value && open.value === null && !sheetOpen.value);
 // A see-through header stuck over the page would be light words on light
 // paper with no script to turn it solid, so it only sticks once there is one.
 const sticks = computed(() => header.value && header.value.sticky !== 'never' && (!seeThrough.value || live.value));

 // Items with a label to show; anything else is left out.
 function named(list) {
  return Array.isArray(list) ? list.filter((item) => typeof item?.label === 'string' && item.label.trim()) : [];
 }

 function linked(item) {
  return { ...item, link: linkTo(item) };
 }

 function button(value) {
  return value?.label.trim() ? linked(value) : null;
 }

 // How an item links. A page on this site goes through the router, so
 // moving between pages doesn't load the site again; anything else a
 // visitor can safely follow (another site, mail, a phone, a spot on this
 // page) is a plain link; a heading-only item, or an address safeHref
 // turns down, is just its label. On the canvas none of them go anywhere.
 function linkTo(item) {
  const to = item.kind === 'none' ? undefined : safeHref(item.to);
  if (!to) return { is: 'span' };
  return to.startsWith('/') ? { is: NuxtLink, to } : { is: 'a', href: to };
 }

 // ── The bar's menus ──

 let leaving; // the timer that shuts a loose menu after the pointer left it
 let quiet = false; // true while focus goes back to an opener on Escape

 function shut() {
  clearTimeout(leaving);
  open.value = null;
  pinned.value = null;
 }

 function pointerIn(event, index) {
  if (event.pointerType === 'touch' || items.value[index]?.kind === 'link') return;
  clearTimeout(leaving);
  if (pinned.value !== index) pinned.value = null;
  open.value = index;
 }

 // A moment's grace, for a pointer crossing the gap down to the panel.
 function pointerOut(event, index) {
  if (event.pointerType === 'touch' || pinned.value === index) return;
  clearTimeout(leaving);
  leaving = setTimeout(() => {
   if (open.value === index && pinned.value !== index) open.value = null;
  }, 180);
 }

 function focusIn(index) {
  if (quiet || items.value[index]?.kind === 'link') return;
  clearTimeout(leaving);
  if (pinned.value !== index) pinned.value = null;
  open.value = index;
 }

 // Only when focus went somewhere else on the page: a press on a bare part of
 // the panel takes it nowhere, and that's no reason to shut it.
 function focusOut(event, index) {
  const to = event.relatedTarget;
  if (open.value === index && to && !event.currentTarget.contains(to)) shut();
 }

 function press(index) {
  if (pinned.value === index) {
   shut();
   return;
  }
  clearTimeout(leaving);
  open.value = index;
  pinned.value = index;
 }

 // ── The phone menu and the overlay ──

 function sheetToggled(event) {
  const details = event.target;
  sheetOpen.value = details.open;
  if (details.open) {
   details.style.setProperty('--tb-sheet-top', `${Math.ceil(bar.value.getBoundingClientRect().bottom)}px`);
   return;
  }
  for (const fold of details.querySelectorAll('details[open]')) fold.open = false;
 }

 // Step-through's Back: shut the item this panel belongs to, and go back to
 // it, since Back itself has just gone.
 function back(event) {
  const fold = event.currentTarget.closest('details');
  fold.open = false;
  fold.querySelector('summary').focus();
 }

 // ── Closing, from anywhere ──

 function onClick(event) {
  if (!event.target.closest?.('a')) return;
  shut();
  if (sheet.value) sheet.value.open = false;
 }

 function onPress(event) {
  if (!event.target.closest?.('.tb-site-header__item.is-open')) shut();
  if (sheet.value?.open && !bar.value?.contains(event.target)) sheet.value.open = false;
 }

 function onKey(event) {
  if (event.key !== 'Escape') return;
  const item = bar.value?.querySelector('.tb-site-header__item.is-open');
  if (item?.contains(document.activeElement)) {
   quiet = true;
   item.querySelector('button')?.focus();
   quiet = false;
  }
  shut();
  if (sheet.value?.open) {
   const inside = sheet.value.contains(document.activeElement);
   sheet.value.open = false;
   if (inside) sheet.value.querySelector('summary').focus();
  }
 }

 // ── Following the page ──

 let lastY = 0;

 function onScroll() {
  const y = Math.max(0, window.scrollY);
  scrolled.value = y > 30;
  const moved = y - lastY;
  if (Math.abs(moved) < 4) return; // a phone's jitter isn't a change of direction
  hidden.value = moved > 0 && y > 90;
  lastY = y;
 }

 function follow(on) {
  window.removeEventListener('scroll', onScroll);
  if (!on) return;
  lastY = Math.max(0, window.scrollY);
  scrolled.value = lastY > 30;
  window.addEventListener('scroll', onScroll, { passive: true });
 }

 // A hero that bleeds up behind the header needs to know how tall it is.
 let sizes;

 function measure(on) {
  sizes?.disconnect();
  sizes = null;
  const rootStyle = document.documentElement.style;
  if (!on || !bar.value) {
   rootStyle.removeProperty('--tb-header-height');
   return;
  }
  const el = bar.value;
  sizes = new ResizeObserver(() => rootStyle.setProperty('--tb-header-height', `${el.offsetHeight}px`));
  sizes.observe(el);
 }

 onMounted(() => {
  live.value = true;
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onPress);
  // The stage changes all of these as the panel is edited.
  watch(() => header.value?.sticky === 'up' || seeThrough.value, follow, { immediate: true });
  watch(seeThrough, measure, { immediate: true, flush: 'post' });
 });

 onBeforeUnmount(() => {
  clearTimeout(leaving);
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('pointerdown', onPress);
  follow(false);
  measure(false);
 });
</script>

<template>
 <div v-if="header" class="tb-site-header-shell" :class="{ 'is-sticky': sticks, 'is-through': seeThrough }">
  <header
   ref="bar"
   class="tb-site-header"
   :class="[`tb-site-header--${layout}`, `tb-site-header--phone-${header.phone.style}`, { 'is-live': live, 'is-clear': clear, 'is-away': away, 'is-crowded': crowded }]"
   @click="onClick"
   @focusin="hidden = false"
  >
   <div v-if="announce" class="tb-site-header__notice">
    <component :is="announce.link.is" :to="announce.link.to" :href="announce.link.href" class="tb-wrap tb-site-header__notice-text">{{ announce.text }}</component>
   </div>

   <nav v-if="utility.length" class="tb-site-header__utility" aria-label="Utility">
    <ul class="tb-wrap tb-site-header__utility-links">
     <li v-for="(entry, index) in utility" :key="index">
      <component :is="entry.link.is" :to="entry.link.to" :href="entry.link.href" class="tb-site-header__utility-link">{{ entry.label }}</component>
     </li>
    </ul>
   </nav>

   <div class="tb-wrap tb-site-header__bar">
    <NuxtLink to="/" class="tb-site-header__name">
     <img v-if="logo" class="tb-site-header__logo" :src="logo.src" :alt="logo.alt" :width="logo.width" :height="logo.height" :srcset="logo.srcset || undefined" :sizes="logo.srcset ? '200px' : undefined" />
     <template v-else>{{ name }}</template>
    </NuxtLink>

    <nav v-if="layout !== 'button' && items.length" class="tb-site-header__nav" aria-label="Main">
     <ul class="tb-site-header__links">
      <li
       v-for="(item, index) in items"
       :key="index"
       class="tb-site-header__item"
       :class="{ 'is-open': open === index, 'tb-site-header__item--mega': item.kind === 'mega' }"
       @pointerenter="pointerIn($event, index)"
       @pointerleave="pointerOut($event, index)"
       @focusin="focusIn(index)"
       @focusout="focusOut($event, index)"
      >
       <component :is="item.link.is" v-if="item.kind === 'link'" :to="item.link.to" :href="item.link.href" class="tb-site-header__link">{{ item.label }}</component>
       <button v-else type="button" class="tb-site-header__link" :aria-expanded="open === index" :aria-controls="`${uid}-${index}`" @click="press(index)">
        {{ item.label }}<span class="tb-site-header__caret" aria-hidden="true">▾</span>
       </button>

       <ul v-if="item.kind === 'dropdown'" :id="`${uid}-${index}`" class="tb-site-header__panel">
        <li v-if="item.link.is !== 'span'">
         <component :is="item.link.is" :to="item.link.to" :href="item.link.href" class="tb-site-header__sublink tb-site-header__sublink--all">All {{ item.label }}</component>
        </li>
        <li v-for="(child, at) in item.children" :key="at">
         <component :is="child.link.is" :to="child.link.to" :href="child.link.href" class="tb-site-header__sublink">
          <span class="tb-site-header__sublabel">{{ child.label }}</span>
         </component>
        </li>
       </ul>

       <div v-else-if="item.kind === 'mega'" :id="`${uid}-${index}`" class="tb-site-header__panel tb-site-header__panel--mega">
        <div class="tb-wrap">
         <component :is="item.link.is" :to="item.link.to" :href="item.link.href" class="tb-site-header__mega-title">{{ item.label }}</component>
         <div class="tb-site-header__mega-columns" :style="{ '--tb-mega-columns': item.columns[0].title ? Math.min(4, item.columns.length) : 3 }">
          <div v-for="(column, at) in item.columns" :key="at">
           <p v-if="column.title" class="tb-site-header__mega-heading">{{ column.title }}</p>
           <ul class="tb-site-header__mega-links">
            <li v-for="(child, row) in column.links" :key="row">
             <component :is="child.link.is" :to="child.link.to" :href="child.link.href" class="tb-site-header__sublink">
              <span class="tb-site-header__sublabel">{{ child.label }}</span>
              <span v-if="child.desc" class="tb-site-header__desc">{{ child.desc }}</span>
             </component>
            </li>
           </ul>
          </div>
         </div>
        </div>
       </div>
      </li>
     </ul>
    </nav>

    <div v-if="layout !== 'button' && icons.length" class="tb-site-header__icons">
     <component :is="icon.link.is" v-for="icon in icons" :key="icon.key" :to="icon.link.to" :href="icon.link.href" class="tb-site-header__icon" :aria-label="icon.label">
      <svg v-if="icon.key === 'search'" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
       <circle cx="7" cy="7" r="5" />
       <path d="M11 11l3.5 3.5" />
      </svg>
      <svg v-else-if="icon.key === 'cart'" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
       <rect x="2.5" y="5" width="11" height="9.5" rx="1.5" />
       <path d="M5.5 5V4a2.5 2.5 0 0 1 5 0v1" />
      </svg>
      <template v-else>{{ icon.text }}</template>
     </component>
    </div>

    <div v-if="primary || (secondary && layout !== 'button')" class="tb-site-header__buttons">
     <component :is="secondary.link.is" v-if="secondary && layout !== 'button'" :to="secondary.link.to" :href="secondary.link.href" class="tb-site-header__cta tb-site-header__cta--outline">{{ secondary.label }}</component>
     <component :is="primary.link.is" v-if="primary" :to="primary.link.to" :href="primary.link.href" class="tb-site-header__cta">{{ primary.label }}</component>
    </div>

    <div v-if="anyPin" class="tb-site-header__pins">
     <component :is="pins.phone.is" v-if="pins.phone" :to="pins.phone.to" :href="pins.phone.href" class="tb-site-header__pin">Call</component>
     <component :is="pins.cart.is" v-if="pins.cart" :to="pins.cart.to" :href="pins.cart.href" class="tb-site-header__pin" aria-label="Cart">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
       <rect x="2.5" y="5" width="11" height="9.5" rx="1.5" />
       <path d="M5.5 5V4a2.5 2.5 0 0 1 5 0v1" />
      </svg>
     </component>
     <component :is="pins.button.link.is" v-if="pins.button" :to="pins.button.link.to" :href="pins.button.link.href" class="tb-site-header__cta tb-site-header__cta--pin">{{ pins.button.label }}</component>
    </div>

    <details v-if="hasMenu" ref="sheet" class="tb-site-header__menu" @toggle="sheetToggled">
     <summary class="tb-site-header__toggle">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
       <path class="tb-site-header__bars" d="M4 7h16M4 12h16M4 17h16" />
       <path class="tb-site-header__cross" d="M6 6l12 12M18 6L6 18" />
      </svg>
      <span class="tb-site-header__when-shut">Menu</span>
      <span class="tb-site-header__when-open">Close</span>
     </summary>
     <div class="tb-site-header__sheet">
      <div class="tb-site-header__sheet-body">
       <div class="tb-site-header__sheet-scroll">
        <nav v-if="items.length" aria-label="Main">
         <ul v-if="layout === 'button'" class="tb-site-header__overlay">
          <li v-for="(item, index) in items" :key="index">
           <component :is="item.link.is" :to="item.link.to" :href="item.link.href" class="tb-site-header__overlay-link">{{ item.label }}</component>
           <ul v-if="item.children.length" class="tb-site-header__substack">
            <li v-for="(child, at) in item.children" :key="at">
             <component :is="child.link.is" :to="child.link.to" :href="child.link.href" class="tb-site-header__subrow">{{ child.label }}</component>
            </li>
           </ul>
          </li>
         </ul>

         <ul v-else class="tb-site-header__stack">
          <li v-for="(item, index) in items" :key="index">
           <component :is="item.link.is" v-if="item.kind === 'link'" :to="item.link.to" :href="item.link.href" class="tb-site-header__row">{{ item.label }}</component>
           <details v-else class="tb-site-header__fold" :name="uid">
            <summary class="tb-site-header__row">{{ item.label }}</summary>
            <div class="tb-site-header__drawer">
             <button type="button" class="tb-site-header__back" @click="back">
              <span aria-hidden="true">‹</span>
              Back
             </button>
             <p class="tb-site-header__drawer-title">{{ item.label }}</p>
             <ul class="tb-site-header__substack">
              <li v-if="item.link.is !== 'span'">
               <component :is="item.link.is" :to="item.link.to" :href="item.link.href" class="tb-site-header__subrow tb-site-header__subrow--all">All {{ item.label }}</component>
              </li>
              <li v-for="(child, at) in item.children" :key="at">
               <component :is="child.link.is" :to="child.link.to" :href="child.link.href" class="tb-site-header__subrow">
                {{ child.label }}
                <span v-if="item.kind === 'mega' && child.desc" class="tb-site-header__desc">{{ child.desc }}</span>
               </component>
              </li>
             </ul>
            </div>
           </details>
          </li>
         </ul>
        </nav>
       </div>
      </div>

      <div v-if="utility.length || menuIcons.length || secondary || (primary && layout !== 'button')" class="tb-site-header__sheet-foot">
       <ul v-if="utility.length || menuIcons.length" class="tb-site-header__sheet-links">
        <li v-for="(entry, index) in utility" :key="index">
         <component :is="entry.link.is" :to="entry.link.to" :href="entry.link.href" class="tb-site-header__sheet-link">{{ entry.label }}</component>
        </li>
        <li v-for="icon in menuIcons" :key="icon.key">
         <component :is="icon.link.is" :to="icon.link.to" :href="icon.link.href" class="tb-site-header__sheet-link">{{ icon.text ?? icon.label }}</component>
        </li>
       </ul>
       <component :is="secondary.link.is" v-if="secondary" :to="secondary.link.to" :href="secondary.link.href" class="tb-site-header__cta tb-site-header__cta--outline tb-site-header__cta--wide">{{ secondary.label }}</component>
       <component :is="primary.link.is" v-if="primary && layout !== 'button'" :to="primary.link.to" :href="primary.link.href" class="tb-site-header__cta tb-site-header__cta--wide">{{ primary.label }}</component>
      </div>
     </div>
    </details>
   </div>
  </header>
 </div>
</template>

<style>
 /* Themes: a site restyles this header with :root rules, which outrank a
    single class and tie with two, and component styles load in no fixed
    order. So a rule here that must beat a theme's takes three (:root and two
    classes), and the rest stay on properties themes leave alone. */

 /* The shell is what sticks, and it holds the header above the page's
    blocks. A see-through header takes up no room in it, so the hero runs up
    behind; --tb-header-height tells the hero how much to pad for it. */
 .tb-site-header-shell {
  position: relative;
  z-index: 40;
 }

 .tb-site-header-shell.is-sticky {
  position: sticky;
  top: 0;
 }

 .tb-site-header-shell.is-through {
  flex: none;
  height: 0;
 }

 .tb-site-header-shell.is-through > .tb-site-header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
 }

 /* In the canvas's Render view, the locked wrapper around a see-through
    header keeps a box the header's size, so the note still shows under the
    pointer. */
 .tb-canvas__chrome:has(> .tb-site-header-shell.is-through) {
  z-index: 1;
  height: var(--tb-header-height, 0);
  margin-bottom: calc(-1 * var(--tb-header-height, 0px));
 }

 /* Inside the canvas's own wrappers the shade, the note and a block's tab go
    over the header, and nothing there needs to hang over the page. */
 .tb-canvas__chrome > .tb-site-header-shell,
 .tb-frame > .tb-site-header-shell {
  z-index: auto;
 }

 /* A bar across the top of the page on the page's own background, ruled off
    from what's under it. */
 .tb-site-header {
  position: relative;
  border-bottom: 1px solid var(--site-border);
  background: var(--site-bg);
  transition:
   background-color 200ms ease,
   border-color 200ms ease,
   transform 250ms ease;
 }

 .tb-site-header.is-away {
  transform: translateY(-110%);
 }

 /* See-through: the bar and the utility row in the dark band's ink, over the
    hero. Written on the variables, so everything in them follows. An open
    menu always turns it solid, and that holds with no script too. */
 :root .tb-site-header.is-clear:not(:has(.tb-site-header__menu[open])) {
  border-bottom-color: color-mix(in srgb, var(--site-dark-ink) 18%, transparent);
  background: transparent;
 }

 .tb-site-header.is-clear:not(:has(.tb-site-header__menu[open])) :is(.tb-site-header__bar, .tb-site-header__utility) {
  --site-accent: var(--site-dark-ink);
  --site-accent-ink: var(--site-dark);
  --site-heading: var(--site-dark-ink);
  --site-body: var(--site-dark-ink);
  --site-muted: color-mix(in srgb, var(--site-dark-ink) 75%, transparent);
  --site-border: color-mix(in srgb, var(--site-dark-ink) 30%, transparent);
  --site-surface: color-mix(in srgb, var(--site-dark-ink) 12%, transparent);
 }

 /* The announcement: one line in the brand color, linked if it has an
    address. */
 .tb-site-header__notice {
  padding-block: 7px;
  background: var(--site-accent);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  color: var(--site-accent-ink);
 }

 .tb-site-header__notice-text {
  display: block;
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 a.tb-site-header__notice-text {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 /* The utility row: a few small links over the bar. */
 .tb-site-header__utility {
  border-bottom: 1px solid var(--site-border);
 }

 .tb-site-header__utility-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 2px 18px;
  margin-block: 0;
  padding-block: 6px;
  padding-inline: 0;
  list-style: none;
 }

 .tb-site-header__utility-link {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--site-muted);
  text-decoration: none;
 }

 a.tb-site-header__utility-link:hover {
  color: var(--site-heading);
 }

 /* The bar. Logo left, the default: the name, the menu beside it, then the
    icons and the buttons across from it. */
 .tb-site-header__bar {
  display: flex;
  align-items: center;
  gap: 12px 26px;
  min-height: 68px;
  padding-block: 12px;
 }

 .tb-site-header__name {
  flex: none;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--site-heading);
  text-decoration: none;
  overflow-wrap: anywhere;
 }

 .tb-site-header__logo {
  display: block;
  width: auto;
  max-width: 200px;
  height: 40px;
  object-fit: contain;
 }

 .tb-site-header__nav {
  flex: 1 1 auto;
  min-width: 0;
 }

 .tb-site-header__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 22px;
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
  border: 0;
  padding: 6px 0;
  background: none;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--site-body);
  text-decoration: none;
  cursor: pointer;
  transition: color 120ms ease;
 }

 span.tb-site-header__link {
  cursor: default;
 }

 a.tb-site-header__link:hover,
 .tb-site-header__item:hover > .tb-site-header__link,
 .tb-site-header__item.is-open > .tb-site-header__link {
  color: var(--site-heading);
 }

 .tb-site-header__item.is-open > .tb-site-header__link {
  box-shadow: inset 0 -2px 0 var(--site-accent);
 }

 .tb-site-header__caret {
  font-size: 10px;
  color: var(--site-muted);
 }

 .tb-site-header__icons,
 .tb-site-header__buttons {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
 }

 /* With no menu to fill the middle, they still sit across from the name. */
 .tb-site-header__name + .tb-site-header__icons,
 .tb-site-header__name + .tb-site-header__buttons {
  margin-left: auto;
 }

 .tb-site-header__buttons {
  gap: 10px;
 }

 .tb-site-header__icon {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--site-body);
  text-decoration: none;
  white-space: nowrap;
 }

 a.tb-site-header__icon:hover {
  color: var(--site-heading);
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

 .tb-site-header__cta--outline {
  box-shadow: inset 0 0 0 1.5px currentColor;
  background: transparent;
  color: var(--site-heading);
 }

 .tb-site-header a:focus-visible,
 .tb-site-header button:focus-visible,
 .tb-site-header summary:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
  border-radius: 4px;
 }

 .tb-site-header__cta:focus-visible {
  border-radius: 8px;
 }

 /* An item's own links: a list under it, or a big menu across the whole
    header. Hidden until the item is opened; before the page's script runs,
    hover and focus open it, so the menu works without one. */
 .tb-site-header__panel {
  position: absolute;
  top: calc(100% + 8px);
  left: -12px;
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
  visibility: hidden;
  transition:
   opacity 120ms ease,
   transform 120ms ease,
   visibility 0s linear 120ms;
 }

 /* Keeps the pointer in the item on its way down the gap. */
 .tb-site-header__panel:not(.tb-site-header__panel--mega)::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 10px;
 }

 .tb-site-header__item:last-child > .tb-site-header__panel:not(.tb-site-header__panel--mega) {
  right: -12px;
  left: auto;
 }

 .tb-site-header__item.is-open > .tb-site-header__panel,
 .tb-site-header:not(.is-live) .tb-site-header__item:hover > .tb-site-header__panel,
 .tb-site-header:not(.is-live) .tb-site-header__item:focus-within > .tb-site-header__panel {
  opacity: 1;
  pointer-events: auto;
  transform: none;
  visibility: visible;
  transition-delay: 0s;
 }

 .tb-site-header__sublink {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--site-heading);
  text-decoration: none;
 }

 .tb-site-header__sublink--all {
  font-weight: 700;
  color: var(--site-accent);
 }

 a.tb-site-header__sublink:hover {
  background: var(--site-surface);
 }

 .tb-site-header__desc {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--site-body);
 }

 /* A big menu runs the width of the header: its title, then its columns.
    The item gives up its place as the panel's anchor, so the panel hangs
    from the header. */
 .tb-site-header__item--mega {
  position: static;
 }

 .tb-site-header__panel--mega {
  top: 100%;
  right: 0;
  left: 0;
  display: block;
  border-width: 1px 0 0;
  border-radius: 0;
  padding: 22px 0 26px;
 }

 .tb-site-header__mega-title {
  display: block;
  margin-bottom: 10px;
  padding-inline: 12px;
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--site-muted);
  text-decoration: none;
 }

 a.tb-site-header__mega-title:hover {
  color: var(--site-heading);
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-site-header__mega-columns {
  display: grid;
  grid-template-columns: repeat(var(--tb-mega-columns, 3), minmax(0, 1fr));
  gap: 18px;
 }

 .tb-site-header__mega-heading {
  margin: 0 0 4px;
  border-bottom: 1px solid var(--site-border);
  padding: 0 12px 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--site-heading);
 }

 .tb-site-header__mega-links {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* Logo centered: the icons, the name and the buttons on one row, and the
    menu centered under it. On a phone it's the same bar as any other. */
 @media (min-width: 860px) {
  .tb-site-header--center .tb-site-header__bar {
   display: grid;
   grid-template-areas:
    'icons name buttons'
    'nav nav nav';
   grid-template-columns: 1fr auto 1fr;
   gap: 6px 26px;
   padding-bottom: 8px;
  }

  .tb-site-header--center .tb-site-header__name {
   grid-area: name;
   font-size: 22px;
  }

  .tb-site-header--center .tb-site-header__nav {
   grid-area: nav;
  }

  .tb-site-header--center .tb-site-header__links {
   justify-content: center;
  }

  .tb-site-header--center .tb-site-header__icons {
   grid-area: icons;
   margin: 0;
  }

  .tb-site-header--center .tb-site-header__buttons {
   grid-area: buttons;
   justify-content: flex-end;
   margin: 0;
  }
 }

 /* Logo and button: the name, the main button, and a Menu toggle, at every
    width. Past a phone's width the overlay's links and buttons share a row. */
 .tb-site-header--button .tb-site-header__bar {
  min-height: 72px;
 }

 .tb-site-header--button .tb-site-header__name {
  margin-right: auto;
 }

 @media (min-width: 860px) {
  .tb-site-header--button .tb-site-header__name {
   font-size: 22px;
  }

  .tb-site-header--button .tb-site-header__sheet-foot {
   flex-direction: row;
   align-items: center;
   gap: 18px;
  }

  .tb-site-header--button .tb-site-header__sheet-links {
   margin-right: auto;
  }

  .tb-site-header--button .tb-site-header__cta--wide {
   min-width: 200px;
  }
 }

 /* The menu behind the toggle: the phone menu, or the button layout's
    overlay. It's the same <details>, hanging from the header and filling
    what's left of the window, with its buttons pinned at the bottom. The
    list scrolls in .tb-site-header__sheet-scroll, which isn't positioned, so
    Step-through's panels are placed against the body around it: they cover
    the list wherever it's scrolled to, and stop above the buttons. */
 .tb-site-header__menu {
  display: none;
 }

 .tb-site-header--button .tb-site-header__menu {
  display: block;
 }

 .tb-site-header__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
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

 .tb-site-header__toggle::-webkit-details-marker,
 .tb-site-header__fold > summary::-webkit-details-marker {
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
  display: flex;
  flex-direction: column;
  --tb-sheet-inset: max(var(--site-gutter), calc((100% - var(--site-max)) / 2)); /* the bar's own edges */
  height: calc(100vh - var(--tb-sheet-top, 72px));
  height: calc(100dvh - var(--tb-sheet-top, 72px));
  border-bottom: 1px solid var(--site-border);
  background: var(--site-bg);
  box-shadow: 0 14px 24px color-mix(in srgb, var(--site-heading) 10%, transparent);
  color: var(--site-body);
 }

 .tb-site-header__sheet-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
 }

 .tb-site-header__sheet-scroll {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
 }

 .tb-site-header__stack,
 .tb-site-header__substack,
 .tb-site-header__overlay,
 .tb-site-header__sheet-links {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-site-header__stack > li + li {
  border-top: 1px solid var(--site-border);
 }

 .tb-site-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding-inline: var(--tb-sheet-inset);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--site-heading);
  text-decoration: none;
  list-style: none;
  cursor: pointer;
 }

 span.tb-site-header__row {
  cursor: default;
 }

 .tb-site-header__fold > .tb-site-header__row::after {
  content: '+';
  font-size: 18px;
  font-weight: 400;
  color: var(--site-muted);
 }

 .tb-site-header__fold[open] > .tb-site-header__row::after {
  content: '−';
 }

 .tb-site-header__back,
 .tb-site-header__drawer-title {
  display: none;
 }

 .tb-site-header__substack {
  padding: 0 var(--tb-sheet-inset) 12px calc(var(--tb-sheet-inset) + 12px);
 }

 .tb-site-header__subrow {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 44px;
  padding-block: 8px;
  font-size: 15px;
  line-height: 1.35;
  color: var(--site-body);
  text-decoration: none;
 }

 .tb-site-header__subrow--all {
  font-weight: 700;
  color: var(--site-accent);
 }

 .tb-site-header__sheet-foot {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--site-border);
  padding: 12px var(--tb-sheet-inset) 20px;
 }

 .tb-site-header__sheet-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0 18px;
 }

 .tb-site-header__sheet-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
  color: var(--site-body);
  text-decoration: none;
 }

 .tb-site-header__cta--wide {
  display: flex;
  min-height: 48px;
  font-size: 15px;
 }

 .tb-site-header__pins {
  display: none;
  flex: none;
  align-items: center;
  gap: 4px;
 }

 .tb-site-header__pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 700;
  color: var(--site-heading);
  text-decoration: none;
 }

 .tb-site-header__cta--pin {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 13px;
 }

 /* Step-through: an item's panel covers the list, with a Back button. With
    no script there'd be no Back, so until there is one it opens in place. */
 .tb-site-header--phone-drill .tb-site-header__fold > .tb-site-header__row::after,
 .tb-site-header--phone-drill .tb-site-header__fold[open] > .tb-site-header__row::after {
  content: '›';
 }

 .tb-site-header--phone-drill.is-live .tb-site-header__fold[open] > .tb-site-header__drawer {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--site-bg);
 }

 .tb-site-header--phone-drill.is-live .tb-site-header__back {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 44px;
  border: 0;
  padding: 0 var(--tb-sheet-inset);
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--site-muted);
  cursor: pointer;
 }

 .tb-site-header--phone-drill.is-live .tb-site-header__drawer-title {
  display: block;
  margin: 0;
  padding: 2px var(--tb-sheet-inset) 8px;
  font-family: var(--site-font-display);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--site-heading);
 }

 .tb-site-header--phone-drill .tb-site-header__substack {
  padding-inline: var(--tb-sheet-inset);
 }

 /* Full screen, and the button layout's overlay: the dark band with the
    words big. It repaints the variables, so what's inside needs no colors
    of its own. */
 .tb-site-header--phone-full .tb-site-header__sheet,
 .tb-site-header--button .tb-site-header__sheet {
  --site-accent: var(--site-dark-ink);
  --site-accent-ink: var(--site-dark);
  --site-bg: var(--site-dark);
  --site-heading: var(--site-dark-ink);
  --site-body: color-mix(in srgb, var(--site-dark-ink) 82%, var(--site-dark));
  --site-muted: color-mix(in srgb, var(--site-dark-ink) 65%, var(--site-dark));
  --site-border: color-mix(in srgb, var(--site-dark-ink) 16%, var(--site-dark));
 }

 .tb-site-header--phone-full .tb-site-header__row {
  min-height: 64px;
  font-family: var(--site-font-display);
  font-size: 28px;
  font-weight: 800;
 }

 .tb-site-header__overlay {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 40px;
  padding: 36px var(--tb-sheet-inset);
 }

 .tb-site-header__overlay-link {
  display: block;
  padding-block: 4px;
  font-family: var(--site-font-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  line-height: 1.15;
  color: var(--site-heading);
  text-decoration: none;
 }

 a.tb-site-header__overlay-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
 }

 .tb-site-header__overlay .tb-site-header__substack {
  padding: 4px 0 0;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-site-header,
  .tb-site-header__panel {
   transition: none;
  }

  .tb-site-header__panel {
   transform: none;
  }
 }

 /* Under 860px (sooner if the bar is crowded, which only Logo left is): the
    name, the pins and the Menu toggle. The rows that won't fit move into the
    menu. The button layout is the same at every width, less its utility row. */
 @media (max-width: 859px) {
  .tb-site-header__bar {
   min-height: 60px;
   gap: 8px;
   padding-block: 8px;
  }

  .tb-site-header__name {
   flex: 0 1 auto;
   min-width: 0;
   margin-right: auto;
   overflow: hidden;
   font-size: 18px;
   text-overflow: ellipsis;
   white-space: nowrap;
  }

  .tb-site-header__notice-text {
   overflow: visible;
   white-space: normal;
  }

  .tb-site-header__utility,
  .tb-site-header__nav,
  .tb-site-header__icons,
  .tb-site-header:not(.tb-site-header--button) .tb-site-header__buttons {
   display: none;
  }

  .tb-site-header__menu {
   display: block;
  }

  .tb-site-header__pins {
   display: flex;
  }

  .tb-site-header__overlay {
   grid-template-columns: minmax(0, 1fr);
  }
 }

 @media (max-width: 1079px) {
  .tb-site-header.is-crowded .tb-site-header__nav,
  .tb-site-header.is-crowded .tb-site-header__icons,
  .tb-site-header.is-crowded .tb-site-header__buttons,
  .tb-site-header.is-crowded .tb-site-header__utility {
   display: none;
  }

  .tb-site-header.is-crowded .tb-site-header__name {
   margin-right: auto;
  }

  .tb-site-header.is-crowded .tb-site-header__menu {
   display: block;
  }

  .tb-site-header.is-crowded .tb-site-header__pins {
   display: flex;
  }
 }
</style>
