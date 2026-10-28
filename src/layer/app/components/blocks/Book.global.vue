<script setup>
 // Booking: a tagline, a headline and a few words on the left, the button
 // that books (with who takes the booking beside it), and on the right a
 // calendar of the next four weeks with today marked. The calendar is a
 // picture, not a picker: a click on it opens the first button's link, and
 // keyboards and screen readers go by the buttons alone.
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
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }

 // The buttons with a label, by place. One without says nothing, so it
 // isn't drawn.
 const buttons = computed(() =>
  props.data.buttons.flatMap((button, index) => (shows(`buttons.${index}.label`, button.label) ? [index] : [])),
 );

 // Where the calendar goes: the first of those buttons with a link.
 const calendarHref = computed(() => buttons.value.map((index) => safeHref(props.data.buttons[index].to)).find(Boolean));

 const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
 const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

 const dayOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

 // Today: the day the page was drawn on, so it wakes up in the browser
 // showing what the server sent, then the visitor's own day once it runs.
 const today = useState('timbrr-book-today', () => dayOf(new Date()));
 onMounted(() => {
  today.value = dayOf(new Date());
 });

 // Four weeks from the Sunday of this one, the way a booking calendar
 // opens: the days before today faded, today marked. Named for this month,
 // and the next when the weeks run into it.
 const calendar = computed(() => {
  const [year, month, date] = today.value.split('-').map(Number);
  const first = date - new Date(year, month - 1, date).getDay();
  const days = Array.from({ length: 28 }, (_, i) => ({
   date: new Date(year, month - 1, first + i).getDate(),
   past: first + i < date,
   today: first + i === date,
  }));
  const last = new Date(year, month - 1, first + 27).getMonth();
  return { title: last === month - 1 ? MONTHS[last] : `${MONTHS[month - 1]} – ${MONTHS[last]}`, days };
 });
</script>

<template>
 <section class="tb-section tb-book">
  <div class="tb-wrap tb-book__inner">
   <div class="tb-book__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading tb-book__headline" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-book__body" />
    <div v-if="buttons.length || shows('provider', data.provider)" class="tb-buttons tb-book__actions">
     <TbButton v-for="index in buttons" :key="index" :data="data" :field="`buttons.${index}`" />
     <TbText v-if="shows('provider', data.provider)" :data="data" field="provider" tag="p" class="tb-book__provider" />
    </div>
   </div>
   <component
    :is="calendarHref ? 'a' : 'div'"
    :href="calendarHref"
    :tabindex="calendarHref ? -1 : undefined"
    class="tb-book__calendar"
    aria-hidden="true"
   >
    <p class="tb-book__month">{{ calendar.title }}</p>
    <div class="tb-book__days">
     <span v-for="(weekday, index) in WEEKDAYS" :key="`w${index}`" class="tb-book__weekday">{{ weekday }}</span>
     <span v-for="(day, index) in calendar.days" :key="index" class="tb-book__day" :class="{ 'is-past': day.past, 'is-today': day.today }">{{ day.date }}</span>
    </div>
   </component>
  </div>
 </section>
</template>

<style>
 .tb-book__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  gap: clamp(28px, 4vw, 48px);
  align-items: center;
 }

 .tb-book__text {
  overflow-wrap: break-word;
 }

 .tb-book .tb-book__text > :first-child {
  margin-top: 0;
 }

 .tb-book .tb-book__headline {
  line-height: 1.15;
 }

 .tb-book__body {
  margin-top: 14px;
  font-size: clamp(16px, 0.4vw + 14px, 17.5px);
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-book .tb-book__actions {
  align-items: center;
  gap: 12px 16px;
  margin-top: 24px;
 }

 .tb-book__provider {
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--site-muted);
 }

 /* The calendar: a card of the next four weeks. */
 .tb-book__calendar {
  display: block;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(16px, 2vw, 20px);
  background: var(--site-surface);
  color: var(--site-muted);
  text-decoration: none;
  transition:
   border-color 120ms ease,
   box-shadow 120ms ease;
 }

 a.tb-book__calendar:hover {
  border-color: color-mix(in srgb, var(--site-accent) 45%, var(--site-border));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--site-heading) 8%, transparent);
 }

 .tb-book__month {
  margin: 0;
  padding: 0 4px 12px;
  font-family: var(--site-font-display);
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  color: var(--site-heading);
 }

 .tb-book__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
  font-family: var(--site-font-mono);
  font-size: 12.5px;
  line-height: 1.4;
  text-align: center;
 }

 .tb-book__weekday {
  padding-bottom: 2px;
 }

 .tb-book__day {
  border-radius: 7px;
  padding: 7px 0;
 }

 .tb-book__day.is-past {
  opacity: 0.4;
 }

 .tb-book__day.is-today {
  background: var(--site-accent);
  font-weight: 700;
  color: var(--site-accent-ink);
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-book__calendar {
   transition: none;
  }
 }

 /* Small screens: the words first, the calendar under them. */
 @media (max-width: 720px) {
  .tb-book__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-book__calendar {
   width: 100%;
   max-width: 420px;
  }
 }
</style>
