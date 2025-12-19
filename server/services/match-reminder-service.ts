/**
 * Match Reminder Notification Service
 * Sends push notifications 24h and 1h before scheduled matches
 */

import * as db from '../db';

interface MatchReminder {
  matchId: number;
  clubId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
  reminderSentAt: string | null;
}

type ReminderType = '24h' | '1h';

// Store for sent reminders (in production, use database)
const sentReminders: Set<string> = new Set();

/**
 * Check if reminder was already sent for a match
 */
function wasReminderSent(matchId: number, reminderType: ReminderType): boolean {
  return sentReminders.has(`${matchId}-${reminderType}`);
}

/**
 * Mark reminder as sent
 */
function markReminderSent(matchId: number, reminderType: ReminderType): void {
  sentReminders.add(`${matchId}-${reminderType}`);
}

/**
 * Get matches that need 24h reminders
 */
export async function getMatchesNeeding24hReminders(): Promise<MatchReminder[]> {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // This would be a database query in production
    // const matches = await db.getMatchesBetweenDates(in24Hours, in25Hours);
    
    return [];
  } catch (error) {
    console.error('[Match Reminder] Error getting 24h matches:', error);
    return [];
  }
}

/**
 * Get matches that need 1h reminders
 */
export async function getMatchesNeeding1hReminders(): Promise<MatchReminder[]> {
  try {
    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // This would be a database query in production
    // const matches = await db.getMatchesBetweenDates(in1Hour, in2Hours);
    
    return [];
  } catch (error) {
    console.error('[Match Reminder] Error getting 1h matches:', error);
    return [];
  }
}

/**
 * Send push notification for match reminder
 */
export async function sendMatchReminderNotification(
  match: MatchReminder,
  recipientUserIds: number[],
  reminderType: ReminderType
): Promise<{ success: boolean; sentCount: number }> {
  try {
    const title = reminderType === '24h' 
      ? '⚽ Mecz jutro!' 
      : '⚽ Mecz za godzinę!';
    
    const timeInfo = reminderType === '24h'
      ? formatMatchDate(match.matchDate)
      : `Rozpoczęcie o ${formatMatchTime(match.matchDate)}`;
    
    const body = `${match.homeTeam} vs ${match.awayTeam} - ${timeInfo}`;

    console.log(`[Match Reminder] Sending ${reminderType} notification for match ${match.matchId} to ${recipientUserIds.length} users`);

    // In production, use push notification service
    // await pushNotificationService.sendToUsers(recipientUserIds, { title, body });

    // Mark as sent
    markReminderSent(match.matchId, reminderType);

    return { success: true, sentCount: recipientUserIds.length };
  } catch (error) {
    console.error('[Match Reminder] Error sending notification:', error);
    return { success: false, sentCount: 0 };
  }
}

/**
 * Format match date for notification (24h reminder)
 */
function formatMatchDate(date: Date): string {
  return date.toLocaleString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format match time for notification (1h reminder)
 */
function formatMatchTime(date: Date): string {
  return date.toLocaleString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Process all pending match reminders (both 24h and 1h)
 */
export async function processMatchReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log('[Match Reminder] Processing match reminders...');

  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Process 24h reminders
    const matches24h = await getMatchesNeeding24hReminders();
    
    for (const match of matches24h) {
      processed++;

      if (wasReminderSent(match.matchId, '24h')) {
        continue;
      }

      const members: number[] = []; // Get from DB in production

      if (members.length === 0) {
        continue;
      }

      const result = await sendMatchReminderNotification(match, members, '24h');
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Process 1h reminders
    const matches1h = await getMatchesNeeding1hReminders();
    
    for (const match of matches1h) {
      processed++;

      if (wasReminderSent(match.matchId, '1h')) {
        continue;
      }

      const members: number[] = []; // Get from DB in production

      if (members.length === 0) {
        continue;
      }

      const result = await sendMatchReminderNotification(match, members, '1h');
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`[Match Reminder] Processed ${processed} matches: ${sent} sent, ${failed} failed`);
  } catch (error) {
    console.error('[Match Reminder] Error processing reminders:', error);
  }

  return { processed, sent, failed };
}

/**
 * Schedule match reminders for a specific match (both 24h and 1h)
 */
export async function scheduleMatchReminders(
  matchId: number,
  clubId: number,
  homeTeam: string,
  awayTeam: string,
  matchDate: Date
): Promise<{ 
  scheduled24h: boolean; 
  scheduled1h: boolean;
  reminder24hTime: Date | null;
  reminder1hTime: Date | null;
}> {
  try {
    const now = new Date();
    const reminder24hTime = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000);
    const reminder1hTime = new Date(matchDate.getTime() - 60 * 60 * 1000);

    let scheduled24h = false;
    let scheduled1h = false;

    // Schedule 24h reminder if time is in the future
    if (reminder24hTime > now) {
      // In production, save to scheduled_notifications table
      console.log(`[Match Reminder] Scheduled 24h reminder for match ${matchId} at ${reminder24hTime.toISOString()}`);
      scheduled24h = true;
    }

    // Schedule 1h reminder if time is in the future
    if (reminder1hTime > now) {
      // In production, save to scheduled_notifications table
      console.log(`[Match Reminder] Scheduled 1h reminder for match ${matchId} at ${reminder1hTime.toISOString()}`);
      scheduled1h = true;
    }

    return { 
      scheduled24h, 
      scheduled1h,
      reminder24hTime: scheduled24h ? reminder24hTime : null,
      reminder1hTime: scheduled1h ? reminder1hTime : null,
    };
  } catch (error) {
    console.error('[Match Reminder] Error scheduling reminders:', error);
    return { 
      scheduled24h: false, 
      scheduled1h: false,
      reminder24hTime: null,
      reminder1hTime: null,
    };
  }
}

/**
 * Cancel all match reminders
 */
export async function cancelMatchReminders(matchId: number): Promise<boolean> {
  try {
    // In production, delete from scheduled_notifications table
    console.log(`[Match Reminder] Cancelled all reminders for match ${matchId}`);
    return true;
  } catch (error) {
    console.error('[Match Reminder] Error cancelling reminders:', error);
    return false;
  }
}

/**
 * Initialize match reminder cron job
 * Runs every 15 minutes to check for matches needing reminders
 */
let reminderCronInterval: ReturnType<typeof setInterval> | null = null;

export function startMatchReminderCron(intervalMs: number = 15 * 60 * 1000): void {
  if (reminderCronInterval) {
    console.log('[Match Reminder] Cron already running');
    return;
  }

  console.log(`[Match Reminder] Starting cron job with interval ${intervalMs}ms (checking for 24h and 1h reminders)`);

  // Run immediately on start
  processMatchReminders();

  // Schedule recurring runs
  reminderCronInterval = setInterval(processMatchReminders, intervalMs);
}

export function stopMatchReminderCron(): void {
  if (reminderCronInterval) {
    clearInterval(reminderCronInterval);
    reminderCronInterval = null;
    console.log('[Match Reminder] Cron job stopped');
  }
}
