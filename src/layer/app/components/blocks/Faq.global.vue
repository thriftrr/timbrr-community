<script setup>
 // Questions and answers, a rule above each: the question in the display
 // face, its answer under it (a few lines, a link, a short list). One
 // readable column, or two. Questions with a topic sit together under it,
 // and with two columns the topics are what go side by side. A topic heads
 // several questions, so it's edited on each in the inspector, not typed in
 // place.
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

 const wide = computed(() => props.data.columns === '2');
 const groups = computed(() => groupRows(props.data.items, 'topic'));
 const topics = computed(() => groups.value.some((group) => group.name));
</script>

<template>
 <section class="tb-section tb-faq" :class="{ 'tb-faq--two': wide, 'tb-faq--topics': topics }">
  <div class="tb-wrap" :class="{ 'tb-wrap--narrow': !wide }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="data.items.length" class="tb-faq__groups">
    <div v-for="group in groups" :key="group.name" class="tb-faq__group">
     <h3 v-if="group.name" class="tb-faq__topic">{{ group.name }}</h3>
     <dl class="tb-faq__list">
      <div v-for="{ row, index } in group.rows" :key="index" class="tb-faq__item">
       <TbText :data="data" :field="`items.${index}.question`" tag="dt" class="tb-faq__question" />
       <dd v-if="shows(`items.${index}.answer`, row.answer)" class="tb-faq__answer">
        <TbRich :data="data" :field="`items.${index}.answer`" />
       </dd>
      </div>
     </dl>
    </div>
   </div>
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

 .tb-faq__group + .tb-faq__group {
  margin-top: clamp(24px, 3vw, 32px);
 }

 .tb-faq__topic {
  margin: 0 0 12px;
  font-family: var(--site-font-mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 /* Two columns: with no topics the questions run on from one column to the
    next, each kept whole; with topics, the topics sit side by side. */
 .tb-faq--two:not(.tb-faq--topics) .tb-faq__list {
  column-count: 2;
  column-gap: clamp(28px, 4vw, 48px);
 }

 .tb-faq--two:not(.tb-faq--topics) .tb-faq__item {
  break-inside: avoid;
 }

 .tb-faq--two.tb-faq--topics .tb-faq__groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(24px, 3vw, 32px) clamp(28px, 4vw, 48px);
  align-items: start;
 }

 .tb-faq--two .tb-faq__group + .tb-faq__group {
  margin-top: 0;
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

 @media (max-width: 720px) {
  .tb-faq--two:not(.tb-faq--topics) .tb-faq__list {
   column-count: 1;
  }

  .tb-faq--two.tb-faq--topics .tb-faq__groups {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
