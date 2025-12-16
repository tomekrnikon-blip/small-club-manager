import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

export default function MyCallupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;

  // Get my callups
  const { data: callups = [], isLoading, refetch } = trpc.callups.getMyCallups.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  // Respond to callup mutation
  const respondMutation = trpc.callups.respond.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message || 'Nie udało się odpowiedzieć na powołanie');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRespond = (callupId: number, status: 'confirmed' | 'declined') => {
    const statusText = status === 'confirmed' ? 'potwierdzić obecność' : 'odmówić udziału';
    
    Alert.alert(
      'Potwierdź',
      `Czy na pewno chcesz ${statusText}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: status === 'confirmed' ? 'Potwierdź' : 'Odmów',
          style: status === 'declined' ? 'destructive' : 'default',
          onPress: () => {
            respondMutation.mutate({ callupId, status });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'declined': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Potwierdzono';
      case 'declined': return 'Odmówiono';
      default: return 'Oczekuje';
    }
  };

  const upcomingCallups = callups.filter((c: any) => {
    if (!c.match) return false;
    const matchDate = new Date(c.match.matchDate);
    return matchDate >= new Date();
  });

  const pastCallups = callups.filter((c: any) => {
    if (!c.match) return false;
    const matchDate = new Date(c.match.matchDate);
    return matchDate < new Date();
  });

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Moje Powołania</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22c55e"
            />
          }
        >
          {/* Upcoming Callups */}
          {upcomingCallups.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Nadchodzące mecze</ThemedText>
              
              {upcomingCallups.map((callup: any) => (
                <View key={callup.id} style={styles.callupCard}>
                  <View style={styles.callupHeader}>
                    <View style={styles.matchInfo}>
                      <Ionicons name="football" size={20} color="#22c55e" />
                      <ThemedText type="defaultSemiBold" style={styles.opponent}>
                        vs {callup.match?.opponent}
                      </ThemedText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(callup.status)}20` }]}>
                      <ThemedText style={[styles.statusText, { color: getStatusColor(callup.status) }]}>
                        {getStatusText(callup.status)}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.callupDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#64748b" />
                      <ThemedText style={styles.detailText}>
                        {callup.match && new Date(callup.match.matchDate).toLocaleDateString('pl-PL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </ThemedText>
                    </View>
                    {callup.match?.matchTime && (
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color="#64748b" />
                        <ThemedText style={styles.detailText}>{callup.match.matchTime}</ThemedText>
                      </View>
                    )}
                    {callup.match?.location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#64748b" />
                        <ThemedText style={styles.detailText}>{callup.match.location}</ThemedText>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Ionicons name="home" size={16} color="#64748b" />
                      <ThemedText style={styles.detailText}>
                        {callup.match?.homeAway === 'home' ? 'Mecz domowy' : 'Mecz wyjazdowy'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Action Buttons - only show if pending */}
                  {callup.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleRespond(callup.id, 'confirmed')}
                        disabled={respondMutation.isPending}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Potwierdzam</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleRespond(callup.id, 'declined')}
                        disabled={respondMutation.isPending}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Odmawiam</ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {/* Response Note */}
                  {callup.responseNote && (
                    <View style={styles.noteContainer}>
                      <ThemedText style={styles.noteLabel}>Notatka:</ThemedText>
                      <ThemedText style={styles.noteText}>{callup.responseNote}</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Past Callups */}
          {pastCallups.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Historia</ThemedText>
              
              {pastCallups.slice(0, 10).map((callup: any) => (
                <View key={callup.id} style={[styles.callupCard, styles.pastCallupCard]}>
                  <View style={styles.callupHeader}>
                    <View style={styles.matchInfo}>
                      <Ionicons name="football-outline" size={20} color="#64748b" />
                      <ThemedText style={styles.pastOpponent}>
                        vs {callup.match?.opponent}
                      </ThemedText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(callup.status)}20` }]}>
                      <ThemedText style={[styles.statusText, { color: getStatusColor(callup.status) }]}>
                        {getStatusText(callup.status)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.pastDate}>
                    {callup.match && new Date(callup.match.matchDate).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {callups.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="football-outline" size={64} color="#64748b" />
              <ThemedText style={styles.emptyTitle}>Brak powołań</ThemedText>
              <ThemedText style={styles.emptyText}>
                Nie masz jeszcze żadnych powołań na mecze.
              </ThemedText>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  callupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pastCallupCard: {
    opacity: 0.7,
    padding: 12,
  },
  callupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opponent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  pastOpponent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  callupDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  pastDate: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#fff',
  },
  noteContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
});
