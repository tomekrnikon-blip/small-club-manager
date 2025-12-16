import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AddMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [location, setLocation] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away">("home");
  const [goalsScored, setGoalsScored] = useState("");
  const [goalsConceded, setGoalsConceded] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const createMutation = trpc.matches.create.useMutation({
    onSuccess: () => {
      utils.matches.list.invalidate();
      utils.calendar.getEvents.invalidate();
      Alert.alert("Sukces", "Mecz został dodany!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleCreate = () => {
    if (!opponent.trim()) {
      Alert.alert("Błąd", "Podaj nazwę przeciwnika");
      return;
    }

    if (!matchDate) {
      Alert.alert("Błąd", "Podaj datę meczu (RRRR-MM-DD)");
      return;
    }

    if (!club?.id) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    createMutation.mutate({
      clubId: club.id,
      opponent: opponent.trim(),
      matchDate,
      matchTime: matchTime.trim() || undefined,
      location: location.trim() || undefined,
      homeAway,
      goalsScored: goalsScored ? parseInt(goalsScored, 10) : 0,
      goalsConceded: goalsConceded ? parseInt(goalsConceded, 10) : 0,
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Dodaj mecz</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Przeciwnik *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. KS Sparta Kraków"
              placeholderTextColor="#64748b"
              value={opponent}
              onChangeText={setOpponent}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Typ meczu *</ThemedText>
            <View style={styles.homeAwayRow}>
              <Pressable
                style={[styles.homeAwayButton, homeAway === "home" && styles.homeAwayButtonActive]}
                onPress={() => setHomeAway("home")}
              >
                <MaterialIcons
                  name="home"
                  size={24}
                  color={homeAway === "home" ? "#fff" : "#94a3b8"}
                />
                <ThemedText
                  style={[styles.homeAwayText, homeAway === "home" && styles.homeAwayTextActive]}
                >
                  U siebie
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.homeAwayButton, homeAway === "away" && styles.homeAwayButtonActive]}
                onPress={() => setHomeAway("away")}
              >
                <MaterialIcons
                  name="flight"
                  size={24}
                  color={homeAway === "away" ? "#fff" : "#94a3b8"}
                />
                <ThemedText
                  style={[styles.homeAwayText, homeAway === "away" && styles.homeAwayTextActive]}
                >
                  Wyjazd
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Data *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="RRRR-MM-DD"
                placeholderTextColor="#64748b"
                value={matchDate}
                onChangeText={setMatchDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Godzina</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="GG:MM"
                placeholderTextColor="#64748b"
                value={matchTime}
                onChangeText={setMatchTime}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Miejsce</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. Stadion Miejski"
              placeholderTextColor="#64748b"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Score Section */}
          <View style={styles.scoreSection}>
            <ThemedText style={styles.sectionTitle}>Wynik (opcjonalnie)</ThemedText>
            <ThemedText style={styles.sectionHint}>
              Zostaw puste dla meczów zaplanowanych
            </ThemedText>
            <View style={styles.scoreRow}>
              <View style={styles.scoreInput}>
                <ThemedText style={styles.scoreLabel}>My</ThemedText>
                <TextInput
                  style={styles.scoreField}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={goalsScored}
                  onChangeText={setGoalsScored}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <ThemedText style={styles.scoreSeparator}>:</ThemedText>
              <View style={styles.scoreInput}>
                <ThemedText style={styles.scoreLabel}>Oni</ThemedText>
                <TextInput
                  style={styles.scoreField}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={goalsConceded}
                  onChangeText={setGoalsConceded}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <ThemedText style={styles.submitText}>Dodaj mecz</ThemedText>
            </>
          )}
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
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  input: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  homeAwayRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  homeAwayButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  homeAwayButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  homeAwayText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "500",
  },
  homeAwayTextActive: {
    color: "#fff",
  },
  scoreSection: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: Spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  scoreInput: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  scoreField: {
    backgroundColor: AppColors.bgElevated,
    borderRadius: Radius.md,
    width: 80,
    height: 60,
    textAlign: "center",
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  scoreSeparator: {
    fontSize: 32,
    color: "#64748b",
    fontWeight: "bold",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
