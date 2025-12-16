import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Object.keys(mockStorage))),
    multiRemove: vi.fn((keys: string[]) => {
      keys.forEach((key) => delete mockStorage[key]);
      return Promise.resolve();
    }),
  },
}));

describe('Offline Storage Service', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCached', () => {
    it('should return null for non-existent key', async () => {
      const { getCached } = await import('./offline-storage');
      const result = await getCached('non_existent');
      expect(result).toBeNull();
    });

    it('should return cached data if not expired', async () => {
      const { getCached, setCached } = await import('./offline-storage');
      const testData = { name: 'Test', value: 123 };
      
      await setCached('test_key', testData, 60000);
      const result = await getCached('test_key');
      
      expect(result).toEqual(testData);
    });
  });

  describe('setCached', () => {
    it('should store data with timestamp and expiration', async () => {
      const { setCached } = await import('./offline-storage');
      const testData = { name: 'Test' };
      
      await setCached('test_key', testData, 60000);
      
      const stored = mockStorage['@skm_cache_test_key'];
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored);
      expect(parsed.data).toEqual(testData);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.expiresAt).toBeDefined();
    });
  });

  describe('removeCached', () => {
    it('should remove cached data', async () => {
      const { setCached, removeCached, getCached } = await import('./offline-storage');
      
      await setCached('test_key', { data: 'test' });
      await removeCached('test_key');
      
      const result = await getCached('test_key');
      expect(result).toBeNull();
    });
  });

  describe('Sync Queue', () => {
    it('should add items to sync queue', async () => {
      const { addToSyncQueue, getSyncQueue } = await import('./offline-storage');
      
      await addToSyncQueue({
        action: 'create',
        entity: 'player',
        data: { name: 'New Player' },
      });
      
      const queue = await getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].action).toBe('create');
      expect(queue[0].entity).toBe('player');
    });

    it('should remove items from sync queue', async () => {
      const { addToSyncQueue, getSyncQueue, removeFromSyncQueue } = await import('./offline-storage');
      
      await addToSyncQueue({
        action: 'create',
        entity: 'player',
        data: { name: 'Player 1' },
      });
      
      const queue = await getSyncQueue();
      const itemId = queue[0].id;
      
      await removeFromSyncQueue(itemId);
      
      const updatedQueue = await getSyncQueue();
      expect(updatedQueue.length).toBe(0);
    });

    it('should update sync queue item retries', async () => {
      const { addToSyncQueue, getSyncQueue, updateSyncQueueItem } = await import('./offline-storage');
      
      await addToSyncQueue({
        action: 'update',
        entity: 'match',
        data: { id: 1 },
      });
      
      const queue = await getSyncQueue();
      const itemId = queue[0].id;
      
      await updateSyncQueueItem(itemId, { retries: 1 });
      
      const updatedQueue = await getSyncQueue();
      expect(updatedQueue[0].retries).toBe(1);
    });
  });

  describe('Cache Metadata', () => {
    it('should update and retrieve cache metadata', async () => {
      const { updateCacheMetadata, getCacheMetadata } = await import('./offline-storage');
      
      const now = Date.now();
      await updateCacheMetadata('players_1', now, 1);
      
      const metadata = await getCacheMetadata();
      expect(metadata['players_1']).toBeDefined();
      expect(metadata['players_1'].lastSync).toBe(now);
      expect(metadata['players_1'].version).toBe(1);
    });

    it('should check if data needs refresh', async () => {
      const { updateCacheMetadata, needsRefresh } = await import('./offline-storage');
      
      // Set metadata with recent timestamp
      await updateCacheMetadata('fresh_data', Date.now(), 1);
      const needsRefreshFresh = await needsRefresh('fresh_data', 60000);
      expect(needsRefreshFresh).toBe(false);
      
      // Non-existent key should need refresh
      const needsRefreshNew = await needsRefresh('non_existent');
      expect(needsRefreshNew).toBe(true);
    });
  });

  describe('Entity Caching', () => {
    it('should cache entity list', async () => {
      const { cacheEntityList, getCachedEntityList } = await import('./offline-storage');
      
      const players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' },
      ];
      
      await cacheEntityList('players', 1, players);
      const cached = await getCachedEntityList('players', 1);
      
      expect(cached).toEqual(players);
    });

    it('should cache single entity', async () => {
      const { cacheEntity, getCachedEntity } = await import('./offline-storage');
      
      const player = { id: 1, name: 'Player 1', position: 'Forward' };
      
      await cacheEntity('player', 1, player);
      const cached = await getCachedEntity('player', 1);
      
      expect(cached).toEqual(player);
    });
  });

  describe('formatCacheSize', () => {
    it('should format bytes correctly', async () => {
      const { formatCacheSize } = await import('./offline-storage');
      
      expect(formatCacheSize(500)).toBe('500 B');
      expect(formatCacheSize(1024)).toBe('1.0 KB');
      expect(formatCacheSize(1536)).toBe('1.5 KB');
      expect(formatCacheSize(1048576)).toBe('1.0 MB');
      expect(formatCacheSize(1572864)).toBe('1.5 MB');
    });
  });
});
