import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type TabType = 'overview' | 'attendance' | 'upcoming';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Get club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Fetch data
  const { data: players, isLoading: loadingPlayers } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const { data: matches, isLoading: loadingMatches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const { data: trainings, isLoading: loadingTrainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const isLoading = loadingPlayers || loadingMatches || loadingTrainings;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!players || !matches || !trainings) return null;

    const now = new Date();
    const upcomingMatches = matches.filter((m: any) => new Date(m.matchDate) > now);
    const upcomingTrainings = trainings.filter((t: any) => new Date(t.trainingDate) > now);
    const pastTrainings = trainings.filter((t: any) => new Date(t.trainingDate) <= now);

    // Calculate average attendance (mock - would need real attendance data)
    const avgAttendance = pastTrainings.length > 0 ? 78 : 0;

    return {
      totalPlayers: players.length,
      upcomingMatches: upcomingMatches.length,
      upcomingTrainings: upcomingTrainings.length,
      pastTrainings: pastTrainings.length,
      avgAttendance,
      nextMatch: upcomingMatches[0],
      nextTraining: upcomingTrainings[0],
    };
  }, [players, matches, trainings]);

  // Get players with attendance stats (mock data for demonstration)
  const playersWithStats = useMemo(() => {
    if (!players) return [];
    return players.map((player: any) => ({
      ...player,
      trainingAttendance: Math.floor(Math.random() * 30) + 70, // 70-100%
      matchAttendance: Math.floor(Math.random() * 20) + 80, // 80-100%
      lastTraining: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
  }, [players]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    if (!matches || !trainings) return [];
    const now = new Date();
    const events = [
      ...matches.filter((m: any) => new Date(m.matchDate) > now).map((m: any) => ({
        ...m,
        type: 'match' as const,
        dateObj: new Date(m.matchDate),
      })),
      ...trainings.filter((t: any) => new Date(t.trainingDate) > now).map((t: any) => ({
        ...t,
        type: 'training' as const,
        dateObj: new Date(t.trainingDate),
      })),
    ];
    return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 10);
  }, [matches, trainings]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#1e3a5f' }]}>
          <MaterialIcons name="people" size={28} color="#3b82f6" />
          <ThemedText style={styles.statValue}>{stats?.totalPlayers || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Zawodników</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1e3a2f' }]}>
          <MaterialIcons name="percent" size={28} color="#22c55e" />
          <ThemedText style={styles.statValue}>{stats?.avgAttendance || 0}%</ThemedText>
          <ThemedText style={styles.statLabel}>Śr. frekwencja</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3a1e3f' }]}>
          <MaterialIcons name="sports-soccer" size={28} color="#a855f7" />
          <ThemedText style={styles.statValue}>{stats?.upcomingMatches || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Nadch. mecze</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3a2f1e' }]}>
          <MaterialIcons name="fitness-center" size={28} color="#f59e0b" />
          <ThemedText style={styles.statValue}>{stats?.upcomingTrainings || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Nadch. treningi</ThemedText>
        </View>
      </View>

      {/* Next Event Cards */}
      {stats?.nextMatch && (
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventBadge, { backgroundColor: '#a855f7' }]}>
              <MaterialIcons name="sports-soccer" size={16} color="#fff" />
            </View>
            <ThemedText style={styles.eventTitle}>Najbliższy mecz</ThemedText>
          </View>
          <ThemedText style={styles.eventName}>
            vs {stats.nextMatch.opponent}
          </ThemedText>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialIcons name="event" size={16} color="#64748b" />
              <ThemedText style={styles.eventDetailText}>
                {formatDate(new Date(stats.nextMatch.matchDate))}
              </ThemedText>
            </View>
            <View style={styles.eventDetail}>
              <MaterialIcons name="schedule" size={16} color="#64748b" />
              <ThemedText style={styles.eventDetailText}>
                {formatTime(new Date(stats.nextMatch.matchDate))}
              </ThemedText>
            </View>
          </View>
          <Pressable 
            style={styles.eventButton}
            onPress={() => router.push(`/match/${stats.nextMatch.id}` as any)}
          >
            <ThemedText style={styles.eventButtonText}>Zobacz szczegóły</ThemedText>
            <MaterialIcons name="chevron-right" size={20} color={AppColors.primary} />
          </Pressable>
        </View>
      )}

      {stats?.nextTraining && (
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventBadge, { backgroundColor: '#f59e0b' }]}>
              <MaterialIcons name="fitness-center" size={16} color="#fff" />
            </View>
            <ThemedText style={styles.eventTitle}>Najbliższy trening</ThemedText>
          </View>
          <ThemedText style={styles.eventName}>
            {stats.nextTraining.location || 'Trening'}
          </ThemedText>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialIcons name="event" size={16} color="#64748b" />
              <ThemedText style={styles.eventDetailText}>
                {formatDate(new Date(stats.nextTraining.trainingDate))}
              </ThemedText>
            </View>
            <View style={styles.eventDetail}>
              <MaterialIcons name="schedule" size={16} color="#64748b" />
              <ThemedText style={styles.eventDetailText}>
                {formatTime(new Date(stats.nextTraining.trainingDate))}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ThemedText style={styles.sectionTitle}>Szybkie akcje</ThemedText>
        <View style={styles.actionsGrid}>
          <Pressable 
            style={styles.actionBtn}
            onPress={() => router.push('/frequency-report' as any)}
          >
            <MaterialIcons name="assessment" size={24} color="#3b82f6" />
            <ThemedText style={styles.actionText}>Raport frekwencji</ThemedText>
          </Pressable>
          <Pressable 
            style={styles.actionBtn}
            onPress={() => router.push('/team-frequency' as any)}
          >
            <MaterialIcons name="bar-chart" size={24} color="#22c55e" />
            <ThemedText style={styles.actionText}>Porównanie zespołów</ThemedText>
          </Pressable>
          <Pressable 
            style={styles.actionBtn}
            onPress={() => router.push('/calendar-sync' as any)}
          >
            <MaterialIcons name="sync" size={24} color="#f59e0b" />
            <ThemedText style={styles.actionText}>Sync kalendarza</ThemedText>
          </Pressable>
          <Pressable 
            style={styles.actionBtn}
            onPress={() => router.push('/auto-reminders' as any)}
          >
            <MaterialIcons name="notifications-active" size={24} color="#a855f7" />
            <ThemedText style={styles.actionText}>Przypomnienia</ThemedText>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  const renderAttendance = () => (
    <FlatList
      data={playersWithStats}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <Pressable 
          style={styles.playerCard}
          onPress={() => router.push(`/player-stats/${item.id}` as any)}
        >
          <View style={styles.playerInfo}>
            <View style={styles.playerAvatar}>
              <ThemedText style={styles.avatarText}>
                {item.firstName?.[0]}{item.lastName?.[0]}
              </ThemedText>
            </View>
            <View style={styles.playerDetails}>
              <ThemedText style={styles.playerName}>
                {item.firstName} {item.lastName}
              </ThemedText>
              <ThemedText style={styles.playerPosition}>
                {item.position || 'Brak pozycji'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <ThemedText style={styles.attendanceLabel}>Treningi</ThemedText>
              <ThemedText style={[
                styles.attendanceValue,
                { color: getAttendanceColor(item.trainingAttendance) }
              ]}>
                {item.trainingAttendance}%
              </ThemedText>
            </View>
            <View style={styles.attendanceStat}>
              <ThemedText style={styles.attendanceLabel}>Mecze</ThemedText>
              <ThemedText style={[
                styles.attendanceValue,
                { color: getAttendanceColor(item.matchAttendance) }
              ]}>
                {item.matchAttendance}%
              </ThemedText>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#64748b" />
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="people-outline" size={48} color="#64748b" />
          <ThemedText style={styles.emptyText}>Brak zawodników</ThemedText>
        </View>
      }
    />
  );

  const renderUpcoming = () => (
    <FlatList
      data={upcomingEvents}
      keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <Pressable 
          style={styles.upcomingCard}
          onPress={() => {
            if (item.type === 'match') {
              router.push(`/match/${item.id}` as any);
            }
          }}
        >
          <View style={[
            styles.upcomingBadge,
            { backgroundColor: item.type === 'match' ? '#a855f7' : '#f59e0b' }
          ]}>
            <MaterialIcons 
              name={item.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
              size={20} 
              color="#fff" 
            />
          </View>
          <View style={styles.upcomingInfo}>
            <ThemedText style={styles.upcomingTitle}>
              {item.type === 'match' ? `vs ${item.opponent}` : (item.location || 'Trening')}
            </ThemedText>
            <View style={styles.upcomingMeta}>
              <ThemedText style={styles.upcomingDate}>
                {formatDate(item.dateObj)}
              </ThemedText>
              <ThemedText style={styles.upcomingTime}>
                {formatTime(item.dateObj)}
              </ThemedText>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#64748b" />
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={48} color="#64748b" />
          <ThemedText style={styles.emptyText}>Brak nadchodzących wydarzeń</ThemedText>
        </View>
      }
    />
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <ThemedText style={styles.loadingText}>Ładowanie danych...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Dashboard Trenera</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <MaterialIcons 
            name="dashboard" 
            size={20} 
            color={activeTab === 'overview' ? AppColors.primary : '#64748b'} 
          />
          <ThemedText style={[
            styles.tabText,
            activeTab === 'overview' && styles.tabTextActive
          ]}>
            Przegląd
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <MaterialIcons 
            name="how-to-reg" 
            size={20} 
            color={activeTab === 'attendance' ? AppColors.primary : '#64748b'} 
          />
          <ThemedText style={[
            styles.tabText,
            activeTab === 'attendance' && styles.tabTextActive
          ]}>
            Frekwencja
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <MaterialIcons 
            name="event" 
            size={20} 
            color={activeTab === 'upcoming' ? AppColors.primary : '#64748b'} 
          />
          <ThemedText style={[
            styles.tabText,
            activeTab === 'upcoming' && styles.tabTextActive
          ]}>
            Nadchodzące
          </ThemedText>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'attendance' && renderAttendance()}
      {activeTab === 'upcoming' && renderUpcoming()}
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
  loadingText: {
    marginTop: Spacing.md,
    color: "#64748b",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  tabText: {
    fontSize: 13,
    color: "#64748b",
  },
  tabTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  eventCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  eventDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  eventDetailText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  eventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  eventButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  quickActions: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + '30',
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 12,
    color: "#64748b",
  },
  attendanceStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  attendanceStat: {
    alignItems: "center",
  },
  attendanceLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  attendanceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  upcomingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  upcomingMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  upcomingDate: {
    fontSize: 12,
    color: "#64748b",
  },
  upcomingTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
});
