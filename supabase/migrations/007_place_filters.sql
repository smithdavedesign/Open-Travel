-- Open Travel — Place filter attributes
-- Add optional metadata columns to trip_places for filtering

alter table public.trip_places
  add column if not exists reservation_needed boolean not null default false,
  add column if not exists time_of_day        text check (time_of_day in ('morning', 'afternoon', 'evening')),
  add column if not exists duration           text check (duration in ('full_day', 'half_day')),
  add column if not exists meal_type          text check (meal_type in ('breakfast', 'lunch', 'dinner'));
