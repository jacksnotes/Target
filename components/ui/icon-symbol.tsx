// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "flag",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "target": "track-changes",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "checkmark.circle.fill": "check-circle",
  "circle": "radio-button-unchecked",
  "trash": "delete",
  "pencil": "edit",
  "sparkles": "auto-awesome",
  "calendar": "calendar-today",
  "flame.fill": "local-fire-department",
  "trophy.fill": "emoji-events",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "arrow.left": "arrow-back",
  "checkmark": "check",
  "clock.fill": "schedule",
  "list.bullet": "format-list-bulleted",
  "bell.fill": "notifications",
  "bell.slash.fill": "notifications-off",
  "star.fill": "star",
  "fire.fill": "local-fire-department",
  "book.fill": "menu-book",
  "briefcase.fill": "work",
  "heart.fill": "favorite",
  "figure.run": "directions-run",
  "person.fill": "person",
  "lightbulb.fill": "lightbulb",
  "globe": "language",
  "desktopcomputer": "computer",
  "paintbrush.fill": "brush",
  "chart.line.uptrend.xyaxis": "trending-up",
  "doc.text.fill": "description",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "arrow.right": "arrow-forward",
  "info.circle.fill": "info",
  "questionmark.circle": "help-outline",
  "bolt.fill": "bolt",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "chart.pie.fill": "pie-chart",
  "checkmark.seal.fill": "verified",
  "graduationcap.fill": "school",
  "wrench.fill": "build",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "exclamationmark.circle.fill": "error",
  "hand.thumbsup.fill": "thumb-up",
  "flag.fill": "flag",
  "scope": "gps-fixed",
  "medal.fill": "military-tech",
  "brain": "psychology",
  "dumbbell.fill": "fitness-center",
  "bed.double.fill": "hotel",
  "mic.fill": "mic",
  "banknote.fill": "payments",
  "text.book.closed.fill": "auto-stories",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
