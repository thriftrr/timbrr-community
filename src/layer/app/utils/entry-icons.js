// Icons for an entry's page and its lists (the Entry summary, the filters
// of a Collection list): each the `d` of its paths on a 24 × 24 grid, drawn
// as a 2px stroke so they take the text's color. The keys are what a page
// stores, so they don't change.
export const ENTRY_ICONS = {
 calendar: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 10h18'],
 clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3.5 2'],
 people: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
 level: ['M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z', 'M22 10v6', 'M6 12.5V16a6 3 0 0 0 12 0v-3.5'],
 pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
 tag: ['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7.5 7.5h.01'],
 check: ['M20 6 9 17l-5-5'],
 info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16v-4', 'M12 8h.01'],
 mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'],
};

// The icons the studio's icon picker offers a row of the Entry summary.
export const ENTRY_ICON_OPTIONS = [
 ['Calendar', 'calendar'],
 ['Clock', 'clock'],
 ['People', 'people'],
 ['Level', 'level'],
 ['Pin', 'pin'],
 ['Tag', 'tag'],
 ['Check', 'check'],
 ['Info', 'info'],
].map(([label, value]) => ({ label, value, paths: ENTRY_ICONS[value] }));

// Drawn by the filters and rows: stroke paths too.
export const UI_ICONS = {
 chevron: ['m6 9 6 6 6-6'],
 arrow: ['M5 12h14', 'm12 5 7 7-7 7'],
 check: ['M20 6 9 17l-5-5'],
 close: ['M18 6 6 18', 'm6 6 12 12'],
 filter: ['M10 5H3', 'M12 19H3', 'M14 3v4', 'M16 17v4', 'M21 12h-9', 'M21 19h-5', 'M21 5h-7', 'M8 10v4', 'M8 12H3'],
 mail: ENTRY_ICONS.mail,
 chevronRight: ['m9 6 6 6-6 6'],
};
