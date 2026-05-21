// One-off: prints the city-wide winner DA for each fact category in
// src/lib/disseminationFacts.js, so we can sanity-check which areas
// will show the "Did you know?" banner.
import 'dotenv/config';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load server/.env explicitly — this script lives in server/scripts/.
const __dirname = dirname(fileURLToPath(import.meta.url));
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const FACTS = [
  { emoji: '🏞️ ', title: 'Largest area',                   col: 'ST_Area(geom::geography)',  dir: 'DESC', fmt: v => `${(v / 1e6).toFixed(2)} km²` },
  { emoji: '🔬',  title: 'Smallest area',                  col: 'ST_Area(geom::geography)',  dir: 'ASC',  fmt: v => `${Math.round(v).toLocaleString()} m²` },
  { emoji: '💰',  title: 'Wealthiest neighbourhood',       col: 'median_household_income',   dir: 'DESC NULLS LAST', fmt: v => `$${Number(v).toLocaleString()}` },
  { emoji: '📉',  title: 'Lowest median income',           col: 'median_household_income',   dir: 'ASC NULLS LAST',  fmt: v => `$${Number(v).toLocaleString()}` },
  { emoji: '🏙️ ', title: 'Most densely populated',         col: 'population_density_per_km2',dir: 'DESC NULLS LAST', fmt: v => `${Math.round(Number(v)).toLocaleString()} ppl/km²` },
  { emoji: '🚌',  title: 'Most transit-loyal',             col: 'pct_commute_transit',       dir: 'DESC NULLS LAST', fmt: v => `${Number(v).toFixed(0)}% transit` },
  { emoji: '🚶',  title: 'Most walkable commute',          col: 'pct_commute_walk',          dir: 'DESC NULLS LAST', fmt: v => `${Number(v).toFixed(0)}% walking` },
  { emoji: '👨‍👩‍👧‍👦', title: 'Largest avg household',         col: 'avg_household_size',        dir: 'DESC NULLS LAST', fmt: v => `${Number(v).toFixed(2)} people/home` },
  { emoji: '🥗',  title: 'Best food accessibility',        col: 'raw_da_score',              dir: 'DESC NULLS LAST', fmt: v => `raw score ${Number(v).toFixed(2)}` },
];

async function main() {
  for (const f of FACTS) {
    const { rows } = await pool.query(`
      SELECT dauid,
             ${f.col} AS val,
             ST_Y(ST_Centroid(geom)) AS lat,
             ST_X(ST_Centroid(geom)) AS lng
      FROM dissemination_areas
      WHERE ${f.col} IS NOT NULL
      ORDER BY ${f.col} ${f.dir}
      LIMIT 1
    `);
    if (!rows.length) { console.log(`${f.emoji}  ${f.title} — no data`); continue; }
    const r = rows[0];
    console.log(`${f.emoji}  ${f.title.padEnd(28)} → dauid ${r.dauid}  (${f.fmt(r.val)})  @ ${Number(r.lat).toFixed(4)}, ${Number(r.lng).toFixed(4)}`);
  }
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
