<script setup>
 // The people behind the business, one card each: a round photo (their
 // initials until there is one), name, role, a line or two about them, and a
 // link to book with them for those who have one. In a grid, cards sit three
 // across, or four when the team comes in fours, and a short last row
 // centers. Phones stack them with the photo beside the words. The slider is
 // the same cards in a row that scrolls sideways.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const slider = computed(() => props.data.display === 'slider');
 const photos = computed(() => props.data.items.map((item) => Boolean(safeSrc(item.image.src))));
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
 const fours = computed(() => props.data.items.length % 4 === 0);

 // "Alex Morgan" → "AM": the first letter of the first and last words.
 function initials(name) {
  const letters = String(name)
   .split(/\s+/)
   .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
   .filter(Boolean);
  return (letters.length > 1 ? letters[0] + letters.at(-1) : (letters[0] ?? '')).toUpperCase();
 }
</script>

<template>
 <section class="tb-section tb-people" :class="`tb-people--${data.display}`">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul
    v-if="data.items.length"
    class="tb-people__list"
    :class="slider ? 'tb-slider' : { 'tb-people__list--fours': fours }"
    :tabindex="slider ? 0 : undefined"
    role="list"
   >
    <li v-for="(item, index) in data.items" :key="index" class="tb-card tb-people__card">
     <TbImage v-if="photos[index]" :image="item.image" ratio="1 / 1" sizes="96px" class="tb-people__photo" />
     <span v-else class="tb-people__photo tb-people__initials" aria-hidden="true">{{ initials(item.title) }}</span>
     <div class="tb-people__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title tb-people__name" />
      <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-people__role" />
      <TbRich v-if="data.bio && shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-card__body tb-people__bio" />
      <p v-if="hrefs[index] && shows('link_label', data.link_label)" class="tb-people__more">
       <a :href="hrefs[index]" class="tb-people__link">
        <TbText :data="data" field="link_label" />
        <span v-if="item.title.trim()" class="tb-people__who">: {{ item.title.trim() }}</span>
        <span class="tb-people__arrow" aria-hidden="true">→</span>
       </a>
      </p>
     </div>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-people {
  --tb-people-photo: clamp(72px, 4.5vw + 30px, 88px);
 }

 /* Rows of equal cards; a row that isn't full sits in the middle. */
 .tb-people__list:not(.tb-slider) {
  --tb-people-across: 3;
  --tb-people-gap: clamp(14px, 1.8vw, 20px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tb-people-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-people__list--fours:not(.tb-slider) {
  --tb-people-across: 4;
 }

 /* Each card takes its share of the row, less a hair, so rounding never
    pushes a full row's last card onto the next line. */
 .tb-people .tb-people__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: clamp(18px, 1.8vw, 22px);
  text-align: center;
 }

 .tb-people__list:not(.tb-slider) .tb-people__card {
  flex: 0 0 calc((100% - (var(--tb-people-across) - 1) * var(--tb-people-gap)) / var(--tb-people-across) - 0.1px);
 }

 .tb-people .tb-people__photo {
  flex: none;
  width: var(--tb-people-photo);
  height: var(--tb-people-photo);
  border-radius: 50%;
 }

 /* No photo yet: their initials on a disc, each card in the next of four
    shades from the site's colors, so a row doesn't read as one block. */
 .tb-people__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tb-people-tone, var(--site-accent));
  font-family: var(--site-font-display);
  font-size: calc(var(--tb-people-photo) * 0.32);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--tb-people-tone-ink, var(--site-dark-ink));
  -webkit-user-select: none;
  user-select: none;
 }

 .tb-people__card:nth-child(4n + 1) {
  --tb-people-tone: color-mix(in srgb, var(--site-eyebrow) 40%, var(--site-dark));
 }

 .tb-people__card:nth-child(4n + 2) {
  --tb-people-tone: var(--site-accent);
  --tb-people-tone-ink: var(--site-accent-ink);
 }

 .tb-people__card:nth-child(4n + 3) {
  --tb-people-tone: color-mix(in srgb, var(--site-accent) 45%, var(--site-body));
 }

 .tb-people__card:nth-child(4n) {
  --tb-people-tone: var(--site-eyebrow);
 }

 /* The words fill the rest of the card, so the links line up along the
    bottom of a row whatever the bios' lengths. */
 .tb-people__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-people .tb-people__name {
  margin: 14px 0 0;
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.25;
 }

 .tb-people__role {
  margin: 4px 0 0;
  font-family: var(--site-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 .tb-people .tb-people__bio {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.55;
 }

 .tb-people__more {
  margin: auto 0 0;
  padding-top: 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
 }

 .tb-people__link {
  border-radius: 4px;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-people__link:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 /* Who the link is for, said to screen readers and nobody else. */
 .tb-people__who {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }

 .tb-people__arrow {
  display: inline-block;
  margin-left: 0.35em;
  transition: transform 120ms ease;
 }

 .tb-people__link:hover .tb-people__arrow {
  transform: translateX(3px);
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-people__arrow {
   transition: none;
  }

  .tb-people__link:hover .tb-people__arrow {
   transform: none;
  }
 }

 /* Narrower screens: two across, then one. */
 @media (max-width: 960px) {
  .tb-people__list--fours:not(.tb-slider) {
   --tb-people-across: 2;
  }
 }

 @media (max-width: 760px) {
  .tb-people__list:not(.tb-slider) {
   --tb-people-across: 2;
  }
 }

 /* Phones: one person per row, the photo beside their words. */
 @media (max-width: 520px) {
  .tb-people {
   --tb-people-photo: 64px;
  }

  .tb-people__list:not(.tb-slider) {
   --tb-people-across: 1;
  }

  .tb-people--grid .tb-people__card {
   flex-direction: row;
   align-items: flex-start;
   gap: 16px;
   text-align: left;
  }

  .tb-people--grid .tb-people__name {
   margin-top: 2px;
  }

  .tb-people__more {
   padding-top: 10px;
  }
 }
</style>
