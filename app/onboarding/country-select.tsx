import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

interface Country {
  code: string;
  name: string;
  flag: string;
  federation: string;
  active: boolean;
}

const COUNTRIES: Country[] = [
  { code: 'PL', name: 'Polska', flag: '🇵🇱', federation: 'PZPN', active: true },
  { code: 'DE', name: 'Niemcy', flag: '🇩🇪', federation: 'DFB', active: true },
  { code: 'GB', name: 'Anglia', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', federation: 'FA', active: true },
  { code: 'NL', name: 'Holandia', flag: '🇳🇱', federation: 'KNVB', active: true },
  { code: 'BE', name: 'Belgia', flag: '🇧🇪', federation: 'KBVB', active: true },
  { code: 'DK', name: 'Dania', flag: '🇩🇰', federation: 'DBU', active: true },
  { code: 'SE', name: 'Szwecja', flag: '🇸🇪', federation: 'SvFF', active: true },
  { code: 'FR', name: 'Francja', flag: '🇫🇷', federation: 'FFF', active: true },
  { code: 'IT', name: 'Włochy', flag: '🇮🇹', federation: 'FIGC', active: true },
  { code: 'ES', name: 'Hiszpania', flag: '🇪🇸', federation: 'RFEF', active: true },
  { code: 'CZ', name: 'Czechy', flag: '🇨🇿', federation: 'FAČR', active: true },
  { code: 'SK', name: 'Słowacja', flag: '🇸🇰', federation: 'SFZ', active: true },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', federation: 'ÖFB', active: true },
  { code: 'HU', name: 'Węgry', flag: '🇭🇺', federation: 'MLSZ', active: false },
  { code: 'UA', name: 'Ukraina', flag: '🇺🇦', federation: 'UAF', active: false },
];

export default function OnboardingCountrySelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.federation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCountry = async (country: Country) => {
    if (!country.active) return;
    
    setSelectedCountry(country.code);
    await AsyncStorage.setItem('selected_country', country.code);
    await AsyncStorage.setItem('selected_country_name', country.name);
    
    // Navigate to club creation
    router.push('/onboarding/club-setup');
  };

  const renderCountryItem = ({ item, index }: { item: Country; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => handleSelectCountry(item)}
        style={[
          styles.countryItem,
          selectedCountry === item.code && styles.countryItemSelected,
          !item.active && styles.countryItemDisabled,
        ]}
        disabled={!item.active}
      >
        <ThemedText style={styles.countryFlag}>{item.flag}</ThemedText>
        <View style={styles.countryInfo}>
          <ThemedText style={[
            styles.countryName,
            !item.active && styles.countryNameDisabled,
          ]}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.countryFederation}>
            {item.federation}
          </ThemedText>
        </View>
        {item.active ? (
          <Ionicons 
            name={selectedCountry === item.code ? "checkmark-circle" : "chevron-forward"} 
            size={24} 
            color={selectedCountry === item.code ? AppColors.primary : AppColors.textSecondary} 
          />
        ) : (
          <View style={styles.comingSoonBadge}>
            <ThemedText style={styles.comingSoonText}>Wkrótce</ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            Wybierz kraj
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Pobierzemy oficjalne dane ligowe z Twojego związku piłkarskiego
          </ThemedText>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={AppColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj kraju..."
          placeholderTextColor={AppColors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Countries List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        renderItem={renderCountryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Progress indicator */}
      <View style={[styles.progressContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.progressDots}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <ThemedText style={styles.progressText}>Krok 1 z 3</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  countryItemSelected: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  countryItemDisabled: {
    opacity: 0.5,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  countryNameDisabled: {
    color: AppColors.textSecondary,
  },
  countryFederation: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: AppColors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
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
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
