CREATE INDEX ON dissemination_areas USING GIST (geom); 
CREATE INDEX ON isochrones USING GIST (geom);

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

-- Creates a temporary table used to calculate the accessibility scores per dissemination area
CREATE TEMPORARY TABLE temp_accessible_food_assets AS
	SELECT 
		*,
		fa_score * ST_Area(ST_Intersection(da_geom, iso_geom)) AS accessible_fa_score
	FROM(
		SELECT 
			da.dauid, 
			da.geom::geometry AS da_geom, 
			iso.id AS iso_id, 
			iso.source_type, 
			iso.source_id, 
			iso.geom::geometry AS iso_geom,
			fa.category, 
			get_asset_score(fa.category) AS fa_score -- IDK if i need this
		FROM dissemination_areas da
		JOIN isochrones iso ON ST_Intersects(da.geom::geometry, iso.geom::geometry)
		JOIN food_assets fa ON fa.id = iso.source_id::INTEGER
		WHERE iso.source_type = 'food_asset'
	) inner_query;

-- Calculates DA raw score and DA accessible area
ALTER TABLE dissemination_areas
ADD COLUMN IF NOT EXISTS raw_da_score FLOAT,
ADD COLUMN IF NOT EXISTS da_accessible_area FLOAT;

WITH aggregated AS (
    SELECT
        dauid,
        SUM(accessible_fa_score) AS total_score,
        SUM(ST_Area(ST_Intersection(iso_geom::geometry, da_geom))) AS total_area
    FROM temp_accessible_food_assets
    GROUP BY dauid
)
UPDATE dissemination_areas da
SET
    raw_da_score     = agg.total_score / ST_Area(da.geom::geometry),
    da_accessible_area = agg.total_area
FROM aggregated agg
WHERE da.dauid = agg.dauid;


-- Normalize raw DA score so it is usable
ALTER TABLE dissemination_areas
ADD COLUMN IF NOT EXISTS normalized_da_score INT;

UPDATE dissemination_areas da
SET normalized_da_score = ROUND(
	CASE 
		WHEN stats.max_score = stats.min_score THEN 5 
		ELSE 1 + ((da.raw_da_score - stats.min_score) / (stats.max_score -stats.min_score)) * 9 
		END
)::INT
FROM (
	SELECT
		MIN(raw_da_score) AS min_score,
		MAX(raw_da_score) AS max_score
	FROM dissemination_areas
	WHERE raw_da_score IS NOT NULL
) stats
WHERE da.dauid IN (SELECT DISTINCT dauid FROM temp_accessible_food_assets);