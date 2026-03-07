-- Open Travel — Place Votes (Wandr group voting feature)
-- Run after 002_lists.sql and 003_place_coords.sql

create table public.place_votes (
  id         uuid default uuid_generate_v4() primary key,
  place_id   uuid references public.trip_places(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  vote       integer not null check (vote in (1, -1)),
  created_at timestamptz default now() not null,
  unique(place_id, user_id)
);

alter table public.place_votes enable row level security;

-- All trip members can view votes
create policy "members can view place votes"
  on public.place_votes for select
  using (
    exists (
      select 1 from public.trip_places p
      join public.trip_members m on m.trip_id = p.trip_id
      where p.id = place_id and m.user_id = auth.uid()
    )
  );

-- Members can insert their own vote
create policy "members can insert own vote"
  on public.place_votes for insert
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.trip_places p
      join public.trip_members m on m.trip_id = p.trip_id
      where p.id = place_id and m.user_id = auth.uid()
    )
  );

-- Members can update their own vote
create policy "members can update own vote"
  on public.place_votes for update
  using (user_id = auth.uid());

-- Members can delete their own vote
create policy "members can delete own vote"
  on public.place_votes for delete
  using (user_id = auth.uid());
