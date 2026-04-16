import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSupabaseAuth } from "@/lib/auth-context";

export default function VerifyCodeScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyEmailCode, resendVerificationCode } = useSupabaseAuth();
  const email = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    const normalizedCode = code.replace(/\D/g, "");
    if (!email) {
      Alert.alert("缺少邮箱", "请返回注册页重新输入邮箱");
      return;
    }
    if (normalizedCode.length !== 6) {
      Alert.alert("提示", "请输入 6 位邮箱验证码");
      return;
    }

    setLoading(true);
    try {
      await verifyEmailCode(email, normalizedCode);
      Alert.alert("验证成功", "邮箱已验证，正在进入主页");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("验证失败", error instanceof Error ? error.message : "验证码错误或已过期");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("缺少邮箱", "请返回注册页重新输入邮箱");
      return;
    }
    setResending(true);
    try {
      await resendVerificationCode(email);
      Alert.alert("已重新发送", "请查看邮箱中的 6 位验证码");
    } catch (error) {
      Alert.alert("发送失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>邮箱验证码</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>我们已经向 {email || "你的邮箱"} 发送了 6 位验证码</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="输入 6 位验证码"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <Pressable
            onPress={handleVerify}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : null}
            <Text style={styles.primaryText}>验证并进入主页</Text>
          </Pressable>
          <Pressable onPress={handleResend} disabled={resending} style={styles.secondaryBtn}>
            {resending ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={[styles.secondaryText, { color: colors.primary }]}>重新发送验证码</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/auth' as any)} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.muted }]}>返回登录 / 注册</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: { borderWidth: 1, borderRadius: 8, padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  codeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 26, fontWeight: "800", textAlign: "center", letterSpacing: 6 },
  primaryBtn: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: { height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryText: { fontSize: 15, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingTop: 6 },
  linkText: { fontSize: 14, fontWeight: "600" },
});