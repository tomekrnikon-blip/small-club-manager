import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import {
  REGIONS,
  getDistrictsForRegion,
  getLeaguesForDistrict,
  getClubsForDistrictAndLeague,
  searchClubsByName,
  getSeasonData,
  Club,
  District,
  League,
  SeasonData,
} from '@/lib/polish-football-data';

type Step = 'region' | 'district' | 'league' | 'club' | 'confirm';

interface ClubSelectionWizardProps {
  onComplete: (club: Club, seasonData: SeasonData | null) => void;
  onCancel: () => void;
}

export function ClubSelectionWizard({ onComplete, onCancel }: ClubSelectionWizardProps) {
  const [step, setStep] = useState<Step>('region');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const districts = selectedRegion ? getDistrictsForRegion(selectedRegion) : [];
  const leagues = selectedDistrict ? getLeaguesForDistrict(selectedDistrict.code) : [];
  const clubs = selectedDistrict && selectedLeague 
    ? getClubsForDistrictAndLeague(selectedDistrict.code, selectedLeague.code)
    : [];

  // Search results
  const searchResults = searchQuery.length >= 2 
    ? searchClubsByName(searchQuery, selectedDistrict?.code)
    : [];

  const handleSelectRegion = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setSelectedDistrict(null);
    setSelectedLeague(null);
    setSelectedClub(null);
    setStep('district');
  };

  const handleSelectDistrict = (district: District) => {
    setSelectedDistrict(district);
    setSelectedLeague(null);
    setSelectedClub(null);
    setStep('league');
  };

  const handleSelectLeague = (league: League) => {
    setSelectedLeague(league);
    setSelectedClub(null);
    setStep('club');
  };

  const handleSelectClub = async (club: Club) => {
    setSelectedClub(club);
    setIsLoading(true);
    
    // Fetch season data
    const data = getSeasonData(club.id);
    setSeasonData(data);
    setIsLoading(false);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (selectedClub) {
      onComplete(selectedClub, seasonData);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'district':
        setStep('region');
        setSelectedRegion(null);
        break;
      case 'league':
        setStep('district');
        setSelectedDistrict(null);
        break;
      case 'club':
        setStep('league');
        setSelectedLeague(null);
        break;
      case 'confirm':
        setStep('club');
        setSelectedClub(null);
        setSeasonData(null);
        break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'region': return 'Wybierz województwo';
      case 'district': return 'Wybierz okręg (OZPN)';
      case 'league': return 'Wybierz ligę';
      case 'club': return 'Wybierz klub';
      case 'confirm': return 'Potwierdź wybór';
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'region': return 1;
      case 'district': return 2;
      case 'league': return 3;
      case 'club': return 4;
      case 'confirm': return 5;
    }
  };

  const renderBreadcrumb = () => {
    const items = [];
    if (selectedRegion) {
      const region = REGIONS.find(r => r.code === selectedRegion);
      items.push(region?.name || '');
    }
    if (selectedDistrict) {
      items.push(selectedDistrict.name);
    }
    if (selectedLeague) {
      items.push(selectedLeague.name);
    }
    if (selectedClub) {
      items.push(selectedClub.name);
    }
    
    if (items.length === 0) return null;
    
    return (
      <View style={styles.breadcrumb}>
        {items.map((item, index) => (
          <View key={index} style={styles.breadcrumbItem}>
            {index > 0 && (
              <Ionicons name="chevron-forward" size={14} color={AppColors.textDisabled} />
            )}
            <ThemedText style={styles.breadcrumbText}>{item}</ThemedText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {step !== 'region' ? (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
            </Pressable>
          ) : (
            <Pressable onPress={onCancel} style={styles.backButton}>
              <Ionicons name="close" size={24} color={AppColors.textPrimary} />
            </Pressable>
          )}
          <View style={styles.stepIndicator}>
            <ThemedText style={styles.stepText}>Krok {getStepNumber()} z 5</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.title}>{getStepTitle()}</ThemedText>
        {renderBreadcrumb()}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'region' && (
          <Animated.View entering={FadeInRight.duration(300)}>
            <View style={styles.grid}>
              {REGIONS.map(region => (
                <Pressable
                  key={region.code}
                  style={styles.gridItem}
                  onPress={() => handleSelectRegion(region.code)}
                >
                  <Ionicons name="location" size={24} color={AppColors.primary} />
                  <ThemedText style={styles.gridItemText}>{region.name}</ThemedText>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textDisabled} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'district' && (
          <Animated.View entering={FadeInRight.duration(300)}>
            <View style={styles.list}>
              {districts.map(district => (
                <Pressable
                  key={district.code}
                  style={styles.listItem}
                  onPress={() => handleSelectDistrict(district)}
                >
                  <View style={styles.listItemIcon}>
                    <Ionicons name="business" size={24} color={AppColors.secondary} />
                  </View>
                  <View style={styles.listItemContent}>
                    <ThemedText style={styles.listItemTitle}>{district.name}</ThemedText>
                    <ThemedText style={styles.listItemSubtitle}>{district.ozpnName}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textDisabled} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'league' && (
          <Animated.View entering={FadeInRight.duration(300)}>
            <ThemedText style={styles.sectionTitle}>Ligi centralne</ThemedText>
            <View style={styles.list}>
              {leagues.filter(l => l.level <= 4).map(league => (
                <Pressable
                  key={league.code}
                  style={styles.listItem}
                  onPress={() => handleSelectLeague(league)}
                >
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(league.level) }]}>
                    <ThemedText style={styles.levelBadgeText}>{league.level}</ThemedText>
                  </View>
                  <View style={styles.listItemContent}>
                    <ThemedText style={styles.listItemTitle}>{league.name}</ThemedText>
                    <ThemedText style={styles.listItemSubtitle}>Poziom {league.level}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textDisabled} />
                </Pressable>
              ))}
            </View>
            
            <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Ligi regionalne</ThemedText>
            <View style={styles.list}>
              {leagues.filter(l => l.level > 4).map(league => (
                <Pressable
                  key={league.code}
                  style={styles.listItem}
                  onPress={() => handleSelectLeague(league)}
                >
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(league.level) }]}>
                    <ThemedText style={styles.levelBadgeText}>{league.level}</ThemedText>
                  </View>
                  <View style={styles.listItemContent}>
                    <ThemedText style={styles.listItemTitle}>{league.name}</ThemedText>
                    <ThemedText style={styles.listItemSubtitle}>Poziom {league.level}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textDisabled} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'club' && (
          <Animated.View entering={FadeInRight.duration(300)}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={AppColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Wyszukaj klub..."
                placeholderTextColor={AppColors.textDisabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Results */}
            <View style={styles.list}>
              {(searchQuery.length >= 2 ? searchResults : clubs).length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="football-outline" size={48} color={AppColors.textDisabled} />
                  <ThemedText style={styles.emptyStateText}>
                    {searchQuery.length >= 2 
                      ? 'Nie znaleziono klubów'
                      : 'Brak klubów w tej lidze'}
                  </ThemedText>
                </View>
              ) : (
                (searchQuery.length >= 2 ? searchResults : clubs).map(club => (
                  <Pressable
                    key={club.id}
                    style={styles.clubItem}
                    onPress={() => handleSelectClub(club)}
                  >
                    <View style={styles.clubIcon}>
                      <Ionicons name="football" size={28} color={AppColors.primary} />
                    </View>
                    <View style={styles.clubInfo}>
                      <ThemedText style={styles.clubName}>{club.name}</ThemedText>
                      <ThemedText style={styles.clubCity}>{club.city}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={AppColors.textDisabled} />
                  </Pressable>
                ))
              )}
            </View>
          </Animated.View>
        )}

        {step === 'confirm' && selectedClub && (
          <Animated.View entering={FadeInRight.duration(300)}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppColors.primary} />
                <ThemedText style={styles.loadingText}>Pobieranie danych...</ThemedText>
              </View>
            ) : (
              <>
                {/* Club Card */}
                <View style={styles.confirmCard}>
                  <View style={styles.confirmClubHeader}>
                    <View style={styles.confirmClubIcon}>
                      <Ionicons name="football" size={40} color={AppColors.primary} />
                    </View>
                    <View style={styles.confirmClubInfo}>
                      <ThemedText style={styles.confirmClubName}>{selectedClub.name}</ThemedText>
                      <ThemedText style={styles.confirmClubMeta}>{selectedClub.city}</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.confirmDetails}>
                    <View style={styles.confirmDetailRow}>
                      <ThemedText style={styles.confirmDetailLabel}>Liga:</ThemedText>
                      <ThemedText style={styles.confirmDetailValue}>{selectedLeague?.name}</ThemedText>
                    </View>
                    <View style={styles.confirmDetailRow}>
                      <ThemedText style={styles.confirmDetailLabel}>Okręg:</ThemedText>
                      <ThemedText style={styles.confirmDetailValue}>{selectedDistrict?.ozpnName}</ThemedText>
                    </View>
                    <View style={styles.confirmDetailRow}>
                      <ThemedText style={styles.confirmDetailLabel}>Sezon:</ThemedText>
                      <ThemedText style={styles.confirmDetailValue}>{seasonData?.season || 'Brak danych'}</ThemedText>
                    </View>
                  </View>
                </View>

                {/* Season Data Preview */}
                {seasonData && (
                  <View style={styles.seasonPreview}>
                    <ThemedText style={styles.seasonPreviewTitle}>
                      Tabela {seasonData.leagueName}
                    </ThemedText>
                    
                    {/* Find club position */}
                    {(() => {
                      const clubStanding = seasonData.standings.find(s => s.clubId === selectedClub.id);
                      if (clubStanding) {
                        return (
                          <View style={styles.positionCard}>
                            <View style={styles.positionBadge}>
                              <ThemedText style={styles.positionNumber}>{clubStanding.position}</ThemedText>
                            </View>
                            <View style={styles.positionStats}>
                              <ThemedText style={styles.positionPoints}>{clubStanding.points} pkt</ThemedText>
                              <ThemedText style={styles.positionRecord}>
                                {clubStanding.wins}W {clubStanding.draws}R {clubStanding.losses}P
                              </ThemedText>
                            </View>
                            <View style={styles.formContainer}>
                              {clubStanding.form.map((result, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.formBadge,
                                    result === 'W' && styles.formWin,
                                    result === 'D' && styles.formDraw,
                                    result === 'L' && styles.formLoss,
                                  ]}
                                >
                                  <ThemedText style={styles.formText}>{result}</ThemedText>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>
                )}

                {/* Confirm Button */}
                <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                  <ThemedText style={styles.confirmButtonText}>Wybierz ten klub</ThemedText>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </Pressable>
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function getLevelColor(level: number): string {
  switch (level) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    case 4: return AppColors.primary;
    default: return AppColors.secondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  stepIndicator: {
    backgroundColor: AppColors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  stepText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  grid: {
    gap: Spacing.sm,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  gridItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  list: {
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${AppColors.secondary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  clubIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  clubCity: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  confirmCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  confirmClubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  confirmClubIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmClubInfo: {
    flex: 1,
  },
  confirmClubName: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  confirmClubMeta: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  confirmDetails: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmDetailLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  confirmDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  seasonPreview: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  seasonPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  positionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  positionBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  positionStats: {
    flex: 1,
  },
  positionPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  positionRecord: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWin: {
    backgroundColor: AppColors.success,
  },
  formDraw: {
    backgroundColor: AppColors.warning,
  },
  formLoss: {
    backgroundColor: AppColors.danger,
  },
  formText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
