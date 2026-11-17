import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished } from '../../utils/studio.js';

// /__timbrr/groves?grove=events&…: a list of this site's published
// saplings, exactly as the studio's public read API sends it (docs/README.md
// § Groves), kept a minute at the edge. The Grove list block asks for it.
// Only the parameters the studio reads are passed on, each cut to a sane
// length. No such grove, or no site set up here, is a 404; the studio
// failing a 502. On a dev or staging address it's every sapling's working
// copy, never cached.
//
// `f` (a fixed filter, ring:op:value) comes up to five times; `c.<ring>` is
// a visitor's answer to one of the list's choices, up to three; `rk` says
// which saplings are related, `facets` which rings to count answers for and
// `meta=1` asks for the grove's rings too (useGrove).
const PARAMS = ['grove', 'sort', 'dir', 'limit', 'p', 'fr', 'fo', 'fv', 'show', 'bs', 'br', 'rel', 'rk', 'facets', 'meta'];
const CHOICE = /^c\.[a-z][a-z0-9_]{0,39}$/;

export default defineEventHandler(async (event) => {
 const asked = getQuery(event);
 const query = new URLSearchParams();
 for (const key of PARAMS) if (typeof asked[key] === 'string' && asked[key]) query.set(key, asked[key].slice(0, 400));
 for (const one of [asked.f ?? []].flat().slice(0, 5)) if (typeof one === 'string' && one) query.append('f', one.slice(0, 400));
 for (const key of Object.keys(asked).filter((key) => CHOICE.test(key)).sort().slice(0, 3)) if (typeof asked[key] === 'string' && asked[key]) query.set(key, asked[key].slice(0, 200));
 const answer = query.get('grove') ? await fetchPublished(event, `groves?${query}`) : { status: 404 };
 const status = answer.status === 200 ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  'Cache-Control': status === 502 || event.context.timbrrPreview ? 'no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (status === 200) return answer.data;
 setResponseStatus(event, status);
 return status === 404 ? { statusCode: 404, message: "That list doesn't exist." } : { statusCode: status, message: status === 401 ? 'Sign in to see this site.' : "Couldn't get this list from the studio. Try again in a minute." };
});
