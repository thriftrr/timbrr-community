<script setup>
 // An entry's quick facts as a strip (blocks/quick_facts.js): each a small
 // label over its value, side by side, wrapping on a phone. The studio sets
 // `facts` as it serves the page and on the canvas; with none, it draws
 // nothing on the site, and on the canvas says what goes here.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const facts = computed(() => (Array.isArray(props.data.facts) ? props.data.facts.filter((fact) => fact && typeof fact.text === 'string' && fact.text) : []));
</script>

<template>
 <section v-if="facts.length || canvas" class="tb-section tb-quick-facts">
  <div class="tb-wrap">
   <dl v-if="facts.length" class="tb-quick-facts__list">
    <div v-for="fact in facts" :key="fact.key" class="tb-quick-facts__fact">
     <dt class="tb-quick-facts__label">{{ fact.label }}</dt>
     <dd class="tb-quick-facts__value">{{ fact.text }}</dd>
    </div>
   </dl>
   <p v-else class="tb-quick-facts__stand-in">Quick facts · pick up to 4 fields, and each entry's values for them show here</p>
  </div>
 </section>
</template>

<style>
 .tb-section.tb-quick-facts {
  padding-block: calc(var(--site-space-above, var(--site-space)) * 0.4) calc(var(--site-space-below, var(--site-space)) * 0.4);
 }

 .tb-quick-facts__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  margin: 0;
  border-block: 1px solid var(--site-border);
 }

 .tb-quick-facts__fact {
  padding: 14px 16px;
 }

 .tb-quick-facts__fact + .tb-quick-facts__fact {
  border-left: 1px solid var(--site-border);
 }

 .tb-quick-facts__label {
  margin: 0 0 4px;
  font-family: var(--site-font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--site-muted);
 }

 .tb-quick-facts__value {
  margin: 0;
  font-weight: 600;
  color: var(--site-heading);
 }

 .tb-quick-facts__stand-in {
  margin: 0;
  border: 1.5px dashed var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 12px 14px;
  font: 13px/1.4 ui-monospace, monospace;
  color: var(--site-muted);
 }

 @media (max-width: 640px) {
  .tb-quick-facts__fact + .tb-quick-facts__fact {
   border-left: 0;
  }
 }
</style>
