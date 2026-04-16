import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSupabaseAuth } from "@/lib/auth-context";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sendPasswordResetEmail } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleSend = async () => {
    if (!normalizedEmail) {
      Alert.alert("提示", "请输入注册邮箱");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(normalizedEmail);
      Alert.alert("邮件已发送", "请打开邮箱中的重置密码链接，进入设置新密码页面");
    } catch (error) {
      Alert.alert("发送失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.foreground }]}>忘记密码</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>输入注册邮箱，我们会发送重置密码邮件</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="注册邮箱"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <Pressable onPress={handleSend} disabled={loading} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : null}
            <Text style={styles.primaryText}>发送重置邮件</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.primary }]}>返回登录</Text>
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
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  primaryBtn: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingTop: 6 },
  linkText: { fontSize: 15, fontWeight: "700" },
});