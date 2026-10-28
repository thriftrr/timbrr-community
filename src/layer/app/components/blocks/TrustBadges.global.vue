<script setup>
 // A band across the page in the site's soft surface color, holding a row
 // of short promises: each a shield with a check beside a word or two and
 // a line under them. They wrap two to a row on tablets and stack in one
 // column on phones.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-trust-badges">
  <div class="tb-wrap">
   <ul v-if="data.items.length" class="tb-trust-badges__list" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-trust-badges__badge">
     <span class="tb-trust-badges__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2">
       <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
       <path d="M9 12l2 2 4-4" />
      </svg>
     </span>
     <div class="tb-trust-badges__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="p" class="tb-trust-badges__title" />
      <TbText v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" tag="p" class="tb-trust-badges__detail" />
     </div>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* A band, not a section: tighter, edge to edge, ruled above and below. */
 .tb-section.tb-trust-badges {
  border-block: 1px solid var(--site-border);
  padding-block: clamp(22px, 2.6vw, 32px);
  background: var(--site-surface);
 }

 .tb-trust-badges__list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(16px, 2vw, 22px) clamp(24px, 3.2vw, 40px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-trust-badges__badge {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: min(100%, 180px);
 }

 .tb-trust-badges__icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--site-accent) 10%, var(--site-bg));
  color: var(--site-accent);
 }

 .tb-trust-badges__text {
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-trust-badges__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.25vw + 14px, 17px);
  font-weight: 700;
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-trust-badges__detail {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--site-muted);
 }

 /* Narrower screens: two to a row rather than three and a straggler. */
 @media (max-width: 960px) {
  .tb-trust-badges__list {
   max-width: 560px;
   margin-inline: auto;
  }
 }

 /* Phones: one column, centered as a whole, each badge reading left to
    right. */
 @media (max-width: 520px) {
  .tb-trust-badges__list {
   flex-direction: column;
   align-items: flex-start;
   width: fit-content;
  }
 }
</style>
