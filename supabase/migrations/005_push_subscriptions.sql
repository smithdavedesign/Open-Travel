-- Push notification subscriptions
create table public.push_subscriptions (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  subscription jsonb not null,
  created_at   timestamptz default now() not null
);

-- Unique index on (user_id, endpoint) — expression indexes must be separate from table definition
create unique index push_subscriptions_user_endpoint_idx
  on public.push_subscriptions (user_id, (subscription->>'endpoint'));

alter table public.push_subscriptions enable row level security;

create policy "users manage own push subscriptions"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
