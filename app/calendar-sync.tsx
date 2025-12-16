import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import {
  addEventsToCalendar,
  hasCalendarPermissions,
  requestCalendarPermissions,
  type CalendarEvent,
} from "@/lib/system-calendar";

export default function CalendarSyncScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [includeMatches, setIncludeMatches] = useState(true);
  const [includeTrainings, setIncludeTrainings] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const club = clubs?.[0];

  // Get events for next 6 months
  const startDate = new Date().toISOString().split('T')[0];
  const endDateObj = new Date();
  endDateObj.setMonth(endDateObj.getMonth() + 6);
  const endDate = endDateObj.toISOString().split('T')[0];

  const { data: calendarEvents } = trpc.calendar.getEvents.useQuery(
    { clubId: club?.id ?? 0, startDate, endDate },
    { enabled: !!club?.id }
  );

  // Check permissions on mount
  useState(() => {
    hasCalendarPermissions().then(setHasPermission);
  });

  const upcomingMatches = calendarEvents?.matches?.filter(
    (m: any) => new Date(m.matchDate) >= new Date()
  ) || [];

  const upcomingTrainings = calendarEvents?.trainings?.filter(
    (t: any) => new Date(t.trainingDate) >= new Date()
  ) || [];

  const handleRequestPermission = async () => {
    const granted = await requestCalendarPermissions();
    setHasPermission(granted);
    if (!granted) {
      Alert.alert(
        "Brak uprawnień",
        "Aplikacja potrzebuje dostępu do kalendarza. Włącz uprawnienia w ustawieniach urządzenia."
      );
    }
  };

  const handleSync = async () => {
    if (!hasPermission) {
      await handleRequestPermission();
      return;
    }

    setSyncing(true);
    try {
      const events: CalendarEvent[] = [];

      if (includeMatches) {
        for (const match of upcomingMatches as any[]) {
          const startDate = new Date(match.matchDate);
          if (match.matchTime) {
            const [hours, minutes] = match.matchTime.split(":").map(Number);
            startDate.setHours(hours, minutes, 0, 0);
          }
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

          events.push({
            title: `⚽ Mecz: ${match.opponent}`,
            startDate,
            endDate,
            location: match.location || undefined,
            notes: `Mecz ${match.homeAway === 'home' ? 'domowy' : 'wyjazdowy'}`,
            alarms: [60, 1440], // 1h and 24h before
          });
        }
      }

      if (includeTrainings) {
        for (const training of upcomingTrainings as any[]) {
          const startDate = new Date(training.trainingDate);
          if (training.trainingTime) {
            const [hours, minutes] = training.trainingTime.split(":").map(Number);
            startDate.setHours(hours, minutes, 0, 0);
          }
          const endDate = new Date(startDate.getTime() + 1.5 * 60 * 60 * 1000);

          events.push({
            title: `🏃 Trening`,
            startDate,
            endDate,
            location: training.location || undefined,
            notes: training.notes || "Trening klubowy",
            alarms: [60], // 1h before
          });
        }
      }

      if (events.length === 0) {
        Alert.alert("Info", "Brak wydarzeń do synchronizacji");
        return;
      }

      const successCount = await addEventsToCalendar(events);
      Alert.alert(
        "Sukces",
        `Dodano ${successCount} z ${events.length} wydarzeń do kalendarza systemowego`
      );
    } catch (error) {
      console.error("[CalendarSync] Error:", error);
      Alert.alert("Błąd", "Nie udało się zsynchronizować kalendarza");
    } finally {
      setSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>
          Zaloguj się, aby zsynchronizować kalendarz
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
        <ThemedText style={styles.title}>Synchronizacja kalendarza</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name={hasPermission ? "check-circle" : "warning"}
              size={24}
              color={hasPermission ? AppColors.success : AppColors.warning}
            />
            <ThemedText style={styles.sectionTitle}>
              {hasPermission ? "Uprawnienia przyznane" : "Wymagane uprawnienia"}
            </ThemedText>
          </View>
          {!hasPermission && (
            <Pressable style={styles.permissionButton} onPress={handleRequestPermission}>
              <ThemedText style={styles.permissionButtonText}>
                Przyznaj dostęp do kalendarza
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Event Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="event" size={24} color={AppColors.primary} />
            <ThemedText style={styles.sectionTitle}>Wybierz wydarzenia</ThemedText>
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <MaterialIcons name="sports-soccer" size={20} color={AppColors.primary} />
              <View>
                <ThemedText style={styles.optionLabel}>Mecze</ThemedText>
                <ThemedText style={styles.optionCount}>
                  {upcomingMatches.length} nadchodzących
                </ThemedText>
              </View>
            </View>
            <Switch
              value={includeMatches}
              onValueChange={setIncludeMatches}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={includeMatches ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <MaterialIcons name="fitness-center" size={20} color={AppColors.secondary} />
              <View>
                <ThemedText style={styles.optionLabel}>Treningi</ThemedText>
                <ThemedText style={styles.optionCount}>
                  {upcomingTrainings.length} nadchodzących
                </ThemedText>
              </View>
            </View>
            <Switch
              value={includeTrainings}
              onValueChange={setIncludeTrainings}
              trackColor={{ false: "#475569", true: AppColors.secondary + "80" }}
              thumbColor={includeTrainings ? AppColors.secondary : "#94a3b8"}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <MaterialIcons name="sync" size={32} color={AppColors.info} />
          <ThemedText style={styles.summaryTitle}>
            {(includeMatches ? upcomingMatches.length : 0) +
              (includeTrainings ? upcomingTrainings.length : 0)}{" "}
            wydarzeń do synchronizacji
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Wydarzenia zostaną dodane do kalendarza "Small Club Manager" na Twoim urządzeniu
          </ThemedText>
        </View>

        {/* Sync Button */}
        <Pressable
          style={[
            styles.syncButton,
            (!hasPermission || syncing) && styles.syncButtonDisabled,
          ]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="sync" size={24} color="#fff" />
              <ThemedText style={styles.syncButtonText}>
                Synchronizuj z kalendarzem
              </ThemedText>
            </>
          )}
        </Pressable>

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Synchronizacja dodaje wydarzenia do natywnego kalendarza iOS/Android.
            Przypomnienia są ustawiane automatycznie (1h przed treningiem, 1h i 24h przed meczem).
          </ThemedText>
        </View>

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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  permissionButton: {
    backgroundColor: AppColors.warning,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  permissionButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#fff",
  },
  optionCount: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  summaryCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#94a3b8",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#94a3b8",
    textAlign: "center",
  },
});
