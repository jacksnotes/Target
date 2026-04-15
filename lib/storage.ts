import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal, Task, AppStats, DailyStats } from "./types";
import { supabase } from "./supabase";

const GOALS_KEY = "study_planner_goals";
const STATS_KEY = "study_planner_stats";

export async function loadGoals(): Promise<Goal[]> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    const localGoals = raw ? JSON.parse(raw) : [];
    
    // Fetch goals and tasks from Supabase
    const { data: dbGoals, error: gErr } = await supabase.from("goals").select("*");
    const { data: dbTasks, error: tErr } = await supabase.from("tasks").select("*");
    
    if (gErr || tErr) throw gErr || tErr;

    if (dbGoals) {
      const merged: Goal[] = dbGoals.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        priority: g.priority,
        status: g.status,
        dueDate: g.deadline ? new Date(g.deadline).getTime() : undefined,
        createdAt: new Date(g.created_at).getTime(),
        updatedAt: new Date(g.created_at).getTime(),
        tasks: (dbTasks || []).filter((t: any) => t.goal_id === g.id).map((t: any) => ({
           id: t.id,
           goalId: t.goal_id,
           title: t.title,
           description: t.description,
           completed: t.completed,
           completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
           executionType: t.execution_type,
           payload: t.payload,
           createdAt: new Date(t.created_at).getTime(),
        }))
      }));
      // Overwrite local backup
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(merged));
      return merged;
    }
    return localGoals;
  } catch (error) {
    console.error("Supabase load error:", error);
    // fallback to local if Supabase fails
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  // Always save to AsyncStorage immediately for optimistic UI
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  
  try {
     const formattedGoals = goals.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        priority: g.priority,
        status: g.status,
        deadline: g.dueDate ? new Date(g.dueDate).toISOString() : null,
     }));
     
     const formattedTasks = goals.flatMap(g => g.tasks.map(t => ({
        id: t.id,
        goal_id: t.goalId,
        title: t.title,
        description: t.description,
        completed: t.completed,
        completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        execution_type: t.executionType,
        payload: t.payload,
     })));

     if (formattedGoals.length > 0) {
       await supabase.from("goals").upsert(formattedGoals, { onConflict: 'id' });
     }
     if (formattedTasks.length > 0) {
       await supabase.from("tasks").upsert(formattedTasks, { onConflict: 'id' });
     }
  } catch (err) {
     console.error("Supabase push error:", err);
  }
}

export async function loadStats(): Promise<AppStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
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
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export async function deleteGoalFromDb(goalId: string): Promise<void> {
  try {
    // Delete tasks first due to foreign key constraints if any (Supabase handles cascade usually, but good practice)
    await supabase.from("tasks").delete().eq("goal_id", goalId);
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase delete goal error:", error);
  }
}

export async function deleteTaskFromDb(taskId: string): Promise<void> {
  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
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

  // Update daily stats
  const dailyStats: DailyStats[] = [...prevStats.dailyStats];
  const todayIdx = dailyStats.findIndex((d) => d.date === today);
  const todayGoalTasks = goals
    .filter((g) => g.status !== "archived")
    .flatMap((g) => g.tasks);
  const todayCompleted = todayGoalTasks.filter(
    (t) => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split("T")[0] === today
  ).length;

  if (todayIdx >= 0) {
    dailyStats[todayIdx] = {
      date: today,
      completedTasks: todayCompleted,
      totalTasks: todayGoalTasks.length,
    };
  } else {
    dailyStats.push({
      date: today,
      completedTasks: todayCompleted,
      totalTasks: todayGoalTasks.length,
    });
  }

  // Keep last 30 days
  const sorted = dailyStats.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  // Compute streak
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
    totalGoals: goals.filter((g) => g.status !== "archived").length,
    completedGoals,
    totalTasks: allTasks.length,
    completedTasks,
    streakDays: streak,
    lastActiveDate: today,
    dailyStats: sorted,
  };
}
