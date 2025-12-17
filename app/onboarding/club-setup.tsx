import { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import { ClubSelectionWizard } from '@/components/club-selection-wizard';
import { Club, Team, SeasonData, REGIONS, AGE_GROUP_LABELS } from '@/lib/polish-football-data';

const CLUB_TYPES = [
  { id: 'amateur', name: 'Klub amatorski', icon: 'football-outline' as const },
  { id: 'youth', name: 'Akademia młodzieżowa', icon: 'school-outline' as const },
  { id: 'company', name: 'Drużyna firmowa', icon: 'business-outline' as const },
  { id: 'other', name: 'Inny', icon: 'ellipsis-horizontal' as const },
];

type SetupMode = 'select' | 'wizard' | 'manual';

export default function OnboardingClubSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Mode selection
  const [setupMode, setSetupMode] = useState<SetupMode>('select');
  
  // Wizard mode state
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  
  // Manual mode state
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [manualRegion, setManualRegion] = useState<string | undefined>();
  
  const [isLoading, setIsLoading] = useState(false);

  const isManualFormValid = clubName.trim().length >= 3 && clubType && city.trim().length >= 2;

  const handleWizardComplete = async (club: Club, team: Team, data: SeasonData | null) => {
    setSelectedClub(club);
    setSelectedTeam(team);
    setSeasonData(data);
    
    setIsLoading(true);
    try {
      // Store PZPN club data
      await AsyncStorage.setItem('onboarding_club_name', club.name);
      await AsyncStorage.setItem('onboarding_club_type', 'pzpn');
      await AsyncStorage.setItem('onboarding_club_city', club.city);
      await AsyncStorage.setItem('onboarding_club_pzpn_id', club.id);
      await AsyncStorage.setItem('onboarding_club_district', club.districtCode);
      
      // Store team data
      await AsyncStorage.setItem('onboarding_team_id', team.id);
      await AsyncStorage.setItem('onboarding_team_name', team.name);
      await AsyncStorage.setItem('onboarding_team_league', team.leagueCode);
      await AsyncStorage.setItem('onboarding_team_league_name', team.leagueName);
      await AsyncStorage.setItem('onboarding_team_age_group', team.ageGroup);
      
      if (data) {
        await AsyncStorage.setItem('onboarding_club_season', data.season);
        
        // Find team position in standings
        const standing = data.standings.find(s => s.teamId === team.id);
        if (standing) {
          await AsyncStorage.setItem('onboarding_club_position', standing.position.toString());
          await AsyncStorage.setItem('onboarding_club_points', standing.points.toString());
        }
      }
      
      await AsyncStorage.setItem('onboarding_completed', 'pending');
      
      // Navigate to final step
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('Error saving club data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!isManualFormValid) return;
    
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('onboarding_club_name', clubName.trim());
      await AsyncStorage.setItem('onboarding_club_type', clubType || 'amateur');
      await AsyncStorage.setItem('onboarding_club_city', city.trim());
      if (manualRegion) {
        await AsyncStorage.setItem('onboarding_club_region', manualRegion);
      }
      await AsyncStorage.setItem('onboarding_completed', 'pending');
      
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('Error saving club data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wizard mode - full screen
  if (setupMode === 'wizard') {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ClubSelectionWizard
          onComplete={handleWizardComplete}
          onCancel={() => setSetupMode('select')}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                if (setupMode === 'manual') {
                  setSetupMode('select');
                } else {
                  router.back();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
              <ThemedText style={styles.progressText}>Krok 2 z 3</ThemedText>
            </View>
          </View>

          {/* Mode Selection */}
          {setupMode === 'select' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText style={styles.title}>Skonfiguruj swój klub</ThemedText>
              <ThemedText style={styles.subtitle}>
                Wybierz sposób konfiguracji klubu
              </ThemedText>

              <View style={styles.modeOptions}>
                <Pressable
                  style={styles.modeCard}
                  onPress={() => setSetupMode('wizard')}
                >
                  <View style={styles.modeIconContainer}>
                    <Ionicons name="search" size={32} color={AppColors.primary} />
                  </View>
                  <View style={styles.modeContent}>
                    <ThemedText style={styles.modeTitle}>Znajdź klub w PZPN</ThemedText>
                    <ThemedText style={styles.modeDescription}>
                      Wyszukaj klub w bazie PZPN, wybierz drużynę i pobierz aktualną tabelę sezonu 2025/2026
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={AppColors.textDisabled} />
                </Pressable>

                <Pressable
                  style={styles.modeCard}
                  onPress={() => setSetupMode('manual')}
                >
                  <View style={[styles.modeIconContainer, { backgroundColor: `${AppColors.secondary}20` }]}>
                    <Ionicons name="create" size={32} color={AppColors.secondary} />
                  </View>
                  <View style={styles.modeContent}>
                    <ThemedText style={styles.modeTitle}>Utwórz nowy klub</ThemedText>
                    <ThemedText style={styles.modeDescription}>
                      Wprowadź dane ręcznie dla nowego klubu lub drużyny niezarejestrowanej w PZPN
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={AppColors.textDisabled} />
                </Pressable>
              </View>

              {/* Info */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={AppColors.primary} />
                <ThemedText style={styles.infoText}>
                  Wybierając klub z bazy PZPN, automatycznie pobierzesz aktualną tabelę ligową i dane o drużynach.
                </ThemedText>
              </View>
            </Animated.View>
          )}

          {/* Manual Mode */}
          {setupMode === 'manual' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <ThemedText style={styles.title}>Utwórz nowy klub</ThemedText>
              <ThemedText style={styles.subtitle}>
                Wprowadź podstawowe informacje o klubie
              </ThemedText>

              {/* Club Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Nazwa klubu *</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. KS Orlik Mosina"
                  placeholderTextColor={AppColors.textDisabled}
                  value={clubName}
                  onChangeText={setClubName}
                  autoCapitalize="words"
                />
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Miasto *</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. Mosina"
                  placeholderTextColor={AppColors.textDisabled}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>

              {/* Region */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Województwo</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
                  <View style={styles.regionOptions}>
                    {REGIONS.map(region => (
                      <Pressable
                        key={region.code}
                        style={[
                          styles.regionChip,
                          manualRegion === region.code && styles.regionChipSelected,
                        ]}
                        onPress={() => setManualRegion(region.code)}
                      >
                        <ThemedText
                          style={[
                            styles.regionChipText,
                            manualRegion === region.code && styles.regionChipTextSelected,
                          ]}
                        >
                          {region.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Club Type */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Typ klubu *</ThemedText>
                <View style={styles.typeOptions}>
                  {CLUB_TYPES.map(type => (
                    <Pressable
                      key={type.id}
                      style={[
                        styles.typeOption,
                        clubType === type.id && styles.typeOptionSelected,
                      ]}
                      onPress={() => setClubType(type.id)}
                    >
                      <Ionicons
                        name={type.icon}
                        size={24}
                        color={clubType === type.id ? AppColors.primary : AppColors.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.typeOptionText,
                          clubType === type.id && styles.typeOptionTextSelected,
                        ]}
                      >
                        {type.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Trial Info */}
              <View style={styles.trialInfo}>
                <Ionicons name="gift" size={24} color={AppColors.warning} />
                <View style={styles.trialInfoContent}>
                  <ThemedText style={styles.trialInfoTitle}>30 dni za darmo</ThemedText>
                  <ThemedText style={styles.trialInfoText}>
                    Wypróbuj wszystkie funkcje bez zobowiązań
                  </ThemedText>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Manual Mode Submit Button */}
        {setupMode === 'manual' && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Pressable
              style={[
                styles.submitButton,
                !isManualFormValid && styles.submitButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!isManualFormValid || isLoading}
            >
              <ThemedText style={styles.submitButtonText}>
                {isLoading ? 'Zapisywanie...' : 'Kontynuuj'}
              </ThemedText>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: AppColors.bgCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  modeOptions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${AppColors.primary}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  regionScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  regionOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  regionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionChipSelected: {
    backgroundColor: `${AppColors.primary}20`,
    borderColor: AppColors.primary,
  },
  regionChipText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  regionChipTextSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: `${AppColors.primary}15`,
  },
  typeOptionText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  typeOptionTextSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.warning}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  trialInfoContent: {
    flex: 1,
  },
  trialInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.warning,
  },
  trialInfoText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: AppColors.bgDark,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
