-- Add geocoordinates to trip_places so pins are stored at creation time
-- and the map doesn't need to geocode on every load.

ALTER TABLE trip_places
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
