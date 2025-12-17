import React, { useState } from 'react';
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
import { Club, SeasonData, REGIONS } from '@/lib/polish-football-data';

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
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  
  // Manual mode state
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [manualRegion, setManualRegion] = useState<string | undefined>();
  
  const [isLoading, setIsLoading] = useState(false);

  const isManualFormValid = clubName.trim().length >= 3 && clubType && city.trim().length >= 2;

  const handleWizardComplete = async (club: Club, data: SeasonData | null) => {
    setSelectedClub(club);
    setSeasonData(data);
    
    setIsLoading(true);
    try {
      // Store PZPN club data
      await AsyncStorage.setItem('onboarding_club_name', club.name);
      await AsyncStorage.setItem('onboarding_club_type', 'pzpn');
      await AsyncStorage.setItem('onboarding_club_city', club.city);
      await AsyncStorage.setItem('onboarding_club_pzpn_id', club.id);
      await AsyncStorage.setItem('onboarding_club_league', club.leagueCode);
      await AsyncStorage.setItem('onboarding_club_district', club.districtCode);
      
      if (data) {
        await AsyncStorage.setItem('onboarding_club_season', data.season);
        await AsyncStorage.setItem('onboarding_club_league_name', data.leagueName);
        
        // Find club position in standings
        const standing = data.standings.find(s => s.clubId === club.id);
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

  const handleWizardCancel = () => {
    setSetupMode('select');
  };

  const handleCreateManualClub = async () => {
    if (!isManualFormValid) return;
    
    setIsLoading(true);
    
    try {
      // Store manual club data
      await AsyncStorage.setItem('onboarding_club_name', clubName.trim());
      await AsyncStorage.setItem('onboarding_club_type', clubType!);
      await AsyncStorage.setItem('onboarding_club_city', city.trim());
      if (manualRegion) {
        await AsyncStorage.setItem('onboarding_club_region', manualRegion);
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

  // Show wizard full screen
  if (setupMode === 'wizard') {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ClubSelectionWizard
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.headerTitle}>
              {setupMode === 'select' ? 'Wybierz opcję' : 'Utwórz klub'}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {setupMode === 'select' 
                ? 'Znajdź swój klub lub utwórz nowy'
                : 'Wprowadź dane swojego klubu'}
            </ThemedText>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {setupMode === 'select' ? (
            <>
              {/* Option 1: Find Club in PZPN */}
              <Animated.View entering={FadeInUp.delay(100).duration(400)}>
                <Pressable 
                  style={styles.optionCard}
                  onPress={() => setSetupMode('wizard')}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="search" size={32} color={AppColors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <ThemedText style={styles.optionTitle}>Znajdź klub w bazie PZPN</ThemedText>
                    <ThemedText style={styles.optionDescription}>
                      Wybierz województwo → okręg → ligę → klub
                    </ThemedText>
                    <View style={styles.optionFeatures}>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Aktualna tabela ligowa</ThemedText>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Dane o klubie z PZPN</ThemedText>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Sezon 2024/2025</ThemedText>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={AppColors.textSecondary} />
                </Pressable>
              </Animated.View>

              {/* Option 2: Create Manual Club */}
              <Animated.View entering={FadeInUp.delay(200).duration(400)}>
                <Pressable 
                  style={styles.optionCard}
                  onPress={() => setSetupMode('manual')}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: `${AppColors.secondary}20` }]}>
                    <Ionicons name="add-circle" size={32} color={AppColors.secondary} />
                  </View>
                  <View style={styles.optionContent}>
                    <ThemedText style={styles.optionTitle}>Utwórz nowy klub</ThemedText>
                    <ThemedText style={styles.optionDescription}>
                      Dla klubów spoza systemu PZPN
                    </ThemedText>
                    <View style={styles.optionFeatures}>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Drużyny amatorskie</ThemedText>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Akademie młodzieżowe</ThemedText>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                        <ThemedText style={styles.featureText}>Drużyny firmowe</ThemedText>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={AppColors.textSecondary} />
                </Pressable>
              </Animated.View>

              {/* Info Box */}
              <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.infoBox}>
                <Ionicons name="information-circle" size={24} color={AppColors.info} />
                <ThemedText style={styles.infoText}>
                  Wybierając klub z bazy PZPN, automatycznie otrzymasz dostęp do aktualnej tabeli ligowej i pozycji w rozgrywkach.
                </ThemedText>
              </Animated.View>
            </>
          ) : setupMode === 'manual' && (
            <>
              {/* Back to selection */}
              <Pressable onPress={() => setSetupMode('select')} style={styles.backToSelect}>
                <Ionicons name="arrow-back" size={20} color={AppColors.primary} />
                <ThemedText style={styles.backToSelectText}>Wróć do wyboru opcji</ThemedText>
              </Pressable>

              {/* Manual Club Creation */}
              <Animated.View entering={FadeInUp.delay(100).duration(400)}>
                <ThemedText style={styles.label}>Nazwa klubu *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="np. KS Orlik Warszawa"
                  placeholderTextColor={AppColors.textSecondary}
                  value={clubName}
                  onChangeText={setClubName}
                  autoCapitalize="words"
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200).duration(400)}>
                <ThemedText style={styles.label}>Miasto *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="np. Warszawa"
                  placeholderTextColor={AppColors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </Animated.View>

              {/* Region Picker */}
              <Animated.View entering={FadeInUp.delay(250).duration(400)}>
                <ThemedText style={styles.label}>Województwo</ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.regionScroll}
                >
                  {REGIONS.map((region) => (
                    <Pressable
                      key={region.code}
                      onPress={() => setManualRegion(region.code === manualRegion ? undefined : region.code)}
                      style={[
                        styles.regionChip,
                        manualRegion === region.code && styles.regionChipSelected,
                      ]}
                    >
                      <ThemedText style={[
                        styles.regionChipText,
                        manualRegion === region.code && styles.regionChipTextSelected,
                      ]}>
                        {region.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300).duration(400)}>
                <ThemedText style={styles.label}>Typ klubu *</ThemedText>
                <View style={styles.typeGrid}>
                  {CLUB_TYPES.map((type) => (
                    <Pressable
                      key={type.id}
                      onPress={() => setClubType(type.id)}
                      style={[
                        styles.typeCard,
                        clubType === type.id && styles.typeCardSelected,
                      ]}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={28} 
                        color={clubType === type.id ? AppColors.primary : AppColors.textSecondary} 
                      />
                      <ThemedText style={[
                        styles.typeCardText,
                        clubType === type.id && styles.typeCardTextSelected,
                      ]}>
                        {type.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Trial Info */}
              <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.trialBox}>
                <View style={styles.trialIcon}>
                  <Ionicons name="gift" size={24} color={AppColors.primary} />
                </View>
                <View style={styles.trialContent}>
                  <ThemedText style={styles.trialTitle}>30 dni za darmo!</ThemedText>
                  <ThemedText style={styles.trialText}>
                    Pełny dostęp do wszystkich funkcji przez pierwszy miesiąc.
                  </ThemedText>
                </View>
              </Animated.View>

              {/* Create Button */}
              <Animated.View entering={FadeInUp.delay(500).duration(400)}>
                <Pressable
                  style={[styles.createButton, !isManualFormValid && styles.createButtonDisabled]}
                  onPress={handleCreateManualClub}
                  disabled={!isManualFormValid || isLoading}
                >
                  <ThemedText style={styles.createButtonText}>
                    {isLoading ? 'Tworzenie...' : 'Utwórz klub'}
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </Animated.View>
            </>
          )}
        </ScrollView>
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  optionDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  optionFeatures: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${AppColors.info}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  backToSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  backToSelectText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  regionScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  regionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: AppColors.bgCard,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  regionChipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  regionChipText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  regionChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeCard: {
    width: '48%',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: `${AppColors.primary}10`,
  },
  typeCardText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  typeCardTextSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  trialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.primary}15`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  trialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialContent: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  trialText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
