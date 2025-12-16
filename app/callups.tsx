import { useRouter, useLocalSearchParams } from 'expo-router';
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

export default function CallupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;

  // Get match details
  const { data: match } = trpc.matches.get.useQuery(
    { id: Number(matchId) },
    { enabled: !!matchId }
  );

  // Get players
  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  // Placeholder for callups - feature to be implemented with backend
  const [existingCallups, setExistingCallups] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const refetchCallups = () => {
    // Placeholder
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSaveCallups = () => {
    if (!matchId) return;
    setIsSaving(true);
    
    // Simulate saving callups (feature to be implemented with backend)
    setTimeout(() => {
      setExistingCallups(selectedPlayers.map(playerId => ({ playerId, matchId: Number(matchId) })));
      setIsSaving(false);
      Alert.alert('Sukces', `Powołano ${selectedPlayers.length} zawodników. Powiadomienia zostaną wysłane 48h i 24h przed meczem.`);
    }, 500);
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

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Powołania</ThemedText>
        <Pressable onPress={handleSaveCallups} style={styles.saveButton}>
          <Ionicons name="checkmark" size={24} color="#22c55e" />
        </Pressable>
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
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>
          <View style={styles.selectedCount}>
            <ThemedText style={styles.selectedCountText}>{selectedPlayers.length}</ThemedText>
            <ThemedText style={styles.selectedCountLabel}>powołanych</ThemedText>
          </View>
        </View>
      )}

      {/* Players List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sectionTitle}>Wybierz zawodników</ThemedText>
          
          {players && players.length > 0 ? (
            players.map((player: any) => {
              const isSelected = selectedPlayers.includes(player.id);
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
                        {player.position}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak zawodników</ThemedText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.confirmButton, selectedPlayers.length === 0 && styles.confirmButtonDisabled]}
          onPress={handleSaveCallups}
          disabled={selectedPlayers.length === 0}
        >
          <Ionicons name="paper-plane" size={20} color="#fff" />
          <ThemedText style={styles.confirmButtonText}>
            Wyślij powołania ({selectedPlayers.length})
          </ThemedText>
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
    color: '#fff',
  },
  saveButton: {
    padding: 8,
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
    color: '#fff',
  },
  matchDate: {
    fontSize: 13,
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
    fontWeight: 'bold',
    color: '#22c55e',
  },
  selectedCountLabel: {
    fontSize: 10,
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
  sectionTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 15,
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
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
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
    fontWeight: '600',
    color: '#fff',
  },
});
