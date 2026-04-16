import React, { useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSupabaseAuth } from "@/lib/auth-context";

function extractTokensFromUrl(url: string | null | undefined) {
  if (!url) return { accessToken: "", refreshToken: "", type: "" };
  const hashPart = url.includes("#") ? url.split("#")[1] : "";
  const queryPart = url.includes("?") ? url.split("?")[1]?.split("#")[0] : "";
  const params = new URLSearchParams(hashPart || queryPart || "");
  return {
    accessToken: params.get("access_token") || "",
    refreshToken: params.get("refresh_token") || "",
    type: params.get("type") || "",
  };
}

export default function UpdatePasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string; type?: string }>();
  const { session, setRecoverySession, updatePassword } = useSupabaseAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preparing, setPreparing] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const routeTokens = useMemo(
    () => ({
      accessToken: String(params.access_token || ""),
      refreshToken: String(params.refresh_token || ""),
      type: String(params.type || ""),
    }),
    [params.access_token, params.refresh_token, params.type],
  );

  useEffect(() => {
    const prepare = async () => {
      try {
        let accessToken = routeTokens.accessToken;
        let refreshToken = routeTokens.refreshToken;
        let type = routeTokens.type;

        if ((!accessToken || !refreshToken) && Platform.OS === "web" && typeof window !== "undefined") {
          const parsed = extractTokensFromUrl(window.location.href);
          accessToken = accessToken || parsed.accessToken;
          refreshToken = refreshToken || parsed.refreshToken;
          type = type || parsed.type;
        }

        if (!accessToken || !refreshToken) {
          const initialUrl = await Linking.getInitialURL();
          const parsed = extractTokensFromUrl(initialUrl);
          accessToken = accessToken || parsed.accessToken;
          refreshToken = refreshToken || parsed.refreshToken;
          type = type || parsed.type;
        }

        if (accessToken && refreshToken) {
          await setRecoverySession(accessToken, refreshToken);
          setReady(true);
          return;
        }

        if (session && (!type || type === "recovery")) {
          setReady(true);
          return;
        }

        setReady(false);
      } catch (error) {
        console.error("prepare recovery session failed", error);
        setReady(false);
      } finally {
        setPreparing(false);
      }
    };

    prepare();
  }, [routeTokens.accessToken, routeTokens.refreshToken, routeTokens.type, session, setRecoverySession]);

  const handleUpdate = async () => {
    if (password.length < 6) {
      Alert.alert("提示", "新密码至少 6 位");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("提示", "两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      Alert.alert("修改成功", "密码已更新，现在返回主页");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("修改失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.foreground }]}>设置新密码</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>从邮件链接进入后，在这里输入你的新密码</Text>

          {preparing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.helperText, { color: colors.muted }]}>正在验证重置链接…</Text>
            </View>
          ) : !ready ? (
            <View style={styles.loadingWrap}>
              <Text style={[styles.helperText, { color: colors.muted }]}>当前页面缺少有效的重置凭据，请重新从邮箱中的链接打开。</Text>
              <Pressable onPress={() => router.replace('/auth/forgot-password')} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: colors.primary }]}>重新发送重置邮件</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="新密码"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="再次输入新密码"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Pressable onPress={handleUpdate} disabled={loading} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 }]}>
                {loading ? <ActivityIndicator color="#fff" /> : null}
                <Text style={styles.primaryText}>确认修改密码</Text>
              </Pressable>
            </>
          )}
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
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  loadingWrap: { gap: 12, alignItems: "center", paddingVertical: 12 },
  helperText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  primaryBtn: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingTop: 6 },
  linkText: { fontSize: 15, fontWeight: "700" },
});