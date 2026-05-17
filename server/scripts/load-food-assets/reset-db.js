require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query('SELECT 1');
  console.log('Connected to database.');

  const isoResult = await pool.query(
    "DELETE FROM isochrones WHERE source_type = 'food_asset'"
  );
  console.log(`Deleted ${isoResult.rowCount} food_asset isochrones.`);

  const delResult = await pool.query('DELETE FROM food_assets');
  console.log(`Deleted ${delResult.rowCount} rows from food_assets.`);
  await pool.query("ALTER SEQUENCE food_assets_id_seq RESTART WITH 1");
  console.log('Reset ID sequence.');

  const count = await pool.query('SELECT COUNT(*) FROM food_assets');
  console.log(`food_assets count: ${count.rows[0].count}`);

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
