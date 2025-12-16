import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AcademyScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Filter only academy players
  const academyPlayers = players?.filter((p) => p.isAcademy);

  const filteredPlayers = academyPlayers?.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalPlayers = academyPlayers?.length || 0;
  const paidCount = academyPlayers?.filter((p) => (p as any).paymentStatus === "paid").length || 0;
  const unpaidCount = totalPlayers - paidCount;

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć szkółkę</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby zarządzać szkółką</ThemedText>
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
        <ThemedText style={styles.title}>Szkółka</ThemedText>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/player/add" as any)}
        >
          <MaterialIcons name="person-add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="school" size={28} color={AppColors.secondary} />
          <ThemedText style={styles.statValue}>{totalPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Uczniów</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: AppColors.success + "15" }]}>
          <MaterialIcons name="check-circle" size={28} color={AppColors.success} />
          <ThemedText style={[styles.statValue, { color: AppColors.success }]}>{paidCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Opłaconych</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: AppColors.danger + "15" }]}>
          <MaterialIcons name="error" size={28} color={AppColors.danger} />
          <ThemedText style={[styles.statValue, { color: AppColors.danger }]}>{unpaidCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Nieopłaconych</ThemedText>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj ucznia..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={20} color="#64748b" />
          </Pressable>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.actionButton}>
          <MaterialIcons name="notifications" size={20} color={AppColors.warning} />
          <ThemedText style={styles.actionText}>Wyślij przypomnienie</ThemedText>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <MaterialIcons name="event" size={20} color={AppColors.primary} />
          <ThemedText style={styles.actionText}>Frekwencja</ThemedText>
        </Pressable>
      </View>

      {/* Players list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <AcademyPlayerCard
              player={item}
              onPress={() => router.push(`/player/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="school" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak uczniów szkółki</ThemedText>
              <ThemedText style={styles.emptyText}>
                Dodaj pierwszego ucznia do szkółki
              </ThemedText>
              <Pressable
                style={styles.addFirstButton}
                onPress={() => router.push("/player/add" as any)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <ThemedText style={styles.addFirstText}>Dodaj ucznia</ThemedText>
              </Pressable>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

function AcademyPlayerCard({ player, onPress }: { player: any; onPress: () => void }) {
  const isPaid = (player as any).paymentStatus === "paid";

  return (
    <Pressable style={styles.playerCard} onPress={onPress}>
      <View style={styles.playerAvatar}>
        {player.jerseyNumber ? (
          <ThemedText style={styles.jerseyText}>{player.jerseyNumber}</ThemedText>
        ) : (
          <MaterialIcons name="person" size={24} color={AppColors.secondary} />
        )}
      </View>
      <View style={styles.playerInfo}>
        <ThemedText style={styles.playerName}>{player.name}</ThemedText>
        <View style={styles.playerMeta}>
          <View style={styles.positionBadge}>
            <ThemedText style={styles.positionText}>{player.position}</ThemedText>
          </View>
          {player.parentPhone && (
            <View style={styles.contactBadge}>
              <MaterialIcons name="phone" size={12} color="#64748b" />
              <ThemedText style={styles.contactText}>Kontakt</ThemedText>
            </View>
          )}
        </View>
      </View>
      <View style={[styles.paymentStatus, { backgroundColor: isPaid ? AppColors.success + "20" : AppColors.danger + "20" }]}>
        <MaterialIcons
          name={isPaid ? "check-circle" : "error"}
          size={16}
          color={isPaid ? AppColors.success : AppColors.danger}
        />
        <ThemedText style={[styles.paymentText, { color: isPaid ? AppColors.success : AppColors.danger }]}>
          {isPaid ? "Opłacone" : "Nieopłacone"}
        </ThemedText>
      </View>
    </Pressable>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: AppColors.secondary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: "#fff",
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: 13,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: AppColors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  jerseyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.secondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  positionBadge: {
    backgroundColor: AppColors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  positionText: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  contactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: "#64748b",
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    gap: 4,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  addFirstText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
