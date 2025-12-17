import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function AddPlayerStatsScreen() {
  const { playerId, matchId } = useLocalSearchParams<{ playerId?: string; matchId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const playerIdNum = parseInt(playerId || "0", 10);
  const matchIdNum = matchId ? parseInt(matchId, 10) : undefined;

  const [stats, setStats] = useState({
    goals: 0,
    assists: 0,
    minutesPlayed: 0,
    yellowCards: 0,
    redCards: 0,
    // Goalkeeper specific
    saves: 0,
    goalsConceded: 0,
    cleanSheet: false,
  });

  const { data: player } = trpc.players.get.useQuery(
    { id: playerIdNum },
    { enabled: !!playerIdNum }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: 1 }, // Will be replaced with actual clubId
    { enabled: !matchIdNum }
  );

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(matchIdNum || null);

  const addStatsMutation = trpc.players.addMatchStats.useMutation({
    onSuccess: () => {
      Alert.alert("Sukces", "Statystyki zostały zapisane", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message || "Wystąpił błąd");
    },
  });

  const handleSave = () => {
    if (!selectedMatchId) {
      Alert.alert("Błąd", "Wybierz mecz");
      return;
    }

    addStatsMutation.mutate({
      playerId: playerIdNum,
      matchId: selectedMatchId,
      ...stats,
    });
  };

  const isGoalkeeper = player?.position?.toLowerCase() === "bramkarz";

  const updateStat = (key: keyof typeof stats, value: number | boolean) => {
    setStats((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Stack.Screen options={{ title: "Dodaj statystyki" }} />

      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Player Info */}
          {player && (
            <View style={styles.playerCard}>
              <View style={styles.playerAvatar}>
                <ThemedText style={styles.playerInitials}>
                  {player.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
              </View>
            </View>
          )}

          {/* Match Selection */}
          {!matchIdNum && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Wybierz mecz</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.matchesRow}>
                  {matches?.map((match: any) => (
                    <Pressable
                      key={match.id}
                      style={[
                        styles.matchChip,
                        selectedMatchId === match.id && styles.matchChipSelected,
                      ]}
                      onPress={() => setSelectedMatchId(match.id)}
                    >
                      <ThemedText
                        style={[
                          styles.matchChipText,
                          selectedMatchId === match.id && styles.matchChipTextSelected,
                        ]}
                      >
                        vs {match.opponent}
                      </ThemedText>
                      <ThemedText style={styles.matchChipDate}>
                        {new Date(match.matchDate).toLocaleDateString("pl-PL")}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Basic Stats */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Statystyki podstawowe</ThemedText>

            <View style={styles.statsGrid}>
              <StatInput
                icon="sports-soccer"
                label="Bramki"
                value={stats.goals}
                onChange={(v) => updateStat("goals", v)}
              />
              <StatInput
                icon="handshake"
                label="Asysty"
                value={stats.assists}
                onChange={(v) => updateStat("assists", v)}
              />
              <StatInput
                icon="timer"
                label="Minuty"
                value={stats.minutesPlayed}
                onChange={(v) => updateStat("minutesPlayed", v)}
                max={120}
              />
            </View>
          </View>

          {/* Cards */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Kartki</ThemedText>

            <View style={styles.statsGrid}>
              <StatInput
                icon="square"
                label="Żółte kartki"
                value={stats.yellowCards}
                onChange={(v) => updateStat("yellowCards", v)}
                color="#eab308"
                max={2}
              />
              <StatInput
                icon="square"
                label="Czerwone kartki"
                value={stats.redCards}
                onChange={(v) => updateStat("redCards", v)}
                color="#ef4444"
                max={1}
              />
            </View>
          </View>

          {/* Goalkeeper Stats */}
          {isGoalkeeper && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Statystyki bramkarza</ThemedText>

              <View style={styles.statsGrid}>
                <StatInput
                  icon="sports-handball"
                  label="Interwencje"
                  value={stats.saves}
                  onChange={(v) => updateStat("saves", v)}
                />
                <StatInput
                  icon="gpp-bad"
                  label="Stracone bramki"
                  value={stats.goalsConceded}
                  onChange={(v) => updateStat("goalsConceded", v)}
                />
              </View>

              <Pressable
                style={[styles.cleanSheetToggle, stats.cleanSheet && styles.cleanSheetToggleActive]}
                onPress={() => updateStat("cleanSheet", !stats.cleanSheet)}
              >
                <MaterialIcons
                  name={stats.cleanSheet ? "check-circle" : "radio-button-unchecked"}
                  size={24}
                  color={stats.cleanSheet ? AppColors.success : "#64748b"}
                />
                <ThemedText
                  style={[styles.cleanSheetText, stats.cleanSheet && styles.cleanSheetTextActive]}
                >
                  Czyste konto
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={[styles.saveButton, addStatsMutation.isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={addStatsMutation.isPending}
          >
            {addStatsMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Zapisz statystyki</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </>
  );
}

function StatInput({
  icon,
  label,
  value,
  onChange,
  color = AppColors.primary,
  max,
}: {
  icon: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  max?: number;
}) {
  const increment = () => {
    if (max === undefined || value < max) {
      onChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > 0) {
      onChange(value - 1);
    }
  };

  return (
    <View style={styles.statInputContainer}>
      <View style={styles.statInputHeader}>
        <MaterialIcons name={icon as any} size={20} color={color} />
        <ThemedText style={styles.statInputLabel}>{label}</ThemedText>
      </View>

      <View style={styles.statInputControls}>
        <Pressable style={styles.statInputButton} onPress={decrement}>
          <MaterialIcons name="remove" size={24} color="#fff" />
        </Pressable>

        <TextInput
          style={styles.statInputValue}
          value={value.toString()}
          onChangeText={(t) => {
            const num = parseInt(t) || 0;
            if (max === undefined || num <= max) {
              onChange(num);
            }
          }}
          keyboardType="numeric"
        />

        <Pressable style={styles.statInputButton} onPress={increment}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  playerInitials: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primary,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 14,
    color: "#94a3b8",
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  matchChip: {
    backgroundColor: AppColors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  matchChipSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "20",
  },
  matchChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  matchChipTextSelected: {
    color: AppColors.primary,
  },
  matchChipDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statInputContainer: {
    width: "48%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statInputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  statInputLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  statInputControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statInputButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  statInputValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    minWidth: 50,
  },
  cleanSheetToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  cleanSheetToggleActive: {
    backgroundColor: AppColors.success + "20",
  },
  cleanSheetText: {
    fontSize: 16,
    color: "#94a3b8",
  },
  cleanSheetTextActive: {
    color: AppColors.success,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.bgDark,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
