import { Router } from 'express'
import { query } from '../databaseConnection.js'

const router = Router();

router.get('/', async (req, res) => {
  const { categories, search } = req.query;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'id', id,
            'name', name,
            'category', category,
            'address', address
          )
        )
      )
    ) AS geojson
    FROM food_assets
    WHERE
      geom IS NOT NULL
      AND ($1::text[] IS NULL OR category = ANY($1::text[]))
      AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%' OR address ILIKE '%' || $2 || '%')
  `, [categories ?? null, search ?? null])

  res.json(rows[0].geojson);
})

export default router;