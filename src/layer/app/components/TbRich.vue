<script>
 // Rich text, from the document tree the studio stores (never HTML): pass
 // the block's `data` and the field's path (`field="items.0.body"`), or a
 // `doc` directly. Only the nodes and marks below are drawn; links go
 // through safeHref. Nothing a page holds can become markup on the site. A
 // plain string (older pages) is drawn as paragraphs.
 //
 // In the studio's canvas the same element is where you type: clicking it
 // (or tabbing to it) swaps in TbRichEditor, which draws the same tags in
 // the same place, so nothing on the page moves. The editor, and TipTap
 // with it, only ever loads there; the site never fetches either.
 import { computed, h, nextTick, ref, shallowRef } from 'vue';

 const BLOCK_TAGS = { paragraph: 'p', bulletList: 'ul', listItem: 'li', blockquote: 'blockquote' };

 function marked(node) {
  let out = node.text ?? '';
  for (const mark of node.marks ?? []) {
   if (mark.type === 'bold') out = h('strong', out);
   else if (mark.type === 'italic') out = h('em', out);
   else if (mark.type === 'underline') out = h('u', out);
   else if (mark.type === 'link') {
    const href = safeHref(mark.attrs?.href);
    out = href ? h('a', { href, rel: /^https?:/i.test(href) ? 'noopener' : undefined }, [out]) : out;
   }
  }
  return out;
 }

 function draw(node, key) {
  if (!node || typeof node !== 'object') return null;
  const children = () => (Array.isArray(node.content) ? node.content.map(draw) : []);
  if (node.type === 'text') return marked(node);
  if (node.type === 'hardBreak') return h('br', { key });
  if (node.type === 'heading') return h(node.attrs?.level === 3 ? 'h3' : 'h2', { key }, children());
  if (node.type === 'orderedList') {
   const start = Number(node.attrs?.start);
   return h('ol', { key, start: Number.isInteger(start) && start !== 1 ? start : undefined }, children());
  }
  if (BLOCK_TAGS[node.type]) return h(BLOCK_TAGS[node.type], { key }, children());
  return children();
 }

 // A string as paragraphs: blank lines split them, single newlines break.
 function fromString(text) {
  return String(text)
   .split(/\n{2,}/)
   .filter((part) => part.trim())
   .map((part, index) => {
    const lines = part.split('\n');
    return h('p', { key: index }, lines.flatMap((line, i) => (i ? [h('br'), line] : [line])));
   });
 }

 // Whether there's anything to read. On the canvas a field with no words
 // shows "Type here", so there's still something to click.
 function hasWords(value) {
  if (typeof value === 'string') return value.trim() !== '';
  if (value?.type === 'text') return String(value.text ?? '').trim() !== '';
  return Array.isArray(value?.content) && value.content.some(hasWords);
 }

 // The canvas's editor: its own chunk, fetched when the pointer first
 // comes near a rich field there.
 const loadEditor = () => import('./TbRichEditor.vue');

 export default {
  props: {
   data: { type: Object, default: null },
   field: { type: String, default: '' },
   doc: { type: [Object, String], default: null },
  },
  setup(props) {
   const canvas = useCanvas();
   const scope = useBlockScope();
   const editable = computed(() => Boolean(canvas?.editable.value && scope && props.field));
   const editing = computed(() => {
    const active = canvas?.active.value;
    return editable.value && active?.kind === 'rich' && active.id === scope.id && active.field === props.field;
   });
   const Editor = shallowRef(null);
   const point = shallowRef(null); // where the click landed, for the caret
   const el = ref(null);
   let pressed = null;
   let quiet = false;

   function preload() {
    loadEditor()
     .then((module) => module.loadTiptap())
     .catch(() => {});
   }

   async function start() {
    if (editing.value) return;
    point.value = pressed;
    pressed = null;
    canvas.activate({ id: scope.id, field: props.field, kind: 'rich' });
    if (Editor.value) return;
    try {
     Editor.value = (await loadEditor()).default;
    } catch {
     // It didn't load (offline, or a newer build is out): stay as text.
     canvas.release(scope.id, props.field);
    }
   }

   function onPointerdown(event) {
    pressed = { x: event.clientX, y: event.clientY };
    // Already focused (after Escape, say), so the click won't focus it again.
    if (document.activeElement === el.value) start();
   }

   function onFocus() {
    if (!quiet) start();
   }

   // Gone before the editor arrived: never mind.
   function onBlur() {
    if (editing.value && !Editor.value) canvas.release(scope.id, props.field);
   }

   function onKeydown(event) {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    start();
   }

   // Escape, or Enter in a one-paragraph field: back to text, with the
   // keyboard still here so Tab carries on from this field.
   function done() {
    canvas.release(scope.id, props.field);
    nextTick(() => {
     quiet = true;
     el.value?.focus({ preventScroll: true });
     quiet = false;
    });
   }

   return () => {
    const value = props.field ? valueAt(props.data, props.field) : props.doc;
    const content = typeof value === 'string' ? fromString(value) : Array.isArray(value?.content) ? value.content.map(draw) : [];
    if (!editable.value) return h('div', { class: 'tb-rich' }, content);

    const label = canvas.labelFor(scope.def, props.field);
    const empty = hasWords(value) ? undefined : '';
    if (editing.value && Editor.value) {
     return h(
      Editor.value,
      {
       id: scope.id,
       field: props.field,
       value,
       tools: canvas.toolsFor(scope.def, props.field),
       label,
       point: point.value,
       'data-empty': empty,
       onDone: done,
      },
      { default: () => content },
     );
    }
    return h(
     'div',
     {
      ref: el,
      class: 'tb-rich',
      tabindex: 0,
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-label': label,
      'data-field': props.field,
      'data-empty': empty,
      onPointerenter: preload,
      onPointerdown,
      onFocus,
      onBlur,
      onKeydown,
     },
     content,
    );
   };
  },
 };
</script>
