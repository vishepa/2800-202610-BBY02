import { buffer } from '@turf/buffer';
import { intersect } from '@turf/intersect';
import { area } from '@turf/area';
import { bbox } from '@turf/bbox';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { featureCollection } from '@turf/helpers';

// ~10-min walk. Stand-in for a real isochrone — keep tunable.
const WALK_BUFFER_KM = 0.8;

// How much one unit of raw simulation delta shifts a DA's 1-10 score.
// Tuned so a single supermarket (fa_score=10) fully covering a DA moves it
// ~2 score steps (10 × 0.2 = 2), and ~5 stacked is enough to flip a red DA
// to dark green. Renormalizing against the dataset min/max instead makes
// the simulation feel inert in dense areas, where the baseline scale is
// already set by dozens of real assets — adding a handful gets lost.
const SIM_NORMALIZED_PER_RAW = 0.2;

// Category → asset score weights. Mirrors get_asset_score() in
// scripts/daScoreSQL.sql — keep the two in sync.
const ASSET_SCORE_BY_CATEGORY = {
  // Core grocery retail
  'Supermarkets': 10,
  'Grocery Stores': 10,
  'Low Cost Grocery and Food Markets': 9,
  'No Cost or Low Cost Grocery Items': 9,
  'Free Grocery Items': 9,
  'Public Markets': 8,

  // Specialty stores
  'Specialty Food Stores': 8,
  'Specialty East Asian Food Stores': 8,
  'Specialty European Food Stores': 8,
  'Specialty Filipino Food Stores': 8,
  'Specialty Halal Food Stores': 8,
  'Specialty Japanese Food Stores': 8,
  'Specialty Latin American Food Stores': 8,
  'Specialty Mediterranean and Middle Eastern Food Stores': 7,
  'Specialty South Asian Food Stores': 8,
  'Small Food Stores': 7,
  'Small Cultural Food Business': 7,

  // Meals
  'Free Meal': 6,
  'Low Cost Meal': 5,
  'Young Adult Free and low cost meals': 5,
  'Youth Free and low cost meals': 5,

  // Pantries / emergency food
  'Free Food Pantries': 4,
  'Free Food Pantries / Community Fridges': 4,
  'Food Shopping and Delivery': 4,
  'Indigenous Food Program': 4,

  // Seasonal / infrequent
  'Mobile or Seasonal Markets': 3,
  "Farmer's Market Coupon Programs": 3,
  'Community Shared Agriculture (CSA)': 3,
  'Food Recovery and Waste Prevention': 3,

  // Skill-building / production
  'Community Kitchen Programs': 2,
  'Food Skills Workshops': 2,
  'Kitchen Access': 2,
  'Youth Community Kitchens': 2,
  'Community Gardens': 2,
  'Community Orchards': 2,
  'Garden Skills and Education': 2,
  'Indigenous Gardens': 2,
  'Other Garden Programs': 2,
  'Seed Libraries': 2,
  'Urban Farms': 2,
  'Urban Forests': 2,
  'Yard Share Programs': 2,

  // Support / infrastructure
  'Commissary Kitchens': 1,
  'Community Centres': 1,
  'Family Place': 1,
  'Food Social Enterprise': 1,
  'Health Centres': 1,
  'Neighbourhood Food Networks': 1,
  'Other Community-based Food Organizations': 1,
  'Religious Organizations': 1,
};

export function getAssetScore(category) {
  return ASSET_SCORE_BY_CATEGORY[category] ?? 0;
}

function bboxesOverlap(a, b) {
  return !(a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]);
}

/**
 * Recompute DA normalized scores with hypothetical placed assets layered on
 * top of the baseline. Pure client-side — never mutates server data.
 *
 * Mirrors Halie's PostGIS pipeline:
 *   raw_da_score += Σ(fa_score × area(DA ∩ asset_buffer)) / area(DA)
 * then renormalizes raw → 1–10 against the new min/max.
 *
 * @param {object} baselineFC GeoJSON FeatureCollection from /api/dissemination-areas
 * @param {Array<{category:string,lat:number,lng:number}>} placedAssets
 * @returns {object} new FeatureCollection (baseline returned unchanged if no assets)
 */
export function applySimulation(baselineFC, placedAssets) {
  if (!baselineFC?.features?.length) return baselineFC;
  if (!placedAssets?.length) return baselineFC;

  const assetBuffers = placedAssets
    .map(a => {
      const fa_score = getAssetScore(a.category);
      if (!fa_score) return null;
      const point = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
        properties: {},
      };
      const buf = buffer(point, WALK_BUFFER_KM, { units: 'kilometers' });
      return { fa_score, point, buf, bbox: bbox(buf) };
    })
    .filter(Boolean);

  if (!assetBuffers.length) return baselineFC;

  // Pass 1: add deltas to raw_da_score, recording new sim_raw value.
  const features = baselineFC.features.map(f => {
    const props = f.properties ?? {};
    const daArea = props.da_area_m2;
    const baseRaw = props.raw_da_score ?? 0;
    let delta = 0;

    if (daArea > 0 && f.geometry) {
      const daBbox = bbox(f);
      for (const { fa_score, point, buf, bbox: bBbox } of assetBuffers) {
        if (!bboxesOverlap(daBbox, bBbox)) continue;

        const inter = intersect(featureCollection([f, buf]));
        if (inter) {
          delta += (fa_score * area(inter)) / daArea;
          continue;
        }

        // intersect (polyclip-ts) returns null when one polygon fully
        // contains the other — which is exactly the DA the user clicked
        // into, since WALK_BUFFER_KM dwarfs a Vancouver DA. Detect via
        // point-in-polygon and treat the DA as fully covered.
        if (booleanPointInPolygon(point, f)) {
          delta += fa_score;
        }
      }
    }

    return {
      ...f,
      properties: {
        ...props,
        baseline_raw_da_score: baseRaw,
        baseline_normalized_da_score: props.normalized_da_score,
        sim_delta: delta,
        sim_raw_da_score: baseRaw + delta,
      },
    };
  });

  // Pass 2: shift each DA's existing normalized score by its delta. Direct
  // additive shift keeps untouched DAs at their baseline color and gives
  // touched DAs a proportional, visible bump.
  for (const f of features) {
    const delta = f.properties.sim_delta;
    const baselineNorm = f.properties.baseline_normalized_da_score;
    if (!Number.isFinite(delta) || delta === 0) continue;
    if (!Number.isFinite(baselineNorm)) continue;
    const shifted = baselineNorm + delta * SIM_NORMALIZED_PER_RAW;
    f.properties.normalized_da_score = Math.max(1, Math.min(10, Math.round(shifted)));
  }

  return { ...baselineFC, features };
}
