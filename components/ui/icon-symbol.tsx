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
  // Default icons
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // App-specific icons
  "person.fill": "person",
  "person.2.fill": "people",
  "sportscourt.fill": "sports-soccer",
  "calendar": "event",
  "ellipsis": "more-horiz",
  "gearshape.fill": "settings",
  "star.fill": "star",
  "bell.fill": "notifications",
  "magnifyingglass": "search",
  "plus": "add",
  "trash.fill": "delete",
  "pencil": "edit",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "checkmark": "check",
  "shield.fill": "shield",
  "figure.run": "directions-run",
  "dollarsign.circle.fill": "attach-money",
  "chart.bar.fill": "bar-chart",
  "doc.text.fill": "description",
  "photo.fill": "photo",
  "location.fill": "location-on",
  "clock.fill": "schedule",
  "exclamationmark.triangle.fill": "warning",
  "heart.fill": "favorite",
  "bookmark.fill": "bookmark",
} as IconMapping;

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
