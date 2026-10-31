<script setup>
 // Big numbers in a row, each over a short label. Count up is a flourish on
 // top of a page that's already right: the server draws the real numbers, so
 // that's what anyone without scripts sees. Once the page is in the browser,
 // numbers still out of sight drop to zero and climb when they scroll in;
 // numbers already on screen stay as they are rather than jump back. It does
 // nothing for anyone who asked for less motion, or on the canvas, where the
 // numbers are typed in place.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const el = ref(null);
 // What's drawn in place of the numbers while they climb, or null when
 // they're the real ones.
 const frames = ref(null);
 const across = computed(() => Math.max(1, Math.min(4, props.data.items.length)));

 const DURATION = 1200;

 // '$12,500+' → a number to count to, and how to write it on the way there.
 // Something with no digits comes back null, and stays as it is.
 function counter(text) {
  const match = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/s.exec(text);
  if (!match) return null;
  const [, before, digits, after] = match;
  const target = Number(digits.replace(/,/g, ''));
  const places = digits.split('.')[1]?.length ?? 0;
  const grouped = digits.includes(',');
  return (share) => {
   const [whole, part] = (target * share).toFixed(places).split('.');
   const written = grouped ? whole.replace(/\B(?=(\d{3})+$)/g, ',') : whole;
   return `${before}${written}${part ? `.${part}` : ''}${after}`;
  };
 }

 let observer = null;
 let frame = 0;

 function draw(writers, share) {
  frames.value = props.data.items.map((item, index) => writers[index]?.(share) ?? item.value);
 }

 function climb(writers) {
  const start = performance.now();
  const step = (now) => {
   const progress = Math.min(1, (now - start) / DURATION);
   if (progress === 1) {
    frames.value = null;
    return;
   }
   draw(writers, 1 - (1 - progress) ** 3);
   frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
 }

 onMounted(() => {
  if (!props.data.count_up || canvas || !el.value || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const writers = props.data.items.map((item) => counter(item.value));
  if (!writers.some(Boolean)) return;
  let first = true;
  observer = new IntersectionObserver(
   ([entry]) => {
    if (first) {
     first = false;
     if (entry.isIntersecting) observer.disconnect();
     else draw(writers, 0);
     return;
    }
    if (!entry.isIntersecting) return;
    observer.disconnect();
    climb(writers);
   },
   { threshold: 0.3 },
  );
  observer.observe(el.value);
 });

 onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(frame);
 });
</script>

<template>
 <section class="tb-section tb-stats">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" ref="el" class="tb-stats__list" :class="`tb-stats__list--${across}`" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-stats__item">
     <p class="tb-stats__value">
      <span v-if="frames">{{ frames[index] }}</span>
      <TbText v-else :data="data" :field="`items.${index}.value`" />
     </p>
     <TbText v-if="shows(`items.${index}.label`, item.label)" :data="data" :field="`items.${index}.label`" tag="p" class="tb-stats__label" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-stats__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 36px);
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: center;
 }

 .tb-stats__list--1 {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-stats__list--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 720px;
  margin-inline: auto;
 }

 .tb-stats__list--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
 }

 .tb-stats__item {
  min-width: 0;
  overflow-wrap: break-word;
 }

 /* Even digits, so a number doesn't shiver as it climbs. */
 .tb-stats__value {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(36px, 2.4vw + 24px, 52px);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
  color: var(--site-accent);
 }

 .tb-stats__label {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--site-body);
 }

 @media (max-width: 760px) {
  .tb-stats__list--3,
  .tb-stats__list--4 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tb-stats__list--3 .tb-stats__item:last-child {
   grid-column: 1 / -1;
  }
 }

 @media (max-width: 420px) {
  .tb-stats__list--2,
  .tb-stats__list--3,
  .tb-stats__list--4 {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
