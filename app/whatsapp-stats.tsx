import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WHATSAPP_STATS_KEY = 'whatsapp_message_stats';
const WHATSAPP_HISTORY_KEY = 'whatsapp_message_history';

export type MessageStats = {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  byType: {
    training_reminder: number;
    match_reminder: number;
    callup: number;
    attendance: number;
    custom: number;
  };
  byMonth: {
    month: string;
    sent: number;
    failed: number;
  }[];
};

export type MessageHistoryItem = {
  id: string;
  phone: string;
  message: string;
  type: 'training_reminder' | 'match_reminder' | 'callup' | 'attendance' | 'custom';
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
  messageId?: string;
};

// Helper functions to track messages
export async function trackWhatsAppMessage(
  phone: string,
  message: string,
  type: MessageHistoryItem['type'],
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> {
  try {
    // Update history
    const historyStr = await AsyncStorage.getItem(WHATSAPP_HISTORY_KEY);
    const history: MessageHistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
    
    history.unshift({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type,
      status,
      sentAt: new Date().toISOString(),
      messageId,
      error,
    });
    
    // Keep only last 500 messages
    const trimmedHistory = history.slice(0, 500);
    await AsyncStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    // Update stats
    const statsStr = await AsyncStorage.getItem(WHATSAPP_STATS_KEY);
    const stats: MessageStats = statsStr ? JSON.parse(statsStr) : {
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      byType: {
        training_reminder: 0,
        match_reminder: 0,
        callup: 0,
        attendance: 0,
        custom: 0,
      },
      byMonth: [],
    };
    
    if (status === 'sent') {
      stats.totalSent++;
      stats.byType[type]++;
    } else {
      stats.totalFailed++;
    }
    
    // Update monthly stats
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthIndex = stats.byMonth.findIndex(m => m.month === currentMonth);
    if (monthIndex >= 0) {
      if (status === 'sent') {
        stats.byMonth[monthIndex].sent++;
      } else {
        stats.byMonth[monthIndex].failed++;
      }
    } else {
      stats.byMonth.push({
        month: currentMonth,
        sent: status === 'sent' ? 1 : 0,
        failed: status === 'failed' ? 1 : 0,
      });
    }
    
    // Keep only last 12 months
    stats.byMonth = stats.byMonth.slice(-12);
    
    await AsyncStorage.setItem(WHATSAPP_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('[WhatsApp] Error tracking message:', error);
  }
}

export default function WhatsAppStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsStr, historyStr] = await Promise.all([
        AsyncStorage.getItem(WHATSAPP_STATS_KEY),
        AsyncStorage.getItem(WHATSAPP_HISTORY_KEY),
      ]);
      
      if (statsStr) {
        setStats(JSON.parse(statsStr));
      } else {
        setStats({
          totalSent: 0,
          totalFailed: 0,
          totalCost: 0,
          byType: {
            training_reminder: 0,
            match_reminder: 0,
            callup: 0,
            attendance: 0,
            custom: 0,
          },
          byMonth: [],
        });
      }
      
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      }
    } catch (error) {
      console.error('[WhatsApp] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: MessageHistoryItem['type']) => {
    const labels: Record<string, string> = {
      training_reminder: 'Trening',
      match_reminder: 'Mecz',
      callup: 'Powołanie',
      attendance: 'Obecność',
      custom: 'Własna',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: MessageHistoryItem['type']) => {
    const icons: Record<string, string> = {
      training_reminder: 'fitness-center',
      match_reminder: 'sports-soccer',
      callup: 'person-add',
      attendance: 'fact-check',
      custom: 'message',
    };
    return icons[type] || 'message';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const renderHistoryItem = ({ item }: { item: MessageHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <MaterialIcons 
          name={getTypeIcon(item.type) as any} 
          size={20} 
          color={item.status === 'sent' ? AppColors.primary : '#ef4444'} 
        />
      </View>
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <ThemedText style={styles.historyPhone}>{item.phone}</ThemedText>
          <View style={[
            styles.statusBadge,
            item.status === 'sent' ? styles.statusSent : styles.statusFailed,
          ]}>
            <ThemedText style={styles.statusText}>
              {item.status === 'sent' ? 'Wysłano' : 'Błąd'}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.historyMessage} numberOfLines={2}>
          {item.message}
        </ThemedText>
        <View style={styles.historyMeta}>
          <ThemedText style={styles.historyType}>{getTypeLabel(item.type)}</ThemedText>
          <ThemedText style={styles.historyDate}>{formatDate(item.sentAt)}</ThemedText>
        </View>
        {item.error && (
          <ThemedText style={styles.historyError}>{item.error}</ThemedText>
        )}
      </View>
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
        <ThemedText style={styles.headerTitle}>Statystyki WhatsApp</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Statystyki
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

      {activeTab === 'stats' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Overview Cards */}
          <View style={styles.overviewCards}>
            <View style={[styles.overviewCard, styles.cardSent]}>
              <MaterialIcons name="check-circle" size={24} color="#22c55e" />
              <ThemedText style={styles.overviewValue}>{stats?.totalSent || 0}</ThemedText>
              <ThemedText style={styles.overviewLabel}>Wysłanych</ThemedText>
            </View>
            <View style={[styles.overviewCard, styles.cardFailed]}>
              <MaterialIcons name="error" size={24} color="#ef4444" />
              <ThemedText style={styles.overviewValue}>{stats?.totalFailed || 0}</ThemedText>
              <ThemedText style={styles.overviewLabel}>Błędów</ThemedText>
            </View>
            <View style={[styles.overviewCard, styles.cardRate]}>
              <MaterialIcons name="percent" size={24} color="#60a5fa" />
              <ThemedText style={styles.overviewValue}>
                {stats && stats.totalSent + stats.totalFailed > 0
                  ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100)
                  : 0}%
              </ThemedText>
              <ThemedText style={styles.overviewLabel}>Skuteczność</ThemedText>
            </View>
          </View>

          {/* By Type */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Według typu</ThemedText>
            {stats && Object.entries(stats.byType).map(([type, count]) => (
              <View key={type} style={styles.typeRow}>
                <View style={styles.typeInfo}>
                  <MaterialIcons 
                    name={getTypeIcon(type as MessageHistoryItem['type']) as any} 
                    size={20} 
                    color="#64748b" 
                  />
                  <ThemedText style={styles.typeLabel}>
                    {getTypeLabel(type as MessageHistoryItem['type'])}
                  </ThemedText>
                </View>
                <ThemedText style={styles.typeCount}>{count}</ThemedText>
              </View>
            ))}
          </View>

          {/* Monthly Chart */}
          {stats && stats.byMonth.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Ostatnie miesiące</ThemedText>
              <View style={styles.chartContainer}>
                {stats.byMonth.slice(-6).map((month, index) => {
                  const maxValue = Math.max(...stats.byMonth.map(m => m.sent + m.failed), 1);
                  const height = ((month.sent + month.failed) / maxValue) * 100;
                  return (
                    <View key={month.month} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { height: `${height}%` },
                          ]}
                        >
                          {month.failed > 0 && (
                            <View 
                              style={[
                                styles.barFailed,
                                { height: `${(month.failed / (month.sent + month.failed)) * 100}%` },
                              ]} 
                            />
                          )}
                        </View>
                      </View>
                      <ThemedText style={styles.barLabel}>{formatMonth(month.month)}</ThemedText>
                      <ThemedText style={styles.barValue}>{month.sent + month.failed}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak historii wiadomości</ThemedText>
            </View>
          }
        />
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
  overviewCards: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  cardSent: {
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  cardFailed: {
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  cardRate: {
    borderLeftWidth: 3,
    borderLeftColor: "#60a5fa",
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: Spacing.xs,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#64748b",
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
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  typeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  typeCount: {
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
    height: 100,
    width: 24,
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: Radius.sm,
  },
  barFailed: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#ef4444",
  },
  barLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  historyList: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyPhone: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusSent: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  statusFailed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22c55e",
  },
  historyMessage: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: 4,
  },
  historyType: {
    fontSize: 12,
    color: "#64748b",
  },
  historyDate: {
    fontSize: 12,
    color: "#64748b",
  },
  historyError: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.md,
  },
});
