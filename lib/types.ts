export type Priority = "high" | "medium" | "low";

export type GoalStatus = "active" | "completed" | "archived" | "failed";

export type ExecutionType = "flashcard" | "reading" | "coding" | "checklist" | "quiz" | "practice";

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  executionType?: ExecutionType;
  payload?: any;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface ReminderConfig {
  enabled: boolean;
  time: string;
  soundId?: string;
  notificationId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: GoalStatus;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  tasks: Task[];
  reminder?: ReminderConfig;
  isHardcore?: boolean;
  stakedShells?: number;
  hardcoreSettledAt?: number;
  hardcoreFailedAt?: number;
  leaveDaysUsed?: number;
  makeupUsed?: boolean;
}

export type ShellTransactionType =
  | "signup_bonus"
  | "stake_lock"
  | "stake_return"
  | "hardcore_reward"
  | "normal_reward"
  | "stake_burn"
  | "purchase_leave_card"
  | "purchase_makeup_card"
  | "purchase_ai_split"
  | "purchase_theme"
  | "purchase_sound"
  | "use_leave_card"
  | "use_makeup_card"
  | "use_ai_split"
  | "membership_bonus";

export interface ShellTransaction {
  id: string;
  type: ShellTransactionType;
  amount: number;
  createdAt: number;
  goalId?: string;
  note: string;
}

export interface ShellWallet {
  balance: number;
}

export interface UserInventory {
  leaveCards: number;
  makeupCards: number;
  hardcoreStreak: number;
  aiSplitsRemaining: number;
  unlockedThemes: string[];
  unlockedSounds: string[];
  isPremium: boolean;
}

export interface DailyStats {
  date: string;
  completedTasks: number;
  totalTasks: number;
}

export interface AppStats {
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  streakDays: number;
  lastActiveDate: string;
  dailyStats: DailyStats[];
}
