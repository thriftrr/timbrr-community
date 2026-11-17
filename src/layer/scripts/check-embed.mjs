// Checks what an Embed block frames and what a Price calculator adds up to,
// with no build and no Vue:
//   node layer/scripts/check-embed.mjs
import { equal } from 'node:assert/strict';
import { calculatorTotal, embedFrame, priceNumber } from '../app/utils/blocks.js';
import { safeHref } from '../app/utils/timbrr.js';

// A link never leaves for another host by a back slash or a control character a browser drops.
for (const bad of ['//evil.example', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', 'javascript:alert(1)']) equal(safeHref(bad), undefined, JSON.stringify(bad));
equal(safeHref('/events/open-day'), '/events/open-day');

const RGP = 'https://app.rockgympro.com/b/s/?lk=abc123&bw=6f290f42e9fb4e12926bdb594e672d2a';

// An address alone, or the first one in a pasted embed code.
equal(embedFrame('https://example.com/widget?a=1'), 'https://example.com/widget?a=1');
equal(embedFrame('<iframe src="https://example.com/x?a=1&amp;b=2" width="100%"></iframe>'), 'https://example.com/x?a=1&b=2');
// A script never reaches the page: only its address is read, and Rock Gym
// Pro's script address becomes the page for the same widget.
equal(embedFrame(`<script src="${RGP}"></script><script>alert(1)</script>`), 'https://app.rockgympro.com/b/?bw=6f290f42e9fb4e12926bdb594e672d2a');
equal(embedFrame('https://app.rockgympro.com/b/s/?lk=abc&bo=giftcard-92dcde09052743b8'), 'https://app.rockgympro.com/b/?bo=giftcard-92dcde09052743b8');
equal(embedFrame('https://app.rockgympro.com/b/s/?lk=abc'), undefined);
// Nothing but https.
for (const bad of ['', null, 'calendar', 'http://example.com', 'javascript:alert(1)', '//example.com', 'data:text/html,<p>']) equal(embedFrame(bad), undefined);

equal(priceNumber('$59'), 59);
equal(priceNumber('59.50'), 59.5);
equal(priceNumber('1,200'), 1200);
equal(priceNumber('free'), 0);

const data = { price: '$59', extra: '15', addons: [{ price: '15', per: 'each' }, { price: '30', per: 'once' }] };
equal(calculatorTotal(data, 1, []), 59);
equal(calculatorTotal(data, 3, []), 89);
equal(calculatorTotal(data, 3, [true]), 134);
equal(calculatorTotal(data, 3, [true, true]), 164);
equal(calculatorTotal({ price: '', extra: '', addons: [] }, 4, []), 0);

console.log('ok  embedFrame, priceNumber, calculatorTotal');
