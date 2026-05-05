/**
 * load-food-assets/index.js
 *
 * Reads the Vancouver Food Asset Map CSV, inserts every record into
 * the food_assets table, then geocodes each address via Nominatim
 * to fill in lat/lon.
 *
 * Usage:
 *   node index.js                                    # expects Vancouver_Food_Asset_Map.csv in this folder
 *   node index.js path/to/file.csv                   # or pass a custom path
 *   node index.js --geocode-only                     # skip insert, just geocode rows with NULL lat
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CSV_PATH = process.argv.find(a => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1])
  || path.join(__dirname, 'Vancouver_Food_Asset_Map.csv');
const GEOCODE_ONLY = process.argv.includes('--geocode-only');
const BATCH_SIZE = 50;
const NOMINATIM_DELAY_MS = 1100; // slightly over 1 sec to respect rate limit
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'vancouver-food-accessibility/0.1 (cadurcpf@gmail.com)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode an address string via Nominatim.
 * Returns { lat, lon } or null if not found.
 */
async function geocode(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'ca',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Quick connectivity check
  await pool.query('SELECT 1');
  console.log('Connected to database.\n');

  // -----------------------------------------------------------------------
  // Step 1: Insert CSV rows (skip if --geocode-only)
  // -----------------------------------------------------------------------
  if (!GEOCODE_ONLY) {
    console.log(`Reading CSV: ${CSV_PATH}`);
    const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    console.log(`Parsed ${records.length} records from CSV\n`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];

      batch.forEach((row, idx) => {
        const offset = idx * 4;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        params.push(
          row.Name || 'Unknown',
          row.Type || row.Category || 'Other',
          row.Address || row.Address_KML || ''
        );
        // Use Address_KML as a cleaner geocoding address if available
        params.push(row.Address_KML || row.Address || '');
      });

      // Insert with a temp "geocode_address" that we use later, stored in address column
      // We store the best available address for geocoding
      const query = `
        INSERT INTO food_assets (name, category, address)
        VALUES ${values.map((v, idx) => {
          const offset = idx * 4;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
        }).join(', ')}
        ON CONFLICT DO NOTHING
      `;

      // Rebuild params without the 4th geocode field — we use address for both
      const insertParams = [];
      batch.forEach((row) => {
        insertParams.push(
          row.Name || 'Unknown',
          row.Type || row.Category || 'Other',
          row.Address_KML || row.Address || ''
        );
      });

      const insertValues = batch.map((_, idx) => {
        const offset = idx * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      });

      const insertQuery = `
        INSERT INTO food_assets (name, category, address)
        VALUES ${insertValues.join(', ')}
      `;

      const result = await pool.query(insertQuery, insertParams);
      inserted += result.rowCount;

      const processed = Math.min(i + BATCH_SIZE, records.length);
      if (processed % 200 < BATCH_SIZE || processed === records.length) {
        console.log(`  [${processed} / ${records.length}] inserted: ${inserted}`);
      }
    }

    console.log(`\nInsert complete. ${inserted} rows added.\n`);
  }

  // -----------------------------------------------------------------------
  // Step 2: Geocode rows that have no lat/lon yet
  // -----------------------------------------------------------------------
  const { rows: toGeocode } = await pool.query(
    `SELECT id, address FROM food_assets WHERE lat IS NULL AND address != '' ORDER BY id`
  );

  if (toGeocode.length === 0) {
    console.log('All rows already geocoded. Nothing to do.');
    const countResult = await pool.query('SELECT COUNT(*) FROM food_assets');
    console.log(`Total rows in food_assets: ${countResult.rows[0].count}`);
    await pool.end();
    return;
  }

  console.log(`Geocoding ${toGeocode.length} addresses via Nominatim...`);
  console.log(`Estimated time: ~${Math.ceil(toGeocode.length * NOMINATIM_DELAY_MS / 60000)} minutes\n`);

  let geocoded = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < toGeocode.length; i++) {
    const row = toGeocode[i];

    try {
      const result = await geocode(row.address);

      if (result) {
        await pool.query(
          'UPDATE food_assets SET lat = $1, lon = $2 WHERE id = $3',
          [result.lat, result.lon, row.id]
        );
        geocoded++;
      } else {
        failed++;
        failures.push({ id: row.id, address: row.address, reason: 'not found' });
      }
    } catch (err) {
      failed++;
      failures.push({ id: row.id, address: row.address, reason: err.message });
    }

    // Progress log every 50 records
    if ((i + 1) % 50 === 0 || i + 1 === toGeocode.length) {
      console.log(`  [${i + 1} / ${toGeocode.length}] geocoded: ${geocoded}, failed: ${failed}`);
    }

    // Rate limit: 1 request per second
    if (i < toGeocode.length - 1) {
      await sleep(NOMINATIM_DELAY_MS);
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Summary
  // -----------------------------------------------------------------------
  console.log(`\nGeocoding complete.`);
  console.log(`  Geocoded: ${geocoded}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    console.log(`\nFailed addresses:`);
    failures.forEach(f => {
      console.log(`  [id ${f.id}] "${f.address}" — ${f.reason}`);
    });
  }

  const countResult = await pool.query('SELECT COUNT(*) FROM food_assets');
  const geocodedCount = await pool.query('SELECT COUNT(*) FROM food_assets WHERE lat IS NOT NULL');
  console.log(`\nTotal rows: ${countResult.rows[0].count}`);
  console.log(`With coordinates: ${geocodedCount.rows[0].count}`);
  console.log(`Without coordinates: ${countResult.rows[0].count - geocodedCount.rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
