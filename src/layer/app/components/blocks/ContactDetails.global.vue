<script setup>
 // How to reach the business, in up to three cards side by side: a number
 // to call, an address to write to, and the accounts to follow. A card
 // shows when its field has something in it, and each line is a link where
 // it can be: the number dials, the email opens a new message, a handle
 // opens its profile. A line that can't be one is the same <a> without an
 // address, so typing a number on the canvas until it dials doesn't swap
 // the element (and the caret) out from under the person typing.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // The number to dial: its digits (and a leading +), less any extension.
 // A number with words in it (1-800-FLOWERS, "or text us") stays text
 // rather than dial the wrong number.
 const tel = computed(() => {
  const number = props.data.phone.replace(/\s*(?:ext\.?|extension|x)\s*\d+\s*$/i, '');
  if (/[a-z]/i.test(number)) return undefined;
  const digits = number.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return /\d{3}/.test(digits) ? safeHref(`tel:${digits}`) : undefined;
 });

 const mailto = computed(() => {
  const email = props.data.email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? safeHref(`mailto:${email}`) : undefined;
 });

 // Where a network keeps its profiles, for a handle typed on its own.
 const PROFILES = [
  [/\binstagram\b/i, (name) => `https://www.instagram.com/${name}/`],
  [/\bfacebook\b/i, (name) => `https://www.facebook.com/${name}`],
  [/\btiktok\b/i, (name) => `https://www.tiktok.com/@${name}`],
  [/\byoutube\b/i, (name) => `https://www.youtube.com/@${name}`],
  [/^x\b|\btwitter\b/i, (name) => `https://x.com/${name}`],
 ];

 // The account a handle names: "@yourshop", "/yourshop", "yourshop", or the
 // profile's own address.
 const HANDLE = /^(?:(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/)?[@/]?(\w[\w.-]{0,59})\/?$/i;

 // A row's link: its own, when it has one; else the profile its handle
 // names on one of the networks above; else a full address typed as the
 // handle. Otherwise the row is plain text.
 function profile(item) {
  const own = safeHref(item.to);
  if (own) return own;
  const handle = item.body.trim();
  const build = PROFILES.find(([network]) => network.test(item.title.trim()))?.[1];
  const name = HANDLE.exec(handle)?.[1];
  if (build && name) return safeHref(build(name));
  return /^https:\/\//i.test(handle) ? safeHref(handle) : undefined;
 }

 // Each row's link, and its rel when it leaves the site.
 const links = computed(() =>
  props.data.items.map((item) => {
   const href = profile(item);
   return { href, rel: href && /^https?:/i.test(href) ? 'noopener' : undefined };
  }),
 );
 // A card, or a social row, shows while it has something in it, or while
 // its last word is being typed over on the canvas.
 const social = (item, index) => shows(`items.${index}.title`, item.title) || shows(`items.${index}.body`, item.body);
 const hasPhone = computed(() => shows('phone', props.data.phone));
 const hasEmail = computed(() => shows('email', props.data.email));
 const hasSocials = computed(() => props.data.items.some(social));
 const cards = computed(() => [hasPhone.value, hasEmail.value, hasSocials.value].filter(Boolean).length);
</script>

<template>
 <section class="tb-section tb-contact-details">
  <div class="tb-wrap">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="h2" class="tb-eyebrow tb-contact-details__tagline" />
   <dl v-if="cards" class="tb-contact-details__grid" :class="`tb-contact-details__grid--${cards}`">
    <div v-if="hasPhone" class="tb-card tb-contact-details__card">
     <dt class="tb-eyebrow tb-contact-details__label">Call</dt>
     <dd class="tb-contact-details__value tb-contact-details__value--phone">
      <a :href="tel" class="tb-contact-details__link">
       <TbText :data="data" field="phone" />
      </a>
     </dd>
    </div>
    <div v-if="hasEmail" class="tb-card tb-contact-details__card">
     <dt class="tb-eyebrow tb-contact-details__label">Email</dt>
     <dd class="tb-contact-details__value tb-contact-details__value--email">
      <a :href="mailto" class="tb-contact-details__link">
       <TbText :data="data" field="email" />
      </a>
     </dd>
    </div>
    <div v-if="hasSocials" class="tb-card tb-contact-details__card">
     <dt class="tb-eyebrow tb-contact-details__label">Follow</dt>
     <dd class="tb-contact-details__value">
      <ul class="tb-contact-details__socials" role="list">
       <template v-for="(item, index) in data.items" :key="index">
        <li v-if="social(item, index)">
         <a :href="links[index].href" :rel="links[index].rel" class="tb-contact-details__link tb-contact-details__social">
          <TbText v-if="shows(`items.${index}.title`, item.title)" :data="data" :field="`items.${index}.title`" class="tb-contact-details__network" />
          <TbText v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-contact-details__handle" />
         </a>
        </li>
       </template>
      </ul>
     </dd>
    </div>
   </dl>
  </div>
 </section>
</template>

<style>
 .tb-contact-details .tb-contact-details__tagline {
  margin: 0 0 20px;
  font-weight: 400;
  text-align: center;
 }

 .tb-contact-details__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 1.6vw, 18px);
  margin: 0;
 }

 /* Fewer cards stay card-sized, in the middle, rather than spanning the
    page. */
 .tb-contact-details__grid--1 {
  grid-template-columns: minmax(0, 1fr);
  max-width: 420px;
  margin-inline: auto;
 }

 .tb-contact-details__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 760px;
  margin-inline: auto;
 }

 .tb-contact-details .tb-contact-details__card {
  padding: clamp(18px, 2vw, 22px);
  text-align: center;
 }

 .tb-contact-details .tb-contact-details__label {
  margin: 0;
 }

 .tb-contact-details__value {
  margin: 8px 0 0;
  color: var(--site-accent);
 }

 .tb-contact-details__value--phone {
  font-family: var(--site-font-display);
  font-size: clamp(20px, 0.6vw + 16px, 23px);
  font-weight: 800;
  line-height: 1.25;
 }

 .tb-contact-details__value--email {
  margin-top: 10px;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 14.5px, 19px);
  font-weight: 800;
  line-height: 1.3;
 }

 .tb-contact-details__socials {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* A social row: the network, quieter, then the handle. */
 .tb-contact-details__social {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 0.4em;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
 }

 .tb-contact-details__network {
  font-weight: 500;
  color: var(--site-body);
 }

 .tb-contact-details__link {
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
 }

 .tb-contact-details__link:any-link:hover {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.2em;
 }

 .tb-contact-details__link:any-link:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 /* Phones: the cards stack. */
 @media (max-width: 640px) {
  .tb-contact-details__grid,
  .tb-contact-details__grid--2 {
   grid-template-columns: minmax(0, 1fr);
   max-width: 420px;
   margin-inline: auto;
  }
 }
</style>
