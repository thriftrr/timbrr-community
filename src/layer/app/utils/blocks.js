// Helpers more than one block uses. (Nuxt auto-imports app/utils.)

// The number to dial: its digits (and a leading +), less any extension. A
// number with words in it (1-800-FLOWERS, "or text us") isn't dialed at
// all, rather than dial the wrong number.
export function telHref(phone) {
 const number = String(phone ?? '').replace(/\s*(?:ext\.?|extension|x)\s*\d+\s*$/i, '');
 if (/[a-z]/i.test(number)) return undefined;
 const digits = number.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
 return /\d{3}/.test(digits) ? safeHref(`tel:${digits}`) : undefined;
}

export function mailHref(email) {
 const address = String(email ?? '').trim();
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? safeHref(`mailto:${address}`) : undefined;
}

// Rows under their headings, in the order each heading first turns up, each
// row keeping its place in the list, which is what its fields are named by.
// Rows with no heading come first. [{ name, rows: [{ row, index }] }].
export function groupRows(rows, key) {
 const groups = new Map();
 rows.forEach((row, index) => {
  const name = String(row[key] ?? '').trim();
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push({ row, index });
 });
 const named = [...groups.entries()].map(([name, list]) => ({ name, rows: list }));
 return named.sort((a, b) => Number(Boolean(a.name)) - Number(Boolean(b.name)));
}

// A link to a video, as the address of its player: YouTube's (the no-cookie
// one) or Vimeo's. Built from the id alone, so nothing typed into a page
// reaches an iframe's address. Any other link has no player, and comes back
// undefined.
const YOUTUBE_ID = /^[\w-]{6,20}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function embedSrc(link) {
 let url;
 try {
  url = new URL(String(link ?? '').trim());
 } catch {
  return undefined;
 }
 if (url.protocol !== 'https:') return undefined;
 const host = url.hostname.replace(/^(www|m)\./, '');
 const [first, second] = url.pathname.split('/').filter(Boolean);
 if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
  const id = host === 'youtu.be' ? first : first === 'watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(first) ? second : null;
  return YOUTUBE_ID.test(id ?? '') ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
 }
 if (host === 'vimeo.com' || host === 'player.vimeo.com') {
  const id = first === 'video' ? second : first;
  return VIMEO_ID.test(id ?? '') ? `https://player.vimeo.com/video/${id}` : undefined;
 }
 return undefined;
}

// What an Embed block frames: the first https address in what was typed,
// which may be the address alone or a service's whole embed code. Nothing
// else of the code is kept, so a pasted <script> never runs on the site.
// Rock Gym Pro hands out a script address (/b/s/?lk=…&bw=…), which would
// show as source in a frame; its page for the same widget is /b/?bw=….
// shortcut: that page carries the gym's own name and address above the widget and can't grow to fit, upgrade to Rock Gym Pro's embedded mode (mode=e, rgpmessage-iframe-resize) if the frame's own scrolling bothers people.
const RGP_KEYS = ['bw', 'bo'];
const RGP_ID = /^[\w-]{8,80}$/;

export function embedFrame(pasted) {
 const found = /https:\/\/[^\s"'<>]+/i.exec(String(pasted ?? '').replace(/&amp;/g, '&'));
 let url;
 try {
  url = new URL(found?.[0] ?? '');
 } catch {
  return undefined;
 }
 if (url.hostname === 'app.rockgympro.com' && url.pathname.replace(/\/$/, '') === '/b/s') {
  const key = RGP_KEYS.find((name) => RGP_ID.test(url.searchParams.get(name) ?? ''));
  return key ? `https://app.rockgympro.com/b/?${key}=${url.searchParams.get(key)}` : undefined;
 }
 return url.href;
}

// What a price typed by hand is worth: '$59', '59.50' and '1,200' are 59,
// 59.5 and 1200; anything with no number in it is 0.
export function priceNumber(typed) {
 const number = Number.parseFloat(String(typed ?? '').replace(/[^\d.]/g, ''));
 return Number.isFinite(number) ? number : 0;
}

// A Price calculator's total: the first one's price, each one after it at
// the price of another, and the extras that are ticked, charged once or
// once for each.
export function calculatorTotal(data, count, ticked) {
 const extras = data.addons.reduce((sum, addon, index) => sum + (ticked[index] ? priceNumber(addon.price) * (addon.per === 'each' ? count : 1) : 0), 0);
 return priceNumber(data.price) + priceNumber(data.extra) * (count - 1) + extras;
}

// Where a network keeps its profiles, for a handle typed on its own.
const PROFILES = [
 [/\binstagram\b/i, (name) => `https://www.instagram.com/${name}/`],
 [/\bfacebook\b/i, (name) => `https://www.facebook.com/${name}`],
 [/\btiktok\b/i, (name) => `https://www.tiktok.com/@${name}`],
 [/\byoutube\b/i, (name) => `https://www.youtube.com/@${name}`],
 [/^x\b|\btwitter\b/i, (name) => `https://x.com/${name}`],
];

// The account a handle names: "@yourshop", "/yourshop", "yourshop", or the
// profile's own address.
const HANDLE = /^(?:(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/)?[@/]?(\w[\w.-]{0,59})\/?$/i;

// A { title, body, to } row's link: its own, when it has one; else the
// profile its handle names on one of the networks above; else a full address
// typed as the handle. Otherwise the row is plain text.
export function profileHref(item) {
 const own = safeHref(item.to);
 if (own) return own;
 const handle = String(item.body ?? '').trim();
 const build = PROFILES.find(([network]) => network.test(String(item.title ?? '').trim()))?.[1];
 const name = HANDLE.exec(handle)?.[1];
 if (build && name) return safeHref(build(name));
 return /^https:\/\//i.test(handle) ? safeHref(handle) : undefined;
}

// What a table draws (schema/define.js, tableSchema): each row as the cells
// that show, with their place and reach. A cell another one covers is left
// out. Whatever doesn't fit is put right here rather than drawn broken: a
// short row is filled out, a reach past the edge stops at it, a merge that
// would run over another is undone, and a heading never merges into the body.
export function tableLayout(table) {
 const rows = Array.isArray(table?.rows) ? table.rows : [];
 const columns = Math.max(0, ...rows.map((row) => row.length));
 const taken = new Set();
 const out = rows.map((row, r) => {
  const cells = [];
  for (let c = 0; c < columns; c += 1) {
   if (taken.has(`${r},${c}`)) continue;
   const cell = row[c] ?? {};
   const down = table.header_row && r === 0 ? 1 : Math.min(cell.rowspan ?? 1, rows.length - r);
   let across = table.header_col && c === 0 ? 1 : Math.min(cell.colspan ?? 1, columns - c);
   let rowspan = down;
   const clear = () => {
    for (let y = r; y < r + rowspan; y += 1) for (let x = c; x < c + across; x += 1) if ((y !== r || x !== c) && taken.has(`${y},${x}`)) return false;
    return true;
   };
   if (!clear()) across = rowspan = 1;
   for (let y = r; y < r + rowspan; y += 1) for (let x = c; x < c + across; x += 1) taken.add(`${y},${x}`);
   cells.push({ r, c, colspan: across, rowspan });
  }
  return cells;
 });
 return { columns, rows: out };
}

// Where a dragged block can land on the canvas (pages/__timbrr/canvas.vue).
// `blocks` are the drawn blocks top to bottom: { top, bottom, lock, moved },
// `lock` naming the locked placement a block belongs to ('' for none) and
// `moved` marking the ones being dragged. `y` is the pointer, in the same
// pixels. Answers `slots`, every edge that takes a drop ({ index, y }: the
// index to insert at and where the edge is), and `index`, the one the
// pointer picks, or null. The top half of a block picks the edge above it
// and the bottom half the one below. An edge inside a locked chunk is no
// slot (the pointer there goes to the nearer end of the chunk), nor is one
// beside what's being moved: dropping there would change nothing.
export function dropTargets(blocks, y) {
 const count = blocks.length;
 const edgeY = (index) => (index < count ? blocks[index].top : (blocks[count - 1]?.bottom ?? 0));
 const inChunk = (index) => index > 0 && index < count && blocks[index].lock !== '' && blocks[index - 1].lock === blocks[index].lock;
 const first = blocks.findIndex((block) => block.moved);
 const last = blocks.findLastIndex((block) => block.moved);
 const still = (index) => first >= 0 && index >= first && index <= last + 1;
 const slots = [];
 for (let index = 0; index <= count; index++) if (!inChunk(index) && !still(index)) slots.push({ index, y: edgeY(index) });

 let index = blocks.findIndex((block) => y < (block.top + block.bottom) / 2);
 if (index < 0) index = count;
 if (inChunk(index)) {
  let start = index - 1;
  let end = index;
  while (inChunk(start)) start -= 1;
  while (inChunk(end + 1)) end += 1;
  index = y < (blocks[start].top + blocks[end].bottom) / 2 ? start : end + 1;
 }
 return { index: still(index) ? null : index, slots };
}
