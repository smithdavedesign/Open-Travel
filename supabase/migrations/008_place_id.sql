-- Migration 008: Add Google Place ID to trip_places
-- Stores the canonical Google Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4)
-- extracted from Maps URLs. Used as a fallback key for Places Details API calls.

alter table public.trip_places
  add column if not exists place_id text;
