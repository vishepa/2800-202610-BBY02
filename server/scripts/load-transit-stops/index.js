/**
 * load-transit-stops/index.js
 *
 * Reads TransLink's GTFS zip, extracts stops.txt,
 * and bulk-inserts every stop into the transit_stops table.
 *
 * Usage:
 *   node index.js                        # expects google_transit.zip in this folder
 *   node index.js path/to/gtfs.zip       # or pass a custom path
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const AdmZip = require('adm-zip');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GTFS_PATH = process.argv[2] || path.join(__dirname, 'google_transit.zip');
const BATCH_SIZE = 100; // rows per INSERT statement

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1. Extract stops.txt from the GTFS zip
  console.log(`\nReading GTFS zip: ${GTFS_PATH}`);
  const zip = new AdmZip(GTFS_PATH);
  const stopsEntry = zip.getEntry('stops.txt');

  if (!stopsEntry) {
    console.error('ERROR: stops.txt not found inside the zip.');
    process.exit(1);
  }

  const stopsCSV = stopsEntry.getData().toString('utf-8');
  const stops = parse(stopsCSV, { columns: true, skip_empty_lines: true });
  console.log(`Parsed ${stops.length} stops from stops.txt`);

  // 2. Connect to Supabase PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Quick connectivity check
  const testResult = await pool.query('SELECT 1');
  console.log('Connected to database.\n');

  // 3. Insert in batches using multi-row VALUES + ON CONFLICT skip
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < stops.length; i += BATCH_SIZE) {
    const batch = stops.slice(i, i + BATCH_SIZE);
    const values = [];
    const params = [];

    batch.forEach((stop, idx) => {
      const offset = idx * 4;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
      params.push(
        stop.stop_id,
        stop.stop_name,
        parseFloat(stop.stop_lat),
        parseFloat(stop.stop_lon)
      );
    });

    const query = `
      INSERT INTO transit_stops (stop_id, stop_name, stop_lat, stop_lon)
      VALUES ${values.join(', ')}
      ON CONFLICT (stop_id) DO NOTHING
    `;

    const result = await pool.query(query, params);
    inserted += result.rowCount;
    skipped += batch.length - result.rowCount;

    // Progress log every 500 rows
    const processed = Math.min(i + BATCH_SIZE, stops.length);
    if (processed % 500 < BATCH_SIZE || processed === stops.length) {
      console.log(`  [${processed} / ${stops.length}] inserted: ${inserted}, skipped: ${skipped}`);
    }
  }

  // 4. Final summary
  console.log(`\nDone.`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicates): ${skipped}`);

  const countResult = await pool.query('SELECT COUNT(*) FROM transit_stops');
  console.log(`  Total rows in transit_stops: ${countResult.rows[0].count}\n`);

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
