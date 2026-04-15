import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Priority } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

interface PriorityBadgeProps {
  priority: Priority;
  small?: boolean;
}

export function PriorityBadge({ priority, small = false }: PriorityBadgeProps) {
  const colors = useColors();

  const badgeColor =
    priority === "high"
      ? colors.error
      : priority === "medium"
      ? colors.warning
      : colors.success;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor + "22",
          borderColor: badgeColor + "44",
          paddingHorizontal: small ? 6 : 8,
          paddingVertical: small ? 2 : 3,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: badgeColor,
            fontSize: small ? 10 : 11,
          },
        ]}
      >
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
    lineHeight: 16,
  },
});
