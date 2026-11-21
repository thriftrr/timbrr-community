import { createError, defineEventHandler, setResponseHeader, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { breakPageHtml } from '../utils/break-page.js';
import { HOSTED_HOST_HEADER, hostAnswer, hostedHost, hostedMode } from '../utils/hosted.js';
import { passHost, previewTarget } from '../utils/preview.js';

// Every request to a launch domain, on the shared Worker only: look up the
// site the hostname belongs to and set it on this request's copy of the
// runtime config, so everything downstream reads it the usual way. A host
// no live site answers for is a plain 404, except a live site billing took
// off the web: every path on it gets the short-break page (the studio's
// docs/account.md) as a 503 that says to come back, until it's paid. Dev
// and staging addresses are the preview middleware's.
export default defineEventHandler(async (event) => {
 if (!hostedMode(event) || previewTarget(event)) return;
 const config = useRuntimeConfig(event);
 if (String(config.public.site ?? '').trim()) return;

 const host = hostedHost(event);
 const answer = await hostAnswer(event, host);
 if (answer === undefined) {
  throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: "Couldn't reach the studio. Try again in a minute." });
 }
 if (answer.paused) {
  setResponseStatus(event, 503, 'Taking a short break');
  setResponseHeader(event, 'retry-after', '3600');
  setResponseHeader(event, 'cache-control', 'no-store');
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8');
  return breakPageHtml(answer.paused);
 }
 if (!answer.slug) throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
 config.public.site = answer.slug;
 passHost(event, HOSTED_HOST_HEADER, host);
});
