import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'overview' | 'scorers' | 'attendance' | 'results';

export default function TeamStatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: teams, isLoading: loadingTeams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: trainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Calculate statistics
  const stats = useMemo(() => {
    if (!matches || !players || !trainings) return null;

    const teamMatches = selectedTeamId 
      ? matches.filter((m: any) => m.teamId === selectedTeamId)
      : matches;

    const wins = teamMatches.filter((m: any) => m.result === 'win').length;
    const draws = teamMatches.filter((m: any) => m.result === 'draw').length;
    const losses = teamMatches.filter((m: any) => m.result === 'loss').length;
    const totalMatches = wins + draws + losses;

    const goalsScored = teamMatches.reduce((sum: number, m: any) => sum + (m.goalsScored || 0), 0);
    const goalsConceded = teamMatches.reduce((sum: number, m: any) => sum + (m.goalsConceded || 0), 0);

    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const avgGoalsScored = totalMatches > 0 ? (goalsScored / totalMatches).toFixed(1) : '0';
    const avgGoalsConceded = totalMatches > 0 ? (goalsConceded / totalMatches).toFixed(1) : '0';

    return {
      totalMatches,
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      winRate,
      avgGoalsScored,
      avgGoalsConceded,
      totalTrainings: trainings.length,
      totalPlayers: players.length,
    };
  }, [matches, players, trainings, selectedTeamId]);

  // Top scorers
  const topScorers = useMemo(() => {
    if (!players) return [];
    
    // Mock data - in real app would come from matchStats
    return players
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        goals: Math.floor(Math.random() * 15),
        assists: Math.floor(Math.random() * 10),
        matches: Math.floor(Math.random() * 20) + 5,
      }))
      .sort((a: any, b: any) => b.goals - a.goals)
      .slice(0, 10);
  }, [players]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    if (!players) return [];
    
    return players
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        trainingRate: Math.floor(Math.random() * 30) + 70,
        matchRate: Math.floor(Math.random() * 20) + 80,
      }))
      .sort((a: any, b: any) => b.trainingRate - a.trainingRate)
      .slice(0, 10);
  }, [players]);

  // Recent results
  const recentResults = useMemo(() => {
    if (!matches) return [];
    
    return matches
      .filter((m: any) => m.result)
      .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 10);
  }, [matches]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'overview', label: 'Przegląd', icon: 'dashboard' },
    { key: 'scorers', label: 'Strzelcy', icon: 'sports-soccer' },
    { key: 'attendance', label: 'Frekwencja', icon: 'how-to-reg' },
    { key: 'results', label: 'Wyniki', icon: 'emoji-events' },
  ];

  if (loadingTeams) {
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
        <ThemedText style={styles.headerTitle}>Statystyki drużyny</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Team Selector */}
      {teams && teams.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.teamSelector}
          contentContainerStyle={styles.teamSelectorContent}
        >
          <Pressable
            style={[styles.teamChip, !selectedTeamId && styles.teamChipActive]}
            onPress={() => setSelectedTeamId(null)}
          >
            <ThemedText style={[styles.teamChipText, !selectedTeamId && styles.teamChipTextActive]}>
              Wszystkie
            </ThemedText>
          </Pressable>
          {teams.map((team: any) => (
            <Pressable
              key={team.id}
              style={[styles.teamChip, selectedTeamId === team.id && styles.teamChipActive]}
              onPress={() => setSelectedTeamId(team.id)}
            >
              <ThemedText style={[styles.teamChipText, selectedTeamId === team.id && styles.teamChipTextActive]}>
                {team.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.key ? AppColors.primary : '#64748b'} 
            />
            <ThemedText style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && stats && (
          <View>
            {/* Key Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.totalMatches}</ThemedText>
                <ThemedText style={styles.statLabel}>Mecze</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={[styles.statValue, { color: '#22c55e' }]}>{stats.wins}</ThemedText>
                <ThemedText style={styles.statLabel}>Wygrane</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={[styles.statValue, { color: '#f59e0b' }]}>{stats.draws}</ThemedText>
                <ThemedText style={styles.statLabel}>Remisy</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>{stats.losses}</ThemedText>
                <ThemedText style={styles.statLabel}>Porażki</ThemedText>
              </View>
            </View>

            {/* Win Rate Bar */}
            <View style={styles.winRateCard}>
              <View style={styles.winRateHeader}>
                <ThemedText style={styles.winRateTitle}>Skuteczność</ThemedText>
                <ThemedText style={styles.winRateValue}>{stats.winRate}%</ThemedText>
              </View>
              <View style={styles.winRateBar}>
                <View style={[styles.winRateFill, { width: `${stats.winRate}%` }]} />
              </View>
              <View style={styles.winRateBreakdown}>
                <View style={styles.winRateItem}>
                  <View style={[styles.winRateDot, { backgroundColor: '#22c55e' }]} />
                  <ThemedText style={styles.winRateItemText}>
                    Wygrane: {stats.wins}
                  </ThemedText>
                </View>
                <View style={styles.winRateItem}>
                  <View style={[styles.winRateDot, { backgroundColor: '#f59e0b' }]} />
                  <ThemedText style={styles.winRateItemText}>
                    Remisy: {stats.draws}
                  </ThemedText>
                </View>
                <View style={styles.winRateItem}>
                  <View style={[styles.winRateDot, { backgroundColor: '#ef4444' }]} />
                  <ThemedText style={styles.winRateItemText}>
                    Porażki: {stats.losses}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Goals Stats */}
            <View style={styles.goalsCard}>
              <ThemedText style={styles.cardTitle}>Bramki</ThemedText>
              <View style={styles.goalsRow}>
                <View style={styles.goalsStat}>
                  <MaterialIcons name="sports-soccer" size={24} color="#22c55e" />
                  <ThemedText style={styles.goalsValue}>{stats.goalsScored}</ThemedText>
                  <ThemedText style={styles.goalsLabel}>Strzelone</ThemedText>
                </View>
                <View style={styles.goalsDivider} />
                <View style={styles.goalsStat}>
                  <MaterialIcons name="sports-soccer" size={24} color="#ef4444" />
                  <ThemedText style={styles.goalsValue}>{stats.goalsConceded}</ThemedText>
                  <ThemedText style={styles.goalsLabel}>Stracone</ThemedText>
                </View>
                <View style={styles.goalsDivider} />
                <View style={styles.goalsStat}>
                  <MaterialIcons name="trending-up" size={24} color={stats.goalDifference >= 0 ? '#22c55e' : '#ef4444'} />
                  <ThemedText style={[styles.goalsValue, { color: stats.goalDifference >= 0 ? '#22c55e' : '#ef4444' }]}>
                    {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                  </ThemedText>
                  <ThemedText style={styles.goalsLabel}>Bilans</ThemedText>
                </View>
              </View>
              <View style={styles.goalsAvg}>
                <ThemedText style={styles.goalsAvgText}>
                  Średnio na mecz: {stats.avgGoalsScored} strzelonych / {stats.avgGoalsConceded} straconych
                </ThemedText>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <MaterialIcons name="fitness-center" size={20} color="#64748b" />
                <ThemedText style={styles.quickStatValue}>{stats.totalTrainings}</ThemedText>
                <ThemedText style={styles.quickStatLabel}>Treningów</ThemedText>
              </View>
              <View style={styles.quickStatItem}>
                <MaterialIcons name="groups" size={20} color="#64748b" />
                <ThemedText style={styles.quickStatValue}>{stats.totalPlayers}</ThemedText>
                <ThemedText style={styles.quickStatLabel}>Zawodników</ThemedText>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'scorers' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Najlepsi strzelcy</ThemedText>
            {topScorers.map((player: any, index: number) => (
              <View key={player.id} style={styles.scorerCard}>
                <View style={[styles.scorerRank, index < 3 && styles.scorerRankTop]}>
                  <ThemedText style={[styles.scorerRankText, index < 3 && styles.scorerRankTextTop]}>
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={styles.scorerInfo}>
                  <ThemedText style={styles.scorerName}>{player.name}</ThemedText>
                  <ThemedText style={styles.scorerPosition}>{player.position}</ThemedText>
                </View>
                <View style={styles.scorerStats}>
                  <View style={styles.scorerStatItem}>
                    <ThemedText style={styles.scorerStatValue}>{player.goals}</ThemedText>
                    <ThemedText style={styles.scorerStatLabel}>Gole</ThemedText>
                  </View>
                  <View style={styles.scorerStatItem}>
                    <ThemedText style={styles.scorerStatValue}>{player.assists}</ThemedText>
                    <ThemedText style={styles.scorerStatLabel}>Asysty</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Ranking frekwencji</ThemedText>
            {attendanceStats.map((player: any, index: number) => (
              <View key={player.id} style={styles.attendanceCard}>
                <View style={styles.attendanceRank}>
                  <ThemedText style={styles.attendanceRankText}>{index + 1}</ThemedText>
                </View>
                <View style={styles.attendanceInfo}>
                  <ThemedText style={styles.attendanceName}>{player.name}</ThemedText>
                  <View style={styles.attendanceBars}>
                    <View style={styles.attendanceBarRow}>
                      <ThemedText style={styles.attendanceBarLabel}>Treningi</ThemedText>
                      <View style={styles.attendanceBarBg}>
                        <View style={[styles.attendanceBarFill, { width: `${player.trainingRate}%`, backgroundColor: '#22c55e' }]} />
                      </View>
                      <ThemedText style={styles.attendanceBarValue}>{player.trainingRate}%</ThemedText>
                    </View>
                    <View style={styles.attendanceBarRow}>
                      <ThemedText style={styles.attendanceBarLabel}>Mecze</ThemedText>
                      <View style={styles.attendanceBarBg}>
                        <View style={[styles.attendanceBarFill, { width: `${player.matchRate}%`, backgroundColor: '#a855f7' }]} />
                      </View>
                      <ThemedText style={styles.attendanceBarValue}>{player.matchRate}%</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'results' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Ostatnie wyniki</ThemedText>
            {recentResults.map((match: any) => (
              <View key={match.id} style={styles.resultCard}>
                <View style={[
                  styles.resultIndicator,
                  { backgroundColor: match.result === 'win' ? '#22c55e' : match.result === 'draw' ? '#f59e0b' : '#ef4444' }
                ]} />
                <View style={styles.resultInfo}>
                  <ThemedText style={styles.resultOpponent}>
                    {match.homeAway === 'home' ? 'vs' : '@'} {match.opponent}
                  </ThemedText>
                  <ThemedText style={styles.resultDate}>
                    {new Date(match.matchDate).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </ThemedText>
                </View>
                <View style={styles.resultScore}>
                  <ThemedText style={styles.resultScoreText}>
                    {match.goalsScored} : {match.goalsConceded}
                  </ThemedText>
                </View>
              </View>
            ))}
            {recentResults.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="sports-soccer" size={48} color="#64748b" />
                <ThemedText style={styles.emptyText}>Brak wyników meczów</ThemedText>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
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
  teamSelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  teamSelectorContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  teamChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
    marginRight: Spacing.sm,
  },
  teamChipActive: {
    backgroundColor: AppColors.primary,
  },
  teamChipText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  teamChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  tabLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  tabLabelActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  winRateCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  winRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  winRateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  winRateValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  winRateBar: {
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 4,
    marginBottom: Spacing.md,
  },
  winRateFill: {
    height: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  winRateBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  winRateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  winRateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  winRateItemText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  goalsCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  goalsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  goalsStat: {
    alignItems: "center",
  },
  goalsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 4,
  },
  goalsLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  goalsDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#334155",
  },
  goalsAvg: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  goalsAvgText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  quickStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  scorerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scorerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  scorerRankTop: {
    backgroundColor: "#f59e0b",
  },
  scorerRankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748b",
  },
  scorerRankTextTop: {
    color: "#fff",
  },
  scorerInfo: {
    flex: 1,
  },
  scorerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  scorerPosition: {
    fontSize: 12,
    color: "#64748b",
  },
  scorerStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  scorerStatItem: {
    alignItems: "center",
  },
  scorerStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  scorerStatLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  attendanceRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  attendanceRankText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  attendanceBars: {
    gap: 4,
  },
  attendanceBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  attendanceBarLabel: {
    width: 50,
    fontSize: 10,
    color: "#64748b",
  },
  attendanceBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#0f172a",
    borderRadius: 3,
  },
  attendanceBarFill: {
    height: 6,
    borderRadius: 3,
  },
  attendanceBarValue: {
    width: 35,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "right",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultOpponent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  resultDate: {
    fontSize: 12,
    color: "#64748b",
  },
  resultScore: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  resultScoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
});
