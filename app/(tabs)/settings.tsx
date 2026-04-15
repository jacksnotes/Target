import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

interface SettingRowProps {
  iconName: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingRow({
  iconName,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  destructive,
}: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: iconColor + "18" }]}
      >
        <IconSymbol name={iconName as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text
          style={[
            styles.settingTitle,
            { color: destructive ? colors.error : colors.foreground },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (onPress && !right ? (
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      ) : null)}
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme: currentScheme, setColorScheme } = useThemeContext();
  const { state, deleteGoal } = useGoals();

  const isDark = currentScheme === "dark";
  const toggleTheme = () => setColorScheme(isDark ? "light" : "dark");

  const handleClearData = () => {
    Alert.alert(
      "清除所有数据",
      "此操作将删除所有学习目标和统计数据，且不可撤销。确定继续吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "清除",
          style: "destructive",
          onPress: () => {
            state.goals.forEach((g) => deleteGoal(g.id));
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            设置
          </Text>
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.primary }]}>
          <View style={styles.appInfoIconContainer}>
            <IconSymbol name="book.fill" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.appInfoName}>学习计划</Text>
            <Text style={styles.appInfoVersion}>版本 1.0.0</Text>
          </View>
        </View>

        {/* Appearance */}
        <SettingSection title="外观">
          <SettingRow
            iconName={isDark ? "moon.fill" : "sun.max.fill"}
            iconColor={colors.primary}
            title="深色模式"
            subtitle={isDark ? "已开启" : "已关闭"}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SettingSection>

        {/* Data */}
        <SettingSection title="数据">
          <SettingRow
            iconName="chart.bar.fill"
            iconColor={colors.success}
            title="学习目标数"
            subtitle={`共 ${state.stats.totalGoals} 个目标`}
          />
          <SettingRow
            iconName="checkmark.circle.fill"
            iconColor={colors.primary}
            title="已完成任务"
            subtitle={`${state.stats.completedTasks} / ${state.stats.totalTasks} 个任务`}
          />
          <SettingRow
            iconName="flame.fill"
            iconColor={colors.warning}
            title="连续学习天数"
            subtitle={`${state.stats.streakDays} 天`}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="危险操作">
          <SettingRow
            iconName="trash"
            iconColor={colors.error}
            title="清除所有数据"
            subtitle="删除所有目标和统计记录"
            onPress={handleClearData}
            destructive
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="关于">
          <SettingRow
            iconName="lightbulb.fill"
            iconColor={colors.primary}
            title="使用技巧"
            subtitle="如何高效使用学习计划工具"
          />
          <SettingRow
            iconName="sparkles"
            iconColor={colors.primary}
            title="AI 功能说明"
            subtitle="AI 智能拆分任务由大语言模型提供支持"
          />
        </SettingSection>

        <Text style={[styles.footer, { color: colors.muted }]}>
          学习计划 · 让每一天都有所进步
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    gap: 20,
  },
  header: {
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  appInfo: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  appInfoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  appInfoName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 28,
  },
  appInfoVersion: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  settingSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
