import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

type ClubTrialInfo = {
  id: number;
  name: string;
  managerName: string;
  managerEmail: string;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  isTrialActive: boolean;
  subscriptionRequired: boolean;
  daysRemaining: number;
  status: 'active' | 'expired' | 'subscribed';
};

export default function AdminTrialsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'subscribed'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [extendDays, setExtendDays] = useState('7');
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  // Mock data - replace with actual API call
  const [clubs, setClubs] = useState<ClubTrialInfo[]>([
    {
      id: 1,
      name: 'KS Orzeł Warszawa',
      managerName: 'Jan Kowalski',
      managerEmail: 'jan@orzel.pl',
      trialStartDate: new Date('2024-11-15'),
      trialEndDate: new Date('2024-12-15'),
      isTrialActive: true,
      subscriptionRequired: false,
      daysRemaining: 12,
      status: 'active',
    },
    {
      id: 2,
      name: 'LKS Sokół Kraków',
      managerName: 'Anna Nowak',
      managerEmail: 'anna@sokol.pl',
      trialStartDate: new Date('2024-10-01'),
      trialEndDate: new Date('2024-10-31'),
      isTrialActive: false,
      subscriptionRequired: true,
      daysRemaining: 0,
      status: 'expired',
    },
    {
      id: 3,
      name: 'GKS Piast Gliwice',
      managerName: 'Piotr Wiśniewski',
      managerEmail: 'piotr@piast.pl',
      trialStartDate: new Date('2024-09-01'),
      trialEndDate: new Date('2024-10-01'),
      isTrialActive: false,
      subscriptionRequired: false,
      daysRemaining: 0,
      status: 'subscribed',
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh data from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.managerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || club.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleExtendTrial = (clubId: number) => {
    const days = parseInt(extendDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Błąd', 'Podaj prawidłową liczbę dni');
      return;
    }

    Alert.alert(
      'Przedłuż okres próbny',
      `Czy na pewno chcesz przedłużyć okres próbny o ${days} dni?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Przedłuż',
          onPress: () => {
            // Call API to extend trial
            setClubs(prev => prev.map(club => {
              if (club.id === clubId) {
                const newEndDate = new Date(club.trialEndDate || new Date());
                newEndDate.setDate(newEndDate.getDate() + days);
                return {
                  ...club,
                  trialEndDate: newEndDate,
                  isTrialActive: true,
                  subscriptionRequired: false,
                  daysRemaining: club.daysRemaining + days,
                  status: 'active' as const,
                };
              }
              return club;
            }));
            setSelectedClubId(null);
            Alert.alert('Sukces', `Okres próbny przedłużony o ${days} dni`);
          },
        },
      ]
    );
  };

  const handleActivateSubscription = (clubId: number) => {
    Alert.alert(
      'Aktywuj subskrypcję',
      'Czy na pewno chcesz aktywować subskrypcję dla tego klubu?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Aktywuj',
          onPress: () => {
            setClubs(prev => prev.map(club => {
              if (club.id === clubId) {
                return {
                  ...club,
                  isTrialActive: false,
                  subscriptionRequired: false,
                  status: 'subscribed' as const,
                };
              }
              return club;
            }));
            Alert.alert('Sukces', 'Subskrypcja została aktywowana');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return AppColors.primary;
      case 'expired': return AppColors.danger;
      case 'subscribed': return AppColors.secondary;
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktywny trial';
      case 'expired': return 'Wygasły';
      case 'subscribed': return 'Subskrybent';
      default: return status;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pl-PL');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Zarządzanie Trialami</ThemedText>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: AppColors.primary + '20' }]}>
          <ThemedText style={styles.statValue}>
            {clubs.filter(c => c.status === 'active').length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Aktywne</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: AppColors.danger + '20' }]}>
          <ThemedText style={styles.statValue}>
            {clubs.filter(c => c.status === 'expired').length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Wygasłe</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: AppColors.secondary + '20' }]}>
          <ThemedText style={styles.statValue}>
            {clubs.filter(c => c.status === 'subscribed').length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Subskrybenci</ThemedText>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj klubu lub managera..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#64748b" />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'active', 'expired', 'subscribed'] as const).map((status) => (
          <Pressable
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <ThemedText
              style={[
                styles.filterTabText,
                filterStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status === 'all' ? 'Wszystkie' : getStatusLabel(status)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Club List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClubs.map((club) => (
          <View key={club.id} style={styles.clubCard}>
            <View style={styles.clubHeader}>
              <View style={styles.clubInfo}>
                <ThemedText style={styles.clubName}>{club.name}</ThemedText>
                <ThemedText style={styles.managerName}>{club.managerName}</ThemedText>
                <ThemedText style={styles.managerEmail}>{club.managerEmail}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(club.status) + '20' }]}>
                <ThemedText style={[styles.statusText, { color: getStatusColor(club.status) }]}>
                  {getStatusLabel(club.status)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.trialDates}>
              <View style={styles.dateItem}>
                <ThemedText style={styles.dateLabel}>Start:</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(club.trialStartDate)}</ThemedText>
              </View>
              <View style={styles.dateItem}>
                <ThemedText style={styles.dateLabel}>Koniec:</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(club.trialEndDate)}</ThemedText>
              </View>
              {club.status === 'active' && (
                <View style={styles.dateItem}>
                  <ThemedText style={styles.dateLabel}>Pozostało:</ThemedText>
                  <ThemedText style={[styles.dateValue, { color: AppColors.primary }]}>
                    {club.daysRemaining} dni
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Actions */}
            {selectedClubId === club.id ? (
              <View style={styles.extendForm}>
                <TextInput
                  style={styles.daysInput}
                  placeholder="Dni"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  value={extendDays}
                  onChangeText={setExtendDays}
                />
                <Pressable
                  style={styles.extendButton}
                  onPress={() => handleExtendTrial(club.id)}
                >
                  <ThemedText style={styles.extendButtonText}>Przedłuż</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setSelectedClubId(null)}
                >
                  <MaterialIcons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => setSelectedClubId(club.id)}
                >
                  <MaterialIcons name="add" size={18} color={AppColors.primary} />
                  <ThemedText style={styles.actionButtonText}>Przedłuż trial</ThemedText>
                </Pressable>
                {club.status !== 'subscribed' && (
                  <Pressable
                    style={[styles.actionButton, styles.subscribeButton]}
                    onPress={() => handleActivateSubscription(club.id)}
                  >
                    <MaterialIcons name="star" size={18} color={AppColors.secondary} />
                    <ThemedText style={[styles.actionButtonText, { color: AppColors.secondary }]}>
                      Aktywuj subskrypcję
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ))}

        {filteredClubs.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#475569" />
            <ThemedText style={styles.emptyText}>Nie znaleziono klubów</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.bgCard,
  },
  filterTabActive: {
    backgroundColor: AppColors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  clubCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  managerName: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  managerEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trialDates: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  dateItem: {
    flexDirection: 'row',
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  dateValue: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.primary + '20',
  },
  subscribeButton: {
    backgroundColor: AppColors.secondary + '20',
  },
  actionButtonText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '500',
  },
  extendForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysInput: {
    width: 60,
    backgroundColor: '#1e293b',
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#fff',
    textAlign: 'center',
  },
  extendButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
  },
  extendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});
