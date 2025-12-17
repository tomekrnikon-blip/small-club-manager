/**
 * Offline Data Cache Service
 * Caches league data, matches, and player stats for offline viewing
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

// Cache keys
const CACHE_PREFIX = "@skm_cache_";
const CACHE_METADATA_KEY = "@skm_cache_metadata";

// Cache duration in milliseconds
const CACHE_DURATION = {
  leagueTable: 24 * 60 * 60 * 1000,    // 24 hours
  matches: 12 * 60 * 60 * 1000,         // 12 hours
  players: 6 * 60 * 60 * 1000,          // 6 hours
  clubData: 1 * 60 * 60 * 1000,         // 1 hour
};

type CacheType = keyof typeof CACHE_DURATION;

interface CacheMetadata {
  [key: string]: {
    timestamp: number;
    type: CacheType;
    size: number;
  };
}

interface CacheResult<T> {
  data: T | null;
  isStale: boolean;
  timestamp: number | null;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return true; // Assume online if check fails
  }
}

/**
 * Get cache key for a specific data type and ID
 */
function getCacheKey(type: CacheType, id: string | number): string {
  return `${CACHE_PREFIX}${type}_${id}`;
}

/**
 * Save data to cache
 */
export async function cacheData<T>(
  type: CacheType,
  id: string | number,
  data: T
): Promise<boolean> {
  try {
    const key = getCacheKey(type, id);
    const jsonData = JSON.stringify(data);
    
    await AsyncStorage.setItem(key, jsonData);
    
    // Update metadata
    const metadata = await getCacheMetadata();
    metadata[key] = {
      timestamp: Date.now(),
      type,
      size: jsonData.length,
    };
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    
    console.log(`[Cache] Saved ${type}:${id} (${jsonData.length} bytes)`);
    return true;
  } catch (error) {
    console.error("[Cache] Save failed:", error);
    return false;
  }
}

/**
 * Get data from cache
 */
export async function getCachedData<T>(
  type: CacheType,
  id: string | number
): Promise<CacheResult<T>> {
  try {
    const key = getCacheKey(type, id);
    const jsonData = await AsyncStorage.getItem(key);
    
    if (!jsonData) {
      return { data: null, isStale: true, timestamp: null };
    }
    
    const metadata = await getCacheMetadata();
    const cacheInfo = metadata[key];
    
    if (!cacheInfo) {
      return { data: JSON.parse(jsonData), isStale: true, timestamp: null };
    }
    
    const age = Date.now() - cacheInfo.timestamp;
    const isStale = age > CACHE_DURATION[type];
    
    return {
      data: JSON.parse(jsonData),
      isStale,
      timestamp: cacheInfo.timestamp,
    };
  } catch (error) {
    console.error("[Cache] Read failed:", error);
    return { data: null, isStale: true, timestamp: null };
  }
}

/**
 * Get data with fallback to cache when offline
 */
export async function getWithOfflineFallback<T>(
  type: CacheType,
  id: string | number,
  fetchFn: () => Promise<T>
): Promise<{ data: T | null; fromCache: boolean; error?: string }> {
  const online = await isOnline();
  
  if (online) {
    try {
      const freshData = await fetchFn();
      await cacheData(type, id, freshData);
      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error("[Cache] Fetch failed, trying cache:", error);
      // Fall through to cache
    }
  }
  
  // Try cache
  const cached = await getCachedData<T>(type, id);
  
  if (cached.data) {
    return {
      data: cached.data,
      fromCache: true,
      error: online ? undefined : "Tryb offline - dane z pamięci podręcznej",
    };
  }
  
  return {
    data: null,
    fromCache: false,
    error: online ? "Brak danych" : "Brak połączenia i brak danych w pamięci podręcznej",
  };
}

/**
 * Get cache metadata
 */
async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalSize: number;
  itemCount: number;
  oldestItem: number | null;
  newestItem: number | null;
  byType: Record<CacheType, { count: number; size: number }>;
}> {
  const metadata = await getCacheMetadata();
  const entries = Object.values(metadata);
  
  const stats = {
    totalSize: 0,
    itemCount: entries.length,
    oldestItem: null as number | null,
    newestItem: null as number | null,
    byType: {
      leagueTable: { count: 0, size: 0 },
      matches: { count: 0, size: 0 },
      players: { count: 0, size: 0 },
      clubData: { count: 0, size: 0 },
    },
  };
  
  for (const entry of entries) {
    stats.totalSize += entry.size;
    stats.byType[entry.type].count++;
    stats.byType[entry.type].size += entry.size;
    
    if (!stats.oldestItem || entry.timestamp < stats.oldestItem) {
      stats.oldestItem = entry.timestamp;
    }
    if (!stats.newestItem || entry.timestamp > stats.newestItem) {
      stats.newestItem = entry.timestamp;
    }
  }
  
  return stats;
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    const keys = Object.keys(metadata);
    
    await AsyncStorage.multiRemove([...keys, CACHE_METADATA_KEY]);
    
    console.log(`[Cache] Cleared ${keys.length} items`);
    return true;
  } catch (error) {
    console.error("[Cache] Clear failed:", error);
    return false;
  }
}

/**
 * Clear stale cache entries
 */
export async function clearStaleCache(): Promise<number> {
  try {
    const metadata = await getCacheMetadata();
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (const [key, info] of Object.entries(metadata)) {
      const maxAge = CACHE_DURATION[info.type];
      if (now - info.timestamp > maxAge * 2) { // Remove if 2x stale
        keysToRemove.push(key);
        delete metadata[key];
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    }
    
    console.log(`[Cache] Cleared ${keysToRemove.length} stale items`);
    return keysToRemove.length;
  } catch (error) {
    console.error("[Cache] Clear stale failed:", error);
    return 0;
  }
}

/**
 * Pre-cache essential data for offline use
 */
export async function preCacheEssentialData(
  clubId: number,
  fetchFunctions: {
    fetchLeagueTable?: () => Promise<any>;
    fetchMatches?: () => Promise<any>;
    fetchPlayers?: () => Promise<any>;
    fetchClubData?: () => Promise<any>;
  }
): Promise<{ success: boolean; cached: string[] }> {
  const cached: string[] = [];
  
  try {
    if (fetchFunctions.fetchLeagueTable) {
      const data = await fetchFunctions.fetchLeagueTable();
      if (data) {
        await cacheData("leagueTable", clubId, data);
        cached.push("leagueTable");
      }
    }
    
    if (fetchFunctions.fetchMatches) {
      const data = await fetchFunctions.fetchMatches();
      if (data) {
        await cacheData("matches", clubId, data);
        cached.push("matches");
      }
    }
    
    if (fetchFunctions.fetchPlayers) {
      const data = await fetchFunctions.fetchPlayers();
      if (data) {
        await cacheData("players", clubId, data);
        cached.push("players");
      }
    }
    
    if (fetchFunctions.fetchClubData) {
      const data = await fetchFunctions.fetchClubData();
      if (data) {
        await cacheData("clubData", clubId, data);
        cached.push("clubData");
      }
    }
    
    return { success: true, cached };
  } catch (error) {
    console.error("[Cache] Pre-cache failed:", error);
    return { success: false, cached };
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

/**
 * Format cache age for display
 */
export function formatCacheAge(timestamp: number): string {
  const age = Date.now() - timestamp;
  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(age / 3600000);
  const days = Math.floor(age / 86400000);
  
  if (minutes < 1) return "Przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  if (hours < 24) return `${hours} godz. temu`;
  return `${days} dni temu`;
}
