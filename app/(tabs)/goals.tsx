import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GoalCard } from "@/components/goal-card";
import { EmptyState } from "@/components/empty-state";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GoalStatus } from "@/lib/types";

type FilterTab = "all" | "active" | "completed";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "completed", label: "已完成" },
];

export default function GoalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useGoals();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredGoals = useMemo(() => {
    return state.goals
      .filter((g) => {
        if (filter === "all") return g.status !== "archived";
        return g.status === filter;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [state.goals, filter]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          学习目标
        </Text>
        <Pressable
          onPress={() => router.push("/goal/create" as any)}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[
              styles.filterTab,
              filter === tab.key && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color: filter === tab.key ? colors.primary : colors.muted,
                  fontWeight: filter === tab.key ? "600" : "400",
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={filter === "completed" ? "trophy.fill" : "target"}
            title={filter === "completed" ? "还没有完成的目标" : "还没有学习目标"}
            description={
              filter === "completed"
                ? "完成所有任务后，目标会自动标记为已完成"
                : "点击右上角「+」创建你的第一个学习目标"
            }
            action={
              filter !== "completed" ? (
                <Pressable
                  onPress={() => router.push("/goal/create" as any)}
                  style={({ pressed }) => [
                    styles.emptyActionBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.emptyActionText}>创建目标</Text>
                </Pressable>
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => router.push(`/goal/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabText: {
    fontSize: 15,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  emptyActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
});
