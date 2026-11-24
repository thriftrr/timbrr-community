// Following a link inside the site doesn't reload the page, so the observer
// script (schema/motion.js) doesn't run again: set up the new page's blocks.
export default defineNuxtPlugin((nuxtApp) => {
 nuxtApp.hook('page:finish', () => window.__tbMotion?.());
});
