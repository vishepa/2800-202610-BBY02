/**
 * build-isochrones/index.js
 *
 * For every transit stop and geocoded food asset, requests 5/10/15-minute
 * isochrones from a local ORS instance and stores the polygons
 * in the isochrones table.
 *
 * Usage:
 *   node index.js                                # process everything (foot-walking)
 *   node index.js --source-type=transit_stop     # only transit stops
 *   node index.js --source-type=food_asset       # only food assets
 *   node index.js --profile=driving-car          # driving isochrones
 *   node index.js --limit=10                     # smoke test with 10 features
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const pLimit = require('p-limit');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ORS_URL = process.env.ORS_URL || 'http://localhost:8080';
const CONCURRENCY = 6;
const RANGES = [300, 600, 900]; // 5, 10, 15 minutes in seconds
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

// CLI flags
const SOURCE_TYPE_FLAG = process.argv.find(a => a.startsWith('--source-type='));
const SOURCE_TYPE = SOURCE_TYPE_FLAG ? SOURCE_TYPE_FLAG.split('=')[1] : null;
const PROFILE_FLAG = process.argv.find(a => a.startsWith('--profile='));
const PROFILE = PROFILE_FLAG ? PROFILE_FLAG.split('=')[1] : 'foot-walking';
const LIMIT_FLAG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_FLAG ? parseInt(LIMIT_FLAG.split('=')[1], 10) : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch isochrones from ORS for a single [lon, lat] point.
 * Returns an array of { range_seconds, geojson } objects.
 * Retries on 5xx / network errors with exponential backoff.
 */
async function fetchIsochrones(lon, lat, retries = 0) {
  const body = {
    locations: [[lon, lat]],
    range: RANGES,
    range_type: 'time',
  };

  const res = await fetch(
    `${ORS_URL}/ors/v2/isochrones/${PROFILE}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  // Handle specific ORS errors
  if (res.status === 404 || res.status === 400) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || errBody?.message || res.statusText;
    // PointNotFound or similar — un-routable location, don't retry
    return { error: msg };
  }

  // Retry on 5xx or network issues
  if (!res.ok) {
    if (retries < MAX_RETRIES) {
      const delay = RETRY_BASE_MS * Math.pow(2, retries);
      await sleep(delay);
      return fetchIsochrones(lon, lat, retries + 1);
    }
    return { error: `HTTP ${res.status} after ${MAX_RETRIES} retries` };
  }

  const data = await res.json();

  // Map each feature by properties.value (not array index)
  const results = data.features.map(feature => ({
    range_seconds: feature.properties.value,
    geojson: JSON.stringify(feature.geometry),
  }));

  return { results };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query('SELECT 1');
  console.log('Connected to database.');
  console.log(`Profile: ${PROFILE}`);
  console.log(`ORS URL: ${ORS_URL}\n`);

  // -----------------------------------------------------------------------
  // 1. Build the list of features to process
  // -----------------------------------------------------------------------
  let sourceQuery = `
    SELECT 'transit_stop' AS source_type, stop_id AS source_id, stop_lon AS lon, stop_lat AS lat
    FROM transit_stops
    UNION ALL
    SELECT 'food_asset', id::text, lon, lat
    FROM food_assets
    WHERE lat IS NOT NULL AND lon IS NOT NULL
  `;

  if (SOURCE_TYPE === 'transit_stop') {
    sourceQuery = `
      SELECT 'transit_stop' AS source_type, stop_id AS source_id, stop_lon AS lon, stop_lat AS lat
      FROM transit_stops
    `;
  } else if (SOURCE_TYPE === 'food_asset') {
    sourceQuery = `
      SELECT 'food_asset' AS source_type, id::text AS source_id, lon, lat
      FROM food_assets
      WHERE lat IS NOT NULL AND lon IS NOT NULL
    `;
  }

  if (LIMIT) {
    sourceQuery += ` LIMIT ${LIMIT}`;
  }

  const { rows: features } = await pool.query(sourceQuery);
  console.log(`Found ${features.length} features to process.`);

  // -----------------------------------------------------------------------
  // 2. Filter out features that already have all 3 isochrone rows
  // -----------------------------------------------------------------------
  const toProcess = [];

  for (const feature of features) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM isochrones
       WHERE source_type = $1 AND source_id = $2 AND profile = $3`,
      [feature.source_type, feature.source_id, PROFILE]
    );
    const existing = parseInt(rows[0].count, 10);
    if (existing < 3) {
      toProcess.push(feature);
    }
  }

  console.log(`Skipping ${features.length - toProcess.length} already-complete features.`);
  console.log(`Processing ${toProcess.length} features.\n`);

  if (toProcess.length === 0) {
    console.log('Nothing to do.');
    await pool.end();
    return;
  }

  // -----------------------------------------------------------------------
  // 3. Process with bounded concurrency
  // -----------------------------------------------------------------------
  const limit = pLimit(CONCURRENCY);
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const failures = [];

  const tasks = toProcess.map(feature =>
    limit(async () => {
      const result = await fetchIsochrones(feature.lon, feature.lat);

      if (result.error) {
        failed++;
        failures.push({
          source_type: feature.source_type,
          source_id: feature.source_id,
          reason: result.error,
        });
      } else {
        // Insert each polygon
        for (const iso of result.results) {
          await pool.query(
            `INSERT INTO isochrones (source_type, source_id, profile, range_seconds, geom)
             VALUES ($1, $2, $3, $4, ST_GeomFromGeoJSON($5)::geography)
             ON CONFLICT (source_type, source_id, profile, range_seconds) DO NOTHING`,
            [feature.source_type, feature.source_id, PROFILE, iso.range_seconds, iso.geojson]
          );
        }
        succeeded++;
      }

      completed++;

      // Progress every 100 features
      if (completed % 100 === 0 || completed === toProcess.length) {
        const pct = ((completed / toProcess.length) * 100).toFixed(1);
        console.log(
          `  [${completed} / ${toProcess.length}] (${pct}%) succeeded: ${succeeded}, failed: ${failed}`
        );
      }
    })
  );

  await Promise.all(tasks);

  // -----------------------------------------------------------------------
  // 4. Summary
  // -----------------------------------------------------------------------
  console.log(`\nIngest complete.`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    console.log(`\nFailed features:`);
    failures.forEach(f => {
      console.log(`  [${f.source_type} ${f.source_id}] ${f.reason}`);
    });
  }

  // Final DB counts
  const { rows: counts } = await pool.query(`
    SELECT source_type, range_seconds, COUNT(*) AS polygons
    FROM isochrones
    GROUP BY source_type, range_seconds
    ORDER BY source_type, range_seconds
  `);

  console.log(`\nIsochrones table:`);
  counts.forEach(r => {
    console.log(`  ${r.source_type} @ ${r.range_seconds}s: ${r.polygons} polygons`);
  });

  const { rows: total } = await pool.query('SELECT COUNT(*) FROM isochrones');
  console.log(`  Total: ${total[0].count} polygons`);

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
