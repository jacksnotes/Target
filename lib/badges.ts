import { AppStats, UserInventory } from "./types";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGES: Badge[] = [
  {
    id: "first_blood",
    name: "初级执行者",
    description: "完成 1 个目标",
    icon: "star.fill",
    color: "#eab308",
  },
  {
    id: "hardcore_novice",
    name: "硬核新人",
    description: "达成 1 次硬核连击",
    icon: "flame.fill",
    color: "#ef4444",
  },
  {
    id: "hardcore_master",
    name: "硬核大师",
    description: "达成 10 次硬核连击",
    icon: "trophy.fill",
    color: "#a855f7",
  },
  {
    id: "never_give_up",
    name: "百折不挠",
    description: "使用补签卡复活",
    icon: "heart.fill",
    color: "#ec4899",
  },
  {
    id: "task_master",
    name: "时间支配者",
    description: "累计完成 100 个任务",
    icon: "clock.fill",
    color: "#3b82f6",
  },
  {
    id: "wealthy",
    name: "贝壳富翁",
    description: "累计入账 500 贝壳",
    icon: "sparkles",
    color: "#10b981",
  }
];

export function getUnlockedBadges(stats: AppStats, inventory: UserInventory, makeupUsedCount: number, earnedShells: number): string[] {
  const unlocked = [];
  if (stats.completedGoals >= 1) unlocked.push("first_blood");
  if (inventory.hardcoreStreak >= 1) unlocked.push("hardcore_novice");
  if (inventory.hardcoreStreak >= 10) unlocked.push("hardcore_master");
  if (makeupUsedCount >= 1) unlocked.push("never_give_up");
  if (stats.completedTasks >= 100) unlocked.push("task_master");
  if (earnedShells >= 500) unlocked.push("wealthy");
  return unlocked;
}
