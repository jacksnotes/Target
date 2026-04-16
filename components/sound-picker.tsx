import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useColors } from "@/hooks/use-colors";
import { SOUND_OPTIONS, SoundId } from "@/lib/sound-config";
import { IconSymbol } from "./ui/icon-symbol";
import { useGoals } from "@/lib/goals-context";
import { Alert } from "react-native";
import { SOUND_PRICE } from "@/lib/storage";

interface SoundPickerProps {
  selectedSoundId?: SoundId;
  onSoundSelect: (soundId: SoundId) => void;
  onPreview?: (soundId: SoundId) => void;
}

export function SoundPicker({
  selectedSoundId = "default",
  onSoundSelect,
  onPreview,
}: SoundPickerProps) {
  const colors = useColors();
  const { state, purchaseInventoryItem } = useGoals();
  const { inventory } = state;
  const [isPlaying, setIsPlaying] = useState<SoundId | null>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    setIsPlaying(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  const handlePreview = async (soundId: SoundId) => {
    if (isPlaying === soundId) {
      stopPreview();
      return;
    }

    try {
      stopPreview();
      setIsPlaying(soundId);
      onPreview?.(soundId);
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
        interruptionModeAndroid: "duckOthers",
      });

      const player = createAudioPlayer(createToneDataUri(soundId), {
        keepAudioSessionActive: false,
      });
      player.volume = 1;
      playerRef.current = player;
      player.play();

      stopTimerRef.current = setTimeout(() => {
        stopPreview();
      }, SOUND_OPTIONS[soundId].duration);
    } catch (error) {
      console.warn("Failed to preview reminder sound:", error);
      stopPreview();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{"\u9009\u62e9\u901a\u77e5\u97f3\u6548"}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{"\u70b9\u51fb\u9884\u89c8\uff0c\u9009\u62e9\u4f60\u559c\u6b22\u7684\u97f3\u6548"}</Text>

      <ScrollView
        style={styles.soundList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.soundListContent}
      >
        {Object.entries(SOUND_OPTIONS).map(([soundId, option]) => (
          <Pressable
            key={soundId}
            onPress={() => {
              const isBasic = option.category === "basic";
              const isUnlocked = isBasic || soundId === "default" || inventory.unlockedSounds.includes(soundId);
              if (!isUnlocked) {
                Alert.alert(
                  "解锁高级音效",
                  `此高级音效尚未解锁，是否花费 ${SOUND_PRICE} 贝壳永久解锁？`,
                  [
                    { text: "取消", style: "cancel" },
                    { 
                      text: "立即解锁", 
                      onPress: () => {
                        const res = purchaseInventoryItem("sound", soundId);
                        if (res.ok) onSoundSelect(soundId as SoundId);
                        else Alert.alert("提示", res.message);
                      }
                    }
                  ]
                );
                return;
              }
              onSoundSelect(soundId as SoundId);
            }}
            style={({ pressed }) => [
              styles.soundItem,
              {
                backgroundColor:
                  selectedSoundId === soundId ? colors.primary + "15" : colors.surface,
                borderColor:
                  selectedSoundId === soundId ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.soundItemContent}>
              <View style={styles.soundInfo}>
                <View style={styles.soundNameRow}>
                <Text style={[styles.soundName, { color: colors.foreground }]}> 
                  {option.name}
                </Text>
                {option.category === "premium" && !inventory.unlockedSounds.includes(soundId) && (
                  <View style={[styles.premiumBadge, { backgroundColor: "#F59E0B" }]}>
                    <IconSymbol name="lock.fill" size={10} color="#fff" />
                  </View>
                )}
                </View>
                <Text style={[styles.soundDesc, { color: colors.muted }]}> 
                  {option.description}
                </Text>
              </View>

              <View style={styles.soundActions}>
                <Pressable
                  onPress={() => handlePreview(soundId as SoundId)}
                  style={({ pressed }) => [
                    styles.previewBtn,
                    {
                      backgroundColor:
                        isPlaying === soundId ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <IconSymbol
                    name={isPlaying === soundId ? "pause.fill" : "play.fill"}
                    size={14}
                    color={isPlaying === soundId ? "#fff" : colors.foreground}
                  />
                </Pressable>

                {selectedSoundId === soundId && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <IconSymbol name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
            </View>

            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    option.category === "premium"
                      ? "#fff3e0"
                      : "#e8f5e9",
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      option.category === "premium"
                        ? "#e65100"
                        : "#2e7d32",
                  },
                ]}
              >
                {option.category === "premium"
                  ? "高级音效"
                  : "经典音效"}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <IconSymbol name="info.circle" size={16} color={colors.muted} />
        <Text style={[styles.infoText, { color: colors.muted }]}>{"音效时长："}{SOUND_OPTIONS[selectedSoundId].duration}ms</Text>
      </View>
    </View>
  );
}



const TONE_CONFIG: Record<
  SoundId,
  { frequency: number; durationMs: number; secondFrequency?: number }
> = {
  default: { frequency: 660, durationMs: 1000 },
  chime: { frequency: 880, durationMs: 1200, secondFrequency: 1320 },
  bell: { frequency: 740, durationMs: 1500, secondFrequency: 988 },
  ding: { frequency: 1046, durationMs: 800 },
  ping: { frequency: 1200, durationMs: 600 },
  pop: { frequency: 520, durationMs: 700, secondFrequency: 780 },
  alert: { frequency: 440, durationMs: 2000, secondFrequency: 880 },
  zen: { frequency: 261, durationMs: 3000, secondFrequency: 392 }, // C4, G4
  dawn: { frequency: 440, durationMs: 2500, secondFrequency: 523 }, // A4, C5
  crystal: { frequency: 987, durationMs: 1800, secondFrequency: 1479 }, // B5, F#6
};

function createToneDataUri(soundId: SoundId): string {
  const config = TONE_CONFIG[soundId] ?? TONE_CONFIG.default;
  const sampleRate = 44100;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = Math.floor((sampleRate * config.durationMs) / 1000);
  const dataSize = sampleCount * channels * (bitsPerSample / 8);
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);

  writeAscii(bytes, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(bytes, 8, "WAVE");
  writeAscii(bytes, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
  view.setUint16(32, channels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(bytes, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, i / (sampleRate * 0.02));
    const fadeOut = Math.min(1, (sampleCount - i) / (sampleRate * 0.08));
    const envelope = Math.min(fadeIn, fadeOut);
    const second = config.secondFrequency
      ? Math.sin(2 * Math.PI * config.secondFrequency * t) * 0.25
      : 0;
    const sample =
      (Math.sin(2 * Math.PI * config.frequency * t) * 0.55 + second) *
      envelope;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }

  return `data:audio/wav;base64,${base64Encode(bytes)}`;
}

function writeAscii(bytes: Uint8Array, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    bytes[offset + i] = value.charCodeAt(i);
  }
}

function base64Encode(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;

    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? alphabet[triple & 63] : "=";
  }

  return output;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  soundList: {
    maxHeight: 300,
  },
  soundListContent: {
    gap: 8,
  },
  soundItem: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  soundItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  soundInfo: {
    flex: 1,
    gap: 4,
  },
  soundName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  soundNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  soundDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  soundActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumBadge: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
});