import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  findPlanById,
  findCategoryByPlanId,
  PlanTemplate,
} from "@/lib/popular-plans";
import { useGoals } from "@/lib/goals-context";
import { ExecutionType } from "@/lib/types";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Haptics from "expo-haptics";

type GeneratedTask = {
  dayIndex: number;
  title: string;
  description: string;
  executionType: string;
};

// ─── Execution Type Info ────────────────────────────────────
const EXECUTION_TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  flashcard: { icon: "list.bullet", label: "卡片学习", color: "#8B5CF6" },
  reading: { icon: "book.fill", label: "文章阅读", color: "#3B82F6" },
  coding: { icon: "chevron.left.forwardslash.chevron.right", label: "代码练习", color: "#10B981" },
  checklist: { icon: "checkmark.circle.fill", label: "打卡任务", color: "#F59E0B" },
  quiz: { icon: "questionmark.circle", label: "测验问答", color: "#EC4899" },
  practice: { icon: "figure.run", label: "实践练习", color: "#F97316" },
};

// ─── Step Indicator ─────────────────────────────────────────
function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  const colors = useColors();
  return (
    <View style={si.container}>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <View
              style={[
                si.line,
                {
                  backgroundColor:
                    i <= currentStep ? colors.primary : colors.border,
                },
              ]}
            />
          )}
          <View style={si.stepItem}>
            <View
              style={[
                si.dot,
                {
                  backgroundColor:
                    i <= currentStep ? colors.primary : colors.border,
                },
              ]}
            >
              {i < currentStep ? (
                <IconSymbol name="checkmark" size={10} color="#fff" />
              ) : (
                <Text
                  style={[
                    si.dotText,
                    { color: i <= currentStep ? "#fff" : colors.muted },
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                si.label,
                {
                  color: i <= currentStep ? colors.primary : colors.muted,
                  fontWeight: i === currentStep ? "600" : "400",
                },
              ]}
            >
              {label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const si = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 4,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});

// ─── Main Screen ────────────────────────────────────────────
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addGoal } = useGoals();

  const plan = findPlanById(id ?? "");
  const category = findCategoryByPlanId(id ?? "");

  const [step, setStep] = useState<"info" | "level" | "generating" | "preview">("info");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const stepIndex = step === "info" ? 0 : 1;

  const handleStartPlan = () => {
    setStep("level");
  };

  const handleGeneratePlan = useCallback(() => {
    if (!plan || !selectedLevel) return;

    const levelLabel = plan.levelOptions.find(
      (o) => o.value === selectedLevel
    )?.label ?? "";

    // Redirect to goal creation with context
    router.push({
      pathname: "/goal/create",
      params: {
        title: plan.title,
        description: plan.description,
        context: `${plan.aiContext}\n用户水平：${levelLabel}`,
        fromPlan: "true",
      },
    });
  }, [plan, selectedLevel, router]);

  const toggleDayExpanded = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  };

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundWrap}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.muted} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            未找到该计划
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backToListBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.backToListBtnText}>返回列表</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const difficultyLabel =
    plan.difficulty === "beginner"
      ? "入门"
      : plan.difficulty === "intermediate"
      ? "进阶"
      : "高级";
  const difficultyColor =
    plan.difficulty === "beginner"
      ? "#10B981"
      : plan.difficulty === "intermediate"
      ? "#F59E0B"
      : "#EF4444";

  const categoryColor = category?.iconColor ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {plan.title}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={stepIndex}
        steps={["了解计划", "选择水平"]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Step: Info ═══ */}
        {step === "info" && (
          <View style={styles.stepContent}>
            {/* Plan Hero Card */}
            <View
              style={[styles.heroCard, { backgroundColor: categoryColor }]}
            >
              {/* Decorative circles */}
              <View style={[styles.decoCircle1]} />
              <View style={[styles.decoCircle2]} />

              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <IconSymbol name={plan.iconName as any} size={40} color="#fff" />
                </View>
                <Text style={styles.heroTitle}>{plan.title}</Text>
                <Text style={styles.heroSubtitle}>{plan.subtitle}</Text>
                <View style={styles.heroMeta}>
                  <View style={styles.heroMetaItem}>
                    <IconSymbol name="clock.fill" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroMetaText}>{plan.duration}</Text>
                  </View>
                  <View style={styles.heroMetaDivider} />
                  <View style={styles.heroMetaItem}>
                    <IconSymbol name="chart.bar.fill" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroMetaText}>{difficultyLabel}</Text>
                  </View>
                  <View style={styles.heroMetaDivider} />
                  <View style={styles.heroMetaItem}>
                    <IconSymbol name="sparkles" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroMetaText}>AI 定制</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View
              style={[
                styles.infoSection,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoSectionHeader}>
                <IconSymbol name="doc.text.fill" size={18} color={categoryColor} />
                <Text style={[styles.infoSectionTitle, { color: colors.foreground }]}>
                  计划简介
                </Text>
              </View>
              <Text style={[styles.infoSectionText, { color: colors.muted }]}>
                {plan.description}
              </Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsWrap}>
              {plan.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tag,
                    { backgroundColor: categoryColor + "12" },
                  ]}
                >
                  <Text style={[styles.tagText, { color: categoryColor }]}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* What You'll Get */}
            <View
              style={[
                styles.infoSection,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoSectionHeader}>
                <IconSymbol name="sparkles" size={18} color={categoryColor} />
                <Text style={[styles.infoSectionTitle, { color: colors.foreground }]}>
                  你将获得
                </Text>
              </View>
              <View style={styles.featureList}>
                {[
                  { icon: "brain", text: "AI 智能拆解每日学习任务" },
                  { icon: "checkmark.circle.fill", text: "端内闭环执行，无需跳转" },
                  { icon: "chart.bar.fill", text: "进度自动追踪，完成即打卡" },
                  { icon: "bell.fill", text: "每日学习提醒，养成习惯" },
                ].map((item, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: categoryColor + "12" }]}>
                      <IconSymbol name={item.icon as any} size={16} color={categoryColor} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.foreground }]}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Start Button */}
            <Pressable
              onPress={handleStartPlan}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: categoryColor,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <IconSymbol name="sparkles" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>开始此计划</Text>
            </Pressable>
          </View>
        )}

        {/* ═══ Step: Level Selection ═══ */}
        {step === "level" && (
          <View style={styles.stepContent}>
            <View style={styles.levelHeader}>
              <View style={[styles.levelIconWrap, { backgroundColor: categoryColor + "15" }]}>
                <IconSymbol name="questionmark.circle" size={32} color={categoryColor} />
              </View>
              <Text style={[styles.levelTitle, { color: colors.foreground }]}>
                你目前的水平是？
              </Text>
              <Text style={[styles.levelSubtitle, { color: colors.muted }]}>
                AI 将根据你的水平定制专属学习计划
              </Text>
            </View>

            <View style={styles.levelOptions}>
              {plan.levelOptions.map((option, idx) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSelectedLevel(option.value);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.levelOption,
                    {
                      backgroundColor:
                        selectedLevel === option.value
                          ? categoryColor + "12"
                          : colors.surface,
                      borderColor:
                        selectedLevel === option.value
                          ? categoryColor
                          : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.levelRadio,
                      {
                        borderColor:
                          selectedLevel === option.value
                            ? categoryColor
                            : colors.muted,
                        backgroundColor:
                          selectedLevel === option.value
                            ? categoryColor
                            : "transparent",
                      },
                    ]}
                  >
                    {selectedLevel === option.value && (
                      <IconSymbol name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <View style={styles.levelOptionTextWrap}>
                    <Text
                      style={[
                        styles.levelOptionText,
                        {
                          color:
                            selectedLevel === option.value
                              ? categoryColor
                              : colors.foreground,
                          fontWeight:
                            selectedLevel === option.value ? "600" : "400",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {selectedLevel === option.value && (
                    <View style={[styles.levelSelectedBadge, { backgroundColor: categoryColor + "18" }]}>
                      <Text style={[styles.levelSelectedBadgeText, { color: categoryColor }]}>已选</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Removed Custom Days Selection as per user request */}

            {/* Generate Button */}
            <Pressable
              onPress={handleGeneratePlan}
              disabled={!selectedLevel}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: selectedLevel ? categoryColor : colors.muted,
                  opacity: pressed && selectedLevel ? 0.88 : 1,
                  transform: [{ scale: pressed && selectedLevel ? 0.97 : 1 }],
                },
              ]}
            >
              <IconSymbol name="checkmark" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>选中此计划</Text>
            </Pressable>

            {/* Back Button */}
            <Pressable
              onPress={() => setStep("info")}
              style={({ pressed }) => [
                styles.ghostBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.ghostBtnText, { color: colors.muted }]}>
                ← 返回计划详情
              </Text>
            </Pressable>
          </View>
        )}

        {/* ═══ Steps for Generating and Preview removed as they moved to separate screens ═══ */}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  stepContent: {
    gap: 18,
  },

  // Not found
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
  },
  backToListBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backToListBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 22,
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  decoCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -30,
    right: -30,
  },
  decoCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -20,
    left: -10,
  },
  heroContent: {
    alignItems: "center",
    gap: 10,
    position: "relative",
    zIndex: 1,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    lineHeight: 18,
  },
  heroMetaDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  // Info Section
  infoSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  infoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  infoSectionText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Tags
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Features
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  // Buttons
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 22,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  ghostBtnText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Level step
  levelHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  levelIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
  },
  levelSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  levelOptions: {
    gap: 10,
  },
  levelOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  levelRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  levelOptionTextWrap: {
    flex: 1,
  },
  levelOptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  levelSelectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelSelectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  customDaysCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  customDaysHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customDaysLabel: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  customDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customDaysInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  customDaysUnit: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },

  // Generating step
  generatingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  generatingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  generatingInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  generatingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  generatingDots: {
    flexDirection: "row",
    gap: 24,
    marginTop: 20,
  },
  generatingStep: {
    alignItems: "center",
    gap: 6,
  },
  generatingStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  generatingStepText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Preview step
  previewHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
  },
  previewSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Task Preview
  taskPreviewList: {
    gap: 8,
  },
  taskPreviewListTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 4,
  },
  taskPreviewItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  taskDayBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskDayText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  taskPreviewTextWrap: {
    flex: 1,
    gap: 4,
  },
  taskPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  taskTypeBadgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  taskTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskTypeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
  taskExpandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 0,
  },
  taskExpandedDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
});
