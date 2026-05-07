import { Router } from 'express'
import { query } from '../databaseConnection.js'

const router = Router()

router.get('/', async (req, res) => {
  const { dauid } = req.query;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'dauid', dauid
          )
        )
      )
    ) AS geojson
    FROM dissemination_areas
    WHERE ($1::bigint IS NULL OR dauid = $1::bigint)
  `, [dauid ?? null])

  res.json(rows[0].geojson)
})

export default router;