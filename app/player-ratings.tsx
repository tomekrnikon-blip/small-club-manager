import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type ViewMode = 'players' | 'events';

export default function PlayerRatingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading: loadingPlayers } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: trainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: ratings } = trpc.playerRatings.listByClub.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Calculate player averages
  const playerAverages = useMemo(() => {
    if (!players || !ratings) return {};
    
    const averages: Record<number, { avg: number; count: number }> = {};
    
    players.forEach((player: any) => {
      const playerRatings = ratings.filter((r: any) => r.playerId === player.id);
      if (playerRatings.length > 0) {
        const avg = playerRatings.reduce((sum: number, r: any) => sum + Number(r.overall), 0) / playerRatings.length;
        averages[player.id] = { avg, count: playerRatings.length };
      }
    });
    
    return averages;
  }, [players, ratings]);

  // Recent events that can be rated
  const recentEvents = useMemo(() => {
    const events: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (trainings) {
      trainings.forEach((t: any) => {
        const date = new Date(t.trainingDate);
        if (date <= now && date >= thirtyDaysAgo) {
          events.push({
            type: 'training',
            id: t.id,
            title: 'Trening',
            date,
            location: t.location,
          });
        }
      });
    }

    if (matches) {
      matches.forEach((m: any) => {
        const date = new Date(m.matchDate);
        if (date <= now && date >= thirtyDaysAgo) {
          events.push({
            type: 'match',
            id: m.id,
            title: `Mecz vs ${m.opponent}`,
            date,
            location: m.location,
          });
        }
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [trainings, matches]);

  const handleRatePlayer = (playerId: number, playerName: string, event: any) => {
    router.push({
      pathname: '/player-rating',
      params: {
        playerId: playerId.toString(),
        playerName,
        eventType: event.type,
        eventId: event.id.toString(),
        eventDate: event.date.toISOString().split('T')[0],
      },
    } as any);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <MaterialIcons
            key={star}
            name="star"
            size={14}
            color={rating >= star ? '#f59e0b' : '#334155'}
          />
        ))}
      </View>
    );
  };

  if (loadingPlayers) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Oceny zawodników</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleBtn, viewMode === 'players' && styles.toggleBtnActive]}
          onPress={() => setViewMode('players')}
        >
          <MaterialIcons 
            name="people" 
            size={18} 
            color={viewMode === 'players' ? '#fff' : '#64748b'} 
          />
          <ThemedText style={[styles.toggleText, viewMode === 'players' && styles.toggleTextActive]}>
            Zawodnicy
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === 'events' && styles.toggleBtnActive]}
          onPress={() => setViewMode('events')}
        >
          <MaterialIcons 
            name="event" 
            size={18} 
            color={viewMode === 'events' ? '#fff' : '#64748b'} 
          />
          <ThemedText style={[styles.toggleText, viewMode === 'events' && styles.toggleTextActive]}>
            Wydarzenia
          </ThemedText>
        </Pressable>
      </View>

      {viewMode === 'players' ? (
        <FlatList
          data={players}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const avg = playerAverages[item.id];
            return (
              <Pressable
                style={styles.playerCard}
                onPress={() => setSelectedPlayerId(selectedPlayerId === item.id ? null : item.id)}
              >
                <View style={styles.playerMain}>
                  <View style={styles.playerAvatar}>
                    <MaterialIcons name="person" size={24} color={AppColors.primary} />
                  </View>
                  <View style={styles.playerInfo}>
                    <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                    <ThemedText style={styles.playerPosition}>{item.position}</ThemedText>
                  </View>
                  {avg ? (
                    <View style={styles.playerRating}>
                      <ThemedText style={styles.playerRatingValue}>{avg.avg.toFixed(1)}</ThemedText>
                      {renderStars(avg.avg)}
                      <ThemedText style={styles.playerRatingCount}>({avg.count} ocen)</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.noRating}>Brak ocen</ThemedText>
                  )}
                </View>

                {selectedPlayerId === item.id && (
                  <View style={styles.eventsList}>
                    <ThemedText style={styles.eventsTitle}>Wybierz wydarzenie do oceny:</ThemedText>
                    {recentEvents.slice(0, 5).map((event) => (
                      <Pressable
                        key={`${event.type}-${event.id}`}
                        style={styles.eventItem}
                        onPress={() => handleRatePlayer(item.id, item.name, event)}
                      >
                        <View style={[
                          styles.eventIcon,
                          { backgroundColor: event.type === 'match' ? '#a855f7' : '#f59e0b' }
                        ]}>
                          <MaterialIcons 
                            name={event.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
                            size={16} 
                            color="#fff" 
                          />
                        </View>
                        <View style={styles.eventInfo}>
                          <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                          <ThemedText style={styles.eventDate}>{formatDate(event.date)}</ThemedText>
                        </View>
                        <MaterialIcons name="star-outline" size={20} color={AppColors.primary} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak zawodników</ThemedText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={recentEvents}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: event }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventCardHeader}>
                <View style={[
                  styles.eventCardIcon,
                  { backgroundColor: event.type === 'match' ? '#a855f7' : '#f59e0b' }
                ]}>
                  <MaterialIcons 
                    name={event.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
                    size={20} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.eventCardInfo}>
                  <ThemedText style={styles.eventCardTitle}>{event.title}</ThemedText>
                  <ThemedText style={styles.eventCardDate}>
                    {formatDate(event.date)} • {event.location || 'Brak lokalizacji'}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.eventPlayers}>
                <ThemedText style={styles.eventPlayersTitle}>Oceń zawodników:</ThemedText>
                {players?.slice(0, 5).map((player: any) => (
                  <Pressable
                    key={player.id}
                    style={styles.eventPlayerItem}
                    onPress={() => handleRatePlayer(player.id, player.name, event)}
                  >
                    <ThemedText style={styles.eventPlayerName}>{player.name}</ThemedText>
                    <MaterialIcons name="star-outline" size={20} color={AppColors.primary} />
                  </Pressable>
                ))}
                {players && players.length > 5 && (
                  <ThemedText style={styles.morePlayersText}>
                    +{players.length - 5} więcej zawodników
                  </ThemedText>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="event" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak wydarzeń do oceny</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Oceniać można wydarzenia z ostatnich 30 dni
              </ThemedText>
            </View>
          }
        />
      )}
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
  toggleContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
  },
  toggleBtnActive: {
    backgroundColor: AppColors.primary,
  },
  toggleText: {
    fontSize: 14,
    color: "#64748b",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  playerCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  playerMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 13,
    color: "#64748b",
  },
  playerRating: {
    alignItems: "flex-end",
  },
  playerRatingValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  playerRatingCount: {
    fontSize: 11,
    color: "#64748b",
  },
  noRating: {
    fontSize: 12,
    color: "#64748b",
  },
  eventsList: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: Spacing.md,
    backgroundColor: "#0f172a",
  },
  eventsTitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    color: "#fff",
  },
  eventDate: {
    fontSize: 11,
    color: "#64748b",
  },
  eventCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  eventCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  eventCardDate: {
    fontSize: 13,
    color: "#64748b",
  },
  eventPlayers: {
    padding: Spacing.md,
  },
  eventPlayersTitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  eventPlayerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  eventPlayerName: {
    fontSize: 14,
    color: "#fff",
  },
  morePlayersText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#475569",
    marginTop: Spacing.xs,
  },
});
