import { Router } from "express";
import { query } from "../databaseConnection.js";
import { generateDASummary, clearCacheEntry } from "../lib/gemini.js";

const router = Router();

router.post('/', async (req, res) => {
    const {dauid, persona = 'resident'} = req.body;

    if (!dauid) {
        return res.status(400).json({error: 'dauid required'});
    }

    try {
        const statsResult = await query(`
            SELECT
                dauid,
                population_density_per_km2,
                avg_household_size,
                median_household_income,
                pct_low_income_lim_at,
                pct_shelter_cost_30pct_plus,
                pct_commute_car,
                pct_commute_transit,
                pct_commute_walk
            FROM dissemination_areas
            WHERE dauid = $1
            `, [dauid]);

        if (statsResult.length === 0) {
            return res.status(404).json({error: 'Dissemination area not found'});
        }

        const stats = statsResult[0];

        // Get nearby food assets via isochrone intersection
        const foodResult = await query(`
            SELECT f.name, f.category, i.range_seconds
            FROM isochrones i
            JOIN food_assets f ON i.source_id::integer = f.id
            WHERE ST_Intersects(
                i.geom,
                (SELECT geom FROM dissemination_areas WHERE dauid = $1)
            )
            ORDER BY i.range_seconds ASC
            `, [dauid]);
        
        res.json({summary, stats});
    } catch (err) {
        console.error('AI summary error:', err);
        res.status(500).json({error: 'Failed to assemble summary data'});
    }
});

export default router;