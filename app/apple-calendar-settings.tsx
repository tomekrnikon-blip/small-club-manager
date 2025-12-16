import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  requestCalendarPermissions,
  hasCalendarPermissions,
  getOrCreateAppCalendar,
  getAvailableCalendars,
  isAppleCalendarAvailable,
} from "@/lib/apple-calendar";

const APPLE_CALENDAR_SETTINGS_KEY = "apple_calendar_settings";

type CalendarSettings = {
  enabled: boolean;
  syncMatches: boolean;
  syncTrainings: boolean;
  syncMeetings: boolean;
  defaultReminder: number; // minutes
  autoSync: boolean;
};

const DEFAULT_SETTINGS: CalendarSettings = {
  enabled: false,
  syncMatches: true,
  syncTrainings: true,
  syncMeetings: false,
  defaultReminder: 60,
  autoSync: false,
};

export default function AppleCalendarSettingsScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Check permissions
      const permission = await hasCalendarPermissions();
      setHasPermission(permission);

      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(APPLE_CALENDAR_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Get available calendars
      if (permission) {
        const calendars = await getAvailableCalendars();
        setAvailableCalendars(calendars);

        // Check if app calendar exists
        const appCalendarId = await AsyncStorage.getItem("apple_calendar_id");
        setCalendarId(appCalendarId);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestCalendarPermissions();
    setHasPermission(granted);

    if (granted) {
      const calendars = await getAvailableCalendars();
      setAvailableCalendars(calendars);
      Alert.alert("Sukces", "Uprawnienia do kalendarza zostały przyznane");
    } else {
      Alert.alert(
        "Brak uprawnień",
        "Aby korzystać z integracji z kalendarzem, przyznaj uprawnienia w ustawieniach urządzenia."
      );
    }
  };

  const handleEnableIntegration = async () => {
    if (!hasPermission) {
      await handleRequestPermission();
      return;
    }

    setSaving(true);
    try {
      const id = await getOrCreateAppCalendar();
      if (id) {
        setCalendarId(id);
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        await AsyncStorage.setItem(APPLE_CALENDAR_SETTINGS_KEY, JSON.stringify(newSettings));
        Alert.alert("Sukces", "Kalendarz Small Club Manager został utworzony");
      } else {
        Alert.alert("Błąd", "Nie udało się utworzyć kalendarza");
      }
    } catch (error) {
      Alert.alert("Błąd", "Wystąpił błąd podczas konfiguracji kalendarza");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (key: keyof CalendarSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem(APPLE_CALENDAR_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleSetReminder = (minutes: number) => {
    handleToggleSetting("defaultReminder", minutes as any);
  };

  if (!isAppleCalendarAvailable()) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Apple Calendar</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <View style={[styles.content, styles.centered]}>
          <MaterialIcons name="event-busy" size={64} color="#64748b" />
          <ThemedText style={styles.unavailableTitle}>Niedostępne</ThemedText>
          <ThemedText style={styles.unavailableText}>
            Integracja z Apple Calendar jest dostępna tylko na urządzeniach iOS.
            {"\n\n"}
            Na Androidzie użyj opcji "Google Calendar" lub "Synchronizuj kalendarz".
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
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
        <ThemedText style={styles.headerTitle}>Apple Calendar</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialIcons
              name={settings.enabled ? "event-available" : "event-busy"}
              size={32}
              color={settings.enabled ? AppColors.success : "#64748b"}
            />
          </View>
          <View style={styles.statusInfo}>
            <ThemedText style={styles.statusTitle}>
              {settings.enabled ? "Połączono" : "Niepołączono"}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              {settings.enabled
                ? "Wydarzenia są synchronizowane z kalendarzem Apple"
                : "Włącz integrację, aby synchronizować wydarzenia"}
            </ThemedText>
          </View>
        </View>

        {/* Permission Status */}
        {!hasPermission && (
          <View style={styles.permissionCard}>
            <MaterialIcons name="lock" size={24} color={AppColors.warning} />
            <View style={styles.permissionInfo}>
              <ThemedText style={styles.permissionTitle}>Wymagane uprawnienia</ThemedText>
              <ThemedText style={styles.permissionText}>
                Aplikacja potrzebuje dostępu do kalendarza
              </ThemedText>
            </View>
            <Pressable style={styles.permissionBtn} onPress={handleRequestPermission}>
              <ThemedText style={styles.permissionBtnText}>Przyznaj</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Enable/Disable Integration */}
        {!settings.enabled && hasPermission && (
          <Pressable
            style={[styles.enableBtn, saving && styles.enableBtnDisabled]}
            onPress={handleEnableIntegration}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="add-circle" size={24} color="#fff" />
                <ThemedText style={styles.enableBtnText}>Włącz integrację</ThemedText>
              </>
            )}
          </Pressable>
        )}

        {/* Settings */}
        {settings.enabled && (
          <>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Synchronizacja</ThemedText>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="sports-soccer" size={24} color="#22c55e" />
                  <ThemedText style={styles.settingLabel}>Mecze</ThemedText>
                </View>
                <Switch
                  value={settings.syncMatches}
                  onValueChange={(value) => handleToggleSetting("syncMatches", value)}
                  trackColor={{ false: "#334155", true: AppColors.primary + "60" }}
                  thumbColor={settings.syncMatches ? AppColors.primary : "#64748b"}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="fitness-center" size={24} color="#f59e0b" />
                  <ThemedText style={styles.settingLabel}>Treningi</ThemedText>
                </View>
                <Switch
                  value={settings.syncTrainings}
                  onValueChange={(value) => handleToggleSetting("syncTrainings", value)}
                  trackColor={{ false: "#334155", true: AppColors.primary + "60" }}
                  thumbColor={settings.syncTrainings ? AppColors.primary : "#64748b"}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="groups" size={24} color="#8b5cf6" />
                  <ThemedText style={styles.settingLabel}>Spotkania</ThemedText>
                </View>
                <Switch
                  value={settings.syncMeetings}
                  onValueChange={(value) => handleToggleSetting("syncMeetings", value)}
                  trackColor={{ false: "#334155", true: AppColors.primary + "60" }}
                  thumbColor={settings.syncMeetings ? AppColors.primary : "#64748b"}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="sync" size={24} color="#06b6d4" />
                  <ThemedText style={styles.settingLabel}>Auto-synchronizacja</ThemedText>
                </View>
                <Switch
                  value={settings.autoSync}
                  onValueChange={(value) => handleToggleSetting("autoSync", value)}
                  trackColor={{ false: "#334155", true: AppColors.primary + "60" }}
                  thumbColor={settings.autoSync ? AppColors.primary : "#64748b"}
                />
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Domyślne przypomnienie</ThemedText>
              <View style={styles.reminderOptions}>
                {[15, 30, 60, 120, 1440].map((minutes) => (
                  <Pressable
                    key={minutes}
                    style={[
                      styles.reminderOption,
                      settings.defaultReminder === minutes && styles.reminderOptionActive,
                    ]}
                    onPress={() => handleSetReminder(minutes)}
                  >
                    <ThemedText
                      style={[
                        styles.reminderOptionText,
                        settings.defaultReminder === minutes && styles.reminderOptionTextActive,
                      ]}
                    >
                      {minutes < 60
                        ? `${minutes} min`
                        : minutes === 60
                        ? "1 godz"
                        : minutes === 120
                        ? "2 godz"
                        : "1 dzień"}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Kalendarz</ThemedText>
                  <ThemedText style={styles.infoValue}>Small Club Manager</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>ID kalendarza</ThemedText>
                  <ThemedText style={styles.infoValue} numberOfLines={1}>
                    {calendarId?.substring(0, 20)}...
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Dostępne kalendarze</ThemedText>
                  <ThemedText style={styles.infoValue}>{availableCalendars.length}</ThemedText>
                </View>
              </View>
            </View>

            {/* Disable Integration */}
            <Pressable
              style={styles.disableBtn}
              onPress={() => {
                Alert.alert(
                  "Wyłącz integrację",
                  "Czy na pewno chcesz wyłączyć integrację z Apple Calendar?",
                  [
                    { text: "Anuluj", style: "cancel" },
                    {
                      text: "Wyłącz",
                      style: "destructive",
                      onPress: async () => {
                        const newSettings = { ...settings, enabled: false };
                        setSettings(newSettings);
                        await AsyncStorage.setItem(
                          APPLE_CALENDAR_SETTINGS_KEY,
                          JSON.stringify(newSettings)
                        );
                      },
                    },
                  ]
                );
              }}
            >
              <MaterialIcons name="link-off" size={20} color={AppColors.danger} />
              <ThemedText style={styles.disableBtnText}>Wyłącz integrację</ThemedText>
            </Pressable>
          </>
        )}
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
  headerTitle: {
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
    paddingBottom: Spacing.xl,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.bgDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginTop: 2,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warning + "20",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  permissionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  permissionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
  permissionText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
  },
  permissionBtn: {
    backgroundColor: AppColors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  permissionBtnText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
  enableBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  enableBtnDisabled: {
    opacity: 0.6,
  },
  enableBtnText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
  },
  reminderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  reminderOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    borderWidth: 1,
    borderColor: "#334155",
  },
  reminderOptionActive: {
    backgroundColor: AppColors.primary + "20",
    borderColor: AppColors.primary,
  },
  reminderOptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  reminderOptionTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    maxWidth: "60%",
  },
  disableBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.danger + "20",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  disableBtnText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: AppColors.danger,
  },
  unavailableTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.lg,
  },
  unavailableText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748b",
    textAlign: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
});
