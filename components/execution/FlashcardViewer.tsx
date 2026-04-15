import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import * as Speech from "expo-speech";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { extractLanguageFromTitle, getLanguageTag } from "@/lib/language-utils";

interface FlashcardPayload {
  cards?: { front: string; back: string }[];
}

interface FlashcardViewerProps {
  payload: any;
  onComplete: () => void;
  goalTitle: string;
}

export function FlashcardViewer({ payload, onComplete, goalTitle }: FlashcardViewerProps) {
  const colors = useColors();
  const typedPayload = payload as FlashcardPayload;
  const cards = typedPayload?.cards || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Detect language
  const languageName = extractLanguageFromTitle(goalTitle);
  const langTag = getLanguageTag(languageName);

  const speak = async (text?: string) => {
    const textToSpeak = text?.trim();
    if (!textToSpeak) return;

    try {
      setIsSpeaking(true);
      await Speech.stop();
      Speech.speak(textToSpeak, {
        language: langTag,
        rate: 0.9,
        pitch: 1,
        useApplicationAudioSession: false,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: (error) => {
          console.error("Flashcard speech failed:", error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error("Flashcard speech failed:", error);
      setIsSpeaking(false);
    }
  };

  // Auto-play TTS on first load and index change
  useEffect(() => {
    if (cards.length > 0 && !isFlipped) {
      // Small delay to ensure UI transition feels natural
      const timer = setTimeout(() => {
        speak(cards[currentIndex].front);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (!cards || cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.muted }}>未生成卡片数据</Text>
        <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onComplete}>
          <Text style={styles.btnText}>完成任务</Text>
        </Pressable>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsFlipped(!isFlipped));
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const progress = (currentIndex + 1) / cards.length;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Card area */}
      <View style={styles.cardArea}>
        <View style={styles.cardWrapper}>
          <Pressable style={{ width: '100%', height: '100%' }} onPress={handleFlip}>
            <Animated.View style={[styles.card, styles.cardFront, { backgroundColor: colors.surface, borderColor: colors.border }, frontAnimatedStyle]}>
              <View style={styles.frontContentWrapper}>
                <Text style={[styles.cardContent, { color: colors.foreground }]}>{currentCard.front}</Text>
                <Pressable 
                  onPress={(e) => {
                    e.stopPropagation();
                    speak(currentCard.front);
                  }}
                  style={({ pressed }) => [
                    styles.speakerBtn, 
                    { backgroundColor: isSpeaking ? colors.primary + '20' : colors.border + '40', opacity: pressed ? 0.6 : 1 }
                  ]}
                >
                  <IconSymbol name="speaker.wave.2.fill" size={20} color={isSpeaking ? colors.primary : colors.muted} />
                </Pressable>
              </View>
              <Text style={[styles.flipHint, { color: colors.muted }]}>点击翻转查看</Text>
            </Animated.View>
            
            <Animated.View style={[styles.card, styles.cardBack, { backgroundColor: colors.primary + '1A', borderColor: colors.primary }, backAnimatedStyle]}>
              <Text style={[styles.cardContent, { color: colors.foreground }]}>{currentCard.back}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsArea}>
        {isFlipped ? (
           <Pressable style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
             <Text style={styles.nextBtnText}>
               {currentIndex < cards.length - 1 ? "下一个" : "完成学习"}
             </Text>
             <IconSymbol name={currentIndex < cards.length - 1 ? "arrow.right" : "checkmark"} size={20} color="#fff" />
           </Pressable>
        ) : (
           <View style={{ height: 56 }} /> // Placeholder to maintain height
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24, paddingHorizontal: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", width: 40, textAlign: "right" },
  cardArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: { width: "100%", aspectRatio: 3/4, position: "relative" },
  card: { 
    position: "absolute", 
    width: "100%", 
    height: "100%", 
    backfaceVisibility: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFront: {},
  cardBack: {},
  frontContentWrapper: {
    alignItems: "center",
    gap: 20,
  },
  cardContent: { fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 36 },
  speakerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  flipHint: { position: "absolute", bottom: 24, fontSize: 14 },
  controlsArea: { paddingVertical: 24, height: 100, justifyContent: "center" },
  nextBtn: { 
    height: 56, 
    borderRadius: 28, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8 
  },
  nextBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
