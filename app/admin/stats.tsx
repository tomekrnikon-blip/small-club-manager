import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors, Spacing, Radius } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = '7d' | '30d' | '90d' | 'all';

type ConversionStats = {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedToSubscription: number;
  conversionRate: number;
  averageTrialDuration: number;
  revenueFromConversions: number;
};

type DailyStats = {
  date: string;
  newTrials: number;
  conversions: number;
  expirations: number;
};

export default function AdminStatsScreen() {
  const insets = useSafeAreaInsets();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Mock data - replace with actual API call
  const stats: ConversionStats = {
    totalTrials: 156,
    activeTrials: 42,
    expiredTrials: 78,
    convertedToSubscription: 36,
    conversionRate: 23.1,
    averageTrialDuration: 24.5,
    revenueFromConversions: 3240,
  };

  const dailyStats: DailyStats[] = [
    { date: '2024-12-10', newTrials: 5, conversions: 2, expirations: 1 },
    { date: '2024-12-11', newTrials: 3, conversions: 1, expirations: 2 },
    { date: '2024-12-12', newTrials: 7, conversions: 3, expirations: 0 },
    { date: '2024-12-13', newTrials: 4, conversions: 1, expirations: 3 },
    { date: '2024-12-14', newTrials: 6, conversions: 2, expirations: 1 },
    { date: '2024-12-15', newTrials: 8, conversions: 4, expirations: 2 },
    { date: '2024-12-16', newTrials: 5, conversions: 2, expirations: 1 },
  ];

  const topConversionSources = [
    { source: 'Organiczny', count: 18, percentage: 50 },
    { source: 'Polecenie', count: 10, percentage: 28 },
    { source: 'Social Media', count: 5, percentage: 14 },
    { source: 'Reklama', count: 3, percentage: 8 },
  ];

  const maxDailyValue = Math.max(
    ...dailyStats.map(d => Math.max(d.newTrials, d.conversions, d.expirations))
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Statystyki Konwersji</ThemedText>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <ThemedText
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
              ]}
            >
              {range === '7d' ? '7 dni' : range === '30d' ? '30 dni' : range === '90d' ? '90 dni' : 'Wszystko'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardLarge]}>
            <View style={styles.statHeader}>
              <MaterialIcons name="trending-up" size={24} color={AppColors.primary} />
              <ThemedText style={styles.statLabel}>Wskaźnik konwersji</ThemedText>
            </View>
            <ThemedText style={[styles.statValue, { color: AppColors.primary }]}>
              {stats.conversionRate}%
            </ThemedText>
            <ThemedText style={styles.statSubtext}>
              {stats.convertedToSubscription} z {stats.totalTrials} triali
            </ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="play-circle" size={20} color={AppColors.secondary} />
            <ThemedText style={styles.statValue}>{stats.activeTrials}</ThemedText>
            <ThemedText style={styles.statLabel}>Aktywne triale</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="timer-off" size={20} color={AppColors.danger} />
            <ThemedText style={styles.statValue}>{stats.expiredTrials}</ThemedText>
            <ThemedText style={styles.statLabel}>Wygasłe</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="star" size={20} color="#f59e0b" />
            <ThemedText style={styles.statValue}>{stats.convertedToSubscription}</ThemedText>
            <ThemedText style={styles.statLabel}>Konwersje</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="schedule" size={20} color="#8b5cf6" />
            <ThemedText style={styles.statValue}>{stats.averageTrialDuration}</ThemedText>
            <ThemedText style={styles.statLabel}>Śr. dni trialu</ThemedText>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <MaterialIcons name="attach-money" size={28} color={AppColors.primary} />
            <View>
              <ThemedText style={styles.revenueLabel}>Przychód z konwersji</ThemedText>
              <ThemedText style={styles.revenueValue}>
                {stats.revenueFromConversions.toLocaleString('pl-PL')} PLN
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.revenueSubtext}>
            Średnio {Math.round(stats.revenueFromConversions / stats.convertedToSubscription)} PLN / konwersja
          </ThemedText>
        </View>

        {/* Daily Chart */}
        <View style={styles.chartSection}>
          <ThemedText style={styles.sectionTitle}>Aktywność dzienna</ThemedText>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
              <ThemedText style={styles.legendText}>Nowe triale</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.secondary }]} />
              <ThemedText style={styles.legendText}>Konwersje</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.danger }]} />
              <ThemedText style={styles.legendText}>Wygaśnięcia</ThemedText>
            </View>
          </View>
          <View style={styles.chart}>
            {dailyStats.map((day, index) => (
              <View key={day.date} style={styles.chartColumn}>
                <View style={styles.barsContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (day.newTrials / maxDailyValue) * 80,
                        backgroundColor: AppColors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (day.conversions / maxDailyValue) * 80,
                        backgroundColor: AppColors.secondary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (day.expirations / maxDailyValue) * 80,
                        backgroundColor: AppColors.danger,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={styles.chartLabel}>
                  {day.date.split('-')[2]}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Conversion Sources */}
        <View style={styles.sourcesSection}>
          <ThemedText style={styles.sectionTitle}>Źródła konwersji</ThemedText>
          {topConversionSources.map((source, index) => (
            <View key={source.source} style={styles.sourceRow}>
              <View style={styles.sourceInfo}>
                <ThemedText style={styles.sourceRank}>#{index + 1}</ThemedText>
                <ThemedText style={styles.sourceName}>{source.source}</ThemedText>
              </View>
              <View style={styles.sourceStats}>
                <View style={styles.sourceBar}>
                  <View
                    style={[
                      styles.sourceBarFill,
                      { width: `${source.percentage}%` },
                    ]}
                  />
                </View>
                <ThemedText style={styles.sourceCount}>{source.count}</ThemedText>
                <ThemedText style={styles.sourcePercentage}>{source.percentage}%</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <ThemedText style={styles.sectionTitle}>Szybkie akcje</ThemedText>
          <View style={styles.actionsGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push('/admin/trials')}
            >
              <MaterialIcons name="manage-accounts" size={24} color={AppColors.primary} />
              <ThemedText style={styles.actionText}>Zarządzaj trialami</ThemedText>
            </Pressable>
            <Pressable style={styles.actionCard}>
              <MaterialIcons name="download" size={24} color={AppColors.secondary} />
              <ThemedText style={styles.actionText}>Eksportuj raport</ThemedText>
            </Pressable>
            <Pressable style={styles.actionCard}>
              <MaterialIcons name="email" size={24} color="#8b5cf6" />
              <ThemedText style={styles.actionText}>Kampania email</ThemedText>
            </Pressable>
            <Pressable style={styles.actionCard}>
              <MaterialIcons name="settings" size={24} color="#64748b" />
              <ThemedText style={styles.actionText}>Ustawienia</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
  },
  timeRangeButtonActive: {
    backgroundColor: AppColors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (screenWidth - 48 - 12) / 2,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statCardLarge: {
    width: '100%',
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  revenueCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  revenueSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  chartSection: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
  },
  sourcesSection: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceRank: {
    fontSize: 14,
    color: '#64748b',
    width: 24,
  },
  sourceName: {
    fontSize: 14,
    color: '#fff',
  },
  sourceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceBar: {
    width: 60,
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sourceBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  sourceCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    width: 24,
    textAlign: 'right',
  },
  sourcePercentage: {
    fontSize: 12,
    color: '#64748b',
    width: 36,
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (screenWidth - 48 - 12) / 2,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
