/**
 * Cron Service for Scheduled Notifications
 * 
 * This service processes scheduled notifications from the database
 * and sends them via the appropriate channel (SMS, email, or push).
 * 
 * In production, this should be run as a separate process or scheduled task.
 */

import * as db from "../db.js";
import { sendSMS, sendAppNotification } from "./notificationService.js";

// Process interval in milliseconds (default: 1 minute)
const PROCESS_INTERVAL = 60 * 1000;

// Flag to track if processing is running
let isProcessing = false;

/**
 * Process all pending scheduled notifications
 */
export async function processScheduledNotifications(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  if (isProcessing) {
    console.log("[Cron] Already processing, skipping...");
    return { processed: 0, sent: 0, failed: 0 };
  }
  
  isProcessing = true;
  const results = { processed: 0, sent: 0, failed: 0 };
  
  try {
    console.log("[Cron] Processing scheduled notifications...");
    
    // Get all pending notifications that are due
    const pendingNotifications = await db.getPendingScheduledNotifications();
    
    console.log(`[Cron] Found ${pendingNotifications.length} pending notifications`);
    
    for (const notification of pendingNotifications) {
      results.processed++;
      
      try {
        // Club ID for sending notifications
        const clubId = notification.clubId;
        
        // Send notification based on channel
        let success = false;
        
        // Parse recipient IDs from JSON
        let recipientIds: number[] = [];
        try {
          recipientIds = notification.recipientIds ? JSON.parse(notification.recipientIds) : [];
        } catch (e) {
          console.error(`[Cron] Failed to parse recipientIds:`, e);
        }
        
        // For each recipient, send notification
        for (const recipientId of recipientIds) {
          if (notification.channel === 'sms' || notification.channel === 'both') {
            // Get player/user phone from database
            const player = await db.getPlayerById(recipientId);
            if (player?.phone) {
              const smsResult = await sendSMS(
                clubId,
                player.phone,
                notification.message || notification.title
              );
              success = success || smsResult.success;
              if (!smsResult.success) {
                console.error(`[Cron] SMS failed: ${smsResult.error}`);
              }
            }
          }
          
          if (notification.channel === 'app' || notification.channel === 'both') {
            // Send in-app notification
            const appResult = await sendAppNotification(
              clubId,
              recipientId,
              notification.title,
              notification.message || notification.title,
              'callup'
            );
            success = success || appResult.success;
          }
        }
        
        // App-only notifications are handled in the loop above
        
        // Update notification status
        if (success) {
          await db.updateScheduledNotification(notification.id, {
            status: 'sent',
            sentAt: new Date(),
          });
          results.sent++;
          console.log(`[Cron] Notification ${notification.id} sent successfully`);
        } else {
          await db.updateScheduledNotification(notification.id, {
            status: 'failed',
            errorMessage: 'Failed to send via configured channel',
          });
          results.failed++;
        }
        
      } catch (error) {
        console.error(`[Cron] Error processing notification ${notification.id}:`, error);
        await db.updateScheduledNotification(notification.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        results.failed++;
      }
    }
    
    console.log(`[Cron] Completed: ${results.sent} sent, ${results.failed} failed`);
    
  } catch (error) {
    console.error("[Cron] Error in processScheduledNotifications:", error);
  } finally {
    isProcessing = false;
  }
  
  return results;
}

/**
 * Process payment reminders for academy students
 */
export async function processAcademyPaymentReminders(): Promise<{
  processed: number;
  sent: number;
}> {
  const results = { processed: 0, sent: 0 };
  
  try {
    console.log("[Cron] Processing academy payment reminders...");
    
    // Get all academy students with unpaid status
    const unpaidStudents = await db.getUnpaidAcademyStudents();
    
    console.log(`[Cron] Found ${unpaidStudents.length} unpaid academy students`);
    
    for (const student of unpaidStudents) {
      results.processed++;
      
      // Check if reminder was sent recently (within last 7 days)
      if (student.lastReminderSent) {
        const daysSinceReminder = Math.floor(
          (Date.now() - new Date(student.lastReminderSent).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceReminder < 7) {
          continue; // Skip if reminder sent within last week
        }
      }
      
      // Get club for SMS config
      const club = await db.getClubById(student.clubId);
      if (!club) continue;
      
      // Prepare reminder message
      const message = `Przypomnienie o płatności za szkółkę piłkarską ${club.name}. ` +
        `Kwota: ${student.monthlyFee || '?'} PLN. ` +
        `Prosimy o uregulowanie należności.`;
      
      // Send reminder if parent contact is available
      if (student.parentPhone) {
        // Send SMS using club's configured SMS provider
        const result = await sendSMS(student.clubId, student.parentPhone, message);
        if (result.success) {
          results.sent++;
        }
        
        // Update last reminder date
        await db.updateAcademyStudentReminderDate(student.id);
      }
    }
    
    console.log(`[Cron] Payment reminders: ${results.sent} sent out of ${results.processed} processed`);
    
  } catch (error) {
    console.error("[Cron] Error processing payment reminders:", error);
  }
  
  return results;
}

/**
 * Start the cron service
 * This sets up intervals for processing notifications and reminders
 */
export function startCronService(): void {
  console.log("[Cron] Starting cron service...");
  
  // Process scheduled notifications every minute
  setInterval(async () => {
    await processScheduledNotifications();
  }, PROCESS_INTERVAL);
  
  // Process payment reminders every hour
  setInterval(async () => {
    await processAcademyPaymentReminders();
  }, 60 * 60 * 1000);
  
  // Run initial processing
  setTimeout(async () => {
    await processScheduledNotifications();
    await processAcademyPaymentReminders();
  }, 5000);
  
  console.log("[Cron] Cron service started");
}

/**
 * Manual trigger for processing (can be called from admin panel)
 */
export async function triggerNotificationProcessing(): Promise<{
  notifications: { processed: number; sent: number; failed: number };
  reminders: { processed: number; sent: number };
}> {
  const notifications = await processScheduledNotifications();
  const reminders = await processAcademyPaymentReminders();
  return { notifications, reminders };
}
