// Heatmap Heritage easter egg — colour helpers.
//
// Repaints the existing dissemination-area polygons in a 1974 Vancouver
// zoning-map palette when the easter egg is on. Each DA gets a stable
// colour from its dauid, so the same neighbourhood is always the same
// zone across renders / sessions, and the city-wide distribution matches
// the weights below (yellow-dominant, with smaller pockets of orange,
// dusty blue, magenta, brick red, purple, and warm grey).

// RGB tuples sampled from the 1974 City-of-Vancouver Planning Department
// zoning map (the reference image saved alongside this file's planning doc).
export const HERITAGE_PALETTE = {
  residential:   [232, 201, 122],  // mustard yellow — dominant
  commercial:    [217, 120,  67],  // burnt orange — arterials / mixed
  institutional: [122, 152, 184],  // dusty steel blue — civic / schools
  downtown:      [168,  80, 135],  // magenta / dusty pink — downtown core
  industrial:    [176,  69,  64],  // brick red — industrial pockets
  special:       [ 99,  65, 128],  // purple — specialty / small clusters
  transitional:  [138, 138, 138],  // warm grey — transitional zones
};

// Stable string hash → unsigned int. djb2-ish; we only need it to be
// deterministic and well-distributed across the zone buckets below.
function hashCoord(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Proportions tuned to match the reference map's feel: yellow blankets
// most of the city, with smaller pockets of every other zone.
const ZONE_BUCKETS = [
  { name: 'residential',   weight: 0.50 },
  { name: 'commercial',    weight: 0.15 },
  { name: 'institutional', weight: 0.10 },
  { name: 'industrial',    weight: 0.08 },
  { name: 'downtown',      weight: 0.07 },
  { name: 'special',       weight: 0.05 },
  { name: 'transitional',  weight: 0.05 },
];

function pickZone(seed) {
  const r = (hashCoord(seed) % 1000) / 1000; // [0, 1)
  let acc = 0;
  for (const b of ZONE_BUCKETS) {
    acc += b.weight;
    if (r < acc) return b.name;
  }
  return 'residential';
}

/**
 * Deterministic 1974 zone colour for a given dauid. Same DA always lands
 * on the same colour, and the city-wide distribution matches ZONE_BUCKETS.
 * Returned as `[r, g, b, alpha]` ready for deck.gl `getFillColor`.
 */
export function getDAZoneColor(dauid, alpha = 200) {
  const zone = pickZone(String(dauid ?? ''));
  const [r, g, b] = HERITAGE_PALETTE[zone];
  return [r, g, b, alpha];
}
