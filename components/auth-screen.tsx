import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSupabaseAuth } from "@/lib/auth-context";

export function AuthScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, signUp } = useSupabaseAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      Alert.alert("提示", "请输入邮箱，并确保密码至少 6 位");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp(normalizedEmail, password);
        if (result.needsEmailVerification) {
          router.push({ pathname: "/auth/verify-code", params: { email: normalizedEmail } });
          return;
        }
        router.replace("/(tabs)");
      } else {
        await signIn(normalizedEmail, password);
        router.replace("/(tabs)");
      }
    } catch (error) {
      Alert.alert(isSignUp ? "注册失败" : "登录失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}> 
          <View style={styles.logoBox}>
            <IconSymbol name="book.fill" size={34} color="#fff" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.appName}>学习计划</Text>
            <Text style={styles.appDesc}>使用 Supabase 账号同步目标、钱包和硬核承诺记录</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isSignUp ? "注册账号" : "登录账号"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isSignUp ? "注册后先完成邮箱验证码，再进入主页" : "继续你的学习目标和贝壳钱包"}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="邮箱"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="密码"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 },
            ]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : null}
            <Text style={styles.primaryText}>{isSignUp ? "注册并发送验证码" : "登录"}</Text>
          </Pressable>

          {!isSignUp ? (
            <Pressable onPress={() => router.push("/auth/forgot-password")} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: colors.primary }]}>忘记密码</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => setMode(isSignUp ? "signin" : "signup")} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: colors.primary }]}> 
              {isSignUp ? "已有账号，去登录" : "没有账号，注册一个"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 20 },
  hero: { borderRadius: 8, padding: 24, flexDirection: "row", alignItems: "center", gap: 16 },
  logoBox: { width: 64, height: 64, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  heroText: { flex: 1, gap: 4 },
  appName: { color: "#fff", fontSize: 28, fontWeight: "800", lineHeight: 34 },
  appDesc: { color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 8, padding: 18, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 30 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  primaryBtn: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 4 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  linkBtn: { alignItems: "flex-end", paddingTop: 4 },
  linkText: { fontSize: 14, fontWeight: "700" },
  switchBtn: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 15, fontWeight: "700" },
});