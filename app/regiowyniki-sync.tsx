/**
 * RegioWyniki Sync Settings Screen
 * Configure automatic synchronization with RegioWyniki.pl
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = 'regiowyniki_sync_config';

interface SyncConfig {
  regiowynikUrl: string;
  autoSyncEnabled: boolean;
  lastSyncAt: string | null;
  syncInterval: 'daily' | 'weekly';
}

export default function RegioWynikiSyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [config, setConfig] = useState<SyncConfig>({
    regiowynikUrl: '',
    autoSyncEnabled: false,
    lastSyncAt: null,
    syncInterval: 'daily',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; url: string; league: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load saved config
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading sync config:', error);
    }
  };

  const saveConfig = async (newConfig: SyncConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('Error saving sync config:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      Alert.alert('Błąd', 'Wpisz co najmniej 2 znaki');
      return;
    }

    setIsSearching(true);
    try {
      // Simulated search results - in production use trpc.regiowyniki.searchClubs
      const mockResults = [
        { name: searchQuery + ' FC', url: `https://regiowyniki.pl/druzyna/${searchQuery.toLowerCase().replace(/\s/g, '-')}`, league: 'IV Liga' },
        { name: 'KS ' + searchQuery, url: `https://regiowyniki.pl/druzyna/ks-${searchQuery.toLowerCase().replace(/\s/g, '-')}`, league: 'Klasa A' },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wyszukać klubów');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectClub = (club: { name: string; url: string; league: string }) => {
    const newConfig = { ...config, regiowynikUrl: club.url };
    saveConfig(newConfig);
    setSearchResults([]);
    setSearchQuery('');
    Alert.alert('Sukces', `Wybrano klub: ${club.name}`);
  };

  const handleManualSync = async () => {
    if (!config.regiowynikUrl) {
      Alert.alert('Błąd', 'Najpierw wybierz klub');
      return;
    }

    setIsSyncing(true);
    try {
      // In production: await trpc.regiowyniki.syncClubData.mutate({ clubId, regiowynikUrl: config.regiowynikUrl });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sync
      
      const newConfig = { ...config, lastSyncAt: new Date().toISOString() };
      await saveConfig(newConfig);
      
      Alert.alert('Sukces', 'Dane zostały zsynchronizowane');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zsynchronizować danych');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const newConfig = { ...config, autoSyncEnabled: enabled };
    saveConfig(newConfig);
  };

  const handleChangeSyncInterval = (interval: 'daily' | 'weekly') => {
    const newConfig = { ...config, syncInterval: interval };
    saveConfig(newConfig);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfig();
    setRefreshing(false);
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Nigdy';
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#10B981" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Synchronizacja RegioWyniki</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Current Club Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Połączony klub</ThemedText>
          
          {config.regiowynikUrl ? (
            <View style={styles.clubCard}>
              <View style={styles.clubInfo}>
                <Ionicons name="football" size={32} color="#10B981" />
                <View style={styles.clubDetails}>
                  <ThemedText type="defaultSemiBold" style={styles.clubUrl}>
                    {config.regiowynikUrl.split('/').pop()?.replace(/-/g, ' ')}
                  </ThemedText>
                  <ThemedText style={styles.clubUrlSmall}>{config.regiowynikUrl}</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => saveConfig({ ...config, regiowynikUrl: '' })}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.noClubCard}>
              <Ionicons name="search" size={48} color="#6B7280" />
              <ThemedText style={styles.noClubText}>Nie wybrano klubu</ThemedText>
              <ThemedText style={styles.noClubSubtext}>Wyszukaj swój klub poniżej</ThemedText>
            </View>
          )}
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Wyszukaj klub</ThemedText>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nazwa klubu..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <Pressable
              onPress={handleSearch}
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </Pressable>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((club, index) => (
                <Pressable
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectClub(club)}
                >
                  <View style={styles.searchResultInfo}>
                    <ThemedText type="defaultSemiBold">{club.name}</ThemedText>
                    <ThemedText style={styles.searchResultLeague}>{club.league}</ThemedText>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#10B981" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Sync Settings Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ustawienia synchronizacji</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText type="defaultSemiBold">Automatyczna synchronizacja</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Pobieraj dane automatycznie
              </ThemedText>
            </View>
            <Switch
              value={config.autoSyncEnabled}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          {config.autoSyncEnabled && (
            <View style={styles.intervalSelector}>
              <Pressable
                style={[
                  styles.intervalOption,
                  config.syncInterval === 'daily' && styles.intervalOptionActive,
                ]}
                onPress={() => handleChangeSyncInterval('daily')}
              >
                <ThemedText
                  style={[
                    styles.intervalText,
                    config.syncInterval === 'daily' && styles.intervalTextActive,
                  ]}
                >
                  Codziennie
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.intervalOption,
                  config.syncInterval === 'weekly' && styles.intervalOptionActive,
                ]}
                onPress={() => handleChangeSyncInterval('weekly')}
              >
                <ThemedText
                  style={[
                    styles.intervalText,
                    config.syncInterval === 'weekly' && styles.intervalTextActive,
                  ]}
                >
                  Co tydzień
                </ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.lastSyncInfo}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <ThemedText style={styles.lastSyncText}>
              Ostatnia synchronizacja: {formatLastSync(config.lastSyncAt)}
            </ThemedText>
          </View>
        </View>

        {/* Manual Sync Button */}
        <Pressable
          style={[styles.syncButton, (!config.regiowynikUrl || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={!config.regiowynikUrl || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#fff" />
              <ThemedText style={styles.syncButtonText}>Synchronizuj teraz</ThemedText>
            </>
          )}
        </Pressable>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <ThemedText style={styles.infoText}>
            Synchronizacja pobiera aktualną tabelę ligową, terminarz meczów i wyniki z RegioWyniki.pl.
            Dane są aktualizowane automatycznie zgodnie z wybranym interwałem.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clubDetails: {
    marginLeft: 12,
    flex: 1,
  },
  clubUrl: {
    color: '#fff',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  clubUrlSmall: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  noClubCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 32,
  },
  noClubText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  noClubSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchResults: {
    marginTop: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultLeague: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  intervalSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  intervalOption: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  intervalOptionActive: {
    backgroundColor: '#10B981',
  },
  intervalText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  intervalTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  lastSyncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  lastSyncText: {
    color: '#6B7280',
    fontSize: 14,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#93C5FD',
    fontSize: 14,
    lineHeight: 20,
  },
});
