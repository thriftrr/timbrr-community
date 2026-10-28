<script setup>
 // Reviews on a soft band: the heading on one side and the rating on the
 // other (Google's mark, the score over its stars, how many reviews there
 // are), then a few of the reviews in cards, three to a row.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();

 // Words to show: a string with something in it, or a rich-text document
 // with some text.
 function hasWords(node) {
  if (typeof node === 'string') return node.trim() !== '';
  if (node?.type === 'text') return Boolean(node.text?.trim());
  return Array.isArray(node?.content) && node.content.some(hasWords);
 }

 // An empty field isn't drawn, except on the studio's canvas while it's
 // being typed into, so clearing it to start over doesn't lose the caret.
 function shows(field, value) {
  if (hasWords(value)) return true;
  const active = canvas?.active?.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }

 const titles = computed(() => shows('tagline', props.data.tagline) || shows('headline', props.data.headline));
 const summary = computed(() => shows('rating', props.data.rating) || shows('count', props.data.count));

 // The rating as a number out of 5, for the stars: "4.8", "4,8" and
 // "4.8/5" all work. Anything else gets no stars rather than wrong ones.
 const score = computed(() => {
  const value = Number.parseFloat(String(props.data.rating ?? '').replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
 });
 const lit = computed(() => `${Math.round((score.value ?? 0) * 200) / 10}%`);

 // Three cards to a row; with fewer reviews than that, two.
 const across = computed(() => (props.data.items.length >= 3 ? 3 : 2));
</script>

<template>
 <section class="tb-section tb-reviews">
  <div class="tb-wrap">
   <header v-if="titles || summary" class="tb-reviews__head">
    <div v-if="titles" class="tb-reviews__titles">
     <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
     <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    </div>
    <div v-if="summary" class="tb-reviews__summary">
     <span class="tb-reviews__source" role="img" aria-label="Google">G</span>
     <div v-if="shows('rating', data.rating)">
      <p class="tb-reviews__rating">
       <TbText :data="data" field="rating" />
       <span v-if="score !== null" class="tb-reviews__unseen"> out of 5</span>
      </p>
      <span v-if="score !== null" class="tb-reviews__stars" aria-hidden="true">
       <span class="tb-reviews__stars-lit" :style="{ width: lit }">★★★★★</span>
      </span>
     </div>
     <TbText v-if="shows('count', data.count)" :data="data" field="count" tag="p" class="tb-reviews__count" />
    </div>
   </header>
   <ul v-if="data.items.length" class="tb-reviews__grid" :class="`tb-reviews__grid--${across}`" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-reviews__item">
     <figure class="tb-reviews__card">
      <span class="tb-reviews__card-stars" aria-hidden="true">★★★★★</span>
      <blockquote class="tb-reviews__quote">
       <TbRich :data="data" :field="`items.${index}.quote`" />
      </blockquote>
      <figcaption v-if="shows(`items.${index}.name`, item.name) || shows(`items.${index}.role`, item.role)" class="tb-reviews__by">
       <TbText v-if="shows(`items.${index}.name`, item.name)" :data="data" :field="`items.${index}.name`" class="tb-reviews__name" />
       <span v-if="hasWords(item.name) && hasWords(item.role)" class="tb-reviews__dot" aria-hidden="true">·</span>
       <TbText v-if="shows(`items.${index}.role`, item.role)" :data="data" :field="`items.${index}.role`" class="tb-reviews__role" />
      </figcaption>
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-reviews {
  /* The stars' gold; a site can set its own. */
  --tb-reviews-star: #e0a82e;
  background: var(--site-surface);
 }

 /* The heading on the left, the rating on the right, their bottoms lined
    up; on a narrow screen the rating drops under the heading. */
 .tb-reviews__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px 24px;
  margin-bottom: clamp(20px, 2.2vw, 26px);
 }

 .tb-reviews__titles {
  flex: 1 1 320px;
  min-width: 0;
  max-width: 620px;
  overflow-wrap: break-word;
 }

 .tb-reviews__summary {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
  max-width: 100%;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 12px 16px;
  background: var(--site-bg);
 }

 /* Google's blue: the one color here that doesn't follow the site's theme,
    so the mark reads as Google at a glance. */
 .tb-reviews__source {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--site-border);
  border-radius: 50%;
  background: var(--site-bg);
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  color: #4285f4;
 }

 .tb-reviews__rating {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: var(--site-heading);
 }

 /* Five pale stars with the gold ones laid over them, as wide as the
    rating: 4.8 lights 96% of the row. */
 .tb-reviews__stars {
  position: relative;
  display: block;
  width: max-content;
  margin-top: 4px;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1px;
  white-space: nowrap;
  color: color-mix(in srgb, var(--site-muted) 30%, var(--site-bg));
 }

 .tb-reviews__stars::before {
  content: '★★★★★';
 }

 .tb-reviews__stars-lit {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  color: var(--tb-reviews-star);
 }

 .tb-reviews__count {
  margin: 0;
  font-size: 14px;
  line-height: 1.3;
  color: var(--site-muted);
 }

 .tb-reviews__unseen {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }

 .tb-reviews__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 18px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-reviews__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-reviews__item {
  display: flex;
  min-width: 0;
 }

 .tb-reviews__card {
  flex: 1;
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(18px, 2vw, 22px);
  background: var(--site-bg);
  overflow-wrap: break-word;
 }

 .tb-reviews__card-stars {
  display: block;
  font-size: 13px;
  line-height: 1;
  letter-spacing: 1px;
  color: var(--tb-reviews-star);
 }

 .tb-reviews__quote {
  margin: 10px 0 0;
  font-size: clamp(15px, 0.25vw + 13.5px, 16.5px);
  line-height: 1.55;
  color: var(--site-heading);
 }

 /* Who left it, then (lighter) where and when. */
 .tb-reviews__by {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 7px;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--site-body);
 }

 .tb-reviews__name {
  font-weight: 700;
 }

 .tb-reviews__dot {
  color: color-mix(in srgb, var(--site-muted) 60%, var(--site-bg));
 }

 .tb-reviews__role {
  color: var(--site-muted);
 }

 /* Narrower screens: two to a row, then one. */
 @media (max-width: 900px) {
  .tb-reviews__grid {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 600px) {
  .tb-reviews__grid {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
