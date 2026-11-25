/**
 * Background imagery for LibraSphere.
 *
 * By default each background is generated artwork (rows of book spines) so the app looks rich with
 * zero downloads. To use real photographs instead, drop files into  frontend/public/backgrounds/
 * and set `src`, e.g.  hero: { src: "/backgrounds/reading-room.webp" }.
 * Tips: ~1920px wide, WebP/JPEG under ~300 KB, and make sure you hold the licence.
 */
const SPINES = ["#6D28D9", "#0E9F8E", "#FFB020", "#E0452E", "#2F5BD9", "#C2306B", "#F97316", "#14B8A6"];

export const BACKGROUNDS = {
  hero: { src: null, art: { seed: 7, rows: 6, palette: SPINES } },     // home hero
  auth: { src: null, art: { seed: 21, rows: 9, palette: SPINES } },    // sign-in / join panel
  page: { src: null, art: { seed: 3, rows: 7, palette: SPINES } },     // faint wash behind public pages
  rail: { src: null, art: { seed: 12, rows: 12, palette: SPINES } },   // staff sidebar texture
  banner: { src: null, art: { seed: 33, rows: 5, palette: SPINES } },  // page banners (catalog, my library, today)
};

// small deterministic random generator so the artwork is identical on every load
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function bookshelfArt({ seed, rows, palette, width = 1600, height = 900 }) {
  const r = rng(seed);
  const rowH = height / rows;
  let svg = "";
  for (let row = 0; row < rows; row++) {
    const floor = (row + 1) * rowH;
    let x = -10;
    while (x < width) {
      const w = 16 + r() * 34;
      const h = rowH * (0.52 + r() * 0.4);
      const color = palette[Math.floor(r() * palette.length)];
      svg += `<rect x="${x.toFixed(1)}" y="${(floor - 7 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${color}"/>`;
      svg += `<rect x="${(x + 2).toFixed(1)}" y="${(floor - 7 - h + 8).toFixed(1)}" width="${(w - 4).toFixed(1)}" height="3" fill="#fff" fill-opacity=".22"/>`;
      svg += `<rect x="${(x + 2).toFixed(1)}" y="${(floor - 7 - 14).toFixed(1)}" width="${(w - 4).toFixed(1)}" height="3" fill="#fff" fill-opacity=".14"/>`;
      x += w + (r() < 0.1 ? 8 + r() * 36 : 1.5);
    }
    svg += `<rect x="0" y="${(floor - 7).toFixed(1)}" width="${width}" height="7" fill="#1b0f1d" fill-opacity=".55"/>`;
  }
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice"><rect width="100%" height="100%" fill="#1b0f2e"/>${svg}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(doc)}")`;
}

const cache = new Map();
/** CSS `background-image` value for a named background. */
export function bgImage(name) {
  if (!cache.has(name)) {
    const b = BACKGROUNDS[name];
    cache.set(name, b.src ? `url("${b.src}")` : bookshelfArt(b.art));
  }
  return cache.get(name);
}
