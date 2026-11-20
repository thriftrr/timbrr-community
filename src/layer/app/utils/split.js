// The Split block's ratios and what may go in a column (docs/sub-blocks.md).
// The studio keeps the same table (shared/utils/block-tree.js); scripts in the
// studio check the two agree.

// Name → each column's share. `label` is what the inspector says.
export const SPLIT_RATIOS = {
 halves: { label: '50 / 50', widths: [50, 50] },
 '35-65': { label: '35 / 65', widths: [35, 65] },
 '65-35': { label: '65 / 35', widths: [65, 35] },
 '25-75': { label: '25 / 75', widths: [25, 75] },
 '75-25': { label: '75 / 25', widths: [75, 25] },
 thirds: { label: '33 / 33 / 33', widths: [1, 1, 1] },
 quarters: { label: '25 / 25 / 25 / 25', widths: [1, 1, 1, 1] },
};
export const SPLIT_COLUMN_BLOCKS = 6;

// How many columns a ratio has.
export const splitColumns = (ratio) => SPLIT_RATIOS[ratio]?.widths.length ?? 2;

// Whether a column is "wide": half the page or more (either half, the larger
// side of an uneven split). Pricing, Gallery and People go only in these.
export function splitWide(ratio, index) {
 const widths = SPLIT_RATIOS[ratio]?.widths ?? [1, 1];
 return widths[index] / widths.reduce((sum, width) => sum + width, 0) >= 0.5;
}

// Why a block can't go in a column, or ''. `def` is the block's definition (or
// manifest entry).
export function columnRefusal(def, wide) {
 if (def?.type === 'split') return "A Split can't go inside a Split";
 if (!def?.inside) return `${def?.label ?? 'This block'} needs the full width`;
 if (def.inside === 'wide' && !wide) return `${def.label} needs a wider column`;
 return '';
}

// A block by its id in a page's blocks, a Split's children included.
export function findBlockDeep(blocks, id) {
 for (const block of Array.isArray(blocks) ? blocks : []) {
  if (block?.id === id) return block;
  if (block?.type === 'split' && Array.isArray(block.data?.columns)) {
   for (const column of block.data.columns) {
    const found = findBlockDeep(column, id);
    if (found) return found;
   }
  }
 }
 return null;
}
