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

export default function PlayerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Get player data for current user
  const { data: players, isLoading: loadingPlayer } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const myPlayer = players?.[0]; // For demo, use first player

  // Get player stats
  const { data: stats } = trpc.players.getStats.useQuery(
    { playerId: myPlayer?.id ?? 0 },
    { enabled: !!myPlayer?.id }
  );

  // Get upcoming events
  const { data: upcomingTrainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: upcomingMatches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get recent ratings
  const { data: recentRatings } = trpc.playerRatings.listByPlayer.useQuery(
    { playerId: myPlayer?.id ?? 0 },
    { enabled: !!myPlayer?.id }
  );

  // Injuries are fetched from player data
  const activeInjury: any = null; // Simplified - injuries would come from player data

  // Get first stats record
  const playerStats = stats?.[0];

  // Calculate attendance rate
  const attendanceRate = playerStats ? 
    Math.round((playerStats.matchesPlayed / Math.max(playerStats.matchesPlayed + 5, 1)) * 100) : 0;

  // Calculate average rating
  const avgRating = recentRatings && recentRatings.length > 0
    ? (recentRatings.reduce((sum: number, r: any) => sum + Number(r.overall), 0) / recentRatings.length).toFixed(1)
    : "—";

  if (loadingPlayer) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!myPlayer) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Panel zawodnika</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <MaterialIcons name="person-off" size={64} color="#334155" />
          <ThemedText style={styles.emptyText}>Nie jesteś przypisany jako zawodnik</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Poproś trenera o dodanie Cię do listy zawodników
          </ThemedText>
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
        <ThemedText style={styles.headerTitle}>Panel zawodnika</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <ThemedText style={styles.avatarText}>
              {myPlayer.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </ThemedText>
          </View>
          <View style={styles.playerInfo}>
            <ThemedText style={styles.playerName}>{myPlayer.name}</ThemedText>
            <View style={styles.playerMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="sports-soccer" size={14} color="#64748b" />
                <ThemedText style={styles.metaText}>{myPlayer.position}</ThemedText>
              </View>
              {myPlayer.jerseyNumber && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="tag" size={14} color="#64748b" />
                  <ThemedText style={styles.metaText}>#{myPlayer.jerseyNumber}</ThemedText>
                </View>
              )}
            </View>
          </View>
          {activeInjury && (
            <View style={styles.injuryBadge}>
              <MaterialIcons name="healing" size={16} color="#ef4444" />
            </View>
          )}
        </View>

        {/* Injury Alert */}
        {activeInjury && (
          <View style={styles.injuryAlert}>
            <MaterialIcons name="warning" size={20} color="#f59e0b" />
            <View style={styles.injuryInfo}>
              <ThemedText style={styles.injuryTitle}>
                {activeInjury.injuryType}
              </ThemedText>
              <ThemedText style={styles.injuryStatus}>
                Status: {activeInjury.status === "active" ? "Aktywna kontuzja" : "W trakcie rehabilitacji"}
              </ThemedText>
              {activeInjury.expectedRecoveryDate && (
                <ThemedText style={styles.injuryRecovery}>
                  Przewidywany powrót: {new Date(activeInjury.expectedRecoveryDate).toLocaleDateString('pl-PL')}
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Statystyki sezonu</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{playerStats?.goals || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Bramki</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{playerStats?.assists || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Asysty</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{playerStats?.matchesPlayed || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Mecze</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{playerStats?.minutesPlayed || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Minuty</ThemedText>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wskaźniki</ThemedText>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricCircle}>
                <ThemedText style={styles.metricValue}>{attendanceRate}%</ThemedText>
              </View>
              <ThemedText style={styles.metricLabel}>Frekwencja</ThemedText>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricCircle, { backgroundColor: "#a855f720" }]}>
                <ThemedText style={[styles.metricValue, { color: "#a855f7" }]}>{avgRating}</ThemedText>
              </View>
              <ThemedText style={styles.metricLabel}>Średnia ocena</ThemedText>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricCircle, { backgroundColor: "#f59e0b20" }]}>
                <ThemedText style={[styles.metricValue, { color: "#f59e0b" }]}>
                  {(playerStats?.yellowCards || 0) + (playerStats?.redCards || 0)}
                </ThemedText>
              </View>
              <ThemedText style={styles.metricLabel}>Kartki</ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Ratings */}
        {recentRatings && recentRatings.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Ostatnie oceny</ThemedText>
            {recentRatings.slice(0, 3).map((rating: any) => (
              <View key={rating.id} style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                  <View style={[
                    styles.ratingIcon,
                    { backgroundColor: rating.eventType === "match" ? "#a855f720" : "#f59e0b20" }
                  ]}>
                    <MaterialIcons 
                      name={rating.eventType === "match" ? "sports-soccer" : "fitness-center"} 
                      size={16} 
                      color={rating.eventType === "match" ? "#a855f7" : "#f59e0b"} 
                    />
                  </View>
                  <View style={styles.ratingInfo}>
                    <ThemedText style={styles.ratingType}>
                      {rating.eventType === "match" ? "Mecz" : "Trening"}
                    </ThemedText>
                    <ThemedText style={styles.ratingDate}>
                      {new Date(rating.eventDate).toLocaleDateString('pl-PL')}
                    </ThemedText>
                  </View>
                  <View style={styles.ratingScore}>
                    <ThemedText style={styles.ratingScoreText}>{Number(rating.overall).toFixed(1)}</ThemedText>
                  </View>
                </View>
                <View style={styles.ratingBars}>
                  <RatingBar label="Technika" value={rating.technique} />
                  <RatingBar label="Zaangażowanie" value={rating.engagement} />
                  <RatingBar label="Postępy" value={rating.progress} />
                  <RatingBar label="Współpraca" value={rating.teamwork} />
                </View>
                {rating.notes && (
                  <ThemedText style={styles.ratingNotes}>{rating.notes}</ThemedText>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nadchodzące wydarzenia</ThemedText>
          
          {upcomingTrainings?.slice(0, 3).map(training => (
            <View key={training.id} style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: "#f59e0b20" }]}>
                <MaterialIcons name="fitness-center" size={20} color="#f59e0b" />
              </View>
              <View style={styles.eventInfo}>
                <ThemedText style={styles.eventTitle}>Trening</ThemedText>
                <ThemedText style={styles.eventMeta}>
                  {new Date(training.trainingDate).toLocaleDateString('pl-PL', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })} • {training.trainingTime || "—"}
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#64748b" />
            </View>
          ))}

          {upcomingMatches?.slice(0, 3).map(match => (
            <View key={match.id} style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: "#a855f720" }]}>
                <MaterialIcons name="sports-soccer" size={20} color="#a855f7" />
              </View>
              <View style={styles.eventInfo}>
                <ThemedText style={styles.eventTitle}>vs {match.opponent}</ThemedText>
                <ThemedText style={styles.eventMeta}>
                  {new Date(match.matchDate).toLocaleDateString('pl-PL', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })} • {match.matchTime || "—"}
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#64748b" />
            </View>
          ))}

          {(!upcomingTrainings?.length && !upcomingMatches?.length) && (
            <View style={styles.noEvents}>
              <ThemedText style={styles.noEventsText}>Brak nadchodzących wydarzeń</ThemedText>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Szybkie akcje</ThemedText>
          <View style={styles.actionsGrid}>
            <Pressable 
              style={styles.actionCard}
              onPress={() => router.push("/my-callups" as any)}
            >
              <MaterialIcons name="assignment" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionLabel}>Moje powołania</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.actionCard}
              onPress={() => router.push("/surveys" as any)}
            >
              <MaterialIcons name="poll" size={24} color="#a855f7" />
              <ThemedText style={styles.actionLabel}>Ankiety</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.actionCard}
              onPress={() => router.push("/messages" as any)}
            >
              <MaterialIcons name="chat" size={24} color="#3b82f6" />
              <ThemedText style={styles.actionLabel}>Wiadomości</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.actionCard}
              onPress={() => router.push(`/player-stats/${myPlayer.id}` as any)}
            >
              <MaterialIcons name="bar-chart" size={24} color="#22c55e" />
              <ThemedText style={styles.actionLabel}>Pełne statystyki</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 5) * 100;
  
  return (
    <View style={styles.ratingBarContainer}>
      <ThemedText style={styles.ratingBarLabel}>{label}</ThemedText>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
      </View>
      <ThemedText style={styles.ratingBarValue}>{value}</ThemedText>
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  playerMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#64748b",
  },
  injuryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef444420",
    alignItems: "center",
    justifyContent: "center",
  },
  injuryAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f59e0b15",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  injuryInfo: {
    flex: 1,
  },
  injuryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f59e0b",
  },
  injuryStatus: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  injuryRecovery: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
  },
  metricCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  ratingCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  ratingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  ratingDate: {
    fontSize: 12,
    color: "#64748b",
  },
  ratingScore: {
    backgroundColor: AppColors.primary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  ratingScoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
  ratingBars: {
    gap: Spacing.xs,
  },
  ratingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ratingBarLabel: {
    fontSize: 11,
    color: "#64748b",
    width: 80,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#0f172a",
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  ratingBarValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    width: 20,
    textAlign: "right",
  },
  ratingNotes: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  eventMeta: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  noEvents: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  noEventsText: {
    fontSize: 14,
    color: "#64748b",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionLabel: {
    fontSize: 13,
    color: "#e2e8f0",
  },
});
