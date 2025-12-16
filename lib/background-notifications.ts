/**
 * Background Push Notifications Service
 * 
 * Handles push notifications when app is in background or closed.
 * Integrates with Expo Push Notifications and local notification scheduling.
 */

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
const LAST_CHECK_KEY = '@skm_last_notification_check';
const NOTIFICATION_PREFERENCES_KEY = '@skm_notification_preferences';

export type NotificationPreferences = {
  enabled: boolean;
  matchReminders: boolean;
  trainingReminders: boolean;
  callupNotifications: boolean;
  paymentReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  matchReminders: true,
  trainingReminders: true,
  callupNotifications: true,
  paymentReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Define background task for checking notifications
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('[BackgroundNotifications] Running background task...');
    
    const preferences = await getNotificationPreferences();
    if (!preferences.enabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check for new notifications from server
    const hasNewNotifications = await checkForNewNotifications();
    
    if (hasNewNotifications) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundNotifications] Error in background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background notification task
 */
export async function registerBackgroundNotifications(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.log('[BackgroundNotifications] Background fetch is restricted or denied');
      return false;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundNotifications] Background task registered');
    return true;
  } catch (error) {
    console.error('[BackgroundNotifications] Error registering background task:', error);
    return false;
  }
}

/**
 * Unregister background notification task
 */
export async function unregisterBackgroundNotifications(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('[BackgroundNotifications] Background task unregistered');
  } catch (error) {
    console.error('[BackgroundNotifications] Error unregistering background task:', error);
  }
}

/**
 * Check for new notifications from server
 */
async function checkForNewNotifications(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;
    
    // Update last check time
    await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    
    // In a real implementation, this would call the server API
    // For now, we'll just return false
    // TODO: Implement server-side notification check
    
    return false;
  } catch (error) {
    console.error('[BackgroundNotifications] Error checking for notifications:', error);
    return false;
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(updated));
    
    // Enable/disable background task based on preferences
    if (updated.enabled) {
      await registerBackgroundNotifications();
    } else {
      await unregisterBackgroundNotifications();
    }
  } catch (error) {
    console.error('[BackgroundNotifications] Error saving preferences:', error);
  }
}

/**
 * Schedule match reminder notification
 */
export async function scheduleMatchReminder(
  matchId: number,
  opponent: string,
  matchDate: Date,
  hoursBefore: number = 24
): Promise<string | null> {
  try {
    const preferences = await getNotificationPreferences();
    if (!preferences.enabled || !preferences.matchReminders) {
      return null;
    }

    const triggerDate = new Date(matchDate.getTime() - hoursBefore * 60 * 60 * 1000);
    
    if (triggerDate <= new Date()) {
      return null; // Don't schedule if trigger time has passed
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Przypomnienie o meczu',
        body: `Mecz z ${opponent} za ${hoursBefore} godzin`,
        data: { type: 'match_reminder', matchId },
        sound: preferences.soundEnabled,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return identifier;
  } catch (error) {
    console.error('[BackgroundNotifications] Error scheduling match reminder:', error);
    return null;
  }
}

/**
 * Schedule training reminder notification
 */
export async function scheduleTrainingReminder(
  trainingId: number,
  trainingDate: Date,
  location: string | null,
  hoursBefore: number = 2
): Promise<string | null> {
  try {
    const preferences = await getNotificationPreferences();
    if (!preferences.enabled || !preferences.trainingReminders) {
      return null;
    }

    const triggerDate = new Date(trainingDate.getTime() - hoursBefore * 60 * 60 * 1000);
    
    if (triggerDate <= new Date()) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Przypomnienie o treningu',
        body: location ? `Trening za ${hoursBefore}h w ${location}` : `Trening za ${hoursBefore} godziny`,
        data: { type: 'training_reminder', trainingId },
        sound: preferences.soundEnabled,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return identifier;
  } catch (error) {
    console.error('[BackgroundNotifications] Error scheduling training reminder:', error);
    return null;
  }
}

/**
 * Send immediate callup notification
 */
export async function sendCallupNotification(
  matchId: number,
  opponent: string,
  matchDate: string
): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    if (!preferences.enabled || !preferences.callupNotifications) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nowe powołanie!',
        body: `Zostałeś powołany na mecz z ${opponent} (${matchDate})`,
        data: { type: 'callup', matchId },
        sound: preferences.soundEnabled,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[BackgroundNotifications] Error sending callup notification:', error);
  }
}

/**
 * Cancel specific notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('[BackgroundNotifications] Error canceling notification:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[BackgroundNotifications] Error getting scheduled notifications:', error);
    return [];
  }
}
