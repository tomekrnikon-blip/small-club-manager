import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import {
  SMSStats,
  SMSHistoryItem,
  getSMSStats,
  getSMSHistory,
} from "@/lib/sms-user-service";

type TabType = 'overview' | 'history';

export default function SMSStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [history, setHistory] = useState<SMSHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sent' | 'failed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        getSMSStats(),
        getSMSHistory(),
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('[SMS Stats] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (historyFilter === 'all') return true;
    return item.status === historyFilter;
  });

  const getTypeLabel = (type: SMSHistoryItem['type']): string => {
    const labels: Record<SMSHistoryItem['type'], string> = {
      training_reminder: 'Przypomnienie o treningu',
      match_reminder: 'Przypomnienie o meczu',
      callup: 'Powołanie',
      attendance: 'Obecność',
      custom: 'Własna wiadomość',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: SMSHistoryItem['status']): string => {
    switch (status) {
      case 'sent': return '#22c55e';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const renderHistoryItem = ({ item }: { item: SMSHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <ThemedText style={styles.historyPhone}>{item.phone}</ThemedText>
        <ThemedText style={styles.historyTime}>
          {new Date(item.sentAt).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </ThemedText>
      </View>
      <ThemedText style={styles.historyType}>{getTypeLabel(item.type)}</ThemedText>
      <ThemedText style={styles.historyMessage} numberOfLines={2}>
        {item.message}
      </ThemedText>
      {item.error && (
        <ThemedText style={styles.historyError}>{item.error}</ThemedText>
      )}
      {item.cost !== undefined && item.cost > 0 && (
        <ThemedText style={styles.historyCost}>Koszt: {item.cost.toFixed(2)} pkt</ThemedText>
      )}
    </View>
  );

  if (isLoading) {
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
        <ThemedText style={styles.headerTitle}>Statystyki SMS</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Przegląd
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historia
          </ThemedText>
        </Pressable>
      </View>

      {activeTab === 'overview' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#22c55e20' }]}>
              <MaterialIcons name="check-circle" size={24} color="#22c55e" />
              <ThemedText style={styles.summaryValue}>{stats?.totalSent || 0}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Wysłane</ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#ef444420' }]}>
              <MaterialIcons name="error" size={24} color="#ef4444" />
              <ThemedText style={styles.summaryValue}>{stats?.totalFailed || 0}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Nieudane</ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#3b82f620' }]}>
              <MaterialIcons name="attach-money" size={24} color="#3b82f6" />
              <ThemedText style={styles.summaryValue}>{(stats?.totalCost || 0).toFixed(1)}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Punkty</ThemedText>
            </View>
          </View>

          {/* By Type */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Według typu</ThemedText>
            <View style={styles.typeList}>
              {Object.entries(stats?.byType || {}).map(([type, count]) => (
                <View key={type} style={styles.typeRow}>
                  <ThemedText style={styles.typeLabel}>
                    {getTypeLabel(type as SMSHistoryItem['type'])}
                  </ThemedText>
                  <ThemedText style={styles.typeValue}>{count}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Monthly Chart */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Miesięcznie</ThemedText>
            <View style={styles.chartContainer}>
              {(stats?.byMonth || []).slice(-6).map((month, index) => {
                const maxValue = Math.max(...(stats?.byMonth || []).map(m => m.sent + m.failed), 1);
                const height = ((month.sent + month.failed) / maxValue) * 100;
                return (
                  <View key={month.month} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${height}%`, backgroundColor: '#22c55e' },
                        ]}
                      />
                      {month.failed > 0 && (
                        <View
                          style={[
                            styles.barFailed,
                            { height: `${(month.failed / maxValue) * 100}%` },
                          ]}
                        />
                      )}
                    </View>
                    <ThemedText style={styles.barLabel}>
                      {month.month.substring(5)}
                    </ThemedText>
                    <ThemedText style={styles.barValue}>{month.sent}</ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Success Rate */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Skuteczność</ThemedText>
            <View style={styles.rateCard}>
              <View style={styles.rateCircle}>
                <ThemedText style={styles.rateValue}>
                  {stats && stats.totalSent + stats.totalFailed > 0
                    ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100)
                    : 0}%
                </ThemedText>
              </View>
              <ThemedText style={styles.rateLabel}>
                Procent dostarczonych wiadomości
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.historyContainer}>
          {/* Filters */}
          <View style={styles.filters}>
            {(['all', 'sent', 'failed'] as const).map((filter) => (
              <Pressable
                key={filter}
                style={[styles.filterBtn, historyFilter === filter && styles.filterBtnActive]}
                onPress={() => setHistoryFilter(filter)}
              >
                <ThemedText
                  style={[styles.filterText, historyFilter === filter && styles.filterTextActive]}
                >
                  {filter === 'all' ? 'Wszystkie' : filter === 'sent' ? 'Wysłane' : 'Nieudane'}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={filteredHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="sms" size={48} color="#64748b" />
                <ThemedText style={styles.emptyText}>Brak historii SMS</ThemedText>
              </View>
            }
          />
        </View>
      )}
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
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  tabText: {
    fontSize: 15,
    color: "#64748b",
  },
  tabTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
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
  typeList: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  typeLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  typeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 150,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    width: 24,
    height: 100,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
  },
  barFailed: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  barValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  rateCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  rateCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  rateValue: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.primary,
  },
  rateLabel: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  historyContainer: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
  },
  filterBtnActive: {
    backgroundColor: AppColors.primary,
  },
  filterText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  historyList: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  historyItem: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  historyPhone: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  historyTime: {
    fontSize: 12,
    color: "#64748b",
  },
  historyType: {
    fontSize: 12,
    color: AppColors.primary,
    marginBottom: Spacing.xs,
  },
  historyMessage: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  historyError: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: Spacing.xs,
  },
  historyCost: {
    fontSize: 12,
    color: "#22c55e",
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
});
