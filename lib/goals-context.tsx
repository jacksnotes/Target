import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { Goal, Task, Priority, AppStats } from "./types";
import {
  loadGoals,
  saveGoals,
  loadStats,
  saveStats,
  generateId,
  computeStats,
  deleteGoalFromDb,
  deleteTaskFromDb,
} from "./storage";

interface GoalsState {
  goals: Goal[];
  stats: AppStats;
  loading: boolean;
}

type GoalsAction =
  | { type: "LOAD"; goals: Goal[]; stats: AppStats }
  | { type: "ADD_GOAL"; goal: Goal }
  | { type: "UPDATE_GOAL"; goal: Goal }
  | { type: "DELETE_GOAL"; id: string }
  | { type: "TOGGLE_TASK"; goalId: string; taskId: string }
  | { type: "UPDATE_TASK"; goalId: string; taskId: string; updates: Partial<Task> }
  | { type: "ADD_TASK"; goalId: string; task: Task }
  | { type: "DELETE_TASK"; goalId: string; taskId: string }
  | { type: "COMPLETE_TASK"; goalId: string; taskId: string }
  | { type: "UPDATE_STATS"; stats: AppStats };

function reducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case "LOAD":
      return { ...state, goals: action.goals, stats: action.stats, loading: false };

    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.goal] };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goal.id ? action.goal : g)),
      };

    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };

    case "TOGGLE_TASK": {
      const goals = state.goals.map((g) => {
        if (g.id !== action.goalId) return g;
        const tasks = g.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          
          // Block manual toggle for all learning tasks (must be completed via study screen)
          const isLearningTask = isTaskExecutionRequired(t);
          if (isLearningTask) {
            return t; 
          }

          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? Date.now() : undefined,
          };
        });

        const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
        return {
          ...g,
          tasks,
          status: allDone ? ("completed" as const) : g.status === "completed" ? ("active" as const) : g.status,
          updatedAt: Date.now(),
        };
      });
      return { ...state, goals };
    }

    case "UPDATE_TASK": {
      const goals = state.goals.map((g) => {
        if (g.id !== action.goalId) return g;
        const tasks = g.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.updates } : t
        );
        return { ...g, tasks, updatedAt: Date.now() };
      });
      return { ...state, goals };
    }

    case "ADD_TASK":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? { ...g, tasks: [...g.tasks, action.task], updatedAt: Date.now() }
            : g
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? { ...g, tasks: g.tasks.filter((t) => t.id !== action.taskId), updatedAt: Date.now() }
            : g
        ),
      };

    case "COMPLETE_TASK": {
      const goals = state.goals.map((g) => {
        if (g.id !== action.goalId) return g;
        const tasks = g.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          return {
            ...t,
            completed: true,
            completedAt: Date.now(),
          };
        });

        const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
        return {
          ...g,
          tasks,
          status: allDone ? ("completed" as const) : g.status === "completed" ? ("active" as const) : g.status,
          updatedAt: Date.now(),
        };
      });
      return { ...state, goals };
    }

    case "UPDATE_STATS":
      return { ...state, stats: action.stats };

    default:
      return state;
  }
}


function isTaskExecutionRequired(task: { title?: string; description?: string; executionType?: string }) {
  if (task.executionType && task.executionType !== "checklist") return true;
  const text = `${task.title ?? ""} ${task.description ?? ""}`;
  return /\u9519\u8bef|\u9519\u9898|\u590d\u76d8|\u5206\u6790/.test(text);
}
interface GoalsContextValue {
  state: GoalsState;
  addGoal: (title: string, description: string, priority: Priority, dueDate?: number, tasks?: Partial<Task>[]) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleTask: (goalId: string, taskId: string) => void;
  updateTask: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  addTask: (goalId: string, title: string) => void;
  deleteTask: (goalId: string, taskId: string) => void;
  completeTask: (goalId: string, taskId: string) => void;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    goals: [],
    stats: {
      totalGoals: 0,
      completedGoals: 0,
      totalTasks: 0,
      completedTasks: 0,
      streakDays: 0,
      lastActiveDate: "",
      dailyStats: [],
    },
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const [goals, stats] = await Promise.all([loadGoals(), loadStats()]);
      dispatch({ type: "LOAD", goals, stats });
    })();
  }, []);

  // Persist goals whenever they change
  useEffect(() => {
    if (!state.loading) {
      saveGoals(state.goals);
      const newStats = computeStats(state.goals, state.stats);
      saveStats(newStats);
      dispatch({ type: "UPDATE_STATS", stats: newStats });
    }
  }, [state.goals]);

  const addGoal = useCallback(
    (title: string, description: string, priority: Priority, dueDate?: number, initialTasks?: Partial<Task>[]) => {
      const goalId = generateId();
      const tasks: Task[] = (initialTasks || []).map((t) => ({
        id: generateId(),
        goalId,
        title: t.title || "Untitled Task",
        description: t.description,
        executionType: t.executionType,
        payload: t.payload,
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
      };
      dispatch({ type: "ADD_GOAL", goal });
      return goalId;
    },
    []
  );

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    const goal = state.goals.find((g) => g.id === id);
    if (goal) {
      dispatch({ type: "UPDATE_GOAL", goal: { ...goal, ...updates, updatedAt: Date.now() } });
    }
  }, [state.goals]);

  const deleteGoal = useCallback((id: string) => {
    dispatch({ type: "DELETE_GOAL", id });
    deleteGoalFromDb(id);
  }, []);

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

  return (
    <GoalsContext.Provider
      value={{ state, addGoal, updateGoal, deleteGoal, toggleTask, updateTask, addTask, deleteTask, completeTask }}
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
