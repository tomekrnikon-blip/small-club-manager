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

type LeaderboardCategory = "overall" | "goals" | "assists" | "attendance" | "rating";
type TimeRange = "season" | "month" | "week";

interface LeaderboardEntry {
  id: number;
  name: string;
  position: string;
  value: number;
  points: number;
  trend: "up" | "down" | "same";
  avatar?: string;
}

export default function ClubLeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [category, setCategory] = useState<LeaderboardCategory>("overall");
  const [timeRange, setTimeRange] = useState<TimeRange>("season");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Calculate leaderboard data with mock stats
  const calculateLeaderboard = (): LeaderboardEntry[] => {
    if (!players) return [];

    return players.map((player, index) => {
      // Generate consistent mock stats based on player id
      const seed = player.id;
      const mockGoals = (seed * 7) % 20;
      const mockAssists = (seed * 5) % 15;
      const mockMatches = 10 + (seed * 3) % 20;
      const mockRating = 3 + ((seed * 11) % 20) / 10;
      
      let value = 0;
      let points = 0;
      
      switch (category) {
        case "goals":
          value = mockGoals;
          points = value * 10;
          break;
        case "assists":
          value = mockAssists;
          points = value * 7;
          break;
        case "attendance":
          value = mockMatches;
          points = value * 5;
          break;
        case "rating":
          value = Number(mockRating.toFixed(1));
          points = Math.round(value * 20);
          break;
        case "overall":
        default:
          points = mockGoals * 10 + mockAssists * 7 + mockMatches * 5;
          value = points;
          break;
      }

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        value,
        points,
        trend: (seed % 3 === 0 ? "up" : seed % 3 === 1 ? "down" : "same") as "up" | "down" | "same",
      };
    }).sort((a, b) => b.value - a.value);
  };

  const leaderboard = calculateLeaderboard();
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const categories: { value: LeaderboardCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { value: "overall", label: "Ogólny", icon: "leaderboard" },
    { value: "goals", label: "Bramki", icon: "sports-soccer" },
    { value: "assists", label: "Asysty", icon: "handshake" },
    { value: "attendance", label: "Frekwencja", icon: "fitness-center" },
    { value: "rating", label: "Oceny", icon: "star" },
  ];

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: "season", label: "Sezon" },
    { value: "month", label: "Miesiąc" },
    { value: "week", label: "Tydzień" },
  ];

  const getCategoryLabel = () => {
    switch (category) {
      case "goals": return "bramek";
      case "assists": return "asyst";
      case "attendance": return "meczów";
      case "rating": return "średnia";
      default: return "pkt";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return { icon: "trending-up", color: "#22c55e" };
      case "down": return { icon: "trending-down", color: "#ef4444" };
      default: return { icon: "trending-flat", color: "#64748b" };
    }
  };

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
        <ThemedText style={styles.headerTitle}>Ranking klubowy</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map(range => (
            <Pressable
              key={range.value}
              style={[
                styles.timeRangeBtn,
                timeRange === range.value && styles.timeRangeBtnActive,
              ]}
              onPress={() => setTimeRange(range.value)}
            >
              <ThemedText style={[
                styles.timeRangeText,
                timeRange === range.value && styles.timeRangeTextActive,
              ]}>
                {range.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

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

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.podiumSilver]}>
                <ThemedText style={styles.podiumAvatarText}>
                  {topThree[1].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </ThemedText>
              </View>
              <View style={[styles.podiumRank, styles.podiumRankSilver]}>
                <ThemedText style={styles.podiumRankText}>2</ThemedText>
              </View>
              <ThemedText style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name.split(" ")[0]}
              </ThemedText>
              <ThemedText style={styles.podiumValue}>
                {topThree[1].value} {getCategoryLabel()}
              </ThemedText>
              <View style={[styles.podiumBar, styles.podiumBarSilver]} />
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <View style={styles.crownContainer}>
                <MaterialIcons name="emoji-events" size={24} color="#eab308" />
              </View>
              <View style={[styles.podiumAvatar, styles.podiumGold]}>
                <ThemedText style={styles.podiumAvatarText}>
                  {topThree[0].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </ThemedText>
              </View>
              <View style={[styles.podiumRank, styles.podiumRankGold]}>
                <ThemedText style={styles.podiumRankText}>1</ThemedText>
              </View>
              <ThemedText style={styles.podiumName} numberOfLines={1}>
                {topThree[0].name.split(" ")[0]}
              </ThemedText>
              <ThemedText style={[styles.podiumValue, { color: "#eab308" }]}>
                {topThree[0].value} {getCategoryLabel()}
              </ThemedText>
              <View style={[styles.podiumBar, styles.podiumBarGold]} />
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.podiumBronze]}>
                <ThemedText style={styles.podiumAvatarText}>
                  {topThree[2].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </ThemedText>
              </View>
              <View style={[styles.podiumRank, styles.podiumRankBronze]}>
                <ThemedText style={styles.podiumRankText}>3</ThemedText>
              </View>
              <ThemedText style={styles.podiumName} numberOfLines={1}>
                {topThree[2].name.split(" ")[0]}
              </ThemedText>
              <ThemedText style={styles.podiumValue}>
                {topThree[2].value} {getCategoryLabel()}
              </ThemedText>
              <View style={[styles.podiumBar, styles.podiumBarBronze]} />
            </View>
          </View>
        )}

        {/* Rest of Leaderboard */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>Pełny ranking</ThemedText>
          
          {leaderboard.map((entry, index) => {
            const trend = getTrendIcon(entry.trend);
            const isTopThree = index < 3;
            
            return (
              <View 
                key={entry.id} 
                style={[
                  styles.listItem,
                  isTopThree && styles.listItemHighlight,
                ]}
              >
                <View style={styles.rankContainer}>
                  <ThemedText style={[
                    styles.rankNumber,
                    isTopThree && styles.rankNumberHighlight,
                  ]}>
                    {index + 1}
                  </ThemedText>
                </View>
                
                <View style={styles.listAvatar}>
                  <ThemedText style={styles.listAvatarText}>
                    {entry.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </ThemedText>
                </View>
                
                <View style={styles.listInfo}>
                  <ThemedText style={styles.listName}>{entry.name}</ThemedText>
                  <ThemedText style={styles.listPosition}>{entry.position}</ThemedText>
                </View>
                
                <View style={styles.listStats}>
                  <ThemedText style={styles.listValue}>
                    {entry.value} {getCategoryLabel()}
                  </ThemedText>
                  <View style={styles.trendContainer}>
                    <MaterialIcons 
                      name={trend.icon as any} 
                      size={16} 
                      color={trend.color} 
                    />
                  </View>
                </View>
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
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: 4,
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  timeRangeBtnActive: {
    backgroundColor: AppColors.primary,
  },
  timeRangeText: {
    fontSize: 13,
    color: "#64748b",
  },
  timeRangeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
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
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  podiumItem: {
    alignItems: "center",
    width: 100,
  },
  podiumFirst: {
    marginBottom: 20,
  },
  crownContainer: {
    marginBottom: Spacing.xs,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -12,
    zIndex: 1,
  },
  podiumGold: {
    backgroundColor: "#eab30830",
    borderWidth: 3,
    borderColor: "#eab308",
  },
  podiumSilver: {
    backgroundColor: "#94a3b830",
    borderWidth: 3,
    borderColor: "#94a3b8",
  },
  podiumBronze: {
    backgroundColor: "#d9764030",
    borderWidth: 3,
    borderColor: "#d97640",
  },
  podiumAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  podiumRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  podiumRankGold: {
    backgroundColor: "#eab308",
  },
  podiumRankSilver: {
    backgroundColor: "#94a3b8",
  },
  podiumRankBronze: {
    backgroundColor: "#d97640",
  },
  podiumRankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  podiumValue: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: Spacing.sm,
  },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  podiumBarGold: {
    height: 80,
    backgroundColor: "#eab30830",
  },
  podiumBarSilver: {
    height: 60,
    backgroundColor: "#94a3b820",
  },
  podiumBarBronze: {
    height: 40,
    backgroundColor: "#d9764020",
  },
  listSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listItemHighlight: {
    borderWidth: 1,
    borderColor: AppColors.primary + "40",
  },
  rankContainer: {
    width: 32,
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },
  rankNumberHighlight: {
    color: AppColors.primary,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  listPosition: {
    fontSize: 12,
    color: "#64748b",
  },
  listStats: {
    alignItems: "flex-end",
  },
  listValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  trendContainer: {
    marginTop: 2,
  },
});
