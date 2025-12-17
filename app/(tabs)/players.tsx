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
import { useLogoutConfirm } from "@/hooks/use-logout-confirm";
import { useOfflineQuery } from "@/hooks/use-offline-query";
import { OfflineIndicator } from "@/components/offline-indicator";

const positionColors: Record<string, string> = {
  bramkarz: AppColors.goalkeeper,
  obrońca: AppColors.defender,
  pomocnik: AppColors.midfielder,
  napastnik: AppColors.forward,
};

const positionLabels: Record<string, string> = {
  bramkarz: "GK",
  obrońca: "OBR",
  pomocnik: "POM",
  napastnik: "NAP",
};

export default function PlayersScreen() {
  const { isAuthenticated } = useAuth();
  const { confirmLogout } = useLogoutConfirm();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState<string | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const playersQuery = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: players, isLoading, isFromCache, isStale, isOffline, refetch } = useOfflineQuery(
    playersQuery,
    { cacheKey: `players_${club?.id}`, enabled: !!club?.id }
  );

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !filterPosition || player.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć zawodników</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby dodać zawodników</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>Kadra</ThemedText>
          <OfflineIndicator isFromCache={isFromCache} isStale={isStale} isOffline={isOffline} compact />
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/player/add" as any)}
          >
            <MaterialIcons name="person-add" size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={confirmLogout}>
            <MaterialIcons name="logout" size={22} color={AppColors.danger} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj zawodnika..."
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

      {/* Position filters */}
      <View style={styles.filters}>
        <FilterChip
          label="Wszyscy"
          active={filterPosition === null}
          onPress={() => setFilterPosition(null)}
        />
        <FilterChip
          label="Bramkarze"
          active={filterPosition === "bramkarz"}
          onPress={() => setFilterPosition("bramkarz")}
          color={positionColors.bramkarz}
        />
        <FilterChip
          label="Obrońcy"
          active={filterPosition === "obrońca"}
          onPress={() => setFilterPosition("obrońca")}
          color={positionColors.obrońca}
        />
        <FilterChip
          label="Pomocnicy"
          active={filterPosition === "pomocnik"}
          onPress={() => setFilterPosition("pomocnik")}
          color={positionColors.pomocnik}
        />
        <FilterChip
          label="Napastnicy"
          active={filterPosition === "napastnik"}
          onPress={() => setFilterPosition("napastnik")}
          color={positionColors.napastnik}
        />
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
            <PlayerCard
              player={item}
              onPress={() => router.push(`/player/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak zawodników</ThemedText>
              <ThemedText style={styles.emptyText}>
                {searchQuery || filterPosition
                  ? "Nie znaleziono zawodników spełniających kryteria"
                  : "Dodaj pierwszego zawodnika do kadry"}
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        active && { backgroundColor: color || AppColors.primary },
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.filterChipText,
          active && { color: "#fff" },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function PlayerCard({ player, onPress }: { player: any; onPress: () => void }) {
  const positionColor = positionColors[player.position] || AppColors.primary;

  return (
    <Pressable style={styles.playerCard} onPress={onPress}>
      <View style={styles.playerLeft}>
        {player.jerseyNumber ? (
          <View style={[styles.jerseyNumber, { backgroundColor: positionColor + "20" }]}>
            <ThemedText style={[styles.jerseyText, { color: positionColor }]}>
              {player.jerseyNumber}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.jerseyNumber, { backgroundColor: positionColor + "20" }]}>
            <MaterialIcons name="person" size={24} color={positionColor} />
          </View>
        )}
        <View style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>{player.name}</ThemedText>
          <View style={styles.playerMeta}>
            <View style={[styles.positionBadge, { backgroundColor: positionColor + "20" }]}>
              <ThemedText style={[styles.positionText, { color: positionColor }]}>
                {positionLabels[player.position] || player.position}
              </ThemedText>
            </View>
            {player.isAcademy && (
              <View style={styles.academyBadge}>
                <ThemedText style={styles.academyText}>Szkółka</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#64748b" />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addButton: {
    backgroundColor: AppColors.primary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    padding: Spacing.sm,
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
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: AppColors.bgCard,
  },
  filterChipText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  jerseyNumber: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  jerseyText: {
    fontSize: 18,
    fontWeight: "bold",
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  positionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  academyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.secondary + "20",
  },
  academyText: {
    fontSize: 12,
    fontWeight: "500",
    color: AppColors.secondary,
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
  },
});
