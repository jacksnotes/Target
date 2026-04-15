import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Speech from "expo-speech";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { extractLanguageFromTitle, getLanguageTag } from "@/lib/language-utils";
import { getApiBaseUrl } from "@/constants/oauth";

type PracticeItem = string | { title?: string; description?: string; text?: string };
type PracticePrompt =
  | string
  | {
      cue?: string;
      prompt?: string;
      target?: string;
      sampleAnswer?: string;
      tips?: string | string[];
    };

interface PracticePayload {
  title?: string;
  scenario?: string;
  instructions?: string;
  prompts?: PracticePrompt[];
  steps?: PracticeItem[];
  checklist?: PracticeItem[];
  criteria?: PracticeItem[];
  deliverable?: string;
  durationMinutes?: number;
  data?: string;
}

interface PracticeRound {
  cue: string;
  target?: string;
  sampleAnswer?: string;
  tips: string[];
}

function itemText(item: PracticeItem): string {
  if (typeof item === "string") return item;
  return [item.title, item.description, item.text].filter(Boolean).join(" - ");
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => itemText(item as PracticeItem)).filter(Boolean);
}

function normalizePrompts(payload: PracticePayload): PracticeRound[] {
  if (Array.isArray(payload.prompts) && payload.prompts.length > 0) {
    return payload.prompts
      .map((item) => {
        if (typeof item === "string") {
          return { cue: item, tips: [] };
        }

        const tips = Array.isArray(item.tips)
          ? item.tips.filter(Boolean)
          : item.tips
            ? [item.tips]
            : [];

        return {
          cue: item.cue || item.prompt || item.target || "",
          target: item.target,
          sampleAnswer: item.sampleAnswer,
          tips,
        };
      })
      .filter((round) => round.cue);
  }

  return normalizeTextList(payload.steps).map((step) => ({ cue: step, tips: [] }));
}

function hasPlaceholderText(text?: string) {
  return !!text && /(X{2,}|待填写|请填写|示例值|某个|某某|____)/i.test(text);
}

function isSpeechPractice(goalTitle: string, round?: PracticeRound) {
  const text = `${goalTitle} ${round?.cue ?? ""} ${round?.target ?? ""}`;
  return /法语|英语|日语|德语|西班牙语|韩语|朝鲜语|意大利语|俄语|葡萄牙语|中文|汉语|口语|听力|跟读|朗读|发音|对话|表达/.test(text);
}

export function PracticeViewer({
  payload,
  onComplete,
  goalTitle,
}: {
  payload: any;
  onComplete: () => void;
  goalTitle: string;
}) {
  const colors = useColors();
  const typedPayload = useMemo(() => (payload || {}) as PracticePayload, [payload]);
  const rounds = useMemo(() => normalizePrompts(typedPayload), [typedPayload]);
  const criteria = useMemo(() => normalizeTextList(typedPayload.criteria), [typedPayload.criteria]);
  const fallbackChecklist = useMemo(() => normalizeTextList(typedPayload.checklist), [typedPayload.checklist]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responseText, setResponseText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const languageName = extractLanguageFromTitle(goalTitle);
  const langTag = getLanguageTag(languageName);
  const currentRound = rounds[currentIndex];
  const canUseSpeech = isSpeechPractice(goalTitle, currentRound);
  const sampleAnswer = hasPlaceholderText(currentRound?.sampleAnswer) ? "" : currentRound?.sampleAnswer;
  const progress = rounds.length > 0 ? (currentIndex + (feedback ? 1 : 0)) / rounds.length : 1;

  const speak = async (text?: string) => {
    const textToSpeak = text?.trim();
    if (!textToSpeak) return;

    try {
      setIsSpeaking(true);
      await Speech.stop();
      Speech.speak(textToSpeak, {
        language: langTag,
        rate: 0.9,
        pitch: 1,
        useApplicationAudioSession: false,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: (error) => {
          console.error("Practice speech failed:", error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error("Practice speech failed:", error);
      setIsSpeaking(false);
    }
  };

  const handleNext = () => {
    if (rounds.length === 0 || currentIndex >= rounds.length - 1) {
      onComplete();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setResponseText("");
    setFeedback("");
    setFeedbackError("");
  };

  const requestFeedback = async () => {
    const answer = responseText.trim();
    if (!answer || !currentRound) return;

    setFeedback("");
    setFeedbackError("");
    setIsFeedbackLoading(true);

    try {
      const prompt = `你是学习教练。请根据当前学习目标和练习任务，评价用户这一轮练习结果，并给出下一步改进建议。

学习目标：${goalTitle}
练习场景：${overview}
本轮任务：${currentRound.cue}
目标表达/动作要点：${currentRound.target || "无"}
示例答案或动作要点：${sampleAnswer || currentRound.target || "无"}
用户练习记录：${answer}

请用中文反馈，最多 4 句话。需要判断记录是否具体、是否符合本轮任务；指出做得好的地方、一个最重要的问题、下一轮应该怎么改。语言学习任务可以顺带纠正目标语言表达。`;

      const resp = await fetch(`${getApiBaseUrl()}/api/trpc/ai.chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { messages: [{ role: "user", content: prompt }] } }),
      });

      const respText = await resp.text();
      const data = JSON.parse(respText);

      if (data.error) {
        throw new Error(data.error.message || "检查失败");
      }

      const content = data?.result?.data?.json?.content;
      if (!content) {
        throw new Error("AI 没有返回反馈内容");
      }

      setFeedback(content.trim());
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "检查失败");
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const overview =
    typedPayload.instructions ||
    typedPayload.scenario ||
    typedPayload.data ||
    "进入场景后，先听示范，再开口完成本轮练习。";

  if (rounds.length === 0) {
    return (
      <View style={styles.emptyState}>
        <IconSymbol name="mic.fill" size={36} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {typedPayload.title || "实践练习"}
        </Text>
        <Text style={[styles.bodyText, { color: colors.muted }]}>{overview}</Text>
        {fallbackChecklist.length > 0 ? (
          <View style={styles.fallbackList}>
            {fallbackChecklist.map((item, index) => (
              <Text key={`${item}-${index}`} style={[styles.itemText, { color: colors.foreground }]}>
                {index + 1}. {item}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable style={[styles.completeBtn, { backgroundColor: colors.primary }]} onPress={onComplete}>
          <Text style={styles.completeBtnText}>完成练习</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {currentIndex + 1} / {rounds.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {canUseSpeech ? (
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "1A" }]}>
              <IconSymbol name="mic.fill" size={28} color={colors.primary} />
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {typedPayload.title || "实践练习"}
          </Text>
          {typedPayload.durationMinutes ? (
            <Text style={[styles.meta, { color: colors.muted }]}>
              预计 {typedPayload.durationMinutes} 分钟
            </Text>
          ) : null}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>练习场景</Text>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{overview}</Text>
        </View>

        <View style={[styles.roundCard, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}>
          <Text style={[styles.roundLabel, { color: colors.primary }]}>本轮任务</Text>
          <Text style={[styles.promptText, { color: colors.foreground }]}>{currentRound.cue}</Text>

          {currentRound.target ? (
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>目标表达</Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>{currentRound.target}</Text>
            </View>
          ) : null}

          {sampleAnswer ? (
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>示例</Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>{sampleAnswer}</Text>
            </View>
          ) : null}

          {currentRound.tips.length > 0 ? (
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>提示</Text>
              {currentRound.tips.map((tip, index) => (
                <Text key={`${tip}-${index}`} style={[styles.itemText, { color: colors.foreground }]}>
                  {index + 1}. {tip}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>你的练习记录</Text>
          <TextInput
            value={responseText}
            onChangeText={(text) => {
              setResponseText(text);
              setFeedback("");
              setFeedbackError("");
            }}
            placeholder="把你完成的选择、答案、操作过程或练习结果写在这里，提交给 AI 检查"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.responseInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          {feedback ? (
            <View style={[styles.feedbackBox, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.detailLabel, { color: colors.primary }]}>反馈结果</Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>{feedback}</Text>
            </View>
          ) : null}

          {feedbackError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{feedbackError}</Text>
          ) : null}
        </View>

        {criteria.length > 0 ? (
          <View style={styles.sectionPlain}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>完成标准</Text>
            <View style={styles.list}>
              {criteria.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.bulletRow}>
                  <IconSymbol name="checkmark.seal.fill" size={18} color={colors.primary} />
                  <Text style={[styles.itemText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {typedPayload.deliverable ? (
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>完成产出</Text>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{typedPayload.deliverable}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.footerActions}>
          {canUseSpeech ? (
            <Pressable
              style={[
                styles.secondaryBtn,
                { borderColor: colors.border, backgroundColor: isSpeaking ? colors.primary + "20" : colors.surface },
              ]}
              onPress={() => speak(sampleAnswer || currentRound.target || currentRound.cue)}
            >
              <IconSymbol
                name="speaker.wave.2.fill"
                size={20}
                color={isSpeaking ? colors.primary : colors.foreground}
              />
              <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>听示例</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: feedback ? colors.primary : responseText.trim() ? colors.warning : colors.border },
            ]}
            onPress={feedback ? handleNext : requestFeedback}
            disabled={!feedback && (!responseText.trim() || isFeedbackLoading)}
          >
            {isFeedbackLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <IconSymbol
                name={feedback ? "arrow.right" : "brain"}
                size={20}
                color="#fff"
              />
            )}
            <Text style={styles.primaryBtnText}>
              {feedback
                ? currentIndex < rounds.length - 1
                  ? "下一轮"
                  : "完成练习"
                : isFeedbackLoading
                  ? "AI 检查中"
                  : "提交检查"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", width: 48, textAlign: "right" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48, gap: 24 },
  header: { alignItems: "center", gap: 10 },
  iconWrap: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32, textAlign: "center" },
  meta: { fontSize: 13, fontWeight: "600" },
  section: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 10 },
  roundCard: { borderWidth: 1, borderRadius: 8, padding: 18, gap: 16 },
  sectionPlain: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  roundLabel: { fontSize: 13, fontWeight: "800" },
  promptText: { fontSize: 22, fontWeight: "800", lineHeight: 32 },
  detailBlock: { gap: 6 },
  detailLabel: { fontSize: 13, fontWeight: "700" },
  bodyText: { fontSize: 16, lineHeight: 26 },
  responseInput: { minHeight: 118, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, lineHeight: 22 },
  feedbackBox: { borderRadius: 8, padding: 12, gap: 6 },
  errorText: { fontSize: 14, lineHeight: 20 },
  list: { gap: 12 },
  fallbackList: { width: "100%", gap: 8 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  itemText: { fontSize: 15, lineHeight: 22 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth },
  footerActions: { flexDirection: "row", gap: 12 },
  secondaryBtn: {
    height: 52,
    minWidth: 112,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  completeBtn: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
