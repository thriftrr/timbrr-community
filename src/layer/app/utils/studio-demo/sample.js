// What the studio demo shows: a made-up plumber, Okafor Plumbing,
// its site and its studio. Every room starts from these and copies them, so
// Start over is a fresh copy. Nothing here is a real business or person.

export const SITE = {
 name: 'Okafor Plumbing',
 domain: 'okaforplumbing.com',
 phone: '555-0187',
 owner: { name: 'Dana Okafor', initials: 'DO' },
};

// The made-up site's look, as the Branding room edits it and every room's
// copy of the site draws it.
export const THEME = {
 brand: '#bd5326',
 heading: '#1f3a5c',
 text: '#3d4a57',
 soft: '#eef3f7',
 dark: '#17202a',
 paper: '#fffdf8',
 headingFont: 'Archivo',
 bodyFont: 'Public Sans',
 corners: 10,
};

// The site's pictures: drawings made of exact shapes (pipe runs, plans, a
// map), with no words in them, so they read the same as an <img>.
const svg = (box, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${body}</svg>`;
export const ART = {
 pipes: svg(
  '0 0 400 300',
  '<rect width="400" height="300" fill="#1f3a5c"/>' +
   '<g fill="none"><path d="M-20 92H148a44 44 0 0 1 44 44V320" stroke="#c4572a" stroke-width="24"/>' +
   '<path d="M420 206H276a34 34 0 0 0-34 34V320" stroke="#dbe6ef" stroke-width="24"/>' +
   '<path d="M286-20V54a34 34 0 0 0 34 34H420" stroke="#e8a37f" stroke-width="16"/>' +
   '<path d="M64-20V36" stroke="#2c5078" stroke-width="16"/></g>' +
   '<g fill="#a7461f"><rect x="112" y="76" width="12" height="32" rx="3"/><rect x="176" y="254" width="32" height="12" rx="3"/></g>' +
   '<rect x="300" y="190" width="12" height="32" rx="3" fill="#b9c8d6"/>' +
   '<g transform="translate(192 182)" stroke="#f4e6cf"><circle r="30" fill="none" stroke-width="6"/>' +
   '<path d="M0-30V30M-30 0H30M-21-21 21 21M21-21-21 21" stroke-width="4"/><circle r="8" fill="#f4e6cf"/></g>',
 ),
 plan: svg(
  '0 0 400 300',
  '<rect width="400" height="300" fill="#f6f3ea"/>' +
   '<path d="M180 260H40V40H360V260H220" fill="none" stroke="#1f3a5c" stroke-width="8"/>' +
   '<path d="M220 260V220" stroke="#1f3a5c" stroke-width="3"/>' +
   '<path d="M180 260A40 40 0 0 1 220 220" fill="none" stroke="#1f3a5c" stroke-width="2" stroke-dasharray="4 4"/>' +
   '<g fill="none" stroke="#1f3a5c"><rect x="56" y="56" width="200" height="84" rx="10" stroke-width="3"/>' +
   '<rect x="70" y="68" width="172" height="60" rx="26" stroke-width="2"/>' +
   '<rect x="292" y="56" width="52" height="44" rx="6" stroke-width="3"/><ellipse cx="318" cy="78" rx="16" ry="11" stroke-width="2"/>' +
   '<rect x="296" y="168" width="48" height="20" rx="4" stroke-width="3"/><ellipse cx="320" cy="210" rx="18" ry="22" stroke-width="3"/></g>' +
   '<path d="M150 140V200H296" fill="none" stroke="#c4572a" stroke-width="4" stroke-dasharray="10 6"/>' +
   '<path d="M40 284H360M40 278V290M360 278V290" stroke="#8a97a3" stroke-width="1.5"/>',
 ),
 boiler: svg(
  '0 0 300 400',
  '<rect width="300" height="400" fill="#dbe6ef"/>' +
   '<rect x="70" y="50" width="160" height="190" rx="14" fill="#fffdf8" stroke="#1f3a5c" stroke-width="4"/>' +
   '<rect x="104" y="92" width="92" height="34" rx="6" fill="#1f3a5c"/><rect x="114" y="102" width="36" height="14" rx="3" fill="#7fb3d5"/>' +
   '<g fill="none" stroke="#1f3a5c" stroke-width="4"><circle cx="122" cy="176" r="11"/><circle cx="178" cy="176" r="11"/></g>' +
   '<g fill="none" stroke="#c4572a" stroke-width="12"><path d="M100 240V400"/><path d="M130 240V318a18 18 0 0 0 18 18H300"/><path d="M170 240V400"/><path d="M200 240V292"/></g>' +
   '<g fill="#1f3a5c"><rect x="88" y="296" width="24" height="12" rx="3"/><rect x="158" y="356" width="24" height="12" rx="3"/></g>' +
   '<circle cx="200" cy="306" r="15" fill="#fffdf8" stroke="#1f3a5c" stroke-width="4"/><path d="M200 306l8-8" stroke="#c4572a" stroke-width="3" stroke-linecap="round"/>',
 ),
 map: svg(
  '0 0 400 300',
  '<rect width="400" height="300" fill="#eef3f7"/>' +
   '<g stroke="#fffdf8" stroke-width="4" stroke-linejoin="round">' +
   '<path d="M0 0H150L170 90L80 130L0 110Z" fill="#c9d6e2"/><path d="M150 0H290L270 100L170 90Z" fill="#b8c9d8"/>' +
   '<path d="M290 0H400V130L300 140L270 100Z" fill="#c9d6e2"/><path d="M0 110L80 130L110 230L0 250Z" fill="#b8c9d8"/>' +
   '<path d="M80 130L170 90L270 100L300 140L250 220L110 230Z" fill="#1f3a5c"/>' +
   '<path d="M300 140L400 130V300H230L250 220Z" fill="#c9d6e2"/><path d="M0 250L110 230L250 220L230 300H0Z" fill="#d6e0e9"/></g>' +
   '<path d="M190 146c0-14 11-24 24-24s24 10 24 24c0 18-24 38-24 38s-24-20-24-38Z" fill="#c4572a"/><circle cx="214" cy="146" r="8" fill="#fffdf8"/>',
 ),
 zones: svg(
  '0 0 400 300',
  '<rect width="400" height="300" fill="#f6f3ea"/>' +
   '<rect x="40" y="40" width="180" height="120" fill="#c4572a" fill-opacity=".85"/><rect x="220" y="40" width="140" height="120" fill="#c4572a" fill-opacity=".45"/>' +
   '<rect x="40" y="160" width="120" height="100" fill="#c4572a" fill-opacity=".25"/><rect x="160" y="160" width="200" height="100" fill="#1f3a5c" fill-opacity=".18"/>' +
   '<path d="M40 40H360V260H40Z M220 40V160 M40 160H360 M160 160V260" fill="none" stroke="#1f3a5c" stroke-width="6"/>' +
   '<g fill="#fffdf8" stroke="#1f3a5c" stroke-width="3"><circle cx="130" cy="100" r="12"/><circle cx="290" cy="100" r="12"/><circle cx="100" cy="210" r="12"/><circle cx="260" cy="210" r="12"/></g>',
 ),
 mark: svg(
  '0 0 120 120',
  '<rect width="120" height="120" rx="26" fill="#1f3a5c"/>' +
   '<path d="M28 44H62a20 20 0 0 1 20 20V94" fill="none" stroke="#c4572a" stroke-width="16"/>' +
   '<rect x="20" y="34" width="10" height="20" rx="2" fill="#f4e6cf"/><rect x="72" y="90" width="20" height="10" rx="2" fill="#f4e6cf"/>',
 ),
 pricelist: svg(
  '0 0 300 400',
  '<rect width="300" height="400" fill="#e9e6dc"/><rect x="50" y="30" width="200" height="340" rx="4" fill="#fffdf8"/>' +
   '<rect x="50" y="30" width="200" height="60" fill="#1f3a5c"/><rect x="70" y="49" width="22" height="22" rx="5" fill="#c4572a"/>' +
   '<g fill="#c5ccd3"><rect x="70" y="116" width="110" height="8" rx="2"/><rect x="70" y="146" width="96" height="8" rx="2"/>' +
   '<rect x="70" y="176" width="120" height="8" rx="2"/><rect x="70" y="206" width="88" height="8" rx="2"/><rect x="70" y="236" width="104" height="8" rx="2"/></g>' +
   '<g fill="#1f3a5c"><rect x="206" y="116" width="24" height="8" rx="2"/><rect x="206" y="146" width="24" height="8" rx="2"/>' +
   '<rect x="206" y="176" width="24" height="8" rx="2"/><rect x="206" y="206" width="24" height="8" rx="2"/><rect x="206" y="236" width="24" height="8" rx="2"/></g>' +
   '<rect x="70" y="300" width="160" height="40" rx="6" fill="#eef3f7"/>',
 ),
};
export const artSrc = (key) => `data:image/svg+xml,${encodeURIComponent(ART[key] ?? '')}`;

// The page editor: the blocks the tray offers, grouped as the studio groups
// them, what a new one says, and the fields the inspector shows for it.
export const TRAY_GROUPS = ['Content', 'Common', 'Call to action'];
export const BLOCKS = {
 text_image: {
  label: 'Text & image',
  group: 'Content',
  data: {
   headline: 'A family firm, not a call centre',
   body: 'Dana and Chike Okafor run every job themselves. You get a price before we start and a tidy floor when we leave.',
   art: 'plan',
  },
  fields: [
   ['headline', 'Headline', 'area'],
   ['body', 'Text', 'area'],
  ],
 },
 gallery: {
  label: 'Gallery',
  group: 'Content',
  data: { headline: 'Recent work', items: ['plan', 'boiler', 'zones'] },
  fields: [['headline', 'Headline']],
 },
 hero: {
  label: 'Hero',
  group: 'Common',
  data: {
   headline: 'Same-week repairs, and a plumber who calls back',
   lead: 'Leaks, boilers and bathrooms across Harbor County, fixed by the same two vans for fifteen years.',
   button: 'Book a visit',
   art: 'pipes',
  },
  fields: [
   ['headline', 'Headline', 'area'],
   ['lead', 'Subheadline', 'area'],
   ['button', 'Button label'],
  ],
 },
 cards: {
  label: 'Cards',
  group: 'Common',
  data: {
   headline: 'What we fix',
   items: [
    { title: 'Leaks and bursts', body: 'Same day for anything dripping through a ceiling.' },
    { title: 'Boilers', body: 'Servicing, repairs and straight advice on replacing.' },
    { title: 'Bathrooms', body: 'Full refits, planned with you, finished when we said.' },
   ],
  },
  fields: [['headline', 'Headline']],
  item: { name: 'Card', fields: [['title', 'Title'], ['body', 'Text', 'area']] },
 },
 quotes: {
  label: 'Quotes',
  group: 'Common',
  data: {
   quote: 'They came the same afternoon, showed me the problem, and charged what they said they would.',
   name: 'Marguerite Lind',
   place: 'Harbor Heights',
  },
  fields: [
   ['quote', 'Quote', 'area'],
   ['name', 'Name'],
   ['place', 'Where they live'],
  ],
 },
 faq: {
  label: 'FAQ',
  group: 'Common',
  data: {
   headline: 'Good to know',
   items: [
    { q: 'Do you charge a call-out fee?', a: 'No. You pay for the work, priced before we start.' },
    { q: 'Which areas do you cover?', a: 'All of Harbor County, and the coast road to Fenwick.' },
    { q: 'Are you insured?', a: 'Fully, and registered for gas work.' },
   ],
  },
  fields: [['headline', 'Headline']],
  item: { name: 'Question', fields: [['q', 'Question'], ['a', 'Answer', 'area']] },
 },
 stats: {
  label: 'Stats',
  group: 'Common',
  data: {
   headline: 'Fifteen years on the same streets',
   items: [
    { value: '15', label: 'Years in business' },
    { value: '4,200', label: 'Jobs finished' },
    { value: '2 hrs', label: 'Usual emergency arrival' },
   ],
  },
  fields: [['headline', 'Headline']],
  item: { name: 'Number', fields: [['value', 'Number'], ['label', 'Label']] },
 },
 pricing: {
  label: 'Pricing',
  group: 'Common',
  data: {
   headline: 'Fixed prices for common jobs',
   items: [
    { name: 'Water heater service', price: '$95' },
    { name: 'Tap or valve', price: '$70' },
    { name: 'Leak find and fix', price: 'from $120' },
   ],
  },
  fields: [['headline', 'Headline']],
  item: { name: 'Price', fields: [['name', 'Name'], ['price', 'Price']] },
 },
 cta: {
  label: 'Call to action',
  group: 'Call to action',
  data: { headline: 'Something leaking right now?', lead: 'Call and a real person answers, seven days a week.', button: 'Call 555-0187' },
  fields: [
   ['headline', 'Headline'],
   ['lead', 'Text', 'area'],
   ['button', 'Button label'],
  ],
 },
};
export const START_PAGE = ['hero', 'cards', 'quotes', 'cta'];
// A block's look when it's added: most on the page, the call to action on the brand.
export const startLook = (type) => ({ background: type === 'cta' ? 'brand' : type === 'stats' ? 'dark' : 'page', above: 'normal', below: 'normal', divider: false });

// Media: the site's files.
export const MEDIA_FOLDERS = ['Artwork', 'Plans', 'Documents', 'Logos'];
export const MEDIA = [
 { id: 'm1', name: 'pipe-run.svg', art: 'pipes', folder: 'Artwork', kind: 'Image', size: '18 KB', width: 2400, height: 1800, alt: 'Copper and blue pipes running across a navy wall, with a valve', usedOn: ['Home'], tags: ['hero', 'pipes'], added: 'Nov 12' },
 { id: 'm2', name: 'bathroom-plan.svg', art: 'plan', folder: 'Plans', kind: 'Image', size: '9 KB', width: 2400, height: 1800, alt: '', usedOn: ['Home', 'Bathrooms'], tags: ['bathroom'], added: 'Nov 10' },
 { id: 'm3', name: 'boiler-diagram.svg', art: 'boiler', folder: 'Plans', kind: 'Image', size: '7 KB', width: 1500, height: 2000, alt: 'A wall-hung boiler with its flow and return pipes', usedOn: ['Boilers'], tags: ['boiler'], added: 'Nov 9' },
 { id: 'm4', name: 'heating-zones.svg', art: 'zones', folder: 'Plans', kind: 'Image', size: '6 KB', width: 2400, height: 1800, alt: '', usedOn: [], tags: ['heating'], added: 'Nov 3' },
 { id: 'm5', name: 'service-area.svg', art: 'map', folder: 'Artwork', kind: 'Image', size: '11 KB', width: 2400, height: 1800, alt: 'Map of Harbor County with the area we cover in navy', usedOn: ['Areas we cover'], tags: ['map'], added: 'Oct 28' },
 { id: 'm6', name: 'okafor-mark.svg', art: 'mark', folder: 'Logos', kind: 'Logo', size: '2 KB', width: 512, height: 512, alt: 'Okafor Plumbing', usedOn: ['Header', 'Footer'], tags: ['logo'], added: 'Oct 20' },
 { id: 'm7', name: 'price-list-2026.pdf', art: 'pricelist', folder: 'Documents', kind: 'PDF', size: '214 KB', width: 0, height: 0, pages: 2, alt: '', usedOn: [], tags: ['prices'], added: 'Oct 18' },
];
// What Upload adds, one at a time.
export const UPLOADS = [
 { name: 'kitchen-zones.svg', art: 'zones', folder: 'Plans', kind: 'Image', size: '6 KB', width: 2400, height: 1800, tags: [] },
 { name: 'van-route-map.svg', art: 'map', folder: 'Artwork', kind: 'Image', size: '12 KB', width: 2400, height: 1800, tags: [] },
];

// Collections: the site's own kinds of things.
export const COLLECTIONS = [
 {
  key: 'services',
  name: 'Services',
  one: 'service',
  address: 'okaforplumbing.com/services',
  columns: [
   ['name', 'Name'],
   ['price', 'Price'],
  ],
  fields: [
   ['name', 'Name'],
   ['price', 'Price'],
   ['blurb', 'Short description', 'area'],
  ],
  entries: [
   { id: 's1', name: 'Water heater service', price: '$95', blurb: 'A yearly check that keeps the warranty valid and the bills down.', status: 'live', updated: 'Nov 14', art: 'boiler' },
   { id: 's2', name: 'Leak find and fix', price: 'from $120', blurb: 'We find it without lifting half the floor.', status: 'live', updated: 'Nov 12', art: 'pipes' },
   { id: 's3', name: 'Tap or valve', price: '$70', blurb: 'Dripping, stiff or loose, swapped in an hour.', status: 'live', updated: 'Nov 8', art: 'pipes' },
   { id: 's4', name: 'Radiator swap', price: '$160', blurb: 'Same spot, new radiator, no mess on the carpet.', status: 'live', updated: 'Nov 2', art: 'zones' },
   { id: 's5', name: 'Water heater flush', price: '$340', blurb: 'Cold spots and noisy pipes, cleared in a day.', status: 'draft', updated: 'Yesterday', art: 'zones' },
   { id: 's6', name: 'Bathroom refit', price: 'Quoted', blurb: 'Planned with you, finished when we said.', status: 'draft', updated: 'Today', art: 'plan' },
  ],
 },
 {
  key: 'team',
  name: 'Team',
  one: 'person',
  address: 'Shown on About us',
  columns: [
   ['name', 'Name'],
   ['role', 'Role'],
  ],
  fields: [
   ['name', 'Name'],
   ['role', 'Role'],
   ['blurb', 'About them', 'area'],
  ],
  entries: [
   { id: 't1', name: 'Dana Okafor', role: 'Plumber, owner', blurb: 'Fixes the hard ones, answers the phone.', status: 'live', updated: 'Oct 20' },
   { id: 't2', name: 'Chike Okafor', role: 'Heating engineer', blurb: 'Boilers, radiators, anything with a flame.', status: 'live', updated: 'Oct 20' },
   { id: 't3', name: 'Ruth Mensah', role: 'Office', blurb: 'Books the visits and keeps the van stocked.', status: 'live', updated: 'Nov 1' },
  ],
 },
 {
  key: 'areas',
  name: 'Areas we cover',
  one: 'area',
  address: 'okaforplumbing.com/areas',
  columns: [
   ['name', 'Name'],
   ['arrival', 'Usual arrival'],
  ],
  fields: [
   ['name', 'Name'],
   ['arrival', 'Usual arrival'],
   ['blurb', 'Note', 'area'],
  ],
  entries: [
   { id: 'a1', name: 'Harbor Heights', arrival: 'Same day', blurb: 'Our own patch.', status: 'live', updated: 'Oct 28' },
   { id: 'a2', name: 'Old Town', arrival: 'Same day', blurb: 'Parking permits sorted.', status: 'live', updated: 'Oct 28' },
   { id: 'a3', name: 'Quayside', arrival: 'Next day', blurb: '', status: 'live', updated: 'Oct 28' },
   { id: 'a4', name: 'Fenwick', arrival: 'Next day', blurb: 'Along the coast road.', status: 'draft', updated: 'Nov 15' },
  ],
 },
];

// Forms: the kinds of field the builder offers, and the site's form.
export const FORM_KINDS = [
 { kind: 'name', label: 'Name', icon: 'form-name' },
 { kind: 'email', label: 'Email', icon: 'form-email' },
 { kind: 'phone', label: 'Phone', icon: 'form-phone' },
 { kind: 'text', label: 'Short answer', icon: 'form-text' },
 { kind: 'textarea', label: 'Long answer', icon: 'form-textarea' },
 { kind: 'date', label: 'Date', icon: 'form-date' },
 { kind: 'select', label: 'Dropdown', icon: 'form-select' },
 { kind: 'radio', label: 'Pick one', icon: 'form-radio' },
 { kind: 'checkbox', label: 'Checkboxes', icon: 'form-checkbox' },
 { kind: 'consent', label: 'Consent', icon: 'form-consent' },
];
export const FORM = {
 name: 'Request a visit',
 intro: 'Tell us what needs fixing and when suits you. We reply the same working day.',
 button: 'Send request',
 fields: [
  { id: 'f1', kind: 'name', label: 'Your name', help: '', required: true, width: 'half' },
  { id: 'f2', kind: 'phone', label: 'Phone', help: '', required: true, width: 'half' },
  { id: 'f3', kind: 'email', label: 'Email', help: 'We send the quote here.', required: false, width: 'full' },
  { id: 'f4', kind: 'textarea', label: 'What needs fixing?', help: '', required: true, width: 'full' },
  { id: 'f5', kind: 'date', label: 'A day that suits you', help: '', required: false, width: 'half' },
  { id: 'f6', kind: 'select', label: 'How did you find us?', help: '', required: false, width: 'half', options: ['A neighbor', 'Search', 'The van'] },
 ],
 answers: [
  { id: 'r1', name: 'Priya Natarajan', when: 'Today, 9:14 am', fixing: 'Kitchen tap drips all night, and the shut-off valve under the sink is stiff.', day: 'Thu, Nov 20', phone: '555-0144', new: true },
  { id: 'r2', name: 'Tom Hendry', when: 'Yesterday, 6:02 pm', fixing: 'Boiler shows a pressure warning most mornings.', day: 'Any weekday', phone: '555-0199', new: true },
  { id: 'r3', name: 'Ama Boateng', when: 'Mon, 11:40 am', fixing: 'Quote for a new bathroom, small room, bath out and shower in.', day: 'Sat, Nov 22', phone: '555-0121', new: false },
 ],
};

// Library: what the site shares between pages.
export const SHARED = [
 {
  id: 'hours',
  name: 'Opening hours',
  usedOn: ['Home', 'Contact', 'Boilers', 'Emergencies'],
  data: { weekdays: '7am – 6pm', saturday: '8am – 2pm', sunday: 'Emergencies only', note: 'Out of hours, call 555-0187 and leave a message.' },
  fields: [
   ['weekdays', 'Monday to Friday'],
   ['saturday', 'Saturday'],
   ['sunday', 'Sunday'],
   ['note', 'Note', 'area'],
  ],
 },
 {
  id: 'banner',
  name: 'Emergency banner',
  usedOn: ['Home', 'Emergencies'],
  data: { text: 'Burst pipe? We aim to be there within two hours.', button: 'Call now' },
  fields: [
   ['text', 'Message', 'area'],
   ['button', 'Button label'],
  ],
 },
];
export const TEMPLATES = [
 { id: 'tp1', name: 'Service page', blocks: ['hero', 'text_image', 'pricing', 'faq', 'cta'], usedBy: 6 },
 { id: 'tp2', name: 'Area page', blocks: ['hero', 'text_image', 'quotes', 'cta'], usedBy: 4 },
 { id: 'tp3', name: 'News post', blocks: ['text_image', 'gallery', 'cta'], usedBy: 2 },
];
export const FRAMES = { phone: '555-0187', button: 'Book a visit', blurb: 'Plumbing and heating across Harbor County since 2011.' };

// People & access.
export const ROLES = [
 { key: 'owner', name: 'Owner', can: 'Everything, including who has access' },
 { key: 'admin', name: 'Admin', can: 'Settings, people and publishing' },
 { key: 'editor', name: 'Editor', can: 'Edit and publish pages' },
 { key: 'reviewer', name: 'Reviewer', can: 'Comment on and approve pages' },
];
export const PEOPLE = [
 { id: 'p1', name: 'Dana Okafor', email: 'dana@okaforplumbing.com', role: 'owner', active: 'Now', you: true },
 { id: 'p2', name: 'Chike Okafor', email: 'chike@okaforplumbing.com', role: 'admin', active: '2 hours ago' },
 { id: 'p3', name: 'Ruth Mensah', email: 'ruth@okaforplumbing.com', role: 'editor', active: 'Yesterday' },
];

// Branding: what the Branding room offers.
export const BRAND_COLORS = ['#bd5326', '#2f6b4f', '#1f3a5c', '#7a3e9d', '#a93b3b', '#0f6f78'];
export const HEADING_FONTS = ['Archivo', 'Bitter', 'Fraunces'];
export const BODY_FONTS = ['Public Sans', 'Archivo', 'Bitter'];

// People & access: an invite sent but not opened yet.
export const INVITES = [{ id: 'i1', email: 'kofi@okaforplumbing.com', role: 'reviewer', sent: '3 days ago' }];

// Forms, more: what a new field says when it's added from the list, the rest
// of what each answer says, and who hears about a new one.
export const FORM_STARTS = {
 name: { label: 'Your name', width: 'half' },
 email: { label: 'Email', width: 'half' },
 phone: { label: 'Phone', width: 'half' },
 text: { label: 'Your address', width: 'full' },
 textarea: { label: 'Anything else we should know?', width: 'full' },
 date: { label: 'Another day that works', width: 'half' },
 select: { label: 'Which area are you in?', width: 'half', options: ['Harbor Heights', 'Old Town', 'Quayside'] },
 radio: { label: 'How soon do you need us?', width: 'full', options: ['Today', 'This week', 'No rush'] },
 checkbox: { label: 'What is it about?', width: 'full', options: ['Boiler', 'Leak', 'Bathroom'] },
 consent: { label: 'You can call me about this request', width: 'full' },
};
export const FORM_ANSWER_MORE = {
 r1: { email: 'priya.natarajan@example.com', found: 'A neighbor' },
 r2: { email: '', found: 'Search' },
 r3: { email: 'ama.boateng@example.com', found: 'The van' },
};
export const FORM_NOTIFY = [{ email: 'dana@okaforplumbing.com', when: 'Every new answer' }];
