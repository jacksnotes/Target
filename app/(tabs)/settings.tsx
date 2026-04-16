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
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useSupabaseAuth } from "@/lib/auth-context";

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
      <View style={[styles.settingIcon, { backgroundColor: iconColor + "18" }]}>
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
          <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        )}
      </View>
      {right || (onPress && !right ? <IconSymbol name="chevron.right" size={16} color={colors.muted} /> : null)}
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
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme: currentScheme, setColorScheme } = useThemeContext();
  const { state, deleteGoal } = useGoals();
  const { user, signOut } = useSupabaseAuth();

  const isDark = currentScheme === "dark";
  const toggleTheme = () => setColorScheme(isDark ? "light" : "dark");

  const activeHardcoreGoals = state.goals.filter(
    (goal) => goal.isHardcore && goal.status === "active" && !goal.hardcoreSettledAt
  );
  const lockedShells = activeHardcoreGoals.reduce((sum, goal) => sum + (goal.stakedShells ?? 0), 0);

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>设置</Text>
        </View>

        <Pressable 
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Alert.alert("个人信息", `已登录账号: ${user?.email}`)}
        >
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary + "18" }]}>
            <IconSymbol name="person.fill" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>当前账号</Text>
            <Text style={[styles.profileEmail, { color: colors.muted }]}>{user?.email ?? "未登录"}</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </Pressable>

        <SettingSection title="外观与主题">
          <View style={styles.themeGrid}>
            {[
              { id: "light", name: "极致轻盈", color: "#F8FAFC" },
              { id: "dark", name: "深邃暗黑", color: "#0F172A" },
              { id: "forest", name: "森林物语", color: "#065F46", premium: true },
              { id: "sunset", name: "落日余晖", color: "#9A3412", premium: true },
              { id: "midnight", name: "午夜极光", color: "#312E81", premium: true },
              { id: "pink", name: "梦幻樱粉", color: "#FB7185", premium: true },
            ].map((t) => {
              const isUnlocked = !t.premium || state.inventory.unlockedThemes.includes(t.id);
              const isSelected = currentScheme === t.id;
              
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    if (isUnlocked) {
                      setColorScheme(t.id as any);
                    } else {
                      Alert.alert("主题锁定", "该主题需要在贝壳商城解锁后使用。", [
                        { text: "去商城", onPress: () => router.push("/wallet") },
                        { text: "好", style: "cancel" }
                      ]);
                    }
                  }}
                  style={[
                    styles.themeItem,
                    { borderColor: isSelected ? colors.primary : colors.border }
                  ]}
                >
                  <View style={[styles.themePreview, { backgroundColor: t.color }]}>
                    {!isUnlocked && <IconSymbol name="lock.fill" size={14} color="#fff" />}
                    {isSelected && <IconSymbol name="checkmark.circle.fill" size={18} color={colors.primary} />}
                  </View>
                  <Text style={[styles.themeName, { color: isSelected ? colors.primary : colors.foreground }]}>
                    {t.name}
                  </Text>
                  {t.premium && !isUnlocked && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>PREMIUM</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </SettingSection>

        <SettingSection title="贝壳与统计">
          <SettingRow
            iconName="banknote.fill"
            iconColor={colors.warning}
            title="贝壳钱包"
            subtitle={`当前 ${state.wallet.balance} 贝壳`}
            onPress={() => router.push("/wallet")}
          />
          <SettingRow
            iconName="flame.fill"
            iconColor={colors.warning}
            title="硬核承诺中"
            subtitle={`${activeHardcoreGoals.length} 个目标，冻结 ${lockedShells} 贝壳`}
          />

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

        <SettingSection title="账号">
          <SettingRow
            iconName="person.fill"
            iconColor={colors.error}
            title="退出登录"
            subtitle="退出后需要重新登录才能同步数据"
            destructive
            onPress={() => {
              Alert.alert("退出登录", "确定要退出当前账号吗？", [
                { text: "取消", style: "cancel" },
                {
                  text: "退出",
                  style: "destructive",
                  onPress: () => {
                    signOut().catch((error) => {
                      Alert.alert("退出失败", error instanceof Error ? error.message : "请稍后重试");
                    });
                  },
                },
              ]);
            }}
          />
        </SettingSection>

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

        <SettingSection title="关于">
          <SettingRow iconName="lightbulb.fill" iconColor={colors.primary} title="使用技巧" subtitle="如何更高效地使用学习计划" />
          <SettingRow iconName="sparkles" iconColor={colors.primary} title="AI 功能说明" subtitle="AI 智能拆分任务由大语言模型提供支持" />
          
          <View style={[styles.appInfoBottom, { borderTopColor: colors.border }]}> 
            <View style={[styles.appInfoIconContainerSmall, { backgroundColor: colors.primary + "18" }]}>
              <IconSymbol name="book.fill" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.appInfoNameSmall, { color: colors.foreground }]}>学习计划</Text>
              <Text style={[styles.appInfoVersionSmall, { color: colors.muted }]}>版本 1.0.0</Text>
            </View>
          </View>
        </SettingSection>

        <Text style={[styles.footer, { color: colors.muted }]}>学习计划 · 让每一天都有所进步</Text>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
  },
  appInfoBottom: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  appInfoIconContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appInfoNameSmall: {
    fontSize: 14,
    fontWeight: "700",
  },
  appInfoVersionSmall: {
    fontSize: 11,
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
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  themeItem: {
    width: "30%",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
  },
  themePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  themeName: {
    fontSize: 11,
    fontWeight: "600",
  },
  premiumBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  premiumText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
});
