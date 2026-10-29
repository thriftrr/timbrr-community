import { defineEventHandler, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished, siteOrigin } from '../utils/studio.js';

// /sitemap.xml: every published page search engines may list (a page set to
// noindex stays out), as full addresses on the site's own domain, or on the
// host this request came in on until the studio has one. From the studio's
// list of published pages, kept a minute at the edge like the pages. With
// no site set up here (the shared starter) there's no sitemap: a 404.
export default defineEventHandler(async (event) => {
 const answer = await fetchPublished(event, 'pages');
 if (answer.status !== 200 || !Array.isArray(answer.data.pages)) {
  const missing = answer.status === 404;
  setResponseStatus(event, missing ? 404 : 502);
  setResponseHeaders(event, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  return missing ? 'No sitemap here.\n' : "Couldn't get this site's pages from the studio. Try again in a minute.\n";
 }
 const origin = siteOrigin(event, answer.data.site.domain);
 const urls = answer.data.pages
  .filter((page) => typeof page?.path === 'string' && /^\/(?!\/)/.test(page.path) && !page.noindex)
  .map((page) => {
   const modified = w3cDate(page.publishedAt);
   return ` <url><loc>${xml(origin + page.path)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  });
 setResponseHeaders(event, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' });
 return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
});

// When the page was last published, to the second (2026-10-28T08:00:00Z),
// or nothing when there's no date to read.
function w3cDate(value) {
 const date = new Date(value ?? '');
 return Number.isNaN(date.getTime()) ? '' : date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function xml(text) {
 return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
