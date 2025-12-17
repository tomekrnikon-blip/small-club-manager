import { useLocalSearchParams, useRouter } from "expo-router";
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

// Achievement definitions with icons and colors
const ACHIEVEMENT_DEFINITIONS = [
  // Goals milestones
  { code: "goals_10", name: "Strzelec", desc: "Zdobądź 10 bramek", category: "goals", icon: "sports-soccer", color: "#22c55e", threshold: 10 },
  { code: "goals_25", name: "Snajper", desc: "Zdobądź 25 bramek", category: "goals", icon: "sports-soccer", color: "#22c55e", threshold: 25 },
  { code: "goals_50", name: "Kanonir", desc: "Zdobądź 50 bramek", category: "goals", icon: "sports-soccer", color: "#f59e0b", threshold: 50 },
  { code: "goals_100", name: "Legenda", desc: "Zdobądź 100 bramek", category: "goals", icon: "sports-soccer", color: "#ef4444", threshold: 100 },
  
  // Assists milestones
  { code: "assists_10", name: "Asystent", desc: "Wykonaj 10 asyst", category: "assists", icon: "handshake", color: "#3b82f6", threshold: 10 },
  { code: "assists_25", name: "Kreator", desc: "Wykonaj 25 asyst", category: "assists", icon: "handshake", color: "#3b82f6", threshold: 25 },
  { code: "assists_50", name: "Rozgrywający", desc: "Wykonaj 50 asyst", category: "assists", icon: "handshake", color: "#f59e0b", threshold: 50 },
  
  // Attendance
  { code: "attendance_10", name: "Regularny", desc: "Weź udział w 10 treningach", category: "attendance", icon: "fitness-center", color: "#a855f7", threshold: 10 },
  { code: "attendance_50", name: "Wytrwały", desc: "Weź udział w 50 treningach", category: "attendance", icon: "fitness-center", color: "#a855f7", threshold: 50 },
  { code: "attendance_100", name: "Niezawodny", desc: "Weź udział w 100 treningach", category: "attendance", icon: "fitness-center", color: "#f59e0b", threshold: 100 },
  
  // Matches
  { code: "matches_10", name: "Debiutant", desc: "Rozegraj 10 meczów", category: "matches", icon: "emoji-events", color: "#06b6d4", threshold: 10 },
  { code: "matches_25", name: "Zawodnik", desc: "Rozegraj 25 meczów", category: "matches", icon: "emoji-events", color: "#06b6d4", threshold: 25 },
  { code: "matches_50", name: "Weteran", desc: "Rozegraj 50 meczów", category: "matches", icon: "emoji-events", color: "#f59e0b", threshold: 50 },
  
  // Ratings
  { code: "rating_5", name: "Perfekcjonista", desc: "Otrzymaj ocenę 5.0", category: "ratings", icon: "star", color: "#eab308", threshold: 5 },
  { code: "rating_avg_4", name: "Konsekwentny", desc: "Średnia ocen powyżej 4.0", category: "ratings", icon: "star", color: "#eab308", threshold: 4 },
  
  // Special
  { code: "hat_trick", name: "Hat-trick", desc: "Zdobądź 3 bramki w meczu", category: "special", icon: "local-fire-department", color: "#ef4444", threshold: 3 },
  { code: "clean_sheet", name: "Czyste konto", desc: "Zachowaj czyste konto (bramkarz)", category: "special", icon: "shield", color: "#22c55e", threshold: 1 },
];

type CategoryFilter = "all" | "goals" | "assists" | "attendance" | "matches" | "ratings" | "special";

export default function PlayerAchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  
  const [category, setCategory] = useState<CategoryFilter>("all");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Get player data
  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  
  const player = playerId 
    ? players?.find(p => p.id === parseInt(playerId)) 
    : players?.[0];

  // Get player stats for achievement progress
  const { data: stats, isLoading } = trpc.players.getStats.useQuery(
    { playerId: player?.id ?? 0 },
    { enabled: !!player?.id }
  );

  const playerStats = stats?.[0];

  // Calculate achievement progress
  const getProgress = (achievement: typeof ACHIEVEMENT_DEFINITIONS[0]) => {
    if (!playerStats) return 0;
    
    switch (achievement.category) {
      case "goals":
        return playerStats.goals;
      case "assists":
        return playerStats.assists;
      case "matches":
        return playerStats.matchesPlayed;
      case "attendance":
        return playerStats.matchesPlayed * 3; // Estimate trainings
      default:
        return 0;
    }
  };

  const isUnlocked = (achievement: typeof ACHIEVEMENT_DEFINITIONS[0]) => {
    return getProgress(achievement) >= achievement.threshold;
  };

  const categories: { value: CategoryFilter; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { value: "all", label: "Wszystkie", icon: "apps" },
    { value: "goals", label: "Bramki", icon: "sports-soccer" },
    { value: "assists", label: "Asysty", icon: "handshake" },
    { value: "attendance", label: "Frekwencja", icon: "fitness-center" },
    { value: "matches", label: "Mecze", icon: "emoji-events" },
    { value: "special", label: "Specjalne", icon: "star" },
  ];

  const filteredAchievements = category === "all" 
    ? ACHIEVEMENT_DEFINITIONS 
    : ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);

  const unlockedCount = ACHIEVEMENT_DEFINITIONS.filter(a => isUnlocked(a)).length;
  const totalPoints = ACHIEVEMENT_DEFINITIONS.filter(a => isUnlocked(a)).reduce((sum, a) => sum + 10, 0);

  if (isLoading) {
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
        <ThemedText style={styles.headerTitle}>Osiągnięcia</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Summary */}
        {player && (
          <View style={styles.summaryCard}>
            <View style={styles.playerAvatar}>
              <ThemedText style={styles.avatarText}>
                {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </ThemedText>
            </View>
            <View style={styles.summaryInfo}>
              <ThemedText style={styles.playerName}>{player.name}</ThemedText>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <ThemedText style={styles.summaryValue}>{unlockedCount}</ThemedText>
                  <ThemedText style={styles.summaryLabel}>Odblokowane</ThemedText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <ThemedText style={styles.summaryValue}>{totalPoints}</ThemedText>
                  <ThemedText style={styles.summaryLabel}>Punkty</ThemedText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <ThemedText style={styles.summaryValue}>
                    {Math.round((unlockedCount / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>Postęp</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map(cat => (
            <Pressable
              key={cat.value}
              style={[
                styles.categoryChip,
                category === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <MaterialIcons 
                name={cat.icon} 
                size={16} 
                color={category === cat.value ? "#fff" : "#64748b"} 
              />
              <ThemedText style={[
                styles.categoryLabel,
                category === cat.value && styles.categoryLabelActive,
              ]}>
                {cat.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map(achievement => {
            const unlocked = isUnlocked(achievement);
            const progress = getProgress(achievement);
            const progressPercent = Math.min((progress / achievement.threshold) * 100, 100);
            
            return (
              <View 
                key={achievement.code} 
                style={[
                  styles.achievementCard,
                  unlocked && styles.achievementCardUnlocked,
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: unlocked ? achievement.color + "30" : "#1e293b" },
                ]}>
                  <MaterialIcons 
                    name={achievement.icon as any} 
                    size={28} 
                    color={unlocked ? achievement.color : "#475569"} 
                  />
                  {unlocked && (
                    <View style={styles.checkBadge}>
                      <MaterialIcons name="check" size={12} color="#fff" />
                    </View>
                  )}
                </View>
                
                <ThemedText style={[
                  styles.achievementName,
                  !unlocked && styles.achievementNameLocked,
                ]}>
                  {achievement.name}
                </ThemedText>
                
                <ThemedText style={styles.achievementDesc}>
                  {achievement.desc}
                </ThemedText>
                
                {!unlocked && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${progressPercent}%`, backgroundColor: achievement.color }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.progressText}>
                      {progress}/{achievement.threshold}
                    </ThemedText>
                  </View>
                )}
                
                {unlocked && (
                  <View style={[styles.pointsBadge, { backgroundColor: achievement.color + "20" }]}>
                    <ThemedText style={[styles.pointsText, { color: achievement.color }]}>
                      +10 pkt
                    </ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
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
  summaryInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#334155",
    marginHorizontal: Spacing.md,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  categoryChipActive: {
    backgroundColor: AppColors.primary,
  },
  categoryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  categoryLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  achievementCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  achievementCardUnlocked: {
    borderColor: AppColors.primary + "40",
    backgroundColor: "#1e293b",
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: "#64748b",
  },
  achievementDesc: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    width: "100%",
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#0f172a",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
  pointsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
