// Members (the studio's docs/members.md). Whether this visitor is signed in,
// for the header's Sign in / Account link: worked out on the server from the
// site's own httpOnly cookie (the browser can't read it) and carried to the
// browser in the page's state; signing in or out here sets it.
export function useTimbrrMemberIn() {
 return useState('timbrr-member-in', () => (import.meta.server ? /(?:^|;\s*)tb_member=[A-Za-z0-9_-]{16,}/.test(useRequestHeaders(['cookie']).cookie ?? '') : false));
}

// The site's header and footer for a members page (/members, /join,
// /account), read from the home page the way error.vue does: its look and
// frame, none of its head tags. `own` is true when the owner published a page
// of their own at this address: theirs wins, as a site's own page always
// does, and the members page draws it instead (pages/[...slug].vue).
export async function useTimbrrMembersFrame(title) {
 const nuxtApp = useNuxtApp();
 const route = useRoute();
 // Before the first await: useState needs the setup context.
 const memberIn = useTimbrrMemberIn();
 const { data: mine } = await useFetch('/__timbrr/page', { query: { path: route.path }, key: `tb-own-${route.path}`, retry: false, default: () => null });
 const own = Boolean(mine.value?.page);
 if (own) return { own, site: ref({}), style: ref({}), memberIn };
 // After an await the setup context is gone; run the page read and the head
 // in the Nuxt app's own context (nuxtApp.runWithContext), or both throw
 // NUXT_E1001 and the members pages answer 500.
 const home = await nuxtApp.runWithContext(() => useTimbrrPage('/', { quiet: true })).catch(() => null);
 nuxtApp.runWithContext(() => useSeoMeta({ title: () => [toValue(title), home?.site.value.name].filter(Boolean).join(' · '), robots: 'noindex' }));
 return { own, site: home?.site ?? ref({ name: '', domain: '', nav: [], members: null }), style: home?.style ?? ref({}), memberIn };
}

const problemOf = (error, fallback) => error?.data?.message || fallback;
export const membersProblem = problemOf;
