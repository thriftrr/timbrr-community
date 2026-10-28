<script>
 // Rich text, from the document tree the studio stores (never HTML): pass
 // the block's `data` and the field's path (`field="items.0.body"`), or a
 // `doc` directly. Only the nodes and marks below are drawn; links go
 // through safeHref. Nothing a page holds can become markup on the site. A
 // plain string (older pages) is drawn as paragraphs.
 import { h } from 'vue';

 const BLOCK_TAGS = { paragraph: 'p', bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote' };

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

 export default {
  props: {
   data: { type: Object, default: null },
   field: { type: String, default: '' },
   doc: { type: [Object, String], default: null },
  },
  setup(props) {
   return () => {
    const value = props.field ? valueAt(props.data, props.field) : props.doc;
    const content = typeof value === 'string' ? fromString(value) : Array.isArray(value?.content) ? value.content.map(draw) : [];
    return h('div', { class: 'tb-rich' }, content);
   };
  },
 };
</script>
