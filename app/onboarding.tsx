import { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions, FlatList, ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors, Spacing, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'shield',
    title: 'Witaj w Small Club Manager',
    description: 'Kompleksowe narzędzie do zarządzania klubem sportowym. Wszystko czego potrzebujesz w jednym miejscu.',
    color: AppColors.primary,
  },
  {
    id: '2',
    icon: 'people',
    title: 'Zarządzaj Kadrą',
    description: 'Dodawaj zawodników, śledź ich statystyki, kontuzje i frekwencję na treningach.',
    color: '#3b82f6',
  },
  {
    id: '3',
    icon: 'sports-soccer',
    title: 'Planuj Mecze',
    description: 'Twórz mecze, zarządzaj powołaniami i automatycznie powiadamiaj zawodników o nadchodzących spotkaniach.',
    color: '#8b5cf6',
  },
  {
    id: '4',
    icon: 'calendar-today',
    title: 'Kalendarz Wydarzeń',
    description: 'Przeglądaj wszystkie mecze i treningi w jednym kalendarzu. Eksportuj do Google Calendar.',
    color: '#f59e0b',
  },
  {
    id: '5',
    icon: 'attach-money',
    title: 'Kontroluj Finanse',
    description: 'Śledź przychody i wydatki klubu. Generuj raporty finansowe w PDF.',
    color: AppColors.success,
  },
  {
    id: '6',
    icon: 'school',
    title: 'Szkółka Piłkarska',
    description: 'Zarządzaj młodymi zawodnikami, płatnościami rodziców i wysyłaj automatyczne przypomnienia.',
    color: '#ec4899',
  },
];

const ONBOARDING_KEY = '@onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <MaterialIcons name={item.icon as any} size={80} color={item.color} />
        </View>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive ? AppColors.primary : '#4b5563',
                  width: isActive ? 24 : 8,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>Pomiń</ThemedText>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {renderDots()}

        <Pressable
          style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
          onPress={handleNext}
        >
          <ThemedText style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Rozpocznij' : 'Dalej'}
          </ThemedText>
          <MaterialIcons
            name={currentIndex === slides.length - 1 ? 'check' : 'arrow-forward'}
            size={24}
            color="#fff"
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

// Helper function to check if onboarding is completed
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper function to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#94a3b8',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Radius.lg,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
