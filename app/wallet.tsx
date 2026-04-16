import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { useColors } from "@/hooks/use-colors";
import {
  AI_SPLIT_PACK_PRICE,
  HARDCORE_REWARD_SHELLS,
  LEAVE_CARD_PRICE,
  MAKEUP_CARD_PRICE,
  SOUND_PRICE,
  THEME_PRICE,
} from "@/lib/storage";
import { ShellTransaction, ShellTransactionType } from "@/lib/types";
import { BADGES, getUnlockedBadges } from "@/lib/badges";
import { SOUND_OPTIONS } from "@/lib/sound-config";

const TRANSACTION_META: Record<
  ShellTransactionType,
  { title: string; colorKey: "primary" | "success" | "warning" | "error"; positive: boolean; icon: any }
> = {
  signup_bonus: { title: "注册赠送", colorKey: "success", positive: true, icon: "sparkles" },
  stake_lock: { title: "冻结承诺金", colorKey: "warning", positive: false, icon: "flame.fill" },
  stake_return: { title: "返还承诺金", colorKey: "success", positive: true, icon: "checkmark.circle.fill" },
  hardcore_reward: { title: "硬核奖励", colorKey: "primary", positive: true, icon: "trophy.fill" },
  normal_reward: { title: "目标奖励", colorKey: "success", positive: true, icon: "star.fill" },
  stake_burn: { title: "承诺金销毁", colorKey: "error", positive: false, icon: "xmark.circle.fill" },
  purchase_leave_card: { title: "兑换请假卡", colorKey: "warning", positive: false, icon: "calendar" },
  purchase_makeup_card: { title: "兑换补签卡", colorKey: "warning", positive: false, icon: "heart.fill" },
  use_leave_card: { title: "使用请假卡", colorKey: "primary", positive: false, icon: "calendar" },
  use_makeup_card: { title: "使用补签卡", colorKey: "primary", positive: false, icon: "heart.fill" },
  purchase_ai_split: { title: "兑换 AI 拆分包", colorKey: "primary", positive: false, icon: "sparkles" },
  purchase_theme: { title: "解锁主题", colorKey: "success", positive: false, icon: "paintbrush.fill" },
  purchase_sound: { title: "解锁铃声", colorKey: "success", positive: false, icon: "speaker.wave.2.fill" },
  use_ai_split: { title: "消耗 AI 拆分", colorKey: "primary", positive: false, icon: "sparkles" },
  membership_bonus: { title: "会员礼包", colorKey: "success", positive: true, icon: "gift.fill" },
};

export default function WalletScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, purchaseInventoryItem } = useGoals();

  const activeHardcoreGoals = useMemo(
    () => state.goals.filter((goal) => goal.isHardcore && goal.status === "active" && !goal.hardcoreSettledAt),
    [state.goals]
  );

  const lockedShells = useMemo(
    () => activeHardcoreGoals.reduce((sum, goal) => sum + (goal.stakedShells ?? 0), 0),
    [activeHardcoreGoals]
  );

  const earnedShells = useMemo(
    () =>
      state.transactions.reduce((sum, tx) => {
        if (tx.type === "signup_bonus" || tx.type === "stake_return" || tx.type === "hardcore_reward" || tx.type === "normal_reward") {
          return sum + tx.amount;
        }
        return sum;
      }, 0),
    [state.transactions]
  );

  const makeupUsedCount = useMemo(
    () => state.goals.filter((g) => g.makeupUsed).length,
    [state.goals]
  );

  const unlockedBadgesIds = useMemo(
    () => getUnlockedBadges(state.stats, state.inventory, makeupUsedCount, earnedShells),
    [state.stats, state.inventory, makeupUsedCount, earnedShells]
  );

  const handlePurchase = (itemType: any, extraId?: string) => {
    const result = purchaseInventoryItem(itemType, extraId);
    if (!result.ok) {
      Alert.alert("兑换失败", result.message ?? "请稍后重试");
      return;
    }
    let successMsg = "兑换成功";
    if (itemType === "leave_card") successMsg = "请假卡已放入你的道具库存";
    else if (itemType === "makeup_card") successMsg = "补签卡已放入你的道具库存";
    else if (itemType === "ai_split_pack") successMsg = "AI 拆分额度已到账";
    else if (itemType === "theme") successMsg = `主题 ${extraId} 已解锁，可前往设置切换`;
    else if (itemType === "sound") successMsg = `铃声 ${extraId} 已解锁，可前往设置切换`;
    
    Alert.alert("兑换成功", successMsg);
  };

  return (
    <ScreenContainer>
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}> 
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>贝壳钱包</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>当前可用</Text>
              <Text style={styles.heroBalance}>{state.wallet.balance}</Text>
              <Text style={styles.heroUnit}>贝壳</Text>
            </View>
            <Pressable 
              onPress={() => router.push("/paywall")}
              style={({ pressed }) => [
                styles.buyButton,
                { backgroundColor: "rgba(255,255,255,0.2)", opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={styles.buyButtonText}>充值</Text>
            </Pressable>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{lockedShells}</Text>
              <Text style={styles.heroMetaLabel}>冻结中</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{state.inventory.hardcoreStreak}</Text>
              <Text style={styles.heroMetaLabel}>连续硬核</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{earnedShells}</Text>
              <Text style={styles.heroMetaLabel}>累计入账</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>我的道具</Text>
          <View style={styles.inventoryRow}>
            <InventoryCard title="请假卡" count={state.inventory.leaveCards} subtitle="为硬核目标顺延 1 天" color={colors.warning} />
            <InventoryCard title="补签卡" count={state.inventory.makeupCards} subtitle="用于硬核失败后复活" color={colors.primary} />
            <InventoryCard title="AI 额度" count={state.inventory.aiSplitsRemaining} subtitle="用于智能拆分目标" color={colors.success} />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>我的徽章</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => {
              const isUnlocked = unlockedBadgesIds.includes(badge.id);
              return (
                <View key={badge.id} style={[styles.badgeItem, { opacity: isUnlocked ? 1 : 0.4 }]}>
                  <View style={[styles.badgeIconWrap, { backgroundColor: isUnlocked ? badge.color + "20" : colors.border }]}>
                    <IconSymbol name={badge.icon as any} size={24} color={isUnlocked ? badge.color : colors.muted} />
                  </View>
                  <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.name}</Text>
                  <Text style={[styles.badgeDesc, { color: colors.muted }]} numberOfLines={2}>{badge.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>贝壳商城</Text>
          <Text style={[styles.storeCategory, { color: colors.muted }]}>基础道具</Text>
          <StoreRow title="请假卡" subtitle="硬核目标可顺延 1 天" price={LEAVE_CARD_PRICE} color={colors.warning} onPress={() => handlePurchase("leave_card")} />
          <StoreRow title="补签卡" subtitle="用于硬核目标逾期后复活与顺延" price={MAKEUP_CARD_PRICE} color={colors.primary} onPress={() => handlePurchase("makeup_card")} />
          <StoreRow title="AI 拆分包" subtitle="包含 5 次 AI 智能拆分额度" price={AI_SPLIT_PACK_PRICE} color={colors.success} onPress={() => handlePurchase("ai_split_pack")} />
          
          <Text style={[styles.storeCategory, { color: colors.muted, marginTop: 12 }]}>高级主题</Text>
          <ThemeStoreRow id="forest" name="森林物语" price={THEME_PRICE} color="#10B981" isUnlocked={state.inventory.unlockedThemes.includes("forest")} onPress={() => handlePurchase("theme", "forest")} />
          <ThemeStoreRow id="sunset" name="日落大道" price={THEME_PRICE} color="#F97316" isUnlocked={state.inventory.unlockedThemes.includes("sunset")} onPress={() => handlePurchase("theme", "sunset")} />
          <ThemeStoreRow id="midnight" name="深夜极光" price={THEME_PRICE} color="#312E81" isUnlocked={state.inventory.unlockedThemes.includes("midnight")} onPress={() => handlePurchase("theme", "midnight")} />
          <ThemeStoreRow id="pink" name="梦幻樱粉" price={THEME_PRICE} color="#FB7185" isUnlocked={state.inventory.unlockedThemes.includes("pink")} onPress={() => handlePurchase("theme", "pink")} />

          <Text style={[styles.storeCategory, { color: colors.muted, marginTop: 12 }]}>端内音效</Text>
          {Object.entries(SOUND_OPTIONS).filter(([_, opt]) => opt.category === "premium").map(([id, opt]) => (
            <StoreRow key={id} title={opt.name} subtitle={opt.description} price={SOUND_PRICE} color={colors.muted} onPress={() => handlePurchase("sound", id)} locked={!state.inventory.unlockedSounds.includes(id)} />
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>硬核承诺规则</Text>
          <View style={styles.ruleList}>
            <RuleItem text="创建硬核目标时立即冻结承诺金，直到目标结算。" />
            <RuleItem text={`按期完成后返还承诺金，并额外奖励 ${HARDCORE_REWARD_SHELLS} 贝壳。`} />
            <RuleItem text="主动放弃或超时未完成，承诺金直接销毁，不进入用户奖池。" />
          </View>
        </View>

        {activeHardcoreGoals.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>冻结中的承诺</Text>
            <View style={styles.commitmentList}>
              {activeHardcoreGoals.map((goal) => {
                const remaining = goal.dueDate ? Math.ceil((goal.dueDate - Date.now()) / (24 * 60 * 60 * 1000)) : null;
                return (
                  <View key={goal.id} style={[styles.commitmentRow, { borderBottomColor: colors.border }]}> 
                    <View style={styles.commitmentTextWrap}>
                      <Text style={[styles.commitmentTitle, { color: colors.foreground }]} numberOfLines={1}>{goal.title}</Text>
                      <Text style={[styles.commitmentSubtitle, { color: colors.muted }]}>
                        {remaining === null ? "未设置截止时间" : remaining >= 0 ? `剩余 ${remaining} 天` : "已超时，等待结算"}
                      </Text>
                    </View>
                    <Text style={[styles.commitmentAmount, { color: colors.warning }]}>{goal.stakedShells ?? 0} 贝壳</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>流水记录</Text>
          {state.transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>还没有贝壳流水记录</Text>
          ) : (
            <View style={styles.transactionList}>
              {state.transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function RuleItem({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={styles.ruleItem}>
      <View style={[styles.ruleDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.ruleText, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

function InventoryCard({ title, count, subtitle, color }: { title: string; count: number; subtitle: string; color: string }) {
  return (
    <View style={[styles.inventoryCard, { borderColor: color + "40", backgroundColor: color + "10" }]}> 
      <Text style={[styles.inventoryCount, { color }]}>{count}</Text>
      <Text style={styles.inventoryTitle}>{title}</Text>
      <Text style={styles.inventorySubtitle}>{subtitle}</Text>
    </View>
  );
}

function StoreRow({ title, subtitle, price, color, onPress, locked }: { title: string; subtitle: string; price: number; color: string; onPress: () => void; locked?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.storeRow, { borderBottomColor: colors.border }]}> 
      <View style={styles.storeTextWrap}>
        <View style={styles.storeTitleRow}>
          <Text style={[styles.storeTitle, { color: colors.foreground }]}>{title}</Text>
          {!locked && locked !== undefined && (
            <View style={[styles.unlockedBadge, { backgroundColor: colors.success + "20" }]}>
              <Text style={[styles.unlockedText, { color: colors.success }]}>已拥有</Text>
            </View>
          )}
        </View>
        <Text style={[styles.storeSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Pressable 
        onPress={onPress} 
        disabled={locked === false}
        style={({ pressed }) => [
          styles.storeButton, 
          { backgroundColor: locked === false ? colors.border : color, opacity: pressed ? 0.8 : 1 }
        ]}
      > 
        {locked === false ? (
          <Text style={styles.storeButtonText}>已拥有</Text>
        ) : (
          <View style={styles.priceContainer}>
            <IconSymbol name="sparkles" size={12} color="#fff" />
            <Text style={styles.storeButtonText}>{price}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function ThemeStoreRow({ id, name, price, color, isUnlocked, onPress }: { id: string; name: string; price: number; color: string; isUnlocked: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.storeRow, { borderBottomColor: colors.border }]}> 
      <View style={[styles.themePreview, { backgroundColor: color }]} />
      <View style={styles.storeTextWrap}>
        <Text style={[styles.storeTitle, { color: colors.foreground }]}>{name}</Text>
        <Text style={[styles.storeSubtitle, { color: colors.muted }]}>{isUnlocked ? "已解锁" : "永久解锁该配色方案"}</Text>
      </View>
      <Pressable 
        onPress={onPress} 
        disabled={isUnlocked}
        style={({ pressed }) => [
          styles.storeButton, 
          { backgroundColor: isUnlocked ? colors.border : color, opacity: pressed ? 0.8 : 1 }
        ]}
      > 
        {isUnlocked ? (
          <Text style={styles.storeButtonText}>已解锁</Text>
        ) : (
          <View style={styles.priceContainer}>
            <IconSymbol name="sparkles" size={12} color="#fff" />
            <Text style={styles.storeButtonText}>{price}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: ShellTransaction }) {
  const colors = useColors();
  const meta = TRANSACTION_META[transaction.type];
  const accent = meta.colorKey === "success" ? colors.success : meta.colorKey === "warning" ? colors.warning : meta.colorKey === "error" ? colors.error : colors.primary;

  return (
    <View style={[styles.transactionRow, { borderBottomColor: colors.border }]}> 
      <View style={[styles.transactionIcon, { backgroundColor: accent + "18" }]}> 
        <IconSymbol name={meta.icon} size={16} color={accent} />
      </View>
      <View style={styles.transactionTextWrap}>
        <Text style={[styles.transactionTitle, { color: colors.foreground }]}>{meta.title}</Text>
        <Text style={[styles.transactionNote, { color: colors.muted }]}>{transaction.note}</Text>
        <Text style={[styles.transactionTime, { color: colors.muted }]}>{new Date(transaction.createdAt).toLocaleString("zh-CN")}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: accent }]}>{transaction.amount === 0 ? "已销毁" : `${meta.positive ? "+" : ""}${transaction.amount}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "600", lineHeight: 24, flex: 1, textAlign: "center" },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 16, padding: 20 },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 },
  heroBalance: { color: "#fff", fontSize: 40, fontWeight: "800", lineHeight: 48, marginTop: 8 },
  heroUnit: { color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 22, marginTop: 2 },
  buyButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 8 },
  buyButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  heroMetaItem: { flex: 1, alignItems: "center" },
  heroMetaValue: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 24 },
  heroMetaLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 16, marginTop: 4 },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "rgba(255,255,255,0.25)" },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
  inventoryRow: { flexDirection: "row", gap: 12 },
  inventoryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  inventoryCount: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  inventoryTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  inventorySubtitle: { color: "#6b7280", fontSize: 12, lineHeight: 18 },
  storeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  storeTextWrap: { flex: 1, gap: 2 },
  storeTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  storeSubtitle: { fontSize: 12, lineHeight: 18 },
  storeButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, minWidth: 70, alignItems: "center" },
  storeButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  storeCategory: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  storeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  unlockedText: { fontSize: 10, fontWeight: "700" },
  themePreview: { width: 40, height: 40, borderRadius: 20 },
  ruleList: { gap: 10 },
  ruleItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  ruleDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  ruleText: { flex: 1, fontSize: 14, lineHeight: 22 },
  commitmentList: { gap: 0 },
  commitmentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  commitmentTextWrap: { flex: 1, gap: 4 },
  commitmentTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  commitmentSubtitle: { fontSize: 12, lineHeight: 18 },
  commitmentAmount: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  transactionList: { gap: 0 },
  transactionRow: { flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  transactionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  transactionTextWrap: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  transactionNote: { fontSize: 13, lineHeight: 18 },
  transactionTime: { fontSize: 12, lineHeight: 18 },
  transactionAmount: { fontSize: 14, fontWeight: "700", lineHeight: 22, alignSelf: "center" },
  emptyText: { fontSize: 14, lineHeight: 22 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  badgeItem: { width: "30%", alignItems: "center", gap: 6 },
  badgeIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  badgeName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  badgeDesc: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
