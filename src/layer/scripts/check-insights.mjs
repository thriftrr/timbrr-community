// Checks what the canvas draws for Insights (app/utils/insights-canvas.js), on a
// hand-made DOM, without a build or a browser:
//   node layer/scripts/check-insights.mjs
// Prints one line per case, or the first problem and exits 1. What it cannot
// say is how it looks: that needs the studio and a real page.
import assert from 'node:assert/strict';

// ── A DOM small enough for the script ──
class Node {
 constructor(tag) {
  this.tag = tag;
  this.children = [];
  this.style = { setProperty() {} };
  this.className = '';
  this.textContent = '';
  this.dataset = {};
  this.attrs = {};
  this.rect = { left: 0, top: 0, width: 0, height: 0, right: 0 };
  this.found = {};
  this.paints = 0;
 }
 appendChild(child) {
  child.parent = this;
  this.children.push(child);
  return child;
 }
 append(text) {
  this.textContent += text;
 }
 replaceChildren() {
  this.children = [];
 }
 remove() {
  if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
 }
 setAttribute(name, value) {
  this.attrs[name] = value;
 }
 getAttribute(name) {
  return this.attrs[name] ?? null;
 }
 getBoundingClientRect() {
  return this.rect;
 }
 closest() {
  return null;
 }
 querySelectorAll(selector) {
  return this.found[selector] ?? [];
 }
 getContext() {
  const ctx = { scale() {}, createRadialGradient: () => ({ addColorStop() {} }), fillRect: () => this.paints++ };
  return ctx;
 }
 all() {
  return [this, ...this.children.flatMap((child) => child.all())];
 }
 words() {
  return this.all()
   .map((node) => node.textContent)
   .join(' | ');
 }
}

const block = (id, top, height, buttons = []) => {
 const node = new Node('div');
 node.dataset.blockId = id;
 node.rect = { left: 0, top, width: 1280, height, right: 1280 };
 node.found['a[href], button'] = buttons;
 return node;
};
const button = (label, top) => {
 const node = new Node('a');
 node.textContent = ` ${label} `;
 node.rect = { left: 100, top, width: 120, height: 40, right: 220 };
 return node;
};

const head = new Node('head');
const body = new Node('body');
const hero = block('hero', 100, 300, [button('Book a class', 340), button('See prices', 340)]);
const list = block('list', 400, 300);
const prices = block('prices', 700, 300);
const header = new Node('header');
header.rect = { left: 0, top: 0, width: 1280, height: 100, right: 1280 };
const queued = [];
const posts = [];
globalThis.window = { scrollX: 0, scrollY: 0, devicePixelRatio: 1 };
globalThis.requestAnimationFrame = (run) => {
 queued.push(run);
 return queued.length;
};
globalThis.ResizeObserver = class {
 observe() {}
 disconnect() {}
};
globalThis.document = {
 head,
 body,
 documentElement: { clientWidth: 1280 },
 createElement: (tag) => new Node(tag),
 querySelectorAll: (selector) => (selector === '[data-block-id]' ? [hero, list, prices] : []),
 querySelector: (selector) => (selector === '.tb-site-header' ? header : selector === 'style[data-tb-insights]' ? head.children.find((node) => node.tag === 'style') : null),
};
const flush = () => queued.splice(0).forEach((run) => run());

const { createInsights } = await import('../app/utils/insights-canvas.js');
const insights = createInsights({ post: (message) => posts.push(message) });
const row = (id, name, extra) => ({ id, name, state: 'live', since: '', hasRow: true, seen: 100, clicked: 10, rate: 0.1, rank: 'middle', reach: 1, ...extra });
const message = (extra) => ({
 on: true,
 mode: 'seen',
 selected: 'hero',
 colors: { best: '#2f6b4f', middle: '#7fae8f', lowest: '#c9a15a' },
 blocks: [row('hero', 'Hero', { seen: 6102, clicked: 1204, rate: 0.197, rank: 'best' }), row('list', 'Class list', { reach: 0.6 }), row('prices', 'Price list', { rank: 'lowest', reach: 0.2 })],
 buttons: [
  { index: 0, clicks: 1021 },
  { index: 1, clicks: 183 },
 ],
 ...extra,
});
const root = () => body.children.find((node) => node.id === 'tb-insights');

const cases = {
 'draws nothing until the studio says on': () => {
  insights.apply({ on: false });
  flush();
  assert.equal(root(), undefined);
  assert.equal(head.children.length, 0);
 },
 'seen and clicked: a badge per block with the rank in words': () => {
  insights.apply(message());
  flush();
  const words = root().words();
  assert.match(words, /Hero/);
  assert.match(words, /6,102/);
  assert.match(words, /19\.7% · Best/);
  assert.match(words, /10\.0% · Middle/);
  assert.match(words, /10\.0% · Lowest/);
 },
 'the header has no block id: it says so and has no numbers': () => {
  assert.match(root().words(), /Header \| Not tracked/);
 },
 'the selected block gets its buttons counted, the others a veil': () => {
  const counts = root().all().filter((node) => node.className === 'ti-count');
  assert.deepEqual(counts.map((node) => node.textContent), ['1,021', '183']);
  const veils = root().all().filter((node) => node.className === 'ti-veil');
  assert.equal(veils.length, 3, 'list, prices and the header');
 },
 'the labels of the buttons go up, once': () => {
  assert.deepEqual(posts, [{ type: 'timbrr:buttons', id: 'hero', labels: ['Book a class', 'See prices'] }]);
  insights.apply(message());
  flush();
  assert.equal(posts.length, 1);
 },
 'a block not live yet and one changed since say so': () => {
  insights.apply(message({ blocks: [row('hero', 'Hero', { state: 'new', hasRow: false }), row('list', 'Class list', { state: 'changed', since: 'Nov 12' }), row('prices', 'Price list', { hasRow: false })] }));
  flush();
  const words = root().words();
  assert.match(words, /Hero \| Not live yet/);
  assert.match(words, /Changed Nov 12/);
  assert.match(words, /No numbers yet/);
 },
 'heat paints a grid per block that has one': () => {
  insights.apply(message({ mode: 'heat', heat: { hero: { size: 20, cells: [...new Array(399).fill(0), 9], max: 9, total: 9 } } }));
  flush();
  const painted = root().all().filter((node) => node.tag === 'canvas');
  assert.equal(painted.length, 1);
  assert.equal(painted[0].paints, 1);
  assert.doesNotMatch(root().words(), /seen/);
 },
 'heat marks a block that changed since, and only that one': () => {
  insights.apply(message({ mode: 'heat', blocks: [row('hero', 'Hero'), row('prices', 'Price list', { state: 'changed', since: 'Nov 12' })] }));
  flush();
  assert.match(root().words(), /Price list/);
  assert.match(root().words(), /Changed Nov 12/);
  assert.doesNotMatch(root().words(), /Hero/);
 },
 'scroll draws a line at 75, 50 and 25 percent where views stopped': () => {
  insights.apply(message({ mode: 'scroll', blocks: [row('hero', 'Hero', { reach: 1 }), row('list', 'Class list', { reach: 0.6 }), row('prices', 'Price list', { reach: 0.2 })] }));
  flush();
  const lines = root().all().filter((node) => node.className === 'ti-line');
  assert.equal(lines.length, 3);
  assert.match(root().words(), /75% got this far/);
  assert.match(root().words(), /25% got this far/);
  const tops = lines.map((node) => Number.parseFloat(node.style.top));
  assert.ok(tops[0] < tops[1] && tops[1] < tops[2], 'in page order');
 },
 'off takes everything away': () => {
  insights.apply({ on: false });
  assert.equal(root(), undefined);
  assert.equal(head.children.length, 0);
 },
};

for (const [name, run] of Object.entries(cases)) {
 try {
  run();
  console.log(`ok   ${name}`);
 } catch (error) {
  console.error(`FAIL ${name}\n${error.message}`);
  process.exit(1);
 }
}
