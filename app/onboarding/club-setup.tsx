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
import { AppColors } from '@/constants/theme';

const CLUB_TYPES = [
  { id: 'amateur', name: 'Klub amatorski', icon: 'football-outline' as const },
  { id: 'youth', name: 'Akademia młodzieżowa', icon: 'school-outline' as const },
  { id: 'company', name: 'Drużyna firmowa', icon: 'business-outline' as const },
  { id: 'other', name: 'Inny', icon: 'ellipsis-horizontal' as const },
];

export default function OnboardingClubSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = clubName.trim().length >= 3 && clubType && city.trim().length >= 2;

  const handleCreateClub = async () => {
    if (!isFormValid) return;
    
    setIsLoading(true);
    
    try {
      // Store club data temporarily
      await AsyncStorage.setItem('onboarding_club_name', clubName.trim());
      await AsyncStorage.setItem('onboarding_club_type', clubType!);
      await AsyncStorage.setItem('onboarding_club_city', city.trim());
      await AsyncStorage.setItem('onboarding_completed', 'pending');
      
      // Navigate to final step
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('Error saving club data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              Utwórz klub
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Podaj podstawowe informacje o swoim klubie
            </ThemedText>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Club Name */}
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

          {/* City */}
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

          {/* Club Type */}
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
                    styles.typeName,
                    clubType === type.id && styles.typeNameSelected,
                  ]}>
                    {type.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Info Box */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={AppColors.info} />
            <ThemedText style={styles.infoText}>
              Po utworzeniu klubu otrzymasz 30-dniowy bezpłatny okres próbny z pełnym dostępem do wszystkich funkcji.
            </ThemedText>
          </Animated.View>
        </ScrollView>

        {/* Bottom Section */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleCreateClub}
            disabled={!isFormValid || isLoading}
            style={[
              styles.createButton,
              (!isFormValid || isLoading) && styles.createButtonDisabled,
            ]}
          >
            <ThemedText style={styles.createButtonText}>
              {isLoading ? 'Tworzenie...' : 'Utwórz klub'}
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              <View style={styles.progressDotCompleted} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
            <ThemedText style={styles.progressText}>Krok 2 z 3</ThemedText>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginBottom: 8,
  },
  headerContent: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  typeCard: {
    width: '47%',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: `${AppColors.primary}15`,
  },
  typeName: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  typeNameSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${AppColors.info}15`,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.info,
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  createButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.bgElevated,
  },
  progressDotActive: {
    backgroundColor: AppColors.primary,
    width: 24,
  },
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
