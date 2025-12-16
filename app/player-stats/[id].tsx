import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
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

export default function PlayerStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const { data: player, isLoading: playerLoading } = trpc.players.get.useQuery(
    { id: Number(id) },
    { enabled: !!id && isAuthenticated }
  );

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  // Get player's training attendance - use trainings list and filter
  const { data: trainings, isLoading: trainingsLoading } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get player's match callups - use callups list
  const { data: callups, isLoading: callupsLoading } = trpc.callups.getMyCallups.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id && isAuthenticated }
  );

  // Filter for this player's data
  const trainingAttendance: any[] = []; // Would need backend endpoint
  const matchCallups = callups?.filter((c: any) => c.playerId === Number(id)) || [];

  // Calculate training stats
  const trainingStats = useMemo(() => {
    if (!trainingAttendance) return { total: 0, attended: 0, percentage: 0 };
    
    const total = trainingAttendance.length;
  const attended = trainingAttendance.filter((a) => a.attended === 1).length;const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    return { total, attended, percentage };
  }, [trainingAttendance]);

  // Calculate match stats
  const matchStats = useMemo(() => {
    if (!matchCallups) return { total: 0, attended: 0, percentage: 0 };
    
    const total = matchCallups.length;
    const attended = matchCallups.filter((c: any) => c.attended).length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    return { total, attended, percentage };
  }, [matchCallups]);

  // Recent trainings
  const recentTrainings = useMemo(() => {
    if (!trainingAttendance) return [];
    return trainingAttendance.slice(0, 10);
  }, [trainingAttendance]);

  // Recent matches
  const recentMatches = useMemo(() => {
    if (!matchCallups) return [];
    return matchCallups.slice(0, 10);
  }, [matchCallups]);

  const isLoading = playerLoading || trainingsLoading || callupsLoading;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  if (!player) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.errorText}>Nie znaleziono zawodnika</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Statystyki frekwencji",
          headerStyle: { backgroundColor: AppColors.bgDark },
          headerTintColor: "#fff",
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Player Header */}
          <View style={styles.playerHeader}>
            <View style={styles.playerAvatar}>
              <ThemedText style={styles.playerInitials}>
                {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </ThemedText>
            </View>
            <View style={styles.playerInfo}>
              <ThemedText style={styles.playerName}>{player.name}</ThemedText>
              <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
            </View>
          </View>

          {/* Overall Stats */}
          <View style={styles.overallStats}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: AppColors.secondary + "20" }]}>
                <MaterialIcons name="fitness-center" size={24} color={AppColors.secondary} />
              </View>
              <ThemedText style={styles.statTitle}>Treningi</ThemedText>
              <ThemedText style={styles.statValue}>{trainingStats.percentage}%</ThemedText>
              <ThemedText style={styles.statSubtext}>
                {trainingStats.attended} / {trainingStats.total}
              </ThemedText>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: AppColors.primary + "20" }]}>
                <MaterialIcons name="sports-soccer" size={24} color={AppColors.primary} />
              </View>
              <ThemedText style={styles.statTitle}>Mecze</ThemedText>
              <ThemedText style={styles.statValue}>{matchStats.percentage}%</ThemedText>
              <ThemedText style={styles.statSubtext}>
                {matchStats.attended} / {matchStats.total}
              </ThemedText>
            </View>
          </View>

          {/* Progress Bars */}
          <View style={styles.progressSection}>
            <ThemedText style={styles.sectionTitle}>Frekwencja ogólna</ThemedText>
            
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <ThemedText style={styles.progressLabel}>Treningi</ThemedText>
                <ThemedText style={styles.progressValue}>{trainingStats.percentage}%</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${trainingStats.percentage}%`,
                      backgroundColor: AppColors.secondary,
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <ThemedText style={styles.progressLabel}>Mecze</ThemedText>
                <ThemedText style={styles.progressValue}>{matchStats.percentage}%</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${matchStats.percentage}%`,
                      backgroundColor: AppColors.primary,
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Recent Trainings */}
          {recentTrainings.length > 0 && (
            <View style={styles.recentSection}>
              <ThemedText style={styles.sectionTitle}>Ostatnie treningi</ThemedText>
              {recentTrainings.map((attendance: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <ThemedText style={styles.historyDateText}>
                      {new Date(attendance.trainingDate).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.historyInfo}>
                    <ThemedText style={styles.historyTitle}>Trening</ThemedText>
                    <ThemedText style={styles.historySubtext}>
                      {attendance.trainingTime || "Brak godziny"}
                    </ThemedText>
                  </View>
                  <MaterialIcons
                    name={attendance.attended === 1 ? "check-circle" : attendance.attended === 2 ? "cancel" : "radio-button-unchecked"}
                    size={24}
                    color={attendance.attended === 1 ? AppColors.success : attendance.attended === 2 ? AppColors.danger : "#64748b"}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Recent Matches */}
          {recentMatches.length > 0 && (
            <View style={styles.recentSection}>
              <ThemedText style={styles.sectionTitle}>Ostatnie mecze</ThemedText>
              {recentMatches.map((callup: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <ThemedText style={styles.historyDateText}>
                      {new Date(callup.matchDate).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.historyInfo}>
                    <ThemedText style={styles.historyTitle}>
                      vs {callup.opponent}
                    </ThemedText>
                    <ThemedText style={styles.historySubtext}>
                      {callup.homeAway === "home" ? "U siebie" : "Na wyjeździe"}
                    </ThemedText>
                  </View>
                  <MaterialIcons
                    name={callup.attended ? "check-circle" : "cancel"}
                    size={24}
                    color={callup.attended ? AppColors.success : AppColors.danger}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {recentTrainings.length === 0 && recentMatches.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="analytics" size={48} color="#475569" />
              <ThemedText style={styles.emptyStateText}>
                Brak danych o frekwencji
              </ThemedText>
              <ThemedText style={styles.emptyStateHint}>
                Statystyki pojawią się po dodaniu zawodnika do treningów i meczów
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  errorText: {
    color: "#64748b",
    fontSize: 16,
  },
  // Player Header
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  playerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  playerInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  // Overall Stats
  overallStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statTitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  statSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  // Progress Section
  progressSection: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  progressItem: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  // Recent Section
  recentSection: {
    marginBottom: Spacing.xl,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyDate: {
    width: 50,
    marginRight: Spacing.md,
  },
  historyDateText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  historySubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptyStateHint: {
    fontSize: 13,
    color: "#475569",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
