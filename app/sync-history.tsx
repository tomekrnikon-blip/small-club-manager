import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'table' | 'schedule' | 'club' | 'full';
  status: 'success' | 'error' | 'pending';
  source: string;
  details: string;
  duration?: number;
  itemsCount?: number;
  errorMessage?: string;
}

const SYNC_HISTORY_KEY = 'sync_history';
const MAX_HISTORY_ENTRIES = 100;

export default function SyncHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SyncLogEntry[];
        setLogs(parsed.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } else {
        // Sample data for demo
        setLogs(getSampleLogs());
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
      setLogs(getSampleLogs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(SYNC_HISTORY_KEY);
      setLogs([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const getStatusIcon = (status: SyncLogEntry['status']) => {
    switch (status) {
      case 'success':
        return { name: 'checkmark.circle.fill' as const, color: '#34C759' };
      case 'error':
        return { name: 'xmark.circle.fill' as const, color: '#FF3B30' };
      case 'pending':
        return { name: 'clock.fill' as const, color: '#FF9500' };
    }
  };

  const getTypeLabel = (type: SyncLogEntry['type']) => {
    switch (type) {
      case 'table': return 'Tabela';
      case 'schedule': return 'Terminarz';
      case 'club': return 'Dane klubu';
      case 'full': return 'Pełna sync';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) return 'Przed chwilą';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} godz. temu`;
    
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    error: logs.filter(l => l.status === 'error').length,
    lastSync: logs[0]?.timestamp ? formatTimestamp(logs[0].timestamp) : 'Brak',
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Ładowanie historii...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Historia synchronizacji</ThemedText>
        <Pressable onPress={clearHistory} style={styles.clearButton}>
          <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
          <ThemedText style={styles.statLabel}>Wszystkie</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: '#34C759' }]}>{stats.success}</ThemedText>
          <ThemedText style={styles.statLabel}>Sukces</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: '#FF3B30' }]}>{stats.error}</ThemedText>
          <ThemedText style={styles.statLabel}>Błędy</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue} numberOfLines={1}>{stats.lastSync}</ThemedText>
          <ThemedText style={styles.statLabel}>Ostatnia</ThemedText>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'success', 'error'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <ThemedText style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Wszystkie' : f === 'success' ? 'Sukces' : 'Błędy'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Logs List */}
      <ScrollView
        style={styles.logsList}
        contentContainerStyle={styles.logsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="clock.fill" size={48} color="#8E8E93" />
            <ThemedText style={styles.emptyText}>Brak wpisów w historii</ThemedText>
          </View>
        ) : (
          filteredLogs.map((log) => {
            const statusIcon = getStatusIcon(log.status);
            return (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <IconSymbol name={statusIcon.name} size={20} color={statusIcon.color} />
                  <View style={styles.logInfo}>
                    <ThemedText style={styles.logType}>{getTypeLabel(log.type)}</ThemedText>
                    <ThemedText style={styles.logTime}>{formatTimestamp(log.timestamp)}</ThemedText>
                  </View>
                  {log.duration && (
                    <ThemedText style={styles.logDuration}>{log.duration}ms</ThemedText>
                  )}
                </View>
                <ThemedText style={styles.logSource}>{log.source}</ThemedText>
                <ThemedText style={styles.logDetails}>{log.details}</ThemedText>
                {log.itemsCount !== undefined && (
                  <ThemedText style={styles.logItems}>
                    Pobrano: {log.itemsCount} elementów
                  </ThemedText>
                )}
                {log.errorMessage && (
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.errorText}>{log.errorMessage}</ThemedText>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

function getSampleLogs(): SyncLogEntry[] {
  const now = new Date();
  return [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      type: 'table',
      status: 'success',
      source: 'RegioWyniki.pl',
      details: 'Pobrano tabelę IV ligi wielkopolskiej',
      duration: 1250,
      itemsCount: 16,
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      type: 'schedule',
      status: 'success',
      source: 'RegioWyniki.pl',
      details: 'Zaktualizowano terminarz meczów',
      duration: 890,
      itemsCount: 8,
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'full',
      status: 'error',
      source: 'RegioWyniki.pl',
      details: 'Pełna synchronizacja danych klubu',
      duration: 3500,
      errorMessage: 'Przekroczono limit zapytań. Spróbuj ponownie za 5 minut.',
    },
    {
      id: '4',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      type: 'club',
      status: 'success',
      source: 'RegioWyniki.pl',
      details: 'Zaktualizowano dane klubu',
      duration: 650,
    },
    {
      id: '5',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      type: 'table',
      status: 'success',
      source: 'RegioWyniki.pl',
      details: 'Pobrano tabelę IV ligi wielkopolskiej',
      duration: 1100,
      itemsCount: 16,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
  },
  clearButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  logItem: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  logDuration: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logSource: {
    fontSize: 13,
    color: '#007AFF',
  },
  logDetails: {
    fontSize: 14,
    color: '#666',
  },
  logItems: {
    fontSize: 12,
    color: '#34C759',
  },
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
  },
});
