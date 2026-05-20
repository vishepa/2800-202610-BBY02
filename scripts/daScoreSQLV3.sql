-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Pre-compute per-DA context multipliers from demographic data
-- ─────────────────────────────────────────────────────────────────────────────
-- income_index:   0 = very low income, 1 = very high income
-- hardship_index: 0 = no hardship,     1 = severe hardship
-- Both are percentile-ranked across all DAs so they're relative, not absolute.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TEMPORARY TABLE temp_da_context AS
WITH income_ranks AS (
    SELECT
        dauid,
        median_household_income,
        pct_low_income_lim_at,
        -- Percentile rank: 1.0 = highest income DA, 0.0 = lowest
        PERCENT_RANK() OVER (ORDER BY median_household_income ASC NULLS LAST)  AS income_index,
        -- Percentile rank: 1.0 = highest hardship DA, 0.0 = lowest
        PERCENT_RANK() OVER (ORDER BY pct_low_income_lim_at DESC NULLS LAST) AS hardship_index
    FROM dissemination_areas
    WHERE median_household_income IS NOT NULL
       OR pct_low_income_lim_at IS NOT NULL
)
SELECT
    dauid,
    income_index,
    hardship_index,
    -- Retail multiplier: ranges 0.6 → 1.0
    -- High-income DAs get full retail credit; low-income DAs are penalised
    -- (retail access doesn't help if it's unaffordable)
    0.6 + (income_index * 0.4)                          AS retail_multiplier,
    -- Program multiplier: ranges 0.5 → 1.0
    -- High-hardship DAs get full program credit; low-hardship DAs less so
    0.5 + (hardship_index * 0.5)                        AS program_multiplier
FROM income_ranks;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Categorise each asset into a scoring tier
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_asset_tier(p_category TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE p_category
        -- Retail tier: useful primarily to those who can afford it
        WHEN 'Supermarkets'                                           THEN 'retail'
        WHEN 'Grocery Stores'                                         THEN 'retail'
        WHEN 'Low Cost Grocery and Food Markets'                      THEN 'retail'
        WHEN 'Specialty Food Stores'                                  THEN 'retail'
        WHEN 'Small Food Stores'                                      THEN 'retail'
        WHEN 'Small Cultural Food Business'                           THEN 'retail'
        WHEN 'Public Markets'                                         THEN 'retail'
        WHEN 'Food Shopping and Delivery'                             THEN 'retail'

        -- Program tier: most valuable to low-income / food-insecure residents
        WHEN 'No Cost or Low Cost Grocery Items'                      THEN 'program'
        WHEN 'Free Grocery Items'                                     THEN 'program'
        WHEN 'Free Meal'                                              THEN 'program'
        WHEN 'Low Cost Meal'                                          THEN 'program'
        WHEN 'Young Adult Free and low cost meals'                    THEN 'program'
        WHEN 'Youth Free and low cost meals'                          THEN 'program'
        WHEN 'Free Food Pantries'                                     THEN 'program'
        WHEN 'Free Food Pantries / Community Fridges'                 THEN 'program'
        -- WHEN 'Indigenous Food Program'                                THEN 'program'
        -- WHEN 'Mobile or Seasonal Markets'                             THEN 'program'
        -- WHEN 'Farmer''s Market Coupon Programs'                       THEN 'program'

        -- Neutral tier: community assets, skill-building, seasonal
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
    ST_Transform(da.geom::geometry, 3005) AS da_geom,
    ST_Transform(iso.geom::geometry, 3005) AS iso_geom,
    fa.category,
    get_asset_score(fa.category) AS base_score,
    get_asset_tier(fa.category) AS asset_tier,
    -- Apply context multiplier based on asset tier
    get_asset_score(fa.category) * CASE get_asset_tier(fa.category)
        WHEN 'retail'  THEN COALESCE(ctx.retail_multiplier,  1.0)
        WHEN 'program' THEN COALESCE(ctx.program_multiplier, 1.0)
        ELSE 1.0
    END AS adjusted_score,
    -- Weight by what fraction of the DA this isochrone actually covers
    ST_Area(
        ST_Intersection(
                ST_Transform(da.geom::geometry, 3005),
                ST_Transform(iso.geom::geometry, 3005)
            )
        )
        / NULLIF(ST_Area(ST_Transform(da.geom::geometry, 3005)), 0) AS coverage_fraction
FROM dissemination_areas da
JOIN isochrones iso
    ON ST_Intersects(da.geom, iso.geom::geometry)
JOIN food_assets fa
    ON fa.id = iso.source_id::INTEGER
LEFT JOIN temp_da_context ctx
    ON ctx.dauid = da.dauid
WHERE iso.source_type = 'food_asset';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Roll up to raw DA score
--
-- raw_da_score = SUM(adjusted_score × coverage_fraction)
--   • coverage_fraction ensures a supermarket 1 block away counts more than
--     one barely clipping the DA boundary
--   • No division by area needed — coverage_fraction already normalizes it
-- ─────────────────────────────────────────────────────────────────────────────
WITH aggregated AS (
    SELECT
        dauid,
        SUM(adjusted_score * coverage_fraction)             AS total_score,
        SUM(ST_Area(ST_Intersection(iso_geom, da_geom)))    AS total_accessible_area
    FROM temp_accessible_food_assets
    GROUP BY dauid
)
UPDATE dissemination_areas da
SET
    raw_da_score       = agg.total_score,
    da_accessible_area = agg.total_accessible_area
FROM aggregated agg
WHERE da.dauid = agg.dauid;

-- Zero out DAs with no accessible assets (rather than leaving NULL)
UPDATE dissemination_areas
SET raw_da_score = 0
WHERE raw_da_score IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5: Percentile-rank normalization → 1–10
--
-- PERCENT_RANK() gives 0.0–1.0 across all DAs.
-- Multiply by 9, add 1 → 1–10. Round to nearest integer.
-- DAs with identical scores cluster at the same band naturally.
-- This is outlier-proof: a single DA with a freakishly high score
-- no longer compresses every other DA into the bottom half.
-- ─────────────────────────────────────────────────────────────────────────────
WITH ranked AS (
    SELECT
        dauid,
        ROUND(1 + PERCENT_RANK() OVER (ORDER BY raw_da_score ASC) * 9)::INT AS pct_score
    FROM dissemination_areas
)
UPDATE dissemination_areas da
SET normalized_da_score = r.pct_score
FROM ranked r
WHERE da.dauid = r.dauid;


-- Function to assign food scores
CREATE OR REPLACE FUNCTION get_asset_score(p_category TEXT) RETURNS FLOAT AS $$
BEGIN
  RETURN CASE p_category

    -- Core grocery retail (always open, serve everyone, full selection)
    WHEN 'Supermarkets'                                        THEN 10
    WHEN 'Grocery Stores'                                      THEN 10
    WHEN 'Low Cost Grocery and Food Markets'                   THEN 9
    WHEN 'No Cost or Low Cost Grocery Items'                   THEN 9
    WHEN 'Free Grocery Items'                                  THEN 9
    WHEN 'Public Markets'                                      THEN 8

    -- Specialty stores (consistent but narrower selection)
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

    -- Meals (reliable but capacity-limited or narrow eligibility)
    WHEN 'Free Meal'                                           THEN 6
    WHEN 'Low Cost Meal'                                       THEN 5
    WHEN 'Young Adult Free and low cost meals'                 THEN 5
    WHEN 'Youth Free and low cost meals'                       THEN 5

    -- Pantries / emergency food (limited supply, not a primary source)
    WHEN 'Free Food Pantries'                                  THEN 4
    WHEN 'Free Food Pantries / Community Fridges'              THEN 4
    WHEN 'Food Shopping and Delivery'                          THEN 4
    WHEN 'Indigenous Food Program'                             THEN 4

    -- Seasonal / infrequent access
    WHEN 'Mobile or Seasonal Markets'                          THEN 3
    WHEN 'Farmer''s Market Coupon Programs'                    THEN 3
    WHEN 'Community Shared Agriculture (CSA)'                  THEN 3
    WHEN 'Food Recovery and Waste Prevention'                  THEN 3

    -- Skill-building / production (indirect food access)
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

    -- Support / infrastructure (no direct food access)
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