import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Goal } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { PriorityBadge } from "./priority-badge";
import { IconSymbol } from "./ui/icon-symbol";

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const colors = useColors();
  const completedTasks = goal.tasks.filter((t) => t.completed).length;
  const totalTasks = goal.tasks.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const progressPercent = Math.round(progress * 100);

  const isOverdue =
    goal.dueDate && goal.status !== "completed" && goal.dueDate < Date.now();
  const isDueSoon =
    goal.dueDate &&
    goal.status !== "completed" &&
    !isOverdue &&
    goal.dueDate - Date.now() < 3 * 24 * 60 * 60 * 1000;

  const dueDateStr = goal.dueDate
    ? new Date(goal.dueDate).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {goal.status === "completed" && (
            <View
              style={[
                styles.completedDot,
                { backgroundColor: colors.success },
              ]}
            />
          )}
          {goal.status === "failed" && (
            <View
              style={[
                styles.completedDot,
                { backgroundColor: colors.error },
              ]}
            />
          )}
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                textDecorationLine:
                  goal.status === "completed" || goal.status === "failed" ? "line-through" : "none",
                opacity: goal.status === "completed" || goal.status === "failed" ? 0.6 : 1,
              },
            ]}
            numberOfLines={2}
          >
            {goal.title}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>

      {/* Description */}
      {goal.description ? (
        <Text
          style={[styles.description, { color: colors.muted }]}
          numberOfLines={1}
        >
          {goal.description}
        </Text>
      ) : null}

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <View style={styles.progressSection}>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    goal.status === "completed"
                      ? colors.success
                      : goal.status === "failed"
                      ? colors.error
                      : colors.primary,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {completedTasks}/{totalTasks} 任务
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <PriorityBadge priority={goal.priority} small />
        {goal.isHardcore && (
          <View style={styles.dueDate}>
            <IconSymbol
              name={goal.status === "failed" ? "xmark.circle.fill" : "flame.fill"}
              size={10}
              color={goal.status === "failed" ? colors.error : colors.warning}
            />
            <Text
              style={[
                styles.dueDateText,
                { color: goal.status === "failed" ? colors.error : colors.warning },
              ]}
            >
              {goal.status === "failed" ? "硬核失败" : `硬核 · ${goal.stakedShells ?? 100} 贝壳`}
            </Text>
          </View>
        )}
        {dueDateStr && (
          <View style={styles.dueDate}>
            <IconSymbol
              name="paperplane.fill"
              size={10}
              color={
                isOverdue
                  ? colors.error
                  : isDueSoon
                  ? colors.warning
                  : colors.muted
              }
            />
            <Text
              style={[
                styles.dueDateText,
                {
                  color: isOverdue
                    ? colors.error
                    : isDueSoon
                    ? colors.warning
                    : colors.muted,
                },
              ]}
            >
              {isOverdue ? "已逾期 · " : isDueSoon ? "即将到期 · " : ""}
              {dueDateStr}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    flex: 1,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    gap: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dueDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dueDateText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
