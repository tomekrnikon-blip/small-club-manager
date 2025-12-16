import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, Switch, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useOffline } from "@/hooks/use-offline";

export default function OfflineSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isOnline,
    isOfflineMode,
    syncStatus,
    pendingChanges,
    lastSyncTime,
    cacheSize,
    toggleOfflineMode,
    processSyncQueue,
    clearOfflineData,
    refreshStatus,
  } = useOffline();

  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert("Brak połączenia", "Synchronizacja wymaga połączenia z internetem.");
      return;
    }
    
    setIsSyncing(true);
    await processSyncQueue();
    setIsSyncing(false);
  };

  const handleClearCache = () => {
    Alert.alert(
      "Wyczyść dane offline",
      "Czy na pewno chcesz usunąć wszystkie dane z pamięci podręcznej? Niezapisane zmiany zostaną utracone.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyczyść",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            await clearOfflineData();
            setIsClearing(false);
            Alert.alert("Gotowe", "Dane offline zostały wyczyszczone.");
          },
        },
      ]
    );
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return "Nigdy";
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    if (diff < 60000) return "Przed chwilą";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`;
    return lastSyncTime.toLocaleDateString("pl-PL");
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case "syncing":
        return "Synchronizacja...";
      case "success":
        return "Zsynchronizowano";
      case "error":
        return "Błąd synchronizacji";
      default:
        return "Gotowe";
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case "syncing":
        return AppColors.warning;
      case "success":
        return AppColors.success;
      case "error":
        return AppColors.danger;
      default:
        return "#64748b";
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Tryb offline</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? AppColors.success : AppColors.danger }]} />
              <ThemedText style={styles.statusText}>
                {isOnline ? "Online" : "Offline"}
              </ThemedText>
            </View>
            <Pressable onPress={refreshStatus} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={20} color={AppColors.primary} />
            </Pressable>
          </View>
          
          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusLabel}>Status synchronizacji</ThemedText>
              <ThemedText style={[styles.statusValue, { color: getSyncStatusColor() }]}>
                {getSyncStatusText()}
              </ThemedText>
            </View>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusLabel}>Ostatnia synchronizacja</ThemedText>
              <ThemedText style={styles.statusValue}>{formatLastSync()}</ThemedText>
            </View>
          </View>
        </View>

        {/* Offline Mode Toggle */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ustawienia</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="cloud-off" size={24} color={AppColors.primary} />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingLabel}>Tryb offline</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Używaj zapisanych danych bez połączenia z internetem
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isOfflineMode}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: "#3e3e3e", true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Sync Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Synchronizacja</ThemedText>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="sync" size={20} color="#64748b" />
              <ThemedText style={styles.infoLabel}>Oczekujące zmiany</ThemedText>
              <ThemedText style={[styles.infoValue, pendingChanges > 0 && { color: AppColors.warning }]}>
                {pendingChanges}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="storage" size={20} color="#64748b" />
              <ThemedText style={styles.infoLabel}>Rozmiar cache</ThemedText>
              <ThemedText style={styles.infoValue}>{cacheSize}</ThemedText>
            </View>
          </View>

          <Pressable
            style={[styles.actionButton, (!isOnline || isSyncing) && styles.actionButtonDisabled]}
            onPress={handleSync}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="sync" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Synchronizuj teraz</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {/* Cache Management */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Zarządzanie danymi</ThemedText>
          
          <Pressable
            style={[styles.dangerButton, isClearing && styles.actionButtonDisabled]}
            onPress={handleClearCache}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="delete-outline" size={20} color="#fff" />
                <ThemedText style={styles.dangerButtonText}>Wyczyść dane offline</ThemedText>
              </>
            )}
          </Pressable>
          
          <ThemedText style={styles.warningText}>
            Uwaga: Wyczyszczenie danych usunie wszystkie zapisane informacje z pamięci podręcznej.
            Niezapisane zmiany zostaną utracone.
          </ThemedText>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialIcons name="info-outline" size={20} color={AppColors.primary} />
              <ThemedText style={styles.infoText}>
                Tryb offline pozwala korzystać z aplikacji bez połączenia z internetem.
                Dane są zapisywane lokalnie i synchronizowane po przywróceniu połączenia.
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="warning-amber" size={20} color={AppColors.warning} />
              <ThemedText style={styles.infoText}>
                Niektóre funkcje mogą być niedostępne w trybie offline, np. wysyłanie powiadomień SMS.
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  statusCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  refreshButton: {
    padding: 8,
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  statusValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#fff",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: "#fff",
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#94a3b8",
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
  infoItem: {
    flexDirection: "row",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#94a3b8",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.md,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.danger,
    borderRadius: Radius.md,
    paddingVertical: 14,
  },
  dangerButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
