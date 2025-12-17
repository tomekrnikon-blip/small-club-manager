import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { LeagueTable } from '@/components/league-table';
import { AppColors, Spacing, Radius } from '@/constants/theme';

export default function LeagueTableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClubData();
  }, []);

  const loadClubData = async () => {
    try {
      const pzpnId = await AsyncStorage.getItem('onboarding_club_pzpn_id');
      const name = await AsyncStorage.getItem('onboarding_club_name');
      
      if (pzpnId) {
        setClubId(pzpnId);
      }
      if (name) {
        setClubName(name);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            Tabela ligowa
          </ThemedText>
          {clubName && (
            <ThemedText style={styles.headerSubtitle}>
              {clubName}
            </ThemedText>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <ThemedText style={styles.loadingText}>Ładowanie...</ThemedText>
          </View>
        ) : clubId ? (
          <LeagueTable teamId={clubId} highlightTeamId={clubId} />
        ) : (
          <View style={styles.noClubContainer}>
            <Ionicons name="football-outline" size={64} color={AppColors.textDisabled} />
            <ThemedText style={styles.noClubTitle}>Brak danych o klubie</ThemedText>
            <ThemedText style={styles.noClubText}>
              Aby zobaczyć tabelę ligową, wybierz klub z bazy PZPN podczas konfiguracji.
            </ThemedText>
            <Pressable 
              style={styles.setupButton}
              onPress={() => router.push('/onboarding/club-setup')}
            >
              <ThemedText style={styles.setupButtonText}>Skonfiguruj klub</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Legend */}
        {clubId && (
          <View style={styles.legend}>
            <ThemedText style={styles.legendTitle}>Legenda</ThemedText>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: AppColors.success }]} />
                <ThemedText style={styles.legendText}>Awans</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: AppColors.danger }]} />
                <ThemedText style={styles.legendText}>Spadek</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.formBadge, { backgroundColor: AppColors.success }]}>
                  <ThemedText style={styles.formBadgeText}>W</ThemedText>
                </View>
                <ThemedText style={styles.legendText}>Wygrana</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.formBadge, { backgroundColor: AppColors.warning }]}>
                  <ThemedText style={styles.formBadgeText}>R</ThemedText>
                </View>
                <ThemedText style={styles.legendText}>Remis</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.formBadge, { backgroundColor: AppColors.danger }]}>
                  <ThemedText style={styles.formBadgeText}>P</ThemedText>
                </View>
                <ThemedText style={styles.legendText}>Porażka</ThemedText>
              </View>
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: AppColors.textSecondary,
  },
  noClubContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  noClubTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  noClubText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  setupButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  formBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
