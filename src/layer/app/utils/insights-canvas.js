// Insights on the studio's canvas (docs/manifest.md, `timbrr:insights`). The
// studio sends numbers it read with the person's own access; this draws them
// over the page: a veil, a badge on each block, the heat of its clicks, the
// lines where visitors stopped scrolling. Nothing here reads or sends text
// from a visitor: the only thing that goes back is the labels of the
// buttons on this page (`timbrr:buttons`), which the person wrote.
//
// Plain DOM, one overlay element that never takes a click, so selecting,
// dragging and typing on the page work as ever. Never started unless the
// studio sends `on: true`: a canvas without Insights does none of this.

const STYLE = `
#tb-insights{position:absolute;top:0;left:0;width:100%;height:0;z-index:40;pointer-events:none;font:400 12px/1.3 'Work Sans',system-ui,sans-serif;color:#1c231b}
#tb-insights *{box-sizing:border-box}
#tb-insights .ti-veil{position:absolute;background:rgb(233 232 222 / .62)}
#tb-insights .ti-edge{position:absolute;width:calc(5px * var(--tb-ui,1));border-radius:2px}
#tb-insights .ti-dash{position:absolute;border:calc(1.5px * var(--tb-ui,1)) dashed #8fb5a0;border-radius:2px}
#tb-insights .ti-badge{position:absolute;display:flex;align-items:stretch;overflow:hidden;border-radius:7px;background:#fff;box-shadow:0 1px 6px rgb(0 0 0 / .18);transform-origin:100% 0;white-space:nowrap}
#tb-insights .ti-badge>span{display:flex;align-items:center;padding:4px 9px}
#tb-insights .ti-badge>span+span{border-left:1px solid #e7ecdf}
#tb-insights .ti-name{background:#ecf2ef;font:500 10px/1.3 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#254832}
#tb-insights .ti-badge b{margin-right:4px;font:600 11.5px/1.3 'IBM Plex Mono',ui-monospace,monospace}
#tb-insights .ti-rate{font-weight:600;color:#254832}
#tb-insights .ti-rate.is-lowest{color:#7a5f12}
#tb-insights .ti-quiet{color:#4b5563}
#tb-insights .ti-changed{background:#f6efd6;color:#7a5f12}
#tb-insights .ti-count{position:absolute;border-radius:999px;padding:1px 7px;background:#254832;font:600 11px/1.5 'IBM Plex Mono',ui-monospace,monospace;color:#f7f5ec;transform-origin:50% 50%;box-shadow:0 0 0 2px #fff}
#tb-insights .ti-line{position:absolute;left:0;right:0;border-top:calc(2px * var(--tb-ui,1)) dashed #254832}
#tb-insights .ti-tag{position:absolute;border-radius:5px;padding:3px 9px;font:600 11px/1.3 'IBM Plex Mono',ui-monospace,monospace;color:#f7f5ec;background:#254832;white-space:nowrap}
#tb-insights .ti-tag.is-name{background:#fff;color:#254832;font-weight:500;box-shadow:0 1px 4px rgb(0 0 0 / .18)}
#tb-insights canvas{position:absolute}
`;

const HEAT_FROM = [255, 196, 0]; // few clicks: yellow
const HEAT_TO = [220, 38, 38]; // most clicks: red
const HEADER_FOOTER = [
 ['.tb-site-header', 'Header'],
 ['.tb-site-footer', 'Footer'],
];
// What a block's own buttons are, in the order the page's script counts them (analytics/a.src.js).
const BUTTONS = 'a[href], button';

export function createInsights({ post }) {
 let root = null;
 let message = null;
 let ui = 1;
 let frame = 0;
 let watcher = null;
 let sent = '';

 const number = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0');
 const el = (tag, className, parent, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
 };
 const at = (node, left, top, width, height) => {
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  if (width !== undefined) node.style.width = `${width}px`;
  if (height !== undefined) node.style.height = `${height}px`;
 };
 const find = (id) => [...document.querySelectorAll('[data-block-id]')].find((node) => node.dataset.blockId === id) ?? null;
 // A box in the page's own pixels (this page never scrolls inside the frame, but be right if it does).
 const box = (node) => {
  const rect = node.getBoundingClientRect();
  return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height, right: rect.right + window.scrollX };
 };

 function mount() {
  if (root) return;
  const style = el('style', '', document.head, STYLE);
  style.dataset.tbInsights = '';
  root = el('div', '', document.body);
  root.id = 'tb-insights';
  root.setAttribute('aria-hidden', 'true');
  watcher = new ResizeObserver(() => schedule());
  watcher.observe(document.body);
 }

 function unmount() {
  watcher?.disconnect();
  watcher = null;
  root?.remove();
  document.querySelector('style[data-tb-insights]')?.remove();
  root = null;
  sent = '';
 }

 function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
   frame = 0;
   draw();
  });
 }

 // The labels of the selected block's buttons, said to the studio so its
 // panel can name them. Only when they change.
 function sayButtons(id, node) {
  const labels = buttonsOf(node).map((button) => (button.getAttribute('aria-label') || button.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60));
  const key = `${id}|${labels.join('|')}`;
  if (key === sent) return;
  sent = key;
  post({ type: 'timbrr:buttons', id, labels });
 }

 // The tab and its Style menu are the studio's, not the site's: they don't count.
 const buttonsOf = (node) => [...node.querySelectorAll(BUTTONS)].filter((button) => !button.closest('.tb-frame__tab, .tb-frame__menu'));

 const shade = (t) => HEAT_FROM.map((from, i) => Math.round(from + (HEAT_TO[i] - from) * t));

 function paintHeat(rect, grid) {
  if (!grid?.max || !rect.width || !rect.height) return;
  const size = grid.size || 20;
  const canvas = el('canvas', '', root);
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.ceil(rect.width * scale);
  canvas.height = Math.ceil(rect.height * scale);
  at(canvas, rect.left, rect.top, rect.width, rect.height);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const cw = rect.width / size;
  const ch = rect.height / size;
  const radius = Math.max(cw, ch) * 1.7;
  ctx.globalCompositeOperation = 'source-over';
  // Weakest first, so the hottest spots end up on top.
  grid.cells
   .map((count, cell) => [count, cell])
   .filter(([count]) => count > 0)
   .sort((a, b) => a[0] - b[0])
   .forEach(([count, cell]) => {
    const t = Math.sqrt(count / grid.max);
    const [r, g, b] = shade(t);
    const x = (cell % size) * cw + cw / 2;
    const y = Math.floor(cell / size) * ch + ch / 2;
    const paint = ctx.createRadialGradient(x, y, 0, x, y, radius);
    paint.addColorStop(0, `rgba(${r},${g},${b},${0.35 + 0.5 * t})`);
    paint.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = paint;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
   });
 }

 function badge(rect, block, colors) {
  const right = document.documentElement.clientWidth - rect.right + 10 * ui;
  const node = el('div', 'ti-badge', root);
  node.style.right = `${right}px`;
  node.style.top = `${rect.top + 10 * ui}px`;
  node.style.transform = `scale(${ui})`;
  el('span', 'ti-name', node, block.name);
  if (block.quiet) {
   // Heat view: the name and, when it changed, when. The numbers are the Seen view's.
  } else if (block.state === 'new') {
   el('span', 'ti-quiet', node, 'Not live yet');
  } else if (block.state === 'untracked') {
   el('span', 'ti-quiet', node, 'Not tracked');
  } else if (!block.hasRow) {
   el('span', 'ti-quiet', node, 'No numbers yet');
  } else {
   const seen = el('span', '', node);
   el('b', '', seen, number(block.seen));
   seen.append('seen');
   const clicked = el('span', '', node);
   el('b', '', clicked, number(block.clicked));
   clicked.append('clicked');
   const words = { best: 'Best', middle: 'Middle', lowest: 'Lowest' }[block.rank];
   const rate = el('span', `ti-rate${block.rank === 'lowest' ? ' is-lowest' : ''}`, node, `${(block.rate * 100).toFixed(1)}%${words ? ` · ${words}` : ''}`);
   rate.title = 'Click rate';
  }
  if (block.state === 'changed') el('span', 'ti-changed', node, `Changed ${block.since}`);
  if (colors?.[block.rank] && block.state !== 'new') {
   const edge = el('span', 'ti-edge', root);
   at(edge, rect.left, rect.top, undefined, rect.height);
   edge.style.background = colors[block.rank];
  }
 }

 function scrollLines(entries) {
  const list = entries.filter((entry) => Number.isFinite(entry.reach)).sort((a, b) => a.rect.top - b.rect.top);
  if (list.length < 2) return;
  for (const stop of [0.75, 0.5, 0.25]) {
   let y = null;
   let name = '';
   // The first block fewer people than `stop` reached: the line sits where reach crosses it, between its top and the one before's.
   for (let i = 0; i < list.length && y === null; i++) {
    if (list[i].reach > stop) continue;
    const before = list[i - 1];
    if (!before) y = list[i].rect.top;
    else y = before.rect.top + ((before.reach - stop) / (before.reach - list[i].reach)) * (list[i].rect.top - before.rect.top);
    name = list[i].block.name;
   }
   if (y === null) continue;
   const line = el('div', 'ti-line', root);
   line.style.top = `${y}px`;
   const tag = el('div', 'ti-tag', root, `${Math.round(stop * 100)}% got this far`);
   tag.style.right = `${8 * ui}px`;
   tag.style.top = `${y - 11 * ui}px`;
   tag.style.transform = `scale(${ui})`;
   tag.style.transformOrigin = '100% 50%';
   const label = el('div', 'ti-tag is-name', root, name);
   label.style.left = `${8 * ui}px`;
   label.style.top = `${y - 11 * ui}px`;
   label.style.transform = `scale(${ui})`;
   label.style.transformOrigin = '0 50%';
  }
 }

 function draw() {
  if (!root || !message?.on) return;
  root.replaceChildren();
  root.style.setProperty('--tb-ui', String(ui));
  const { mode, blocks = [], selected = null, colors = {}, heat = {}, buttons = [] } = message;
  const entries = [];
  for (const block of blocks) {
   const node = find(block.id);
   if (node) entries.push({ block, node, rect: box(node), reach: block.reach });
  }
  if (mode === 'seen') {
   for (const { block, node, rect } of entries) {
    if (block.id !== selected) at(el('div', 'ti-veil', root), rect.left, rect.top, rect.width, rect.height);
    if (block.state === 'new') {
     const dash = el('div', 'ti-dash', root);
     at(dash, rect.left, rect.top, rect.width, rect.height);
    }
    badge(rect, block, colors);
    if (block.id === selected) {
     buttonsOf(node).forEach((button, index) => {
      const row = buttons.find((entry) => entry.index === index);
      if (!row) return;
      const b = box(button);
      const count = el('span', 'ti-count', root, number(row.clicks));
      count.style.left = `${b.right - 8 * ui}px`;
      count.style.top = `${b.top - 10 * ui}px`;
      count.style.transform = `scale(${ui})`;
     });
    }
   }
   // The header and footer carry no block id, so there is nothing to count them by.
   for (const [selector, name] of HEADER_FOOTER) {
    const node = document.querySelector(selector);
    if (!node) continue;
    const rect = box(node);
    at(el('div', 'ti-veil', root), rect.left, rect.top, rect.width, rect.height);
    badge(rect, { name, state: 'untracked' }, colors);
   }
  } else if (mode === 'heat') {
   for (const { block, rect } of entries) {
    paintHeat(rect, heat[block.id]);
    // The heat before an edit is marked, not mixed in silently (drawing OmHFfX6-ER).
    if (block.state === 'changed') badge(rect, { ...block, quiet: true }, null);
   }
  } else if (mode === 'scroll') {
   scrollLines(entries);
  }
  const chosen = entries.find((entry) => entry.block.id === selected);
  if (chosen) sayButtons(selected, chosen.node);
 }

 return {
  // `timbrr:insights`: the numbers to draw, or `on: false` to take it all away.
  apply(next) {
   message = next && next.on === true ? next : null;
   if (!message) return unmount();
   mount();
   schedule();
  },
  // How much larger the studio's chrome is drawn, as the frame is scaled down.
  scale(value) {
   ui = value;
   schedule();
  },
  // The page changed (a new document arrived): draw again once it has laid out.
  refresh() {
   if (message) setTimeout(schedule, 60);
  },
 };
}
