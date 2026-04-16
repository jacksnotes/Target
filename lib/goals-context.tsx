import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { Goal, Task, Priority, AppStats, ShellTransaction, ShellWallet, UserInventory } from "./types";
import {
  loadGoals,
  saveGoals,
  loadStats,
  saveStats,
  loadWallet,
  saveWallet,
  loadShellTransactions,
  saveShellTransactions,
  loadInventory,
  saveInventory,
  generateId,
  computeStats,
  deleteGoalFromDb,
  deleteTaskFromDb,
  HARDCORE_REWARD_SHELLS,
  HARDCORE_STAKE_SHELLS,
  NORMAL_REWARD_SHELLS,
  LEAVE_CARD_PRICE,
  MAKEUP_CARD_PRICE,
  AI_SPLIT_PACK_PRICE,
  THEME_PRICE,
  SOUND_PRICE,
} from "./storage";
import { isTaskExecutionRequired } from "./task-execution";
import { useSupabaseAuth } from "./auth-context";

interface GoalsState {
  goals: Goal[];
  stats: AppStats;
  wallet: ShellWallet;
  transactions: ShellTransaction[];
  inventory: UserInventory;
  loading: boolean;
}

type PurchaseItemType = "leave_card" | "makeup_card" | "ai_split_pack" | "theme" | "sound";

type GoalsAction =
  | {
      type: "LOAD";
      goals: Goal[];
      stats: AppStats;
      wallet: ShellWallet;
      transactions: ShellTransaction[];
      inventory: UserInventory;
    }
  | { type: "ADD_GOAL"; goal: Goal }
  | { type: "UPDATE_GOAL"; goal: Goal }
  | { type: "DELETE_GOAL"; id: string }
  | { type: "FAIL_HARDCORE_GOAL"; id: string }
  | { type: "TOGGLE_TASK"; goalId: string; taskId: string }
  | { type: "UPDATE_TASK"; goalId: string; taskId: string; updates: Partial<Task> }
  | { type: "ADD_TASK"; goalId: string; task: Task }
  | { type: "DELETE_TASK"; goalId: string; taskId: string }
  | { type: "COMPLETE_TASK"; goalId: string; taskId: string }
  | { type: "UPDATE_STATS"; stats: AppStats }
  | { type: "PURCHASE_ITEM"; itemType: PurchaseItemType; extraId?: string }
  | { type: "USE_LEAVE_CARD"; goalId: string }
  | { type: "USE_MAKEUP_CARD"; goalId: string }
  | { type: "USE_AI_SPLIT" };

const INITIAL_STATS: AppStats = {
  totalGoals: 0,
  completedGoals: 0,
  totalTasks: 0,
  completedTasks: 0,
  streakDays: 0,
  lastActiveDate: "",
  dailyStats: [],
};

const INITIAL_INVENTORY: UserInventory = {
  leaveCards: 0,
  makeupCards: 0,
  hardcoreStreak: 0,
  aiSplitsRemaining: 3,
  unlockedThemes: [],
  unlockedSounds: [],
  isPremium: false,
};

function settleGoalIfNeeded(goal: Goal, tasks: Task[], now: number) {
  const allDone = tasks.length > 0 && tasks.every((task) => task.completed);
  const shouldSettleHardcore = allDone && goal.isHardcore && !goal.hardcoreSettledAt;
  const newTransactions: ShellTransaction[] = [];
  let walletDelta = 0;
  let hardcoreStreakDelta = 0;

  const updatedGoal: Goal = {
    ...goal,
    tasks,
    status: allDone ? "completed" : goal.status === "completed" ? "active" : goal.status,
    hardcoreSettledAt: shouldSettleHardcore ? now : goal.hardcoreSettledAt,
    updatedAt: now,
  };

  if (shouldSettleHardcore) {
    const stake = goal.stakedShells ?? HARDCORE_STAKE_SHELLS;
    walletDelta += stake + HARDCORE_REWARD_SHELLS;
    hardcoreStreakDelta += 1;
    newTransactions.push(
      {
        id: generateId(),
        type: "stake_return",
        amount: stake,
        createdAt: now,
        goalId: goal.id,
        note: `硬核目标完成，返还承诺金：${goal.title}`,
      },
      {
        id: generateId(),
        type: "hardcore_reward",
        amount: HARDCORE_REWARD_SHELLS,
        createdAt: now,
        goalId: goal.id,
        note: `硬核目标完成奖励：${goal.title}`,
      }
    );
  } else if (allDone && !goal.isHardcore && goal.status !== "completed") {
    walletDelta += NORMAL_REWARD_SHELLS;
    newTransactions.push({
      id: generateId(),
      type: "normal_reward",
      amount: NORMAL_REWARD_SHELLS,
      createdAt: now,
      goalId: goal.id,
      note: `普通目标完成奖励：${goal.title}`,
    });
  }

  return { updatedGoal, newTransactions, walletDelta, hardcoreStreakDelta };
}

function reducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case "LOAD":
      return {
        goals: action.goals,
        stats: action.stats,
        wallet: action.wallet,
        transactions: action.transactions,
        inventory: action.inventory,
        loading: false,
      };

    case "ADD_GOAL":
      if (!action.goal.isHardcore) {
        return { ...state, goals: [...state.goals, action.goal] };
      }
      return {
        ...state,
        goals: [...state.goals, action.goal],
        wallet: { balance: state.wallet.balance - (action.goal.stakedShells ?? HARDCORE_STAKE_SHELLS) },
        transactions: [
          {
            id: generateId(),
            type: "stake_lock",
            amount: -(action.goal.stakedShells ?? HARDCORE_STAKE_SHELLS),
            createdAt: Date.now(),
            goalId: action.goal.id,
            note: `硬核目标承诺金：${action.goal.title}`,
          },
          ...state.transactions,
        ],
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) => (goal.id === action.goal.id ? action.goal : goal)),
      };

    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.id) };

    case "FAIL_HARDCORE_GOAL": {
      const goal = state.goals.find((item) => item.id === action.id);
      if (!goal || !goal.isHardcore || goal.status === "completed" || goal.hardcoreFailedAt) {
        return state;
      }
      const burned = goal.stakedShells ?? HARDCORE_STAKE_SHELLS;
      return {
        ...state,
        goals: state.goals.map((item) =>
          item.id === action.id
            ? {
                ...item,
                status: "failed",
                hardcoreFailedAt: Date.now(),
                hardcoreSettledAt: Date.now(),
                updatedAt: Date.now(),
              }
            : item
        ),
        inventory: { ...state.inventory, hardcoreStreak: 0 },
        transactions: [
          {
            id: generateId(),
            type: "stake_burn",
            amount: 0,
            createdAt: Date.now(),
            goalId: goal.id,
            note: `硬核目标失败，承诺金 ${burned} 贝壳已销毁：${goal.title}`,
          },
          ...state.transactions,
        ],
      };
    }

    case "TOGGLE_TASK": {
      let walletDelta = 0;
      let hardcoreStreakDelta = 0;
      const newTransactions: ShellTransaction[] = [];
      const now = Date.now();
      const goals = state.goals.map((goal) => {
        if (goal.id !== action.goalId) return goal;
        const tasks = goal.tasks.map((task) => {
          if (task.id !== action.taskId) return task;
          if (isTaskExecutionRequired(task)) return task;
          const completed = !task.completed;
          return { ...task, completed, completedAt: completed ? now : undefined };
        });
        const settled = settleGoalIfNeeded(goal, tasks, now);
        walletDelta += settled.walletDelta;
        hardcoreStreakDelta += settled.hardcoreStreakDelta;
        newTransactions.push(...settled.newTransactions);
        return settled.updatedGoal;
      });
      return {
        ...state,
        goals,
        wallet: { balance: state.wallet.balance + walletDelta },
        inventory:
          hardcoreStreakDelta > 0
            ? { ...state.inventory, hardcoreStreak: state.inventory.hardcoreStreak + hardcoreStreakDelta }
            : state.inventory,
        transactions: newTransactions.length > 0 ? [...newTransactions, ...state.transactions] : state.transactions,
      };
    }

    case "UPDATE_TASK": {
      const goals = state.goals.map((goal) => {
        if (goal.id !== action.goalId) return goal;
        return {
          ...goal,
          tasks: goal.tasks.map((task) => (task.id === action.taskId ? { ...task, ...action.updates } : task)),
          updatedAt: Date.now(),
        };
      });
      return { ...state, goals };
    }

    case "ADD_TASK":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.goalId
            ? { ...goal, tasks: [...goal.tasks, action.task], updatedAt: Date.now() }
            : goal
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.goalId
            ? { ...goal, tasks: goal.tasks.filter((task) => task.id !== action.taskId), updatedAt: Date.now() }
            : goal
        ),
      };

    case "COMPLETE_TASK": {
      let walletDelta = 0;
      let hardcoreStreakDelta = 0;
      const newTransactions: ShellTransaction[] = [];
      const now = Date.now();
      const goals = state.goals.map((goal) => {
        if (goal.id !== action.goalId) return goal;
        const tasks = goal.tasks.map((task) =>
          task.id === action.taskId ? { ...task, completed: true, completedAt: now } : task
        );
        const settled = settleGoalIfNeeded(goal, tasks, now);
        walletDelta += settled.walletDelta;
        hardcoreStreakDelta += settled.hardcoreStreakDelta;
        newTransactions.push(...settled.newTransactions);
        return settled.updatedGoal;
      });
      return {
        ...state,
        goals,
        wallet: { balance: state.wallet.balance + walletDelta },
        inventory:
          hardcoreStreakDelta > 0
            ? { ...state.inventory, hardcoreStreak: state.inventory.hardcoreStreak + hardcoreStreakDelta }
            : state.inventory,
        transactions: newTransactions.length > 0 ? [...newTransactions, ...state.transactions] : state.transactions,
      };
    }

    case "UPDATE_STATS":
      return { ...state, stats: action.stats };

    case "PURCHASE_ITEM": {
      let price = 0;
      let note = "";
      let txType: any = "";
      const inventory = { ...state.inventory };

      switch (action.itemType) {
        case "leave_card":
          price = LEAVE_CARD_PRICE;
          note = "兑换请假卡";
          txType = "purchase_leave_card";
          inventory.leaveCards += 1;
          break;
        case "makeup_card":
          price = MAKEUP_CARD_PRICE;
          note = "兑换补签卡";
          txType = "purchase_makeup_card";
          inventory.makeupCards += 1;
          break;
        case "ai_split_pack":
          price = AI_SPLIT_PACK_PRICE;
          note = "兑换 AI 拆分次数包 (5回)";
          txType = "purchase_ai_split";
          inventory.aiSplitsRemaining += 5;
          break;
        case "theme":
          price = THEME_PRICE;
          note = `解锁主题: ${action.extraId}`;
          txType = "purchase_theme";
          if (action.extraId && !inventory.unlockedThemes.includes(action.extraId)) {
            inventory.unlockedThemes = [...inventory.unlockedThemes, action.extraId];
          }
          break;
        case "sound":
          price = SOUND_PRICE;
          note = `解锁铃声: ${action.extraId}`;
          txType = "purchase_sound";
          if (action.extraId && !inventory.unlockedSounds.includes(action.extraId)) {
            inventory.unlockedSounds = [...inventory.unlockedSounds, action.extraId];
          }
          break;
      }

      return {
        ...state,
        wallet: { balance: state.wallet.balance - price },
        inventory,
        transactions: [
          {
            id: generateId(),
            type: txType,
            amount: -price,
            createdAt: Date.now(),
            note,
          },
          ...state.transactions,
        ],
      };
    }

    case "USE_AI_SPLIT": {
      return {
        ...state,
        inventory: {
          ...state.inventory,
          aiSplitsRemaining: Math.max(0, state.inventory.aiSplitsRemaining - 1),
        },
      };
    }

    case "USE_LEAVE_CARD": {
      const goal = state.goals.find((item) => item.id === action.goalId);
      if (!goal || !goal.isHardcore || goal.status !== "active" || !goal.dueDate || state.inventory.leaveCards <= 0) {
        return state;
      }
      const now = Date.now();
      return {
        ...state,
        goals: state.goals.map((item) =>
          item.id === action.goalId
            ? {
                ...item,
                dueDate: item.dueDate ? item.dueDate + 24 * 60 * 60 * 1000 : item.dueDate,
                leaveDaysUsed: (item.leaveDaysUsed ?? 0) + 1,
                updatedAt: now,
              }
            : item
        ),
        inventory: {
          ...state.inventory,
          leaveCards: Math.max(0, state.inventory.leaveCards - 1),
        },
        transactions: [
          {
            id: generateId(),
            type: "use_leave_card",
            amount: 0,
            createdAt: now,
            goalId: action.goalId,
            note: `使用请假卡，目标顺延 1 天：${goal.title}`,
          },
          ...state.transactions,
        ],
      };
    }

    case "USE_MAKEUP_CARD": {
      const goal = state.goals.find((item) => item.id === action.goalId);
      if (!goal || !goal.isHardcore || goal.status !== "failed" || state.inventory.makeupCards <= 0 || goal.makeupUsed) {
        return state;
      }
      const now = Date.now();
      return {
        ...state,
        goals: state.goals.map((item) =>
          item.id === action.goalId
            ? {
                ...item,
                status: "active",
                dueDate: now + 24 * 60 * 60 * 1000,
                makeupUsed: true,
                hardcoreFailedAt: undefined,
                hardcoreSettledAt: undefined,
                updatedAt: now,
              }
            : item
        ),
        inventory: {
          ...state.inventory,
          makeupCards: Math.max(0, state.inventory.makeupCards - 1),
        },
        transactions: [
          {
            id: generateId(),
            type: "use_makeup_card",
            amount: 0,
            createdAt: now,
            goalId: action.goalId,
            note: `使用补签卡，目标恢复并顺延：${goal.title}`,
          },
          ...state.transactions,
        ],
      };
    }

    default:
      return state;
  }
}

interface GoalsContextValue {
  state: GoalsState;
  addGoal: (
    title: string,
    description: string,
    priority: Priority,
    dueDate?: number,
    tasks?: Partial<Task>[],
    options?: { isHardcore?: boolean; stakedShells?: number }
  ) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleTask: (goalId: string, taskId: string) => void;
  updateTask: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  addTask: (goalId: string, title: string) => void;
  deleteTask: (goalId: string, taskId: string) => void;
  completeTask: (goalId: string, taskId: string) => void;
  purchaseInventoryItem: (itemType: PurchaseItemType, extraId?: string) => { ok: boolean; message?: string };
  useLeaveCard: (goalId: string) => { ok: boolean; message?: string };
  useMakeupCard: (goalId: string) => { ok: boolean; message?: string };
  consumeAiSplit: () => void;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useSupabaseAuth();
  const [state, dispatch] = useReducer(reducer, {
    goals: [],
    stats: INITIAL_STATS,
    wallet: { balance: 0 },
    transactions: [],
    inventory: INITIAL_INVENTORY,
    loading: true,
  });

  useEffect(() => {
    if (authLoading || !session) return;

    let cancelled = false;
    (async () => {
      const [goals, stats, wallet, transactions, inventory] = await Promise.all([
        loadGoals(),
        loadStats(),
        loadWallet(),
        loadShellTransactions(),
        loadInventory(),
      ]);
      if (!cancelled) {
        dispatch({ type: "LOAD", goals, stats, wallet, transactions, inventory });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.user.id]);

  useEffect(() => {
    if (authLoading || !session || state.loading) return;
    saveGoals(state.goals);
    const newStats = computeStats(state.goals, state.stats);
    saveStats(newStats);
    dispatch({ type: "UPDATE_STATS", stats: newStats });
  }, [authLoading, session, state.goals]);

  useEffect(() => {
    if (authLoading || !session || state.loading) return;
    saveWallet(state.wallet);
    saveShellTransactions(state.transactions);
    saveInventory(state.inventory);
  }, [authLoading, session, state.wallet, state.transactions, state.inventory, state.loading]);

  useEffect(() => {
    if (authLoading || !session || state.loading) return;
    state.goals.forEach((goal) => {
      if (goal.isHardcore && goal.status === "active" && goal.dueDate && goal.dueDate < Date.now() && !goal.hardcoreSettledAt) {
        dispatch({ type: "FAIL_HARDCORE_GOAL", id: goal.id });
      }
    });
  }, [authLoading, session, state.goals, state.loading]);

  const addGoal = useCallback(
    (
      title: string,
      description: string,
      priority: Priority,
      dueDate?: number,
      initialTasks?: Partial<Task>[],
      options?: { isHardcore?: boolean; stakedShells?: number }
    ) => {
      const goalId = generateId();
      const tasks: Task[] = (initialTasks || []).map((task) => ({
        id: generateId(),
        goalId,
        title: task.title || "Untitled Task",
        description: task.description,
        executionType: task.executionType,
        payload: task.payload,
        completed: false,
        createdAt: Date.now(),
      }));
      const goal: Goal = {
        id: goalId,
        title,
        description,
        priority,
        status: "active",
        dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tasks,
        isHardcore: options?.isHardcore,
        stakedShells: options?.isHardcore ? options.stakedShells ?? HARDCORE_STAKE_SHELLS : undefined,
      };
      dispatch({ type: "ADD_GOAL", goal });
      return goalId;
    },
    []
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      const goal = state.goals.find((item) => item.id === id);
      if (goal) {
        dispatch({ type: "UPDATE_GOAL", goal: { ...goal, ...updates, updatedAt: Date.now() } });
      }
    },
    [state.goals]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const goal = state.goals.find((item) => item.id === id);
      if (goal?.isHardcore && goal.status === "active") {
        dispatch({ type: "FAIL_HARDCORE_GOAL", id });
        return;
      }
      dispatch({ type: "DELETE_GOAL", id });
      deleteGoalFromDb(id);
    },
    [state.goals]
  );

  const toggleTask = useCallback((goalId: string, taskId: string) => {
    dispatch({ type: "TOGGLE_TASK", goalId, taskId });
  }, []);

  const updateTask = useCallback((goalId: string, taskId: string, updates: Partial<Task>) => {
    dispatch({ type: "UPDATE_TASK", goalId, taskId, updates });
  }, []);

  const addTask = useCallback((goalId: string, title: string) => {
    const task: Task = {
      id: generateId(),
      goalId,
      title,
      completed: false,
      createdAt: Date.now(),
    };
    dispatch({ type: "ADD_TASK", goalId, task });
  }, []);

  const deleteTask = useCallback((goalId: string, taskId: string) => {
    dispatch({ type: "DELETE_TASK", goalId, taskId });
    deleteTaskFromDb(taskId);
  }, []);

  const completeTask = useCallback((goalId: string, taskId: string) => {
    dispatch({ type: "COMPLETE_TASK", goalId, taskId });
  }, []);

  const purchaseInventoryItem = useCallback(
    (itemType: PurchaseItemType, extraId?: string) => {
      let price = 0;
      switch (itemType) {
        case "leave_card": price = LEAVE_CARD_PRICE; break;
        case "makeup_card": price = MAKEUP_CARD_PRICE; break;
        case "ai_split_pack": price = AI_SPLIT_PACK_PRICE; break;
        case "theme": price = THEME_PRICE; break;
        case "sound": price = SOUND_PRICE; break;
      }
      
      if (state.wallet.balance < price) {
        return { ok: false, message: `贝壳不足，需要 ${price} 贝壳` };
      }
      
      if (itemType === "theme" && extraId && state.inventory.unlockedThemes.includes(extraId)) {
        return { ok: false, message: "该主题已解锁" };
      }
      if (itemType === "sound" && extraId && state.inventory.unlockedSounds.includes(extraId)) {
        return { ok: false, message: "该铃声已解锁" };
      }

      dispatch({ type: "PURCHASE_ITEM", itemType, extraId });
      return { ok: true };
    },
    [state.wallet.balance, state.inventory.unlockedThemes, state.inventory.unlockedSounds]
  );

  const consumeAiSplit = useCallback(() => {
    dispatch({ type: "USE_AI_SPLIT" });
  }, []);

  const useLeaveCard = useCallback(
    (goalId: string) => {
      const goal = state.goals.find((item) => item.id === goalId);
      if (!goal || !goal.isHardcore) {
        return { ok: false, message: "仅硬核目标可使用请假卡" };
      }
      if (goal.status !== "active") {
        return { ok: false, message: "当前目标状态不可使用请假卡" };
      }
      if (!goal.dueDate) {
        return { ok: false, message: "未设置截止时间的目标不能使用请假卡" };
      }
      if (state.inventory.leaveCards <= 0) {
        return { ok: false, message: "你还没有请假卡" };
      }
      dispatch({ type: "USE_LEAVE_CARD", goalId });
      return { ok: true };
    },
    [state.goals, state.inventory.leaveCards]
  );

  const useMakeupCard = useCallback(
    (goalId: string) => {
      const goal = state.goals.find((item) => item.id === goalId);
      if (!goal || !goal.isHardcore) {
        return { ok: false, message: "仅硬核目标可使用补签卡" };
      }
      if (goal.status !== "failed") {
        return { ok: false, message: "仅在逾期失败后可使用补签卡" };
      }
      if (goal.makeupUsed) {
        return { ok: false, message: "该目标已被补签过，仅限补一次" };
      }
      if (state.inventory.makeupCards <= 0) {
        return { ok: false, message: "你还没有补签卡" };
      }
      dispatch({ type: "USE_MAKEUP_CARD", goalId });
      return { ok: true };
    },
    [state.goals, state.inventory.makeupCards]
  );

  return (
    <GoalsContext.Provider
      value={{
        state,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleTask,
        updateTask,
        addTask,
        deleteTask,
        completeTask,
        purchaseInventoryItem,
        useLeaveCard,
        useMakeupCard,
        consumeAiSplit,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
