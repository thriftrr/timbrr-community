<script>
 // The canvas's rich-text editor (docs/manifest.md § Inline editing).
 // TbRich swaps it in when you click into a rich field on the canvas:
 // TipTap, with only the tools this field allows, on an element with the
 // same class and the same tags TbRich draws, so nothing on the page moves.
 // Every change goes to the studio as a document; the studio's format bar
 // sends tools back. One is open at a time, and only the canvas ever loads
 // it, or TipTap.
 import { h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

 // TipTap, fetched once, the first time the canvas needs it.
 let loading = null;
 export function loadTiptap() {
  loading ??= Promise.all([import('@tiptap/core'), import('@tiptap/starter-kit'), import('@tiptap/pm/model'), import('@tiptap/pm/state')]).then(
   ([core, kit, model, state]) => ({
    Editor: core.Editor,
    Extension: core.Extension,
    textblockTypeInputRule: core.textblockTypeInputRule,
    StarterKit: kit.StarterKit ?? kit.default,
    Fragment: model.Fragment,
    Slice: model.Slice,
    TextSelection: state.TextSelection,
   }),
  );
  loading.catch(() => (loading = null));
  return loading;
 }

 // What each tool shows as on, for the format bar.
 const ACTIVE = [
  ['bold', (editor) => editor.isActive('bold')],
  ['italic', (editor) => editor.isActive('italic')],
  ['underline', (editor) => editor.isActive('underline')],
  ['link', (editor) => editor.isActive('link')],
  ['h2', (editor) => editor.isActive('heading', { level: 2 })],
  ['h3', (editor) => editor.isActive('heading', { level: 3 })],
  ['ul', (editor) => editor.isActive('bulletList')],
  ['ol', (editor) => editor.isActive('orderedList')],
 ];
 // Markdown-style typing (**bold**, "- " for a list) and pasted patterns
 // only for the tools the field allows.
 const INPUT_RULES = [
  ['bold', 'bold'],
  ['italic', 'italic'],
  ['ul', 'bulletList'],
  ['ol', 'orderedList'],
 ];
 const PASTE_RULES = [
  ['bold', 'bold'],
  ['italic', 'italic'],
  ['link', 'link'],
 ];
 const MARK_TOOLS = { bold: 'bold', italic: 'italic', underline: 'underline', link: 'link' };

 // ── A value as a document the editor can hold ──
 // Every node and mark TbRich draws is in the editor's schema, so whatever
 // a page holds loads as it is, formatting this field no longer offers
 // included; anything else is unwrapped to its text, the way TbRich draws it.

 function marksOf(node) {
  const marks = [];
  for (const mark of Array.isArray(node.marks) ? node.marks : []) {
   if (mark?.type === 'link') {
    const href = safeHref(mark.attrs?.href);
    if (href) marks.push({ type: 'link', attrs: { href } });
   } else if (MARK_TOOLS[mark?.type]) marks.push({ type: mark.type });
  }
  return marks.length ? { marks } : {};
 }

 function inline(nodes) {
  const out = [];
  for (const node of Array.isArray(nodes) ? nodes : []) {
   if (!node || typeof node !== 'object') continue;
   if (node.type === 'text') {
    // Only string text, the way TbRich draws it.
    const text = typeof node.text === 'string' ? node.text : '';
    if (text) out.push({ type: 'text', text, ...marksOf(node) });
   } else if (node.type === 'hardBreak') out.push({ type: 'hardBreak' });
   else out.push(...inline(node.content));
  }
  return out;
 }

 function listItem(item) {
  const content = blocks(item?.type === 'listItem' ? item.content : [item]);
  if (content[0]?.type === 'heading') content[0] = { type: 'paragraph', content: content[0].content };
  else if (content[0]?.type !== 'paragraph') content.unshift({ type: 'paragraph', content: [] });
  return { type: 'listItem', content };
 }

 function blocks(nodes) {
  const out = [];
  let loose = [];
  const settle = () => {
   if (loose.length) out.push({ type: 'paragraph', content: loose });
   loose = [];
  };
  for (const node of Array.isArray(nodes) ? nodes : []) {
   if (!node || typeof node !== 'object') continue;
   const { type } = node;
   if (type === 'text' || type === 'hardBreak') {
    loose.push(...inline([node]));
    continue;
   }
   settle();
   if (type === 'paragraph') out.push({ type, content: inline(node.content) });
   else if (type === 'heading') out.push({ type, attrs: { level: node.attrs?.level === 3 ? 3 : 2 }, content: inline(node.content) });
   else if (type === 'bulletList' || type === 'orderedList') {
    const items = (Array.isArray(node.content) ? node.content : []).filter((item) => item && typeof item === 'object').map(listItem);
    const start = Number(node.attrs?.start);
    if (items.length) out.push({ type, ...(type === 'orderedList' ? { attrs: { start: Number.isInteger(start) ? start : 1 } } : {}), content: items });
   } else if (type === 'blockquote') {
    const content = blocks(node.content);
    out.push({ type, content: content.length ? content : [{ type: 'paragraph', content: [] }] });
   } else out.push(...blocks(node.content));
  }
  settle();
  return out;
 }

 // A string the way TbRich draws one: blank lines split paragraphs, single
 // newlines break.
 function fromText(text) {
  return String(text)
   .split(/\n{2,}/)
   .filter((part) => part.trim())
   .map((part) => ({
    type: 'paragraph',
    content: part.split('\n').flatMap((line, i) => [...(i ? [{ type: 'hardBreak' }] : []), ...(line ? [{ type: 'text', text: line }] : [])]),
   }));
 }

 function toDoc(value) {
  const content = typeof value === 'string' ? fromText(value) : blocks(value?.content);
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] };
 }

 export default {
  props: {
   id: { type: String, required: true },
   field: { type: String, required: true },
   value: { type: [Object, String], default: null },
   tools: { type: Array, default: () => [] },
   label: { type: String, default: '' },
   point: { type: Object, default: null }, // { x, y } of the click that opened it
  },
  emits: ['done'],
  setup(props, { emit, slots }) {
   const canvas = useCanvas();
   const root = ref(null);
   const ready = ref(false);
   const has = (tool) => props.tools.includes(tool);
   // A field with headings or lists takes new paragraphs on Enter; any
   // other is done (Shift+Enter breaks the line).
   const blocky = ['h2', 'h3', 'ul', 'ol'].some(has);
   let editor = null;
   let mounted = false;
   let gone = false;

   // The caret is in this editor, in a window that has the keyboard.
   const typing = () => mounted && document.hasFocus() && editor.view.hasFocus();

   // Tell the studio where the caret is and what's on there. The canvas
   // only passes on what changed.
   function report() {
    if (!typing()) return;
    canvas.focus({
     id: props.id,
     field: props.field,
     kind: 'rich',
     label: props.label,
     tools: props.tools,
     active: ACTIVE.filter(([, on]) => on(editor)).map(([tool]) => tool),
     href: editor.isActive('link') ? (editor.getAttributes('link').href ?? '') : null,
    });
   }

   // Focus left the editor. That alone doesn't end the edit: a press on
   // the studio's format bar takes focus for a moment (the browser can even
   // hand it straight back to this frame, but not to the editor) and the
   // tool comes right back here. The edit ends on a press or the keyboard
   // moving elsewhere on this page (canvas.vue), on Escape, or when the
   // studio says so (timbrr:release). The studio hears the caret is out.
   function left() {
    setTimeout(() => {
     if (gone || !mounted) return;
     if (!typing()) canvas.blur(props.id, props.field);
    }, 0);
   }

   // Only the field's own formatting goes in, whatever was copied: other
   // marks come off; headings, lists and quotes it doesn't take become
   // paragraphs.
   function allowedSlice(slice, { Fragment, Slice }) {
    const { schema } = editor;
    let reshaped = false;
    const keep = (mark) => Boolean(MARK_TOOLS[mark.type.name]) && has(MARK_TOOLS[mark.type.name]);
    function clean(fragment) {
     const nodes = [];
     fragment.forEach((node) => {
      const name = node.type.name;
      if (node.isText) nodes.push(node.mark(node.marks.filter(keep)));
      else if (node.isLeaf) nodes.push(node);
      else if (name === 'heading' && !has(`h${node.attrs.level}`)) nodes.push(schema.nodes.paragraph.create(null, clean(node.content)));
      else if ((name === 'bulletList' && !has('ul')) || (name === 'orderedList' && !has('ol')) || name === 'blockquote') {
       reshaped = true;
       clean(node.content).forEach((child) => (child.type.name === 'listItem' ? child.content.forEach((inner) => nodes.push(inner)) : nodes.push(child)));
      } else nodes.push(node.copy(clean(node.content)));
     });
     return Fragment.fromArray(nodes);
    }
    const content = clean(slice.content);
    return reshaped ? new Slice(content, 0, 0) : new Slice(content, slice.openStart, slice.openEnd);
   }

   function create(tiptap) {
    const { Editor, Extension, StarterKit, textblockTypeInputRule } = tiptap;
    // Keyboard shortcuts for tools this field doesn't allow do nothing
    // (rather than the browser's own bold), and "## " makes only the
    // heading levels it does.
    const Guard = Extension.create({
     name: 'timbrrGuard',
     priority: 10000,
     addKeyboardShortcuts() {
      const keys = { 'Mod-Shift-b': () => true };
      const off = (tool, ...combos) => {
       if (!has(tool)) for (const combo of combos) keys[combo] = () => true;
      };
      off('bold', 'Mod-b', 'Mod-B');
      off('italic', 'Mod-i', 'Mod-I');
      off('underline', 'Mod-u', 'Mod-U');
      off('h2', 'Mod-Alt-2');
      off('h3', 'Mod-Alt-3');
      off('ul', 'Mod-Shift-8');
      off('ol', 'Mod-Shift-7');
      return keys;
     },
     addInputRules() {
      return [2, 3]
       .filter((level) => has(`h${level}`))
       .map((level) => textblockTypeInputRule({ find: new RegExp(`^(#{${level}})\\s$`), type: this.editor.schema.nodes.heading, getAttributes: { level } }));
     },
    });

    return new Editor({
     element: null,
     content: toDoc(props.value),
     injectCSS: false,
     extensions: [
      StarterKit.configure({
       heading: { levels: [2, 3] },
       code: false,
       codeBlock: false,
       horizontalRule: false,
       strike: false,
       dropcursor: false,
       gapcursor: false,
       trailingNode: false,
       link: {
        openOnClick: false,
        autolink: has('link'),
        linkOnPaste: has('link'),
        defaultProtocol: 'https',
        HTMLAttributes: { target: null, rel: null },
        isAllowedUri: (url) => Boolean(safeHref(url)),
       },
      }),
      Guard,
     ],
     enableInputRules: ['timbrrGuard', ...INPUT_RULES.filter(([tool]) => has(tool)).map(([, name]) => name)],
     enablePasteRules: PASTE_RULES.filter(([tool]) => has(tool)).map(([, name]) => name),
     editorProps: {
      attributes: { 'aria-label': props.label, 'aria-multiline': 'true' },
      handleKeyDown: (_view, event) => {
       if (event.isComposing) return false;
       const finished = event.key === 'Escape' || (event.key === 'Enter' && !blocky && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey);
       if (!finished) return false;
       event.preventDefault();
       emit('done');
       return true;
      },
      transformPasted: (slice) => allowedSlice(slice, tiptap),
     },
     onUpdate: ({ editor: instance }) => canvas.edit(props.id, props.field, instance.getJSON()),
     onFocus: report,
     onSelectionUpdate: report,
     onTransaction: report,
     onBlur: left,
    });
   }

   // The caret goes where the click landed (or at the end, from the
   // keyboard), and the keyboard comes here.
   function place({ TextSelection }) {
    const { view } = editor;
    const { doc, tr } = view.state;
    let hit = null;
    try {
     hit = props.point ? view.posAtCoords({ left: props.point.x, top: props.point.y }) : null;
    } catch {
     hit = null;
    }
    view.dispatch(tr.setSelection(hit ? TextSelection.near(doc.resolve(hit.pos)) : TextSelection.atEnd(doc)));
    view.focus();
   }

   // A tool from the studio's format bar.
   function format(tool, href) {
    if (!mounted || !has(tool)) return;
    editor.view.focus();
    const chain = editor.chain();
    if (tool === 'bold') chain.toggleBold();
    else if (tool === 'italic') chain.toggleItalic();
    else if (tool === 'underline') chain.toggleUnderline();
    else if (tool === 'h2' || tool === 'h3') chain.toggleHeading({ level: tool === 'h2' ? 2 : 3 });
    else if (tool === 'ul') chain.toggleBulletList();
    else if (tool === 'ol') chain.toggleOrderedList();
    else if (tool === 'clear') chain.unsetAllMarks().clearNodes();
    else if (tool === 'link') {
     // An empty address takes the link off. With nothing selected, the
     // address goes in as the link's text.
     const address = String(href ?? '').trim();
     if (!address) chain.extendMarkRange('link').unsetLink();
     else if (!safeHref(address)) return;
     else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: address, marks: [{ type: 'link', attrs: { href: address } }] });
     } else chain.extendMarkRange('link').setLink({ href: address });
    } else return;
    chain.run();
   }

   onMounted(async () => {
    // Keep the keyboard here while TipTap loads (the first time only).
    root.value?.focus({ preventScroll: true });
    let tiptap;
    try {
     tiptap = await loadTiptap();
    } catch {
     if (!gone) emit('done');
     return;
    }
    if (gone) return;
    editor = create(tiptap);
    // Hand the element over: its static copy comes out and TipTap draws the
    // same tags into it, before the browser paints in between.
    ready.value = true;
    await nextTick();
    if (gone) {
     editor.destroy();
     return;
    }
    editor.mount({ mount: root.value });
    mounted = true;
    canvas.editor.value = { id: props.id, field: props.field, el: root.value, format };
    place(tiptap);
   });

   // A new value from the studio (the inspector, say) while the caret is
   // somewhere else; while it's here, this editor has the latest.
   watch(
    () => props.value,
    (value) => {
     if (!mounted || typing()) return;
     const next = editor.schema.nodeFromJSON(toDoc(value));
     if (next.eq(editor.state.doc)) return;
     const { tr } = editor.state;
     editor.view.dispatch(tr.replaceWith(0, tr.doc.content.size, next.content).setMeta('preventUpdate', true).setMeta('addToHistory', false));
    },
   );

   onBeforeUnmount(() => {
    gone = true;
    if (canvas.editor.value?.el === root.value) canvas.editor.value = null;
    canvas.release(props.id, props.field);
    editor?.destroy();
    editor = null;
    mounted = false;
   });

   return () =>
    h(
     'div',
     { ref: root, class: 'tb-rich', 'data-field': props.field, tabindex: ready.value ? undefined : -1 },
     ready.value ? undefined : slots.default?.(),
    );
  },
 };
</script>
