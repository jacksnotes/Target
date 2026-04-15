import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Task } from "@/lib/types";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getTaskExecutionType, isTaskExecutionRequired } from "@/lib/task-execution";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export function TaskItem({ task, onToggle, onDelete, onPress }: TaskItemProps) {
  const colors = useColors();

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  const handlePress = () => {
    if (onPress) onPress();
    else handleToggle();
  };

  const typeKey = getTaskExecutionType(task);
  const isLearningTask = isTaskExecutionRequired(task);
  const typeInfo = isLearningTask ? EXECUTION_TYPE_INFO[typeKey as string] || EXECUTION_TYPE_INFO.checklist : null;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}> 
      {!isLearningTask ? (
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.checkbox,
            {
              borderColor: task.completed ? colors.primary : colors.border,
              backgroundColor: task.completed ? colors.primary : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {task.completed && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>{"\u2713"}</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View
          style={[
            styles.typeIcon,
            { backgroundColor: task.completed ? colors.success + "15" : (typeInfo?.color || colors.primary) + "15" },
          ]}
        >
          <IconSymbol
            name={task.completed ? "checkmark.circle.fill" : (typeInfo?.icon || "play.circle.fill") as any}
            size={18}
            color={task.completed ? colors.success : (typeInfo?.color || colors.primary)}
          />
        </View>
      )}

      <Pressable style={styles.textContainer} onPress={handlePress}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: task.completed ? colors.muted : colors.foreground,
                textDecorationLine: task.completed ? "line-through" : "none",
              },
            ]}
          >
            {task.title}
          </Text>
          {isLearningTask && !task.completed && (
            <View style={[styles.interactiveBadge, { backgroundColor: colors.primary + "10" }]}> 
              <Text style={[styles.interactiveText, { color: colors.primary }]}> 
                {typeInfo?.label || "\u5b66\u4e60"} {"\u203a"}
              </Text>
            </View>
          )}
        </View>
        {task.description ? (
          <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
      </Pressable>

      {onDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={15}
          style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <IconSymbol name="xmark" size={14} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const EXECUTION_TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  flashcard: { icon: "list.bullet", label: "\u5361\u7247", color: "#8B5CF6" },
  reading: { icon: "book.fill", label: "\u9605\u8bfb", color: "#3B82F6" },
  coding: { icon: "chevron.left.forwardslash.chevron.right", label: "\u7f16\u7a0b", color: "#10B981" },
  checklist: { icon: "checkmark.circle.fill", label: "\u6253\u5361", color: "#F59E0B" },
  quiz: { icon: "questionmark.circle", label: "\u6d4b\u9a8c", color: "#EC4899" },
  practice: { icon: "figure.run", label: "\u5b9e\u8df5", color: "#F97316" },
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  typeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkmark: { alignItems: "center", justifyContent: "center" },
  checkmarkText: { color: "#fff", fontSize: 12, fontWeight: "700", lineHeight: 16 },
  textContainer: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "500", lineHeight: 22 },
  desc: { fontSize: 13, lineHeight: 18 },
  interactiveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  interactiveText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 8 },
});
