-- Open Travel — Initial Schema
-- Run this in your Supabase SQL editor or via supabase db push

create extension if not exists "uuid-ossp";

-- ================================================
-- TABLES
-- ================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  destinations text[] not null default '{}',
  start_date date,
  end_date date,
  cover_photo_url text,
  description text,
  status text not null default 'planning'
    check (status in ('planning', 'active', 'completed', 'archived')),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  forwarding_address text unique, -- Tier 2: email forwarding (future)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'viewer'
    check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz default now() not null,
  unique(trip_id, user_id)
);

create table public.events (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  type text not null
    check (type in ('flight', 'hotel', 'car_rental', 'activity', 'excursion', 'restaurant', 'transfer', 'custom')),
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  location text,
  confirmation_code text,
  cost numeric(10,2),
  currency text not null default 'USD',
  notes text,
  data jsonb not null default '{}',  -- type-specific fields (airline, room type, etc.)
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  title text not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  amount_home_currency numeric(10,2),
  category text not null default 'misc'
    check (category in ('flights', 'accommodation', 'food', 'activities', 'transport', 'misc')),
  paid_by uuid references public.profiles(id) not null,
  date date not null,
  notes text,
  receipt_url text,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz default now() not null
);

create table public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount numeric(10,2) not null,
  split_mode text not null default 'equal'
    check (split_mode in ('equal', 'exact', 'percentage', 'shares')),
  unique(expense_id, user_id)
);

create table public.settlements (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) not null,
  to_user_id uuid references public.profiles(id) not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  method text,
  settled_at timestamptz,
  created_at timestamptz default now() not null
);

create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  parsed_at timestamptz,
  uploaded_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

create table public.activity_feed (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz default now() not null
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.events enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.documents enable row level security;
alter table public.activity_feed enable row level security;

-- Helper: is the current user a member of a trip?
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper: is the current user an editor or owner of a trip?
create or replace function public.is_trip_editor(p_trip_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$ language sql security definer;

-- Profiles
create policy "Authenticated users can view all profiles"
  on public.profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Trips
create policy "Members can view their trips"
  on public.trips for select to authenticated using (public.is_trip_member(id));
create policy "Authenticated users can create trips"
  on public.trips for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can update trips"
  on public.trips for update to authenticated using (owner_id = auth.uid());
create policy "Owners can delete trips"
  on public.trips for delete to authenticated using (owner_id = auth.uid());

-- Trip Members
create policy "Members can view trip membership"
  on public.trip_members for select to authenticated using (public.is_trip_member(trip_id));
create policy "Owners can manage members"
  on public.trip_members for insert to authenticated
  with check (exists (select 1 from public.trips where id = trip_id and owner_id = auth.uid()));
create policy "Owners can remove members"
  on public.trip_members for delete to authenticated
  using (exists (select 1 from public.trips where id = trip_id and owner_id = auth.uid()));

-- Events
create policy "Members can view events"
  on public.events for select to authenticated using (public.is_trip_member(trip_id));
create policy "Editors can create events"
  on public.events for insert to authenticated with check (public.is_trip_editor(trip_id));
create policy "Editors can update events"
  on public.events for update to authenticated using (public.is_trip_editor(trip_id));
create policy "Editors can delete events"
  on public.events for delete to authenticated using (public.is_trip_editor(trip_id));

-- Expenses
create policy "Members can view expenses"
  on public.expenses for select to authenticated using (public.is_trip_member(trip_id));
create policy "Editors can create expenses"
  on public.expenses for insert to authenticated with check (public.is_trip_editor(trip_id));
create policy "Editors can update expenses"
  on public.expenses for update to authenticated using (public.is_trip_editor(trip_id));
create policy "Editors can delete expenses"
  on public.expenses for delete to authenticated using (public.is_trip_editor(trip_id));

-- Expense Splits (access via parent expense)
create policy "Members can view splits"
  on public.expense_splits for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)));

-- Settlements
create policy "Members can view settlements"
  on public.settlements for select to authenticated using (public.is_trip_member(trip_id));
create policy "Editors can create settlements"
  on public.settlements for insert to authenticated with check (public.is_trip_editor(trip_id));

-- Documents
create policy "Members can view documents"
  on public.documents for select to authenticated using (public.is_trip_member(trip_id));
create policy "Editors can upload documents"
  on public.documents for insert to authenticated with check (public.is_trip_editor(trip_id));
create policy "Uploaders can delete their documents"
  on public.documents for delete to authenticated using (uploaded_by = auth.uid());

-- Activity Feed
create policy "Members can view activity"
  on public.activity_feed for select to authenticated using (public.is_trip_member(trip_id));

-- ================================================
-- TRIGGERS
-- ================================================

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-add trip creator as owner member
create or replace function public.handle_new_trip()
returns trigger as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

-- ================================================
-- STORAGE BUCKET
-- ================================================
-- Run in Supabase dashboard: Storage → New Bucket
-- Name: trip-documents | Public: false
-- Or via SQL:
-- insert into storage.buckets (id, name, public) values ('trip-documents', 'trip-documents', false);
