<script setup>
 // Where the business is and when it's open, from Site details, with
 // anything typed into the block's `custom` winning over them, key by key.
 // The address, the number and how to get in touch on one side, the week
 // and a drawn map on the other, and the service area under both.
 //
 // Open now is worked out here in the browser, after the page loads, because
 // pages are cached for a minute at the edge and the answer has to be this
 // minute's. It starts empty on the server and stays empty for typed hours or
 // without a time zone, so it can be absent but never wrong. The map is a
 // drawing that links out, never an embed, so the page has no map script to
 // wait on and no map bill to run up.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const site = useTimbrrSite();
 const details = computed(() => site?.value?.details ?? null);
 const custom = computed(() => props.data.custom);

 const text = (value) => (typeof value === 'string' ? value.trim() : '');

 const phone = computed(() => text(custom.value.phone) || text(details.value?.phone));
 const email = computed(() => text(custom.value.email) || text(details.value?.email));
 const note = computed(() => text(custom.value.note) || text(details.value?.note));

 // Two lines: the street, then the city, region and postal code.
 const address = computed(() => {
  const typed = text(custom.value.address);
  if (typed) return typed;
  const place = [text(details.value?.city), [text(details.value?.region), text(details.value?.postal)].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [text(details.value?.street), place].filter(Boolean).join('\n');
 });

 // Typed hours are words already; those from Site details share a line
 // where days in a row match.
 const typedHours = computed(() => custom.value.hours.filter((row) => text(row.title) || text(row.body)));
 const hours = computed(() => (typedHours.value.length ? typedHours.value : groupHours(details.value?.hours)));

 const mapHref = computed(() => {
  const own = safeHref(custom.value.map_url);
  if (own) return own;
  const place = address.value.replace(/\n/g, ', ');
  return place ? safeHref(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`) : undefined;
 });

 const showHours = computed(() => props.data.show_hours && hours.value.length > 0);
 const showAddress = computed(() => props.data.show_address && Boolean(address.value));
 const showPhone = computed(() => props.data.show_phone && Boolean(phone.value));
 const showEmail = computed(() => props.data.show_phone && Boolean(email.value));
 const showMap = computed(() => props.data.show_map && Boolean(mapHref.value));
 const links = computed(() =>
  props.data.links.flatMap((item, index) => {
   if (!shows(`links.${index}.title`, item.title) && !shows(`links.${index}.body`, item.body)) return [];
   const href = profileHref(item);
   return [{ item, index, href, rel: href && /^https?:/i.test(href) ? 'noopener' : undefined }];
  }),
 );
 const areas = computed(() => props.data.areas.map((item, index) => ({ item, index })).filter(({ item, index }) => shows(`areas.${index}.title`, item.title)));
 const hasArea = computed(() => areas.value.length > 0 || shows('area_headline', props.data.area_headline) || shows('area_body', props.data.area_body));

 const hasWords = computed(() => showAddress.value || showPhone.value || showEmail.value || Boolean(note.value) || links.value.length > 0);
 const hasSide = computed(() => showHours.value || showMap.value);
 // Nothing to say at all, on the canvas: where to go to fix that.
 const empty = computed(() => Boolean(canvas) && !hasWords.value && !hasSide.value && !hasArea.value);

 // ── Open now ──
 // Nothing until the page is in the browser, then once a minute, so a tab
 // left open doesn't go on saying "open" after closing time.
 const status = ref(null);
 let clock = null;

 function tell() {
  const live = props.data.show_open_now && !typedHours.value.length;
  status.value = live ? openNow(details.value?.hours, details.value?.timezone) : null;
 }

 onMounted(() => {
  tell();
  clock = setInterval(tell, 60000);
 });
 onBeforeUnmount(() => clearInterval(clock));
 // On the canvas the switch and the details change under a mounted block.
 watch([() => props.data.show_open_now, typedHours, details], tell);
</script>

<template>
 <section class="tb-section tb-visit">
  <div class="tb-wrap">
   <div class="tb-visit__inner" :class="{ 'tb-visit__inner--one': !hasSide }">
    <div class="tb-visit__words">
     <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
     <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
     <p v-if="status" class="tb-visit__status" :class="{ 'tb-visit__status--open': status.open }">
      <span class="tb-visit__dot" aria-hidden="true"></span>
      {{ status.label }}
     </p>
     <address v-if="showAddress" class="tb-visit__address">{{ address }}</address>
     <ul v-if="showPhone || showEmail" class="tb-visit__contact" role="list">
      <li v-if="showPhone"><a :href="telHref(phone)" class="tb-visit__link">{{ phone }}</a></li>
      <li v-if="showEmail"><a :href="mailHref(email)" class="tb-visit__link">{{ email }}</a></li>
     </ul>
     <p v-if="note" class="tb-visit__note">{{ note }}</p>
     <ul v-if="links.length" class="tb-visit__links" role="list">
      <li v-for="{ item, index, href, rel } in links" :key="index">
       <a :href="href" :rel="rel" class="tb-visit__social">
        <TbText v-if="shows(`links.${index}.title`, item.title)" :data="data" :field="`links.${index}.title`" class="tb-visit__network" />
        <TbText v-if="shows(`links.${index}.body`, item.body)" :data="data" :field="`links.${index}.body`" />
       </a>
      </li>
     </ul>
     <div v-if="showAddress && mapHref" class="tb-buttons tb-visit__directions">
      <a :href="mapHref" class="tb-button tb-button--outline" rel="noopener">Get directions</a>
     </div>
     <p v-if="empty" class="tb-visit__empty">Add your address, phone and hours in Site settings, under Business details, and they'll show here.</p>
    </div>
    <div v-if="hasSide" class="tb-visit__side">
     <dl v-if="showHours" class="tb-card tb-visit__hours">
      <div v-for="(row, index) in hours" :key="index" class="tb-visit__row">
       <dt class="tb-visit__days">{{ row.title }}</dt>
       <dd class="tb-visit__time">{{ row.body }}</dd>
      </div>
     </dl>
     <a v-if="showMap" :href="mapHref" :tabindex="showAddress ? -1 : undefined" :aria-hidden="showAddress ? 'true' : undefined" :aria-label="showAddress ? undefined : 'Open the map'" class="tb-visit__map" rel="noopener">
      <span class="tb-visit__road tb-visit__road--main"></span>
      <span class="tb-visit__road tb-visit__road--cross"></span>
      <svg class="tb-visit__pin" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
       <path d="M12 22s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12z" />
       <circle cx="12" cy="10" r="2.5" />
      </svg>
     </a>
    </div>
   </div>
   <div v-if="hasArea" class="tb-visit__area" :class="{ 'tb-visit__area--first': !hasWords && !hasSide }">
    <TbText v-if="shows('area_headline', data.area_headline)" :data="data" field="area_headline" tag="h3" class="tb-visit__area-headline" />
    <TbRich v-if="shows('area_body', data.area_body)" :data="data" field="area_body" class="tb-visit__area-body" />
    <ul v-if="areas.length" class="tb-visit__areas" role="list">
     <TbText v-for="{ index } in areas" :key="index" :data="data" :field="`areas.${index}.title`" tag="li" class="tb-visit__chip" />
    </ul>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-visit__inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(28px, 4vw, 40px);
  align-items: start;
 }

 /* Only the words: one column, kept to a readable width. */
 .tb-visit__inner--one {
  grid-template-columns: minmax(0, 1fr);
  max-width: 640px;
 }

 .tb-visit__words {
  overflow-wrap: break-word;
 }

 .tb-visit__words > :first-child {
  margin-top: 0;
 }

 /* Open now: a soft pill, with a dot that has a ring when the doors are. */
 .tb-visit__status {
  display: flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  max-width: 100%;
  margin: 16px 0 0;
  border-radius: 999px;
  padding: 6px 14px 6px 11px;
  background: var(--site-surface);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--site-body);
 }

 .tb-visit__dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--site-muted);
 }

 .tb-visit__status--open {
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
  color: color-mix(in srgb, var(--site-accent) 70%, var(--site-heading));
 }

 .tb-visit__status--open .tb-visit__dot {
  background: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 18%, transparent);
 }

 .tb-visit__address {
  margin: 18px 0 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.5vw + 14.5px, 20px);
  font-style: normal;
  font-weight: 700;
  line-height: 1.4;
  color: var(--site-heading);
  white-space: pre-line;
 }

 .tb-visit__contact,
 .tb-visit__links {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
 }

 .tb-visit__contact li + li,
 .tb-visit__links li + li {
  margin-top: 4px;
 }

 .tb-visit__link,
 .tb-visit__social {
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-visit__link {
  font-size: 17px;
  font-weight: 700;
 }

 a.tb-visit__link:not([href]),
 a.tb-visit__social:not([href]) {
  color: var(--site-body);
 }

 .tb-visit__social {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 8px;
  font-size: 15px;
 }

 .tb-visit__network {
  font-weight: 700;
 }

 .tb-visit__note {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-muted);
  white-space: pre-line;
 }

 .tb-visit__directions {
  margin-top: 20px;
 }

 .tb-visit__empty {
  margin: 16px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--site-muted);
 }

 .tb-visit__side {
  display: grid;
  gap: clamp(16px, 2vw, 20px);
 }

 /* The week: days on the left, hours on the right, a rule between each. */
 .tb-visit .tb-visit__hours {
  margin: 0;
  padding: 6px clamp(18px, 2.2vw, 22px);
 }

 .tb-visit__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px 16px;
  padding: clamp(11px, 1.3vw, 13px) 0;
 }

 .tb-visit__row + .tb-visit__row {
  border-top: 1px solid var(--site-border);
 }

 .tb-visit__days {
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.3vw + 14.5px, 17px);
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-visit__time {
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 14px;
  color: var(--site-body);
 }

 /* The map: a street grid in the site's colors, and a pin. */
 .tb-visit__map {
  --tb-visit-paper: color-mix(in srgb, var(--site-surface), var(--site-bg));
  --tb-visit-land: color-mix(in srgb, var(--site-accent) 10%, var(--tb-visit-paper));
  --tb-visit-line: color-mix(in srgb, var(--site-accent) 20%, var(--tb-visit-paper));
  --tb-visit-cell: clamp(26px, 3vw, 34px);
  position: relative;
  display: block;
  min-height: clamp(180px, 20vw, 220px);
  overflow: hidden;
  border-radius: var(--site-radius);
  background-color: var(--tb-visit-land);
  background-image:
   linear-gradient(var(--tb-visit-line) 1px, transparent 1px),
   linear-gradient(90deg, var(--tb-visit-line) 1px, transparent 1px);
  background-size: var(--tb-visit-cell) var(--tb-visit-cell);
 }

 .tb-visit__road {
  position: absolute;
  background: var(--site-surface);
 }

 .tb-visit__road--main {
  top: 46%;
  right: -6%;
  left: -6%;
  height: clamp(12px, 1.4vw, 17px);
  transform: rotate(-6deg);
 }

 .tb-visit__road--cross {
  top: 0;
  bottom: 0;
  left: 38%;
  width: clamp(9px, 1vw, 12px);
 }

 .tb-visit__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--site-accent);
  transform: translate(-50%, -100%);
  transition: transform 160ms ease;
 }

 .tb-visit__pin path {
  fill: currentColor;
 }

 .tb-visit__pin circle {
  fill: var(--site-accent-ink);
 }

 .tb-visit__map:hover .tb-visit__pin {
  transform: translate(-50%, calc(-100% - 4px));
 }

 /* The service area: its own row under the rest, the places as chips. */
 .tb-visit__area {
  margin-top: clamp(28px, 4vw, 40px);
  border-top: 1px solid var(--site-border);
  padding-top: clamp(20px, 2.4vw, 28px);
  overflow-wrap: break-word;
 }

 .tb-visit__area--first {
  margin-top: 16px;
  border-top: 0;
  padding-top: 0;
 }

 .tb-visit__area-headline {
  margin: 0 0 8px;
  font-family: var(--site-font-display);
  font-size: clamp(18px, 0.5vw + 15.5px, 21px);
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-visit__area-body {
  max-width: 40em;
  font-size: 16px;
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-visit__areas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
 }

 .tb-visit__chip {
  border: 1px solid var(--site-border);
  border-radius: 999px;
  padding: 5px 13px;
  background: var(--site-surface);
  font-size: 14.5px;
  line-height: 1.35;
  color: var(--site-ink);
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-visit__pin {
   transition: none;
  }

  .tb-visit__map:hover .tb-visit__pin {
   transform: translate(-50%, -100%);
  }
 }

 /* Small screens: everything in one column, the map cropped wider so it
    doesn't take the whole screen. */
 @media (max-width: 720px) {
  .tb-visit__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-visit__map {
   min-height: 0;
   aspect-ratio: 16 / 9;
  }
 }
</style>
