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
          'geometry', ST_AsGeoJSON(fa.geom)::json,
          'properties', json_build_object(
            'id', fa.id,
            'name', fa.name,
            'category', fa.category,
            'address', fa.address,
            'tags', COALESCE(
              (
                SELECT json_agg(fat.tag ORDER BY fat.tag)
                FROM food_asset_tags fat
                WHERE fat.asset_id = fa.id
              ),
              '[]'::json
            )
          )
        )
      )
    ) AS geojson
    FROM food_assets fa
    WHERE
      fa.geom IS NOT NULL
      AND ($1::text[] IS NULL OR fa.category = ANY($1::text[]))
      AND ($2::text IS NULL OR fa.name ILIKE '%' || $2 || '%' OR fa.address ILIKE '%' || $2 || '%')
  `, [categories ?? null, search ?? null])

  res.json(rows[0].geojson);
})

export default router;