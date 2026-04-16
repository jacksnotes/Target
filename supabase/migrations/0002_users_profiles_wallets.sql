-- Cleanup migration for the earlier duplicate-user-table attempt.
-- Supabase Auth already owns identity in auth.users.
-- This removes public.users/public.app_users and recreates app-owned data tables
-- so they reference auth.users directly.

alter table if exists public.shell_transactions
  drop constraint if exists shell_transactions_user_id_fkey;
alter table if exists public.shell_transactions
  drop constraint if exists shell_transactions_user_id_fkey1;
alter table if exists public.goals
  drop constraint if exists goals_app_user_id_fkey;
alter table if exists public.tasks
  drop constraint if exists tasks_app_user_id_fkey;
alter table if exists public.goals
  drop constraint if exists goals_user_id_fkey;
alter table if exists public.tasks
  drop constraint if exists tasks_user_id_fkey;

alter table if exists public.goals drop column if exists app_user_id;
alter table if exists public.tasks drop column if exists app_user_id;

drop table if exists public.shell_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.app_users cascade;
drop table if exists public.users cascade;

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shell_balance integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shell_transactions (
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

alter table public.goals drop column if exists user_id;
alter table public.goals
  add column user_id uuid references auth.users(id) on delete cascade,
  add column if not exists is_hardcore boolean not null default false,
  add column if not exists staked_shells integer,
  add column if not exists hardcore_settled_at timestamptz,
  add column if not exists hardcore_failed_at timestamptz;

alter table public.tasks drop column if exists user_id;
alter table public.tasks
  add column user_id uuid references auth.users(id) on delete cascade;

create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists shell_transactions_user_id_idx on public.shell_transactions(user_id);
