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

// Visual amplification for sim deltas before the V3 percentile rerank.
// V3's percentile rank is deliberately outlier-resistant — in dense
// neighborhoods a single hypothetical supermarket only nudges raw_da_score
// by ~10 against a baseline of 30-80, so the touched DA often doesn't
// even cross into the next 1-10 bucket and the color appears unchanged.
// Multiplying the sim delta lets a single placed asset produce a clear,
// visible bump while keeping the underlying V3 algorithm intact. This is
// a planning-tool concession, not a real-world claim — one placed
// supermarket in the UI ≈ N real supermarkets' worth of raw contribution.
// Tune up for stronger feedback, down for subtler. 5 is a good middle.
const SIM_DELTA_AMPLIFY = 8;

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
 * FeatureCollection with updated `normalized_da_score` values. Mirrors the V3
 * SQL pipeline (scripts/daScoreSQLV3.sql) end-to-end so the sim view matches
 * what the DB would compute if those assets actually existed:
 *
 *   1. sim_delta per DA = Σ over placed assets of
 *        fa_score(category) × tier_multiplier(asset_tier, DA_context)
 *                            × coverage_fraction(asset_buffer, DA)
 *      (computeSimDeltas — mirrors V3 raw_score sum at SQL:113-126, with a
 *       circular buffer standing in for the real walk isochrone since placed
 *       assets are hypothetical and have no precomputed isochrone)
 *
 *   2. simulated_raw_da_score = baseline raw_da_score + sim_delta
 *
 *   3. normalized_da_score = ROUND(1 + PERCENT_RANK(simulated_raw) × 9)
 *      across all DAs (rerankByPercentile — mirrors V3 normalization at
 *      SQL:142-151)
 *
 * Pure client-side. The DB is never written; `baselineFC` is not mutated.
 *
 * When `placedAssets` is empty and `scoreWeights` are at defaults, every DA's
 * sim_delta is zero, the percentile rerank reproduces V3's normalized scores
 * exactly, and the output is visually identical to baseline — Sim view
 * matches Map view.
 *
 * @param {object} baselineFC GeoJSON FC from /api/dissemination-areas
 * @param {Array<{category,lat,lng}>} placedAssets hypothetical assets
 * @param {{incomeWeight,programWeight}} scoreWeights user-tunable weights
 * @param {number} isochroneMinutes plumbed through; currently unused in the
 *   V3 fidelity path (walk_*_score columns are not consumed). The slider's
 *   value flows in so a future iteration can hook it up without changing
 *   the signature.
 * @returns {object} new FeatureCollection (mutates only the copies)
 */
export function applySimulation(baselineFC, placedAssets, scoreWeights, isochroneMinutes) {
  if (!baselineFC?.features?.length) return baselineFC;

  const weights = scoreWeights ?? { incomeWeight: 1, programWeight: 1 };
  const slidersTouched =
    weights.incomeWeight !== 1 || weights.programWeight !== 1;
  const hasAssets = (placedAssets?.length ?? 0) > 0;

  // Defense in depth — MapPage already gates the call via hasActiveSim, but
  // if nothing's active there's no work to do.
  if (!hasAssets && !slidersTouched) return baselineFC;

  // Pass 1: per-DA sim delta in V3 raw-score units.
  const features = hasAssets
    ? computeSimDeltas(baselineFC.features, placedAssets)
    : baselineFC.features.map(f => ({ ...f, properties: { ...f.properties, sim_delta: 0 } }));

  // Pass 2: percentile-rank simulated_raw across all DAs → 1–10.
  rerankByPercentile(features);

  // Pass 3 (optional): weight-slider shift on top of the re-ranked score.
  // V3 itself has no user-controllable weights — the SQL bakes default
  // retail/program multipliers into raw_da_score. Slider movement here is a
  // post-hoc approximation: it can't retroactively rebuild raw_da_score from
  // component assets (we don't have that data client-side), so it nudges the
  // final normalized score. At default sliders the math is identity, so we
  // skip the loop entirely to keep the no-slider case bit-identical.
  if (slidersTouched) {
    for (const f of features) {
      f.properties.normalized_da_score = computeWeightedScore(f.properties, weights);
    }
  }

  void isochroneMinutes; // plumbed through; see JSDoc

  return { ...baselineFC, features };
}

/**
 * Compute simulated_raw_da_score per feature (baseline_raw + sim_delta) and
 * assign normalized_da_score by percentile rank across the dataset. Mirrors
 *   ROUND(1 + PERCENT_RANK() OVER (ORDER BY raw_da_score ASC) * 9)::INT
 * from scripts/daScoreSQLV3.sql:142-151. Ties get the same percent rank
 * (matches PostgreSQL PERCENT_RANK semantics: rank = min rank in tie group).
 *
 * Mutates each feature's `properties.normalized_da_score` in place. Features
 * are already fresh copies coming from computeSimDeltas / the no-assets
 * spread, so the original baselineFC is untouched.
 */
function rerankByPercentile(features) {
  const n = features.length;
  if (n === 0) return;

  for (const f of features) {
    const baseRaw = f.properties.raw_da_score ?? 0;
    const delta = f.properties.sim_delta ?? 0;
    f.properties.simulated_raw_da_score = baseRaw + delta * SIM_DELTA_AMPLIFY;
  }

  // Sort ascending by simulated_raw. .slice() shares feature references with
  // the input array, so writes below land on the same objects.
  const sorted = features.slice().sort(
    (a, b) => a.properties.simulated_raw_da_score - b.properties.simulated_raw_da_score
  );

  // Walk sorted runs of equal raw scores, assigning each run the PostgreSQL
  // PERCENT_RANK = i/(n-1) where i is the first index of the run.
  let i = 0;
  while (i < n) {
    const v = sorted[i].properties.simulated_raw_da_score;
    let j = i;
    while (j < n && sorted[j].properties.simulated_raw_da_score === v) j++;
    const pctRank = n > 1 ? i / (n - 1) : 0;
    const score = Math.round(1 + pctRank * 9);
    for (let k = i; k < j; k++) {
      sorted[k].properties.normalized_da_score = score;
    }
    i = j;
  }
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