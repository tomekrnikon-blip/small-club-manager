/**
 * useOfflineQuery - Hook for offline-first data fetching with tRPC
 * 
 * Wraps tRPC queries with offline caching support.
 */

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = '@skm_offline_';
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

type UseOfflineQueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  cacheKey: string;
};

type UseOfflineQueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isFromCache: boolean;
  isStale: boolean;
  isOffline: boolean;
  refetch: () => void;
};

export function useOfflineQuery<T>(
  trpcQuery: {
    data: T | undefined;
    isLoading: boolean;
    refetch: () => void;
  },
  options: UseOfflineQueryOptions
): UseOfflineQueryResult<T> {
  const { enabled = true, staleTime = DEFAULT_STALE_TIME, cacheKey } = options;
  
  const [cachedData, setCachedData] = useState<T | undefined>(undefined);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fullCacheKey = `${CACHE_PREFIX}${cacheKey}`;

  // Load cached data on mount
  useEffect(() => {
    if (!enabled) return;

    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(fullCacheKey);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          setCachedData(entry.data);
          setIsFromCache(true);
          setIsStale(Date.now() - entry.timestamp > staleTime);
        }
      } catch (error) {
        console.error('[useOfflineQuery] Error loading cache:', error);
      } finally {
        setInitialLoadDone(true);
      }
    };

    loadCache();
  }, [enabled, fullCacheKey, staleTime]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected ?? true));
    });

    return () => unsubscribe();
  }, []);

  // Save to cache when tRPC data changes
  useEffect(() => {
    if (!enabled || !trpcQuery.data) return;

    const saveCache = async () => {
      try {
        const entry: CacheEntry<T> = {
          data: trpcQuery.data as T,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(fullCacheKey, JSON.stringify(entry));
        setIsFromCache(false);
        setIsStale(false);
      } catch (error) {
        console.error('[useOfflineQuery] Error saving cache:', error);
      }
    };

    saveCache();
  }, [enabled, trpcQuery.data, fullCacheKey]);

  // Determine which data to return
  const data = trpcQuery.data ?? cachedData;
  const isLoading = trpcQuery.isLoading && !cachedData && !initialLoadDone;

  const refetch = useCallback(() => {
    if (!isOffline) {
      trpcQuery.refetch();
    }
  }, [isOffline, trpcQuery]);

  return {
    data,
    isLoading,
    isFromCache: !trpcQuery.data && !!cachedData,
    isStale,
    isOffline,
    refetch,
  };
}

/**
 * Clear all offline cache
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('[useOfflineQuery] Error clearing cache:', error);
  }
}

/**
 * Invalidate specific cache entry
 */
export async function invalidateOfflineCache(cacheKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
  } catch (error) {
    console.error('[useOfflineQuery] Error invalidating cache:', error);
  }
}
