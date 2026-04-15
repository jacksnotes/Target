import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  label,
  sublabel,
}: ProgressRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      {label !== undefined && (
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: size * 0.22,
              fontWeight: "700",
              color: colors.foreground,
              lineHeight: size * 0.28,
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              style={{
                fontSize: size * 0.14,
                color: colors.muted,
                lineHeight: size * 0.2,
              }}
            >
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
