import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/use-colors";
import { ReminderConfig } from "@/lib/types";
import { IconSymbol } from "./ui/icon-symbol";
import { SoundPicker } from "./sound-picker";
import { SoundId } from "@/lib/sound-config";

interface ReminderSettingsProps {
  reminder?: ReminderConfig;
  onSave: (config: ReminderConfig) => Promise<void>;
  isLoading?: boolean;
}

export function ReminderSettings({
  reminder,
  onSave,
  isLoading = false,
}: ReminderSettingsProps) {
  const colors = useColors();
  const [enabled, setEnabled] = useState(reminder?.enabled ?? false);
  const [time, setTime] = useState(
    reminder?.time ? parseTimeString(reminder.time) : new Date()
  );
  const [soundId, setSoundId] = useState<SoundId>(
    (reminder?.soundId as SoundId) ?? "default"
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timeStr = formatTime(time);
      await onSave({
        enabled,
        soundId,
        time: timeStr,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const timeStr = formatTime(time);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.foreground }]}>启用每日提醒</Text>
            <Text style={[styles.description, { color: colors.muted }]}> 
              {enabled ? "已启用" : "已禁用"}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            disabled={isLoading || isSaving}
          />
        </View>
      </View>

      {enabled && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.foreground, marginBottom: 12 },
            ]}
          >
            提醒时间
          </Text>

          <Pressable
            onPress={() => setShowTimePicker(true)}
            disabled={isLoading || isSaving}
            style={({ pressed }) => [
              styles.timeButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.timeButtonText}>{timeStr}</Text>
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </Pressable>

          <Text style={[styles.hint, { color: colors.muted }]}>每天 {timeStr} 会收到学习提醒</Text>
        </View>
      )}

      {enabled && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => setShowSoundPicker(!showSoundPicker)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginBottom: 12 },
              ]}
            >
              通知音效
            </Text>
          </Pressable>
          {showSoundPicker && (
            <View style={styles.soundPickerContainer}>
              <SoundPicker selectedSoundId={soundId} onSoundSelect={setSoundId} />
            </View>
          )}
        </View>
      )}

      <Pressable
        onPress={handleSave}
        disabled={isLoading || isSaving}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed || isSaving ? 0.8 : 1,
          },
        ]}
      >
        <Text style={styles.saveButtonText}>{isSaving ? "保存中..." : "保存设置"}</Text>
      </Pressable>

      {showTimePicker && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <Pressable
              style={styles.timePickerBackdrop}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={[styles.timePickerSheet, { backgroundColor: colors.surface }]}> 
              <View
                style={[
                  styles.timePickerHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text style={[styles.timePickerAction, { color: colors.primary }]}>完成</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={colors.foreground}
              />
            </View>
          </View>
        </Modal>
      )}

      {showTimePicker && Platform.OS !== "ios" && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 22,
  },
  timePickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  timePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  timePickerSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    overflow: "hidden",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timePickerAction: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  soundPickerContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});