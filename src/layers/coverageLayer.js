import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { FOOD_CATEGORY_IDS } from '../constants/foodCategories';
import { COVERAGE_BUFFER_KM } from '../lib/coverage';

// Red → yellow → green ramp keyed off the coverage_ratio property set by
// applyCoverage(). Below FULL_THRESHOLD the colour interpolates, at or
// above it the DA snaps to solid green. Makes it easier to know which areas are fully covered.
const FULL_THRESHOLD = 0.95;

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function ratioToColor(ratio, alpha) {
  if (!Number.isFinite(ratio) || ratio <= 0) return [200, 50, 50, alpha];
  if (ratio >= FULL_THRESHOLD) return [30, 180, 80, alpha];
  // Two-stop ramp: red (0) → yellow (0.5) → light-green (~0.95).
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    return [lerp(220, 240, t), lerp(60, 200, t), lerp(50, 80, t), alpha];
  }
  const t = (ratio - 0.5) / (FULL_THRESHOLD - 0.5);
  return [lerp(240, 120, t), lerp(200, 210, t), lerp(80, 100, t), alpha];
}

/**
 * Blue circles around food assets representing 400m walkable areas.
 */
export function getCoverageBufferLayer({ foodFC, visible = true } = {}) {
  const features = foodFC?.features ?? [];
  // Match the filter applyCoverage uses so the visible rings can't drift
  // from the rings the calculation actually counted.
  const points = features.filter(
    f => f.geometry?.coordinates && FOOD_CATEGORY_IDS.includes(f.properties?.category),
  );
  if (!points.length) return null;

  return new ScatterplotLayer({
    id: 'coverage-buffers',
    data: points,
    visible,
    getPosition: f => f.geometry.coordinates,
    getRadius: COVERAGE_BUFFER_KM * 1000,
    radiusUnits: 'meters',
    getFillColor: [37, 99, 235, 35],      // blue-600, very translucent
    stroked: true,
    getLineColor: [37, 99, 235, 120],
    lineWidthUnits: 'pixels',
    getLineWidth: 1,
    pickable: false,
  });
}

/**
 * DA polygons recoloured by coverage_ratio. Clicks should still work as normal
 */
export function getCoverageDALayer({ data, visible = true, onClick } = {}) {
  return new GeoJsonLayer({
    id: 'dissemination-areas',           // reuse id so popup wiring matches
    data,
    filled: true,
    getFillColor: f => ratioToColor(f.properties?.coverage_ratio, 170),
    stroked: true,
    getLineColor: [255, 255, 255, 160],
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
    pickable: true,
    visible,
    onClick,
    updateTriggers: {
      getFillColor: [data],
    },
  });
}
