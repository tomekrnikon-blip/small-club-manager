import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface ClubColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const PRESET_COLORS = [
  { name: "Zielony", primary: "#22c55e", secondary: "#166534", accent: "#ffffff" },
  { name: "Niebieski", primary: "#3b82f6", secondary: "#1e40af", accent: "#ffffff" },
  { name: "Czerwony", primary: "#ef4444", secondary: "#991b1b", accent: "#ffffff" },
  { name: "Żółty", primary: "#eab308", secondary: "#854d0e", accent: "#000000" },
  { name: "Fioletowy", primary: "#8b5cf6", secondary: "#5b21b6", accent: "#ffffff" },
  { name: "Pomarańczowy", primary: "#f97316", secondary: "#c2410c", accent: "#ffffff" },
  { name: "Różowy", primary: "#ec4899", secondary: "#9d174d", accent: "#ffffff" },
  { name: "Turkusowy", primary: "#14b8a6", secondary: "#0f766e", accent: "#ffffff" },
];

const COLOR_SWATCHES = [
  "#22c55e", "#16a34a", "#15803d", "#166534",
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af",
  "#ef4444", "#dc2626", "#b91c1c", "#991b1b",
  "#eab308", "#ca8a04", "#a16207", "#854d0e",
  "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6",
  "#f97316", "#ea580c", "#c2410c", "#9a3412",
  "#ec4899", "#db2777", "#be185d", "#9d174d",
  "#14b8a6", "#0d9488", "#0f766e", "#115e59",
  "#ffffff", "#f1f5f9", "#e2e8f0", "#cbd5e1",
  "#000000", "#1e293b", "#334155", "#475569",
];

export default function ClubColorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [colors, setColors] = useState<ClubColors>({
    primaryColor: "#22c55e",
    secondaryColor: "#1e3a5f",
    accentColor: "#ffffff",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<keyof ClubColors | null>(null);

  // Load current club colors
  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setIsLoading(true);
    // In production, this would fetch from tRPC
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsLoading(false);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      // In production, this would save via tRPC
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sukces", "Kolory klubu zostały zapisane");
    } catch (error: any) {
      Alert.alert("Błąd", error.message || "Nie udało się zapisać kolorów");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_COLORS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColors({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  const handleSelectColor = (color: string) => {
    if (!activeColorPicker) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColors((prev) => ({
      ...prev,
      [activeColorPicker]: color,
    }));
  };

  const isValidHex = (color: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  const renderColorInput = (
    label: string,
    colorKey: keyof ClubColors,
    description: string
  ) => {
    const isActive = activeColorPicker === colorKey;
    const color = colors[colorKey];

    return (
      <View style={styles.colorInputContainer}>
        <View style={styles.colorInputHeader}>
          <View>
            <ThemedText style={styles.colorLabel}>{label}</ThemedText>
            <ThemedText style={styles.colorDescription}>{description}</ThemedText>
          </View>
          <Pressable
            style={[
              styles.colorPreview,
              { backgroundColor: color },
              isActive && styles.colorPreviewActive,
            ]}
            onPress={() => setActiveColorPicker(isActive ? null : colorKey)}
          >
            {isActive && (
              <MaterialIcons name="check" size={20} color={colorKey === "accentColor" && color === "#ffffff" ? "#000" : "#fff"} />
            )}
          </Pressable>
        </View>

        <View style={styles.hexInputRow}>
          <TextInput
            style={[
              styles.hexInput,
              !isValidHex(color) && styles.hexInputInvalid,
            ]}
            value={color}
            onChangeText={(text) => {
              let formatted = text.toUpperCase();
              if (!formatted.startsWith("#")) {
                formatted = "#" + formatted;
              }
              setColors((prev) => ({ ...prev, [colorKey]: formatted }));
            }}
            placeholder="#000000"
            placeholderTextColor="#64748b"
            maxLength={7}
            autoCapitalize="characters"
          />
        </View>

        {isActive && (
          <View style={styles.colorSwatches}>
            {COLOR_SWATCHES.map((swatch) => (
              <Pressable
                key={swatch}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: swatch },
                  color === swatch && styles.colorSwatchSelected,
                ]}
                onPress={() => handleSelectColor(swatch)}
              >
                {color === swatch && (
                  <MaterialIcons
                    name="check"
                    size={16}
                    color={swatch === "#ffffff" || swatch === "#f1f5f9" ? "#000" : "#fff"}
                  />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Kolory klubu</ThemedText>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Zapisz</ThemedText>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Podgląd</ThemedText>
            <View
              style={[
                styles.previewCard,
                { backgroundColor: colors.secondaryColor },
              ]}
            >
              <View style={styles.previewHeader}>
                <View
                  style={[
                    styles.previewBadge,
                    { backgroundColor: colors.primaryColor },
                  ]}
                >
                  <ThemedText style={[styles.previewBadgeText, { color: colors.accentColor }]}>
                    SKM
                  </ThemedText>
                </View>
                <ThemedText style={[styles.previewTitle, { color: colors.accentColor }]}>
                  Twój Klub
                </ThemedText>
              </View>
              <View style={styles.previewScore}>
                <ThemedText style={[styles.previewScoreText, { color: colors.accentColor }]}>
                  3 : 1
                </ThemedText>
              </View>
              <View
                style={[
                  styles.previewFooter,
                  { backgroundColor: colors.primaryColor },
                ]}
              >
                <ThemedText style={[styles.previewFooterText, { color: colors.accentColor }]}>
                  ZWYCIĘSTWO!
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Preset colors */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Gotowe zestawy</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.presetList}>
                {PRESET_COLORS.map((preset) => (
                  <Pressable
                    key={preset.name}
                    style={styles.presetItem}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <View style={styles.presetColors}>
                      <View
                        style={[
                          styles.presetColorPrimary,
                          { backgroundColor: preset.primary },
                        ]}
                      />
                      <View
                        style={[
                          styles.presetColorSecondary,
                          { backgroundColor: preset.secondary },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Custom colors */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Własne kolory</ThemedText>

            {renderColorInput(
              "Kolor główny",
              "primaryColor",
              "Używany dla przycisków i akcentów"
            )}

            {renderColorInput(
              "Kolor tła",
              "secondaryColor",
              "Tło szablonów social media"
            )}

            {renderColorInput(
              "Kolor tekstu",
              "accentColor",
              "Kolor tekstu na szablonach"
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  previewCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    aspectRatio: 1,
    justifyContent: "space-between",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  previewBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  previewBadgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewScore: {
    alignItems: "center",
  },
  previewScoreText: {
    fontSize: 48,
    fontWeight: "800",
  },
  previewFooter: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  previewFooterText: {
    fontSize: 18,
    fontWeight: "700",
  },
  presetList: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  presetItem: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  presetColors: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: "hidden",
    flexDirection: "row",
  },
  presetColorPrimary: {
    flex: 1,
  },
  presetColorSecondary: {
    flex: 1,
  },
  presetName: {
    fontSize: 12,
    color: "#94a3b8",
  },
  colorInputContainer: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  colorInputHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  colorDescription: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  colorPreviewActive: {
    borderColor: AppColors.primary,
    borderWidth: 3,
  },
  hexInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  hexInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
    fontFamily: "monospace",
  },
  hexInputInvalid: {
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  colorSwatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
});
