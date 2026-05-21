-- ─────────────────────────────────────────────────────────────────────────────
-- Food Accessibility Scoring
--
-- Produces three scores per DA (one per isochrone range: 5/10/15 min walking)
-- that are directly comparable across ranges. A score of 7 at 5 min means
-- the same relative level of access as a 7 at 15 min — both are in the 70th
-- percentile of all DA-range combinations. DAs with zero access are pinned
-- at 0 regardless of percentile.
--
-- Overlap handling: each food asset only gets credit for the portion of DA
-- area not already claimed by a higher-scored asset, so two supermarkets
-- in the same corner of a DA don't inflate the score for the rest of the DA.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS temp_da_context;
DROP TABLE IF EXISTS temp_accessible_food_assets;
DROP TABLE IF EXISTS temp_da_raw_scores;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lookup: category → (base_score, tier)
-- Keeping score and tier co-located avoids silent drift between two functions.
-- Categories commented out are excluded from scoring entirely (score = 0).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_asset_attrs(p_category TEXT)
RETURNS TABLE(base_score FLOAT, tier TEXT) AS $$
BEGIN
    RETURN QUERY SELECT
        -- base_score
        CASE p_category
            -- Retail tier
            WHEN 'Supermarkets'                             THEN 10.0
            WHEN 'Grocery Stores'                           THEN 10.0
            WHEN 'Low Cost Grocery and Food Markets'        THEN  9.0
            WHEN 'Public Markets'                           THEN  8.0
            WHEN 'Specialty Food Stores'                    THEN  8.0
            WHEN 'Small Food Stores'                        THEN  7.0
            WHEN 'Small Cultural Food Business'             THEN  7.0
            -- Program tier
            WHEN 'No Cost or Low Cost Grocery Items'        THEN  9.0
            WHEN 'Free Grocery Items'                       THEN  9.0
            WHEN 'Free Meal'                                THEN  6.0
            WHEN 'Low Cost Meal'                            THEN  5.0
            WHEN 'Young Adult Free and low cost meals'      THEN  5.0
            WHEN 'Youth Free and low cost meals'            THEN  5.0
            WHEN 'Free Food Pantries'                       THEN  4.0
            WHEN 'Free Food Pantries / Community Fridges'   THEN  4.0
            WHEN 'Indigenous Food Program'                  THEN  4.0
            -- Neutral tier
            WHEN 'Mobile or Seasonal Markets'               THEN  3.0
            WHEN 'Community Shared Agriculture (CSA)'       THEN  3.0
            WHEN 'Food Recovery and Waste Prevention'       THEN  3.0
            WHEN 'Community Gardens'                        THEN  2.0
            WHEN 'Community Orchards'                       THEN  2.0
            WHEN 'Indigenous Gardens'                       THEN  2.0
            WHEN 'Other Garden Programs'                    THEN  2.0
            WHEN 'Urban Farms'                              THEN  2.0
            WHEN 'Yard Share Programs'                      THEN  2.0
            WHEN 'Commissary Kitchens'                      THEN  1.0
            WHEN 'Neighbourhood Food Networks'              THEN  1.0
            WHEN 'Other Community-based Food Organizations' THEN  1.0
            -- Excluded categories return 0 and are filtered in Step 2:
            -- 'Food Shopping and Delivery', 'Farmer's Market Coupon Programs',
            -- 'Community Kitchen Programs', 'Food Skills Workshops',
            -- 'Kitchen Access', 'Youth Community Kitchens',
            -- 'Garden Skills and Education', 'Seed Libraries', 'Urban Forests',
            -- 'Community Centres', 'Family Place', 'Food Social Enterprise',
            -- 'Health Centres', 'Religious Organizations'
            ELSE 0.0
        END::FLOAT,
        -- tier
        CASE p_category
            WHEN 'Supermarkets'                             THEN 'retail'
            WHEN 'Grocery Stores'                           THEN 'retail'
            WHEN 'Low Cost Grocery and Food Markets'        THEN 'retail'
            WHEN 'Public Markets'                           THEN 'retail'
            WHEN 'Specialty Food Stores'                    THEN 'retail'
            WHEN 'Small Food Stores'                        THEN 'retail'
            WHEN 'Small Cultural Food Business'             THEN 'retail'
            WHEN 'No Cost or Low Cost Grocery Items'        THEN 'program'
            WHEN 'Free Grocery Items'                       THEN 'program'
            WHEN 'Free Meal'                                THEN 'program'
            WHEN 'Low Cost Meal'                            THEN 'program'
            WHEN 'Young Adult Free and low cost meals'      THEN 'program'
            WHEN 'Youth Free and low cost meals'            THEN 'program'
            WHEN 'Free Food Pantries'                       THEN 'program'
            WHEN 'Free Food Pantries / Community Fridges'   THEN 'program'
            WHEN 'Indigenous Food Program'                  THEN 'program'
            ELSE 'neutral'
        END::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Per-DA income context → multipliers
--
-- retail_multiplier  : lower in wealthier DAs (retail is less critical there)
-- program_multiplier : higher in higher-hardship DAs (programs matter more)
-- Both range from 0.6–1.0 and 0.5–1.0 respectively.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_da_context AS
SELECT
    dauid,
    -- Retail: full weight in poorest DAs, 60% weight in wealthiest
    0.6 + (
        PERCENT_RANK() OVER (ORDER BY median_household_income ASC NULLS LAST)
        * 0.4
    ) AS retail_multiplier,
    -- Program: full weight in highest-hardship DAs, 50% in lowest
    0.5 + (
        PERCENT_RANK() OVER (ORDER BY pct_low_income_lim_at DESC NULLS LAST)
        * 0.5
    ) AS program_multiplier
FROM dissemination_areas
WHERE median_household_income IS NOT NULL
   OR pct_low_income_lim_at   IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: All food assets reachable from each DA, with adjusted scores
--
-- Isochrone clip (ST_Intersection) gives us only the portion of each
-- isochrone that falls inside the DA, which is what we area-weight later.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_accessible_food_assets AS
SELECT
    da.dauid,
    fa.id                                                           AS asset_id,
    iso.range_seconds                                               AS iso_range,
    attrs.base_score,
    attrs.tier,
    attrs.base_score * CASE attrs.tier
        WHEN 'retail'  THEN COALESCE(ctx.retail_multiplier,  1.0)
        WHEN 'program' THEN COALESCE(ctx.program_multiplier, 1.0)
        ELSE 1.0
    END                                                             AS adjusted_score,
    ST_SetSRID(
        ST_Intersection(da.geom, iso.geom::geometry), 4326
    )                                                               AS iso_clipped,
    da.geom                                                         AS da_geom
FROM dissemination_areas da
JOIN isochrones iso
    ON ST_Intersects(da.geom, iso.geom::geometry)
JOIN food_assets fa
    ON fa.id = iso.source_id::INTEGER
CROSS JOIN LATERAL get_asset_attrs(fa.category) attrs
LEFT JOIN temp_da_context ctx
    ON ctx.dauid = da.dauid
WHERE iso.source_type   = 'food_asset'
  AND iso.profile       = 'foot-walking'   -- change to 'driving-car' etc. as needed
  AND iso.range_seconds IN (300, 600, 900) -- 5 / 10 / 15 min
  AND attrs.base_score  > 0;              -- excluded categories never enter the pipeline

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Overlap correction + area-weighted score per DA per range
--
-- Each asset claims only the area of the DA not already covered by a
-- higher-scored asset (ties broken by asset_id). This means two supermarkets
-- in the same corner don't double-count — the second one only contributes
-- if it covers genuinely new area.
--
-- unique_score = adjusted_score × (unique_area / DA_area)
-- So a supermarket covering 80% of a DA contributes ~8 points (score 10 × 0.8),
-- while one crammed into a corner with another contributes proportionally less.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_da_raw_scores AS
WITH unique_area_per_asset AS (
    SELECT
        target.dauid,
        target.iso_range,
        target.asset_id,
        target.adjusted_score,
        target.da_geom,
        ST_Difference(
            target.iso_clipped,
            COALESCE(
                ST_Union(claimed.iso_clipped),
                ST_GeomFromText('GEOMETRYCOLLECTION EMPTY', 4326)
            )
        ) AS unique_geom
    FROM temp_accessible_food_assets target
    LEFT JOIN temp_accessible_food_assets claimed
        ON  claimed.dauid         = target.dauid
        AND claimed.iso_range     = target.iso_range
        AND (
            claimed.adjusted_score > target.adjusted_score
            OR (    claimed.adjusted_score = target.adjusted_score
                AND claimed.asset_id       < target.asset_id)
        )
    GROUP BY
        target.dauid,
        target.iso_range,
        target.asset_id,
        target.adjusted_score,
        target.iso_clipped,
        target.da_geom
),
scored_assets AS (
    SELECT
        dauid,
        iso_range,
        -- area fraction capped at 1.0 as a guard against floating-point slivers
        adjusted_score * LEAST(
            ST_Area(ST_Transform(unique_geom, 3153))
                / NULLIF(ST_Area(ST_Transform(da_geom, 3153)), 0),
            1.0
        ) AS unique_score
    FROM unique_area_per_asset
    WHERE NOT ST_IsEmpty(unique_geom)
)
SELECT
    dauid,
    iso_range,
    SUM(unique_score) AS total_score
FROM scored_assets
GROUP BY dauid, iso_range;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Normalize scores globally across all DA-range combinations
--
-- PERCENT_RANK runs over all rows (no PARTITION BY), so scores are comparable
-- across ranges: a 5-min score of 7 and a 15-min score of 7 are both in the
-- 70th percentile of all DA-range pairs. DAs with more reachable assets at
-- 15 min will naturally cluster higher, making the range gap meaningful.
--
-- DAs with zero access are pinned at 0 (not ranked), so the floor is real.
-- Everything else is distributed across 0.5–10.0 based on relative rank
-- among DA-range pairs that have at least some access.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    scored.dauid,
    scored.iso_range,
    scored.total_score                                          AS raw_score,
    CASE
        WHEN scored.total_score = 0 THEN 0.0
        ELSE ROUND(
            CAST(
              PERCENT_RANK() OVER (
                  ORDER BY scored.total_score
              ) * 10  
            AS NUMERIC)
            )::INT
    END                                                         AS normalized_score
FROM (
    -- Ensure every DA appears for every range, defaulting to 0 where no assets reached
    SELECT
        d.dauid,
        r.iso_range,
        COALESCE(s.total_score, 0) AS total_score
    FROM dissemination_areas d
    CROSS JOIN (SELECT DISTINCT iso_range FROM temp_da_raw_scores) r
    LEFT JOIN temp_da_raw_scores s
        ON  s.dauid     = d.dauid
        AND s.iso_range = r.iso_range
) scored
ORDER BY dauid, iso_range;

