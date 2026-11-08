import { createError, defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { HOSTED_HOST_HEADER, hostedHost, hostedMode, siteForHost } from '../utils/hosted.js';
import { previewTarget } from '../utils/preview.js';

// Every request to a launch domain, on the shared Worker only: look up the
// site the hostname belongs to and set it on this request's copy of the
// runtime config, so everything downstream reads it the usual way. A host
// no live site answers for is a plain 404. Dev and staging addresses are
// the preview middleware's.
export default defineEventHandler(async (event) => {
 if (!hostedMode(event) || previewTarget(event)) return;
 const config = useRuntimeConfig(event);
 if (String(config.public.site ?? '').trim()) return;

 const host = hostedHost(event);
 const slug = await siteForHost(event, host);
 if (slug === undefined) {
  throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: "Couldn't reach the studio. Try again in a minute." });
 }
 if (!slug) throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
 config.public.site = slug;
 event.node.req.headers[HOSTED_HOST_HEADER] = host;
});
