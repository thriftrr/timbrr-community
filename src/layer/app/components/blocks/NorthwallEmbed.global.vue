<script setup>
 // Another service's page in a frame, under an optional heading. The frame
 // is sandboxed: its scripts and forms work inside it, and it can open a
 // new tab, but it can't move this page somewhere else. With no address the
 // site draws nothing but the heading; the canvas says what's missing. On
 // the canvas the frame can't take the pointer, or a click on it would never
 // reach the studio.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();

 const src = computed(() => embedFrame(props.data.url));
 const name = computed(() => props.data.title.trim() || props.data.headline.trim() || 'Embedded content');
 const host = computed(() => (src.value ? new URL(src.value).hostname.replace(/^www\./, '') : ''));
</script>

<template>
 <section class="tb-section tb-embed" :class="`tb-embed--${data.height}`">
  <div class="tb-wrap" :class="{ 'tb-wrap--wide': data.width === 'wide' }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="src" class="tb-embed__stage" :class="{ 'tb-embed__stage--still': canvas }">
    <iframe
     :src="src"
     :title="name"
     loading="lazy"
     sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
     allow="payment"
     referrerpolicy="strict-origin-when-cross-origin"
     class="tb-embed__frame"
    ></iframe>
   </div>
   <p v-if="src" class="tb-embed__out">
    <a :href="src" target="_blank" rel="noopener">Open {{ name }} in a new tab</a>
    <span class="tb-embed__host">{{ host }}</span>
   </p>
   <p v-else-if="canvas" class="tb-embed__empty">
    {{ data.url.trim() ? "That isn't a secure web address. It has to start with https://" : 'Paste the address of the calendar, schedule or shop to show here.' }}
   </p>
  </div>
 </section>
</template>

<style>
 /* The frame sits on the page as a card would: one border, the site's
    corners, the other service's own page inside. */
 .tb-embed__stage {
  overflow: hidden;
  height: min(640px, calc(var(--tb-screen, 100svh) * 0.85));
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-embed--short .tb-embed__stage {
  height: min(420px, calc(var(--tb-screen, 100svh) * 0.85));
 }

 .tb-embed--tall .tb-embed__stage {
  height: min(900px, calc(var(--tb-screen, 100svh) * 0.85));
 }

 .tb-embed__stage--still {
  pointer-events: none;
 }

 .tb-embed__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
 }

 /* A way out for a frame that's cramped on a phone, or that the other
    service refuses to show inside a page. */
 .tb-embed__out {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
  margin: 10px 0 0;
  font-size: 14.5px;
  color: var(--site-muted);
 }

 .tb-embed__out a {
  font-weight: 700;
  color: var(--site-accent);
  text-underline-offset: 0.15em;
 }

 .tb-embed__host {
  font-size: 13px;
  overflow-wrap: anywhere;
 }

 .tb-embed__empty {
  margin: 0;
  border: 1px dashed var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(28px, 6vw, 56px) 20px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-muted);
  text-align: center;
  text-wrap: balance;
 }
</style>
