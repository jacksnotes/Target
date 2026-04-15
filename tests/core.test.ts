import { describe, it, expect } from "vitest";
import { computeStats, generateId, getTodayString } from "../lib/storage";
import { Goal, AppStats } from "../lib/types";

const emptyStats: AppStats = {
  totalGoals: 0,
  completedGoals: 0,
  totalTasks: 0,
  completedTasks: 0,
  streakDays: 0,
  lastActiveDate: "",
  dailyStats: [],
};

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: generateId(),
    title: "Test Goal",
    description: "",
    priority: "medium",
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tasks: [],
    ...overrides,
  };
}

describe("generateId", () => {
  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("should contain underscore separator", () => {
    const id = generateId();
    expect(id).toContain("_");
  });
});

describe("getTodayString", () => {
  it("should return YYYY-MM-DD format", () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should match current date", () => {
    const today = getTodayString();
    const now = new Date().toISOString().split("T")[0];
    expect(today).toBe(now);
  });
});

describe("computeStats", () => {
  it("should count active goals correctly", () => {
    const goals: Goal[] = [
      makeGoal({ status: "active" }),
      makeGoal({ status: "active" }),
      makeGoal({ status: "completed" }),
      makeGoal({ status: "archived" }),
    ];
    const stats = computeStats(goals, emptyStats);
    expect(stats.totalGoals).toBe(3); // active + completed, not archived
    expect(stats.completedGoals).toBe(1);
  });

  it("should count tasks correctly", () => {
    const goal = makeGoal({
      tasks: [
        { id: "1", goalId: "g1", title: "Task 1", completed: true, createdAt: Date.now(), completedAt: Date.now() },
        { id: "2", goalId: "g1", title: "Task 2", completed: false, createdAt: Date.now() },
        { id: "3", goalId: "g1", title: "Task 3", completed: true, createdAt: Date.now(), completedAt: Date.now() },
      ],
    });
    const stats = computeStats([goal], emptyStats);
    expect(stats.totalTasks).toBe(3);
    expect(stats.completedTasks).toBe(2);
  });

  it("should keep last 30 days of daily stats", () => {
    // Create 35 days of stats
    const oldStats: AppStats = {
      ...emptyStats,
      dailyStats: Array.from({ length: 35 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (34 - i));
        return {
          date: d.toISOString().split("T")[0],
          completedTasks: 1,
          totalTasks: 2,
        };
      }),
    };
    const stats = computeStats([], oldStats);
    expect(stats.dailyStats.length).toBeLessThanOrEqual(30);
  });

  it("should compute streak for consecutive days", () => {
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const statsWithStreak: AppStats = {
      ...emptyStats,
      dailyStats: [
        { date: yesterdayStr, completedTasks: 2, totalTasks: 3 },
        { date: today, completedTasks: 1, totalTasks: 2 },
      ],
    };

    // Create a goal with a task completed today
    const goal = makeGoal({
      tasks: [
        {
          id: "t1",
          goalId: "g1",
          title: "Task",
          completed: true,
          createdAt: Date.now(),
          completedAt: Date.now(),
        },
      ],
    });

    const stats = computeStats([goal], statsWithStreak);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });

  it("should return 0 streak when no tasks completed today", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

    const statsWithGap: AppStats = {
      ...emptyStats,
      dailyStats: [
        { date: twoDaysAgoStr, completedTasks: 2, totalTasks: 3 },
      ],
    };

    const stats = computeStats([], statsWithGap);
    expect(stats.streakDays).toBe(0);
  });
});
