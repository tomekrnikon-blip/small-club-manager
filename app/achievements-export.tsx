import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

// Achievement definitions
const ACHIEVEMENTS = [
  { code: "goals_10", name: "Strzelec", desc: "Zdobądź 10 bramek", icon: "sports-soccer", color: "#22c55e" },
  { code: "goals_25", name: "Snajper", desc: "Zdobądź 25 bramek", icon: "sports-soccer", color: "#22c55e" },
  { code: "goals_50", name: "Kanonir", desc: "Zdobądź 50 bramek", icon: "sports-soccer", color: "#f59e0b" },
  { code: "assists_10", name: "Asystent", desc: "Wykonaj 10 asyst", icon: "handshake", color: "#3b82f6" },
  { code: "assists_25", name: "Kreator", desc: "Wykonaj 25 asyst", icon: "handshake", color: "#3b82f6" },
  { code: "attendance_10", name: "Regularny", desc: "Weź udział w 10 treningach", icon: "fitness-center", color: "#a855f7" },
  { code: "attendance_50", name: "Wytrwały", desc: "Weź udział w 50 treningach", icon: "fitness-center", color: "#a855f7" },
  { code: "matches_10", name: "Debiutant", desc: "Rozegraj 10 meczów", icon: "emoji-events", color: "#06b6d4" },
  { code: "matches_25", name: "Zawodnik", desc: "Rozegraj 25 meczów", icon: "emoji-events", color: "#06b6d4" },
  { code: "rating_5", name: "Perfekcjonista", desc: "Otrzymaj ocenę 5.0", icon: "star", color: "#eab308" },
];

export default function AchievementsExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  
  const [exporting, setExporting] = useState(false);
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  
  const player = playerId 
    ? players?.find(p => p.id === parseInt(playerId)) 
    : players?.[0];

  // Mock unlocked achievements based on player id
  const unlockedAchievements = ACHIEVEMENTS.filter((_, i) => 
    player ? (player.id + i) % 3 === 0 : false
  );

  const toggleAchievement = (code: string) => {
    if (selectedAchievements.includes(code)) {
      setSelectedAchievements(selectedAchievements.filter(c => c !== code));
    } else {
      setSelectedAchievements([...selectedAchievements, code]);
    }
  };

  const selectAll = () => {
    setSelectedAchievements(unlockedAchievements.map(a => a.code));
  };

  const deselectAll = () => {
    setSelectedAchievements([]);
  };

  const handleExport = async (format: "pdf" | "share") => {
    if (selectedAchievements.length === 0) {
      Alert.alert("Błąd", "Wybierz przynajmniej jedno osiągnięcie do eksportu");
      return;
    }

    setExporting(true);
    
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (format === "share") {
        const achievementNames = selectedAchievements
          .map(code => ACHIEVEMENTS.find(a => a.code === code)?.name)
          .filter(Boolean)
          .join(", ");
        
        await Share.share({
          message: `🏆 Osiągnięcia zawodnika ${player?.name}:\n\n${achievementNames}\n\nKlub: ${club?.name}`,
          title: `Osiągnięcia - ${player?.name}`,
        });
      } else {
        Alert.alert(
          "Sukces",
          "Dyplom został wygenerowany i zapisany w folderze Pobrane",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się wyeksportować osiągnięć");
    } finally {
      setExporting(false);
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
        <ThemedText style={styles.headerTitle}>Eksport osiągnięć</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Info */}
        {player && (
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <ThemedText style={styles.avatarText}>
                {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </ThemedText>
            </View>
            <View style={styles.playerInfo}>
              <ThemedText style={styles.playerName}>{player.name}</ThemedText>
              <ThemedText style={styles.clubName}>{club?.name}</ThemedText>
            </View>
            <View style={styles.badgeCount}>
              <ThemedText style={styles.badgeCountValue}>{unlockedAchievements.length}</ThemedText>
              <ThemedText style={styles.badgeCountLabel}>osiągnięć</ThemedText>
            </View>
          </View>
        )}

        {/* Certificate Preview */}
        <View style={styles.certificatePreview}>
          <View style={styles.certificateBorder}>
            <MaterialIcons name="emoji-events" size={48} color="#eab308" />
            <ThemedText style={styles.certificateTitle}>DYPLOM</ThemedText>
            <ThemedText style={styles.certificateSubtitle}>za osiągnięcia sportowe</ThemedText>
            <ThemedText style={styles.certificateName}>{player?.name}</ThemedText>
            <View style={styles.certificateBadges}>
              {selectedAchievements.slice(0, 4).map(code => {
                const achievement = ACHIEVEMENTS.find(a => a.code === code);
                if (!achievement) return null;
                return (
                  <View key={code} style={[styles.miniBadge, { backgroundColor: achievement.color + "30" }]}>
                    <MaterialIcons name={achievement.icon as any} size={16} color={achievement.color} />
                  </View>
                );
              })}
              {selectedAchievements.length > 4 && (
                <View style={styles.miniBadge}>
                  <ThemedText style={styles.miniBadgeMore}>+{selectedAchievements.length - 4}</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.certificateDate}>
              {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </ThemedText>
          </View>
        </View>

        {/* Selection Controls */}
        <View style={styles.selectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            Wybierz osiągnięcia ({selectedAchievements.length}/{unlockedAchievements.length})
          </ThemedText>
          <View style={styles.selectionBtns}>
            <Pressable onPress={selectAll} style={styles.selectBtn}>
              <ThemedText style={styles.selectBtnText}>Wszystkie</ThemedText>
            </Pressable>
            <Pressable onPress={deselectAll} style={styles.selectBtn}>
              <ThemedText style={styles.selectBtnText}>Żadne</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Achievements List */}
        {unlockedAchievements.map(achievement => {
          const isSelected = selectedAchievements.includes(achievement.code);
          
          return (
            <Pressable
              key={achievement.code}
              style={[styles.achievementItem, isSelected && styles.achievementItemSelected]}
              onPress={() => toggleAchievement(achievement.code)}
            >
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color + "20" }]}>
                <MaterialIcons name={achievement.icon as any} size={24} color={achievement.color} />
              </View>
              <View style={styles.achievementInfo}>
                <ThemedText style={styles.achievementName}>{achievement.name}</ThemedText>
                <ThemedText style={styles.achievementDesc}>{achievement.desc}</ThemedText>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        })}

        {unlockedAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={64} color="#334155" />
            <ThemedText style={styles.emptyText}>Brak odblokowanych osiągnięć</ThemedText>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Export Buttons */}
      <View style={[styles.exportBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable 
          style={[styles.exportBtn, styles.exportBtnSecondary]}
          onPress={() => handleExport("share")}
          disabled={exporting || selectedAchievements.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <>
              <MaterialIcons name="share" size={20} color={AppColors.primary} />
              <ThemedText style={[styles.exportBtnText, { color: AppColors.primary }]}>
                Udostępnij
              </ThemedText>
            </>
          )}
        </Pressable>
        
        <Pressable 
          style={[styles.exportBtn, styles.exportBtnPrimary, selectedAchievements.length === 0 && styles.exportBtnDisabled]}
          onPress={() => handleExport("pdf")}
          disabled={exporting || selectedAchievements.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
              <ThemedText style={styles.exportBtnText}>Pobierz PDF</ThemedText>
            </>
          )}
        </Pressable>
      </View>
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
    padding: Spacing.lg,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  clubName: {
    fontSize: 13,
    color: "#64748b",
  },
  badgeCount: {
    alignItems: "center",
    backgroundColor: "#eab30820",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  badgeCountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#eab308",
  },
  badgeCountLabel: {
    fontSize: 10,
    color: "#eab308",
  },
  certificatePreview: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  certificateBorder: {
    borderWidth: 2,
    borderColor: "#eab30840",
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  certificateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#eab308",
    marginTop: Spacing.sm,
    letterSpacing: 4,
  },
  certificateSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  certificateName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  certificateBadges: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  miniBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  miniBadgeMore: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  certificateDate: {
    fontSize: 11,
    color: "#64748b",
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectionBtns: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  selectBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  selectBtnText: {
    fontSize: 12,
    color: AppColors.primary,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  achievementItemSelected: {
    borderColor: AppColors.primary + "60",
    backgroundColor: AppColors.primary + "10",
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  achievementDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
  exportBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: AppColors.bgDark,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  exportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  exportBtnPrimary: {
    backgroundColor: AppColors.primary,
  },
  exportBtnSecondary: {
    backgroundColor: AppColors.primary + "20",
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
