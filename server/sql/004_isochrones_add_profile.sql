-- 004_isochrones_add_profile.sql
-- Adds a profile column to distinguish walking vs driving isochrones.

ALTER TABLE isochrones
  ADD COLUMN IF NOT EXISTS profile TEXT NOT NULL DEFAULT 'foot-walking';

-- Drop the old unique constraint and recreate with profile included
ALTER TABLE isochrones
  DROP CONSTRAINT IF EXISTS isochrones_source_type_source_id_range_seconds_key;

ALTER TABLE isochrones
  ADD CONSTRAINT isochrones_source_profile_range_key
    UNIQUE (source_type, source_id, profile, range_seconds);

-- Update the source index to include profile for faster lookups
DROP INDEX IF EXISTS isochrones_source_idx;

CREATE INDEX IF NOT EXISTS isochrones_source_idx
  ON isochrones (source_type, source_id, profile);
