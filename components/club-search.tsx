import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import {
  searchClubs,
  getRegions,
  PzpnClubSearchResult,
} from '@/lib/pzpn-client';

interface ClubSearchProps {
  onSelectClub: (club: PzpnClubSearchResult) => void;
  selectedRegion?: string;
  onChangeRegion?: (regionCode: string | undefined) => void;
}

export function ClubSearch({ onSelectClub, selectedRegion, onChangeRegion }: ClubSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PzpnClubSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  
  const regions = getRegions();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const clubs = await searchClubs(searchQuery, selectedRegion);
      setResults(clubs);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, handleSearch]);

  const selectedRegionName = selectedRegion
    ? regions.find(r => r.code === selectedRegion)?.name
    : 'Wszystkie regiony';

  return (
    <View style={styles.container}>
      {/* Region Picker */}
      <Pressable
        style={styles.regionPicker}
        onPress={() => setShowRegionPicker(!showRegionPicker)}
      >
        <Ionicons name="location-outline" size={20} color={AppColors.textSecondary} />
        <ThemedText style={styles.regionText}>{selectedRegionName}</ThemedText>
        <Ionicons
          name={showRegionPicker ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={AppColors.textSecondary}
        />
      </Pressable>

      {showRegionPicker && (
        <View style={styles.regionList}>
          <Pressable
            style={[styles.regionItem, !selectedRegion && styles.regionItemSelected]}
            onPress={() => {
              onChangeRegion?.(undefined);
              setShowRegionPicker(false);
            }}
          >
            <ThemedText style={!selectedRegion ? styles.regionItemTextSelected : undefined}>
              Wszystkie regiony
            </ThemedText>
          </Pressable>
          {regions.map(region => (
            <Pressable
              key={region.code}
              style={[
                styles.regionItem,
                selectedRegion === region.code && styles.regionItemSelected,
              ]}
              onPress={() => {
                onChangeRegion?.(region.code);
                setShowRegionPicker(false);
              }}
            >
              <ThemedText
                style={selectedRegion === region.code ? styles.regionItemTextSelected : undefined}
              >
                {region.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={AppColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Wpisz nazwę klubu..."
          placeholderTextColor={AppColors.textDisabled}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoading && <ActivityIndicator size="small" color={AppColors.primary} />}
        {query.length > 0 && !isLoading && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Results */}
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultItem}
                onPress={() => onSelectClub(item)}
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="football" size={24} color={AppColors.primary} />
                </View>
                <View style={styles.resultInfo}>
                  <ThemedText style={styles.resultName}>{item.name}</ThemedText>
                  <ThemedText style={styles.resultMeta}>
                    {item.region} • {item.league}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.resultsList}
            nestedScrollEnabled
          />
        </View>
      )}

      {query.length >= 2 && results.length === 0 && !isLoading && (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={40} color={AppColors.textDisabled} />
          <ThemedText style={styles.noResultsText}>
            Nie znaleziono klubów
          </ThemedText>
          <ThemedText style={styles.noResultsHint}>
            Spróbuj innej nazwy lub zmień region
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  regionPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  regionText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  regionList: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    maxHeight: 200,
  },
  regionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  regionItemSelected: {
    backgroundColor: `${AppColors.primary}20`,
  },
  regionItemTextSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  resultsContainer: {
    marginTop: Spacing.sm,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  resultMeta: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.borderLight,
    marginLeft: 60,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  noResultsHint: {
    fontSize: 14,
    color: AppColors.textDisabled,
  },
});
