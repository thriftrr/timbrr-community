// The forms this page shows, by id, as the studio sends them (the studio's
// docs/forms.md): from the page's answer on the site and from the studio in its
// canvas. A block or a footer names a form and reads it from here.
export function useTimbrrForms() {
 return useState('timbrr-forms', () => ({}));
}
