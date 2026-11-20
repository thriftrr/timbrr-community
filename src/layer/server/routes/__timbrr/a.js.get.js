import { defineEventHandler, setResponseHeaders } from 'h3';
import script from '../../utils/analytics-script.js';

// /__timbrr/a.js: Timbrr Analytics' page script, under 3 KB gzipped
// (layer/analytics/a.src.js). The same on every site; a page only loads it
// when the studio says the site counts (composables/page.js).
export default defineEventHandler((event) => {
 setResponseHeaders(event, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
 return script;
});
