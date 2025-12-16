import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/background-notifications";

export default function NotificationPreferencesScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    matchReminders: true,
    trainingReminders: true,
    callupNotifications: true,
    paymentReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [matchReminderHours, setMatchReminderHours] = useState(24);
  const [trainingReminderHours, setTrainingReminderHours] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNotificationPreferences(preferences);
      Alert.alert("Sukces", "Ustawienia powiadomień zostały zapisane");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>
          Zaloguj się, aby zarządzać powiadomieniami
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Ustawienia powiadomień</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="notifications" size={24} color={AppColors.primary} />
            <ThemedText style={styles.sectionTitle}>Powiadomienia</ThemedText>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Włącz powiadomienia</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Główny przełącznik dla wszystkich powiadomień
              </ThemedText>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreference("enabled", value)}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.enabled ? AppColors.primary : "#94a3b8"}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="category" size={24} color={AppColors.secondary} />
            <ThemedText style={styles.sectionTitle}>Typy powiadomień</ThemedText>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o meczach</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Powiadomienia przed nadchodzącymi meczami
              </ThemedText>
            </View>
            <Switch
              value={preferences.matchReminders}
              onValueChange={(value) => updatePreference("matchReminders", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.matchReminders ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o treningach</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Powiadomienia przed treningami
              </ThemedText>
            </View>
            <Switch
              value={preferences.trainingReminders}
              onValueChange={(value) => updatePreference("trainingReminders", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.trainingReminders ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Powołania na mecze</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Powiadomienia o nowych powołaniach
              </ThemedText>
            </View>
            <Switch
              value={preferences.callupNotifications}
              onValueChange={(value) => updatePreference("callupNotifications", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.callupNotifications ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o płatnościach</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Powiadomienia o zaległych płatnościach
              </ThemedText>
            </View>
            <Switch
              value={preferences.paymentReminders}
              onValueChange={(value) => updatePreference("paymentReminders", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.paymentReminders ? AppColors.primary : "#94a3b8"}
            />
          </View>
        </View>

        {/* Reminder Timing */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={24} color={AppColors.warning} />
            <ThemedText style={styles.sectionTitle}>Czas przypomnień</ThemedText>
          </View>

          <View style={styles.sliderRow}>
            <ThemedText style={styles.settingLabel}>
              Przypomnienie o meczu: {matchReminderHours}h przed
            </ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={48}
              step={1}
              value={matchReminderHours}
              onValueChange={setMatchReminderHours}
              minimumTrackTintColor={AppColors.primary}
              maximumTrackTintColor="#475569"
              thumbTintColor={AppColors.primary}
              disabled={!preferences.enabled || !preferences.matchReminders}
            />
            <View style={styles.sliderLabels}>
              <ThemedText style={styles.sliderLabel}>1h</ThemedText>
              <ThemedText style={styles.sliderLabel}>48h</ThemedText>
            </View>
          </View>

          <View style={styles.sliderRow}>
            <ThemedText style={styles.settingLabel}>
              Przypomnienie o treningu: {trainingReminderHours}h przed
            </ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={24}
              step={1}
              value={trainingReminderHours}
              onValueChange={setTrainingReminderHours}
              minimumTrackTintColor={AppColors.secondary}
              maximumTrackTintColor="#475569"
              thumbTintColor={AppColors.secondary}
              disabled={!preferences.enabled || !preferences.trainingReminders}
            />
            <View style={styles.sliderLabels}>
              <ThemedText style={styles.sliderLabel}>1h</ThemedText>
              <ThemedText style={styles.sliderLabel}>24h</ThemedText>
            </View>
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="volume-up" size={24} color={AppColors.info} />
            <ThemedText style={styles.sectionTitle}>Dźwięk i wibracje</ThemedText>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Dźwięk powiadomień</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Odtwarzaj dźwięk przy powiadomieniach
              </ThemedText>
            </View>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => updatePreference("soundEnabled", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.soundEnabled ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Wibracje</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Wibruj przy powiadomieniach
              </ThemedText>
            </View>
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => updatePreference("vibrationEnabled", value)}
              disabled={!preferences.enabled}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={preferences.vibrationEnabled ? AppColors.primary : "#94a3b8"}
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <ThemedText style={styles.saveButtonText}>
            {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
          </ThemedText>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#fff",
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
    marginTop: 2,
  },
  sliderRow: {
    paddingVertical: Spacing.sm,
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: Spacing.sm,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#94a3b8",
    textAlign: "center",
  },
});
