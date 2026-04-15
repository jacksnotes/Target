import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, Pressable, TextInput, 
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Task } from "@/lib/types";

interface CodingPayload {
  language?: string;
  instructions?: string;
  template?: string;
  expectedOutput?: string;
}

export function CodingSimulator({ payload, task, onComplete }: { payload: any; task?: Task; onComplete: () => void }) {
  const colors = useColors();
  const typedPayload = payload as CodingPayload;
  const instructions = typedPayload?.instructions || task?.description || "完成此代码练习。";
  const language = typedPayload?.language || "javascript";
  const initialCode = typedPayload?.template || "// Write your code here\\n";

  const [code, setCode] = useState(initialCode);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleRun = () => {
    Keyboard.dismiss();
    setIsSimulating(true);
    setResult("idle");
    
    // Simulate compilation / execution delay
    setTimeout(() => {
      setIsSimulating(false);
      // For MVP, if they wrote something new, it counts as a success.
      if (code.length > 5 && code !== initialCode) {
        setResult("success");
      } else {
        setResult("error");
      }
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          
          <View style={[styles.instructionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <View style={styles.instructionHeader}>
                <IconSymbol name="desktopcomputer" size={18} color={colors.primary} />
                <Text style={[styles.instructionTitle, { color: colors.foreground }]}>练习要求</Text>
             </View>
             <Text style={[styles.instructions, { color: colors.muted }]}>{instructions}</Text>
          </View>

          <View style={styles.editorWrap}>
            <View style={[styles.editorHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
               <Text style={[styles.langTag, { color: colors.muted }]}>{language.toUpperCase()}</Text>
               <Pressable 
                 style={({pressed}) => [styles.runBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: colors.primary + '1A' }]}
                 onPress={handleRun}
                 disabled={isSimulating}
               >
                 <IconSymbol name="play.fill" size={14} color={colors.primary} />
                 <Text style={[styles.runText, { color: colors.primary }]}>运行测试</Text>
               </Pressable>
            </View>
            
            <TextInput
               style={[styles.editorInput, { backgroundColor: colors.surface, color: colors.foreground }]}
               multiline
               autoCapitalize="none"
               autoCorrect={false}
               spellCheck={false}
               value={code}
               onChangeText={setCode}
               placeholder="Write your code here..."
               placeholderTextColor={colors.muted}
            />
          </View>

          {!isKeyboardVisible ? (
            <>
              {/* Terminal / Result Output */}
              <View style={[styles.terminalWrap, { backgroundColor: "#1e1e1e", borderColor: colors.border }]}>
                {isSimulating ? (
                  <View style={styles.terminalContent}>
                    <ActivityIndicator size="small" color="#00ff00" />
                    <Text style={{ color: "#00ff00", marginLeft: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      Compiling and running...
                    </Text>
                  </View>
                ) : result === "success" ? (
                  <View style={styles.terminalContentCol}>
                    <Text style={{ color: "#00ff00", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      {'>'} Tests passed successfully!
                    </Text>
                  </View>
                ) : result === "error" ? (
                  <View style={styles.terminalContentCol}>
                    <Text style={{ color: "#ff4444", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      {'>'} Syntax error or incomplete code.
                    </Text>
                    <Text style={{ color: "#ff4444", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      {'>'} Please write valid code to pass.
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: "#666", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {'>'} Awaiting execution...
                  </Text>
                )}
              </View>

              <View style={styles.footer}>
                <Pressable 
                  style={[
                    styles.completeBtn, 
                    { backgroundColor: result === "success" ? colors.primary : colors.border }
                  ]} 
                  onPress={result === "success" ? onComplete : undefined}
                  disabled={result !== "success"}
                >
                  <Text style={[styles.completeBtnText, { color: result === "success" ? "#fff" : colors.muted }]}>
                    {result === "success" ? "完成练习" : "通过测试后即可完成"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Styles

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 16, gap: 16 },
  instructionBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  instructionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  instructionTitle: { fontSize: 16, fontWeight: "600" },
  instructions: { fontSize: 14, lineHeight: 20 },
  editorWrap: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)", overflow: "hidden" },
  editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  langTag: { fontSize: 12, fontWeight: "700" },
  runBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  runText: { fontSize: 13, fontWeight: "600" },
  editorInput: { 
    flex: 1, 
    padding: 16, 
    fontSize: 14, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlignVertical: "top"
  },
  terminalWrap: { height: 100, borderRadius: 12, padding: 12, borderWidth: 1 },
  terminalContent: { flexDirection: "row", alignItems: "center" },
  terminalContentCol: { gap: 4 },
  footer: { paddingBottom: 16 },
  completeBtn: { height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  completeBtnText: { fontSize: 16, fontWeight: "600" }
});
