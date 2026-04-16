import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GoalCard } from "@/components/goal-card";
import { EmptyState } from "@/components/empty-state";
import { ProgressRing } from "@/components/progress-ring";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "深夜好";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useGoals();

  const activeGoals = useMemo(
    () => state.goals.filter((g) => g.status === "active").slice(0, 3),
    [state.goals]
  );

  const todayTasks = useMemo(() => {
    return state.goals
      .filter((g) => g.status === "active")
      .flatMap((g) => g.tasks.map((t) => ({ ...t, goalTitle: g.title, goalId: g.id })))
      .filter((t) => !t.completed)
      .slice(0, 5);
  }, [state.goals]);

  const todayCompleted = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.goals
      .flatMap((g) => g.tasks)
      .filter(
        (t) =>
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt).toISOString().split("T")[0] === today
      ).length;
  }, [state.goals]);

  const totalActiveTasks = useMemo(
    () =>
      state.goals
        .filter((g) => g.status === "active")
        .flatMap((g) => g.tasks).length,
    [state.goals]
  );

  const completedActiveTasks = useMemo(
    () =>
      state.goals
        .filter((g) => g.status === "active")
        .flatMap((g) => g.tasks)
        .filter((t) => t.completed).length,
    [state.goals]
  );

  const overallProgress =
    totalActiveTasks > 0 ? completedActiveTasks / totalActiveTasks : 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              学习计划
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push("/wallet")}
              style={({ pressed }) => [
                styles.walletBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <IconSymbol name="wallet.pass.fill" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/goal/create")}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <IconSymbol name="plus" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: colors.primary }]}>
          <View style={styles.overviewLeft}>
            <Text style={styles.overviewTitle}>整体进度</Text>
            <Text style={styles.overviewSubtitle}>
              {state.stats.totalGoals} 个目标 · {completedActiveTasks}/{totalActiveTasks} 任务
            </Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStatItem}>
                <Text style={styles.overviewStatNum}>
                  {state.stats.streakDays}
                </Text>
                <Text style={styles.overviewStatLabel}>连续天数</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStatItem}>
                <Text style={styles.overviewStatNum}>{todayCompleted}</Text>
                <Text style={styles.overviewStatLabel}>今日完成</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStatItem}>
                <Text style={styles.overviewStatNum}>
                  {state.stats.completedGoals}
                </Text>
                <Text style={styles.overviewStatLabel}>已完成目标</Text>
              </View>
            </View>
          </View>
          <ProgressRing
            progress={overallProgress}
            size={88}
            strokeWidth={8}
            label={`${Math.round(overallProgress * 100)}%`}
            sublabel="完成"
          />
        </View>

        {/* Active Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              进行中的目标
            </Text>
            {state.goals.filter((g) => g.status === "active").length > 3 && (
              <Pressable onPress={() => router.push("/(tabs)/goals" as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  查看全部
                </Text>
              </Pressable>
            )}
          </View>

          {activeGoals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState
                icon="target"
                title="还没有学习目标"
                description="点击右上角「+」创建你的第一个学习目标"
              />
            </View>
          ) : (
            activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={() => router.push(`/goal/${goal.id}`)}
              />
            ))
          )}
        </View>

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              待完成任务
            </Text>
            <View
              style={[
                styles.taskCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {todayTasks.map((task, idx) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/goal/${task.goalId}`)}
                  style={({ pressed }) => [
                    styles.taskRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth:
                        idx < todayTasks.length - 1 ? StyleSheet.hairlineWidth : 0,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[styles.taskDot, { backgroundColor: colors.primary + "44" }]}
                  >
                    <View
                      style={[styles.taskDotInner, { backgroundColor: colors.primary }]}
                    />
                  </View>
                  <View style={styles.taskTextContainer}>
                    <Text
                      style={[styles.taskTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Text style={[styles.taskGoal, { color: colors.muted }]}>
                      {task.goalTitle}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewLeft: {
    flex: 1,
    gap: 8,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 24,
  },
  overviewSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
  },
  overviewStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  overviewStatItem: {
    alignItems: "center",
  },
  overviewStatNum: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  overviewStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 14,
  },
  overviewDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  seeAll: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 32,
    minHeight: 160,
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  taskDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskTextContainer: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  taskGoal: {
    fontSize: 12,
    lineHeight: 16,
  },
});
