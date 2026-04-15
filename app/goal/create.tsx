import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { Priority, Task, ExecutionType } from "@/lib/types";
import { trpc } from "@/lib/trpc";

const PRIORITY_OPTIONS: { value: Priority; label: string; iconName: string }[] = [
  { value: "high", label: "高", iconName: "exclamationmark.circle.fill" },
  { value: "medium", label: "中", iconName: "info.circle.fill" },
  { value: "low", label: "低", iconName: "checkmark.circle.fill" },
];

export default function CreateGoalScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    description?: string;
    context?: string;
    fromPlan?: string;
  }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [suggestedTasks, setSuggestedTasks] = useState<Partial<Task>[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTask, setCustomTask] = useState("");

  // Pre-fill from params
  useEffect(() => {
    if (params.title) setTitle(params.title);
    if (params.description) setDescription(params.description);
  }, [params.title, params.description]);

  const aiSplit = trpc.ai.chat.useMutation();

  const handleAISplit = async () => {
    if (!title.trim()) {
      Alert.alert("提示", "请先输入学习目标");
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `请将学习目标 "${title}" 拆分为 5-8 个具体可执行的任务。
目标描述：${description || "无"}

请以此 JSON 数组格式返回，确保任务类型(executionType)包含 reading, flashcard, quiz, practice 等互动类型（不要全是 checklist）。coding 只用于真正需要写代码、调试程序、实现脚本或软件开发的任务；厨艺、运动、语言表达、实操记录、心得总结、选择清单等非编程任务不要标成 coding，应使用 practice、reading、quiz 或 checklist：
[{"title":"任务名称","description":"说明","executionType":"reading|coding|flashcard|quiz|practice|checklist"}]`;


      const result = await aiSplit.mutateAsync({
        messages: [{ role: "user", content: prompt }],
      });

      const content = result.content ?? "";
      let tasks: Partial<Task>[] = [];
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing for non-JSON lines
          tasks = (content.split("\n")
            .filter((line: string) => line.trim().length > 5)
            .slice(0, 8)
            .map((line: string) => ({
              title: line.replace(/^\d+\.\s*/, "").trim(),
              executionType: "checklist"
            })) as Partial<Task>[]);
        }
      } catch (e) {
        // Ultimate fallback
        const lines = content.split("\n").filter((l: string) => l.trim().length > 2);
        tasks = lines.slice(0, 6).map((l: string) => ({ title: l.trim(), executionType: "checklist" }));
      }


      if (tasks.length > 0) {
        setSuggestedTasks(tasks);
        setSelectedTasks(new Set(tasks.map((_, i) => i)));
      } else {
        throw new Error("Invalid AI response");
      }


      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("AI 拆分失败", "请检查网络连接后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskSelection = (idx: number) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddCustomTask = () => {
    const t = customTask.trim();
    if (!t) return;
    setSuggestedTasks((prev) => [...prev, { title: t, executionType: "checklist" }]);
    setSelectedTasks((prev) => new Set([...prev, suggestedTasks.length]));
    setCustomTask("");
  };

  const handleCreateGoal = () => {
    if (!title.trim()) {
      Alert.alert("提示", "请输入学习目标标题");
      return;
    }

    const taskItems = suggestedTasks
      .filter((_, i) => selectedTasks.has(i));

    if (taskItems.length === 0) {
      Alert.alert("提示", "请至少选择或添加一个任务");
      return;
    }

    // Pass data to preview screen
    router.push({
      pathname: "/goal/preview",
      params: {
        title,
        description,
        priority,
        dueDate: dueDate ? dueDate.getTime().toString() : "",
        tasks: JSON.stringify(taskItems),
      },
    });
  };

  return (
    <ScreenContainer>
      {/* Navigation Bar */}
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.navCancel, { color: colors.muted }]}>取消</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          创建目标
        </Text>
        <Pressable
          onPress={handleCreateGoal}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text
            style={[
              styles.navSave,
              {
                color: title.trim() ? colors.primary : colors.muted,
                fontWeight: "600",
              },
            ]}
          >
            下一步
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>
            目标标题 *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="例如：通过 CET-6 考试"
            placeholderTextColor={colors.muted}
            style={[
              styles.textInput,
              {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>
            目标描述（可选）
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="描述你的学习目标..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={[
              styles.textArea,
              {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
        </View>

        {/* Priority */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>
            优先级
          </Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={({ pressed }) => [
                  styles.priorityBtn,
                  {
                    backgroundColor:
                      priority === opt.value
                        ? colors.primary + "18"
                        : colors.surface,
                    borderColor:
                      priority === opt.value ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <IconSymbol
                  name={opt.iconName as any}
                  size={16}
                  color={priority === opt.value ? colors.primary : colors.muted}
                />
                <Text
                  style={[
                    styles.priorityLabel,
                    {
                      color:
                        priority === opt.value ? colors.primary : colors.foreground,
                      fontWeight: priority === opt.value ? "600" : "400",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>
            截止日期（可选）
          </Text>
          <Pressable
            onPress={() => {
              if (dueDate) {
                setTempYear(dueDate.getFullYear());
                setTempMonth(dueDate.getMonth());
                setTempDay(dueDate.getDate());
              } else {
                const d = new Date();
                d.setMonth(d.getMonth() + 1);
                setTempYear(d.getFullYear());
                setTempMonth(d.getMonth());
                setTempDay(d.getDate());
              }
              setShowDatePicker(true);
            }}
            style={({ pressed }) => [
              styles.datePickerBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconSymbol name="calendar" size={18} color={colors.muted} />
            <Text
              style={[
                styles.datePickerText,
                { color: dueDate ? colors.foreground : colors.muted },
              ]}
            >
              {dueDate
                ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`
                : "选择截止日期"}
            </Text>
            {dueDate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDueDate(null);
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, padding: 4 }]}
              >
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
              </Pressable>
            )}
          </Pressable>
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              style={[styles.datePickerModal, { backgroundColor: colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.datePickerTitle, { color: colors.foreground }]}>
                选择截止日期
              </Text>
              {/* Year / Month selectors */}
              <View style={styles.dateRow}>
                <Pressable
                  onPress={() => setTempYear((y) => y - 1)}
                  style={({ pressed }) => [styles.dateArrow, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <IconSymbol name="chevron.left" size={18} color={colors.primary} />
                </Pressable>
                <Text style={[styles.dateValue, { color: colors.foreground }]}>
                  {tempYear} 年
                </Text>
                <Pressable
                  onPress={() => setTempYear((y) => y + 1)}
                  style={({ pressed }) => [styles.dateArrow, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <IconSymbol name="chevron.right" size={18} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.dateRow}>
                <Pressable
                  onPress={() => setTempMonth((m) => (m === 0 ? 11 : m - 1))}
                  style={({ pressed }) => [styles.dateArrow, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <IconSymbol name="chevron.left" size={18} color={colors.primary} />
                </Pressable>
                <Text style={[styles.dateValue, { color: colors.foreground }]}>
                  {tempMonth + 1} 月
                </Text>
                <Pressable
                  onPress={() => setTempMonth((m) => (m === 11 ? 0 : m + 1))}
                  style={({ pressed }) => [styles.dateArrow, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <IconSymbol name="chevron.right" size={18} color={colors.primary} />
                </Pressable>
              </View>
              {/* Day grid */}
              <View style={styles.dayGrid}>
                {Array.from(
                  { length: new Date(tempYear, tempMonth + 1, 0).getDate() },
                  (_, i) => i + 1
                ).map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setTempDay(day)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      {
                        backgroundColor:
                          tempDay === day ? colors.primary : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        { color: tempDay === day ? "#fff" : colors.foreground },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {/* Actions */}
              <View style={styles.dateActions}>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={({ pressed }) => [
                    styles.dateActionBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.dateActionText, { color: colors.muted }]}>
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const maxDay = new Date(tempYear, tempMonth + 1, 0).getDate();
                    const safeDay = Math.min(tempDay, maxDay);
                    setDueDate(new Date(tempYear, tempMonth, safeDay));
                    setShowDatePicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.dateActionBtn,
                    { backgroundColor: colors.primary, borderRadius: 10, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.dateActionText, { color: "#fff", fontWeight: "600" }]}>
                    确定
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* AI Split */}
        <View style={styles.fieldGroup}>
          <View style={styles.aiSplitHeader}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              学习任务
            </Text>
            <Pressable
              onPress={handleAISplit}
              disabled={isGenerating}
              style={({ pressed }) => [
                styles.aiBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isGenerating ? 0.7 : 1,
                },
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="sparkles" size={16} color="#fff" />
              )}
              <Text style={styles.aiBtnText}>
                {isGenerating ? "AI 生成中..." : "AI 智能拆分"}
              </Text>
            </Pressable>
          </View>

          {suggestedTasks.length > 0 && (
            <View
              style={[
                styles.taskSuggestions,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.suggestionsHint, { color: colors.muted }]}>
                点击任务可取消/选中
              </Text>
              {suggestedTasks.map((task, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => toggleTaskSelection(idx)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth:
                        idx < suggestedTasks.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.suggestionCheck,
                      {
                        borderColor: selectedTasks.has(idx)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedTasks.has(idx)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {selectedTasks.has(idx) && (
                      <Text style={styles.checkText}>✓</Text>
                    )}
                  </View>
                  <View style={styles.suggestionTextWrap}>
                    <View style={styles.suggestionTitleRow}>
                      <Text
                        style={[
                          styles.suggestionText,
                          {
                            color: selectedTasks.has(idx)
                              ? colors.foreground
                              : colors.muted,
                            textDecorationLine: selectedTasks.has(idx)
                              ? "none"
                              : "line-through",
                          },
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.executionType && (
                        <View style={[styles.typeBadge, { backgroundColor: colors.primary + "10" }]}>
                          <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                            {task.executionType}
                          </Text>
                        </View>
                      )}
                    </View>
                    {task.description && (
                      <Text style={[styles.suggestionDesc, { color: colors.muted }]} numberOfLines={1}>
                        {task.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}

              {/* Add custom task */}
              <View style={[styles.customTaskRow, { borderTopColor: colors.border }]}>
                <TextInput
                  value={customTask}
                  onChangeText={setCustomTask}
                  placeholder="手动添加任务..."
                  placeholderTextColor={colors.muted}
                  style={[styles.customTaskInput, { color: colors.foreground }]}
                  returnKeyType="done"
                  onSubmitEditing={handleAddCustomTask}
                />
                <Pressable
                  onPress={handleAddCustomTask}
                  style={({ pressed }) => [
                    styles.customTaskBtn,
                    {
                      backgroundColor: customTask.trim()
                        ? colors.primary
                        : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <IconSymbol name="plus" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}

          {suggestedTasks.length === 0 && (
            <View
              style={[
                styles.aiHint,
                { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30" },
              ]}
            >
              <IconSymbol name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.aiHintText, { color: colors.primary }]}>
                输入目标标题后，点击「AI 智能拆分」自动生成学习任务
              </Text>
            </View>
          )}
        </View>

        {/* Next Step Button */}
        <Pressable
          onPress={handleCreateGoal}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: title.trim() ? colors.primary : colors.border,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: title.trim() ? "#fff" : colors.muted }]}>
            创建目标
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    minWidth: 60,
    paddingVertical: 4,
  },
  navCancel: {
    fontSize: 16,
    lineHeight: 24,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  navSave: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityEmoji: {
    fontSize: 16,
    lineHeight: 22,
  },
  priorityLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiSplitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  taskSuggestions: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestionsHint: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 2,
  },
  suggestionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  suggestionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  customTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  customTaskInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 4,
  },
  customTaskBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  aiHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  datePickerModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  dateArrow: {
    padding: 8,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    minWidth: 80,
    textAlign: "center",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 4,
  },
  dayCell: {
    width: 40,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  dateActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 4,
  },
  dateActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateActionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
});
