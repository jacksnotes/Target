import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface QuizPayload {
  questions?: { question: string; options: string[]; answerIndex: number }[];
}

export function QuizViewer({ payload, onComplete }: { payload: any; onComplete: () => void }) {
  const colors = useColors();
  const typedPayload = payload as QuizPayload;
  const questions = typedPayload?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.muted }}>未生成测验数据，请返回后重试</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.answerIndex;
  const isLastQuestion = currentIndex === questions.length - 1;

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
  };

  const handleSelectOption = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
  };

  const handleNext = () => {
    if (!isCorrect) {
      restartQuiz();
      return;
    }

    if (!isLastQuestion) {
      setSelectedOption(null);
      setShowResult(false);
      setCurrentIndex(currentIndex + 1);
      return;
    }

    onComplete();
  };

  const progress = (currentIndex + 1) / questions.length;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <View style={styles.questionArea}>
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {currentQuestion.question}
        </Text>

        <View style={styles.optionsWrap}>
          {currentQuestion.options.map((opt, idx) => {
            let bgColor = colors.surface;
            let borderColor = colors.border;
            let icon = null;

            if (showResult) {
              if (idx === currentQuestion.answerIndex) {
                bgColor = colors.primary + "1A";
                borderColor = colors.primary;
                icon = <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />;
              } else if (idx === selectedOption) {
                bgColor = colors.error + "1A";
                borderColor = colors.error;
                icon = <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />;
              }
            } else if (idx === selectedOption) {
              borderColor = colors.primary;
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelectOption(idx)}
                style={[
                  styles.optionItem,
                  { backgroundColor: bgColor, borderColor },
                  !showResult && { opacity: 1 },
                ]}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
                {icon && <View style={styles.optionIcon}>{icon}</View>}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        {showResult && (
          <View style={[styles.resultBanner, { backgroundColor: isCorrect ? colors.primary + "1A" : colors.error + "1A" }]}>
            <Text style={[styles.resultText, { color: isCorrect ? colors.primary : colors.error }]}>
              {isCorrect
                ? "回答正确，继续保持"
                : `回答错误。正确答案是：${currentQuestion.options[currentQuestion.answerIndex]}。本次测验需要从头再来。`}
            </Text>
          </View>
        )}
        <Pressable
          style={[
            styles.completeBtn,
            { backgroundColor: showResult ? (isCorrect ? colors.primary : colors.error) : colors.border },
          ]}
          onPress={showResult ? handleNext : undefined}
          disabled={!showResult}
        >
          <Text style={[styles.completeBtnText, { color: showResult ? "#fff" : colors.muted }]}>
            {showResult
              ? isCorrect
                ? isLastQuestion
                  ? "全部正确，完成测验"
                  : "下一题"
                : "答错了，重新开始"
              : "请选择答案"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", width: 40, textAlign: "right" },
  questionArea: { flex: 1, padding: 24, justifyContent: "center" },
  questionText: { fontSize: 22, fontWeight: "700", lineHeight: 32, marginBottom: 40 },
  optionsWrap: { gap: 16 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    minHeight: 64,
  },
  optionText: { fontSize: 16, flex: 1, lineHeight: 22 },
  optionIcon: { marginLeft: 12 },
  footer: { padding: 16, paddingBottom: 32 },
  resultBanner: { padding: 16, borderRadius: 12, marginBottom: 16 },
  resultText: { fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  completeBtn: { height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  completeBtnText: { fontSize: 16, fontWeight: "600" },
});
