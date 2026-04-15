import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { TaskItem } from "@/components/task-item";
import { ProgressRing } from "@/components/progress-ring";
import { PriorityBadge } from "@/components/priority-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { ReminderSettings } from "@/components/reminder-settings";
import { updateGoalReminder } from "@/lib/notification-manager";
import { isTaskExecutionRequired } from "@/lib/task-execution";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { state, toggleTask, addTask, deleteGoal, updateGoal } = useGoals();

  const goal = useMemo(() => state.goals.find((g: any) => g.id === id), [state.goals, id]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  if (!goal) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>{"\u76ee\u6807\u4e0d\u5b58\u5728"}</Text>
      </ScreenContainer>
    );
  }

  const completedTasks = goal.tasks.filter((t) => t.completed).length;
  const totalTasks = goal.tasks.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const dueDateStr = goal.dueDate
    ? new Date(goal.dueDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    addTask(goal.id, title);
    setNewTaskTitle("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/goals");
  };

  const handleDeleteGoal = () => {
    const deleteAction = () => {
      deleteGoal(goal.id);
      navigateBack();
    };
    if (Platform.OS === "web") {
      if (window.confirm(`\u786e\u5b9a\u8981\u5220\u9664\u300c${goal.title}\u300d\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002`)) deleteAction();
      return;
    }
    Alert.alert("\u5220\u9664\u76ee\u6807", `\u786e\u5b9a\u8981\u5220\u9664\u300c${goal.title}\u300d\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002`, [
      { text: "\u53d6\u6d88", style: "cancel" },
      { text: "\u5220\u9664", style: "destructive", onPress: deleteAction },
    ]);
  };

  const handleToggleTask = (taskId: string) => {
    toggleTask(goal.id, taskId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScreenContainer>
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}> 
        <Pressable onPress={navigateBack} style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}> 
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>{"\u76ee\u6807\u8be6\u60c5"}</Text>
        <Pressable onPress={handleDeleteGoal} hitSlop={12} style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}> 
          <IconSymbol name="trash" size={20} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.goalHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.goalHeaderTop}>
            <View style={styles.goalTitleSection}>
              <Text style={[styles.goalTitle, { color: colors.foreground }]}>{goal.title}</Text>
              <PriorityBadge priority={goal.priority} />
            </View>
            <ProgressRing progress={progress} size={72} strokeWidth={7} label={`${Math.round(progress * 100)}%`} />
          </View>
          {goal.description ? <Text style={[styles.goalDesc, { color: colors.muted }]}>{goal.description}</Text> : null}
          <View style={styles.goalMeta}>
            {dueDateStr && (
              <View style={styles.metaItem}>
                <IconSymbol name="calendar" size={14} color={colors.muted} />
                <Text style={[styles.metaText, { color: colors.muted }]}>{"\u622a\u6b62\uff1a"}{dueDateStr}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <IconSymbol name="list.bullet" size={14} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{completedTasks}/{totalTasks} {"\u4efb\u52a1\u5df2\u5b8c\u6210"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.reminderSection, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.reminderHeader}>
            <Text style={[styles.reminderTitle, { color: colors.foreground }]}>{"\u5b66\u4e60\u63d0\u9192"}</Text>
            <Pressable onPress={() => setShowReminderSettings(!showReminderSettings)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}> 
              <IconSymbol name={showReminderSettings ? "xmark" : "bell"} size={18} color={goal.reminder?.enabled ? colors.primary : colors.muted} />
            </Pressable>
          </View>
          {goal.reminder?.enabled && <Text style={[styles.reminderTime, { color: colors.muted }]}>{"\u6bcf\u5929"} {goal.reminder.time} {"\u63d0\u9192"}</Text>}
          {showReminderSettings && (
            <View style={styles.reminderSettingsContainer}>
              <ReminderSettings
                reminder={goal.reminder}
                isLoading={isSavingReminder}
                onSave={async (config) => {
                  setIsSavingReminder(true);
                  try {
                    const updatedReminder = await updateGoalReminder(goal, config);
                    updateGoal(goal.id, { reminder: updatedReminder });
                    setShowReminderSettings(false);
                  } catch {
                    Alert.alert("\u9519\u8bef", "\u4fdd\u5b58\u63d0\u9192\u8bbe\u7f6e\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5");
                  } finally {
                    setIsSavingReminder(false);
                  }
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={[styles.tasksSectionTitle, { color: colors.foreground }]}>{"\u5b66\u4e60\u4efb\u52a1"}</Text>
            <Pressable
              onPress={() => setShowAddTask(!showAddTask)}
              style={({ pressed }) => [styles.addTaskBtn, { backgroundColor: showAddTask ? colors.border : colors.primary + "18", opacity: pressed ? 0.7 : 1 }]}
            >
              <IconSymbol name={showAddTask ? "xmark" : "plus"} size={16} color={showAddTask ? colors.muted : colors.primary} />
              <Text style={[styles.addTaskBtnText, { color: showAddTask ? colors.muted : colors.primary }]}>{showAddTask ? "\u53d6\u6d88" : "\u6dfb\u52a0\u4efb\u52a1"}</Text>
            </Pressable>
          </View>

          {showAddTask && (
            <View style={[styles.addTaskInput, { backgroundColor: colors.surface, borderColor: colors.primary }]}> 
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="\u8f93\u5165\u4efb\u52a1\u540d\u79f0..."
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.foreground }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddTask}
              />
              <Pressable onPress={handleAddTask} style={({ pressed }) => [styles.inputSubmitBtn, { backgroundColor: newTaskTitle.trim() ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}> 
                <IconSymbol name="checkmark" size={16} color="#fff" />
              </Pressable>
            </View>
          )}

          {goal.tasks.length === 0 ? (
            <View style={[styles.emptyTasks, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <IconSymbol name="doc.text.fill" size={32} color={colors.muted} />
              <Text style={[styles.emptyTasksText, { color: colors.muted }]}>{"\u8fd8\u6ca1\u6709\u4efb\u52a1\uff0c\u70b9\u51fb\u300c\u6dfb\u52a0\u4efb\u52a1\u300d\u5f00\u59cb\u62c6\u5206\u76ee\u6807"}</Text>
            </View>
          ) : (
            <View style={[styles.taskList, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              {goal.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task.id)}
                  onPress={() => {
                    if (isTaskExecutionRequired(task, goal.title)) router.push(`/task/${task.id}?goalId=${goal.id}`);
                    else handleToggleTask(task.id);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "600", lineHeight: 24, flex: 1, textAlign: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80, gap: 16 },
  goalHeader: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  goalHeaderTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  goalTitleSection: { flex: 1, gap: 8 },
  goalTitle: { fontSize: 22, fontWeight: "700", lineHeight: 30 },
  goalDesc: { fontSize: 14, lineHeight: 22 },
  goalMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, lineHeight: 18 },
  tasksSection: { gap: 12, marginTop: 4 },
  tasksSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tasksSectionTitle: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  addTaskBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addTaskBtnText: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  addTaskInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, paddingLeft: 16, paddingRight: 8, paddingVertical: 8, gap: 8 },
  input: { flex: 1, fontSize: 15, lineHeight: 22, paddingVertical: 4 },
  inputSubmitBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyTasks: { borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 32, alignItems: "center", gap: 8 },
  emptyTasksText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  taskList: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  reminderSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, marginTop: 4 },
  reminderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reminderTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  reminderTime: { fontSize: 13, lineHeight: 18 },
  reminderSettingsContainer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.1)" },
});
