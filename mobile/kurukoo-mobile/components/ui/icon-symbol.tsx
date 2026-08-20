// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "bubble.left.and.bubble.right.fill": "chat-bubble-outline",
  "map.fill": "explore",
  "checklist": "checklist",
  "ellipsis.circle.fill": "more-horiz",
  "checkmark": "check",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "xmark": "close",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "trash.fill": "delete-outline",
  "sparkles": "auto-awesome",
} as IconMapping;

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
