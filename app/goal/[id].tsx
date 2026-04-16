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
import { HARDCORE_REWARD_SHELLS } from "@/lib/storage";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { state, toggleTask, addTask, deleteGoal, updateGoal, useLeaveCard, useMakeupCard } = useGoals();
  const goal = useMemo(() => state.goals.find((g: any) => g.id === id), [state.goals, id]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  if (!goal) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>目标不存在</Text>
      </ScreenContainer>
    );
  }

  const completedTasks = goal.tasks.filter((t) => t.completed).length;
  const totalTasks = goal.tasks.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const dueDateStr = goal.dueDate ? new Date(goal.dueDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : null;
  const remainingDays = goal.dueDate ? Math.ceil((goal.dueDate - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const hardcoreStatusText = goal.status === "failed"
    ? `硬核目标失败，${goal.stakedShells ?? 100} 贝壳承诺金已销毁`
    : goal.status === "completed"
    ? "硬核目标完成，承诺金已返还并奖励贝壳"
    : `硬核承诺中：冻结 ${goal.stakedShells ?? 100} 贝壳`;

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    addTask(goal.id, title);
    setNewTaskTitle("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleUseLeaveCard = () => {
    const result = useLeaveCard(goal.id);
    if (!result.ok) {
      Alert.alert("无法使用请假卡", result.message ?? "请稍后重试");
      return;
    }
    Alert.alert("已使用请假卡", "该硬核目标的截止时间已顺延 1 天。");
  };

  const handleUseMakeupCard = () => {
    if (goal.makeupUsed) {
      Alert.alert("无法补签", "该目标已被补签过，仅允许补签一次");
      return;
    }
    const result = useMakeupCard(goal.id);
    if (!result.ok) {
      Alert.alert("补签失败", result.message ?? "请稍后重试");
      return;
    }
    Alert.alert("复活成功", "已使用补签卡，该硬核目标状态已恢复，截止时间顺延 1 天。");
  };

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/goals");
  };

  const handleDeleteGoal = () => {
    const isActiveHardcore = goal.isHardcore && goal.status === "active";
    const deleteAction = () => {
      deleteGoal(goal.id);
      navigateBack();
    };
    const titleText = isActiveHardcore ? "放弃硬核目标" : "删除目标";
    const messageText = isActiveHardcore
      ? `确定要放弃「${goal.title}」吗？该目标会标记为失败，${goal.stakedShells ?? 100} 贝壳承诺金将销毁。`
      : `确定要删除「${goal.title}」吗？此操作不可撤销。`;
    if (Platform.OS === "web") {
      if (window.confirm(messageText)) deleteAction();
      return;
    }
    Alert.alert(titleText, messageText, [
      { text: "取消", style: "cancel" },
      { text: isActiveHardcore ? "放弃并销毁" : "删除", style: "destructive", onPress: deleteAction },
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
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>目标详情</Text>
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

          {goal.isHardcore ? (
            <View style={[
              styles.hardcoreBanner,
              {
                backgroundColor: goal.status === "failed" ? colors.error + "12" : colors.warning + "12",
                borderColor: goal.status === "failed" ? colors.error + "55" : colors.warning + "55",
              },
            ]}>
              <IconSymbol name={goal.status === "failed" ? "xmark.circle.fill" : "flame.fill"} size={18} color={goal.status === "failed" ? colors.error : colors.warning} />
              <Text style={[styles.hardcoreBannerText, { color: goal.status === "failed" ? colors.error : colors.warning }]}>{hardcoreStatusText}</Text>
            </View>
          ) : null}

          {goal.description ? <Text style={[styles.goalDesc, { color: colors.muted }]}>{goal.description}</Text> : null}
          <View style={styles.goalMeta}>
            {dueDateStr ? (
              <View style={styles.metaItem}>
                <IconSymbol name="calendar" size={14} color={colors.muted} />
                <Text style={[styles.metaText, { color: colors.muted }]}>截止：{dueDateStr}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <IconSymbol name="list.bullet" size={14} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{completedTasks}/{totalTasks} 任务已完成</Text>
            </View>
          </View>
        </View>

        {goal.isHardcore ? (
          <View style={[styles.commitmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.commitmentTitle, { color: colors.foreground }]}>硬核承诺明细</Text>
            <View style={styles.commitmentGrid}>
              <View style={[styles.commitmentItem, { backgroundColor: colors.warning + "10" }]}> 
                <Text style={[styles.commitmentLabel, { color: colors.muted }]}>冻结承诺金</Text>
                <Text style={[styles.commitmentValue, { color: colors.warning }]}>{goal.stakedShells ?? 100} 贝壳</Text>
              </View>
              <View style={[styles.commitmentItem, { backgroundColor: colors.primary + "10" }]}> 
                <Text style={[styles.commitmentLabel, { color: colors.muted }]}>完成奖励</Text>
                <Text style={[styles.commitmentValue, { color: colors.primary }]}>+{HARDCORE_REWARD_SHELLS} 贝壳</Text>
              </View>
              <View style={[styles.commitmentItem, { backgroundColor: colors.border }]}> 
                <Text style={[styles.commitmentLabel, { color: colors.muted }]}>当前状态</Text>
                <Text style={[styles.commitmentValue, { color: colors.foreground }]}>{goal.status === "failed" ? "已失败" : goal.status === "completed" ? "已完成" : "进行中"}</Text>
              </View>
              <View style={[styles.commitmentItem, { backgroundColor: colors.border }]}> 
                <Text style={[styles.commitmentLabel, { color: colors.muted }]}>剩余时间</Text>
                <Text style={[styles.commitmentValue, { color: remainingDays !== null && remainingDays < 0 ? colors.error : colors.foreground }]}>{remainingDays === null ? "未设置" : remainingDays >= 0 ? `${remainingDays} 天` : "已超时"}</Text>
              </View>
            </View>
            <View style={styles.commitmentMetaRow}>
              <Text style={[styles.commitmentHint, { color: colors.muted }]}>已用请假卡：{goal.leaveDaysUsed ?? 0}</Text>
              <Text style={[styles.commitmentHint, { color: colors.muted }]}>库存：请假 {state.inventory.leaveCards} / 补签 {state.inventory.makeupCards}</Text>
            </View>
            {goal.status === "active" ? (
              <Pressable onPress={handleUseLeaveCard} style={({ pressed }) => [styles.leaveCardButton, { backgroundColor: state.inventory.leaveCards > 0 ? colors.primary : colors.border, opacity: pressed ? 0.85 : 1 }]}> 
                <Text style={styles.leaveCardButtonText}>使用请假卡顺延 1 天</Text>
              </Pressable>
            ) : goal.status === "failed" && !goal.makeupUsed ? (
              <Pressable onPress={handleUseMakeupCard} style={({ pressed }) => [styles.leaveCardButton, { backgroundColor: state.inventory.makeupCards > 0 ? colors.primary : colors.border, opacity: pressed ? 0.85 : 1 }]}> 
                <Text style={styles.leaveCardButtonText}>使用补签卡复活并顺延 1 天</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.commitmentHint, { color: colors.muted }]}>主动放弃或超时未完成，承诺金直接销毁；全部任务完成后自动返还承诺金并发放奖励。</Text>
          </View>
        ) : null}

        <View style={[styles.reminderSection, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.reminderHeader}>
            <Text style={[styles.reminderTitle, { color: colors.foreground }]}>学习提醒</Text>
            <Pressable onPress={() => setShowReminderSettings(!showReminderSettings)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}> 
              <IconSymbol name={showReminderSettings ? "xmark" : "bell"} size={18} color={goal.reminder?.enabled ? colors.primary : colors.muted} />
            </Pressable>
          </View>
          {goal.reminder?.enabled ? <Text style={[styles.reminderTime, { color: colors.muted }]}>每天 {goal.reminder.time} 提醒</Text> : null}
          {showReminderSettings ? (
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
                    Alert.alert("错误", "保存提醒设置失败，请重试");
                  } finally {
                    setIsSavingReminder(false);
                  }
                }}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={[styles.tasksSectionTitle, { color: colors.foreground }]}>学习任务</Text>
            <Pressable onPress={() => setShowAddTask(!showAddTask)} style={({ pressed }) => [styles.addTaskBtn, { backgroundColor: showAddTask ? colors.border : colors.primary + "18", opacity: pressed ? 0.7 : 1 }]}>
              <IconSymbol name={showAddTask ? "xmark" : "plus"} size={16} color={showAddTask ? colors.muted : colors.primary} />
              <Text style={[styles.addTaskBtnText, { color: showAddTask ? colors.muted : colors.primary }]}>{showAddTask ? "取消" : "添加任务"}</Text>
            </Pressable>
          </View>

          {showAddTask ? (
            <View style={[styles.addTaskInput, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <TextInput value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="输入任务名称..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground }]} autoFocus returnKeyType="done" onSubmitEditing={handleAddTask} />
              <Pressable onPress={handleAddTask} style={({ pressed }) => [styles.inputSubmitBtn, { backgroundColor: newTaskTitle.trim() ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}>
                <IconSymbol name="checkmark" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : null}

          {goal.tasks.length === 0 ? (
            <View style={[styles.emptyTasks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={32} color={colors.muted} />
              <Text style={[styles.emptyTasksText, { color: colors.muted }]}>还没有任务，点击“添加任务”开始拆分目标</Text>
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
  hardcoreBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  hardcoreBannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  commitmentCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  commitmentTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  commitmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  commitmentItem: { width: "48%", borderRadius: 12, padding: 12, gap: 4 },
  commitmentLabel: { fontSize: 12, lineHeight: 16 },
  commitmentValue: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  commitmentMetaRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  commitmentHint: { fontSize: 13, lineHeight: 20 },
  leaveCardButton: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  leaveCardButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
