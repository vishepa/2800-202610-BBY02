
create table if not exists public.simulations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  description   text,
  placed_assets jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists simulations_user_id_idx on public.simulations (user_id);

alter table public.simulations enable row level security;

-- Each authenticated user can only read/insert/delete their own simulations.
create policy "Users can read own simulations"
  on public.simulations for select
  using (auth.uid() = user_id);

create policy "Users can insert own simulations"
  on public.simulations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own simulations"
  on public.simulations for delete
  using (auth.uid() = user_id);
