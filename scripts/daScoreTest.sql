DROP TABLE IF EXISTS temp_da_context;
DROP TABLE IF EXISTS temp_accessible_food_assets;
DROP TABLE IF EXISTS temp_da_raw_scores;

-- ─────────────────────────────────────────────────────────────────────────────
-- Function to assign food scores
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_asset_score(p_category TEXT) RETURNS FLOAT AS $$
BEGIN
  RETURN CASE p_category
    WHEN 'Supermarkets'                                        THEN 10
    WHEN 'Grocery Stores'                                      THEN 10
    WHEN 'Low Cost Grocery and Food Markets'                   THEN 9
    WHEN 'No Cost or Low Cost Grocery Items'                   THEN 9
    WHEN 'Free Grocery Items'                                  THEN 9
    WHEN 'Public Markets'                                      THEN 8
    WHEN 'Specialty Food Stores'                               THEN 8
    WHEN 'Specialty East Asian Food Stores'                    THEN 8
    WHEN 'Specialty European Food Stores'                      THEN 8
    WHEN 'Specialty Filipino Food Stores'                      THEN 8
    WHEN 'Specialty Halal Food Stores'                         THEN 8
    WHEN 'Specialty Japanese Food Stores'                      THEN 8
    WHEN 'Specialty Latin American Food Stores'                THEN 8
    WHEN 'Specialty Mediterranean and Middle Eastern Food Stores' THEN 7
    WHEN 'Specialty South Asian Food Stores'                   THEN 8
    WHEN 'Small Food Stores'                                   THEN 7
    WHEN 'Small Cultural Food Business'                        THEN 7
    WHEN 'Free Meal'                                           THEN 6
    WHEN 'Low Cost Meal'                                       THEN 5
    WHEN 'Young Adult Free and low cost meals'                 THEN 5
    WHEN 'Youth Free and low cost meals'                       THEN 5
    WHEN 'Free Food Pantries'                                  THEN 4
    WHEN 'Free Food Pantries / Community Fridges'              THEN 4
    WHEN 'Food Shopping and Delivery'                          THEN 4
    WHEN 'Indigenous Food Program'                             THEN 4
    WHEN 'Mobile or Seasonal Markets'                          THEN 3
    WHEN 'Farmer''s Market Coupon Programs'                    THEN 3
    WHEN 'Community Shared Agriculture (CSA)'                  THEN 3
    WHEN 'Food Recovery and Waste Prevention'                  THEN 3
    WHEN 'Community Kitchen Programs'                          THEN 2
    WHEN 'Food Skills Workshops'                               THEN 2
    WHEN 'Kitchen Access'                                      THEN 2
    WHEN 'Youth Community Kitchens'                            THEN 2
    WHEN 'Community Gardens'                                   THEN 2
    WHEN 'Community Orchards'                                  THEN 2
    WHEN 'Garden Skills and Education'                         THEN 2
    WHEN 'Indigenous Gardens'                                  THEN 2
    WHEN 'Other Garden Programs'                               THEN 2
    WHEN 'Seed Libraries'                                      THEN 2
    WHEN 'Urban Farms'                                         THEN 2
    WHEN 'Urban Forests'                                       THEN 2
    WHEN 'Yard Share Programs'                                 THEN 2
    WHEN 'Commissary Kitchens'                                 THEN 1
    WHEN 'Community Centres'                                   THEN 1
    WHEN 'Family Place'                                        THEN 1
    WHEN 'Food Social Enterprise'                              THEN 1
    WHEN 'Health Centres'                                      THEN 1
    WHEN 'Neighbourhood Food Networks'                         THEN 1
    WHEN 'Other Community-based Food Organizations'            THEN 1
    WHEN 'Religious Organizations'                             THEN 1
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Pre-compute per-DA context multipliers from demographic data
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_da_context AS
WITH income_ranks AS (
    SELECT
        dauid,
        median_household_income,
        pct_low_income_lim_at,
        PERCENT_RANK() OVER (ORDER BY median_household_income ASC NULLS LAST)  AS income_index,
        PERCENT_RANK() OVER (ORDER BY pct_low_income_lim_at DESC NULLS LAST) AS hardship_index
    FROM dissemination_areas
    WHERE median_household_income IS NOT NULL
       OR pct_low_income_lim_at IS NOT NULL
)
SELECT
    dauid,
    income_index,
    hardship_index,
    0.6 + (income_index * 0.4)                          AS retail_multiplier,
    0.5 + (hardship_index * 0.5)                        AS program_multiplier
FROM income_ranks;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Categorise each asset into a scoring tier
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_asset_tier(p_category TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE p_category
        WHEN 'Supermarkets'                                           THEN 'retail'
        WHEN 'Grocery Stores'                                         THEN 'retail'
        WHEN 'Low Cost Grocery and Food Markets'                      THEN 'retail'
        WHEN 'Specialty Food Stores'                                  THEN 'retail'
        WHEN 'Small Food Stores'                                      THEN 'retail'
        WHEN 'Small Cultural Food Business'                           THEN 'retail'
        WHEN 'Public Markets'                                         THEN 'retail'
        WHEN 'Food Shopping and Delivery'                             THEN 'retail'
        WHEN 'No Cost or Low Cost Grocery Items'                      THEN 'program'
        WHEN 'Free Grocery Items'                                     THEN 'program'
        WHEN 'Free Meal'                                              THEN 'program'
        WHEN 'Low Cost Meal'                                          THEN 'program'
        WHEN 'Young Adult Free and low cost meals'                    THEN 'program'
        WHEN 'Youth Free and low cost meals'                          THEN 'program'
        WHEN 'Free Food Pantries'                                     THEN 'program'
        WHEN 'Free Food Pantries / Community Fridges'                 THEN 'program'
        ELSE 'neutral'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Build accessible assets table with context-adjusted scores
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_accessible_food_assets AS
SELECT
    da.dauid,
    fa.id  AS asset_id,
    iso.range_seconds AS iso_range,
    da.geom                                                    AS da_geom,
    iso.geom::geometry                                         AS iso_geom,
    fa.category,
    get_asset_score(fa.category)                               AS base_score,
    get_asset_tier(fa.category)                                AS asset_tier,
    get_asset_score(fa.category) * CASE get_asset_tier(fa.category)
        WHEN 'retail'  THEN COALESCE(ctx.retail_multiplier,  1.0)
        WHEN 'program' THEN COALESCE(ctx.program_multiplier, 1.0)
        ELSE 1.0
    END                                                        AS adjusted_score,
    LEAST(
    ST_Area(ST_Transform(ST_Intersection(da.geom, iso.geom::geometry), 3153))
        / NULLIF(ST_Area(ST_Transform(da.geom, 3153)), 0),
        1.0
    ) AS coverage_fraction
FROM dissemination_areas da
JOIN isochrones iso
    ON ST_Intersects(da.geom, iso.geom::geometry)
JOIN food_assets fa
    ON fa.id = iso.source_id::INTEGER
LEFT JOIN temp_da_context ctx
    ON ctx.dauid = da.dauid
WHERE iso.source_type = 'food_asset' 
  AND iso.profile = 'foot-walking' -- Update here to change the mode of transportation: 'foot-walking', 'driving-car'
  AND iso.range_seconds IN (300, 600, 900); -- Update here to change isochrone walking distance: 300 = 5 minutes, 600 = 10 minutes, 900 = 15 minutes

CREATE TEMPORARY TABLE temp_da_raw_scores AS
SELECT 
    dauid,
    iso_range,
    SUM(best_score) AS total_score
FROM(
    SELECT 
        dauid,
        iso_range,
        asset_id,
        MAX(adjusted_score * coverage_fraction) AS best_score
    FROM temp_accessible_food_assets
    GROUP BY dauid, iso_range, asset_id
) best_per_asset
GROUP BY dauid, iso_range;




-- ─────────────────────────────────────────────────────────────────────────────
-- Steps 4 & 5: Display computed raw and normalized DA scores
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    dauid,
    iso_range,
    total_score                                                         AS raw_da_score,
    ROUND(1 + PERCENT_RANK() OVER (ORDER BY total_score ASC) * 9)::INT AS normalized_da_score
FROM temp_da_raw_scores
    -- SELECT
    --     dauid,
    --     SUM(best_score) AS total_score
    -- FROM (
    --     SELECT
    --         dauid,
    --         asset_id,
    --         MAX(adjusted_score * coverage_fraction) AS best_score
    --     FROM temp_accessible_food_assets
    --     GROUP BY dauid, asset_id
    -- ) best_per_asset
ORDER BY dauid, iso_range;

