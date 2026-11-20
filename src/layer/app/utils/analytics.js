// A block says something happened that its own link can't show (a form was
// sent, a video was played, checkout was opened). /__timbrr/a.js (layer/
// analytics/a.src.js) hears it and sends it if the owner picked events. The
// name is one of EVENT_NAMES in server/utils/analytics.js; anything else is
// refused there. Nothing is sent but the name. A page without the script
// ignores it. A link says it with data-tb-event="booking_open" instead.
export function timbrrEvent(name) {
 if (import.meta.client) window.dispatchEvent(new CustomEvent('timbrr:event', { detail: name }));
}
