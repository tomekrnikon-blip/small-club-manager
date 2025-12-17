import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

interface DashboardStats {
  totalClubs: number;
  activeTrials: number;
  expiringTrials: number;
  expiredTrials: number;
  totalSubscriptions: number;
  monthlyRevenue: number;
  newRegistrations: number;
  conversionRate: number;
}

interface Alert {
  id: string;
  type: 'registration' | 'trial_expiring' | 'trial_expired' | 'subscription';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalClubs: 0,
    activeTrials: 0,
    expiringTrials: 0,
    expiredTrials: 0,
    totalSubscriptions: 0,
    monthlyRevenue: 0,
    newRegistrations: 0,
    conversionRate: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in production, fetch from API
      setStats({
        totalClubs: 156,
        activeTrials: 23,
        expiringTrials: 8,
        expiredTrials: 12,
        totalSubscriptions: 89,
        monthlyRevenue: 4450,
        newRegistrations: 15,
        conversionRate: 57,
      });

      setAlerts([
        {
          id: '1',
          type: 'registration',
          title: 'Nowa rejestracja',
          message: 'Klub "FC Orzeł Warszawa" został zarejestrowany',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isRead: false,
        },
        {
          id: '2',
          type: 'trial_expiring',
          title: 'Trial wygasa za 3 dni',
          message: 'Klub "KS Błyskawica" - okres próbny kończy się wkrótce',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isRead: false,
        },
        {
          id: '3',
          type: 'subscription',
          title: 'Nowa subskrypcja',
          message: 'Klub "UKS Sokół" wykupił plan PRO Roczny',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          isRead: true,
        },
        {
          id: '4',
          type: 'trial_expired',
          title: 'Trial wygasł',
          message: 'Klub "LKS Zorza" - okres próbny zakończony',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          isRead: true,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'registration':
        return 'person-add';
      case 'trial_expiring':
        return 'time';
      case 'trial_expired':
        return 'alert-circle';
      case 'subscription':
        return 'star';
      default:
        return 'notifications';
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'registration':
        return AppColors.primary;
      case 'trial_expiring':
        return AppColors.warning;
      case 'trial_expired':
        return AppColors.danger;
      case 'subscription':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours}h temu`;
    return `${days}d temu`;
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <ThemedText style={styles.loadingText}>Ładowanie dashboardu...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Panel Admina</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Pressable 
            style={styles.statCard}
            onPress={() => router.push('/admin/trials' as any)}
          >
            <View style={[styles.statIcon, { backgroundColor: AppColors.primary + '20' }]}>
              <Ionicons name="business" size={24} color={AppColors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalClubs}</Text>
            <Text style={styles.statLabel}>Klubów</Text>
          </Pressable>

          <Pressable 
            style={styles.statCard}
            onPress={() => router.push('/admin/trials' as any)}
          >
            <View style={[styles.statIcon, { backgroundColor: AppColors.warning + '20' }]}>
              <Ionicons name="time" size={24} color={AppColors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.activeTrials}</Text>
            <Text style={styles.statLabel}>Aktywne trialy</Text>
          </Pressable>

          <Pressable 
            style={styles.statCard}
            onPress={() => router.push('/admin/stats' as any)}
          >
            <View style={[styles.statIcon, { backgroundColor: AppColors.success + '20' }]}>
              <Ionicons name="star" size={24} color={AppColors.success} />
            </View>
            <Text style={styles.statValue}>{stats.totalSubscriptions}</Text>
            <Text style={styles.statLabel}>Subskrypcji</Text>
          </Pressable>

          <Pressable 
            style={styles.statCard}
            onPress={() => router.push('/admin/stats' as any)}
          >
            <View style={[styles.statIcon, { backgroundColor: AppColors.primary + '20' }]}>
              <Ionicons name="trending-up" size={24} color={AppColors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.conversionRate}%</Text>
            <Text style={styles.statLabel}>Konwersja</Text>
          </Pressable>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueTitle}>Przychód miesięczny</Text>
            <Ionicons name="wallet" size={24} color={AppColors.success} />
          </View>
          <Text style={styles.revenueValue}>{stats.monthlyRevenue.toLocaleString()} PLN</Text>
          <View style={styles.revenueDetails}>
            <View style={styles.revenueDetail}>
              <Text style={styles.revenueDetailLabel}>Nowe rejestracje</Text>
              <Text style={styles.revenueDetailValue}>+{stats.newRegistrations}</Text>
            </View>
            <View style={styles.revenueDetail}>
              <Text style={styles.revenueDetailLabel}>Wygasające trialy</Text>
              <Text style={[styles.revenueDetailValue, { color: AppColors.warning }]}>
                {stats.expiringTrials}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          <View style={styles.actionsGrid}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/admin/trials' as any)}
            >
              <Ionicons name="timer" size={28} color={AppColors.primary} />
              <Text style={styles.actionLabel}>Zarządzaj trialami</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/admin/stats' as any)}
            >
              <Ionicons name="stats-chart" size={28} color={AppColors.primary} />
              <Text style={styles.actionLabel}>Statystyki</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/admin/alerts' as any)}
            >
              <Ionicons name="notifications" size={28} color={AppColors.primary} />
              <Text style={styles.actionLabel}>Alerty</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/admin/analytics' as any)}
            >
              <Ionicons name="analytics" size={28} color={AppColors.primary} />
              <Text style={styles.actionLabel}>Analityka</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ostatnie alerty</Text>
            <Pressable onPress={() => router.push('/admin/alerts' as any)}>
              <Text style={styles.seeAllLink}>Zobacz wszystkie</Text>
            </Pressable>
          </View>
          
          {alerts.slice(0, 4).map(alert => (
            <View 
              key={alert.id} 
              style={[styles.alertCard, !alert.isRead && styles.alertUnread]}
            >
              <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                <Ionicons 
                  name={getAlertIcon(alert.type) as any} 
                  size={20} 
                  color={getAlertColor(alert.type)} 
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage} numberOfLines={1}>{alert.message}</Text>
                <Text style={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</Text>
              </View>
              {!alert.isRead && <View style={styles.unreadDot} />}
            </View>
          ))}
        </View>

        {/* Trial Status Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status triali</Text>
          <View style={styles.trialStatusCard}>
            <View style={styles.trialStatusRow}>
              <View style={styles.trialStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: AppColors.success }]} />
                <Text style={styles.trialStatusLabel}>Aktywne</Text>
                <Text style={styles.trialStatusValue}>{stats.activeTrials}</Text>
              </View>
              <View style={styles.trialStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: AppColors.warning }]} />
                <Text style={styles.trialStatusLabel}>Wygasające</Text>
                <Text style={styles.trialStatusValue}>{stats.expiringTrials}</Text>
              </View>
              <View style={styles.trialStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: AppColors.danger }]} />
                <Text style={styles.trialStatusLabel}>Wygasłe</Text>
                <Text style={styles.trialStatusValue}>{stats.expiredTrials}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: AppColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.success,
    marginBottom: 16,
  },
  revenueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueDetail: {
    flex: 1,
  },
  revenueDetailLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  revenueDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: AppColors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  alertUnread: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  alertMessage: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginLeft: 8,
  },
  trialStatusCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
  },
  trialStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trialStatusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  trialStatusLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  trialStatusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginTop: 4,
  },
});
