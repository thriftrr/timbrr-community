<script setup>
 // Open roles as cards down one column: the role and a line of details, a
 // small status tag, and "Apply →" when the opening links somewhere. On the
 // site the whole card follows that link; in the studio's canvas its words
 // stay clickable for typing instead. When the card is too narrow for them
 // beside the words, the tag and Apply drop underneath.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
</script>

<template>
 <section class="tb-section tb-jobs">
  <div class="tb-wrap tb-wrap--narrow">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-jobs__list" role="list">
    <li
     v-for="(item, index) in data.items"
     :key="index"
     class="tb-card tb-jobs__item"
     :class="{ 'tb-jobs__item--stretched': hrefs[index] && !typing }"
    >
     <div class="tb-jobs__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-jobs__role" />
      <TbText v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" tag="p" class="tb-jobs__details" />
     </div>
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-jobs__status" />
     <a v-if="hrefs[index]" :href="hrefs[index]" class="tb-jobs__apply" :aria-label="item.title ? `Apply for ${item.title}` : undefined">
      Apply <span class="tb-jobs__arrow" aria-hidden="true">→</span>
     </a>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-jobs .tb-section__head {
  margin-bottom: clamp(18px, 2vw, 22px);
 }

 .tb-jobs__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* The words take the room; the tag and Apply sit on the right, and wrap
    under the words when there isn't room beside them (Apply stays right). */
 .tb-jobs .tb-jobs__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: clamp(18px, 2vw, 22px);
 }

 .tb-jobs__text {
  flex: 1 1 16em;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-jobs__role {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-jobs__details {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-body);
 }

 /* The status: small capitals on a pill of the brand color. */
 .tb-jobs__status {
  flex: none;
  max-width: 100%;
  margin: 0;
  border-radius: 999px;
  padding: 5px 11px;
  background: color-mix(in srgb, var(--site-accent) 22%, var(--site-surface));
  font-family: var(--site-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  line-height: 1.3;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--site-accent) 70%, var(--site-heading));
  overflow-wrap: anywhere;
 }

 .tb-jobs__apply {
  flex: none;
  margin-left: auto;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-accent);
  text-decoration: none;
  white-space: nowrap;
 }

 .tb-jobs__apply:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-jobs__apply:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-jobs__arrow {
  display: inline-block;
  transition: transform 120ms ease;
 }

 .tb-jobs__apply:hover .tb-jobs__arrow,
 .tb-jobs__item--stretched:hover .tb-jobs__arrow {
  transform: translateX(3px);
 }

 /* On the site the whole card follows the link and lifts under the pointer. */
 .tb-jobs__item--stretched {
  position: relative;
  transition:
   transform 120ms ease,
   box-shadow 120ms ease,
   border-color 120ms ease;
 }

 .tb-jobs .tb-jobs__item--stretched:hover {
  border-color: var(--site-accent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--site-heading) 10%, transparent);
  transform: translateY(-1px);
 }

 .tb-jobs__item--stretched .tb-jobs__apply::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--site-radius);
 }

 .tb-jobs__item--stretched .tb-jobs__apply:focus-visible {
  outline: 0;
 }

 .tb-jobs__item--stretched .tb-jobs__apply:focus-visible::after {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-jobs__item--stretched,
  .tb-jobs__arrow {
   transition: none;
  }

  .tb-jobs .tb-jobs__item--stretched:hover,
  .tb-jobs__apply:hover .tb-jobs__arrow,
  .tb-jobs__item--stretched:hover .tb-jobs__arrow {
   transform: none;
  }
 }
</style>
