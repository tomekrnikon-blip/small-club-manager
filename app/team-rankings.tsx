import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
// Club ID will be fetched from user's clubs

type RankingCategory = "goals" | "assists" | "attendance" | "rating" | "minutes";

export default function TeamRankingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Get club ID from clubs query
  const { data: clubs } = trpc.clubs.list.useQuery();
  const activeClubId = clubs?.[0]?.id;

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [category, setCategory] = useState<RankingCategory>("goals");

  const { data: teams, isLoading: teamsLoading } = trpc.teams.list.useQuery(
    { clubId: activeClubId! },
    { enabled: !!activeClubId }
  );

  const { data: players, isLoading: playersLoading } = trpc.players.list.useQuery(
    { clubId: activeClubId! },
    { enabled: !!activeClubId }
  );

  // Filter players by team locally
  const filteredPlayers = selectedTeamId 
    ? players?.filter((p: any) => p.teamId === selectedTeamId)
    : players;

  // Calculate rankings based on category
  const getRankings = () => {
    if (!players) return [];

    // Mock stats - in production would come from statsData
    const playersWithStats = players.map((player: any) => {
      const stats = {
        goals: Math.floor(Math.random() * 15),
        assists: Math.floor(Math.random() * 10),
        attendance: 70 + Math.floor(Math.random() * 30),
        rating: 3 + Math.random() * 2,
        minutesPlayed: Math.floor(Math.random() * 1500),
      };

      return {
        ...player,
        stats,
      };
    });

    // Sort by selected category
    return playersWithStats.sort((a: any, b: any) => {
      switch (category) {
        case "goals":
          return (b.stats.goals || 0) - (a.stats.goals || 0);
        case "assists":
          return (b.stats.assists || 0) - (a.stats.assists || 0);
        case "attendance":
          return (b.stats.attendance || 0) - (a.stats.attendance || 0);
        case "rating":
          return (b.stats.rating || 0) - (a.stats.rating || 0);
        case "minutes":
          return (b.stats.minutesPlayed || 0) - (a.stats.minutesPlayed || 0);
        default:
          return 0;
      }
    });
  };

  const rankings = getRankings();

  const getCategoryLabel = (cat: RankingCategory) => {
    switch (cat) {
      case "goals":
        return "Bramki";
      case "assists":
        return "Asysty";
      case "attendance":
        return "Frekwencja";
      case "rating":
        return "Ocena";
      case "minutes":
        return "Minuty";
    }
  };

  const getCategoryIcon = (cat: RankingCategory) => {
    switch (cat) {
      case "goals":
        return "sports-soccer";
      case "assists":
        return "handshake";
      case "attendance":
        return "check-circle";
      case "rating":
        return "star";
      case "minutes":
        return "timer";
    }
  };

  const getCategoryValue = (player: any) => {
    switch (category) {
      case "goals":
        return player.stats.goals || 0;
      case "assists":
        return player.stats.assists || 0;
      case "attendance":
        return `${player.stats.attendance || 0}%`;
      case "rating":
        return (player.stats.rating || 0).toFixed(1);
      case "minutes":
        return player.stats.minutesPlayed || 0;
    }
  };

  const isLoading = teamsLoading || playersLoading;

  return (
    <>
      <Stack.Screen options={{ title: "Rankingi drużyn" }} />

      <ThemedView style={styles.container}>
        {/* Team Selector */}
        <View style={styles.teamSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={[styles.teamChip, !selectedTeamId && styles.teamChipSelected]}
              onPress={() => setSelectedTeamId(null)}
            >
              <ThemedText
                style={[styles.teamChipText, !selectedTeamId && styles.teamChipTextSelected]}
              >
                Wszystkie
              </ThemedText>
            </Pressable>

            {teams?.map((team: any) => (
              <Pressable
                key={team.id}
                style={[styles.teamChip, selectedTeamId === team.id && styles.teamChipSelected]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <ThemedText
                  style={[
                    styles.teamChipText,
                    selectedTeamId === team.id && styles.teamChipTextSelected,
                  ]}
                >
                  {team.name}
                </ThemedText>
                {team.isAcademy && (
                  <MaterialIcons name="school" size={14} color={AppColors.secondary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Category Selector */}
        <View style={styles.categorySelector}>
          {(["goals", "assists", "attendance", "rating", "minutes"] as RankingCategory[]).map(
            (cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                onPress={() => setCategory(cat)}
              >
                <MaterialIcons
                  name={getCategoryIcon(cat) as any}
                  size={18}
                  color={category === cat ? "#fff" : "#64748b"}
                />
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {getCategoryLabel(cat)}
                </ThemedText>
              </Pressable>
            )
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Podium for top 3 */}
            {rankings.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd place */}
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatar, styles.podiumSecond]}>
                    <ThemedText style={styles.podiumInitials}>
                      {rankings[1].name?.split(" ").map((n: string) => n[0]).join("")}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.podiumName} numberOfLines={1}>
                    {rankings[1].name}
                  </ThemedText>
                  <ThemedText style={styles.podiumValue}>
                    {getCategoryValue(rankings[1])}
                  </ThemedText>
                  <View style={[styles.podiumBar, styles.podiumBarSecond]}>
                    <ThemedText style={styles.podiumRank}>2</ThemedText>
                  </View>
                </View>

                {/* 1st place */}
                <View style={styles.podiumItem}>
                  <MaterialIcons name="emoji-events" size={32} color="#f59e0b" />
                  <View style={[styles.podiumAvatar, styles.podiumFirst]}>
                    <ThemedText style={styles.podiumInitials}>
                      {rankings[0].name?.split(" ").map((n: string) => n[0]).join("")}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.podiumName} numberOfLines={1}>
                    {rankings[0].name}
                  </ThemedText>
                  <ThemedText style={[styles.podiumValue, styles.podiumValueFirst]}>
                    {getCategoryValue(rankings[0])}
                  </ThemedText>
                  <View style={[styles.podiumBar, styles.podiumBarFirst]}>
                    <ThemedText style={styles.podiumRank}>1</ThemedText>
                  </View>
                </View>

                {/* 3rd place */}
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatar, styles.podiumThird]}>
                    <ThemedText style={styles.podiumInitials}>
                      {rankings[2].name?.split(" ").map((n: string) => n[0]).join("")}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.podiumName} numberOfLines={1}>
                    {rankings[2].name}
                  </ThemedText>
                  <ThemedText style={styles.podiumValue}>
                    {getCategoryValue(rankings[2])}
                  </ThemedText>
                  <View style={[styles.podiumBar, styles.podiumBarThird]}>
                    <ThemedText style={styles.podiumRank}>3</ThemedText>
                  </View>
                </View>
              </View>
            )}

            {/* Full ranking list */}
            <View style={styles.rankingList}>
              <ThemedText style={styles.listTitle}>Pełny ranking</ThemedText>

              {rankings.map((player: any, index: number) => (
                <Pressable
                  key={player.id}
                  style={styles.rankingItem}
                  onPress={() => router.push(`/player/${player.id}` as any)}
                >
                  <View style={styles.rankBadge}>
                    <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                  </View>

                  <View style={styles.playerInfo}>
                    <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                    <ThemedText style={styles.playerTeam}>
                      {player.position} • {player.teamName || "Bez drużyny"}
                    </ThemedText>
                  </View>

                  <View style={styles.valueContainer}>
                    <MaterialIcons
                      name={getCategoryIcon(category) as any}
                      size={16}
                      color={AppColors.primary}
                    />
                    <ThemedText style={styles.valueText}>{getCategoryValue(player)}</ThemedText>
                  </View>

                  <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  teamSelector: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  teamChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
    gap: 4,
  },
  teamChipSelected: {
    backgroundColor: AppColors.primary,
  },
  teamChipText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  teamChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    gap: 4,
  },
  categoryChipSelected: {
    backgroundColor: AppColors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: "#64748b",
  },
  categoryChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  podiumItem: {
    alignItems: "center",
    width: "30%",
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  podiumFirst: {
    backgroundColor: "#f59e0b30",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumSecond: {
    backgroundColor: "#94a3b830",
  },
  podiumThird: {
    backgroundColor: "#cd7f3230",
  },
  podiumInitials: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  podiumName: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  podiumValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
  },
  podiumValueFirst: {
    color: "#f59e0b",
    fontSize: 20,
  },
  podiumBar: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  podiumBarFirst: {
    height: 80,
    backgroundColor: "#f59e0b30",
  },
  podiumBarSecond: {
    height: 60,
    backgroundColor: "#94a3b830",
  },
  podiumBarThird: {
    height: 40,
    backgroundColor: "#cd7f3230",
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  rankingList: {
    padding: Spacing.lg,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  playerTeam: {
    fontSize: 12,
    color: "#64748b",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: Spacing.sm,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
});
