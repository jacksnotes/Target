import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { adapty, AdaptyPaywallProduct } from "react-native-adapty";
import { useAdapty } from "@/lib/adapty-context";

const { width } = Dimensions.get("window");

const PREMIUM_FEATURES = [
  { icon: "sparkles", title: "无限内容拆解", desc: "每日 AI 学习计划拆分次数无上限" },
  { icon: "paintbrush.fill", title: "全量主题解锁", desc: "立即可用所有梦幻樱粉、深夜极光等付费主题" },
  { icon: "waveform.path.ecg", title: "优先处理队列", desc: "高峰期享受更快速的 AI 生成体验" },
  { icon: "cloud.fill", title: "跨端同步", desc: "登录账号随时随地同步你的学习进度" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile, syncProfile } = useAdapty();
  const [products, setProducts] = useState<AdaptyPaywallProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const fetchPaywall = async () => {
      try {
        // Use your placement ID from Adapty Dashboard
        const paywall = await adapty.getPaywall("main_paywall");
        const prods = await adapty.getPaywallProducts(paywall);
        setProducts(prods);
      } catch (error) {
        console.error("[Paywall] Failed to fetch products:", error);
        // Mock data for UI demonstration if SDK fails (e.g. key/placement not set)
        setProducts([
          { vendorProductId: "com.shells.pack.1", price: { localizedString: "¥32.00" }, localizedTitle: "100 贝壳包" } as any,
          { vendorProductId: "com.membership.monthly", price: { localizedString: "¥58.00 / 月" }, localizedTitle: "Pro 会员按月" } as any,
          { vendorProductId: "com.membership.yearly", price: { localizedString: "¥298.00 / 年" }, localizedTitle: "Pro 会员按年" } as any,
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaywall();
  }, []);

  const handlePurchase = async (product: AdaptyPaywallProduct) => {
    setIsPurchasing(true);
    try {
      const result = await adapty.makePurchase(product);
      if (result.type === "success") {
        await syncProfile();
        Alert.alert("购买成功", "感谢你的支持，所有 Pro 功能已解锁！");
        router.back();
      }
    } catch (error: any) {
      if (error.adaptyCode !== "paymentCancelled") {
        Alert.alert("购买失败", error.message || "请稍后重试");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await adapty.restorePurchases();
      await syncProfile();
      Alert.alert("恢复成功", "已成功同步你的购买记录");
    } catch (error) {
      Alert.alert("恢复失败", "未能找到可用的购买记录");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={["#4F46E5", "#9333EA", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={handleRestore}>
              <Text style={styles.restoreText}>恢复购买</Text>
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <IconSymbol name="star.fill" size={40} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>解锁学习计划 Pro</Text>
            <Text style={styles.heroSubtitle}>让 AI 助你更高效地实现每一个硬核目标</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Features Grid */}
          <View style={styles.featuresHeader}>
            <View style={styles.sectionDivider} />
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>PRO 特权</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feat, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={[styles.featIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name={feat.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={styles.featText}>
                  <Text style={[styles.featTitle, { color: colors.foreground }]}>{feat.title}</Text>
                  <Text style={[styles.featDesc, { color: colors.muted }]}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              products.map((product) => (
                <Pressable
                  key={product.vendorProductId}
                  onPress={() => handlePurchase(product)}
                  style={({ pressed }) => [
                    styles.priceCard,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed || isPurchasing ? 0.8 : 1 }
                  ]}
                  disabled={isPurchasing}
                >
                  <View style={styles.priceInfo}>
                    <Text style={[styles.productTitle, { color: colors.foreground }]}>{product.localizedTitle}</Text>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>{product.price?.localizedString}</Text>
                  </View>
                  <View style={[styles.buyBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.buyBadgeText}>立即解锁</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            付费即视为同意《服务条款》与《隐私政策》
          </Text>
          <Text style={[styles.footerSub, { color: colors.muted }]}>
            除非在当前周期结束前 24 小时取消，否则订阅将自动续订。
          </Text>
        </View>
      </ScrollView>

      {isPurchasing && (
        <View style={styles.overlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>正在处理交易...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  hero: { height: 320, padding: 24, paddingTop: 60, justifyContent: "space-between" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 20 },
  restoreText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
  heroContent: { alignItems: "center", marginBottom: 20 },
  logoWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", textAlign: "center", letterSpacing: 0.5 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 16, textAlign: "center", marginTop: 8, lineHeight: 22 },
  body: { padding: 24 },
  featuresHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.05)" },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 },
  featuresGrid: { gap: 20 },
  featureItem: { flexDirection: "row", gap: 16, alignItems: "center" },
  featIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featText: { flex: 1, gap: 2 },
  featTitle: { fontSize: 16, fontWeight: "700" },
  featDesc: { fontSize: 13, lineHeight: 18 },
  pricingSection: { marginTop: 40, gap: 12 },
  priceCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderRadius: 18, borderWidth: 1.5 },
  priceInfo: { gap: 4 },
  productTitle: { fontSize: 15, fontWeight: "600" },
  productPrice: { fontSize: 18, fontWeight: "800" },
  buyBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  buyBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  footer: { paddingHorizontal: 40, alignItems: "center", gap: 8 },
  footerText: { fontSize: 11, textAlign: "center" },
  footerSub: { fontSize: 10, textAlign: "center", lineHeight: 14 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", zIndex: 100 },
  overlayText: { color: "#fff", marginTop: 16, fontSize: 14, fontWeight: "600" },
});
