import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clubName, setClubName] = useState('');
  const [country, setCountry] = useState('');
  
  const checkmarkScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    loadData();
    animateSuccess();
  }, []);

  const loadData = async () => {
    const name = await AsyncStorage.getItem('onboarding_club_name');
    const countryName = await AsyncStorage.getItem('selected_country_name');
    if (name) setClubName(name);
    if (countryName) setCountry(countryName);
  };

  const animateSuccess = () => {
    checkmarkScale.value = withDelay(
      300,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    confettiOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2000, withTiming(0, { duration: 500 }))
      )
    );
  };

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Confetti effect */}
      <Animated.View style={[styles.confettiContainer, confettiStyle]}>
        {['🎉', '⚽', '🏆', '🎊', '✨'].map((emoji, index) => (
          <ThemedText 
            key={index} 
            style={[
              styles.confettiEmoji,
              { 
                left: `${15 + index * 18}%`,
                top: `${10 + (index % 3) * 15}%`,
              }
            ]}
          >
            {emoji}
          </ThemedText>
        ))}
      </Animated.View>

      {/* Success Icon */}
      <Animated.View style={[styles.successIcon, checkmarkStyle]}>
        <View style={styles.successIconInner}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View 
        entering={FadeInUp.delay(600).duration(500)}
        style={styles.content}
      >
        <ThemedText type="title" style={styles.title}>
          Gratulacje!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Twój klub został utworzony
        </ThemedText>

        <View style={styles.clubCard}>
          <View style={styles.clubIcon}>
            <Ionicons name="shield" size={32} color={AppColors.primary} />
          </View>
          <View style={styles.clubInfo}>
            <ThemedText style={styles.clubName}>{clubName}</ThemedText>
            <ThemedText style={styles.clubCountry}>{country}</ThemedText>
          </View>
        </View>

        <View style={styles.trialInfo}>
          <Ionicons name="gift" size={24} color={AppColors.warning} />
          <View style={styles.trialTextContainer}>
            <ThemedText style={styles.trialTitle}>
              30 dni za darmo!
            </ThemedText>
            <ThemedText style={styles.trialDescription}>
              Masz pełny dostęp do wszystkich funkcji przez okres próbny
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      {/* Features summary */}
      <Animated.View 
        entering={FadeIn.delay(900).duration(500)}
        style={styles.featuresSection}
      >
        <ThemedText style={styles.featuresTitle}>Co możesz teraz zrobić:</ThemedText>
        <View style={styles.featuresList}>
          {[
            { icon: 'person-add', text: 'Dodaj zawodników do kadry' },
            { icon: 'calendar', text: 'Zaplanuj pierwszy mecz' },
            { icon: 'settings', text: 'Dostosuj ustawienia klubu' },
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={item.icon as any} size={20} color={AppColors.primary} />
              <ThemedText style={styles.featureText}>{item.text}</ThemedText>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Finish Button */}
      <Animated.View
        entering={FadeIn.delay(1200).duration(500)}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable onPress={handleFinish} style={styles.finishButton}>
          <ThemedText style={styles.finishButtonText}>Przejdź do aplikacji</ThemedText>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            <View style={styles.progressDotCompleted} />
            <View style={styles.progressDotCompleted} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>
          <ThemedText style={styles.progressText}>Krok 3 z 3 - Gotowe!</ThemedText>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  successIconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 24,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  clubIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  clubCountry: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.warning}15`,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 12,
  },
  trialTextContainer: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.warning,
    marginBottom: 2,
  },
  trialDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  featuresSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  finishButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishButtonText: {
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
