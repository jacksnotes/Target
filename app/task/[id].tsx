import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { generateTaskPayload } from "@/lib/ai-generator";
import { getTaskExecutionType } from "@/lib/task-execution";
import { FlashcardViewer } from "@/components/execution/FlashcardViewer";
import { ReadingViewer } from "@/components/execution/ReadingViewer";
import { QuizViewer } from "@/components/execution/QuizViewer";
import { CodingSimulator } from "@/components/execution/CodingSimulator";
import { PracticeViewer } from "@/components/execution/PracticeViewer";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TaskExecutionScreen() {
  const { id, goalId } = useLocalSearchParams<{ id: string; goalId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { state, updateTask, completeTask } = useGoals();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goal = state.goals.find((g) => g.id === goalId);
  const task = goal?.tasks.find((t) => t.id === id);

  useEffect(() => {
    if (!task || !goal) return;
    const executionType = getTaskExecutionType(task, goal.title);
    if (executionType && !task.payload && !isGenerating && !error) {
      setIsGenerating(true);
      generateTaskPayload({ ...task, executionType }, goal.title)
        .then((payload) => {
          updateTask(goal.id, task.id, { payload });
          setIsGenerating(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsGenerating(false);
        });
    }
  }, [task?.id, task?.payload, goal?.id, isGenerating, error, updateTask]);

  if (!task || !goal) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>
          {"\u4efb\u52a1\u4e0d\u5b58\u5728"}
        </Text>
      </ScreenContainer>
    );
  }

  const executionType = getTaskExecutionType(task, goal.title);

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/goal/${goal.id}`);
  };

  const handleComplete = () => {
    if (!task.completed) completeTask(goal.id, task.id);
    navigateBack();
  };

  const Header = () => (
    <View style={[styles.navbar, { borderBottomColor: colors.border }]}> 
      <Pressable onPress={navigateBack} style={styles.navBtn}>
        <IconSymbol name="xmark" size={22} color={colors.foreground} />
      </Pressable>
      <View style={styles.headerTitleWrap}>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>{task.title}</Text>
        <Text style={[styles.navSubtitle, { color: colors.muted }]}>{executionType?.toUpperCase() || "TASK"}</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  if (executionType && !task.payload) {
    return (
      <ScreenContainer>
        <Header />
        <View style={styles.centerContainer}>
          {error ? (
            <View style={styles.errorBox}>
              <IconSymbol name="exclamationmark.circle.fill" size={32} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{"\u751f\u6210\u5185\u5bb9\u5931\u8d25\uff1a"}{error}</Text>
              <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => setError(null)}>
                <Text style={styles.retryBtnText}>{"\u91cd\u8bd5"}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <View style={[styles.spinnerWrapper, { borderColor: colors.primary + "33", borderLeftColor: colors.primary }]}> 
                <Text style={[styles.spinnerText, { color: colors.primary }]}>AI</Text>
              </View>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>{"\u6b63\u5728\u751f\u6210\u5b66\u4e60\u5185\u5bb9..."}</Text>
              <Text style={[styles.loadingDesc, { color: colors.muted }]}>{"\u8bf7\u7a0d\u7b49\uff0c\u8fd9\u4f1a\u7528\u4e8e\u68c0\u67e5\u4f60\u662f\u5426\u771f\u6b63\u5b8c\u6210\u4efb\u52a1"}</Text>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  let ContentComponent = null;

  if (executionType && task.payload) {
    switch (executionType) {
      case "flashcard":
        ContentComponent = <FlashcardViewer payload={task.payload} onComplete={handleComplete} goalTitle={goal.title} />;
        break;
      case "reading":
        ContentComponent = <ReadingViewer payload={task.payload} onComplete={handleComplete} />;
        break;
      case "quiz":
        ContentComponent = <QuizViewer payload={task.payload} onComplete={handleComplete} />;
        break;
      case "coding":
        ContentComponent = <CodingSimulator payload={task.payload} onComplete={handleComplete} />;
        break;
      case "practice":
        ContentComponent = <PracticeViewer payload={task.payload} onComplete={handleComplete} goalTitle={goal.title} />;
        break;
      default:
        ContentComponent = <View style={styles.centerContainer}><Text style={{ color: colors.muted }}>{"\u6682\u4e0d\u652f\u6301\u7684\u4efb\u52a1\u7c7b\u578b\uff1a"}{executionType}</Text></View>;
    }
  } else {
    ContentComponent = (
      <View style={styles.centerContainer}>
        <Text style={[styles.title, { color: colors.foreground }]}>{task.title}</Text>
        {task.description && <Text style={[styles.desc, { color: colors.muted }]}>{task.description}</Text>}
        <Pressable style={[styles.completeBtn, { backgroundColor: task.completed ? colors.muted : colors.primary }]} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>{task.completed ? "\u5df2\u5b8c\u6210" : "\u6807\u8bb0\u5b8c\u6210"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <Header />
      {ContentComponent}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  navTitle: { fontSize: 17, fontWeight: "600", lineHeight: 24, textAlign: "center" },
  navSubtitle: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 1 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  loadingBox: { alignItems: "center", gap: 16 },
  spinnerWrapper: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  spinnerText: { fontSize: 18, fontWeight: "800" },
  loadingTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  loadingDesc: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  errorBox: { alignItems: "center", gap: 16 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  desc: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  completeBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
