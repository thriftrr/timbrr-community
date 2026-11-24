// The site's own blocks' definitions this page shows, by type (the studio's
// docs/own-blocks.md): from the page's answer on the site (`page.ownBlocks`)
// and from the studio in its canvas (timbrr:doc's `ownBlocks`). TbBlocks reads
// them to draw an own_ block with TbOwnBlock.
export function useTimbrrOwnBlocks() {
 return useState('timbrr-own-blocks', () => ({}));
}

// What TbOwnBlock hands the boxes and atoms inside it: the block's data, its
// fields by key, the heading atom that takes the block's own level, and that level.
export const OWN_BLOCK_KEY = Symbol('timbrr-own-block');
