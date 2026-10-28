<script setup>
 // Questions and answers in one readable column, a rule above each: the
 // question in the display face, its answer under it (a few lines, a link,
 // a short list).
 defineProps({ data: { type: Object, required: true } });

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
</script>

<template>
 <section class="tb-section tb-faq">
  <div class="tb-wrap tb-wrap--narrow">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <dl v-if="data.items.length" class="tb-faq__list">
    <div v-for="(item, index) in data.items" :key="index" class="tb-faq__item">
     <TbText :data="data" :field="`items.${index}.question`" tag="dt" class="tb-faq__question" />
     <dd v-if="shows(`items.${index}.answer`, item.answer)" class="tb-faq__answer">
      <TbRich :data="data" :field="`items.${index}.answer`" />
     </dd>
    </div>
   </dl>
  </div>
 </section>
</template>

<style>
 .tb-faq .tb-section__head {
  margin-bottom: clamp(20px, 2vw, 24px);
 }

 .tb-faq__list {
  margin: 0;
 }

 .tb-faq__item {
  border-top: 1px solid var(--site-border);
  padding: clamp(16px, 1.8vw, 20px) 0;
  overflow-wrap: break-word;
 }

 .tb-faq__question {
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 14.5px, 19.5px);
  font-weight: 700;
  line-height: 1.35;
  color: var(--site-heading);
 }

 .tb-faq__answer {
  margin: 7px 0 0;
  font-size: clamp(15.5px, 0.25vw + 14px, 17px);
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-faq__answer a {
  text-underline-offset: 0.15em;
 }

 /* Lists indent a little rather than the browser's full step, and each
    item holds a paragraph, so keep the items close together. */
 .tb-faq__answer ul,
 .tb-faq__answer ol {
  padding-left: 1.3em;
 }

 .tb-faq__answer li > p:last-child {
  margin-bottom: 0;
 }

 .tb-faq__answer li + li {
  margin-top: 0.3em;
 }
</style>
