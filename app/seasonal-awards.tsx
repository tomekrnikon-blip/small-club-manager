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

type AwardType = "mvp" | "top_scorer" | "best_attendance" | "most_improved" | "best_defender" | "best_goalkeeper" | "fair_play";

interface Award {
  id: number;
  playerId: number;
  playerName: string;
  season: string;
  awardType: AwardType;
  title: string;
  description?: string;
  stats?: string;
  awardedAt: string;
}

const AWARD_INFO: Record<AwardType, { icon: keyof typeof MaterialIcons.glyphMap; color: string; label: string }> = {
  mvp: { icon: "star", color: "#eab308", label: "MVP Sezonu" },
  top_scorer: { icon: "sports-soccer", color: "#22c55e", label: "Król Strzelców" },
  best_attendance: { icon: "fitness-center", color: "#a855f7", label: "Najlepsza Frekwencja" },
  most_improved: { icon: "trending-up", color: "#3b82f6", label: "Największy Postęp" },
  best_defender: { icon: "shield", color: "#06b6d4", label: "Najlepszy Obrońca" },
  best_goalkeeper: { icon: "sports-handball", color: "#f97316", label: "Najlepszy Bramkarz" },
  fair_play: { icon: "handshake", color: "#10b981", label: "Fair Play" },
};

export default function SeasonalAwardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedSeason, setSelectedSeason] = useState("2024/2025");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const seasons = ["2024/2025", "2023/2024", "2022/2023"];

  // Mock awards data based on players
  const generateAwards = (): Award[] => {
    if (!players || players.length < 3) return [];
    
    const awards: Award[] = [];
    const awardTypes: AwardType[] = ["mvp", "top_scorer", "best_attendance", "most_improved", "best_defender", "fair_play"];
    
    awardTypes.forEach((type, index) => {
      const player = players[index % players.length];
      awards.push({
        id: index + 1,
        playerId: player.id,
        playerName: player.name,
        season: selectedSeason,
        awardType: type,
        title: AWARD_INFO[type].label,
        description: `Wyróżnienie za sezon ${selectedSeason}`,
        stats: type === "top_scorer" ? "15 bramek" : type === "best_attendance" ? "95% obecności" : undefined,
        awardedAt: new Date().toISOString(),
      });
    });
    
    return awards;
  };

  const awards = generateAwards();

  // Group awards by type for display
  const mvpAward = awards.find(a => a.awardType === "mvp");
  const otherAwards = awards.filter(a => a.awardType !== "mvp");

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
        <ThemedText style={styles.headerTitle}>Nagrody sezonowe</ThemedText>
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

        {/* MVP Card - Featured */}
        {mvpAward && (
          <View style={styles.mvpCard}>
            <View style={styles.mvpBadge}>
              <MaterialIcons name="star" size={32} color="#eab308" />
            </View>
            <ThemedText style={styles.mvpLabel}>MVP SEZONU</ThemedText>
            <View style={styles.mvpAvatar}>
              <ThemedText style={styles.mvpAvatarText}>
                {mvpAward.playerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </ThemedText>
            </View>
            <ThemedText style={styles.mvpName}>{mvpAward.playerName}</ThemedText>
            <ThemedText style={styles.mvpSeason}>{mvpAward.season}</ThemedText>
            <View style={styles.mvpStars}>
              {[1, 2, 3, 4, 5].map(i => (
                <MaterialIcons key={i} name="star" size={20} color="#eab308" />
              ))}
            </View>
          </View>
        )}

        {/* Other Awards Grid */}
        <ThemedText style={styles.sectionTitle}>Pozostałe wyróżnienia</ThemedText>
        
        <View style={styles.awardsGrid}>
          {otherAwards.map(award => {
            const info = AWARD_INFO[award.awardType];
            
            return (
              <View key={award.id} style={styles.awardCard}>
                <View style={[styles.awardIcon, { backgroundColor: info.color + "20" }]}>
                  <MaterialIcons name={info.icon} size={28} color={info.color} />
                </View>
                <ThemedText style={styles.awardTitle}>{info.label}</ThemedText>
                <View style={styles.awardPlayerAvatar}>
                  <ThemedText style={styles.awardPlayerAvatarText}>
                    {award.playerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.awardPlayerName} numberOfLines={1}>
                  {award.playerName}
                </ThemedText>
                {award.stats && (
                  <ThemedText style={[styles.awardStats, { color: info.color }]}>
                    {award.stats}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>

        {/* Hall of Fame Link */}
        <Pressable style={styles.hallOfFameBtn}>
          <MaterialIcons name="emoji-events" size={24} color="#eab308" />
          <View style={styles.hallOfFameInfo}>
            <ThemedText style={styles.hallOfFameTitle}>Galeria sław</ThemedText>
            <ThemedText style={styles.hallOfFameSubtitle}>
              Zobacz wszystkich laureatów
            </ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </Pressable>

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
  mvpCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#eab30840",
  },
  mvpBadge: {
    position: "absolute",
    top: -16,
    backgroundColor: "#1e293b",
    padding: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: "#eab308",
  },
  mvpLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#eab308",
    letterSpacing: 2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  mvpAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eab30830",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: "#eab308",
  },
  mvpAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#eab308",
  },
  mvpName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  mvpSeason: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  mvpStars: {
    flexDirection: "row",
    gap: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  awardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
  },
  awardCard: {
    width: "50%",
    padding: Spacing.sm,
  },
  awardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  awardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  awardPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  awardPlayerAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  awardPlayerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
  },
  awardStats: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  hallOfFameBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  hallOfFameInfo: {
    flex: 1,
  },
  hallOfFameTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  hallOfFameSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
});
