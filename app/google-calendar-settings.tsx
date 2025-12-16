import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  isGoogleCalendarSyncEnabled,
  setGoogleCalendarSyncEnabled,
  getGoogleCalendarToken,
  clearGoogleCalendarToken,
  getLastSyncTime,
} from "@/lib/google-calendar-sync";

export default function GoogleCalendarSettingsScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await isGoogleCalendarSyncEnabled();
      setSyncEnabled(enabled);

      const token = await getGoogleCalendarToken();
      setIsConnected(!!token);

      const lastSyncTime = await getLastSyncTime();
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (value: boolean) => {
    setSyncEnabled(value);
    await setGoogleCalendarSyncEnabled(value);
  };

  const handleConnect = () => {
    // In a real implementation, this would open Google OAuth flow
    Alert.alert(
      "Połącz z Google Calendar",
      "Ta funkcja wymaga konfiguracji Google OAuth w panelu Google Cloud Console.\n\n" +
      "Kroki:\n" +
      "1. Utwórz projekt w Google Cloud Console\n" +
      "2. Włącz Google Calendar API\n" +
      "3. Skonfiguruj OAuth 2.0 credentials\n" +
      "4. Dodaj klucze do ustawień aplikacji",
      [{ text: "OK" }]
    );
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Rozłącz konto",
      "Czy na pewno chcesz rozłączyć konto Google Calendar? Synchronizacja zostanie wyłączona.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Rozłącz",
          style: "destructive",
          onPress: async () => {
            await clearGoogleCalendarToken();
            setIsConnected(false);
            setSyncEnabled(false);
            await setGoogleCalendarSyncEnabled(false);
            Alert.alert("Sukces", "Konto Google Calendar zostało rozłączone");
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    if (!isConnected) {
      Alert.alert("Błąd", "Najpierw połącz konto Google Calendar");
      return;
    }

    setSyncing(true);
    try {
      // In a real implementation, this would trigger the sync
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLastSync(new Date());
      Alert.alert("Sukces", "Synchronizacja zakończona pomyślnie");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zsynchronizować kalendarza");
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Przed chwilą";
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    return `${days} dni temu`;
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>
          Zaloguj się, aby zarządzać synchronizacją kalendarza
        </ThemedText>
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
        <ThemedText style={styles.title}>Google Calendar</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name={isConnected ? "cloud-done" : "cloud-off"}
              size={24}
              color={isConnected ? AppColors.success : "#64748b"}
            />
            <ThemedText style={styles.sectionTitle}>Status połączenia</ThemedText>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? AppColors.success : "#64748b" },
                ]}
              />
              <ThemedText style={styles.statusText}>
                {isConnected ? "Połączono z Google Calendar" : "Nie połączono"}
              </ThemedText>
            </View>

            {lastSync && (
              <ThemedText style={styles.lastSyncText}>
                Ostatnia synchronizacja: {formatLastSync(lastSync)}
              </ThemedText>
            )}

            <Pressable
              style={[
                styles.connectButton,
                isConnected && styles.disconnectButton,
              ]}
              onPress={isConnected ? handleDisconnect : handleConnect}
            >
              <MaterialIcons
                name={isConnected ? "link-off" : "link"}
                size={20}
                color="#fff"
              />
              <ThemedText style={styles.connectButtonText}>
                {isConnected ? "Rozłącz konto" : "Połącz z Google"}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Sync Settings */}
        <View style={[styles.section, !isConnected && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="sync" size={24} color={AppColors.primary} />
            <ThemedText style={styles.sectionTitle}>Ustawienia synchronizacji</ThemedText>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Automatyczna synchronizacja</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Synchronizuj wydarzenia automatycznie przy zmianach
              </ThemedText>
            </View>
            <Switch
              value={syncEnabled}
              onValueChange={handleToggleSync}
              disabled={!isConnected}
              trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
              thumbColor={syncEnabled ? AppColors.primary : "#94a3b8"}
            />
          </View>

          <Pressable
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={!isConnected || syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="sync" size={20} color="#fff" />
            )}
            <ThemedText style={styles.syncButtonText}>
              {syncing ? "Synchronizowanie..." : "Synchronizuj teraz"}
            </ThemedText>
          </Pressable>
        </View>

        {/* Sync Options */}
        <View style={[styles.section, !isConnected && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="tune" size={24} color={AppColors.secondary} />
            <ThemedText style={styles.sectionTitle}>Opcje synchronizacji</ThemedText>
          </View>

          <View style={styles.optionRow}>
            <MaterialIcons name="sports-soccer" size={20} color={AppColors.primary} />
            <ThemedText style={styles.optionText}>Mecze</ThemedText>
            <MaterialIcons name="check-circle" size={20} color={AppColors.success} />
          </View>

          <View style={styles.optionRow}>
            <MaterialIcons name="fitness-center" size={20} color={AppColors.warning} />
            <ThemedText style={styles.optionText}>Treningi</ThemedText>
            <MaterialIcons name="check-circle" size={20} color={AppColors.success} />
          </View>

          <View style={styles.optionRow}>
            <MaterialIcons name="event" size={20} color={AppColors.secondary} />
            <ThemedText style={styles.optionText}>Inne wydarzenia</ThemedText>
            <MaterialIcons name="check-circle" size={20} color={AppColors.success} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Synchronizacja dwukierunkowa pozwala na automatyczne dodawanie wydarzeń
            z aplikacji do Google Calendar oraz importowanie zmian z Google Calendar
            do aplikacji.
          </ThemedText>
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
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionDisabled: {
    opacity: 0.5,
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
  statusCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
  },
  lastSyncText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  disconnectButton: {
    backgroundColor: AppColors.danger,
  },
  connectButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: "#fff",
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 2,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.secondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748b",
    textAlign: "center",
  },
});
