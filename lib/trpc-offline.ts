/**
 * tRPC Offline Wrapper
 * 
 * Provides offline-first data fetching with automatic caching and sync.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = '@skm_trpc_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type OfflineQueryOptions<T> = {
  enabled?: boolean;
  cacheTime?: number;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

type OfflineQueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFromCache: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
};

/**
 * Generate cache key for tRPC query
 */
export function getCacheKey(path: string, input?: any): string {
  const inputStr = input ? JSON.stringify(input) : '';
  return `${CACHE_PREFIX}${path}_${inputStr}`;
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return entry;
  } catch (error) {
    console.error('[TRPCOffline] getCachedData error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  cacheTime: number = DEFAULT_CACHE_TIME
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheTime,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('[TRPCOffline] setCachedData error:', error);
  }
}

/**
 * Check if cache is stale
 */
export function isCacheStale(entry: CacheEntry<any>, staleTime: number = STALE_TIME): boolean {
  return Date.now() - entry.timestamp > staleTime;
}

/**
 * Hook for offline-first tRPC queries
 */
export function useOfflineQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: OfflineQueryOptions<T> = {}
): OfflineQueryResult<T> {
  const {
    enabled = true,
    cacheTime = DEFAULT_CACHE_TIME,
    staleTime = STALE_TIME,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = getCacheKey(queryKey);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // Try to get from cache first
      const cached = await getCachedData<T>(cacheKey);
      
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setIsStale(isCacheStale(cached, staleTime));
        setIsLoading(false);
        
        // If cache is fresh, don't fetch
        if (!isCacheStale(cached, staleTime)) {
          onSuccess?.(cached.data);
          return;
        }
      }

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;

      if (!isOnline) {
        // Offline - use cached data if available
        if (cached) {
          console.log('[TRPCOffline] Offline, using cached data');
          return;
        }
        throw new Error('Brak połączenia z internetem');
      }

      // Fetch fresh data
      const freshData = await queryFn();
      setData(freshData);
      setIsFromCache(false);
      setIsStale(false);
      
      // Cache the result
      await setCachedData(cacheKey, freshData, cacheTime);
      
      onSuccess?.(freshData);
    } catch (err) {
      const error = err as Error;
      setIsError(true);
      setError(error);
      onError?.(error);
      console.error('[TRPCOffline] fetchData error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, cacheKey, queryFn, cacheTime, staleTime, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError,
    error,
    isFromCache,
    isStale,
    refetch: fetchData,
  };
}

/**
 * Hook for offline-first tRPC mutations with queue
 */
export function useOfflineMutation<TInput, TOutput>(
  mutationKey: string,
  mutationFn: (input: TInput) => Promise<TOutput>,
  options: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: Error) => void;
    onOfflineQueued?: () => void;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isQueued, setIsQueued] = useState(false);

  const mutate = useCallback(async (input: TInput) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setIsQueued(false);

    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;

      if (!isOnline) {
        // Queue for later sync
        const queue = await getOfflineQueue();
        queue.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: mutationKey,
          input,
          timestamp: Date.now(),
          retries: 0,
        });
        await saveOfflineQueue(queue);
        
        setIsQueued(true);
        options.onOfflineQueued?.();
        console.log('[TRPCOffline] Mutation queued for offline sync');
        return;
      }

      // Execute mutation
      const result = await mutationFn(input);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setIsError(true);
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationKey, mutationFn, options]);

  return {
    mutate,
    isLoading,
    isError,
    error,
    isQueued,
  };
}

// Offline queue helpers
const OFFLINE_QUEUE_KEY = '@skm_offline_mutation_queue';

type QueueItem = {
  id: string;
  key: string;
  input: any;
  timestamp: number;
  retries: number;
};

async function getOfflineQueue(): Promise<QueueItem[]> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch {
    return [];
  }
}

async function saveOfflineQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Process offline mutation queue
 */
export async function processOfflineQueue(
  mutationHandlers: Record<string, (input: any) => Promise<any>>
): Promise<{ success: number; failed: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remainingQueue: QueueItem[] = [];

  for (const item of queue) {
    const handler = mutationHandlers[item.key];
    if (!handler) {
      console.warn(`[TRPCOffline] No handler for mutation: ${item.key}`);
      remainingQueue.push(item);
      failed++;
      continue;
    }

    try {
      await handler(item.input);
      success++;
    } catch (error) {
      console.error(`[TRPCOffline] Failed to process queued mutation:`, error);
      if (item.retries < 3) {
        remainingQueue.push({ ...item, retries: item.retries + 1 });
      }
      failed++;
    }
  }

  await saveOfflineQueue(remainingQueue);
  return { success, failed };
}

/**
 * Clear all tRPC cache
 */
export async function clearTRPCCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('[TRPCOffline] clearTRPCCache error:', error);
  }
}

/**
 * Invalidate specific cache entry
 */
export async function invalidateCache(path: string, input?: any): Promise<void> {
  const key = getCacheKey(path, input);
  await AsyncStorage.removeItem(key);
}
