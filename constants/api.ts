import * as ReactNative from "react-native";
import Constants from "expo-constants";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export function getApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  if (ReactNative.Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      if (ip) {
        return `http://${ip}:3000`;
      }
    }
  }

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    const apiHostname = hostname.replace(/^(8081|8082)-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
    if ((hostname === "localhost" || hostname === "127.0.0.1") && (port === "8081" || port === "8082")) {
      return `${protocol}//${hostname}:3000`;
    }
  }

  return "";
}