/**
 * Sponsor Push Notifications
 * 
 * Sends push notifications about new ads, promotions, and sponsor content
 * to users who have opted in.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPONSOR_NOTIFICATIONS_KEY = 'sponsor_notifications_enabled';
const LAST_SPONSOR_NOTIFICATION_KEY = 'last_sponsor_notification';

export type SponsorNotification = {
  id: string;
  title: string;
  body: string;
  sponsor: string;
  linkUrl?: string;
  imageUrl?: string;
};

/**
 * Check if sponsor notifications are enabled
 */
export async function isSponsorNotificationsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SPONSOR_NOTIFICATIONS_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable sponsor notifications
 */
export async function setSponsorNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SPONSOR_NOTIFICATIONS_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('[SponsorNotifications] Error saving preference:', error);
  }
}

/**
 * Get the last sponsor notification timestamp
 */
export async function getLastSponsorNotificationTime(): Promise<number | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_SPONSOR_NOTIFICATION_KEY);
    return value ? parseInt(value, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set the last sponsor notification timestamp
 */
async function setLastSponsorNotificationTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SPONSOR_NOTIFICATION_KEY, Date.now().toString());
  } catch (error) {
    console.error('[SponsorNotifications] Error saving timestamp:', error);
  }
}

/**
 * Check if enough time has passed since the last sponsor notification
 * (minimum 24 hours between notifications to avoid spam)
 */
export async function canSendSponsorNotification(): Promise<boolean> {
  const lastTime = await getLastSponsorNotificationTime();
  if (!lastTime) return true;
  
  const hoursSinceLastNotification = (Date.now() - lastTime) / (1000 * 60 * 60);
  return hoursSinceLastNotification >= 24;
}

/**
 * Send a sponsor push notification
 */
export async function sendSponsorNotification(
  notification: SponsorNotification
): Promise<boolean> {
  try {
    // Check if sponsor notifications are enabled
    const enabled = await isSponsorNotificationsEnabled();
    if (!enabled) {
      console.log('[SponsorNotifications] Notifications disabled by user');
      return false;
    }

    // Check rate limiting
    const canSend = await canSendSponsorNotification();
    if (!canSend) {
      console.log('[SponsorNotifications] Rate limited - too soon since last notification');
      return false;
    }

    // Request permission if not granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[SponsorNotifications] Permission not granted');
      return false;
    }

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📢 ${notification.title}`,
        body: notification.body,
        data: {
          type: 'sponsor',
          sponsorId: notification.id,
          sponsor: notification.sponsor,
          linkUrl: notification.linkUrl,
        },
        badge: 1,
      },
      trigger: null, // Send immediately
    });

    // Update last notification time
    await setLastSponsorNotificationTime();

    console.log('[SponsorNotifications] Notification sent:', notification.title);
    return true;
  } catch (error) {
    console.error('[SponsorNotifications] Error sending notification:', error);
    return false;
  }
}

/**
 * Schedule a sponsor notification for a specific time
 */
export async function scheduleSponsorNotification(
  notification: SponsorNotification,
  scheduledTime: Date
): Promise<string | null> {
  try {
    // Check if sponsor notifications are enabled
    const enabled = await isSponsorNotificationsEnabled();
    if (!enabled) {
      console.log('[SponsorNotifications] Notifications disabled by user');
      return null;
    }

    // Request permission if not granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[SponsorNotifications] Permission not granted');
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📢 ${notification.title}`,
        body: notification.body,
        data: {
          type: 'sponsor',
          sponsorId: notification.id,
          sponsor: notification.sponsor,
          linkUrl: notification.linkUrl,
        },
        badge: 1,
      },
      trigger: {
        type: 'date',
        date: scheduledTime,
      } as any,
    });

    console.log('[SponsorNotifications] Notification scheduled:', notification.title, 'at', scheduledTime);
    return notificationId;
  } catch (error) {
    console.error('[SponsorNotifications] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled sponsor notification
 */
export async function cancelSponsorNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[SponsorNotifications] Notification cancelled:', notificationId);
  } catch (error) {
    console.error('[SponsorNotifications] Error cancelling notification:', error);
  }
}

/**
 * Get all pending sponsor notifications
 */
export async function getPendingSponsorNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return allNotifications.filter(
      (n) => n.content.data?.type === 'sponsor'
    );
  } catch (error) {
    console.error('[SponsorNotifications] Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Cancel all pending sponsor notifications
 */
export async function cancelAllSponsorNotifications(): Promise<void> {
  try {
    const pending = await getPendingSponsorNotifications();
    for (const notification of pending) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    console.log('[SponsorNotifications] All sponsor notifications cancelled');
  } catch (error) {
    console.error('[SponsorNotifications] Error cancelling all notifications:', error);
  }
}
