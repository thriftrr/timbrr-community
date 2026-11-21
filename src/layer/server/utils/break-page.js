// The short-break page (the studio's docs/account.md): what a launch domain
// shows while billing has its site off the web. The business's name and the
// Site details a customer still needs, so the phone keeps ringing; nothing
// else. Plain HTML with no scripts, every value escaped. `paused` is the
// studio's breakPage(): { name, phone, email, address, hours: [{ day, text }] }.

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function breakPageHtml(paused) {
 const name = escape(paused?.name || 'This site');
 const hours = Array.isArray(paused?.hours) ? paused.hours : [];
 const rows = [
  hours.length ? `<dt>Hours</dt><dd>${hours.map((row) => `${escape(String(row.day).slice(0, 3))} ${escape(row.text)}`).join('<br>')}</dd>` : '',
  paused?.phone ? `<dt>Phone</dt><dd><a href="tel:${escape(String(paused.phone).replace(/[^\d+]/g, ''))}">${escape(paused.phone)}</a></dd>` : '',
  paused?.email ? `<dt>Email</dt><dd><a href="mailto:${escape(paused.email)}">${escape(paused.email)}</a></dd>` : '',
  paused?.address ? `<dt>Address</dt><dd>${escape(paused.address)}</dd>` : '',
 ].join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${name}</title>
<style>:root{color-scheme:light dark}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:light-dark(#fbf8f2,#1d1a16);color:light-dark(#3a2a1c,#f1ebe2);font:16px/1.55 system-ui,sans-serif}main{max-width:30rem;padding:2.5rem 1.5rem;text-align:center}.m{display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:.75rem;background:light-dark(#5b3b22,#c9a27e);color:light-dark(#fff,#1d1a16);font:700 1.4rem Georgia,serif}h1{margin:1rem 0 .5rem;font:700 1.6rem/1.2 Georgia,serif}p{margin:0;opacity:.85}dl{display:grid;grid-template-columns:auto auto;justify-content:center;gap:.35rem 1rem;margin:1.5rem 0 0;text-align:left}dt{opacity:.7}dd{margin:0}a{color:inherit}</style></head>
<body><main><span class="m" aria-hidden="true">${escape(String(paused?.name || '?').slice(0, 1).toUpperCase())}</span><h1>${name} is taking a short break online</h1><p>${rows ? 'We&#39;re open as usual. Find us here:' : 'Please check back soon.'}</p>${rows ? `<dl>${rows}</dl>` : ''}</main></body></html>`;
}
