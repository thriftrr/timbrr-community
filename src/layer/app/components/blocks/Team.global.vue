<script setup>
 // The people behind the business, one card each: a round photo (their
 // initials until there is one), name, role, a line or two about them, and
 // a link to book with them for those who have one. Cards sit three across,
 // or four across when the team comes in fours, and a short last row
 // centers. Phones stack them with the photo beside the words.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

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
 <section class="tb-section tb-team">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-team__grid" :class="{ 'tb-team__grid--fours': fours }" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-card tb-team__card">
     <TbImage v-if="photos[index]" :image="item.image" ratio="1 / 1" class="tb-team__photo" />
     <span v-else class="tb-team__photo tb-team__initials" aria-hidden="true">{{ initials(item.title) }}</span>
     <div class="tb-team__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title tb-team__name" />
      <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-team__role" />
      <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-card__body tb-team__bio" />
      <p v-if="hrefs[index] && shows('link_label', data.link_label)" class="tb-team__more">
       <a :href="hrefs[index]" class="tb-team__link">
        <TbText :data="data" field="link_label" />
        <span v-if="item.title.trim()" class="tb-team__who">: {{ item.title.trim() }}</span>
        <span class="tb-team__arrow" aria-hidden="true">→</span>
       </a>
      </p>
     </div>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-team {
  --tb-team-photo: clamp(72px, 4.5vw + 30px, 88px);
 }

 /* Rows of equal cards; a row that isn't full sits in the middle. */
 .tb-team__grid {
  --tb-team-across: 3;
  --tb-team-gap: clamp(14px, 1.8vw, 20px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tb-team-gap);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-team__grid--fours {
  --tb-team-across: 4;
 }

 /* Each card takes its share of the row, less a hair, so rounding never
    pushes a full row's last card onto the next line. */
 .tb-team .tb-team__card {
  display: flex;
  flex: 0 0 calc((100% - (var(--tb-team-across) - 1) * var(--tb-team-gap)) / var(--tb-team-across) - 0.1px);
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: clamp(18px, 1.8vw, 22px);
  text-align: center;
 }

 .tb-team .tb-team__photo {
  flex: none;
  width: var(--tb-team-photo);
  height: var(--tb-team-photo);
  border-radius: 50%;
 }

 /* No photo yet: their initials on a disc, each card in the next of four
    shades from the site's colors, so a row doesn't read as one block. */
 .tb-team__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tb-team-tone, var(--site-accent));
  font-family: var(--site-font-display);
  font-size: calc(var(--tb-team-photo) * 0.32);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--tb-team-tone-ink, var(--site-dark-ink));
  -webkit-user-select: none;
  user-select: none;
 }

 .tb-team__card:nth-child(4n + 1) {
  --tb-team-tone: color-mix(in srgb, var(--site-eyebrow) 40%, var(--site-dark));
 }

 .tb-team__card:nth-child(4n + 2) {
  --tb-team-tone: var(--site-accent);
  --tb-team-tone-ink: var(--site-accent-ink);
 }

 .tb-team__card:nth-child(4n + 3) {
  --tb-team-tone: color-mix(in srgb, var(--site-accent) 45%, var(--site-body));
 }

 .tb-team__card:nth-child(4n) {
  --tb-team-tone: var(--site-eyebrow);
 }

 /* The words fill the rest of the card, so the links line up along the
    bottom of a row whatever the bios' lengths. */
 .tb-team__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-team .tb-team__name {
  margin: 14px 0 0;
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.25;
 }

 .tb-team__role {
  margin: 4px 0 0;
  font-family: var(--site-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 .tb-team .tb-team__bio {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.55;
 }

 .tb-team__more {
  margin: auto 0 0;
  padding-top: 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
 }

 .tb-team__link {
  border-radius: 4px;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-team__link:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 /* Who the link is for, said to screen readers and nobody else. */
 .tb-team__who {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }

 .tb-team__arrow {
  display: inline-block;
  margin-left: 0.35em;
  transition: transform 120ms ease;
 }

 .tb-team__link:hover .tb-team__arrow {
  transform: translateX(3px);
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-team__arrow {
   transition: none;
  }

  .tb-team__link:hover .tb-team__arrow {
   transform: none;
  }
 }

 /* Narrower screens: two across, then one. */
 @media (max-width: 960px) {
  .tb-team__grid--fours {
   --tb-team-across: 2;
  }
 }

 @media (max-width: 760px) {
  .tb-team__grid {
   --tb-team-across: 2;
  }
 }

 /* Phones: one person per row, the photo beside their words. */
 @media (max-width: 520px) {
  .tb-team {
   --tb-team-photo: 64px;
  }

  .tb-team__grid {
   --tb-team-across: 1;
  }

  .tb-team .tb-team__card {
   flex-direction: row;
   align-items: flex-start;
   gap: 16px;
   text-align: left;
  }

  .tb-team .tb-team__name {
   margin-top: 2px;
  }

  .tb-team__more {
   padding-top: 10px;
  }
 }
</style>
