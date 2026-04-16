-- Supabase Auth RLS policies.
-- All business rows are owned by auth.uid(); anon users cannot read or write app data.

alter table public.user_profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.shell_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;

-- Remove temporary open client policies if they were ever applied.
drop policy if exists "client_select_profiles" on public.user_profiles;
drop policy if exists "client_insert_profiles" on public.user_profiles;
drop policy if exists "client_update_profiles" on public.user_profiles;
drop policy if exists "client_select_wallets" on public.wallets;
drop policy if exists "client_insert_wallets" on public.wallets;
drop policy if exists "client_update_wallets" on public.wallets;
drop policy if exists "client_select_shell_transactions" on public.shell_transactions;
drop policy if exists "client_insert_shell_transactions" on public.shell_transactions;
drop policy if exists "client_update_shell_transactions" on public.shell_transactions;
drop policy if exists "client_select_goals" on public.goals;
drop policy if exists "client_insert_goals" on public.goals;
drop policy if exists "client_update_goals" on public.goals;
drop policy if exists "client_delete_goals" on public.goals;
drop policy if exists "client_select_tasks" on public.tasks;
drop policy if exists "client_insert_tasks" on public.tasks;
drop policy if exists "client_update_tasks" on public.tasks;
drop policy if exists "client_delete_tasks" on public.tasks;

-- Profiles
drop policy if exists "profiles_select_own" on public.user_profiles;
drop policy if exists "profiles_insert_own" on public.user_profiles;
drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_select_own" on public.user_profiles for select to authenticated using (user_id = auth.uid());
create policy "profiles_insert_own" on public.user_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profiles_update_own" on public.user_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Wallets
drop policy if exists "wallets_select_own" on public.wallets;
drop policy if exists "wallets_insert_own" on public.wallets;
drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select to authenticated using (user_id = auth.uid());
create policy "wallets_insert_own" on public.wallets for insert to authenticated with check (user_id = auth.uid());
create policy "wallets_update_own" on public.wallets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Shell transactions
drop policy if exists "shell_transactions_select_own" on public.shell_transactions;
drop policy if exists "shell_transactions_insert_own" on public.shell_transactions;
drop policy if exists "shell_transactions_update_own" on public.shell_transactions;
create policy "shell_transactions_select_own" on public.shell_transactions for select to authenticated using (user_id = auth.uid());
create policy "shell_transactions_insert_own" on public.shell_transactions for insert to authenticated with check (user_id = auth.uid());
create policy "shell_transactions_update_own" on public.shell_transactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Goals
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_select_own" on public.goals for select to authenticated using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals for insert to authenticated with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals for delete to authenticated using (user_id = auth.uid());

-- Tasks
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (user_id = auth.uid());
create policy "tasks_update_own" on public.tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (user_id = auth.uid());
