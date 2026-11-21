// A form's share page (the studio's docs/forms.md, "Share link"): the form on
// its own page at /f/<slug> with no page of the site holding it, the address a
// QR code in a shop window opens. Its slug is the studio's (FORM_SHARE_SLUG).

export const SHARE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

// Whether a request's path is a share page. This is the one route other sites
// may frame (an embed's iframe), and one search engines stay out of.
export const isSharePath = (pathname) => /^\/f\/[^/]+$/i.test(String(pathname ?? '').replace(/\/+$/, ''));
