import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { ExecutionType, Priority, Task } from "@/lib/types";
import { HARDCORE_REWARD_SHELLS, HARDCORE_STAKE_SHELLS } from "@/lib/storage";
import { getTaskExecutionType } from "@/lib/task-execution";

const EXECUTION_TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  flashcard: { icon: "list.bullet", label: "\u5361\u7247\u5b66\u4e60", color: "#8B5CF6" },
  reading: { icon: "book.fill", label: "\u6587\u7ae0\u9605\u8bfb", color: "#3B82F6" },
  coding: { icon: "chevron.left.forwardslash.chevron.right", label: "\u4ee3\u7801\u7ec3\u4e60", color: "#10B981" },
  checklist: { icon: "checkmark.circle.fill", label: "\u6253\u5361\u4efb\u52a1", color: "#F59E0B" },
  quiz: { icon: "questionmark.circle", label: "\u6d4b\u9a8c\u95ee\u7b54", color: "#EC4899" },
  practice: { icon: "figure.run", label: "\u5b9e\u8df5\u7ec3\u4e60", color: "#F97316" },
};

export default function GoalPreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addGoal, state } = useGoals();
  const [isHardcore, setIsHardcore] = React.useState(false);
  const params = useLocalSearchParams<{
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    tasks: string;
  }>();

  const tasks: Partial<Task>[] = React.useMemo(() => {
    try {
      return JSON.parse(params.tasks || "[]");
    } catch (e) {
      console.error("Failed to parse tasks in preview", e);
      return [];
    }
  }, [params.tasks]);

  const priority = (params.priority as Priority) || "medium";
  const dueDate = params.dueDate ? new Date(parseInt(params.dueDate, 10)) : null;

  const handleConfirm = () => {
    if (isHardcore && state.wallet.balance < HARDCORE_STAKE_SHELLS) {
      Alert.alert("贝壳不足", `开启硬核模式需要冻结 ${HARDCORE_STAKE_SHELLS} 贝壳。当前余额 ${state.wallet.balance} 贝壳。`);
      return;
    }

    const goalId = addGoal(
      params.title,
      params.description,
      priority,
      dueDate ? dueDate.getTime() : undefined,
      tasks.map(normalizeTaskBeforeCreate),
      isHardcore ? { isHardcore: true, stakedShells: HARDCORE_STAKE_SHELLS } : undefined
    );

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const goToGoal = () => router.replace(`/goal/${goalId}`);
    try {
      if (router.canDismiss()) {
        router.dismissAll();
        setTimeout(goToGoal, 0);
        return;
      }
    } catch {
      // Fall through to direct navigation.
    }
    goToGoal();
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}> 
          {"\u9884\u89c8\u786e\u8ba4"}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.muted }]}>{"\u76ee\u6807\u6807\u9898"}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{params.title}</Text>

          {params.description && (
            <>
              <Text style={[styles.label, { color: colors.muted, marginTop: 12 }]}>{"\u63cf\u8ff0"}</Text>
              <Text style={[styles.desc, { color: colors.muted }]}>{params.description}</Text>
            </>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.label, { color: colors.muted }]}>{"\u4f18\u5148\u7ea7"}</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}> 
                {priority === "high" ? "\u9ad8" : priority === "medium" ? "\u4e2d" : "\u4f4e"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.label, { color: colors.muted }]}>{"\u622a\u6b62\u65e5\u671f"}</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}> 
                {dueDate ? dueDate.toLocaleDateString() : "\u672a\u8bbe\u7f6e"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}> 
          {"\u4efb\u52a1\u5217\u8868"} ({tasks.length})
        </Text>

        <View style={styles.taskList}>
          {tasks.map((task, i) => {
            const normalizedType = getNormalizedExecutionType(task) || "checklist";
            const typeInfo = EXECUTION_TYPE_INFO[normalizedType] || EXECUTION_TYPE_INFO.checklist;
            return (
              <View
                key={i}
                style={[
                  styles.taskItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + "15" }]}> 
                  <IconSymbol name={typeInfo.icon as any} size={16} color={typeInfo.color} />
                </View>
                <View style={styles.taskText}>
                  <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
                  {task.description && (
                    <Text style={[styles.taskDesc, { color: colors.muted }]} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.hardcoreCard,
            {
              backgroundColor: isHardcore ? colors.warning + "14" : colors.surface,
              borderColor: isHardcore ? colors.warning : colors.border,
            },
          ]}
        >
          <View style={styles.hardcoreHeader}>
            <View style={styles.hardcoreTitleWrap}>
              <Text style={[styles.hardcoreTitle, { color: colors.foreground }]}>硬核承诺模式</Text>
              <Text style={[styles.hardcoreBalance, { color: colors.muted }]}>当前余额：{state.wallet.balance} 贝壳</Text>
            </View>
            <Pressable
              onPress={() => setIsHardcore((value) => !value)}
              style={[
                styles.switchTrack,
                { backgroundColor: isHardcore ? colors.warning : colors.border },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    backgroundColor: "#fff",
                    transform: [{ translateX: isHardcore ? 22 : 0 }],
                  },
                ]}
              />
            </Pressable>
          </View>
          <Text style={[styles.hardcoreText, { color: colors.muted }]}>
            开启后冻结 {HARDCORE_STAKE_SHELLS} 贝壳作为承诺金。按期完成返还承诺金，并奖励 {HARDCORE_REWARD_SHELLS} 贝壳；未完成或主动放弃，承诺金销毁。
          </Text>
        </View>

        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={styles.confirmBtnText}>{"\u786e\u8ba4\u5e76\u5f00\u59cb\u8ba1\u5212"}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function normalizeTaskBeforeCreate(task: Partial<Task>): Partial<Task> {
  return {
    ...task,
    executionType: getNormalizedExecutionType(task),
  };
}

function getNormalizedExecutionType(task: Partial<Task>): ExecutionType | undefined {
  return getTaskExecutionType(task) ?? task.executionType;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 32,
  },
  metaItem: {
    flex: 1,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  taskDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  hardcoreCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  hardcoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  hardcoreTitleWrap: {
    flex: 1,
    gap: 2,
  },
  hardcoreTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  hardcoreBalance: {
    fontSize: 13,
    lineHeight: 18,
  },
  hardcoreText: {
    fontSize: 14,
    lineHeight: 22,
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  confirmBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
