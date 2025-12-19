import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface ScheduledMatch {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  isHome: boolean;
  competition: string;
  synced: boolean;
}

// Sample data - in production this would come from RegioWyniki scraper
const SAMPLE_SCHEDULE: ScheduledMatch[] = [
  {
    id: '1',
    date: '2025-12-21',
    time: '15:00',
    homeTeam: 'Twój Klub',
    awayTeam: 'KS Orzeł',
    isHome: true,
    competition: 'IV Liga',
    synced: false,
  },
  {
    id: '2',
    date: '2025-12-28',
    time: '14:00',
    homeTeam: 'LKS Sokół',
    awayTeam: 'Twój Klub',
    isHome: false,
    competition: 'IV Liga',
    synced: false,
  },
  {
    id: '3',
    date: '2026-01-04',
    time: '15:00',
    homeTeam: 'Twój Klub',
    awayTeam: 'GKS Piast',
    isHome: true,
    competition: 'IV Liga',
    synced: true,
  },
  {
    id: '4',
    date: '2026-01-11',
    time: '13:00',
    homeTeam: 'MKS Victoria',
    awayTeam: 'Twój Klub',
    isHome: false,
    competition: 'IV Liga',
    synced: false,
  },
  {
    id: '5',
    date: '2026-01-18',
    time: '15:00',
    homeTeam: 'Twój Klub',
    awayTeam: 'KS Błękitni',
    isHome: true,
    competition: 'IV Liga',
    synced: false,
  },
];

export default function ScheduleSyncScreen() {
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<ScheduledMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [clubName, setClubName] = useState('Twój Klub');

  useEffect(() => {
    loadSchedule();
    loadClubData();
  }, []);

  const loadClubData = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const clubData = await AsyncStorage.getItem('club_data');
      if (clubData) {
        const parsed = JSON.parse(clubData);
        if (parsed.name) {
          setClubName(parsed.name);
        }
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Load saved schedule
      const savedSchedule = await AsyncStorage.getItem('synced_schedule');
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      } else {
        // Use sample data for demo
        setSchedule(SAMPLE_SCHEDULE);
      }

      // Load last sync time
      const syncTime = await AsyncStorage.getItem('last_schedule_sync');
      if (syncTime) {
        setLastSync(syncTime);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      setSchedule(SAMPLE_SCHEDULE);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromRegioWyniki = async () => {
    setIsSyncing(true);

    try {
      // In production, this would call the RegioWyniki scraper
      // For now, simulate API call with sample data
      await new Promise(resolve => setTimeout(resolve, 2000));

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Update schedule with "fetched" data
      const updatedSchedule = SAMPLE_SCHEDULE.map(match => ({
        ...match,
        homeTeam: match.isHome ? clubName : match.homeTeam,
        awayTeam: !match.isHome ? clubName : match.awayTeam,
      }));

      setSchedule(updatedSchedule);
      
      // Save to storage
      await AsyncStorage.setItem('synced_schedule', JSON.stringify(updatedSchedule));
      
      // Update last sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem('last_schedule_sync', now);
      setLastSync(now);

      Alert.alert(
        'Sukces',
        `Pobrano ${updatedSchedule.length} meczów z RegioWyniki.pl`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error fetching schedule:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać terminarza.');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncMatchToCalendar = async (match: ScheduledMatch) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Mark as synced
      const updatedSchedule = schedule.map(m =>
        m.id === match.id ? { ...m, synced: true } : m
      );
      setSchedule(updatedSchedule);
      await AsyncStorage.setItem('synced_schedule', JSON.stringify(updatedSchedule));

      Alert.alert(
        'Dodano do kalendarza',
        `Mecz ${match.homeTeam} vs ${match.awayTeam} został dodany do kalendarza aplikacji.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing match:', error);
      Alert.alert('Błąd', 'Nie udało się dodać meczu do kalendarza.');
    }
  };

  const syncAllMatches = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      const updatedSchedule = schedule.map(m => ({ ...m, synced: true }));
      setSchedule(updatedSchedule);
      await AsyncStorage.setItem('synced_schedule', JSON.stringify(updatedSchedule));

      Alert.alert(
        'Sukces',
        `Wszystkie ${schedule.length} meczów zostały dodane do kalendarza.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing all matches:', error);
      Alert.alert('Błąd', 'Nie udało się zsynchronizować meczów.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFromRegioWyniki();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatLastSync = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcomingMatches = schedule.filter(m => new Date(m.date) >= new Date());
  const pastMatches = schedule.filter(m => new Date(m.date) < new Date());

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
        <ThemedText style={styles.loadingText}>Ładowanie terminarza...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}>← Wstecz</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>Synchronizacja terminarza</ThemedText>
        </View>

        {/* Sync Status */}
        <View style={styles.syncStatus}>
          <View style={styles.syncInfo}>
            <ThemedText style={styles.syncLabel}>Ostatnia synchronizacja:</ThemedText>
            <ThemedText style={styles.syncValue}>
              {lastSync ? formatLastSync(lastSync) : 'Nigdy'}
            </ThemedText>
          </View>
          
          <Pressable
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={fetchFromRegioWyniki}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.syncButtonText}>
                🔄 Pobierz z RegioWyniki
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionButton}
            onPress={syncAllMatches}
          >
            <ThemedText style={styles.quickActionText}>
              📅 Dodaj wszystkie do kalendarza
            </ThemedText>
          </Pressable>
        </View>

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Nadchodzące mecze ({upcomingMatches.length})
            </ThemedText>

            {upcomingMatches.map(match => (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <View style={[
                    styles.matchBadge,
                    match.isHome ? styles.homeBadge : styles.awayBadge
                  ]}>
                    <ThemedText style={styles.matchBadgeText}>
                      {match.isHome ? 'DOM' : 'WYJ'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.matchCompetition}>
                    {match.competition}
                  </ThemedText>
                  {match.synced && (
                    <View style={styles.syncedBadge}>
                      <ThemedText style={styles.syncedText}>✓</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.matchTeams}>
                  <ThemedText style={[
                    styles.teamName,
                    match.isHome && styles.highlightedTeam
                  ]}>
                    {match.homeTeam}
                  </ThemedText>
                  <ThemedText style={styles.vsText}>vs</ThemedText>
                  <ThemedText style={[
                    styles.teamName,
                    !match.isHome && styles.highlightedTeam
                  ]}>
                    {match.awayTeam}
                  </ThemedText>
                </View>

                <View style={styles.matchDetails}>
                  <ThemedText style={styles.matchDate}>
                    📅 {formatDate(match.date)}
                  </ThemedText>
                  <ThemedText style={styles.matchTime}>
                    ⏰ {match.time}
                  </ThemedText>
                </View>

                {!match.synced && (
                  <Pressable
                    style={styles.addToCalendarButton}
                    onPress={() => syncMatchToCalendar(match)}
                  >
                    <ThemedText style={styles.addToCalendarText}>
                      + Dodaj do kalendarza
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Past Matches */}
        {pastMatches.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Rozegrane mecze ({pastMatches.length})
            </ThemedText>

            {pastMatches.map(match => (
              <View key={match.id} style={[styles.matchCard, styles.pastMatchCard]}>
                <View style={styles.matchHeader}>
                  <View style={[
                    styles.matchBadge,
                    match.isHome ? styles.homeBadge : styles.awayBadge,
                    styles.pastBadge
                  ]}>
                    <ThemedText style={styles.matchBadgeText}>
                      {match.isHome ? 'DOM' : 'WYJ'}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.matchCompetition, styles.pastText]}>
                    {match.competition}
                  </ThemedText>
                </View>

                <View style={styles.matchTeams}>
                  <ThemedText style={[styles.teamName, styles.pastText]}>
                    {match.homeTeam}
                  </ThemedText>
                  {match.homeScore !== undefined && match.awayScore !== undefined ? (
                    <ThemedText style={styles.scoreText}>
                      {match.homeScore} : {match.awayScore}
                    </ThemedText>
                  ) : (
                    <ThemedText style={[styles.vsText, styles.pastText]}>vs</ThemedText>
                  )}
                  <ThemedText style={[styles.teamName, styles.pastText]}>
                    {match.awayTeam}
                  </ThemedText>
                </View>

                <ThemedText style={[styles.matchDate, styles.pastText]}>
                  {formatDate(match.date)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {schedule.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📅</ThemedText>
            <ThemedText style={styles.emptyTitle}>Brak meczów</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Pobierz terminarz z RegioWyniki.pl, aby zobaczyć nadchodzące mecze
            </ThemedText>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoTitle}>ℹ️ Informacje</ThemedText>
          <ThemedText style={styles.infoText}>
            Terminarz jest pobierany z RegioWyniki.pl dla sezonu 2025/2026.
            Pociągnij w dół, aby odświeżyć listę meczów.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#10b981',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
  },
  syncStatus: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  syncInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  syncValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionButton: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pastMatchCard: {
    opacity: 0.7,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  homeBadge: {
    backgroundColor: '#10b981',
  },
  awayBadge: {
    backgroundColor: '#6366f1',
  },
  pastBadge: {
    opacity: 0.6,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchCompetition: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  syncedBadge: {
    backgroundColor: '#10b981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  teamName: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  highlightedTeam: {
    color: '#10b981',
    fontWeight: '600',
  },
  vsText: {
    color: '#6b7280',
    fontSize: 12,
    marginHorizontal: 8,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  matchDate: {
    color: '#9ca3af',
    fontSize: 13,
  },
  matchTime: {
    color: '#9ca3af',
    fontSize: 13,
  },
  pastText: {
    color: '#6b7280',
  },
  addToCalendarButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addToCalendarText: {
    color: '#10b981',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  infoSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 20,
  },
});
