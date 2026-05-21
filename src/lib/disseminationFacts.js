
import { useMemo } from 'react';
import { useDisseminationAreas } from './hooks/useDisseminationAreas';

// Each entry is one superlative. The DA that "wins" the extracted value
// gets tagged with this fact. `descriptor` formats the winning value for display;
// raw_da_score is continuous from PostGIS,
// so its extremes are typically unique.
const FACT_DEFS = [
  {
    key: 'biggestArea',
    emoji: '🏞️',
    title: 'Largest area in Vancouver',
    extract: f => f.properties?.da_area_m2,
    describe: v =>
      v >= 1e6
        ? `${(v / 1e6).toFixed(2)} km²`
        : `${Math.round(v).toLocaleString()} m²`,
    direction: 'max',
  },
  {
    key: 'smallestArea',
    emoji: '🔬',
    title: 'Smallest area in Vancouver',
    extract: f => f.properties?.da_area_m2,
    describe: v => `${Math.round(v).toLocaleString()} m²`,
    direction: 'min',
  },
  {
    key: 'wealthiest',
    emoji: '💰',
    title: 'Wealthiest neighbourhood',
    extract: f => f.properties?.median_household_income,
    describe: v => `Median income $${Number(v).toLocaleString()}`,
    direction: 'max',
  },
  {
    key: 'lowestIncome',
    emoji: '📉',
    title: 'Lowest median income in the city',
    extract: f => f.properties?.median_household_income,
    describe: v => `Median income $${Number(v).toLocaleString()}`,
    direction: 'min',
  },
  {
    key: 'densest',
    emoji: '🏙️',
    title: 'Most densely populated area',
    extract: f => f.properties?.population_density_per_km2,
    describe: v => `${Math.round(Number(v)).toLocaleString()} people / km²`,
    direction: 'max',
  },
  {
    key: 'transitLoyal',
    emoji: '🚌',
    title: 'Most transit-loyal commute',
    extract: f => f.properties?.pct_commute_transit,
    describe: v => `${Number(v).toFixed(0)}% commute by transit`,
    direction: 'max',
  },
  {
    key: 'mostWalkable',
    emoji: '🚶',
    title: 'Most walkable commute',
    extract: f => f.properties?.pct_commute_walk,
    describe: v => `${Number(v).toFixed(0)}% commute on foot`,
    direction: 'max',
  },
  {
    key: 'biggestHouseholds',
    emoji: '👨‍👩‍👧‍👦',
    title: 'Largest average household',
    extract: f => f.properties?.avg_household_size,
    describe: v => `${Number(v).toFixed(2)} people per home`,
    direction: 'max',
  },
  {
    key: 'bestFoodAccess',
    emoji: '🥗',
    title: 'Best food accessibility in the city',
    extract: f => f.properties?.raw_da_score,
    describe: v => `Raw access score ${Number(v).toFixed(2)}`,
    direction: 'max',
  },
];

// Single-pass winner scan. dauid comes back from PostGIS as a number on
// the wire;
function computeWinners(features) {
  const winners = new Map(); // dauid → Fact[]
  for (const def of FACT_DEFS) {
    let bestVal = null;
    let bestDauid = null;
    for (const f of features) {
      const raw = def.extract(f);
      if (raw == null) continue;
      const num = Number(raw);
      if (!Number.isFinite(num)) continue;
      if (
        bestVal == null ||
        (def.direction === 'max' && num > bestVal) ||
        (def.direction === 'min' && num < bestVal)
      ) {
        bestVal = num;
        bestDauid = f.properties?.dauid;
      }
    }
    if (bestDauid == null) continue;
    const key = String(bestDauid);
    const fact = {
      key: def.key,
      emoji: def.emoji,
      title: def.title,
      value: def.describe(bestVal),
    };
    const list = winners.get(key);
    if (list) list.push(fact);
    else winners.set(key, [fact]);
  }
  return winners;
}

// Per-FC-reference cache. baselineDA is a stable reference from the hook
// until a refetch, so this avoids recomputing on every panel open.
const factsCache = new WeakMap();

export function computeDAFacts(daFC) {
  if (!daFC?.features?.length) return new Map();
  const cached = factsCache.get(daFC);
  if (cached) return cached;
  const winners = computeWinners(daFC.features);
  factsCache.set(daFC, winners);
  return winners;
}

/**
 * Returns the facts (if any) for a given dauid. Empty array means this
 * DA isn't the city-wide winner of any tracked superlative which will be the case for most DAs type scrih.
 */
export function useDAFactsFor(dauid) {
  const { data } = useDisseminationAreas();
  const allFacts = useMemo(() => computeDAFacts(data), [data]);
  if (dauid == null) return [];
  return allFacts.get(String(dauid)) ?? [];
}
