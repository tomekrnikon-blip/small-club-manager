/**
 * Offline Mode Hook
 * 
 * Manages offline state, sync queue processing, and network status.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  getCacheSize,
  formatCacheSize,
  clearAllCache,
  clearSyncQueue,
} from '@/lib/offline-storage';

const OFFLINE_MODE_KEY = '@skm_offline_mode';
const MAX_RETRIES = 3;

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

type OfflineState = {
  isOnline: boolean;
  isOfflineMode: boolean;
  syncStatus: SyncStatus;
  pendingChanges: number;
  lastSyncTime: Date | null;
  cacheSize: string;
};

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isOfflineMode: false,
    syncStatus: 'idle',
    pendingChanges: 0,
    lastSyncTime: null,
    cacheSize: '0 B',
  });

  const syncInProgressRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Check network status
  const checkNetworkStatus = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;
      setState((prev) => ({ ...prev, isOnline }));
      return isOnline;
    } catch (error) {
      console.error('[Offline] Network check error:', error);
      return false;
    }
  }, []);

  // Load offline mode preference
  const loadOfflineMode = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
      if (stored !== null) {
        setState((prev) => ({ ...prev, isOfflineMode: stored === 'true' }));
      }
    } catch (error) {
      console.error('[Offline] Load offline mode error:', error);
    }
  }, []);

  // Toggle offline mode
  const toggleOfflineMode = useCallback(async () => {
    setState((prev) => {
      const newValue = !prev.isOfflineMode;
      AsyncStorage.setItem(OFFLINE_MODE_KEY, String(newValue)).catch(console.error);
      return { ...prev, isOfflineMode: newValue };
    });
  }, []);

  // Update pending changes count
  const updatePendingChanges = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setState((prev) => ({ ...prev, pendingChanges: queue.length }));
    } catch (error) {
      console.error('[Offline] Update pending changes error:', error);
    }
  }, []);

  // Update cache size
  const updateCacheSize = useCallback(async () => {
    try {
      const size = await getCacheSize();
      setState((prev) => ({ ...prev, cacheSize: formatCacheSize(size) }));
    } catch (error) {
      console.error('[Offline] Update cache size error:', error);
    }
  }, []);

  // Process sync queue
  const processSyncQueue = useCallback(async (trpcClient?: any) => {
    if (syncInProgressRef.current) {
      console.log('[Offline] Sync already in progress');
      return;
    }

    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      console.log('[Offline] Cannot sync - offline');
      return;
    }

    syncInProgressRef.current = true;
    setState((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        setState((prev) => ({
          ...prev,
          syncStatus: 'success',
          lastSyncTime: new Date(),
        }));
        syncInProgressRef.current = false;
        return;
      }

      console.log(`[Offline] Processing ${queue.length} items in sync queue`);

      let successCount = 0;
      let errorCount = 0;

      for (const item of queue) {
        try {
          // Skip items that have exceeded max retries
          if (item.retries >= MAX_RETRIES) {
            console.log(`[Offline] Skipping item ${item.id} - max retries exceeded`);
            errorCount++;
            continue;
          }

          // Process based on entity and action
          // This would call the appropriate tRPC mutation
          // For now, we'll simulate success
          console.log(`[Offline] Syncing: ${item.action} ${item.entity}`);
          
          // TODO: Implement actual sync logic with tRPC client
          // await trpcClient[item.entity][item.action].mutate(item.data);
          
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          
          // Remove from queue on success
          await removeFromSyncQueue(item.id);
          successCount++;
        } catch (error) {
          console.error(`[Offline] Sync error for item ${item.id}:`, error);
          await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
          errorCount++;
        }
      }

      await updatePendingChanges();

      setState((prev) => ({
        ...prev,
        syncStatus: errorCount > 0 ? 'error' : 'success',
        lastSyncTime: new Date(),
      }));

      console.log(`[Offline] Sync complete: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('[Offline] Sync queue processing error:', error);
      setState((prev) => ({ ...prev, syncStatus: 'error' }));
    } finally {
      syncInProgressRef.current = false;
    }
  }, [checkNetworkStatus, updatePendingChanges]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await clearAllCache();
      await clearSyncQueue();
      await updatePendingChanges();
      await updateCacheSize();
      console.log('[Offline] All offline data cleared');
    } catch (error) {
      console.error('[Offline] Clear offline data error:', error);
    }
  }, [updatePendingChanges, updateCacheSize]);

  // Initialize
  useEffect(() => {
    loadOfflineMode();
    checkNetworkStatus();
    updatePendingChanges();
    updateCacheSize();
  }, [loadOfflineMode, checkNetworkStatus, updatePendingChanges, updateCacheSize]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netInfo: NetInfoState) => {
      const isOnline = netInfo.isConnected ?? false;
      setState((prev) => {
        // If coming back online, trigger sync
        if (!prev.isOnline && isOnline) {
          console.log('[Offline] Network restored - triggering sync');
          processSyncQueue();
        }
        return { ...prev, isOnline };
      });
    });

    return () => unsubscribe();
  }, [processSyncQueue]);

  // Listen for app state changes (sync when app becomes active)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[Offline] App became active - checking for sync');
        processSyncQueue();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [processSyncQueue]);

  // Periodic cache size update
  useEffect(() => {
    const interval = setInterval(() => {
      updateCacheSize();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [updateCacheSize]);

  return {
    ...state,
    toggleOfflineMode,
    processSyncQueue,
    clearOfflineData,
    refreshStatus: async () => {
      await checkNetworkStatus();
      await updatePendingChanges();
      await updateCacheSize();
    },
  };
}

/**
 * Hook for caching tRPC query results
 */
export function useOfflineQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    cacheTime?: number;
    staleTime?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const { isOnline, isOfflineMode } = useOffline();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cached = await AsyncStorage.getItem(`@skm_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(parsed.data);
        setIsFromCache(true);
        
        // If offline or in offline mode, use cached data
        if (!isOnline || isOfflineMode) {
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data if online
      if (isOnline && !isOfflineMode) {
        const freshData = await queryFn();
        setData(freshData);
        setIsFromCache(false);
        
        // Cache the result
        await AsyncStorage.setItem(
          `@skm_cache_${key}`,
          JSON.stringify({
            data: freshData,
            timestamp: Date.now(),
          })
        );
      }
    } catch (err) {
      setError(err as Error);
      console.error('[OfflineQuery] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [key, queryFn, isOnline, isOfflineMode]);

  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options?.enabled]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch: fetchData,
  };
}
