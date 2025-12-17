import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'people' as const,
    title: 'Zarządzanie kadrą',
    description: 'Dodawaj zawodników, śledź ich statystyki i rozwój',
  },
  {
    icon: 'football' as const,
    title: 'Statystyki meczowe',
    description: 'Rejestruj wydarzenia na żywo i analizuj wyniki',
  },
  {
    icon: 'calendar' as const,
    title: 'Kalendarz wydarzeń',
    description: 'Planuj treningi, mecze i inne wydarzenia klubowe',
  },
  {
    icon: 'cash' as const,
    title: 'Finanse klubu',
    description: 'Kontroluj budżet, składki i wydatki',
  },
  {
    icon: 'trophy' as const,
    title: 'Osiągnięcia',
    description: 'Odznaki i nagrody dla najlepszych zawodników',
  },
];

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const buttonScale = useSharedValue(1);

  const handleStart = () => {
    router.push('/onboarding/country-select');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Logo and Title */}
      <Animated.View 
        entering={FadeInUp.delay(100).duration(600)}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <ThemedText type="title" style={styles.title}>
          Small Club Manager
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Kompleksowe zarządzanie klubem sportowym
        </ThemedText>
      </Animated.View>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        {FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.title}
            entering={FadeInUp.delay(300 + index * 100).duration(500)}
            style={styles.featureItem}
          >
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={24} color={AppColors.primary} />
            </View>
            <View style={styles.featureText}>
              <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
              <ThemedText style={styles.featureDescription}>
                {feature.description}
              </ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Start Button */}
      <Animated.View
        entering={FadeIn.delay(800).duration(500)}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleStart}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.startButton, buttonAnimatedStyle]}>
            <ThemedText style={styles.startButtonText}>Rozpocznij</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Animated.View>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipButton}>
          <ThemedText style={styles.skipButtonText}>
            Mam już konto - zaloguj się
          </ThemedText>
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: AppColors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  startButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
