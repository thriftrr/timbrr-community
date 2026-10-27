// Inside the studio's canvas, blocks render the same as on the site, and
// text drawn through <TbText> becomes editable in place. The canvas page
// provides this; on the live site there is none, and nothing is editable.
export const CANVAS_KEY = Symbol('timbrr-canvas');
export const BLOCK_KEY = Symbol('timbrr-block');

export function useCanvas() {
 return inject(CANVAS_KEY, null);
}

export function useBlockScope() {
 return inject(BLOCK_KEY, null);
}
