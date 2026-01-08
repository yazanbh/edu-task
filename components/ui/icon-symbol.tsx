// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "person.fill": "person",
  "person.2.fill": "people",
  "folder.fill": "folder",
  "doc.fill": "description",
  "doc.text.fill": "article",
  "calendar": "calendar-today",
  "bell.fill": "notifications",
  "gear": "settings",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "clock.fill": "schedule",
  "paperclip": "attach-file",
  "arrow.up.doc.fill": "upload-file",
  "tray.fill": "inbox",
  "chart.bar.fill": "bar-chart",
  "star.fill": "star",
  "pencil": "edit",
  "trash.fill": "delete",
  "magnifyingglass": "search",
  "arrow.right.square.fill": "logout",
  "lock.fill": "lock",
  "envelope.fill": "email",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "qrcode": "qr-code",
  "book.fill": "menu-book",
  "graduationcap.fill": "school",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
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
  const iconName = MAPPING[name] || "help";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
