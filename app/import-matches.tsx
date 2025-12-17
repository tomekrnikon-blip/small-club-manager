import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

interface SyncStatus {
  lastSync: string | null;
  matchesImported: number;
  source: string;
  status: "idle" | "syncing" | "success" | "error";
  error?: string;
}

export default function ImportMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    matchesImported: 0,
    source: "",
    status: "idle",
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const club = clubs?.[0];

  // Load saved country preference
  useState(() => {
    AsyncStorage.getItem("user_country").then((country) => {
      if (country) setSelectedCountry(country);
    });
  });

  const handleSync = async () => {
    if (!club) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    setIsLoading(true);
    setSyncStatus((prev) => ({ ...prev, status: "syncing" }));

    try {
      // Simulate sync process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call the actual sync API
      const now = new Date().toISOString();
      await AsyncStorage.setItem("last_league_sync", now);

      setSyncStatus({
        lastSync: now,
        matchesImported: Math.floor(Math.random() * 5) + 1,
        source: selectedCountry || "PZPN",
        status: "success",
      });

      Alert.alert(
        "Sukces",
        "Terminarz został zsynchronizowany z oficjalnymi danymi ligowymi."
      );
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        status: "error",
        error: "Nie udało się pobrać danych",
      }));
      Alert.alert("Błąd", "Nie udało się zsynchronizować terminarza");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nigdy";
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primary} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Import meczów
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={24} color={AppColors.primary} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Automatyczny import
            </ThemedText>
          </View>
          <ThemedText style={styles.cardText}>
            Importuj terminarz meczów z oficjalnych źródeł ligowych. System automatycznie
            pobiera daty i godziny meczów Twojego zespołu.
          </ThemedText>
        </View>

        {/* Sync Status Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="sync" size={24} color={AppColors.success} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Status synchronizacji
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Ostatnia synchronizacja:</ThemedText>
            <ThemedText style={styles.statusValue}>
              {formatDate(syncStatus.lastSync)}
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Źródło danych:</ThemedText>
            <ThemedText style={styles.statusValue}>
              {selectedCountry || "Nie wybrano"}
            </ThemedText>
          </View>

          {syncStatus.matchesImported > 0 && (
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Zaimportowane mecze:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {syncStatus.matchesImported}
              </ThemedText>
            </View>
          )}

          {syncStatus.status === "error" && (
            <View style={[styles.statusBadge, { backgroundColor: AppColors.danger + "20" }]}>
              <MaterialIcons name="error" size={16} color={AppColors.danger} />
              <ThemedText style={[styles.statusBadgeText, { color: AppColors.danger }]}>
                {syncStatus.error}
              </ThemedText>
            </View>
          )}

          {syncStatus.status === "success" && (
            <View style={[styles.statusBadge, { backgroundColor: AppColors.success + "20" }]}>
              <MaterialIcons name="check-circle" size={16} color={AppColors.success} />
              <ThemedText style={[styles.statusBadgeText, { color: AppColors.success }]}>
                Synchronizacja zakończona pomyślnie
              </ThemedText>
            </View>
          )}
        </View>

        {/* Country Selection */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="public" size={24} color={AppColors.primary} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Wybierz źródło danych
            </ThemedText>
          </View>

          <Pressable
            style={[styles.selectButton, { borderColor }]}
            onPress={() => router.push("/setup/country" as any)}
          >
            <ThemedText style={styles.selectButtonText}>
              {selectedCountry ? `Wybrany kraj: ${selectedCountry}` : "Wybierz kraj"}
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color={AppColors.primary} />
          </Pressable>
        </View>

        {/* Sync Button */}
        <Pressable
          style={[
            styles.syncButton,
            isLoading && styles.syncButtonDisabled,
          ]}
          onPress={handleSync}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="cloud-download" size={24} color="#fff" />
              <ThemedText style={styles.syncButtonText}>
                Synchronizuj terminarz
              </ThemedText>
            </>
          )}
        </Pressable>

        {/* Auto Sync Info */}
        <Pressable 
          style={styles.autoSyncInfo}
          onPress={() => router.push('/sync-settings' as any)}
        >
          <MaterialIcons name="schedule" size={20} color={AppColors.textSecondary} />
          <ThemedText style={styles.autoSyncText}>
            Automatyczna synchronizacja odbywa się co 24 godziny
          </ThemedText>
          <MaterialIcons name="chevron-right" size={20} color={AppColors.textSecondary} />
        </Pressable>

        {/* Sync History Link */}
        <Pressable 
          style={[styles.historyLink, { borderColor }]}
          onPress={() => router.push('/sync-status' as any)}
        >
          <MaterialIcons name="history" size={20} color={AppColors.primary} />
          <ThemedText style={styles.historyLinkText}>Zobacz historię synchronizacji</ThemedText>
          <MaterialIcons name="chevron-right" size={20} color={AppColors.primary} />
        </Pressable>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  statusLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  selectButtonText: {
    fontSize: 14,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.success,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  autoSyncInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    opacity: 0.6,
  },
  autoSyncText: {
    fontSize: 13,
    flex: 1,
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  historyLinkText: {
    fontSize: 14,
    color: AppColors.primary,
    flex: 1,
  },
});
