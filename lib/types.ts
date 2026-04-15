export type Priority = "high" | "medium" | "low";

export type GoalStatus = "active" | "completed" | "archived";

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
  enabled: boolean; // 是否启用提醒
  time: string; // HH:mm 格式，如 "09:30"
  soundId?: string; // 通知音效 ID，默认为 "default"
  notificationId?: string; // 后台任务 ID
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: GoalStatus;
  dueDate?: number; // timestamp
  createdAt: number;
  updatedAt: number;
  tasks: Task[];
  reminder?: ReminderConfig; // 每日提醒配置
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
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
