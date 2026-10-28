<script setup>
 // An Instagram strip: the account's name beside a Follow button, then a
 // row of square tiles picked from its posts. Not a live feed: the tiles are
 // photos added in the studio, and a tile's caption shows over it on hover,
 // the way Instagram's own grid does.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // The account, from "@name", "name" or a pasted instagram.com address.
 // Anything else isn't an account name, and there's no Follow button.
 const account = computed(() => {
  const match = /^(?:(?:https?:\/\/)?(?:www\.)?instagram\.com\/)?@?([a-z0-9._]{1,30})\/?$/i.exec(props.data.handle.trim());
  return match?.[1] ?? '';
 });
 const profile = computed(() => (account.value ? safeHref(`https://www.instagram.com/${account.value}/`) : undefined));

 // Six across; a shorter feed takes one column per tile (three at least),
 // so its tiles don't huddle at one end of the row. Phones show three.
 const columns = computed(() => Math.min(6, Math.max(3, props.data.items.length)));
</script>

<template>
 <section class="tb-section tb-instagram">
  <div class="tb-wrap">
   <header v-if="shows('handle', data.handle) || shows('headline', data.headline)" class="tb-instagram__head">
    <div class="tb-instagram__account">
     <span v-if="data.handle" class="tb-instagram__avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
       <rect x="3" y="3" width="18" height="18" rx="5" />
       <circle cx="12" cy="12" r="4" />
       <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
     </span>
     <div class="tb-instagram__names">
      <TbText v-if="shows('handle', data.handle)" :data="data" field="handle" tag="h2" class="tb-instagram__handle" />
      <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="p" class="tb-instagram__headline" />
     </div>
    </div>
    <a v-if="profile" :href="profile" class="tb-instagram__follow" rel="noopener" :aria-label="`Follow @${account} on Instagram`">Follow</a>
   </header>
   <ul v-if="data.items.length" class="tb-instagram__grid" role="list" :style="{ '--tb-instagram-columns': columns }">
    <li v-for="(item, index) in data.items" :key="index" class="tb-instagram__item">
     <figure class="tb-instagram__tile">
      <TbImage :image="item.image" ratio="1 / 1" class="tb-instagram__image" />
      <figcaption v-if="shows(`items.${index}.caption`, item.caption)" class="tb-instagram__caption">
       <TbText :data="data" :field="`items.${index}.caption`" />
      </figcaption>
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-instagram__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: clamp(16px, 2vw, 22px);
 }

 .tb-instagram__account {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
 }

 /* Instagram's own colors: the one place a block doesn't follow the site's
    theme, so the account reads as Instagram at a glance. */
 .tb-instagram__avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, #f9a825, #e1306c, #833ab4);
  color: #fff;
 }

 .tb-instagram__names {
  min-width: 0;
  overflow-wrap: anywhere;
 }

 .tb-instagram__handle {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--site-heading);
 }

 .tb-instagram__headline {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--site-muted);
 }

 .tb-instagram__follow {
  flex: none;
  border: 1.5px solid color-mix(in srgb, var(--site-accent) 30%, transparent);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--site-accent);
  text-decoration: none;
  transition:
   border-color 120ms ease,
   background-color 120ms ease;
 }

 .tb-instagram__follow:hover {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
 }

 .tb-instagram__follow:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-instagram__grid {
  display: grid;
  grid-template-columns: repeat(var(--tb-instagram-columns, 6), minmax(0, 1fr));
  gap: clamp(6px, 1vw, 10px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-instagram__tile {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: calc(var(--site-radius) * 0.8);
 }

 .tb-instagram__tile .tb-instagram__image {
  border-radius: 0;
 }

 /* A tile is too small for the canvas's "add an image" hint; the panel's
    list of tiles says it instead. */
 .tb-instagram__tile .tb-image__hint {
  display: none;
 }

 /* Until there are photos, each empty tile gets its own shade, so the row
    reads as a feed rather than one block of color. */
 .tb-instagram__item:nth-child(6n + 2) .tb-image--empty {
  background: linear-gradient(158deg, var(--site-eyebrow), var(--site-dark));
 }

 .tb-instagram__item:nth-child(6n + 3) .tb-image--empty {
  background: linear-gradient(181deg, color-mix(in srgb, var(--site-accent) 70%, var(--site-dark)), var(--site-dark));
 }

 .tb-instagram__item:nth-child(6n + 4) .tb-image--empty {
  background: linear-gradient(204deg, var(--site-muted), var(--site-dark));
 }

 .tb-instagram__item:nth-child(6n + 5) .tb-image--empty {
  background: linear-gradient(227deg, color-mix(in srgb, var(--site-accent) 55%, #fff), var(--site-accent));
 }

 .tb-instagram__item:nth-child(6n) .tb-image--empty {
  background: linear-gradient(250deg, color-mix(in srgb, var(--site-eyebrow) 65%, #fff), var(--site-eyebrow));
 }

 .tb-instagram__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 28px 10px 9px;
  background: linear-gradient(to top, color-mix(in srgb, var(--site-dark) 82%, transparent), transparent);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--site-dark-ink);
  overflow-wrap: anywhere;
  opacity: 0;
  transition: opacity 160ms ease;
 }

 .tb-instagram__tile:hover .tb-instagram__caption,
 .tb-instagram__tile:focus-within .tb-instagram__caption {
  opacity: 1;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-instagram__caption {
   transition: none;
  }
 }

 @media (max-width: 720px) {
  .tb-instagram__grid {
   grid-template-columns: repeat(3, minmax(0, 1fr));
  }
 }
</style>
