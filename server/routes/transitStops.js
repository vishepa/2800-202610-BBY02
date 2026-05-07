import { Router } from 'express'
import { query } from '../databaseConnection.js'

const router = Router()

router.get('/', async (req, res) => {
  const { routes, search } = req.query;

  // routes may come in as ?routes=99B&routes=41 -> array, or single string -> wrap it
  const routesArray = routes
    ? Array.isArray(routes) ? routes : [routes]
    : null;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(
        json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
              'stop_id', stop_id,
              'name', stop_name,
              'routes', routes
            )
          )
        ),
        '[]'::json
      )
    ) AS geojson
    FROM transit_stops
    WHERE
      geom IS NOT NULL
      AND ($1::text[] IS NULL OR routes && $1::text[])
      AND ($2::text IS NULL OR stop_name ILIKE '%' || $2 || '%')
  `, [routesArray, search ?? null])

  res.json(rows[0].geojson)
})

export default router;