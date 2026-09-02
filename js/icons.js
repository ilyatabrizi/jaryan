/* 24px grid, 1.75 stroke, round caps — one visual family across the app. */
const P = {
  home: '<path d="M4 10.6 12 4l8 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M9.6 20.5v-6h4.8v6"/>',
  compass: '<circle cx="12" cy="12" r="8.4"/><path d="M14.9 9.1 13.4 13.4 9.1 14.9l1.5-4.3z"/>',
  ticket: '<path d="M4 8.6a1.6 1.6 0 0 1 1.6-1.6h12.8A1.6 1.6 0 0 1 20 8.6v2a2.2 2.2 0 0 0 0 4.4v2a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17v-2a2.2 2.2 0 0 0 0-4.4z"/><path d="M14.2 7.4v1.9M14.2 11.1v1.9M14.2 14.8v1.9" stroke-dasharray="0 0"/>',
  bookmark: '<path d="M6.6 4.8h10.8a1 1 0 0 1 1 1v13.6l-6.4-3.6-6.4 3.6V5.8a1 1 0 0 1 1-1z"/>',
  user: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c.7-3.6 3.5-5.5 7-5.5s6.3 1.9 7 5.5"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  fwd: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.4"/><path d="m16 16 3.6 3.6"/>',
  close: '<path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6"/>',
  calendar: '<rect x="4" y="5.6" width="16" height="14" rx="2.4"/><path d="M4 10h16M8.6 3.6v3.4M15.4 3.6v3.4"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l2.8 1.7"/>',
  pin: '<path d="M12 21c4-4.4 6-7.6 6-10.2A6 6 0 0 0 6 10.8C6 13.4 8 16.6 12 21z"/><circle cx="12" cy="10.6" r="2.2"/>',
  users: '<circle cx="9.4" cy="8.6" r="3.2"/><path d="M3.6 19.4c.6-3 2.9-4.7 5.8-4.7s5.2 1.7 5.8 4.7"/><path d="M16.2 6.1a3 3 0 0 1 0 5.8M17.6 14.9c2.1.5 3.4 2.1 3.8 4.5"/>',
  share: '<path d="M12 15.4V4.6M8.4 8.2 12 4.6l3.6 3.6"/><path d="M6 12.6v5.8a1.6 1.6 0 0 0 1.6 1.6h8.8a1.6 1.6 0 0 0 1.6-1.6v-5.8"/>',
  heart: '<path d="M12 19.6S4.6 15.2 4.6 10.2A3.9 3.9 0 0 1 12 8.3a3.9 3.9 0 0 1 7.4 1.9c0 5-7.4 9.4-7.4 9.4z"/>',
  check: '<path d="m5.4 12.4 4.2 4.2 9-9.2"/>',
  plus: '<path d="M12 5.6v12.8M5.6 12h12.8"/>',
  minus: '<path d="M5.6 12h12.8"/>',
  spark: '<path d="M12 3.6 13.8 9 19.2 10.8 13.8 12.6 12 18 10.2 12.6 4.8 10.8 10.2 9z"/><path d="M18.4 16.4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  lock: '<rect x="5.2" y="10.4" width="13.6" height="9.4" rx="2.4"/><path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4"/>',
  settings: '<circle cx="12" cy="12" r="2.9"/><path d="M12 3.4v2.2M12 18.4v2.2M20.6 12h-2.2M5.6 12H3.4M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M18.1 18.1l-1.6-1.6M7.5 7.5 5.9 5.9"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11.2v5M12 8.2v.1"/>',
  phone: '<path d="M6.2 4.6h3.1l1.6 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.6v3.1a1.6 1.6 0 0 1-1.8 1.6C11.4 18.7 5.3 12.6 4.6 6.4a1.6 1.6 0 0 1 1.6-1.8z"/>',
  instagram: '<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.6"/><circle cx="12" cy="12" r="3.7"/><circle cx="16.6" cy="7.4" r=".9" fill="currentColor" stroke="none"/>',
  bell: '<path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.6 1.6 5.6H5s1.6-1.6 1.6-5.6z"/><path d="M10.2 18.8a2 2 0 0 0 3.6 0"/>',
  grid: '<rect x="4.2" y="4.2" width="6.4" height="6.4" rx="1.8"/><rect x="13.4" y="4.2" width="6.4" height="6.4" rx="1.8"/><rect x="4.2" y="13.4" width="6.4" height="6.4" rx="1.8"/><rect x="13.4" y="13.4" width="6.4" height="6.4" rx="1.8"/>',
  wallet: '<rect x="3.6" y="6.2" width="16.8" height="12.4" rx="2.6"/><path d="M3.6 10.4h16.8"/><circle cx="16.4" cy="14.4" r="1.2" fill="currentColor" stroke="none"/>',
  edit: '<path d="M15.6 4.8 19.2 8.4 8.6 19H5v-3.6z"/>',
  logout: '<path d="M14.4 7.6V5.8a1.6 1.6 0 0 0-1.6-1.6H6.2a1.6 1.6 0 0 0-1.6 1.6v12.4a1.6 1.6 0 0 0 1.6 1.6h6.6a1.6 1.6 0 0 0 1.6-1.6v-1.8"/><path d="M10.2 12h9.2M16.4 8.8 19.6 12l-3.2 3.2"/>',
  star: '<path d="m12 4.4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
  camera: '<rect x="3.6" y="7" width="16.8" height="12.4" rx="2.8"/><circle cx="12" cy="13.2" r="3.4"/><path d="M8.6 7l1.2-2.4h4.4L15.4 7"/>',
  play: '<path d="M8.4 5.8 18 12l-9.6 6.2z"/>',
  download: '<path d="M12 4.4v10.2M8.2 11l3.8 3.6 3.8-3.6"/><path d="M4.8 17.2v1.4a1.6 1.6 0 0 0 1.6 1.6h11.2a1.6 1.6 0 0 0 1.6-1.6v-1.4"/>',
};

export function icon(name, size = 20, extra = '') {
  const d = P[name] || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
}
export const hasIcon = (n) => n in P;
