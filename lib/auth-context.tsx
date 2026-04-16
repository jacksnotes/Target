import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailVerification: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  setRecoverySession: (accessToken: string, refreshToken: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getRedirectUrl(path: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return Linking.createURL(path);
}

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function resolveValidAuthState() {
  const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  if (userError || !userData.user) {
    if (sessionData.session) {
      await supabase.auth.signOut();
    }
    return { session: null, user: null };
  }

  return {
    session: sessionData.session ?? null,
    user: userData.user,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    resolveValidAuthState()
      .then((result) => {
        if (!mounted) return;
        setSession(result.session);
        setUser(result.user);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      if (!nextSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: userData, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !userData.user) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(nextSession);
      setUser(userData.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(normalizeError(error, "登录失败"));
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl("/auth/verify-code"),
          },
        });
        if (error) throw new Error(normalizeError(error, "注册失败"));
        return { needsEmailVerification: !data.session };
      },
      verifyEmailCode: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "signup",
        });
        if (error) throw new Error(normalizeError(error, "验证码错误或已过期"));
      },
      resendVerificationCode: async (email) => {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: getRedirectUrl("/auth/verify-code"),
          },
        });
        if (error) throw new Error(normalizeError(error, "验证码发送失败"));
      },
      sendPasswordResetEmail: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getRedirectUrl("/auth/update-password"),
        });
        if (error) throw new Error(normalizeError(error, "重置密码邮件发送失败"));
      },
      setRecoverySession: async (accessToken, refreshToken) => {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw new Error(normalizeError(error, "恢复重置密码会话失败"));
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(normalizeError(error, "更新密码失败"));
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(normalizeError(error, "退出登录失败"));
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSupabaseAuth must be used within AuthProvider");
  return ctx;
}