// What the studio sends its canvas to draw content blocks with (the studio's
// docs/content.md, "In the page builder"), or null anywhere else:
//  lists  { <block id>: a list, exactly as /__timbrr/content answers }
//  raw    { <block id>: the block's data as it's kept }, for a block whose
//         words the studio filled `{{ tokens }}` into: what's drawn is the
//         filled copy, and what's typed into is the kept one
// The canvas page sets it; a live page never does, and asks the site itself.
export function useTimbrrContent() {
 return useState('timbrr-content', () => null);
}

// A field's value as it's kept, for typing into: from the studio's raw copy
// of this block when it sent one, or what the block was drawn with (which
// is also where a field the kept copy leaves out gets its default).
export function useKeptValue(props) {
 const sent = useTimbrrContent();
 const scope = useBlockScope();
 return computed(() => valueAt(sent.value?.raw?.[scope?.id], props.field) ?? valueAt(props.data, props.field));
}
