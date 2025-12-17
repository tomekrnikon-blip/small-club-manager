import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type SyncFrequency = "12h" | "24h" | "48h" | "manual";

interface SyncSettings {
  autoSync: boolean;
  frequency: SyncFrequency;
  notifyOnImport: boolean;
  notifyOnScheduleChange: boolean;
  notifyOnNewMatches: boolean;
  syncOnWifiOnly: boolean;
}

const SYNC_SETTINGS_KEY = "@sync_settings";

const DEFAULT_SETTINGS: SyncSettings = {
  autoSync: true,
  frequency: "24h",
  notifyOnImport: true,
  notifyOnScheduleChange: true,
  notifyOnNewMatches: true,
  syncOnWifiOnly: false,
};

const FREQUENCY_OPTIONS: { value: SyncFrequency; label: string; description: string }[] = [
  { value: "12h", label: "Co 12 godzin", description: "Częsta aktualizacja" },
  { value: "24h", label: "Co 24 godziny", description: "Zalecane" },
  { value: "48h", label: "Co 48 godzin", description: "Oszczędność danych" },
  { value: "manual", label: "Ręcznie", description: "Tylko na żądanie" },
];

export default function SyncSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [settings, setSettings] = useState<SyncSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load sync settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: SyncSettings) => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save sync settings:", error);
      Alert.alert("Błąd", "Nie udało się zapisać ustawień");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const renderFrequencyOption = (option: typeof FREQUENCY_OPTIONS[0]) => {
    const isSelected = settings.frequency === option.value;
    const isDisabled = !settings.autoSync && option.value !== "manual";

    return (
      <Pressable
        key={option.value}
        style={[
          styles.frequencyOption,
          { 
            backgroundColor: isSelected ? AppColors.primary + "20" : cardBg,
            borderColor: isSelected ? AppColors.primary : borderColor,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={() => !isDisabled && updateSetting("frequency", option.value)}
        disabled={isDisabled}
      >
        <View style={styles.frequencyContent}>
          <View style={styles.frequencyHeader}>
            <MaterialIcons
              name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
              size={24}
              color={isSelected ? AppColors.primary : borderColor}
            />
            <ThemedText style={[styles.frequencyLabel, isSelected && { color: AppColors.primary }]}>
              {option.label}
            </ThemedText>
          </View>
          <ThemedText style={styles.frequencyDescription}>{option.description}</ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primary} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Ustawienia synchronizacji
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* Auto Sync Toggle */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="sync" size={24} color={AppColors.primary} />
              <View style={styles.settingText}>
                <ThemedText type="defaultSemiBold">Automatyczna synchronizacja</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Automatycznie pobieraj dane ligowe
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSetting("autoSync", value)}
              trackColor={{ false: borderColor, true: AppColors.primary + "80" }}
              thumbColor={settings.autoSync ? AppColors.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Frequency Selection */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Częstotliwość synchronizacji
          </ThemedText>
          <View style={styles.frequencyList}>
            {FREQUENCY_OPTIONS.map(renderFrequencyOption)}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Powiadomienia
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color={AppColors.info} />
              <View style={styles.settingText}>
                <ThemedText type="defaultSemiBold">Po synchronizacji</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Powiadom o zakończeniu importu
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.notifyOnImport}
              onValueChange={(value) => updateSetting("notifyOnImport", value)}
              trackColor={{ false: borderColor, true: AppColors.primary + "80" }}
              thumbColor={settings.notifyOnImport ? AppColors.primary : "#f4f3f4"}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="event" size={24} color={AppColors.warning} />
              <View style={styles.settingText}>
                <ThemedText type="defaultSemiBold">Zmiany w terminarzu</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Powiadom o zmianie daty/godziny meczu
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.notifyOnScheduleChange}
              onValueChange={(value) => updateSetting("notifyOnScheduleChange", value)}
              trackColor={{ false: borderColor, true: AppColors.primary + "80" }}
              thumbColor={settings.notifyOnScheduleChange ? AppColors.primary : "#f4f3f4"}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="add-circle" size={24} color={AppColors.success} />
              <View style={styles.settingText}>
                <ThemedText type="defaultSemiBold">Nowe mecze</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Powiadom o nowych meczach w terminarzu
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.notifyOnNewMatches}
              onValueChange={(value) => updateSetting("notifyOnNewMatches", value)}
              trackColor={{ false: borderColor, true: AppColors.primary + "80" }}
              thumbColor={settings.notifyOnNewMatches ? AppColors.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Data Usage */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Użycie danych
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="wifi" size={24} color={AppColors.info} />
              <View style={styles.settingText}>
                <ThemedText type="defaultSemiBold">Tylko przez Wi-Fi</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Synchronizuj tylko gdy połączony z Wi-Fi
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.syncOnWifiOnly}
              onValueChange={(value) => updateSetting("syncOnWifiOnly", value)}
              trackColor={{ false: borderColor, true: AppColors.primary + "80" }}
              thumbColor={settings.syncOnWifiOnly ? AppColors.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={20} color={AppColors.textSecondary} />
          <ThemedText style={styles.infoText}>
            Synchronizacja pobiera dane z oficjalnych źródeł ligowych wybranego kraju.
            Częstsza synchronizacja zapewnia aktualne informacje, ale zużywa więcej danych.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  settingText: {
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  frequencyList: {
    gap: Spacing.sm,
  },
  frequencyOption: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  frequencyContent: {
    gap: 4,
  },
  frequencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  frequencyLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  frequencyDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 32,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    opacity: 0.7,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
