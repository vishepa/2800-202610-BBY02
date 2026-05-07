import { Router } from 'express'
import { query } from '../databaseConnection.js'

const router = Router();

router.get('/', async (req, res) => {
  const { dauid } = req.query;

  const rows = await query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', json_agg(
        json_build_object(
          'type', 'Feature',
          'properties', json_build_object(
            'dauid', dauid,
            'population_density_per_km2', population_density_per_km2,
            'avg_household_size', avg_household_size,
            'median_household_income', median_household_income,
            'pct_low_income_lim_at', pct_low_income_lim_at,
            'pct_shelter_cost_30pct_plus', pct_shelter_cost_30pct_plus,
            'pct_commute_car', pct_commute_car,
            'pct_commute_transit', pct_commute_transit,
            'pct_commute_walk', pct_commute_walk
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