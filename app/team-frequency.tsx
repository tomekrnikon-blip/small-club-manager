import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
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
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type PeriodFilter = "week" | "month" | "quarter" | "year" | "all";

export default function TeamFrequencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [period, setPeriod] = useState<PeriodFilter>("month");

  const { data: clubs, isLoading: clubsLoading } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: teams, isLoading: teamsLoading } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: trainings, isLoading: trainingsLoading } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches, isLoading: matchesLoading } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const isLoading = clubsLoading || teamsLoading || trainingsLoading || matchesLoading;

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        start.setFullYear(2000);
        break;
    }
    
    return { start, end: now };
  }, [period]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!teams || !trainings || !matches) return [];

    return teams.map(team => {
      // Filter trainings for this team within date range
      const teamTrainings = trainings.filter(t => {
        const date = new Date(t.trainingDate);
        return t.teamId === team.id && date >= dateRange.start && date <= dateRange.end;
      });

      // Filter matches for this team within date range
      const teamMatches = matches.filter(m => {
        const date = new Date(m.matchDate);
        return m.teamId === team.id && date >= dateRange.start && date <= dateRange.end;
      });

      // Calculate average attendance (mock data for now)
      const trainingAttendance = teamTrainings.length > 0 
        ? Math.round(70 + Math.random() * 25) // Mock: 70-95%
        : 0;
      
      const matchAttendance = teamMatches.length > 0
        ? Math.round(80 + Math.random() * 18) // Mock: 80-98%
        : 0;

      return {
        id: team.id,
        name: team.name,
        category: team.ageGroup || "Nieznana",
        trainingCount: teamTrainings.length,
        matchCount: teamMatches.length,
        trainingAttendance,
        matchAttendance,
        overallAttendance: Math.round((trainingAttendance + matchAttendance) / 2),
      };
    }).sort((a, b) => b.overallAttendance - a.overallAttendance);
  }, [teams, trainings, matches, dateRange]);

  // Find max values for chart scaling
  const maxAttendance = 100;
  const maxEvents = Math.max(
    ...teamStats.map(t => Math.max(t.trainingCount, t.matchCount)),
    1
  );

  const periodLabels: Record<PeriodFilter, string> = {
    week: "Tydzień",
    month: "Miesiąc",
    quarter: "Kwartał",
    year: "Rok",
    all: "Wszystko",
  };

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
        <ThemedText style={styles.headerTitle}>Porównanie frekwencji</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Period Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["week", "month", "quarter", "year", "all"] as PeriodFilter[]).map((p) => (
              <Pressable
                key={p}
                style={[styles.filterChip, period === p && styles.filterChipActive]}
                onPress={() => setPeriod(p)}
              >
                <ThemedText
                  style={[styles.filterChipText, period === p && styles.filterChipTextActive]}
                >
                  {periodLabels[p]}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="groups" size={24} color={AppColors.primary} />
            <ThemedText style={styles.summaryValue}>{teamStats.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Zespołów</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="fitness-center" size={24} color="#22c55e" />
            <ThemedText style={styles.summaryValue}>
              {teamStats.reduce((sum, t) => sum + t.trainingCount, 0)}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Treningów</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="sports-soccer" size={24} color="#f59e0b" />
            <ThemedText style={styles.summaryValue}>
              {teamStats.reduce((sum, t) => sum + t.matchCount, 0)}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Meczów</ThemedText>
          </View>
        </View>

        {/* Chart Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
            <ThemedText style={styles.legendText}>Treningi</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
            <ThemedText style={styles.legendText}>Mecze</ThemedText>
          </View>
        </View>

        {/* Team Comparison Chart */}
        <View style={styles.chartSection}>
          <ThemedText style={styles.sectionTitle}>Frekwencja wg zespołu</ThemedText>
          
          {teamStats.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="bar-chart" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak danych do wyświetlenia</ThemedText>
            </View>
          ) : (
            teamStats.map((team, index) => (
              <View key={team.id} style={styles.teamRow}>
                <View style={styles.teamInfo}>
                  <View style={styles.rankBadge}>
                    <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.teamName}>{team.name}</ThemedText>
                    <ThemedText style={styles.teamCategory}>{team.category}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.barsContainer}>
                  {/* Training bar */}
                  <View style={styles.barRow}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          styles.trainingBar,
                          { width: `${team.trainingAttendance}%` },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.barValue}>{team.trainingAttendance}%</ThemedText>
                  </View>
                  
                  {/* Match bar */}
                  <View style={styles.barRow}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          styles.matchBar,
                          { width: `${team.matchAttendance}%` },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.barValue}>{team.matchAttendance}%</ThemedText>
                  </View>
                </View>

                <View style={styles.eventsInfo}>
                  <ThemedText style={styles.eventsText}>
                    {team.trainingCount}T / {team.matchCount}M
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Overall Stats */}
        {teamStats.length > 0 && (
          <View style={styles.overallSection}>
            <ThemedText style={styles.sectionTitle}>Średnia klubowa</ThemedText>
            
            <View style={styles.overallRow}>
              <View style={styles.overallItem}>
                <ThemedText style={styles.overallLabel}>Treningi</ThemedText>
                <ThemedText style={[styles.overallValue, { color: "#22c55e" }]}>
                  {Math.round(
                    teamStats.reduce((sum, t) => sum + t.trainingAttendance, 0) / teamStats.length
                  )}%
                </ThemedText>
              </View>
              <View style={styles.overallDivider} />
              <View style={styles.overallItem}>
                <ThemedText style={styles.overallLabel}>Mecze</ThemedText>
                <ThemedText style={[styles.overallValue, { color: "#f59e0b" }]}>
                  {Math.round(
                    teamStats.reduce((sum, t) => sum + t.matchAttendance, 0) / teamStats.length
                  )}%
                </ThemedText>
              </View>
              <View style={styles.overallDivider} />
              <View style={styles.overallItem}>
                <ThemedText style={styles.overallLabel}>Ogółem</ThemedText>
                <ThemedText style={[styles.overallValue, { color: AppColors.primary }]}>
                  {Math.round(
                    teamStats.reduce((sum, t) => sum + t.overallAttendance, 0) / teamStats.length
                  )}%
                </ThemedText>
              </View>
            </View>
          </View>
        )}
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
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  chartSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: 100,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  teamCategory: {
    fontSize: 11,
    color: "#64748b",
  },
  barsContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    gap: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  trainingBar: {
    backgroundColor: "#22c55e",
  },
  matchBar: {
    backgroundColor: "#f59e0b",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    width: 35,
    textAlign: "right",
  },
  eventsInfo: {
    width: 50,
    alignItems: "flex-end",
  },
  eventsText: {
    fontSize: 11,
    color: "#64748b",
  },
  overallSection: {
    backgroundColor: "#1e293b",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  overallRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  overallItem: {
    flex: 1,
    alignItems: "center",
  },
  overallLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: Spacing.xs,
  },
  overallValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  overallDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#334155",
  },
});
