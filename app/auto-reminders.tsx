import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import {
  getReminderSettings,
  saveReminderSettings,
  scheduleTrainingReminders,
  scheduleMatchReminders,
  cancelAllReminders,
  getScheduledNotifications,
  ReminderSettings,
} from "@/lib/auto-reminders";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AutoRemindersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: trainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  useEffect(() => {
    loadSettings();
    loadScheduledCount();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getReminderSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('[AutoReminders] Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduledCount = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('[AutoReminders] Error loading scheduled count:', error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await saveReminderSettings(settings);
      Alert.alert("Sukces", "Ustawienia przypomnień zostały zapisane");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać ustawień");
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleAll = async () => {
    if (!trainings || !matches) {
      Alert.alert("Błąd", "Brak danych do zaplanowania przypomnień");
      return;
    }

    setIsSaving(true);
    try {
      // Filter future events
      const now = new Date();
      const futureTrainings = trainings.filter(t => new Date(t.trainingDate) > now);
      const futureMatches = matches.filter(m => new Date(m.matchDate) > now);

      const trainingCount = await scheduleTrainingReminders(
        futureTrainings.map(t => ({
          id: t.id,
          trainingDate: t.trainingDate instanceof Date ? t.trainingDate.toISOString() : String(t.trainingDate),
          location: t.location ?? undefined,
          notes: t.notes ?? undefined,
        }))
      );
      const matchCount = await scheduleMatchReminders(
        futureMatches.map(m => ({
          id: m.id,
          matchDate: m.matchDate instanceof Date ? m.matchDate.toISOString() : String(m.matchDate),
          opponent: m.opponent ?? undefined,
          location: m.location ?? undefined,
        }))
      );

      await loadScheduledCount();

      Alert.alert(
        "Zaplanowano przypomnienia",
        `Treningi: ${trainingCount}\nMecze: ${matchCount}`
      );
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zaplanować przypomnień");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAll = async () => {
    Alert.alert(
      "Anuluj wszystkie",
      "Czy na pewno chcesz anulować wszystkie zaplanowane przypomnienia?",
      [
        { text: "Nie", style: "cancel" },
        {
          text: "Tak, anuluj",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              await cancelAllReminders();
              await loadScheduledCount();
              Alert.alert("Sukces", "Wszystkie przypomnienia zostały anulowane");
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się anulować przypomnień");
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const updateSetting = <K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (isLoading || !settings) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Automatyczne przypomnienia</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <MaterialIcons name="notifications-active" size={32} color={AppColors.primary} />
          <View style={styles.statusInfo}>
            <ThemedText style={styles.statusTitle}>
              Zaplanowane przypomnienia
            </ThemedText>
            <ThemedText style={styles.statusValue}>{scheduledCount}</ThemedText>
          </View>
        </View>

        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Włącz przypomnienia</ThemedText>
              <ThemedText style={styles.settingHint}>
                Automatycznie planuj przypomnienia dla nowych wydarzeń
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: '#3e3e3e', true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Reminder Types */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Typy przypomnień</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="fitness-center" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Treningi</ThemedText>
            </View>
            <Switch
              value={settings.reminderTypes.training}
              onValueChange={(value) => 
                updateSetting('reminderTypes', { ...settings.reminderTypes, training: value })
              }
              trackColor={{ false: '#3e3e3e', true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="sports-soccer" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Mecze</ThemedText>
            </View>
            <Switch
              value={settings.reminderTypes.match}
              onValueChange={(value) => 
                updateSetting('reminderTypes', { ...settings.reminderTypes, match: value })
              }
              trackColor={{ false: '#3e3e3e', true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="group-add" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Powołania</ThemedText>
            </View>
            <Switch
              value={settings.reminderTypes.callup}
              onValueChange={(value) => 
                updateSetting('reminderTypes', { ...settings.reminderTypes, callup: value })
              }
              trackColor={{ false: '#3e3e3e', true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Czas przed wydarzeniem</ThemedText>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Treningi</ThemedText>
              <ThemedText style={styles.sliderValue}>
                {settings.trainingReminderHours}h przed
              </ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={24}
              step={1}
              value={settings.trainingReminderHours}
              onValueChange={(value) => updateSetting('trainingReminderHours', value)}
              minimumTrackTintColor={AppColors.primary}
              maximumTrackTintColor="#3e3e3e"
              thumbTintColor={AppColors.primary}
            />
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Mecze</ThemedText>
              <ThemedText style={styles.sliderValue}>
                {settings.matchReminderHours}h przed
              </ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={48}
              step={1}
              value={settings.matchReminderHours}
              onValueChange={(value) => updateSetting('matchReminderHours', value)}
              minimumTrackTintColor={AppColors.primary}
              maximumTrackTintColor="#3e3e3e"
              thumbTintColor={AppColors.primary}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <ThemedText style={styles.actionBtnText}>Zapisz ustawienia</ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={handleScheduleAll}
            disabled={isSaving}
          >
            <MaterialIcons name="schedule" size={20} color={AppColors.primary} />
            <ThemedText style={[styles.actionBtnText, { color: AppColors.primary }]}>
              Zaplanuj wszystkie przypomnienia
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={handleCancelAll}
            disabled={isSaving}
          >
            <MaterialIcons name="cancel" size={20} color={AppColors.danger} />
            <ThemedText style={[styles.actionBtnText, { color: AppColors.danger }]}>
              Anuluj wszystkie
            </ThemedText>
          </Pressable>
        </View>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "#1e293b",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  statusValue: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  settingHint: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  dangerBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
