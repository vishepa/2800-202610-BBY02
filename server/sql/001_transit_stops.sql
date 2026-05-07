-- 001_transit_stops.sql
-- TransLink GTFS transit stops for Metro Vancouver

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS transit_stops (
  stop_id     TEXT PRIMARY KEY,
  stop_name   TEXT NOT NULL,
  stop_lat    DOUBLE PRECISION NOT NULL,
  stop_lon    DOUBLE PRECISION NOT NULL,
  geom        GEOGRAPHY(POINT, 4326)
              GENERATED ALWAYS AS (ST_MakePoint(stop_lon, stop_lat)::geography) STORED
);

CREATE INDEX IF NOT EXISTS transit_stops_geom_gix
  ON transit_stops USING GIST (geom);
