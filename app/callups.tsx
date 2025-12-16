import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

type NotificationChannel = "app" | "email" | "sms" | "both";

export default function CallupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId, clubId: clubIdParam } = useLocalSearchParams<{ matchId: string; clubId?: string }>();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>("app");
  const [isSaving, setIsSaving] = useState(false);

  // Get first club if not provided
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubIdParam ? Number(clubIdParam) : clubs?.[0]?.id;

  // Get match details
  const { data: match, isLoading: matchLoading } = trpc.matches.get.useQuery(
    { id: Number(matchId) },
    { enabled: !!matchId }
  );

  // Get players
  const { data: players, isLoading: playersLoading } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  // Get existing callups
  const { data: existingCallups = [], isLoading: callupsLoading, refetch: refetchCallups } = trpc.callups.getForMatch.useQuery(
    { matchId: Number(matchId) },
    { enabled: !!matchId }
  );

  // Get club settings for SMS availability
  const { data: club } = trpc.clubs.get.useQuery(
    { id: clubId! },
    { enabled: !!clubId }
  );

  // Get user role
  const { data: roleData } = trpc.clubMembers.getMyRole.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  // Create callups mutation
  const createCallupsMutation = trpc.callups.createForMatch.useMutation({
    onSuccess: (result) => {
      Alert.alert(
        'Sukces',
        `Powołano ${selectedPlayers.length} zawodników.\nZaplanowano ${result.notificationsScheduled} powiadomień (48h i 24h przed meczem).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      refetchCallups();
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message || 'Nie udało się zapisać powołań');
    },
  });

  // Initialize selected players from existing callups
  useEffect(() => {
    if (existingCallups.length > 0) {
      setSelectedPlayers(existingCallups.map((c: any) => c.playerId));
    }
  }, [existingCallups]);

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAll = () => {
    if (players) {
      setSelectedPlayers(players.map((p: any) => p.id));
    }
  };

  const deselectAll = () => {
    setSelectedPlayers([]);
  };

  const handleSaveCallups = async () => {
    if (!matchId || selectedPlayers.length === 0) {
      Alert.alert('Błąd', 'Wybierz przynajmniej jednego zawodnika');
      return;
    }
    
    setIsSaving(true);
    try {
      await createCallupsMutation.mutateAsync({
        matchId: Number(matchId),
        playerIds: selectedPlayers,
        notificationChannel,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'bramkarz': return '#f59e0b';
      case 'obrońca': return '#3b82f6';
      case 'pomocnik': return '#22c55e';
      case 'napastnik': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const isLoading = matchLoading || playersLoading || callupsLoading;
  const smsAvailable = club?.smsEnabled && club?.smsProvider !== "none";
  const canManageCallups = roleData?.permissions?.canManageCallups !== false;

  if (!canManageCallups) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#22c55e" />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>Powołania</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={64} color="#64748b" />
          <ThemedText style={styles.emptyText}>Brak uprawnień do zarządzania powołaniami</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Powołania</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Match Info */}
      {match && (
        <View style={styles.matchInfo}>
          <View style={styles.matchIcon}>
            <Ionicons name="football" size={24} color="#22c55e" />
          </View>
          <View style={styles.matchDetails}>
            <ThemedText type="defaultSemiBold" style={styles.matchOpponent}>
              vs {match.opponent}
            </ThemedText>
            <ThemedText style={styles.matchDate}>
              {new Date(match.matchDate).toLocaleDateString('pl-PL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {match.matchTime && ` • ${match.matchTime}`}
            </ThemedText>
          </View>
          <View style={styles.selectedCount}>
            <ThemedText style={styles.selectedCountText}>{selectedPlayers.length}</ThemedText>
            <ThemedText style={styles.selectedCountLabel}>powołanych</ThemedText>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification Channel Selection */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Kanał powiadomień</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Zawodnicy otrzymają powiadomienie 48h i 24h przed meczem
            </ThemedText>
            
            <View style={styles.channelOptions}>
              <Pressable
                style={[styles.channelOption, notificationChannel === "app" && styles.channelOptionActive]}
                onPress={() => setNotificationChannel("app")}
              >
                <Ionicons name="phone-portrait" size={20} color={notificationChannel === "app" ? "#22c55e" : "#64748b"} />
                <ThemedText style={[styles.channelLabel, notificationChannel === "app" && styles.channelLabelActive]}>
                  Aplikacja
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.channelOption,
                  notificationChannel === "sms" && styles.channelOptionActive,
                  !smsAvailable && styles.channelOptionDisabled
                ]}
                onPress={() => smsAvailable && setNotificationChannel("sms")}
                disabled={!smsAvailable}
              >
                <Ionicons name="chatbubble" size={20} color={notificationChannel === "sms" ? "#22c55e" : smsAvailable ? "#64748b" : "#334155"} />
                <ThemedText style={[
                  styles.channelLabel,
                  notificationChannel === "sms" && styles.channelLabelActive,
                  !smsAvailable && styles.channelLabelDisabled
                ]}>
                  SMS
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.channelOption,
                  notificationChannel === "both" && styles.channelOptionActive,
                  !smsAvailable && styles.channelOptionDisabled
                ]}
                onPress={() => smsAvailable && setNotificationChannel("both")}
                disabled={!smsAvailable}
              >
                <Ionicons name="notifications" size={20} color={notificationChannel === "both" ? "#22c55e" : smsAvailable ? "#64748b" : "#334155"} />
                <ThemedText style={[
                  styles.channelLabel,
                  notificationChannel === "both" && styles.channelLabelActive,
                  !smsAvailable && styles.channelLabelDisabled
                ]}>
                  Oba
                </ThemedText>
              </Pressable>
            </View>

            {!smsAvailable && (
              <ThemedText style={styles.smsNote}>
                SMS niedostępny - skonfiguruj w Ustawieniach Klubu
              </ThemedText>
            )}
          </View>

          {/* Player Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Wybierz zawodników</ThemedText>
              <View style={styles.selectionButtons}>
                <Pressable onPress={selectAll} style={styles.selectButton}>
                  <ThemedText style={styles.selectButtonText}>Wszyscy</ThemedText>
                </Pressable>
                <Pressable onPress={deselectAll} style={styles.selectButton}>
                  <ThemedText style={styles.selectButtonText}>Żaden</ThemedText>
                </Pressable>
              </View>
            </View>
            
            {players && players.length > 0 ? (
              players.map((player: any) => {
                const isSelected = selectedPlayers.includes(player.id);
                const existingCallup = existingCallups.find((c: any) => c.playerId === player.id);
                
                return (
                  <Pressable
                    key={player.id}
                    style={[styles.playerCard, isSelected && styles.playerCardSelected]}
                    onPress={() => togglePlayer(player.id)}
                  >
                    <View style={styles.checkbox}>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={28} color="#64748b" />
                      )}
                    </View>
                    <View style={styles.playerInfo}>
                      <View style={styles.playerHeader}>
                        {player.jerseyNumber && (
                          <View style={styles.jerseyBadge}>
                            <ThemedText style={styles.jerseyNumber}>
                              {player.jerseyNumber}
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText type="defaultSemiBold" style={styles.playerName}>
                          {player.name}
                        </ThemedText>
                      </View>
                      <View style={[styles.positionBadge, { backgroundColor: `${getPositionColor(player.position)}20` }]}>
                        <ThemedText style={[styles.positionText, { color: getPositionColor(player.position) }]}>
                          {player.position || 'Brak pozycji'}
                        </ThemedText>
                      </View>
                    </View>
                    {existingCallup && (
                      <View style={[
                        styles.statusBadge,
                        existingCallup.status === "confirmed" && styles.confirmedBadge,
                        existingCallup.status === "declined" && styles.declinedBadge,
                      ]}>
                        <ThemedText style={styles.statusText}>
                          {existingCallup.status === "confirmed" ? "✓" :
                           existingCallup.status === "declined" ? "✗" : "?"}
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#64748b" />
                <ThemedText style={styles.emptyText}>Brak zawodników</ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.confirmButton, (selectedPlayers.length === 0 || isSaving) && styles.confirmButtonDisabled]}
          onPress={handleSaveCallups}
          disabled={selectedPlayers.length === 0 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <ThemedText style={styles.confirmButtonText}>
                Zapisz i wyślij powołania ({selectedPlayers.length})
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: '#fff',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  matchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchDetails: {
    flex: 1,
    marginLeft: 12,
  },
  matchOpponent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  matchDate: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
    marginTop: 2,
  },
  selectedCount: {
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedCountText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  selectedCountLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  channelOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  channelOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelOptionActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  channelOptionDisabled: {
    opacity: 0.5,
  },
  channelLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
  },
  channelLabelActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  channelLabelDisabled: {
    color: '#475569',
  },
  smsNote: {
    fontSize: 12,
    lineHeight: 16,
    color: '#f59e0b',
    marginTop: 8,
    textAlign: 'center',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  selectButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#22c55e',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  checkbox: {
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jerseyBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  jerseyNumber: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  positionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  positionText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  declinedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#94a3b8',
    marginTop: 16,
  },
  bottomAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#fff',
  },
});
