import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLoginUrl } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function HomeScreen() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: clubs, refetch: refetchClubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: financeSummary } = trpc.finances.getSummary.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchClubs();
    setRefreshing(false);
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const loginUrl = getLoginUrl();

      if (Platform.OS === "web") {
        window.location.href = loginUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, undefined, {
        preferEphemeralSession: false,
        showInRecents: true,
      });

      if (result.type === "success" && result.url) {
        let url: URL;
        if (result.url.startsWith("exp://") || result.url.startsWith("exps://")) {
          const urlStr = result.url.replace(/^exp(s)?:\/\//, "http://");
          url = new URL(urlStr);
        } else {
          url = new URL(result.url);
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (code && state) {
          router.push({
            pathname: "/oauth/callback" as any,
            params: { code, state },
          });
        }
      }
    } catch (error) {
      console.error("[Auth] Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Not authenticated - show welcome screen
  if (!isAuthenticated && !loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.welcomeContainer}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.welcomeTitle}>Small Club Manager</ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            Kompleksowe zarządzanie klubem sportowym
          </ThemedText>
          
          <View style={styles.featureList}>
            <FeatureItem icon="people" text="Zarządzanie zawodnikami" />
            <FeatureItem icon="sports-soccer" text="Statystyki meczowe" />
            <FeatureItem icon="calendar-today" text="Kalendarz wydarzeń" />
            <FeatureItem icon="attach-money" text="Kontrola finansów" />
            <FeatureItem icon="school" text="Szkółka piłkarska" />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={isLoggingIn}
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginText}>Zaloguj się</ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  // No club - show create club prompt
  if (!club) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.noClubContainer}>
          <MaterialIcons name="add-business" size={80} color={AppColors.primary} />
          <ThemedText style={styles.noClubTitle}>Witaj, {user?.name || "Użytkowniku"}!</ThemedText>
          <ThemedText style={styles.noClubText}>
            Nie masz jeszcze klubu. Utwórz swój pierwszy klub, aby rozpocząć.
          </ThemedText>
          <Pressable
            style={styles.createClubButton}
            onPress={() => router.push("/club/create" as any)}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <ThemedText style={styles.createClubText}>Utwórz klub</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // Main dashboard
  const upcomingMatches = matches?.filter(m => new Date(m.matchDate) >= new Date()).slice(0, 3) || [];
  const recentMatches = matches?.filter(m => new Date(m.matchDate) < new Date()).slice(0, 3) || [];
  const totalPlayers = players?.length || 0;
  const wins = matches?.filter(m => m.result === "win").length || 0;
  const draws = matches?.filter(m => m.result === "draw").length || 0;
  const losses = matches?.filter(m => m.result === "loss").length || 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {club.logoUrl ? (
              <Image source={{ uri: club.logoUrl }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPlaceholder}>
                <MaterialIcons name="shield" size={32} color={AppColors.primary} />
              </View>
            )}
            <View>
              <ThemedText style={styles.clubName}>{club.name}</ThemedText>
              <ThemedText style={styles.clubLocation}>{club.city || club.location || "Polska"}</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push("/notifications" as any)} style={styles.headerButton}>
              <MaterialIcons name="notifications" size={24} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={logout} style={styles.headerButton}>
              <MaterialIcons name="logout" size={22} color={AppColors.danger} />
            </Pressable>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            label="Zawodnicy"
            value={totalPlayers.toString()}
            color={AppColors.secondary}
          />
          <StatCard
            icon="sports-soccer"
            label="Mecze"
            value={`${wins}W ${draws}R ${losses}P`}
            color={AppColors.primary}
          />
          <StatCard
            icon="account-balance-wallet"
            label="Bilans"
            value={`${((financeSummary?.balance || 0) / 100).toFixed(0)} zł`}
            color={financeSummary?.balance && financeSummary.balance >= 0 ? AppColors.success : AppColors.danger}
          />
        </View>

        {/* Upcoming Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Nadchodzące mecze</ThemedText>
            <Pressable onPress={() => router.push("/matches" as any)}>
              <ThemedText style={styles.seeAll}>Zobacz wszystkie</ThemedText>
            </Pressable>
          </View>
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} onPress={() => router.push(`/match/${match.id}` as any)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>Brak nadchodzących meczów</ThemedText>
            </View>
          )}
        </View>

        {/* Recent Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Ostatnie wyniki</ThemedText>
          </View>
          {recentMatches.length > 0 ? (
            recentMatches.map((match) => (
              <MatchCard key={match.id} match={match} onPress={() => router.push(`/match/${match.id}` as any)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>Brak rozegranych meczów</ThemedText>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Szybkie akcje</ThemedText>
          <View style={styles.quickActions}>
            <QuickAction icon="person-add" label="Dodaj zawodnika" onPress={() => router.push("/player/add" as any)} />
            <QuickAction icon="add-circle" label="Dodaj mecz" onPress={() => router.push("/match/add" as any)} />
            <QuickAction icon="fitness-center" label="Dodaj trening" onPress={() => router.push("/training/add" as any)} />
            <QuickAction icon="receipt" label="Dodaj transakcję" onPress={() => router.push("/finance/add" as any)} />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon as any} size={24} color={AppColors.primary} />
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function MatchCard({ match, onPress }: { match: any; onPress: () => void }) {
  const isUpcoming = new Date(match.matchDate) >= new Date();
  const resultColor = match.result === "win" ? AppColors.success : match.result === "loss" ? AppColors.danger : AppColors.warning;
  
  return (
    <Pressable style={styles.matchCard} onPress={onPress}>
      <View style={styles.matchInfo}>
        <ThemedText style={styles.matchOpponent}>{match.opponent}</ThemedText>
        <ThemedText style={styles.matchDate}>
          {new Date(match.matchDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          {match.matchTime && ` • ${match.matchTime}`}
        </ThemedText>
      </View>
      {isUpcoming ? (
        <View style={[styles.matchBadge, { backgroundColor: AppColors.secondary + "20" }]}>
          <ThemedText style={[styles.matchBadgeText, { color: AppColors.secondary }]}>
            {match.homeAway === "home" ? "DOM" : "WYJ"}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.matchScore, { backgroundColor: resultColor + "20" }]}>
          <ThemedText style={[styles.matchScoreText, { color: resultColor }]}>
            {match.goalsScored} : {match.goalsConceded}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <MaterialIcons name={icon as any} size={24} color={AppColors.primary} />
      </View>
      <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
    </Pressable>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  // Welcome screen
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  featureList: {
    width: "100%",
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: "#e2e8f0",
  },
  loginButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // No club screen
  noClubContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  noClubTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  noClubText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  createClubButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  createClubText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  clubLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },
  clubName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  clubLocation: {
    fontSize: 14,
    color: "#94a3b8",
  },
  notificationButton: {
    padding: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  seeAll: {
    fontSize: 14,
    color: AppColors.primary,
  },
  emptyState: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  // Match card
  matchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  matchDate: {
    fontSize: 14,
    color: "#94a3b8",
  },
  matchBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  matchScore: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  matchScoreText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Quick actions
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  quickAction: {
    width: "47%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: 14,
    color: "#e2e8f0",
    textAlign: "center",
  },
});
