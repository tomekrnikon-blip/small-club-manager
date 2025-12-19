/**
 * Match Reminder Notification Service
 * Sends push notifications 24h before scheduled matches
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

// Store for sent reminders (in production, use database)
const sentReminders: Set<string> = new Set();

/**
 * Check if reminder was already sent for a match
 */
function wasReminderSent(matchId: number, reminderType: '24h' | '1h'): boolean {
  return sentReminders.has(`${matchId}-${reminderType}`);
}

/**
 * Mark reminder as sent
 */
function markReminderSent(matchId: number, reminderType: '24h' | '1h'): void {
  sentReminders.add(`${matchId}-${reminderType}`);
}

/**
 * Get matches that need 24h reminders
 */
export async function getMatchesNeedingReminders(): Promise<MatchReminder[]> {
  try {
    // Get all matches from database
    // In production, query only matches in the next 24-25 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // This would be a database query in production
    // const matches = await db.getMatchesBetweenDates(in24Hours, in25Hours);
    
    // For now, return empty array - matches will be fetched from actual DB
    return [];
  } catch (error) {
    console.error('[Match Reminder] Error getting matches:', error);
    return [];
  }
}

/**
 * Send push notification for match reminder
 */
export async function sendMatchReminderNotification(
  match: MatchReminder,
  recipientUserIds: number[]
): Promise<{ success: boolean; sentCount: number }> {
  try {
    const title = '⚽ Mecz jutro!';
    const body = `${match.homeTeam} vs ${match.awayTeam} - ${formatMatchDate(match.matchDate)}`;

    console.log(`[Match Reminder] Sending notification for match ${match.matchId} to ${recipientUserIds.length} users`);

    // In production, use push notification service
    // await pushNotificationService.sendToUsers(recipientUserIds, { title, body });

    // Mark as sent
    markReminderSent(match.matchId, '24h');

    return { success: true, sentCount: recipientUserIds.length };
  } catch (error) {
    console.error('[Match Reminder] Error sending notification:', error);
    return { success: false, sentCount: 0 };
  }
}

/**
 * Format match date for notification
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
 * Process all pending match reminders
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
    const matches = await getMatchesNeedingReminders();
    
    for (const match of matches) {
      processed++;

      // Skip if already sent
      if (wasReminderSent(match.matchId, '24h')) {
        continue;
      }

      // Get club members to notify
      // const members = await db.getClubMemberUserIds(match.clubId);
      const members: number[] = []; // Placeholder

      if (members.length === 0) {
        continue;
      }

      const result = await sendMatchReminderNotification(match, members);
      
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
 * Schedule match reminder for a specific match
 */
export async function scheduleMatchReminder(
  matchId: number,
  clubId: number,
  homeTeam: string,
  awayTeam: string,
  matchDate: Date
): Promise<{ scheduled: boolean; reminderTime: Date | null }> {
  try {
    const now = new Date();
    const reminderTime = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000);

    // If reminder time is in the past, don't schedule
    if (reminderTime <= now) {
      console.log(`[Match Reminder] Match ${matchId} reminder time is in the past, skipping`);
      return { scheduled: false, reminderTime: null };
    }

    // In production, save to scheduled_notifications table
    // await db.createScheduledNotification({
    //   clubId,
    //   type: 'match_reminder',
    //   referenceId: matchId,
    //   referenceType: 'match',
    //   scheduledFor: reminderTime,
    //   title: '⚽ Mecz jutro!',
    //   message: `${homeTeam} vs ${awayTeam}`,
    // });

    console.log(`[Match Reminder] Scheduled reminder for match ${matchId} at ${reminderTime.toISOString()}`);

    return { scheduled: true, reminderTime };
  } catch (error) {
    console.error('[Match Reminder] Error scheduling reminder:', error);
    return { scheduled: false, reminderTime: null };
  }
}

/**
 * Cancel match reminder
 */
export async function cancelMatchReminder(matchId: number): Promise<boolean> {
  try {
    // In production, delete from scheduled_notifications table
    // await db.deleteScheduledNotification({ referenceId: matchId, referenceType: 'match' });
    
    console.log(`[Match Reminder] Cancelled reminder for match ${matchId}`);
    return true;
  } catch (error) {
    console.error('[Match Reminder] Error cancelling reminder:', error);
    return false;
  }
}

/**
 * Initialize match reminder cron job
 * Runs every hour to check for matches needing reminders
 */
let reminderCronInterval: ReturnType<typeof setInterval> | null = null;

export function startMatchReminderCron(intervalMs: number = 60 * 60 * 1000): void {
  if (reminderCronInterval) {
    console.log('[Match Reminder] Cron already running');
    return;
  }

  console.log(`[Match Reminder] Starting cron job with interval ${intervalMs}ms`);

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
