import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const clubId = parseInt(id || "0", 10);

  const { data: club, isLoading } = trpc.clubs.get.useQuery(
    { id: clubId },
    { enabled: !!clubId && isAuthenticated }
  );

  const { data: players } = trpc.players.list.useQuery(
    { clubId },
    { enabled: !!clubId && isAuthenticated }
  );

  const { data: teams } = trpc.teams.list.useQuery(
    { clubId },
    { enabled: !!clubId && isAuthenticated }
  );

  // Members count will be added when backend supports it
  const members: any[] = [];

  const deleteMutation = trpc.clubs.delete.useMutation({
    onSuccess: () => {
      utils.clubs.list.invalidate();
      Alert.alert("Sukces", "Klub został usunięty", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Usuń klub",
      "Czy na pewno chcesz usunąć ten klub? Ta operacja jest nieodwracalna i usunie wszystkie powiązane dane.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: clubId }),
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

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="business" size={64} color="#334155" />
        <ThemedText style={styles.notFoundText}>Nie znaleziono klubu</ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
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
        <ThemedText style={styles.headerTitle}>Profil klubu</ThemedText>
        <Pressable onPress={() => router.push(`/club/edit/${clubId}` as any)} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Club Header */}
        <View style={styles.clubCard}>
          <View style={styles.clubLogo}>
            <MaterialIcons name="shield" size={48} color={AppColors.primary} />
          </View>
          <ThemedText style={styles.clubName}>{club.name}</ThemedText>
          {club.city && (
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#64748b" />
              <ThemedText style={styles.locationText}>{club.city}</ThemedText>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={24} color={AppColors.primary} />
            <ThemedText style={styles.statValue}>{players?.length || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Zawodników</ThemedText>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="groups" size={24} color={AppColors.secondary} />
            <ThemedText style={styles.statValue}>{teams?.length || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Drużyn</ThemedText>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="person" size={24} color={AppColors.warning} />
            <ThemedText style={styles.statValue}>{members?.length || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Członków</ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Zarządzanie</ThemedText>
          <View style={styles.actionsGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/player/add" as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: AppColors.primary + "20" }]}>
                <MaterialIcons name="person-add" size={24} color={AppColors.primary} />
              </View>
              <ThemedText style={styles.actionText}>Dodaj zawodnika</ThemedText>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push(`/club/${clubId}/members` as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: AppColors.secondary + "20" }]}>
                <MaterialIcons name="group-add" size={24} color={AppColors.secondary} />
              </View>
              <ThemedText style={styles.actionText}>Członkowie</ThemedText>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push(`/club/${clubId}/teams` as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: AppColors.warning + "20" }]}>
                <MaterialIcons name="groups" size={24} color={AppColors.warning} />
              </View>
              <ThemedText style={styles.actionText}>Drużyny</ThemedText>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/finances" as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: AppColors.success + "20" }]}>
                <MaterialIcons name="attach-money" size={24} color={AppColors.success} />
              </View>
              <ThemedText style={styles.actionText}>Finanse</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Club Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
          <View style={styles.infoCard}>
            {club.location && (
              <View style={styles.infoRow}>
                <MaterialIcons name="stadium" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>{club.location}</ThemedText>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color="#64748b" />
              <ThemedText style={styles.infoText}>
                Utworzono: {new Date(club.createdAt).toLocaleDateString("pl-PL")}
              </ThemedText>
            </View>
            {club.description && (
              <View style={styles.descriptionRow}>
                <ThemedText style={styles.descriptionText}>{club.description}</ThemedText>
              </View>
            )}
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
                <ThemedText style={styles.deleteText}>Usuń klub</ThemedText>
              </>
            )}
          </Pressable>
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
  clubCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clubName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
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
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionCard: {
    width: "47%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#e2e8f0",
    textAlign: "center",
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
  descriptionRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: AppColors.bgElevated,
  },
  descriptionText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
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
});
