-- One-time cleanup for databases that already ran the old duplicate-user migrations.
-- Identity source: auth.users only.

alter table if exists public.shell_transactions drop constraint if exists shell_transactions_user_id_fkey;
alter table if exists public.shell_transactions drop constraint if exists shell_transactions_user_id_fkey1;
alter table if exists public.user_profiles drop constraint if exists user_profiles_user_id_fkey;
alter table if exists public.wallets drop constraint if exists wallets_user_id_fkey;
alter table if exists public.goals drop constraint if exists goals_user_id_fkey;
alter table if exists public.tasks drop constraint if exists tasks_user_id_fkey;
alter table if exists public.goals drop constraint if exists goals_app_user_id_fkey;
alter table if exists public.tasks drop constraint if exists tasks_app_user_id_fkey;

alter table if exists public.goals drop column if exists app_user_id;
alter table if exists public.tasks drop column if exists app_user_id;

drop table if exists public.shell_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.app_users cascade;
drop table if exists public.users cascade;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shell_balance integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shell_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in ('signup_bonus', 'stake_lock', 'stake_return', 'hardcore_reward', 'stake_burn')
  ),
  amount integer not null,
  goal_id text,
  note text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'user_id' and data_type <> 'uuid'
  ) then
    alter table public.goals drop column user_id;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'user_id'
  ) then
    alter table public.goals add column user_id uuid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'user_id' and data_type <> 'uuid'
  ) then
    alter table public.tasks drop column user_id;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'user_id'
  ) then
    alter table public.tasks add column user_id uuid;
  end if;
end $$;

alter table public.goals
  add column if not exists is_hardcore boolean not null default false,
  add column if not exists staked_shells integer,
  add column if not exists hardcore_settled_at timestamptz,
  add column if not exists hardcore_failed_at timestamptz;

alter table public.goals
  add constraint goals_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.tasks
  add constraint tasks_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists shell_transactions_user_id_idx on public.shell_transactions(user_id);

alter table public.user_profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.shell_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
drop policy if exists "profiles_insert_own" on public.user_profiles;
drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_select_own" on public.user_profiles for select to authenticated using (user_id = auth.uid());
create policy "profiles_insert_own" on public.user_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profiles_update_own" on public.user_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "wallets_select_own" on public.wallets;
drop policy if exists "wallets_insert_own" on public.wallets;
drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select to authenticated using (user_id = auth.uid());
create policy "wallets_insert_own" on public.wallets for insert to authenticated with check (user_id = auth.uid());
create policy "wallets_update_own" on public.wallets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "shell_transactions_select_own" on public.shell_transactions;
drop policy if exists "shell_transactions_insert_own" on public.shell_transactions;
drop policy if exists "shell_transactions_update_own" on public.shell_transactions;
create policy "shell_transactions_select_own" on public.shell_transactions for select to authenticated using (user_id = auth.uid());
create policy "shell_transactions_insert_own" on public.shell_transactions for insert to authenticated with check (user_id = auth.uid());
create policy "shell_transactions_update_own" on public.shell_transactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_select_own" on public.goals for select to authenticated using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals for insert to authenticated with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals for delete to authenticated using (user_id = auth.uid());

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (user_id = auth.uid());
create policy "tasks_update_own" on public.tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (user_id = auth.uid());
