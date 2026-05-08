import { Router } from 'express';
import { query } from '../databaseConnection.js';

const router = Router();

router.get('/', async (req, res) => {
  const { source_type, source_id, range_seconds } = req.query;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'id', id,
            'source_type', source_type,
            'source_id', source_id,
            'range_seconds', range_seconds,
            'created_at', created_at
          )
        )
      )
    ) AS geojson
    FROM isochrones
    WHERE ($1::text IS NULL OR source_type = $1::text)
      AND ($2::text IS NULL OR source_id = $2::text)
      AND ($3::integer IS NULL OR range_seconds = $3::integer)
  `, [source_type ?? null, source_id ?? null, range_seconds ?? null]);

  res.json(rows[0].geojson);
})

router.get('/:source_type/:source_id', async (req, res) => {
  const { source_type, source_id } = req.params;
  const { range_seconds } = req.query;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'id', id,
            'source_type', source_type,
            'source_id', source_id,
            'range_seconds', range_seconds,
            'created_at', created_at
          )
        )
      )
    ) AS geojson
    FROM isochrones
    WHERE source_type = $1::text
      AND source_id = $2::text
      AND ($3::integer IS NULL OR range_seconds = $3::integer)
  `, [source_type, source_id, range_seconds ?? null]);

  if (!rows[0].geojson) return res.status(404).json({ error: 'Not found' });

  res.json(rows[0].geojson);
})

export default router;