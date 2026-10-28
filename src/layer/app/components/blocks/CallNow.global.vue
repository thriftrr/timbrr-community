<script setup>
 // Click-to-call on a band in the brand color: a line asking people to
 // call, the number big enough to hit with a thumb (on a phone, tapping it
 // dials), when someone picks up beside a green light, and small print.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();

 // An empty field isn't drawn, except on the studio's canvas while it's
 // being typed into, so clearing it to start over doesn't lose the caret.
 function shows(field, value) {
  if (String(value ?? '').trim()) return true;
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }

 // The number to dial: its digits (and a leading +), less any extension.
 // A number with words in it (1-800-FLOWERS, "or text us") stays text
 // rather than dial the wrong number.
 const tel = computed(() => {
  const number = props.data.phone.replace(/\s*(?:ext\.?|extension|x)\s*\d+\s*$/i, '');
  if (/[a-z]/i.test(number)) return undefined;
  const digits = number.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return /\d{3}/.test(digits) ? safeHref(`tel:${digits}`) : undefined;
 });
</script>

<template>
 <section class="tb-section tb-call-now">
  <div class="tb-wrap tb-call-now__inner">
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-call-now__headline" />
   <p v-if="shows('phone', data.phone)" class="tb-call-now__phone">
    <component :is="tel ? 'a' : 'span'" :href="tel" class="tb-call-now__dial">
     <TbText :data="data" field="phone" />
    </component>
   </p>
   <p v-if="shows('body', data.body)" class="tb-call-now__hours">
    <span class="tb-call-now__light" aria-hidden="true" />
    <TbText :data="data" field="body" />
   </p>
   <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-call-now__note" />
  </div>
 </section>
</template>

<style>
 .tb-call-now {
  padding-block: calc(var(--site-space) * 0.75);
  background: var(--site-accent);
  color: var(--site-accent-ink);
  text-align: center;
 }

 .tb-call-now__inner {
  overflow-wrap: break-word;
 }

 .tb-call-now__inner > :first-child {
  margin-top: 0;
 }

 .tb-call-now__headline {
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-wrap: balance;
  color: color-mix(in srgb, var(--site-accent-ink) 84%, var(--site-accent));
 }

 .tb-call-now__phone {
  margin: 12px 0 0;
  font-family: var(--site-font-display);
  font-size: clamp(34px, 3.6vw + 13px, 54px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.01em;
 }

 .tb-call-now__dial {
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
 }

 a.tb-call-now__dial:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.16em;
 }

 a.tb-call-now__dial:focus-visible {
  outline: 2px solid var(--site-accent-ink);
  outline-offset: 4px;
 }

 /* When someone picks up, after a green light (green whatever the brand
    color, since it means open). */
 .tb-call-now__hours {
  display: flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  max-width: 100%;
  margin: 14px auto 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
  color: color-mix(in srgb, var(--site-accent-ink) 94%, var(--site-accent));
 }

 .tb-call-now__light {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #8fd3aa;
 }

 .tb-call-now__note {
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--site-accent-ink) 84%, var(--site-accent));
 }
</style>
