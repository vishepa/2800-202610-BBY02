import { buffer } from '@turf/buffer';
import { intersect } from '@turf/intersect';
import { area } from '@turf/area';
import { bbox } from '@turf/bbox';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { featureCollection } from '@turf/helpers';

// the sim falls back to a circular
// buffer. 0.4 km tracks the typical ~10-min walk reach in dense Vancouver
// once road constraints are accounted for; the earlier 0.8 km circle
// overstated coverage ~4× and made a single asset visibly recolor much
// of the city.
const WALK_BUFFER_KM = 0.55;

// How many 1-10 score steps one unit of raw sim_delta shifts a DA's display.
// Tuned so a supermarket (fa_score=10) at full coverage of a high-income DA
// (retail tierMult=1.0) lifts the DA by ~2 score steps (10 × 1.0 × 0.2 = 2).
// Stacking 3-5 supermarkets is enough to flip a red DA green. Lower values
// feel inert; higher values make a single asset dominate.
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


const ASSET_TIER_BY_CATEGORY = {
  // Retail: useful primarily to those who can afford it. Multiplier
  // ranges 0.6 (low-income DA) → 1.0 (high-income DA).
  'Supermarkets': 'retail',
  'Grocery Stores': 'retail',
  'Low Cost Grocery and Food Markets': 'retail',
  'Specialty Food Stores': 'retail',
  'Small Food Stores': 'retail',
  'Small Cultural Food Business': 'retail',
  'Public Markets': 'retail',
  'Food Shopping and Delivery': 'retail',

  // Program: most valuable to low-income / food-insecure residents.
  // Multiplier ranges 0.5 (low-hardship DA) → 1.0 (high-hardship DA).
  'No Cost or Low Cost Grocery Items': 'program',
  'Free Grocery Items': 'program',
  'Free Meal': 'program',
  'Low Cost Meal': 'program',
  'Young Adult Free and low cost meals': 'program',
  'Youth Free and low cost meals': 'program',
  'Free Food Pantries': 'program',
  'Free Food Pantries / Community Fridges': 'program',
  // Indigenous Food Program / Mobile or Seasonal Markets / Farmer's Market
  // Coupon Programs are commented out in the V3 SQL as well — fall through
  // to 'neutral' (multiplier 1.0) here for parity.

  // Everything else (community gardens, kitchens, infrastructure, etc.)
  // falls through to 'neutral' via the default in getAssetTier().
};

function getAssetTier(category) {
  return ASSET_TIER_BY_CATEGORY[category] ?? 'neutral';
}

// Per-DA tier multiplier. V3 SQL uses percentile-ranked income/hardship
// across the whole dataset; we use an absolute-scale approximation
// (median income $30k–$150k, % low-income 0–100%) to stay client-only
// without paying for a 944-row percentile rank on every sim. Same
// approximation already present in computeWeightedScore — co-locating it
// here puts the tier dampening where V3 actually applies it (inside the
// raw score sum, not after normalization).
function tierMultiplierForDA(tier, daProps) {
  if (tier === 'neutral') return 1.0;
  if (tier === 'retail') {
    const income = daProps.median_household_income ?? 75000;
    const incomeIndex = Math.min(Math.max((income - 30000) / 120000, 0), 1);
    return 0.6 + incomeIndex * 0.4; // 0.6–1.0
  }
  // tier === 'program'
  const pctLowIncome = daProps.pct_low_income_lim_at ?? 0;
  const hardshipIndex = Math.min(pctLowIncome / 100, 1);
  return 0.5 + hardshipIndex * 0.5; // 0.5–1.0
}

function bboxesOverlap(a, b) {
  return !(a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]);
}

/**
 * Apply hypothetical placed assets to the baseline DA scores and return a new
 * FeatureCollection with updated `normalized_da_score` values.
 *
 * Mirrors the Map view's coloring logic so Sim view stays visually anchored
 * to it: each DA starts from its precomputed `walk_${isochroneMinutes}min_score`
 * (same column the Map view layer reads), then gets an additive bump from
 * any placed-asset coverage, then the income/program weight sliders nudge
 * it via computeWeightedScore. No global percentile rerank — untouched DAs
 * keep their iso-baseline color, and a placed asset only recolors the DAs
 * its walk-buffer actually reaches.
 *
 *   1. sim_delta per DA = Σ over placed assets of
 *        fa_score(category) × tier_multiplier(asset_tier, DA_context)
 *                            × coverage_fraction(asset_buffer, DA)
 *      (computeSimDeltas — V3-fidelity raw delta, but consumed per-feature
 *       rather than fed into a global rerank)
 *
 *   2. display_base = iso_score + sim_delta × SIM_NORMALIZED_PER_RAW
 *      (clamped 1-10)
 *
 *   3. normalized_da_score = computeWeightedScore(display_base, weights)
 *
 * Pure client-side. The DB is never written; `baselineFC` is not mutated.
 *
 * When `placedAssets` is empty and weight sliders are at defaults, the
 * function early-returns `baselineFC` unchanged; the layer reads
 * `walk_${N}min_score` directly. Identical paint to Map view.
 *
 * @param {object} baselineFC GeoJSON FC from /api/dissemination-areas
 * @param {Array<{category,lat,lng}>} placedAssets hypothetical assets
 * @param {{incomeWeight,programWeight}} scoreWeights user-tunable weights
 * @param {number} isochroneMinutes 5 / 10 / 15 — picks which precomputed
 *   `walk_${N}min_score` column serves as the per-DA baseline.
 * @returns {object} new FeatureCollection (mutates only the copies)
 */
export function applySimulation(baselineFC, placedAssets, scoreWeights, isochroneMinutes) {
  if (!baselineFC?.features?.length) return baselineFC;

  const weights = scoreWeights ?? { incomeWeight: 1, programWeight: 1 };
  const slidersTouched =
    weights.incomeWeight !== 1 || weights.programWeight !== 1;
  const hasAssets = (placedAssets?.length ?? 0) > 0;

  // Nothing to project. Layer reads the iso column off the baseline data.
  if (!hasAssets && !slidersTouched) return baselineFC;

  // Pass 1: per-DA sim delta in raw-score units (zero for DAs no asset reaches).
  const features = hasAssets
    ? computeSimDeltas(baselineFC.features, placedAssets)
    : baselineFC.features.map(f => ({ ...f, properties: { ...f.properties, sim_delta: 0 } }));

  // Pass 2: per-feature projection. Each DA: iso baseline → bump → weight tweak.
  const isoKey = `walk_${isochroneMinutes}min_score`;
  for (const f of features) {
    const props = f.properties;
    const isoScore = props[isoKey] ?? props.normalized_da_score ?? 5;
    const bumped = isoScore + (props.sim_delta ?? 0) * SIM_NORMALIZED_PER_RAW;
    const clamped = Math.max(1, Math.min(10, bumped));
    props.normalized_da_score = computeWeightedScore(
      { ...props, normalized_da_score: clamped },
      weights,
    );
  }

  return { ...baselineFC, features };
}

/**
 * Recompute a normalized score for a single DA feature using adjustable weights.
 * Called per-feature inside getDisseminationAreaLayer, so it must be fast.
 *
 * @param {object} props - feature.properties from the DA GeoJSON
 * @param {object} weights - { incomeWeight, programWeight }
 *   each in [0, 2], where 1.0 = baseline (no change)
 * @returns {number} adjusted score, clamped to 1–10
 */
export function computeWeightedScore(props, weights) {
  const { incomeWeight = 1, programWeight = 1 } = weights;

  // Base food-proximity score (already normalized 1-10 server-side)
  const base = props.normalized_da_score ?? 5;

  // --- Income adjustment ---
  // income_index isn't in the API, so we approximate from the raw income value.
  // Median income in Vancouver DAs roughly spans $30k–$150k.
  const income = props.median_household_income ?? 75000;
  const incomeIndex = Math.min(Math.max((income - 30000) / 120000, 0), 1);
  // retail_multiplier from your SQL: 0.6 + index * 0.4 → range [0.6, 1.0]
  const baseRetailMult = 0.6 + incomeIndex * 0.4;
  // incomeWeight=1 → no change; <1 → downweight high-income advantage; >1 → amplify
  const incomeFactor = baseRetailMult * incomeWeight;

  // --- Program (food program) adjustment ---
  const pctLowIncome = props.pct_low_income_lim_at ?? 0;
  // hardship_index from your SQL: higher low-income % → higher program multiplier
  const hardshipIndex = Math.min(pctLowIncome / 100, 1);
  const baseProgramMult = 0.5 + hardshipIndex * 0.5; // [0.5, 1.0]
  const programFactor = baseProgramMult * programWeight;

  // Combine: nudge the base score by the weighted factors relative to their baseline
  // Deltas are kept small so sliders feel like tuning, not overriding the food score.
  const incomeDelta   = (incomeFactor   - baseRetailMult)   * 2;
  const programDelta  = (programFactor  - baseProgramMult)  * 2;

  const adjusted = base + incomeDelta + programDelta;
  return Math.max(1, Math.min(10, Math.round(adjusted)));
}

function computeSimDeltas(baseFeatures, placedAssets) {
  const assetBuffers = placedAssets
    .map(a => {
      const fa_score = getAssetScore(a.category);
      if (!fa_score) return null;
      const tier = getAssetTier(a.category);
      const point = { type: 'Feature', geometry: { type: 'Point', coordinates: [a.lng, a.lat] }, properties: {} };
      const buf = buffer(point, WALK_BUFFER_KM, { units: 'kilometers' });
      return { fa_score, tier, point, buf, bbox: bbox(buf) };
    })
    .filter(Boolean);

  if (!assetBuffers.length) return baseFeatures.map(f => ({ ...f, properties: { ...f.properties, sim_delta: 0 } }));

  return baseFeatures.map(f => {
    const props = f.properties ?? {};
    const daArea = props.da_area_m2;
    let delta = 0;
    if (daArea > 0 && f.geometry) {
      const daBbox = bbox(f);
      for (const { fa_score, tier, point, buf, bbox: bBbox } of assetBuffers) {
        if (!bboxesOverlap(daBbox, bBbox)) continue;
        // V3 SQL bakes the retail/program tier multiplier into the raw
        // score sum (scripts/daScoreSQLV3.sql:83-95). Doing the same here
        // means a supermarket placed in a low-income DA gets the same
        // dampening it would have if the DB rebuilt the score from scratch.
        const tierMult = tierMultiplierForDA(tier, props);
        const inter = intersect(featureCollection([f, buf]));
        if (inter) { delta += (fa_score * tierMult * area(inter)) / daArea; continue; }
        // Fallback for buffer fully containing the DA (polyclip-ts returns
        // null on full containment — see comment on bboxesOverlap call site).
        if (booleanPointInPolygon(point, f)) delta += fa_score * tierMult;
      }
    }
    return { ...f, properties: { ...props, sim_delta: delta } };
  });
}