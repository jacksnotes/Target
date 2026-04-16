-- Add new columns for AI splits, premium status, and unlocks to user_profiles
alter table if exists public.user_profiles
  add column if not exists ai_splits_remaining integer not null default 3,
  add column if not exists unlocked_themes text[] not null default '{}',
  add column if not exists unlocked_sounds text[] not null default '{}',
  add column if not exists is_premium boolean not null default false;

-- Update shell_transactions type constraint to include new transaction types
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
      'normal_reward',
      'stake_burn',
      'purchase_leave_card',
      'purchase_makeup_card',
      'purchase_ai_split',
      'purchase_theme',
      'purchase_sound',
      'use_leave_card',
      'use_makeup_card',
      'use_ai_split',
      'membership_bonus'
    )
  );
