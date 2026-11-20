import { defineEventHandler, getHeader, getRouterParam, readBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';
import { SEARCH_NOTES, relaySearchNote } from '../../../utils/site-search.js';

// /__timbrr/search/log and /__timbrr/search/opened, with { q }: the pop-up
// and /search saying a search has settled, or that a result of it was
// opened. Passed on to the studio (relaySearchNote) after the answer, which
// is always 204: the browser sends it with sendBeacon and never reads it. A
// dev or staging address has no site search, so nothing goes on from there.
export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const action = String(getRouterParam(event, 'action') ?? '');
 if (!SEARCH_NOTES.includes(action)) {
  setResponseStatus(event, 404);
  return { statusCode: 404, message: 'Not found.' };
 }
 setResponseStatus(event, 204);
 if (event.context.timbrrPreview || Number(getHeader(event, 'content-length') ?? 0) > 1024) return null;
 const body = await readBody(event).catch(() => null);
 const config = useRuntimeConfig(event);
 const sent = relaySearchNote({
  api: studioApi(event),
  site: String(config.public.site ?? '').trim(),
  action,
  q: typeof body?.q === 'string' ? body.q : '',
  visitor: visitorAddress(event),
  relay: String(config.timbrr?.relaySecret ?? ''),
 });
 if (event.waitUntil) event.waitUntil(sent);
 else await sent;
 return null;
});
