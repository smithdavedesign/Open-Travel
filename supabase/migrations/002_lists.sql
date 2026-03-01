-- Open Travel — Lists: Checklists + Places to Visit
-- Run this in your Supabase SQL editor after 001_initial_schema.sql

-- ── trip_checklist_items ───────────────────────────────────────────────────

create table public.trip_checklist_items (
  id          uuid default uuid_generate_v4() primary key,
  trip_id     uuid references public.trips(id) on delete cascade not null,
  category    text not null
    check (category in ('packing', 'grocery', 'souvenirs', 'food_to_try', 'other')),
  title       text not null,
  notes       text,
  quantity    integer,
  checked     boolean not null default false,
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz default now() not null
);

alter table public.trip_checklist_items enable row level security;

-- Checklist RLS: trip members can read; editors can write
create policy "trip members can view checklist items"
  on public.trip_checklist_items for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_checklist_items.trip_id
        and user_id = auth.uid()
    )
  );

create policy "trip editors can insert checklist items"
  on public.trip_checklist_items for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_checklist_items.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "trip editors can update checklist items"
  on public.trip_checklist_items for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_checklist_items.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "trip editors can delete checklist items"
  on public.trip_checklist_items for delete
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_checklist_items.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

-- ── trip_places ────────────────────────────────────────────────────────────

create table public.trip_places (
  id          uuid default uuid_generate_v4() primary key,
  trip_id     uuid references public.trips(id) on delete cascade not null,
  category    text not null
    check (category in ('food_drink', 'things_to_do', 'nature', 'shopping', 'work_friendly')),
  name        text not null,
  location    text,
  notes       text,
  status      text not null default 'pending'
    check (status in ('pending', 'approved')),
  rating      integer check (rating >= 1 and rating <= 5),
  url         text,
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz default now() not null
);

alter table public.trip_places enable row level security;

-- Places RLS: same pattern as checklists
create policy "trip members can view places"
  on public.trip_places for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_places.trip_id
        and user_id = auth.uid()
    )
  );

create policy "trip editors can insert places"
  on public.trip_places for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_places.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "trip editors can update places"
  on public.trip_places for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_places.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "trip editors can delete places"
  on public.trip_places for delete
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_places.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );
