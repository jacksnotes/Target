import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40 - 32; // padding + card padding
const CHART_HEIGHT = 120;

type TimeRange = "week" | "month";

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDayLabel(dateStr: string, range: TimeRange): string {
  const d = new Date(dateStr);
  if (range === "week") {
    return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  }
  return `${d.getDate()}`;
}

export default function StatsScreen() {
  const colors = useColors();
  const { state } = useGoals();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const days = timeRange === "week" ? getLast7Days() : getLast30Days();

  const chartData = useMemo(() => {
    return days.map((date) => {
      const stat = state.stats.dailyStats.find((s) => s.date === date);
      return {
        date,
        completed: stat?.completedTasks ?? 0,
        total: stat?.totalTasks ?? 0,
        label: formatDayLabel(date, timeRange),
      };
    });
  }, [days, state.stats.dailyStats, timeRange]);

  const maxCompleted = Math.max(...chartData.map((d) => d.completed), 1);

  const totalCompletedInRange = chartData.reduce((sum, d) => sum + d.completed, 0);
  const activeDaysInRange = chartData.filter((d) => d.completed > 0).length;

  const completionRate =
    state.stats.totalTasks > 0
      ? Math.round((state.stats.completedTasks / state.stats.totalTasks) * 100)
      : 0;

  const barWidth = timeRange === "week"
    ? (CHART_WIDTH - 16) / 7 - 4
    : (CHART_WIDTH - 16) / 30 - 1;
  const barGap = timeRange === "week" ? 4 : 1;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            学习统计
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryNum}>{state.stats.streakDays}</Text>
            <Text style={styles.summaryLabel}>连续天数</Text>
            <IconSymbol name="flame.fill" size={18} color="rgba(255,255,255,0.8)" style={styles.summaryIcon} />
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
            <Text style={styles.summaryNum}>{state.stats.completedGoals}</Text>
            <Text style={styles.summaryLabel}>完成目标</Text>
            <IconSymbol name="trophy.fill" size={18} color="rgba(255,255,255,0.8)" style={styles.summaryIcon} />
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.warning }]}>
            <Text style={styles.summaryNum}>{completionRate}%</Text>
            <Text style={styles.summaryLabel}>完成率</Text>
            <IconSymbol name="chart.bar.fill" size={18} color="rgba(255,255,255,0.8)" style={styles.summaryIcon} />
          </View>
        </View>

        {/* Chart Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              任务完成趋势
            </Text>
            <View style={styles.rangeToggle}>
              {(["week", "month"] as TimeRange[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setTimeRange(r)}
                  style={[
                    styles.rangeBtn,
                    {
                      backgroundColor:
                        timeRange === r ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeBtnText,
                      {
                        color: timeRange === r ? "#fff" : colors.muted,
                        fontWeight: timeRange === r ? "600" : "400",
                      },
                    ]}
                  >
                    {r === "week" ? "本周" : "本月"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
              {/* Baseline */}
              <Line
                x1={0}
                y1={CHART_HEIGHT}
                x2={CHART_WIDTH}
                y2={CHART_HEIGHT}
                stroke={colors.border}
                strokeWidth={1}
              />
              {chartData.map((d, idx) => {
                const barH = maxCompleted > 0
                  ? Math.max(4, (d.completed / maxCompleted) * (CHART_HEIGHT - 8))
                  : 4;
                const x = idx * (barWidth + barGap) + 8;
                const y = CHART_HEIGHT - barH;
                return (
                  <React.Fragment key={d.date}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={timeRange === "week" ? 4 : 2}
                      fill={d.completed > 0 ? colors.primary : colors.border}
                      opacity={d.completed > 0 ? 1 : 0.4}
                    />
                    {timeRange === "week" && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={CHART_HEIGHT + 16}
                        textAnchor="middle"
                        fontSize={11}
                        fill={colors.muted}
                      >
                        {d.label}
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          <View style={styles.chartStats}>
            <View style={styles.chartStatItem}>
              <Text style={[styles.chartStatNum, { color: colors.foreground }]}>
                {totalCompletedInRange}
              </Text>
              <Text style={[styles.chartStatLabel, { color: colors.muted }]}>
                {timeRange === "week" ? "本周完成" : "本月完成"}
              </Text>
            </View>
            <View style={[styles.chartStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.chartStatItem}>
              <Text style={[styles.chartStatNum, { color: colors.foreground }]}>
                {activeDaysInRange}
              </Text>
              <Text style={[styles.chartStatLabel, { color: colors.muted }]}>
                学习天数
              </Text>
            </View>
            <View style={[styles.chartStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.chartStatItem}>
              <Text style={[styles.chartStatNum, { color: colors.foreground }]}>
                {activeDaysInRange > 0
                  ? (totalCompletedInRange / activeDaysInRange).toFixed(1)
                  : "0"}
              </Text>
              <Text style={[styles.chartStatLabel, { color: colors.muted }]}>
                日均完成
              </Text>
            </View>
          </View>
        </View>

        {/* Goals Overview */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            目标概览
          </Text>
          <View style={styles.goalOverviewRow}>
            <View style={styles.goalOverviewItem}>
              <View style={[styles.goalOverviewDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.goalOverviewLabel, { color: colors.muted }]}>
                进行中
              </Text>
              <Text style={[styles.goalOverviewNum, { color: colors.foreground }]}>
                {state.stats.totalGoals - state.stats.completedGoals}
              </Text>
            </View>
            <View style={styles.goalOverviewItem}>
              <View style={[styles.goalOverviewDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.goalOverviewLabel, { color: colors.muted }]}>
                已完成
              </Text>
              <Text style={[styles.goalOverviewNum, { color: colors.foreground }]}>
                {state.stats.completedGoals}
              </Text>
            </View>
            <View style={styles.goalOverviewItem}>
              <View style={[styles.goalOverviewDot, { backgroundColor: colors.border }]} />
              <Text style={[styles.goalOverviewLabel, { color: colors.muted }]}>
                总目标
              </Text>
              <Text style={[styles.goalOverviewNum, { color: colors.foreground }]}>
                {state.stats.totalGoals}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {state.stats.totalGoals > 0 && (
            <View style={styles.overallProgressSection}>
              <View style={[styles.overallProgressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.overallProgressFill,
                    {
                      backgroundColor: colors.success,
                      width: `${Math.round((state.stats.completedGoals / state.stats.totalGoals) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.overallProgressText, { color: colors.muted }]}>
                目标完成率 {Math.round((state.stats.completedGoals / state.stats.totalGoals) * 100)}%
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    gap: 16,
  },
  header: {
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 32,
  },
  summaryLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
    marginTop: 2,
  },
  summaryIcon: {
    position: "absolute",
    right: 10,
    top: 10,
    fontSize: 24,
    lineHeight: 32,
    opacity: 0.6,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  rangeToggle: {
    flexDirection: "row",
    backgroundColor: "transparent",
    gap: 2,
  },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rangeBtnText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chartContainer: {
    alignItems: "flex-start",
  },
  chartStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  chartStatItem: {
    alignItems: "center",
    gap: 2,
  },
  chartStatNum: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  chartStatLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  chartStatDivider: {
    width: 1,
    height: 28,
  },
  goalOverviewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  goalOverviewItem: {
    alignItems: "center",
    gap: 4,
  },
  goalOverviewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalOverviewLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  goalOverviewNum: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  overallProgressSection: {
    gap: 6,
  },
  overallProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  overallProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  overallProgressText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
