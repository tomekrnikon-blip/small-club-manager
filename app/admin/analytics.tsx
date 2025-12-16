import { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  const { data: stats, isLoading } = trpc.masterAdmin.getAnalytics.useQuery({ timeRange });
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };
  
  // Mock data for charts (in real app, this would come from API)
  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalClubs: 156,
    activeClubs: 134,
    proSubscriptions: 89,
    freeUsers: 1158,
    revenue: 4455.11,
    revenueGrowth: 12.5,
    newUsersToday: 23,
    newClubsToday: 5,
    matchesThisMonth: 342,
    trainingsThisMonth: 1256,
    userGrowth: [120, 145, 167, 189, 234, 278, 312],
    revenueHistory: [3200, 3450, 3890, 4100, 4320, 4455],
  };
  
  const data = stats || mockStats;
  
  const renderStatCard = (
    title: string, 
    value: string | number, 
    icon: string, 
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <ThemedText style={styles.statValue}>{value}</ThemedText>
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>}
      </View>
    </View>
  );
  
  const renderMiniChart = (data: number[], color: string) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <View style={styles.miniChart}>
        {data.map((value, index) => {
          const height = ((value - min) / range) * 40 + 10;
          return (
            <View
              key={index}
              style={[
                styles.miniChartBar,
                { height, backgroundColor: color },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Analityka</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <ThemedText style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive,
            ]}>
              {range === "7d" ? "7 dni" : range === "30d" ? "30 dni" : range === "90d" ? "90 dni" : "1 rok"}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Cards */}
          <ThemedText style={styles.sectionTitle}>Przegląd</ThemedText>
          <View style={styles.statsGrid}>
            {renderStatCard("Użytkownicy", formatNumber(data.totalUsers), "people", "#3b82f6", `${data.activeUsers} aktywnych`)}
            {renderStatCard("Kluby", formatNumber(data.totalClubs), "business", "#22c55e", `${data.activeClubs} aktywnych`)}
            {renderStatCard("Subskrypcje PRO", data.proSubscriptions, "star", "#f59e0b")}
            {renderStatCard("Przychód", formatCurrency(data.revenue), "cash", "#10b981", `+${data.revenueGrowth}%`)}
          </View>
          
          {/* User Growth Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartTitle}>Wzrost użytkowników</ThemedText>
              <View style={styles.chartBadge}>
                <Ionicons name="trending-up" size={16} color="#22c55e" />
                <ThemedText style={styles.chartBadgeText}>+{data.newUsersToday} dziś</ThemedText>
              </View>
            </View>
            {renderMiniChart(data.userGrowth, "#3b82f6")}
          </View>
          
          {/* Revenue Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartTitle}>Przychody (PLN)</ThemedText>
              <View style={styles.chartBadge}>
                <Ionicons name="trending-up" size={16} color="#22c55e" />
                <ThemedText style={styles.chartBadgeText}>+{data.revenueGrowth}%</ThemedText>
              </View>
            </View>
            {renderMiniChart(data.revenueHistory, "#10b981")}
          </View>
          
          {/* Activity Stats */}
          <ThemedText style={styles.sectionTitle}>Aktywność</ThemedText>
          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Ionicons name="football" size={32} color="#f59e0b" />
              <ThemedText style={styles.activityValue}>{data.matchesThisMonth}</ThemedText>
              <ThemedText style={styles.activityLabel}>Mecze</ThemedText>
            </View>
            <View style={styles.activityCard}>
              <Ionicons name="fitness" size={32} color="#8b5cf6" />
              <ThemedText style={styles.activityValue}>{data.trainingsThisMonth}</ThemedText>
              <ThemedText style={styles.activityLabel}>Treningi</ThemedText>
            </View>
            <View style={styles.activityCard}>
              <Ionicons name="add-circle" size={32} color="#22c55e" />
              <ThemedText style={styles.activityValue}>{data.newClubsToday}</ThemedText>
              <ThemedText style={styles.activityLabel}>Nowe kluby</ThemedText>
            </View>
          </View>
          
          {/* Subscription Distribution */}
          <ThemedText style={styles.sectionTitle}>Dystrybucja subskrypcji</ThemedText>
          <View style={styles.distributionCard}>
            <View style={styles.distributionRow}>
              <View style={styles.distributionLabel}>
                <View style={[styles.distributionDot, { backgroundColor: "#f59e0b" }]} />
                <ThemedText style={styles.distributionText}>PRO</ThemedText>
              </View>
              <ThemedText style={styles.distributionValue}>{data.proSubscriptions}</ThemedText>
            </View>
            <View style={styles.distributionBar}>
              <View 
                style={[
                  styles.distributionFill, 
                  { 
                    width: `${(data.proSubscriptions / data.totalUsers) * 100}%`,
                    backgroundColor: "#f59e0b" 
                  }
                ]} 
              />
            </View>
            
            <View style={[styles.distributionRow, { marginTop: 16 }]}>
              <View style={styles.distributionLabel}>
                <View style={[styles.distributionDot, { backgroundColor: "#6b7280" }]} />
                <ThemedText style={styles.distributionText}>Darmowe</ThemedText>
              </View>
              <ThemedText style={styles.distributionValue}>{data.freeUsers}</ThemedText>
            </View>
            <View style={styles.distributionBar}>
              <View 
                style={[
                  styles.distributionFill, 
                  { 
                    width: `${(data.freeUsers / data.totalUsers) * 100}%`,
                    backgroundColor: "#6b7280" 
                  }
                ]} 
              />
            </View>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  timeRangeContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#22c55e",
  },
  timeRangeText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  timeRangeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statTitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  statSubtitle: {
    color: "#22c55e",
    fontSize: 11,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "500",
  },
  miniChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 50,
    gap: 4,
  },
  miniChartBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 10,
  },
  activityGrid: {
    flexDirection: "row",
    gap: 12,
  },
  activityCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  activityValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  activityLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  distributionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  distributionText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  distributionValue: {
    fontWeight: "600",
  },
  distributionBar: {
    height: 8,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    borderRadius: 4,
  },
});
