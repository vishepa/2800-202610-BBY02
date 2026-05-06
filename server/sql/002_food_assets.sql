-- 002_food_assets.sql
-- City of Vancouver Food Asset Map locations (all 8 categories)

CREATE TABLE IF NOT EXISTS food_assets (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  address     TEXT NOT NULL,
  lat         DOUBLE PRECISION,
  lon         DOUBLE PRECISION,
  geom        GEOGRAPHY(POINT, 4326)
              GENERATED ALWAYS AS (
                CASE WHEN lat IS NOT NULL AND lon IS NOT NULL
                  THEN ST_MakePoint(lon, lat)::geography
                  ELSE NULL
                END
              ) STORED
);

CREATE INDEX IF NOT EXISTS food_assets_geom_gix
  ON food_assets USING GIST (geom)
  WHERE geom IS NOT NULL;

CREATE INDEX IF NOT EXISTS food_assets_category_idx
  ON food_assets (category);
