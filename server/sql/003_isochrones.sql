-- 003_isochrones.sql
-- Walking isochrone polygons from ORS (5/10/15 min bands)
-- Linked to transit_stops and food_assets by source_type + source_id

CREATE TABLE IF NOT EXISTS isochrones (
  id            SERIAL PRIMARY KEY,
  source_type   TEXT NOT NULL CHECK (source_type IN ('transit_stop', 'food_asset')),
  source_id     TEXT NOT NULL,
  range_seconds INT  NOT NULL CHECK (range_seconds IN (300, 600, 900)),
  geom          GEOGRAPHY NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_type, source_id, range_seconds)
);

CREATE INDEX IF NOT EXISTS isochrones_geom_gix
  ON isochrones USING GIST (geom);

CREATE INDEX IF NOT EXISTS isochrones_source_idx
  ON isochrones (source_type, source_id);
