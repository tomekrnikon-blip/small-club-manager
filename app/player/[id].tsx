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

const positionColors: Record<string, string> = {
  bramkarz: AppColors.goalkeeper,
  obrońca: AppColors.defender,
  pomocnik: AppColors.midfielder,
  napastnik: AppColors.forward,
};

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const playerId = parseInt(id || "0", 10);

  const { data: player, isLoading } = trpc.players.get.useQuery(
    { id: playerId },
    { enabled: !!playerId && isAuthenticated }
  );

  const { data: statsData } = trpc.players.getStats.useQuery(
    { playerId },
    { enabled: !!playerId && isAuthenticated }
  );

  // Get the first (current season) stats
  const stats = statsData?.[0];

  const deleteMutation = trpc.players.delete.useMutation({
    onSuccess: () => {
      utils.players.list.invalidate();
      Alert.alert("Sukces", "Zawodnik został usunięty", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Usuń zawodnika",
      "Czy na pewno chcesz usunąć tego zawodnika? Ta operacja jest nieodwracalna.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: playerId }),
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

  if (!player) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="person-off" size={64} color="#334155" />
        <ThemedText style={styles.notFoundText}>Nie znaleziono zawodnika</ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const positionColor = positionColors[player.position] || AppColors.primary;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Profil zawodnika</ThemedText>
        <Pressable onPress={() => router.push(`/player/edit/${playerId}` as any)} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Player Header Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: positionColor + "20" }]}>
            {player.jerseyNumber ? (
              <ThemedText style={[styles.avatarText, { color: positionColor }]}>
                {player.jerseyNumber}
              </ThemedText>
            ) : (
              <MaterialIcons name="person" size={40} color={positionColor} />
            )}
          </View>
          <ThemedText style={styles.playerName}>{player.name}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.positionBadge, { backgroundColor: positionColor + "20" }]}>
              <ThemedText style={[styles.positionText, { color: positionColor }]}>
                {player.position}
              </ThemedText>
            </View>
            {player.isAcademy && (
              <View style={styles.academyBadge}>
                <MaterialIcons name="school" size={14} color={AppColors.secondary} />
                <ThemedText style={styles.academyText}>Szkółka</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="sports-soccer"
            label="Bramki"
            value={stats?.goals ?? 0}
            color={AppColors.success}
          />
          <StatCard
            icon="sports"
            label="Asysty"
            value={stats?.assists ?? 0}
            color={AppColors.primary}
          />
          <StatCard
            icon="schedule"
            label="Minuty"
            value={stats?.minutesPlayed ?? 0}
            color={AppColors.secondary}
          />
          <StatCard
            icon="sports-handball"
            label="Mecze"
            value={stats?.matchesPlayed ?? 0}
            color={AppColors.warning}
          />
          <StatCard
            icon="square"
            label="Żółte"
            value={stats?.yellowCards ?? 0}
            color="#eab308"
          />
          <StatCard
            icon="square"
            label="Czerwone"
            value={stats?.redCards ?? 0}
            color={AppColors.danger}
          />
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kontakt</ThemedText>
          <View style={styles.infoCard}>
            {player.phone && (
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>{player.phone}</ThemedText>
              </View>
            )}
            {player.email && (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>{player.email}</ThemedText>
              </View>
            )}
            {!player.phone && !player.email && (
              <ThemedText style={styles.noInfoText}>Brak danych kontaktowych</ThemedText>
            )}
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
          <View style={styles.infoCard}>
            {player.dateOfBirth && (
              <View style={styles.infoRow}>
                <MaterialIcons name="cake" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>
                  {new Date(player.dateOfBirth).toLocaleDateString("pl-PL")}
                </ThemedText>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color="#64748b" />
              <ThemedText style={styles.infoText}>
                Dołączył: {new Date(player.createdAt).toLocaleDateString("pl-PL")}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Akcje</ThemedText>
          <View style={styles.actionsGrid}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/add-player-stats?playerId=${playerId}` as any)}
            >
              <MaterialIcons name="add-chart" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionLabel}>Dodaj statystyki</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/player-rating?playerId=${playerId}` as any)}
            >
              <MaterialIcons name="star" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionLabel}>Oceń zawodnika</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/player-trends?playerId=${playerId}` as any)}
            >
              <MaterialIcons name="show-chart" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionLabel}>Trendy</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/player-achievements?playerId=${playerId}` as any)}
            >
              <MaterialIcons name="emoji-events" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionLabel}>Osiągnięcia</ThemedText>
            </Pressable>
          </View>
        </View>

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
                <ThemedText style={styles.deleteText}>Usuń zawodnika</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
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
  profileCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  playerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  badges: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  positionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  positionText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  academyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.secondary + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    gap: 4,
  },
  academyText: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "31%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
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
  },
  noInfoText: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
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
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionButton: {
    width: "48%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
