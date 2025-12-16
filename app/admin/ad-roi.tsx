import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TimeRange = "7d" | "30d" | "90d" | "all";

type AdPerformance = {
  id: string;
  name: string;
  sponsor: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  cost: number;
  roi: number;
  conversions: number;
  conversionRate: number;
};

type DailyStats = {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
};

// Mock data
const MOCK_ADS: AdPerformance[] = [
  {
    id: "ad_1",
    name: "Sklep sportowy - promocja",
    sponsor: "SportMax",
    impressions: 12500,
    clicks: 875,
    ctr: 7.0,
    revenue: 1250,
    cost: 500,
    roi: 150,
    conversions: 42,
    conversionRate: 4.8,
  },
  {
    id: "ad_2",
    name: "Obozy letnie 2025",
    sponsor: "CampSport",
    impressions: 8200,
    clicks: 492,
    ctr: 6.0,
    revenue: 820,
    cost: 300,
    roi: 173,
    conversions: 28,
    conversionRate: 5.7,
  },
  {
    id: "ad_3",
    name: "Ubezpieczenia sportowe",
    sponsor: "SafePlay",
    impressions: 5600,
    clicks: 224,
    ctr: 4.0,
    revenue: 560,
    cost: 400,
    roi: 40,
    conversions: 12,
    conversionRate: 5.4,
  },
  {
    id: "ad_4",
    name: "Sprzęt treningowy",
    sponsor: "FitGear",
    impressions: 9800,
    clicks: 588,
    ctr: 6.0,
    revenue: 980,
    cost: 350,
    roi: 180,
    conversions: 35,
    conversionRate: 6.0,
  },
];

const generateDailyStats = (days: number): DailyStats[] => {
  const stats: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    stats.push({
      date: date.toISOString().split("T")[0],
      impressions: Math.floor(Math.random() * 2000) + 500,
      clicks: Math.floor(Math.random() * 150) + 30,
      revenue: Math.floor(Math.random() * 200) + 50,
    });
  }
  return stats;
};

export default function AdROIScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [ads] = useState<AdPerformance[]>(MOCK_ADS);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
      setDailyStats(generateDailyStats(days));
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return ads.reduce(
      (acc, ad) => ({
        impressions: acc.impressions + ad.impressions,
        clicks: acc.clicks + ad.clicks,
        revenue: acc.revenue + ad.revenue,
        cost: acc.cost + ad.cost,
        conversions: acc.conversions + ad.conversions,
      }),
      { impressions: 0, clicks: 0, revenue: 0, cost: 0, conversions: 0 }
    );
  }, [ads]);

  const totalROI = totals.cost > 0 ? ((totals.revenue - totals.cost) / totals.cost) * 100 : 0;
  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const chartData = useMemo(() => {
    if (dailyStats.length === 0) return { maxRevenue: 0, bars: [] };
    const maxRevenue = Math.max(...dailyStats.map((s) => s.revenue));
    return {
      maxRevenue,
      bars: dailyStats.map((s) => ({
        ...s,
        height: maxRevenue > 0 ? (s.revenue / maxRevenue) * 100 : 0,
      })),
    };
  }, [dailyStats]);

  const formatCurrency = (value: number) => `${value.toLocaleString()} zł`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  if (!isAuthenticated || !user?.isMasterAdmin) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="lock" size={48} color="#64748b" />
        <ThemedText style={styles.emptyText}>
          Brak dostępu - wymagane uprawnienia Master Admin
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
        <ThemedText style={styles.headerTitle}>ROI Reklam</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            style={[styles.timeRangeBtn, timeRange === range && styles.timeRangeBtnActive]}
            onPress={() => setTimeRange(range)}
          >
            <ThemedText
              style={[
                styles.timeRangeBtnText,
                timeRange === range && styles.timeRangeBtnTextActive,
              ]}
            >
              {range === "7d" ? "7 dni" : range === "30d" ? "30 dni" : range === "90d" ? "90 dni" : "Wszystko"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.summaryCardLarge]}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="trending-up" size={24} color={AppColors.success} />
                <ThemedText style={styles.summaryLabel}>Całkowity ROI</ThemedText>
              </View>
              <ThemedText style={[styles.summaryValue, { color: totalROI >= 0 ? AppColors.success : AppColors.danger }]}>
                {totalROI >= 0 ? "+" : ""}{formatPercent(totalROI)}
              </ThemedText>
              <ThemedText style={styles.summarySubtext}>
                Przychód: {formatCurrency(totals.revenue)} | Koszt: {formatCurrency(totals.cost)}
              </ThemedText>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Wyświetlenia</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatNumber(totals.impressions)}</ThemedText>
              </View>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Kliknięcia</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatNumber(totals.clicks)}</ThemedText>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Śr. CTR</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatPercent(avgCTR)}</ThemedText>
              </View>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Konwersje</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatNumber(totals.conversions)}</ThemedText>
              </View>
            </View>
          </View>

          {/* Revenue Chart */}
          <View style={styles.chartSection}>
            <ThemedText style={styles.sectionTitle}>Przychód w czasie</ThemedText>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {chartData.bars.slice(-14).map((bar, index) => (
                  <View key={index} style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        { height: `${bar.height}%`, backgroundColor: AppColors.primary },
                      ]}
                    />
                    {index % 2 === 0 && (
                      <ThemedText style={styles.chartLabel}>
                        {new Date(bar.date).getDate()}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Top Performing Ads */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Najlepsze reklamy (wg ROI)</ThemedText>
            {[...ads]
              .sort((a, b) => b.roi - a.roi)
              .map((ad, index) => (
                <View key={ad.id} style={styles.adCard}>
                  <View style={styles.adRank}>
                    <ThemedText style={styles.adRankText}>#{index + 1}</ThemedText>
                  </View>
                  <View style={styles.adInfo}>
                    <ThemedText style={styles.adName}>{ad.name}</ThemedText>
                    <ThemedText style={styles.adSponsor}>{ad.sponsor}</ThemedText>
                  </View>
                  <View style={styles.adStats}>
                    <View style={styles.adStatRow}>
                      <ThemedText style={styles.adStatLabel}>ROI</ThemedText>
                      <ThemedText
                        style={[
                          styles.adStatValue,
                          { color: ad.roi >= 100 ? AppColors.success : ad.roi >= 50 ? AppColors.warning : AppColors.danger },
                        ]}
                      >
                        +{formatPercent(ad.roi)}
                      </ThemedText>
                    </View>
                    <View style={styles.adStatRow}>
                      <ThemedText style={styles.adStatLabel}>Przychód</ThemedText>
                      <ThemedText style={styles.adStatValue}>{formatCurrency(ad.revenue)}</ThemedText>
                    </View>
                    <View style={styles.adStatRow}>
                      <ThemedText style={styles.adStatLabel}>CTR</ThemedText>
                      <ThemedText style={styles.adStatValue}>{formatPercent(ad.ctr)}</ThemedText>
                    </View>
                    <View style={styles.adStatRow}>
                      <ThemedText style={styles.adStatLabel}>Konwersje</ThemedText>
                      <ThemedText style={styles.adStatValue}>{ad.conversions}</ThemedText>
                    </View>
                  </View>
                </View>
              ))}
          </View>

          {/* ROI Breakdown */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Analiza kosztów</ThemedText>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Całkowity przychód</ThemedText>
                  <ThemedText style={[styles.breakdownValue, { color: AppColors.success }]}>
                    {formatCurrency(totals.revenue)}
                  </ThemedText>
                </View>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Całkowity koszt</ThemedText>
                  <ThemedText style={[styles.breakdownValue, { color: AppColors.danger }]}>
                    {formatCurrency(totals.cost)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Zysk netto</ThemedText>
                  <ThemedText
                    style={[
                      styles.breakdownValue,
                      { color: totals.revenue - totals.cost >= 0 ? AppColors.success : AppColors.danger },
                    ]}
                  >
                    {formatCurrency(totals.revenue - totals.cost)}
                  </ThemedText>
                </View>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Koszt/kliknięcie</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    {totals.clicks > 0 ? formatCurrency(Math.round(totals.cost / totals.clicks * 100) / 100) : "0 zł"}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Przychód/konwersję</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    {totals.conversions > 0 ? formatCurrency(Math.round(totals.revenue / totals.conversions)) : "0 zł"}
                  </ThemedText>
                </View>
                <View style={styles.breakdownItem}>
                  <ThemedText style={styles.breakdownLabel}>Koszt/konwersję</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    {totals.conversions > 0 ? formatCurrency(Math.round(totals.cost / totals.conversions)) : "0 zł"}
                  </ThemedText>
                </View>
              </View>
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
    backgroundColor: AppColors.bgDark,
  },
  centered: {
    flex: 1,
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
  timeRangeContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    alignItems: "center",
  },
  timeRangeBtnActive: {
    backgroundColor: AppColors.primary,
  },
  timeRangeBtnText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  timeRangeBtnTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  summaryGrid: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  summaryCardLarge: {
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  summarySubtext: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 4,
  },
  chartSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  chartContainer: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    height: 180,
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "60%",
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  adCard: {
    flexDirection: "row",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  adRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  adRankText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  adInfo: {
    flex: 1,
    justifyContent: "center",
  },
  adName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
  adSponsor: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  adStats: {
    alignItems: "flex-end",
  },
  adStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  adStatLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
  },
  adStatValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#fff",
    minWidth: 60,
    textAlign: "right",
  },
  breakdownCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748b",
    marginTop: Spacing.md,
  },
});
