import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  getAllABTests,
  getTestResults,
  pauseTest,
  resumeTest,
  deleteTest,
  type ABTest,
  type ABTestResult,
} from "@/lib/ab-testing";

export default function ABTestingScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<ABTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const allTests = await getAllABTests();
      setTests(allTests);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTest = async (test: ABTest) => {
    setSelectedTest(test);
    const results = await getTestResults(test.id);
    setTestResults(results);
  };

  const handlePauseResume = async (test: ABTest) => {
    if (test.status === "running") {
      await pauseTest(test.id);
    } else if (test.status === "paused") {
      await resumeTest(test.id);
    }
    await loadTests();
  };

  const handleDelete = (test: ABTest) => {
    Alert.alert("Usuń test", "Czy na pewno chcesz usunąć ten test A/B?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          await deleteTest(test.id);
          setSelectedTest(null);
          await loadTests();
        },
      },
    ]);
  };

  const getStatusColor = (status: ABTest["status"]) => {
    switch (status) {
      case "running":
        return AppColors.success;
      case "completed":
        return AppColors.primary;
      case "paused":
        return AppColors.warning;
      default:
        return "#64748b";
    }
  };

  const getStatusLabel = (status: ABTest["status"]) => {
    switch (status) {
      case "running":
        return "Aktywny";
      case "completed":
        return "Zakończony";
      case "paused":
        return "Wstrzymany";
      default:
        return status;
    }
  };

  if (!isAuthenticated || !user?.isMasterAdmin) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="lock" size={48} color="#64748b" />
        <ThemedText style={styles.emptyText}>
          Brak dostępu - wymagane uprawnienia Master Admin
        </ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Testy A/B</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{tests.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Wszystkie testy</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {tests.filter((t) => t.status === "running").length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Aktywne</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {tests.filter((t) => t.status === "completed").length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Zakończone</ThemedText>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="science" size={24} color={AppColors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Jak działają testy A/B?</ThemedText>
            <ThemedText style={styles.infoText}>
              System automatycznie testuje różne warianty reklam i wybiera najlepszy
              na podstawie współczynnika klikalności (CTR). Wykorzystuje algorytm
              Thompson Sampling dla optymalnej eksploracji.
            </ThemedText>
          </View>
        </View>

        {/* Tests List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Testy</ThemedText>

          {tests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="science" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak testów A/B</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Testy A/B są tworzone automatycznie przy dodawaniu wariantów reklam
              </ThemedText>
            </View>
          ) : (
            tests.map((test) => (
              <Pressable
                key={test.id}
                style={[
                  styles.testCard,
                  selectedTest?.id === test.id && styles.testCardSelected,
                ]}
                onPress={() => handleSelectTest(test)}
              >
                <View style={styles.testHeader}>
                  <View style={styles.testInfo}>
                    <ThemedText style={styles.testName}>{test.name}</ThemedText>
                    <View style={styles.testMeta}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(test.status) + "20" },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(test.status) },
                          ]}
                        />
                        <ThemedText
                          style={[
                            styles.statusText,
                            { color: getStatusColor(test.status) },
                          ]}
                        >
                          {getStatusLabel(test.status)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.variantCount}>
                        {test.variants.length} warianty
                      </ThemedText>
                    </View>
                  </View>
                  <MaterialIcons
                    name={selectedTest?.id === test.id ? "expand-less" : "expand-more"}
                    size={24}
                    color="#64748b"
                  />
                </View>

                {selectedTest?.id === test.id && (
                  <View style={styles.testDetails}>
                    {/* Variants Results */}
                    <ThemedText style={styles.detailsTitle}>Wyniki wariantów</ThemedText>
                    {testResults.map((result, index) => (
                      <View key={result.variantId} style={styles.variantRow}>
                        <View style={styles.variantInfo}>
                          <View style={styles.variantHeader}>
                            <ThemedText style={styles.variantName}>
                              Wariant {index + 1}
                            </ThemedText>
                            {result.isWinner && (
                              <View style={styles.winnerBadge}>
                                <MaterialIcons name="emoji-events" size={14} color="#fbbf24" />
                                <ThemedText style={styles.winnerText}>Zwycięzca</ThemedText>
                              </View>
                            )}
                          </View>
                          <View style={styles.variantStats}>
                            <View style={styles.variantStat}>
                              <ThemedText style={styles.statNumber}>
                                {result.impressions}
                              </ThemedText>
                              <ThemedText style={styles.statName}>Wyświetlenia</ThemedText>
                            </View>
                            <View style={styles.variantStat}>
                              <ThemedText style={styles.statNumber}>{result.clicks}</ThemedText>
                              <ThemedText style={styles.statName}>Kliknięcia</ThemedText>
                            </View>
                            <View style={styles.variantStat}>
                              <ThemedText style={[styles.statNumber, styles.ctrValue]}>
                                {result.ctr.toFixed(2)}%
                              </ThemedText>
                              <ThemedText style={styles.statName}>CTR</ThemedText>
                            </View>
                          </View>
                          {/* CTR Bar */}
                          <View style={styles.ctrBarContainer}>
                            <View
                              style={[
                                styles.ctrBar,
                                {
                                  width: `${Math.min(result.ctr * 10, 100)}%`,
                                  backgroundColor: result.isWinner
                                    ? AppColors.success
                                    : AppColors.primary,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Actions */}
                    <View style={styles.testActions}>
                      {test.status !== "completed" && (
                        <Pressable
                          style={[
                            styles.actionButton,
                            test.status === "running"
                              ? styles.pauseButton
                              : styles.resumeButton,
                          ]}
                          onPress={() => handlePauseResume(test)}
                        >
                          <MaterialIcons
                            name={test.status === "running" ? "pause" : "play-arrow"}
                            size={18}
                            color="#fff"
                          />
                          <ThemedText style={styles.actionText}>
                            {test.status === "running" ? "Wstrzymaj" : "Wznów"}
                          </ThemedText>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(test)}
                      >
                        <MaterialIcons name="delete" size={18} color="#fff" />
                        <ThemedText style={styles.actionText}>Usuń</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
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
    lineHeight: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94a3b8",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  testCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  testCardSelected: {
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  testMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  variantCount: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  testDetails: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  detailsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  variantRow: {
    backgroundColor: AppColors.bgDark,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  variantInfo: {
    flex: 1,
  },
  variantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  variantName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#fff",
  },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fbbf24" + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  winnerText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "#fbbf24",
  },
  variantStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  variantStat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  statName: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
  },
  ctrValue: {
    color: AppColors.primary,
  },
  ctrBarContainer: {
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    overflow: "hidden",
  },
  ctrBar: {
    height: "100%",
    borderRadius: 2,
  },
  testActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  pauseButton: {
    backgroundColor: AppColors.warning,
  },
  resumeButton: {
    backgroundColor: AppColors.success,
  },
  deleteButton: {
    backgroundColor: AppColors.danger,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
  },
});
