import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ReadingPayload {
  title?: string;
  content?: string;
  wordCount?: number;
}

export function ReadingViewer({ payload, onComplete }: { payload: any; onComplete: () => void }) {
  const colors = useColors();
  const typedPayload = payload as ReadingPayload;
  const content = typedPayload?.content || "暂无文章内容";
  const title = typedPayload?.title || "阅读材料";
  const wordCount = typedPayload?.wordCount || content.length;

  const [readProgress, setReadProgress] = useState(0);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Calculate progress
    const scrollPosition = layoutMeasurement.height + contentOffset.y;
    const totalHeight = contentSize.height;
    
    let progress = 0;
    if (totalHeight <= layoutMeasurement.height) {
      progress = 1;
    } else {
      progress = contentOffset.y / (totalHeight - layoutMeasurement.height);
    }
    
    progress = Math.max(0, Math.min(1, progress));
    setReadProgress(progress);

    // If reached bottom (or very close to it)
    if (progress > 0.95 && !hasFinishedReading) {
      setHasFinishedReading(true);
    }
  };

  // Simple paragraph styling for MVP Markdown support
  const paragraphs = content.split('\\n\\n').map((p, i) => {
    if (p.startsWith('# ')) {
      return <Text key={i} style={[styles.h1, { color: colors.foreground }]}>{p.replace('# ', '')}</Text>;
    } else if (p.startsWith('## ')) {
      return <Text key={i} style={[styles.h2, { color: colors.foreground }]}>{p.replace('## ', '')}</Text>;
    } else if (p.startsWith('- ') || p.startsWith('* ')) {
      return <Text key={i} style={[styles.li, { color: colors.foreground }]}><Text style={{fontWeight:'700'}}>•</Text> {p.substring(2)}</Text>;
    } else {
      return <Text key={i} style={[styles.p, { color: colors.foreground }]}>{p}</Text>;
    }
  });

  return (
    <View style={styles.container}>
      {/* Progress Bar Top */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${readProgress * 100}%` }]} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          约 {wordCount} 字 • 预计阅读 {Math.max(1, Math.ceil(wordCount / 300))} 分钟
        </Text>
        
        <View style={styles.contentWrap}>
          {paragraphs}
        </View>

        <View style={styles.endMarker}>
           {hasFinishedReading ? (
             <IconSymbol name="checkmark.circle.fill" size={32} color={colors.primary} />
           ) : (
             <View style={[styles.spinner, { borderColor: colors.border }]} />
           )}
           <Text style={[styles.endText, { color: hasFinishedReading ? colors.primary : colors.muted }]}>
             {hasFinishedReading ? "你已阅读完本章内容" : "继续向下滑动完成阅读"}
           </Text>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable 
          style={[styles.completeBtn, { backgroundColor: hasFinishedReading ? colors.primary : colors.border }]} 
          onPress={hasFinishedReading ? onComplete : undefined}
          disabled={!hasFinishedReading}
        >
          <Text style={[styles.completeBtnText, { color: hasFinishedReading ? "#fff" : colors.muted }]}>
            {hasFinishedReading ? "完成学习" : `阅读进度 ${Math.round(readProgress * 100)}%`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 3, width: "100%" },
  progressFill: { height: "100%" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 34, marginBottom: 12 },
  meta: { fontSize: 13, marginBottom: 32 },
  contentWrap: { gap: 16 },
  h1: { fontSize: 22, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  li: { fontSize: 16, lineHeight: 28, paddingLeft: 8 },
  p: { fontSize: 16, lineHeight: 28, letterSpacing: 0.3 },
  endMarker: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  spinner: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderTopColor: "transparent" },
  endText: { fontSize: 14, fontWeight: "500" },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth },
  completeBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  completeBtnText: { fontSize: 16, fontWeight: "600" }
});
