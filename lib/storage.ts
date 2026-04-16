import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal, Task, AppStats, DailyStats, ShellTransaction, ShellWallet, UserInventory } from "./types";
import { supabase } from "./supabase";

const GOALS_KEY = "study_planner_goals";
const STATS_KEY = "study_planner_stats";
const WALLET_KEY = "study_planner_shell_wallet";
const TRANSACTIONS_KEY = "study_planner_shell_transactions";
const INVENTORY_KEY = "study_planner_inventory";

export const SIGNUP_SHELL_BONUS = 100;
export const HARDCORE_STAKE_SHELLS = 100;
export const HARDCORE_REWARD_SHELLS = 10;
export const NORMAL_REWARD_SHELLS = 2;
export const LEAVE_CARD_PRICE = 30;
export const MAKEUP_CARD_PRICE = 50;
export const AI_SPLIT_PACK_PRICE = 10;
export const THEME_PRICE = 50;
export const SOUND_PRICE = 20;
export const INITIAL_FREE_AI_SPLITS = 3;

const DEFAULT_INVENTORY: UserInventory = {
  leaveCards: 0,
  makeupCards: 0,
  hardcoreStreak: 0,
  aiSplitsRemaining: INITIAL_FREE_AI_SPLITS,
  unlockedThemes: [],
  unlockedSounds: [],
  isPremium: false,
};

function getScopedStorageKey(baseKey: string, userId: string | null): string {
  return userId ? `${baseKey}:${userId}` : `${baseKey}:guest`;
}

async function getOptionalAppUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}

export async function getAppUserId(): Promise<string> {
  const userId = await getOptionalAppUserId();
  if (!userId) {
    throw new Error("用户未登录");
  }
  return userId;
}

async function ensureSupabaseUser(): Promise<string> {
  const userId = await getAppUserId();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  const displayName =
    (data.user?.user_metadata?.display_name as string | undefined) ??
    (email ? email.split("@")[0] : null);

  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        leave_cards: 0,
        makeup_cards: 0,
        hardcore_streak: 0,
        ai_splits_remaining: INITIAL_FREE_AI_SPLITS,
        unlocked_themes: [],
        unlocked_sounds: [],
        is_premium: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (profileError) throw profileError;

  const { error: walletError } = await supabase
    .from("wallets")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (walletError) throw walletError;

  return userId;
}

export async function loadGoals(): Promise<Goal[]> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(GOALS_KEY, userId);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const localGoals: Goal[] = raw ? JSON.parse(raw) : [];

    if (!userId) return localGoals;

    const ensuredUserId = await ensureSupabaseUser();
    const { data: dbGoals, error: gErr } = await supabase.from("goals").select("*").eq("user_id", ensuredUserId);
    const { data: dbTasks, error: tErr } = await supabase.from("tasks").select("*").eq("user_id", ensuredUserId);
    if (gErr || tErr) throw gErr || tErr;

    if (dbGoals) {
      const merged: Goal[] = dbGoals.map((g: any) => {
        const localGoal = localGoals.find((item) => item.id === g.id);
        return {
          id: g.id,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: localGoal?.status === "failed" ? "failed" : g.status,
          dueDate: g.deadline ? new Date(g.deadline).getTime() : undefined,
          createdAt: new Date(g.created_at).getTime(),
          updatedAt: localGoal?.updatedAt ?? new Date(g.created_at).getTime(),
          tasks: (dbTasks || []).filter((t: any) => t.goal_id === g.id).map((t: any) => {
            const localTask = localGoal?.tasks.find((item) => item.id === t.id);
            return {
              id: t.id,
              goalId: t.goal_id,
              title: t.title,
              description: t.description,
              completed: t.completed,
              completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
              executionType: t.execution_type,
              payload: t.payload,
              createdAt: new Date(t.created_at).getTime(),
              ...localTask,
            };
          }),
          reminder: localGoal?.reminder,
          isHardcore: g.is_hardcore ?? localGoal?.isHardcore,
          stakedShells: g.staked_shells ?? localGoal?.stakedShells,
          hardcoreSettledAt: g.hardcore_settled_at ? new Date(g.hardcore_settled_at).getTime() : localGoal?.hardcoreSettledAt,
          hardcoreFailedAt: g.hardcore_failed_at ? new Date(g.hardcore_failed_at).getTime() : localGoal?.hardcoreFailedAt,
          leaveDaysUsed: g.leave_days_used ?? localGoal?.leaveDaysUsed ?? 0,
          makeupUsed: g.makeup_used ?? localGoal?.makeupUsed ?? false,
        };
      });

      await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    }

    return localGoals;
  } catch (error) {
    console.error("Supabase load error:", error);
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(GOALS_KEY, userId);
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));

  if (!userId) return;

  try {
    const ensuredUserId = await ensureSupabaseUser();
    const formattedGoals = goals.map((g) => ({
      id: g.id,
      user_id: ensuredUserId,
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      deadline: g.dueDate ? new Date(g.dueDate).toISOString() : null,
      is_hardcore: !!g.isHardcore,
      staked_shells: g.stakedShells ?? null,
      hardcore_settled_at: g.hardcoreSettledAt ? new Date(g.hardcoreSettledAt).toISOString() : null,
      hardcore_failed_at: g.hardcoreFailedAt ? new Date(g.hardcoreFailedAt).toISOString() : null,
      leave_days_used: g.leaveDaysUsed ?? 0,
      makeup_used: !!g.makeupUsed,
    }));

    const formattedTasks = goals.flatMap((g) =>
      g.tasks.map((t) => ({
        id: t.id,
        user_id: ensuredUserId,
        goal_id: t.goalId,
        title: t.title,
        description: t.description,
        completed: t.completed,
        completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        execution_type: t.executionType,
        payload: t.payload,
      }))
    );

    if (formattedGoals.length > 0) {
      await supabase.from("goals").upsert(formattedGoals, { onConflict: "id" });
    }
    if (formattedTasks.length > 0) {
      await supabase.from("tasks").upsert(formattedTasks, { onConflict: "id" });
    }
  } catch (error) {
    console.error("Supabase push error:", error);
  }
}

export async function loadStats(): Promise<AppStats> {
  const storageKey = getScopedStorageKey(STATS_KEY, await getOptionalAppUserId());
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    totalGoals: 0,
    completedGoals: 0,
    totalTasks: 0,
    completedTasks: 0,
    streakDays: 0,
    lastActiveDate: "",
    dailyStats: [],
  };
}

export async function saveStats(stats: AppStats): Promise<void> {
  const storageKey = getScopedStorageKey(STATS_KEY, await getOptionalAppUserId());
  await AsyncStorage.setItem(storageKey, JSON.stringify(stats));
}

export async function loadWallet(): Promise<ShellWallet> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(WALLET_KEY, userId);

  try {
    if (!userId) {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
      return { balance: SIGNUP_SHELL_BONUS };
    }

    const ensuredUserId = await ensureSupabaseUser();
    const { data, error } = await supabase.from("wallets").select("shell_balance").eq("user_id", ensuredUserId).single();
    if (error) throw error;

    const wallet = { balance: data?.shell_balance ?? SIGNUP_SHELL_BONUS };
    await AsyncStorage.setItem(storageKey, JSON.stringify(wallet));
    return wallet;
  } catch (error) {
    console.error("Supabase wallet load error:", error);
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  }

  return { balance: SIGNUP_SHELL_BONUS };
}

export async function saveWallet(wallet: ShellWallet): Promise<void> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(WALLET_KEY, userId);
  await AsyncStorage.setItem(storageKey, JSON.stringify(wallet));

  if (!userId) return;

  try {
    const ensuredUserId = await ensureSupabaseUser();
    const { error } = await supabase
      .from("wallets")
      .upsert({ user_id: ensuredUserId, shell_balance: wallet.balance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  } catch (error) {
    console.error("Supabase wallet save error:", error);
  }
}

export async function loadInventory(): Promise<UserInventory> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(INVENTORY_KEY, userId);

  try {
    if (!userId) {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) return { ...DEFAULT_INVENTORY, ...JSON.parse(raw) };
      return DEFAULT_INVENTORY;
    }

    const ensuredUserId = await ensureSupabaseUser();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("leave_cards, makeup_cards, hardcore_streak, ai_splits_remaining, unlocked_themes, unlocked_sounds, is_premium")
      .eq("user_id", ensuredUserId)
      .single();
    if (error) throw error;

    const inventory: UserInventory = {
      leaveCards: data?.leave_cards ?? 0,
      makeupCards: data?.makeup_cards ?? 0,
      hardcoreStreak: data?.hardcore_streak ?? 0,
      aiSplitsRemaining: data?.ai_splits_remaining ?? INITIAL_FREE_AI_SPLITS,
      unlockedThemes: data?.unlocked_themes ?? [],
      unlockedSounds: data?.unlocked_sounds ?? [],
      isPremium: data?.is_premium ?? false,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(inventory));
    return inventory;
  } catch (error) {
    console.error("Supabase inventory load error:", error);
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return { ...DEFAULT_INVENTORY, ...JSON.parse(raw) };
  }

  return DEFAULT_INVENTORY;
}

export async function saveInventory(inventory: UserInventory): Promise<void> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(INVENTORY_KEY, userId);
  await AsyncStorage.setItem(storageKey, JSON.stringify(inventory));

  if (!userId) return;

  try {
    const ensuredUserId = await ensureSupabaseUser();
    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: ensuredUserId,
          leave_cards: inventory.leaveCards,
          makeup_cards: inventory.makeupCards,
          hardcore_streak: inventory.hardcoreStreak,
          ai_splits_remaining: inventory.aiSplitsRemaining,
          unlocked_themes: inventory.unlockedThemes,
          unlocked_sounds: inventory.unlockedSounds,
          is_premium: inventory.isPremium,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (error) throw error;
  } catch (error) {
    console.error("Supabase inventory save error:", error);
  }
}

export async function loadShellTransactions(): Promise<ShellTransaction[]> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(TRANSACTIONS_KEY, userId);

  try {
    if (!userId) {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
      return [];
    }

    const ensuredUserId = await ensureSupabaseUser();
    const { data, error } = await supabase
      .from("shell_transactions")
      .select("*")
      .eq("user_id", ensuredUserId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (data && data.length > 0) {
      const transactions = data.map((item: any) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        createdAt: new Date(item.created_at).getTime(),
        goalId: item.goal_id ?? undefined,
        note: item.note,
      })) as ShellTransaction[];
      await AsyncStorage.setItem(storageKey, JSON.stringify(transactions));
      return transactions;
    }
  } catch (error) {
    console.error("Supabase transactions load error:", error);
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch {}

  if (!userId) return [];

  const initial: ShellTransaction[] = [
    {
      id: generateId(),
      type: "signup_bonus",
      amount: SIGNUP_SHELL_BONUS,
      createdAt: Date.now(),
      note: "注册启动贝壳",
    },
  ];
  await saveShellTransactions(initial);
  return initial;
}

export async function saveShellTransactions(transactions: ShellTransaction[]): Promise<void> {
  const userId = await getOptionalAppUserId();
  const storageKey = getScopedStorageKey(TRANSACTIONS_KEY, userId);
  await AsyncStorage.setItem(storageKey, JSON.stringify(transactions));

  if (!userId) return;

  try {
    const ensuredUserId = await ensureSupabaseUser();
    const rows = transactions.map((item) => ({
      id: item.id,
      user_id: ensuredUserId,
      type: item.type,
      amount: item.amount,
      goal_id: item.goalId ?? null,
      note: item.note,
      created_at: new Date(item.createdAt).toISOString(),
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("shell_transactions").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
  } catch (error) {
    console.error("Supabase transactions save error:", error);
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export async function deleteGoalFromDb(goalId: string): Promise<void> {
  try {
    const userId = await getAppUserId();
    await supabase.from("tasks").delete().eq("goal_id", goalId).eq("user_id", userId);
    const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase delete goal error:", error);
  }
}

export async function deleteTaskFromDb(taskId: string): Promise<void> {
  try {
    const userId = await getAppUserId();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase delete task error:", error);
  }
}

export function computeStats(goals: Goal[], prevStats: AppStats): AppStats {
  const today = getTodayString();
  const allTasks = goals.flatMap((g) => g.tasks);
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;

  const dailyStats: DailyStats[] = [...prevStats.dailyStats];
  const todayIdx = dailyStats.findIndex((d) => d.date === today);
  const todayGoalTasks = goals.filter((g) => g.status !== "archived").flatMap((g) => g.tasks);
  const todayCompleted = todayGoalTasks.filter(
    (t) => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split("T")[0] === today
  ).length;

  if (todayIdx >= 0) {
    dailyStats[todayIdx] = { date: today, completedTasks: todayCompleted, totalTasks: todayGoalTasks.length };
  } else {
    dailyStats.push({ date: today, completedTasks: todayCompleted, totalTasks: todayGoalTasks.length });
  }

  const sorted = dailyStats.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  let streak = 0;
  const todayDate = new Date(today);
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const stat = sorted.find((s) => s.date === ds);
    if (stat && stat.completedTasks > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    totalGoals: goals.filter((g) => g.status !== "archived" && g.status !== "failed").length,
    completedGoals,
    totalTasks: allTasks.length,
    completedTasks,
    streakDays: streak,
    lastActiveDate: today,
    dailyStats: sorted,
  };
}



