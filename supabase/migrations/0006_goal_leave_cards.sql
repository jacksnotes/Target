alter table if exists public.goals
  add column if not exists leave_days_used integer not null default 0,
  add column if not exists makeup_used boolean not null default false;

alter table if exists public.shell_transactions
  drop constraint if exists shell_transactions_type_check;

alter table if exists public.shell_transactions
  add constraint shell_transactions_type_check
  check (
    type in (
      'signup_bonus',
      'stake_lock',
      'stake_return',
      'hardcore_reward',
      'stake_burn',
      'purchase_leave_card',
      'purchase_makeup_card',
      'use_leave_card'
    )
  );
