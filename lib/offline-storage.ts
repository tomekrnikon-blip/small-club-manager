/**
 * Offline Storage Service
 * 
 * Provides local caching and offline support for the app.
 * Uses AsyncStorage for persistent storage with automatic sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@skm_cache_';
const SYNC_QUEUE_KEY = '@skm_sync_queue';
const CACHE_METADATA_KEY = '@skm_cache_metadata';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type SyncQueueItem = {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  retries: number;
};

type CacheMetadata = {
  [key: string]: {
    lastSync: number;
    version: number;
  };
};

// Default cache duration: 1 hour
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000;

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('[OfflineStorage] getCached error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCached<T>(
  key: string,
  data: T,
  duration: number = DEFAULT_CACHE_DURATION
): Promise<void> {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error('[OfflineStorage] setCached error:', error);
  }
}

/**
 * Remove cached data
 */
export async function removeCached(key: string): Promise<void> {
  try {
    const cacheKey = CACHE_PREFIX + key;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('[OfflineStorage] removeCached error:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('[OfflineStorage] clearAllCache error:', error);
  }
}

/**
 * Add item to sync queue (for offline mutations)
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    
    queue.push(newItem);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineStorage] addToSyncQueue error:', error);
  }
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('[OfflineStorage] getSyncQueue error:', error);
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[OfflineStorage] removeFromSyncQueue error:', error);
  }
}

/**
 * Update sync queue item (e.g., increment retries)
 */
export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const index = queue.findIndex((item) => item.id === id);
    
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('[OfflineStorage] updateSyncQueueItem error:', error);
  }
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error('[OfflineStorage] clearSyncQueue error:', error);
  }
}

/**
 * Get cache metadata
 */
export async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const metaStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return metaStr ? JSON.parse(metaStr) : {};
  } catch (error) {
    console.error('[OfflineStorage] getCacheMetadata error:', error);
    return {};
  }
}

/**
 * Update cache metadata
 */
export async function updateCacheMetadata(key: string, lastSync: number, version: number): Promise<void> {
  try {
    const metadata = await getCacheMetadata();
    metadata[key] = { lastSync, version };
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('[OfflineStorage] updateCacheMetadata error:', error);
  }
}

/**
 * Check if data needs refresh based on metadata
 */
export async function needsRefresh(key: string, maxAge: number = DEFAULT_CACHE_DURATION): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    const entry = metadata[key];
    
    if (!entry) return true;
    
    return Date.now() - entry.lastSync > maxAge;
  } catch (error) {
    console.error('[OfflineStorage] needsRefresh error:', error);
    return true;
  }
}

/**
 * Cache entity list with automatic key generation
 */
export async function cacheEntityList<T>(
  entity: string,
  clubId: number,
  data: T[],
  duration?: number
): Promise<void> {
  const key = `${entity}_${clubId}`;
  await setCached(key, data, duration);
  await updateCacheMetadata(key, Date.now(), 1);
}

/**
 * Get cached entity list
 */
export async function getCachedEntityList<T>(entity: string, clubId: number): Promise<T[] | null> {
  const key = `${entity}_${clubId}`;
  return getCached<T[]>(key);
}

/**
 * Cache single entity
 */
export async function cacheEntity<T>(
  entity: string,
  id: number,
  data: T,
  duration?: number
): Promise<void> {
  const key = `${entity}_item_${id}`;
  await setCached(key, data, duration);
}

/**
 * Get cached single entity
 */
export async function getCachedEntity<T>(entity: string, id: number): Promise<T | null> {
  const key = `${entity}_item_${id}`;
  return getCached<T>(key);
}

/**
 * Invalidate entity cache
 */
export async function invalidateEntityCache(entity: string, clubId?: number): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pattern = clubId ? `${CACHE_PREFIX}${entity}_${clubId}` : `${CACHE_PREFIX}${entity}_`;
    const matchingKeys = keys.filter((k) => k.startsWith(pattern));
    await AsyncStorage.multiRemove(matchingKeys);
  } catch (error) {
    console.error('[OfflineStorage] invalidateEntityCache error:', error);
  }
}

/**
 * Get cache size in bytes (approximate)
 */
export async function getCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('[OfflineStorage] getCacheSize error:', error);
    return 0;
  }
}

/**
 * Format cache size for display
 */
export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
