/**
 * Small Club Manager Theme
 * Dark mode with green accent (#22c55e) and navy blue secondary (#1e40af)
 */

import { Platform } from "react-native";

// Primary colors
export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#64748b",
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceElevated: "#f1f5f9",
    tint: "#22c55e",
    icon: "#64748b",
    tabIconDefault: "#64748b",
    tabIconSelected: "#22c55e",
    border: "#e2e8f0",
    danger: "#ef4444",
    warning: "#f59e0b",
    success: "#22c55e",
  },
  dark: {
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    background: "#0f172a",
    surface: "#1e293b",
    surfaceElevated: "#334155",
    tint: "#22c55e",
    icon: "#94a3b8",
    tabIconDefault: "#64748b",
    tabIconSelected: "#22c55e",
    border: "#334155",
    danger: "#ef4444",
    warning: "#f59e0b",
    success: "#22c55e",
  },
};

// Extended color palette
export const AppColors = {
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#4ade80",
  secondary: "#1e40af",
  secondaryDark: "#1e3a8a",
  secondaryLight: "#3b82f6",
  
  // Backgrounds
  bgDark: "#0f172a",
  bgCard: "#1e293b",
  bgElevated: "#334155",
  
  // Text
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textDisabled: "#64748b",
  
  // Borders
  borderLight: "#334155",
  borderFocus: "#22c55e",
  
  // Status
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  
  // Positions (for player badges)
  goalkeeper: "#f59e0b",
  defender: "#3b82f6",
  midfielder: "#22c55e",
  forward: "#ef4444",
};

// Spacing scale (8pt grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border radius
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const Typography = {
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
