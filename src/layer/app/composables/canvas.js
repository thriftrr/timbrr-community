// Inside the studio's canvas, blocks render the same as on the site, and
// text drawn through <TbText> and <TbRich> becomes editable in place. The
// canvas page provides this; on the live site there is none, and nothing is
// editable. Nor is there in a preview (/__timbrr/canvas?preview=1), which
// is the page exactly as the site draws it.
//
// What the canvas page provides (docs/manifest.md § Inline editing):
//  selected, dragging   refs: the selected block's id; a block moved by its tab
//  hovered              ref: the locked placement under the pointer, for its tab
//  editable             ref: false when the studio says this person can only look
//  library              ref: false when this person can't open the Library
//  active               ref: { id, field, kind } of the one field being typed into
//                       ('text' or 'rich'); a rich field keeps its editor while
//                       it's set, even when the caret is out in the studio
//  editor               ref: that rich field's open editor, { id, field, el, format }
//  activate, release    take `active`, and give it up
//  edit                 a field's new value: a string, or a rich-text document
//  focus, blur          the caret is in a field (with what it allows there), or left
//  open                 a locked placement's Edit in Library
//  toolsFor, labelFor   a field's formatting tools and its name, from its block
export const CANVAS_KEY = Symbol('timbrr-canvas');
export const BLOCK_KEY = Symbol('timbrr-block');
// The site (a ref): what the site_header and site_footer blocks read their
// name from, and Visit its details. The canvas provides what the studio sent,
// useTimbrrPage what it published. Nothing provides it anywhere else, as on
// the starter's block shelf.
export const TIMBRR_SITE_KEY = Symbol('timbrr-site');

export function useCanvas() {
 return inject(CANVAS_KEY, null);
}

export function useBlockScope() {
 return inject(BLOCK_KEY, null);
}

export function useTimbrrSite() {
 return inject(TIMBRR_SITE_KEY, null);
}

// A page has one h1 (WCAG 1.3.1): the first block on it that would draw one
// (a hero, a video hero, a collection field shown as the heading) draws it;
// the rest, and every block inside a repeat's cells, draw an h2 that looks
// the same. TbBlocks decides; a block drawn outside one keeps its h1.
export const H1_KEY = Symbol('timbrr-h1');
export function wantsH1(block) {
 return block?.type === 'hero' || block?.type === 'northwall_video_hero' || (block?.type === 'collection_field' && block.data?.show === 'heading');
}
export function useHeadingTag() {
 const owner = inject(H1_KEY, null);
 const block = useBlockScope();
 return computed(() => (!owner || owner.value === block?.id ? 'h1' : 'h2'));
}

// For blocks: whether an optional field drawn through <TbText> or <TbRich>
// shows. An empty one doesn't, as on the site, except on the canvas while
// it's being typed into, so clearing it to start over doesn't take it (and
// the caret) away. `field` is its path ('items.0.title'); `value` a string
// or a rich-text document, which counts as empty without any words in it.
export function useFieldShown() {
 const canvas = useCanvas();
 const scope = useBlockScope();
 return (field, value) => {
  if (hasWords(value)) return true;
  const active = canvas?.active?.value;
  return Boolean(active && scope && active.id === scope.id && active.field === field);
 };
}

function hasWords(node) {
 if (typeof node === 'string') return node.trim() !== '';
 if (node?.type === 'text') return Boolean(node.text?.trim());
 return Array.isArray(node?.content) && node.content.some(hasWords);
}
