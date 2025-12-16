import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineQuery } from "@/hooks/use-offline-query";
import { OfflineIndicator } from "@/components/offline-indicator";

type FilterType = "all" | "upcoming" | "past";

export default function MatchesScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const matchesQuery = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches, isLoading, isFromCache, isStale, isOffline } = useOfflineQuery(
    matchesQuery,
    { cacheKey: `matches_${club?.id}`, enabled: !!club?.id }
  );

  const now = new Date();
  const filteredMatches = matches?.filter((match) => {
    const matchDate = new Date(match.matchDate);
    if (filter === "upcoming") return matchDate >= now;
    if (filter === "past") return matchDate < now;
    return true;
  });

  // Calculate stats
  const wins = matches?.filter((m) => m.result === "win").length || 0;
  const draws = matches?.filter((m) => m.result === "draw").length || 0;
  const losses = matches?.filter((m) => m.result === "loss").length || 0;
  const goalsScored = matches?.reduce((sum, m) => sum + m.goalsScored, 0) || 0;
  const goalsConceded = matches?.reduce((sum, m) => sum + m.goalsConceded, 0) || 0;

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć mecze</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby dodać mecze</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>Mecze</ThemedText>
          <OfflineIndicator isFromCache={isFromCache} isStale={isStale} isOffline={isOffline} compact />
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/match/add" as any)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatItem label="Wygrane" value={wins} color={AppColors.success} />
          <StatItem label="Remisy" value={draws} color={AppColors.warning} />
          <StatItem label="Przegrane" value={losses} color={AppColors.danger} />
        </View>
        <View style={styles.goalsRow}>
          <ThemedText style={styles.goalsText}>
            Bramki: <ThemedText style={styles.goalsValue}>{goalsScored}</ThemedText> strzelone,{" "}
            <ThemedText style={styles.goalsValue}>{goalsConceded}</ThemedText> stracone
          </ThemedText>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterTab
          label="Wszystkie"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterTab
          label="Nadchodzące"
          active={filter === "upcoming"}
          onPress={() => setFilter("upcoming")}
        />
        <FilterTab
          label="Rozegrane"
          active={filter === "past"}
          onPress={() => setFilter("past")}
        />
      </View>

      {/* Matches list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => router.push(`/match/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="sports-soccer" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak meczów</ThemedText>
              <ThemedText style={styles.emptyText}>
                {filter !== "all"
                  ? "Nie znaleziono meczów w wybranej kategorii"
                  : "Dodaj pierwszy mecz"}
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={onPress}
    >
      <ThemedText style={[styles.filterTabText, active && styles.filterTabTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MatchCard({ match, onPress }: { match: any; onPress: () => void }) {
  const matchDate = new Date(match.matchDate);
  const isUpcoming = matchDate >= new Date();
  
  const resultColor =
    match.result === "win"
      ? AppColors.success
      : match.result === "loss"
      ? AppColors.danger
      : AppColors.warning;

  return (
    <Pressable style={styles.matchCard} onPress={onPress}>
      <View style={styles.matchHeader}>
        <View style={[styles.homeAwayBadge, { backgroundColor: match.homeAway === "home" ? AppColors.primary + "20" : AppColors.secondary + "20" }]}>
          <ThemedText style={[styles.homeAwayText, { color: match.homeAway === "home" ? AppColors.primary : AppColors.secondary }]}>
            {match.homeAway === "home" ? "DOM" : "WYJAZD"}
          </ThemedText>
        </View>
        <ThemedText style={styles.matchDate}>
          {matchDate.toLocaleDateString("pl-PL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
          {match.matchTime && ` • ${match.matchTime}`}
        </ThemedText>
      </View>

      <View style={styles.matchBody}>
        <View style={styles.teamSection}>
          <ThemedText style={styles.teamName}>Nasz klub</ThemedText>
        </View>

        {isUpcoming ? (
          <View style={styles.vsContainer}>
            <ThemedText style={styles.vsText}>VS</ThemedText>
          </View>
        ) : (
          <View style={[styles.scoreContainer, { backgroundColor: resultColor + "20" }]}>
            <ThemedText style={[styles.scoreText, { color: resultColor }]}>
              {match.goalsScored} : {match.goalsConceded}
            </ThemedText>
          </View>
        )}

        <View style={[styles.teamSection, styles.teamSectionRight]}>
          <ThemedText style={styles.teamName}>{match.opponent}</ThemedText>
        </View>
      </View>

      {match.location && (
        <View style={styles.matchFooter}>
          <MaterialIcons name="location-on" size={14} color="#64748b" />
          <ThemedText style={styles.locationText}>{match.location}</ThemedText>
        </View>
      )}
    </Pressable>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: AppColors.primary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    backgroundColor: AppColors.bgCard,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: Spacing.xs,
  },
  goalsRow: {
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  goalsText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  goalsValue: {
    color: "#fff",
    fontWeight: "600",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: AppColors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  matchCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  homeAwayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  homeAwayText: {
    fontSize: 11,
    fontWeight: "600",
  },
  matchDate: {
    fontSize: 13,
    color: "#94a3b8",
  },
  matchBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamSection: {
    flex: 1,
  },
  teamSectionRight: {
    alignItems: "flex-end",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  vsContainer: {
    paddingHorizontal: Spacing.md,
  },
  vsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  scoreContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  matchFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
});
