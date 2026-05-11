import { createReadStream } from 'fs';
import { from as copyFrom } from 'pg-copy-streams';
import pg from 'pg';
import 'dotenv/config';

console.log('Script started');

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Stream a CSV file into a Postgres table using COPY.
 * The columns array must match the CSV's column order exactly.
 */
async function loadCsv(tableName, filePath, columns) {
  const client = await pool.connect();
  console.log(`Loading ${tableName} from ${filePath}...`);
  const start = Date.now();

  try {
    const sql = `COPY ${tableName} (${columns.join(', ')}) FROM STDIN CSV HEADER`;
    const stream = client.query(copyFrom(sql));
    const fileStream = createReadStream(filePath);

    await new Promise((resolve, reject) => {
      fileStream.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', resolve);
      fileStream.pipe(stream);
    });

    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✓ Loaded ${tableName} in ${seconds}s`);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // Order matters: routes before trips (FK dependency).
    // stop_times has no FKs but we'll load it last anyway since it's biggest.

    await loadCsv('routes', './gtfs/routes.txt', [
      'route_id', 'agency_id', 'route_short_name', 'route_long_name',
      'route_desc', 'route_type', 'route_url', 'route_color', 'route_text_color',
    ]);

    await loadCsv('trips', './gtfs/trips.txt', [
      'route_id', 'service_id', 'trip_id', 'trip_headsign', 'trip_short_name',
      'direction_id', 'block_id', 'shape_id', 'wheelchair_accessible', 'bikes_allowed',
    ]);

    await loadCsv('stop_times', './gtfs/stop_times.txt', [
      'trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence',
      'stop_headsign', 'pickup_type', 'drop_off_type', 'shape_dist_traveled', 'timepoint',
    ]);

    console.log('\nAll done.');
  } catch (err) {
    console.error('\nLoad failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();