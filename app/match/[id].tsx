import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { addMatchToCalendar } from "@/lib/system-calendar";
import { SocialShareCard } from "@/components/social-share-card";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const matchId = parseInt(id || "0", 10);
  
  // Social share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState<"result" | "preview" | "stats">("result");

  const { data: match, isLoading } = trpc.matches.get.useQuery(
    { id: matchId },
    { enabled: !!matchId && isAuthenticated }
  );

  // Get club data for logo
  const { data: clubs } = trpc.clubs.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const club = clubs?.[0]; // Use first club

  const deleteMutation = trpc.matches.delete.useMutation({
    onSuccess: () => {
      utils.matches.list.invalidate();
      utils.calendar.getEvents.invalidate();
      Alert.alert("Sukces", "Mecz został usunięty", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Usuń mecz",
      "Czy na pewno chcesz usunąć ten mecz?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: matchId }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  if (!match) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="sports-soccer" size={64} color="#334155" />
        <ThemedText style={styles.notFoundText}>Nie znaleziono meczu</ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const matchDate = new Date(match.matchDate);
  const isUpcoming = matchDate >= new Date();
  const resultColor =
    match.result === "win"
      ? AppColors.success
      : match.result === "loss"
      ? AppColors.danger
      : AppColors.warning;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Szczegóły meczu</ThemedText>
        <Pressable onPress={() => router.push(`/match/edit/${matchId}` as any)} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Match Card */}
        <View style={styles.matchCard}>
          <View style={[styles.homeAwayBadge, { backgroundColor: match.homeAway === "home" ? AppColors.primary + "20" : AppColors.secondary + "20" }]}>
            <ThemedText style={[styles.homeAwayText, { color: match.homeAway === "home" ? AppColors.primary : AppColors.secondary }]}>
              {match.homeAway === "home" ? "MECZ U SIEBIE" : "MECZ WYJAZDOWY"}
            </ThemedText>
          </View>

          <View style={styles.teamsContainer}>
            <View style={styles.teamBox}>
              <View style={styles.teamIcon}>
                <MaterialIcons name="shield" size={32} color={AppColors.primary} />
              </View>
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

            <View style={styles.teamBox}>
              <View style={[styles.teamIcon, { backgroundColor: "#475569" }]}>
                <MaterialIcons name="shield" size={32} color="#94a3b8" />
              </View>
              <ThemedText style={styles.teamName}>{match.opponent}</ThemedText>
            </View>
          </View>

          {!isUpcoming && match.result && (
            <View style={[styles.resultBadge, { backgroundColor: resultColor + "20" }]}>
              <ThemedText style={[styles.resultText, { color: resultColor }]}>
                {match.result === "win" ? "WYGRANA" : match.result === "loss" ? "PRZEGRANA" : "REMIS"}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Match Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color="#64748b" />
              <ThemedText style={styles.infoText}>
                {matchDate.toLocaleDateString("pl-PL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </ThemedText>
            </View>
            {match.matchTime && (
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>{match.matchTime}</ThemedText>
              </View>
            )}
            {match.location && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>{match.location}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Call-ups Section */}
        {isUpcoming && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Powołania</ThemedText>
            <Pressable
              style={styles.callupButton}
              onPress={() => router.push({ pathname: '/callups', params: { matchId: matchId.toString() } } as any)}
            >
              <MaterialIcons name="people" size={24} color={AppColors.primary} />
              <View style={styles.callupInfo}>
                <ThemedText style={styles.callupTitle}>Zarządzaj powołaniami</ThemedText>
                <ThemedText style={styles.callupHint}>Wybierz zawodników na mecz</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* Add to Calendar */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kalendarz</ThemedText>
          <Pressable
            style={styles.callupButton}
            onPress={async () => {
              const eventId = await addMatchToCalendar(
                match.opponent,
                new Date(match.matchDate),
                match.matchTime,
                match.location,
                match.homeAway === 'home'
              );
              if (eventId) {
                Alert.alert('Sukces', 'Mecz został dodany do kalendarza systemowego');
              }
            }}
          >
            <MaterialIcons name="event" size={24} color={AppColors.secondary} />
            <View style={styles.callupInfo}>
              <ThemedText style={styles.callupTitle}>Dodaj do kalendarza</ThemedText>
              <ThemedText style={styles.callupHint}>Eksportuj do kalendarza iOS/Android</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </Pressable>
        </View>

        {/* Social Media Share */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Udostępnij</ThemedText>
          <Pressable
            style={styles.callupButton}
            onPress={() => {
              setShareType(match.goalsScored !== null ? "result" : "preview");
              setShowShareModal(true);
            }}
          >
            <MaterialIcons name="share" size={24} color="#E4405F" />
            <View style={styles.callupInfo}>
              <ThemedText style={styles.callupTitle}>Udostępnij na social media</ThemedText>
              <ThemedText style={styles.callupHint}>Facebook, Instagram z logo SKM</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </Pressable>
          
          <View style={styles.shareOptions}>
            <Pressable
              style={[styles.shareOption, shareType === "result" && styles.shareOptionActive]}
              onPress={() => {
                setShareType("result");
                setShowShareModal(true);
              }}
            >
              <MaterialIcons name="emoji-events" size={20} color={shareType === "result" ? AppColors.primary : "#64748b"} />
              <ThemedText style={[styles.shareOptionText, shareType === "result" && styles.shareOptionTextActive]}>
                Wynik
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.shareOption, shareType === "preview" && styles.shareOptionActive]}
              onPress={() => {
                setShareType("preview");
                setShowShareModal(true);
              }}
            >
              <MaterialIcons name="event" size={20} color={shareType === "preview" ? AppColors.primary : "#64748b"} />
              <ThemedText style={[styles.shareOptionText, shareType === "preview" && styles.shareOptionTextActive]}>
                Zapowiedź
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.shareOption, shareType === "stats" && styles.shareOptionActive]}
              onPress={() => {
                setShareType("stats");
                setShowShareModal(true);
              }}
            >
              <MaterialIcons name="bar-chart" size={20} color={shareType === "stats" ? AppColors.primary : "#64748b"} />
              <ThemedText style={[styles.shareOptionText, shareType === "stats" && styles.shareOptionTextActive]}>
                Statystyki
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        {match.notes && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notatki</ThemedText>
            <View style={styles.notesCard}>
              <ThemedText style={styles.notesText}>{match.notes}</ThemedText>
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator color={AppColors.danger} />
            ) : (
              <>
                <MaterialIcons name="delete" size={20} color={AppColors.danger} />
                <ThemedText style={styles.deleteText}>Usuń mecz</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Social Share Modal */}
      <SocialShareCard
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        matchData={{
          id: match.id,
          opponent: match.opponent,
          goalsScored: match.goalsScored,
          goalsConceded: match.goalsConceded,
          result: match.result as "win" | "draw" | "loss" | null,
          homeAway: match.homeAway as "home" | "away",
          matchDate: match.matchDate.toString(),
          matchTime: match.matchTime,
          location: match.location,
          league: match.season,
          clubName: club?.name || "Mój Klub",
          clubLogo: club?.logoUrl || undefined,
          scorers: [],
          stats: {
            totalGoals: match.goalsScored || 0,
            totalAssists: 0,
            yellowCards: 0,
            redCards: 0,
            saves: 0,
          },
        }}
        type={shareType}
        clubColors={club ? {
          primary: club.primaryColor || "#22c55e",
          secondary: club.secondaryColor || "#1e3a5f",
          accent: club.accentColor || "#ffffff",
        } : undefined}
      />
    </ThemedView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  matchCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  homeAwayBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  homeAwayText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Spacing.lg,
  },
  teamBox: {
    flex: 1,
    alignItems: "center",
  },
  teamIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  vsContainer: {
    paddingHorizontal: Spacing.md,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748b",
  },
  scoreContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  resultBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  resultText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoText: {
    fontSize: 15,
    color: "#e2e8f0",
    textTransform: "capitalize",
  },
  callupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  callupInfo: {
    flex: 1,
  },
  callupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  callupHint: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  notesText: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 22,
  },
  dangerZone: {
    marginTop: Spacing.lg,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.danger + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.danger,
  },
  notFoundText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backButtonLarge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  shareOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  shareOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  shareOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "15",
  },
  shareOptionText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  shareOptionTextActive: {
    color: AppColors.primary,
  },
});
