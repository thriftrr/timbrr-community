// /__timbrr/a.js, Timbrr Analytics' page script (docs/analytics.md). Readable
// source; `node layer/scripts/build-analytics.mjs` minifies it into
// server/utils/analytics-script.js, which is what the site serves.
//
// Stores nothing on the device. Sends only the events the owner picked (the
// page tells it in <html data-tb-a>), as numbers and ids: never text from the
// page, form answers or selectors. A page and its picks come from
// <html data-tb-a="view,seen" data-tb-p="/about page-id">, which the page sets
// again on every client-side route change; that change is what ends one view
// and starts the next.
(function (w, d) {
 var n = navigator;
 // Do Not Track or Global Privacy Control: send nothing, listen to nothing.
 // The hit route also drops DNT: 1 and Sec-GPC: 1, as a second line.
 if (n.doNotTrack == '1' || w.doNotTrack == '1' || n.globalPrivacyControl === true) return;
 var h = d.documentElement;
 var S = h.dataset;
 var ev = [];
 var pg;
 var pth;
 var t0;
 var deep = 0;
 var io;
 var q = [];
 var tm;
 var sig = '';
 var live = 0;
 var first = 1;

 function flush() {
  clearTimeout(tm);
  tm = 0;
  if (!q.length) return;
  try {
   n.sendBeacon('/__timbrr/hit', JSON.stringify(q));
  } catch (e) {}
  q = [];
 }

 // Queue one event, if its kind was picked; `now` sends the queue at once.
 function add(e, o, now) {
  if (ev.indexOf(e) < 0) return;
  o.e = e;
  o.p = pth;
  o.g = pg;
  q.push(o);
  if (q.length > 9 || now) flush();
  else tm = tm || setTimeout(flush, 1500);
 }

 // How far down the page the visitor got, in bands of 10%.
 function depth() {
  deep = Math.max(deep, Math.min(100, Math.floor(((w.scrollY + w.innerHeight) / h.scrollHeight) * 10) * 10));
 }

 function pc(v, size) {
  return size ? Math.max(0, Math.min(100, Math.round((v / size) * 100))) : 0;
 }

 // A block is "seen" once 50% of it (or half the screen, for a tall one) has been in view for a second.
 function watch() {
  if (ev.indexOf('seen') < 0 || !w.IntersectionObserver) return;
  var o = (io = new IntersectionObserver(
   function (list) {
    list.forEach(function (x) {
     var el = x.target;
     if (x.intersectionRatio >= 0.5 || x.intersectionRect.height >= w.innerHeight / 2) {
      el._t =
       el._t ||
       setTimeout(function () {
        if (o !== io) return;
        o.unobserve(el);
        add('seen', { b: el.dataset.blockId });
       }, 1000);
     } else {
      clearTimeout(el._t);
      el._t = 0;
     }
    });
   },
   { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
  ));
  d.querySelectorAll('[data-block-id]').forEach(function (el) {
   o.observe(el);
  });
 }

 // The page on screen ends: how long and how far, sent now.
 function end() {
  if (!live) return;
  live = 0;
  if (io) io.disconnect();
  io = 0;
  add('leave', { s: Math.round(performance.now() / 1000 - t0), d: deep }, 1);
 }

 function start() {
  var a = S.tbA;
  var p = (S.tbP || '').split(' ');
  ev = a ? a.split(',') : [];
  pth = p[0];
  pg = p[1];
  if (!pth || !ev.length) return;
  live = 1;
  t0 = performance.now() / 1000;
  deep = 0;
  var o = { w: w.innerWidth };
  if (first) {
   // Where they came from, once; a move inside the site isn't a new source.
   var r = '';
   try {
    r = new URL(d.referrer).hostname;
   } catch (e) {}
   if (r && r != location.hostname) o.r = r;
   var u = new URLSearchParams(location.search);
   ['source', 'medium', 'campaign'].forEach(function (k) {
    var v = u.get('utm_' + k);
    if (v) o['u' + k[0]] = v.slice(0, 64);
   });
  }
  first = 0;
  add('view', o);
  // On a move between pages the new page's blocks are drawn a moment later.
  setTimeout(function () {
   depth();
   watch();
  }, 150);
 }

 function sync() {
  var s = S.tbA + '|' + S.tbP;
  if (s == sig) return;
  sig = s;
  end();
  start();
 }

 // What a link is, from its address alone: a call, an email, a file, a way
 // out. A link a block marks (data-tb-event="booking_open") says so itself.
 function kind(a) {
  var p = a.protocol;
  if (a.dataset.tbEvent) return a.dataset.tbEvent;
  if (p == 'tel:') return 'phone_tap';
  if (p == 'mailto:') return 'email_tap';
  if (p != 'http:' && p != 'https:') return '';
  if (a.hasAttribute('download') || /\.(pdf|docx?|xlsx?|pptx?|csv|zip|epub|mp3|mp4)$/i.test(a.pathname)) return 'file_download';
  return a.hostname != location.hostname ? 'outbound' : '';
 }

 d.addEventListener(
  'click',
  function (e) {
   var t = e.target;
   var l = live && t.closest && t.closest('a[href]');
   var n = l && kind(l);
   if (n) add('event', { n: n }, 1);
   var b = live && t.closest && t.closest('[data-block-id]');
   if (!b) return;
   var id = b.dataset.blockId;
   var r = b.getBoundingClientRect();
   // A click made by the keyboard has no place on the block.
   if (e.detail) add('heat', { b: id, x: pc(e.clientX - r.left, r.width), y: pc(e.clientY - r.top, r.height), w: w.innerWidth });
   var a = t.closest('a[href],button');
   if (a && b.contains(a)) {
    add('click', { b: id, i: [].indexOf.call(b.querySelectorAll('a[href],button'), a), k: a.tagName == 'A' ? 'link' : 'button', h: a.hostname && a.hostname != location.hostname ? a.hostname : '', w: w.innerWidth });
   }
  },
  true,
 );

 // Blocks that fire an event of their own say so here: `{ detail: 'form_sent' }`.
 w.addEventListener('timbrr:event', function (e) {
  if (live && typeof e.detail == 'string') add('event', { n: e.detail }, 1);
 });
 w.addEventListener('scroll', depth, { passive: true });
 w.addEventListener('pagehide', end);
 w.addEventListener('pageshow', function (e) {
  // Back from the back/forward cache is a new view.
  if (e.persisted) {
   sig = '';
   sync();
  }
 });
 d.addEventListener('visibilitychange', function () {
  if (d.hidden) flush();
 });
 new MutationObserver(sync).observe(h, { attributes: true, attributeFilter: ['data-tb-a', 'data-tb-p'] });
 sync();
})(window, document);
