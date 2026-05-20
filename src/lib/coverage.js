
import { buffer } from '@turf/buffer';
import { bbox } from '@turf/bbox';
import { FOOD_CATEGORY_IDS } from '../constants/foodCategories';

export const COVERAGE_BUFFER_KM = 0.4;
const COVERAGE_BUFFER_M = COVERAGE_BUFFER_KM * 1000;
const COVERAGE_BUFFER_M_SQ = COVERAGE_BUFFER_M * COVERAGE_BUFFER_M;

// Equirectangular projection anchored on Vancouver. Linearizes lng/lat to
// metres with <1% distortion over the city extent — well inside the 400m
// tolerance the coverage view paints with.
const PROJ_CENTER_LAT = 49.28;
const METERS_PER_DEG_LAT = 110540;
const METERS_PER_DEG_LNG =
  METERS_PER_DEG_LAT * Math.cos((PROJ_CENTER_LAT * Math.PI) / 180);

// Cell size = buffer radius means "any asset within 400m" needs only a
// 3×3 neighbourhood scan around the sample's cell.
const GRID_CELL_M = COVERAGE_BUFFER_M;

// 8×8 sample grid per DA (≤ 64 PIP checks per DA, ~30 interior samples
// for a typical Vancouver DA). 
const SAMPLES_PER_AXIS = 8;

/**
 * Per-asset 400m walking rings. Used purely for the translucent blue
 * disc layer;
 */
export function buildAssetBuffers(foodFC) {
  const features = foodFC?.features ?? [];
  const buffers = [];
  for (const f of features) {
    if (!f.geometry?.coordinates) continue;
    if (!FOOD_CATEGORY_IDS.includes(f.properties?.category)) continue;
    const buf = buffer(f, COVERAGE_BUFFER_KM, { units: 'kilometers' });
    if (!buf) continue;
    buf.properties = { ...(f.properties ?? {}) };
    buffers.push(buf);
  }
  return buffers;
}

function projectLng(lng) {
  return lng * METERS_PER_DEG_LNG;
}
function projectLat(lat) {
  return lat * METERS_PER_DEG_LAT;
}

// Spatial grid: Map<"cx,cy", [px, py][]>. Built once per applyCoverage()
// call; each cell holds the projected asset coords that fall in it.
function buildAssetGrid(projectedCoords) {
  const grid = new Map();
  for (let i = 0; i < projectedCoords.length; i++) {
    const [x, y] = projectedCoords[i];
    const cx = Math.floor(x / GRID_CELL_M);
    const cy = Math.floor(y / GRID_CELL_M);
    const key = cx * 100000 + cy;        // int key beats string concat
    const bucket = grid.get(key);
    if (bucket) bucket.push(x, y);
    else grid.set(key, [x, y]);
  }
  return grid;
}

// "Is (px, py) within COVERAGE_BUFFER_M of any indexed asset?" Scans the
// 3×3 cell neighbourhood — enough because cell size == buffer radius.
function anyAssetWithin(px, py, grid) {
  const cx = Math.floor(px / GRID_CELL_M);
  const cy = Math.floor(py / GRID_CELL_M);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const bucket = grid.get((cx + dx) * 100000 + (cy + dy));
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i += 2) {
        const ddx = bucket[i] - px;
        const ddy = bucket[i + 1] - py;
        if (ddx * ddx + ddy * ddy <= COVERAGE_BUFFER_M_SQ) return true;
      }
    }
  }
  return false;
}

// Inline ray-cast point-in-polygon.
function ringContains(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (
      ((yi > lat) !== (yj > lat)) &&
      (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonContains(lng, lat, rings) {
  if (!rings.length || !ringContains(lng, lat, rings[0])) return false;
  // Holes: inside outer ring but inside an inner ring → outside.
  for (let i = 1; i < rings.length; i++) {
    if (ringContains(lng, lat, rings[i])) return false;
  }
  return true;
}

function pointInGeometry(lng, lat, geometry) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    return polygonContains(lng, lat, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      if (polygonContains(lng, lat, poly)) return true;
    }
  }
  return false;
}

/**
 * Annotates each DA with `coverage_ratio ∈ [0, 1]` — the fraction of
 * sampled interior points within COVERAGE_BUFFER_M of any food asset.
 */
export function applyCoverage(daFC, foodFC) {
  if (!daFC?.features?.length) return daFC;

  // Project & index every recognized food asset point.
  const features = foodFC?.features ?? [];
  const projected = [];
  for (const f of features) {
    if (!f.geometry?.coordinates) continue;
    if (!FOOD_CATEGORY_IDS.includes(f.properties?.category)) continue;
    const [lng, lat] = f.geometry.coordinates;
    projected.push([projectLng(lng), projectLat(lat)]);
  }

  // No assets → every DA reads as a food desert. Still annotate so the
  // layer can paint solid red instead of falling back to baseline colours.
  if (!projected.length) {
    return {
      ...daFC,
      features: daFC.features.map(f => ({
        ...f,
        properties: { ...(f.properties ?? {}), coverage_ratio: 0 },
      })),
    };
  }

  const grid = buildAssetGrid(projected);

  const outFeatures = daFC.features.map(f => {
    if (!f.geometry) {
      return { ...f, properties: { ...(f.properties ?? {}), coverage_ratio: 0 } };
    }

    const [minX, minY, maxX, maxY] = bbox(f);
    const stepX = (maxX - minX) / SAMPLES_PER_AXIS;
    const stepY = (maxY - minY) / SAMPLES_PER_AXIS;

    let inside = 0;
    let covered = 0;
    for (let i = 0; i < SAMPLES_PER_AXIS; i++) {
      const lng = minX + (i + 0.5) * stepX;
      const px = projectLng(lng);
      for (let j = 0; j < SAMPLES_PER_AXIS; j++) {
        const lat = minY + (j + 0.5) * stepY;
        if (!pointInGeometry(lng, lat, f.geometry)) continue;
        inside++;
        if (anyAssetWithin(px, projectLat(lat), grid)) covered++;
      }
    }

    // Edge case: a DA so small the 8×8 grid skipped every cell. Fall
    // back to the centroid so we still produce a defensible colour.
    let ratio;
    if (inside === 0) {
      const cLng = (minX + maxX) / 2;
      const cLat = (minY + maxY) / 2;
      ratio = anyAssetWithin(projectLng(cLng), projectLat(cLat), grid) ? 1 : 0;
    } else {
      ratio = covered / inside;
    }

    return {
      ...f,
      properties: { ...(f.properties ?? {}), coverage_ratio: ratio },
    };
  });

  return { ...daFC, features: outFeatures };
}
