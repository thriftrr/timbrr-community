<script>
 // Rich text, from the document tree the studio stores (never HTML). Only
 // the nodes and marks below are drawn; links go through safeHref. Nothing
 // a page holds can become markup on the site.
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

 export default {
  props: {
   doc: { type: Object, default: null },
  },
  setup(props) {
   return () => h('div', { class: 'tb-rich' }, Array.isArray(props.doc?.content) ? props.doc.content.map(draw) : []);
  },
 };
</script>
