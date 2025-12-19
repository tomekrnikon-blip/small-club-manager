/**
 * RegioWyniki Automatic Sync Cron Service
 * Runs daily to fetch latest data from RegioWyniki.pl
 */

import { getFullClubData } from './regiowyniki-scraper';

// Store for club sync configurations
interface ClubSyncConfig {
  clubId: number;
  regiowynikUrl: string;
  lastSyncAt: string | null;
  syncEnabled: boolean;
}

// In-memory store (in production, use database)
const clubSyncConfigs: Map<number, ClubSyncConfig> = new Map();

/**
 * Register a club for automatic sync
 */
export function registerClubForSync(config: ClubSyncConfig): void {
  clubSyncConfigs.set(config.clubId, config);
  console.log(`[RegioWyniki Sync] Registered club ${config.clubId} for sync`);
}

/**
 * Unregister a club from automatic sync
 */
export function unregisterClubFromSync(clubId: number): void {
  clubSyncConfigs.delete(clubId);
  console.log(`[RegioWyniki Sync] Unregistered club ${clubId} from sync`);
}

/**
 * Get sync status for a club
 */
export function getClubSyncStatus(clubId: number): ClubSyncConfig | undefined {
  return clubSyncConfigs.get(clubId);
}

/**
 * Sync a single club's data
 */
export async function syncClub(clubId: number): Promise<{
  success: boolean;
  error?: string;
  matchesCount?: number;
  tablePosition?: number | null;
}> {
  const config = clubSyncConfigs.get(clubId);
  
  if (!config) {
    return { success: false, error: 'Club not registered for sync' };
  }

  if (!config.syncEnabled) {
    return { success: false, error: 'Sync disabled for this club' };
  }

  try {
    console.log(`[RegioWyniki Sync] Starting sync for club ${clubId}`);
    
    const data = await getFullClubData(config.regiowynikUrl);
    
    // Update last sync time
    config.lastSyncAt = new Date().toISOString();
    clubSyncConfigs.set(clubId, config);

    // Find club's position in table
    const clubPosition = data.table.find(t => 
      data.details?.name && t.teamName.toLowerCase().includes(data.details.name.toLowerCase())
    )?.position || null;

    console.log(`[RegioWyniki Sync] Completed sync for club ${clubId}: ${data.schedule.length} matches, position ${clubPosition}`);

    return {
      success: true,
      matchesCount: data.schedule.length,
      tablePosition: clubPosition,
    };
  } catch (error) {
    console.error(`[RegioWyniki Sync] Error syncing club ${clubId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all registered clubs
 */
export async function syncAllClubs(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{ clubId: number; success: boolean; error?: string }>;
}> {
  const results: Array<{ clubId: number; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  console.log(`[RegioWyniki Sync] Starting daily sync for ${clubSyncConfigs.size} clubs`);

  for (const [clubId, config] of clubSyncConfigs) {
    if (!config.syncEnabled) {
      continue;
    }

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await syncClub(clubId);
    results.push({ clubId, ...result });

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  console.log(`[RegioWyniki Sync] Daily sync completed: ${successful} successful, ${failed} failed`);

  return {
    total: clubSyncConfigs.size,
    successful,
    failed,
    results,
  };
}

/**
 * Process daily sync cron job
 * Should be called once per day (e.g., at 6:00 AM)
 */
export async function processDailySync(): Promise<void> {
  console.log('[RegioWyniki Sync] Running daily sync cron job...');
  
  try {
    const result = await syncAllClubs();
    console.log(`[RegioWyniki Sync] Daily sync result:`, result);
  } catch (error) {
    console.error('[RegioWyniki Sync] Daily sync cron job failed:', error);
  }
}

/**
 * Initialize the cron job (call this on server startup)
 */
let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncCron(intervalMs: number = 24 * 60 * 60 * 1000): void {
  if (cronInterval) {
    console.log('[RegioWyniki Sync] Cron already running');
    return;
  }

  console.log(`[RegioWyniki Sync] Starting cron job with interval ${intervalMs}ms`);
  
  // Run immediately on start
  processDailySync();

  // Schedule recurring runs
  cronInterval = setInterval(processDailySync, intervalMs);
}

export function stopSyncCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[RegioWyniki Sync] Cron job stopped');
  }
}

/**
 * Get all registered clubs for sync
 */
export function getAllSyncConfigs(): ClubSyncConfig[] {
  return Array.from(clubSyncConfigs.values());
}
