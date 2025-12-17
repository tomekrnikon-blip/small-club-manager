import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
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

interface SyncHistoryItem {
  id: string;
  timestamp: string;
  source: string;
  matchesImported: number;
  matchesUpdated: number;
  status: "success" | "partial" | "error";
  errorMessage?: string;
}

const SYNC_HISTORY_KEY = "@sync_history";

export default function SyncStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        // Demo data for display
        setHistory([
          {
            id: "1",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            source: "PZPN - Wielkopolski ZPN",
            matchesImported: 3,
            matchesUpdated: 1,
            status: "success",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            source: "PZPN - Wielkopolski ZPN",
            matchesImported: 5,
            matchesUpdated: 0,
            status: "success",
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            source: "PZPN - Wielkopolski ZPN",
            matchesImported: 0,
            matchesUpdated: 2,
            status: "partial",
            errorMessage: "Nie udało się pobrać wszystkich danych",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load sync history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: SyncHistoryItem["status"]) => {
    switch (status) {
      case "success":
        return AppColors.success;
      case "partial":
        return AppColors.warning;
      case "error":
        return AppColors.danger;
    }
  };

  const getStatusIcon = (status: SyncHistoryItem["status"]) => {
    switch (status) {
      case "success":
        return "check-circle";
      case "partial":
        return "warning";
      case "error":
        return "error";
    }
  };

  const getStatusText = (status: SyncHistoryItem["status"]) => {
    switch (status) {
      case "success":
        return "Sukces";
      case "partial":
        return "Częściowy";
      case "error":
        return "Błąd";
    }
  };

  const renderHistoryItem = ({ item }: { item: SyncHistoryItem }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.historyHeader}>
          <View style={styles.historyStatus}>
            <MaterialIcons
              name={getStatusIcon(item.status)}
              size={20}
              color={statusColor}
            />
            <ThemedText style={[styles.historyStatusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
          <ThemedText style={styles.historyDate}>{formatDate(item.timestamp)}</ThemedText>
        </View>

        <ThemedText style={styles.historySource}>{item.source}</ThemedText>

        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <MaterialIcons name="add-circle" size={16} color={AppColors.success} />
            <ThemedText style={styles.historyStatText}>
              {item.matchesImported} nowych
            </ThemedText>
          </View>
          <View style={styles.historyStat}>
            <MaterialIcons name="update" size={16} color={AppColors.primary} />
            <ThemedText style={styles.historyStatText}>
              {item.matchesUpdated} zaktualizowanych
            </ThemedText>
          </View>
        </View>

        {item.errorMessage && (
          <View style={[styles.errorBadge, { backgroundColor: AppColors.danger + "15" }]}>
            <ThemedText style={[styles.errorText, { color: AppColors.danger }]}>
              {item.errorMessage}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  // Calculate summary stats
  const totalImported = history.reduce((sum, h) => sum + h.matchesImported, 0);
  const totalUpdated = history.reduce((sum, h) => sum + h.matchesUpdated, 0);
  const successRate = history.length > 0
    ? Math.round((history.filter((h) => h.status === "success").length / history.length) * 100)
    : 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primary} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Status synchronizacji
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: AppColors.success + "15" }]}>
          <ThemedText style={[styles.summaryValue, { color: AppColors.success }]}>
            {totalImported}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Zaimportowane</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: AppColors.primary + "15" }]}>
          <ThemedText style={[styles.summaryValue, { color: AppColors.primary }]}>
            {totalUpdated}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Zaktualizowane</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: AppColors.warning + "15" }]}>
          <ThemedText style={[styles.summaryValue, { color: AppColors.warning }]}>
            {successRate}%
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Sukces</ThemedText>
        </View>
      </View>

      {/* History List */}
      <View style={styles.historySection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Historia synchronizacji
        </ThemedText>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color={AppColors.textSecondary} />
              <ThemedText style={styles.emptyText}>
                Brak historii synchronizacji
              </ThemedText>
            </View>
          }
        />
      </View>
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
  summaryContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  historySection: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  historyCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  historyStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  historySource: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  historyStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  historyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyStatText: {
    fontSize: 13,
    opacity: 0.7,
  },
  errorBadge: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: Spacing.sm,
  },
});
