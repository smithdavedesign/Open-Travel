-- Pending trip invitations (for users who don't have an account yet)
create table public.trip_invites (
  id          uuid default uuid_generate_v4() primary key,
  trip_id     uuid references public.trips(id) on delete cascade not null,
  email       text not null,
  role        text not null default 'editor'
                check (role in ('owner', 'editor', 'viewer')),
  invited_by  uuid references public.profiles(id) on delete cascade not null,
  accepted_at timestamptz,
  created_at  timestamptz default now() not null,
  unique(trip_id, email)
);

alter table public.trip_invites enable row level security;

-- Anyone can read an invite by its id (needed for the accept-invite page, unauthenticated lookup not needed since we use adminSupabase server-side)
create policy "Trip owners can manage invites"
  on public.trip_invites for all
  using (
    exists (
      select 1 from public.trips
      where id = trip_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where id = trip_id and owner_id = auth.uid()
    )
  );
