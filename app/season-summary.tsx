import { useRouter } from "expo-router";
import { useState } from "react";
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

interface SeasonData {
  season: string;
  matches: { played: number; won: number; drawn: number; lost: number };
  goals: { scored: number; conceded: number };
  attendance: { average: number; total: number };
  trainings: number;
  topScorer: { name: string; goals: number };
  topAssister: { name: string; assists: number };
  bestAttendance: { name: string; percent: number };
}

export default function SeasonSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedSeason, setSelectedSeason] = useState("2024/2025");

  const { data: clubs, isLoading: clubsLoading } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const seasons = ["2024/2025", "2023/2024", "2022/2023"];

  // Mock season data
  const seasonData: Record<string, SeasonData> = {
    "2024/2025": {
      season: "2024/2025",
      matches: { played: 12, won: 8, drawn: 2, lost: 2 },
      goals: { scored: 28, conceded: 12 },
      attendance: { average: 87, total: 156 },
      trainings: 42,
      topScorer: { name: "Jan Kowalski", goals: 9 },
      topAssister: { name: "Adam Nowak", assists: 6 },
      bestAttendance: { name: "Piotr Wiśniewski", percent: 98 },
    },
    "2023/2024": {
      season: "2023/2024",
      matches: { played: 24, won: 14, drawn: 5, lost: 5 },
      goals: { scored: 52, conceded: 28 },
      attendance: { average: 82, total: 312 },
      trainings: 86,
      topScorer: { name: "Adam Nowak", goals: 15 },
      topAssister: { name: "Jan Kowalski", assists: 11 },
      bestAttendance: { name: "Tomasz Zieliński", percent: 95 },
    },
    "2022/2023": {
      season: "2022/2023",
      matches: { played: 22, won: 10, drawn: 6, lost: 6 },
      goals: { scored: 38, conceded: 32 },
      attendance: { average: 78, total: 286 },
      trainings: 80,
      topScorer: { name: "Michał Lewandowski", goals: 12 },
      topAssister: { name: "Adam Nowak", assists: 8 },
      bestAttendance: { name: "Jan Kowalski", percent: 92 },
    },
  };

  const data = seasonData[selectedSeason];
  const prevData = selectedSeason === "2024/2025" ? seasonData["2023/2024"] : null;

  const calculateChange = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const winRate = data ? Math.round((data.matches.won / data.matches.played) * 100) : 0;
  const prevWinRate = prevData ? Math.round((prevData.matches.won / prevData.matches.played) * 100) : null;

  if (clubsLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Podsumowanie sezonu</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Season Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.seasonScroll}
          contentContainerStyle={styles.seasonContainer}
        >
          {seasons.map(season => (
            <Pressable
              key={season}
              style={[
                styles.seasonChip,
                selectedSeason === season && styles.seasonChipActive,
              ]}
              onPress={() => setSelectedSeason(season)}
            >
              <ThemedText style={[
                styles.seasonText,
                selectedSeason === season && styles.seasonTextActive,
              ]}>
                {season}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {data && (
          <>
            {/* Main Stats Card */}
            <View style={styles.mainCard}>
              <ThemedText style={styles.mainCardTitle}>Wyniki meczów</ThemedText>
              
              {/* Win Rate Circle */}
              <View style={styles.winRateContainer}>
                <View style={styles.winRateCircle}>
                  <ThemedText style={styles.winRateValue}>{winRate}%</ThemedText>
                  <ThemedText style={styles.winRateLabel}>skuteczność</ThemedText>
                </View>
                {prevWinRate !== null && (
                  <View style={[
                    styles.changeBadge,
                    winRate >= prevWinRate ? styles.changeBadgePositive : styles.changeBadgeNegative,
                  ]}>
                    <MaterialIcons 
                      name={winRate >= prevWinRate ? "trending-up" : "trending-down"} 
                      size={14} 
                      color={winRate >= prevWinRate ? "#22c55e" : "#ef4444"} 
                    />
                    <ThemedText style={[
                      styles.changeText,
                      { color: winRate >= prevWinRate ? "#22c55e" : "#ef4444" },
                    ]}>
                      {Math.abs(winRate - prevWinRate)}%
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Match Stats */}
              <View style={styles.matchStats}>
                <View style={styles.matchStatItem}>
                  <ThemedText style={styles.matchStatValue}>{data.matches.played}</ThemedText>
                  <ThemedText style={styles.matchStatLabel}>Mecze</ThemedText>
                </View>
                <View style={[styles.matchStatItem, styles.matchStatWon]}>
                  <ThemedText style={[styles.matchStatValue, { color: "#22c55e" }]}>{data.matches.won}</ThemedText>
                  <ThemedText style={styles.matchStatLabel}>Wygrane</ThemedText>
                </View>
                <View style={styles.matchStatItem}>
                  <ThemedText style={[styles.matchStatValue, { color: "#f59e0b" }]}>{data.matches.drawn}</ThemedText>
                  <ThemedText style={styles.matchStatLabel}>Remisy</ThemedText>
                </View>
                <View style={styles.matchStatItem}>
                  <ThemedText style={[styles.matchStatValue, { color: "#ef4444" }]}>{data.matches.lost}</ThemedText>
                  <ThemedText style={styles.matchStatLabel}>Przegrane</ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressSegment, styles.progressWon, { flex: data.matches.won }]} />
                <View style={[styles.progressSegment, styles.progressDrawn, { flex: data.matches.drawn }]} />
                <View style={[styles.progressSegment, styles.progressLost, { flex: data.matches.lost }]} />
              </View>
            </View>

            {/* Goals Card */}
            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                  <MaterialIcons name="sports-soccer" size={20} color="#22c55e" />
                  <ThemedText style={styles.statsCardTitle}>Bramki</ThemedText>
                </View>
                <View style={styles.goalsDisplay}>
                  <View style={styles.goalItem}>
                    <ThemedText style={[styles.goalValue, { color: "#22c55e" }]}>{data.goals.scored}</ThemedText>
                    <ThemedText style={styles.goalLabel}>strzelone</ThemedText>
                  </View>
                  <ThemedText style={styles.goalSeparator}>:</ThemedText>
                  <View style={styles.goalItem}>
                    <ThemedText style={[styles.goalValue, { color: "#ef4444" }]}>{data.goals.conceded}</ThemedText>
                    <ThemedText style={styles.goalLabel}>stracone</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.goalDiff}>
                  Bilans: {data.goals.scored - data.goals.conceded > 0 ? "+" : ""}{data.goals.scored - data.goals.conceded}
                </ThemedText>
              </View>

              <View style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                  <MaterialIcons name="fitness-center" size={20} color="#8b5cf6" />
                  <ThemedText style={styles.statsCardTitle}>Treningi</ThemedText>
                </View>
                <ThemedText style={styles.trainingValue}>{data.trainings}</ThemedText>
                <ThemedText style={styles.trainingLabel}>sesji treningowych</ThemedText>
                <View style={styles.attendanceBar}>
                  <View style={[styles.attendanceFill, { width: `${data.attendance.average}%` }]} />
                </View>
                <ThemedText style={styles.attendanceText}>
                  Śr. frekwencja: {data.attendance.average}%
                </ThemedText>
              </View>
            </View>

            {/* Top Performers */}
            <ThemedText style={styles.sectionTitle}>Najlepsi zawodnicy</ThemedText>
            
            <View style={styles.performersGrid}>
              <View style={styles.performerCard}>
                <View style={[styles.performerIcon, { backgroundColor: "#22c55e20" }]}>
                  <MaterialIcons name="sports-soccer" size={24} color="#22c55e" />
                </View>
                <ThemedText style={styles.performerTitle}>Król strzelców</ThemedText>
                <ThemedText style={styles.performerName}>{data.topScorer.name}</ThemedText>
                <ThemedText style={styles.performerStat}>{data.topScorer.goals} bramek</ThemedText>
              </View>

              <View style={styles.performerCard}>
                <View style={[styles.performerIcon, { backgroundColor: "#3b82f620" }]}>
                  <MaterialIcons name="sports" size={24} color="#3b82f6" />
                </View>
                <ThemedText style={styles.performerTitle}>Asystent</ThemedText>
                <ThemedText style={styles.performerName}>{data.topAssister.name}</ThemedText>
                <ThemedText style={styles.performerStat}>{data.topAssister.assists} asyst</ThemedText>
              </View>

              <View style={styles.performerCard}>
                <View style={[styles.performerIcon, { backgroundColor: "#f59e0b20" }]}>
                  <MaterialIcons name="emoji-events" size={24} color="#f59e0b" />
                </View>
                <ThemedText style={styles.performerTitle}>Frekwencja</ThemedText>
                <ThemedText style={styles.performerName}>{data.bestAttendance.name}</ThemedText>
                <ThemedText style={styles.performerStat}>{data.bestAttendance.percent}%</ThemedText>
              </View>
            </View>

            {/* Comparison with Previous Season */}
            {prevData && (
              <>
                <ThemedText style={styles.sectionTitle}>Porównanie z poprzednim sezonem</ThemedText>
                <View style={styles.comparisonCard}>
                  <ComparisonRow 
                    label="Wygrane mecze" 
                    current={data.matches.won} 
                    previous={prevData.matches.won} 
                    suffix=""
                  />
                  <ComparisonRow 
                    label="Bramki strzelone" 
                    current={data.goals.scored} 
                    previous={prevData.goals.scored} 
                    suffix=""
                  />
                  <ComparisonRow 
                    label="Średnia frekwencja" 
                    current={data.attendance.average} 
                    previous={prevData.attendance.average} 
                    suffix="%"
                  />
                  <ComparisonRow 
                    label="Sesje treningowe" 
                    current={data.trainings} 
                    previous={prevData.trainings} 
                    suffix=""
                  />
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function ComparisonRow({ label, current, previous, suffix }: { label: string; current: number; previous: number; suffix: string }) {
  const change = current - previous;
  const isPositive = change >= 0;

  return (
    <View style={styles.comparisonRow}>
      <ThemedText style={styles.comparisonLabel}>{label}</ThemedText>
      <View style={styles.comparisonValues}>
        <ThemedText style={styles.comparisonCurrent}>{current}{suffix}</ThemedText>
        <View style={[styles.comparisonChange, isPositive ? styles.changePositive : styles.changeNegative]}>
          <MaterialIcons 
            name={isPositive ? "arrow-upward" : "arrow-downward"} 
            size={12} 
            color={isPositive ? "#22c55e" : "#ef4444"} 
          />
          <ThemedText style={[styles.comparisonChangeText, { color: isPositive ? "#22c55e" : "#ef4444" }]}>
            {Math.abs(change)}{suffix}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  seasonScroll: {
    marginVertical: Spacing.lg,
  },
  seasonContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  seasonChip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  seasonChipActive: {
    backgroundColor: AppColors.primary,
  },
  seasonText: {
    fontSize: 14,
    color: "#64748b",
  },
  seasonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  mainCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  mainCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  winRateContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  winRateCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: AppColors.primary,
  },
  winRateValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  winRateLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  changeBadgePositive: {
    backgroundColor: "#22c55e20",
  },
  changeBadgeNegative: {
    backgroundColor: "#ef444420",
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  matchStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.md,
  },
  matchStatItem: {
    alignItems: "center",
  },
  matchStatWon: {},
  matchStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  matchStatLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  progressBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  progressSegment: {
    height: "100%",
  },
  progressWon: {
    backgroundColor: "#22c55e",
  },
  progressDrawn: {
    backgroundColor: "#f59e0b",
  },
  progressLost: {
    backgroundColor: "#ef4444",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  goalsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  goalItem: {
    alignItems: "center",
  },
  goalValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  goalLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  goalSeparator: {
    fontSize: 24,
    fontWeight: "700",
    color: "#64748b",
    marginHorizontal: Spacing.sm,
  },
  goalDiff: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  trainingValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  trainingLabel: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  attendanceBar: {
    height: 6,
    backgroundColor: "#0f172a",
    borderRadius: 3,
    marginBottom: 4,
  },
  attendanceFill: {
    height: "100%",
    backgroundColor: "#8b5cf6",
    borderRadius: 3,
  },
  attendanceText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  performersGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  performerCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: "center",
  },
  performerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  performerTitle: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  performerName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
  },
  performerStat: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: "600",
  },
  comparisonCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  comparisonLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  comparisonValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  comparisonCurrent: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  comparisonChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  changePositive: {
    backgroundColor: "#22c55e20",
  },
  changeNegative: {
    backgroundColor: "#ef444420",
  },
  comparisonChangeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
