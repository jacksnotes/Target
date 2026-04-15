import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { PLAN_CATEGORIES, PlanCategory, PlanTemplate } from "@/lib/popular-plans";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Animated Hero Card ─────────────────────────────────────
function HeroBanner({ onExplore }: { onExplore: () => void }) {
  const colors = useColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.heroBanner}>
      <View style={[styles.heroBg, { backgroundColor: colors.primary }]}>
        {/* Decorative circles */}
        <View style={[styles.heroCircle, styles.heroCircle1]} />
        <View style={[styles.heroCircle, styles.heroCircle2]} />
        <View style={[styles.heroCircle, styles.heroCircle3]} />

        <View style={styles.heroContent}>
          <View style={styles.heroTitleRow}>
            <IconSymbol name="sparkles" size={22} color="#FFD700" />
            <Text style={styles.heroBadge}>AI 智能推荐</Text>
          </View>
          <Text style={styles.heroTitle}>发现你的学习计划</Text>
          <Text style={styles.heroSubtitle}>
            50+ 热门学习计划，AI 帮你拆解每日任务{"\n"}
            端内闭环执行，轻松养成学习习惯
          </Text>
          <Pressable
            onPress={onExplore}
            style={({ pressed }) => [
              styles.heroBtn,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.heroBtnText}>开始探索</Text>
            <IconSymbol name="arrow.right" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Category Pill ──────────────────────────────────────────
function CategoryPill({
  category,
  isSelected,
  onPress,
}: {
  category: PlanCategory;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.categoryPill,
          {
            backgroundColor: isSelected ? category.iconColor : colors.surface,
            borderColor: isSelected ? category.iconColor : colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <IconSymbol
          name={category.iconName as any}
          size={16}
          color={isSelected ? "#fff" : category.iconColor}
        />
        <Text
          style={[
            styles.categoryPillText,
            { color: isSelected ? "#fff" : colors.foreground },
          ]}
        >
          {category.title}
        </Text>
        <View
          style={[
            styles.categoryPillCount,
            {
              backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : category.iconColor + "18",
            },
          ]}
        >
          <Text
            style={[
              styles.categoryPillCountText,
              { color: isSelected ? "#fff" : category.iconColor },
            ]}
          >
            {category.plans.length}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Category Section Card ──────────────────────────────────
function CategorySectionCard({
  category,
  onPress,
}: {
  category: PlanCategory;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categorySectionCard,
        {
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.categorySectionBg, { backgroundColor: category.iconColor }]}>
        {/* Decorative elements */}
        <View style={[styles.sectionDecoCircle, { backgroundColor: "rgba(255,255,255,0.12)" }]} />
        <View style={[styles.sectionDecoCircle2, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

        <View style={styles.categorySectionContent}>
          <View style={styles.categorySectionIconWrap}>
            <IconSymbol name={category.iconName as any} size={28} color="#fff" />
          </View>
          <View style={styles.categorySectionTextWrap}>
            <Text style={styles.categorySectionTitle}>{category.title}</Text>
            <Text style={styles.categorySectionSubtitle}>{category.subtitle}</Text>
          </View>
          <View style={styles.categorySectionRight}>
            <Text style={styles.categorySectionCount}>{category.plans.length} 个计划</Text>
            <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Plan Card (Enhanced) ───────────────────────────────────
function PlanCard({
  plan,
  onPress,
  index,
}: {
  plan: PlanTemplate;
  onPress: () => void;
  index: number;
}) {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

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

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.planCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Color accent bar */}
        <View style={[styles.planAccent, { backgroundColor: plan.iconColor }]} />
        <View style={styles.planCardInner}>
          <View style={[styles.planIconWrap, { backgroundColor: plan.iconColor + "15" }]}>
            <IconSymbol name={plan.iconName as any} size={22} color={plan.iconColor} />
          </View>
          <View style={styles.planTextWrap}>
            <Text style={[styles.planTitle, { color: colors.foreground }]} numberOfLines={1}>
              {plan.title}
            </Text>
            <Text style={[styles.planSubtitle, { color: colors.muted }]} numberOfLines={1}>
              {plan.subtitle}
            </Text>
            <View style={styles.planMeta}>
              <View style={[styles.planTag, { backgroundColor: difficultyColor + "15" }]}>
                <Text style={[styles.planTagText, { color: difficultyColor }]}>
                  {difficultyLabel}
                </Text>
              </View>
              <View style={[styles.planTag, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.planTagText, { color: colors.primary }]}>
                  {plan.duration}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.planArrow, { backgroundColor: colors.primary + "12" }]}>
            <IconSymbol name="chevron.right" size={14} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Search Bar ─────────────────────────────────────────────
function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.searchBar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="搜索学习计划..."
        placeholderTextColor={colors.muted}
        style={[styles.searchInput, { color: colors.foreground }]}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")}>
          <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────
export default function PopularScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const handlePlanPress = (plan: PlanTemplate) => {
    router.push({
      pathname: "/plan/[id]" as any,
      params: { id: plan.id },
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
    setSearchQuery("");
  };

  // Get plans to display
  const getDisplayPlans = (): PlanTemplate[] => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return PLAN_CATEGORIES.flatMap((c) => c.plans).filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      const cat = PLAN_CATEGORIES.find((c) => c.id === selectedCategory);
      return cat?.plans ?? [];
    }
    return [];
  };

  const displayPlans = getDisplayPlans();
  const activeCategory = selectedCategory
    ? PLAN_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const showAllCategories = !selectedCategory && !searchQuery.trim();

  return (
    <ScreenContainer>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              热门计划
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              发现适合你的学习计划
            </Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="flame.fill" size={14} color={colors.primary} />
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>
              {PLAN_CATEGORIES.reduce((sum, c) => sum + c.plans.length, 0)}+ 计划
            </Text>
          </View>
        </View>

        {/* Search */}
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Hero Banner (when no category selected) */}
        {showAllCategories && (
          <HeroBanner onExplore={() => setSelectedCategory("career")} />
        )}

        {/* Category Pills (horizontal scrollable) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsContainer}
        >
          {PLAN_CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>

        {/* All Categories View */}
        {showAllCategories && (
          <View style={styles.categorySections}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              全部分类
            </Text>
            {PLAN_CATEGORIES.map((category) => (
              <CategorySectionCard
                key={category.id}
                category={category}
                onPress={() => handleCategorySelect(category.id)}
              />
            ))}
          </View>
        )}

        {/* Search Results / Category Plans */}
        {(selectedCategory || searchQuery.trim()) && (
          <View style={styles.plansSection}>
            {/* Category Header */}
            {activeCategory && !searchQuery.trim() && (
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryHeaderCard,
                    { backgroundColor: activeCategory.iconColor },
                  ]}
                >
                  <View style={[styles.catHeaderDecoCircle]} />
                  <View style={[styles.catHeaderDecoCircle2]} />
                  <View style={styles.categoryHeaderInner}>
                    <View style={styles.categoryHeaderIcon}>
                      <IconSymbol
                        name={activeCategory.iconName as any}
                        size={32}
                        color="#fff"
                      />
                    </View>
                    <View>
                      <Text style={styles.categoryHeaderTitle}>
                        {activeCategory.title}
                      </Text>
                      <Text style={styles.categoryHeaderSubtitle}>
                        {activeCategory.plans.length} 个学习计划等你开启
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Search result header */}
            {searchQuery.trim() && (
              <View style={styles.searchResultHeader}>
                <Text style={[styles.searchResultText, { color: colors.muted }]}>
                  找到 {displayPlans.length} 个相关计划
                </Text>
              </View>
            )}

            {/* Plans List */}
            {displayPlans.length > 0 ? (
              <View style={styles.plansList}>
                {displayPlans.map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    onPress={() => handlePlanPress(plan)}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <IconSymbol name="magnifyingglass" size={36} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  没有找到相关计划
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  试试换个关键词搜索
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  heroBg: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroCircle1: {
    width: 180,
    height: 180,
    top: -40,
    right: -30,
  },
  heroCircle2: {
    width: 100,
    height: 100,
    bottom: -20,
    left: -10,
  },
  heroCircle3: {
    width: 60,
    height: 60,
    top: 20,
    right: 80,
  },
  heroContent: {
    gap: 10,
    position: "relative",
    zIndex: 1,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFD700",
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
  },

  // Category Pills
  categoryPillsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  categoryPillCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  categoryPillCountText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },

  // Category Sections
  categorySections: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 2,
  },
  categorySectionCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  categorySectionBg: {
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  sectionDecoCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -30,
    right: -20,
  },
  sectionDecoCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -20,
    left: 30,
  },
  categorySectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    position: "relative",
    zIndex: 1,
  },
  categorySectionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categorySectionTextWrap: {
    flex: 1,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 24,
  },
  categorySectionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 16,
    marginTop: 1,
  },
  categorySectionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  categorySectionCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    lineHeight: 16,
  },

  // Category Header (inside plans view)
  categoryHeader: {
    marginBottom: 4,
  },
  categoryHeaderCard: {
    borderRadius: 18,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  catHeaderDecoCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -40,
    right: -20,
  },
  catHeaderDecoCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -20,
    left: 20,
  },
  categoryHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    position: "relative",
    zIndex: 1,
  },
  categoryHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 30,
  },
  categoryHeaderSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
    marginTop: 2,
  },

  // Search Results
  searchResultHeader: {
    marginBottom: 8,
  },
  searchResultText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Plans Section
  plansSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  plansList: {
    gap: 10,
  },

  // Plan Card
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  planAccent: {
    height: 3,
    width: "100%",
  },
  planCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  planIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  planTextWrap: {
    flex: 1,
    gap: 3,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  planSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  planMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
  },
  planTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planTagText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  planArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
