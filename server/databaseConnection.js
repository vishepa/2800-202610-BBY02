import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

console.log("***CONNECTION STRING***", process.env.DATABASE_URL);

export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}
