/**
 * Auto Reminders Service
 * Schedules automatic reminders before trainings and matches
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_SETTINGS_KEY = 'auto_reminder_settings';

export interface ReminderSettings {
  enabled: boolean;
  trainingReminderHours: number; // Hours before training
  matchReminderHours: number; // Hours before match
  reminderTypes: {
    training: boolean;
    match: boolean;
    callup: boolean;
  };
  channels: {
    push: boolean;
    sms: boolean;
  };
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  trainingReminderHours: 2,
  matchReminderHours: 24,
  reminderTypes: {
    training: true,
    match: true,
    callup: true,
  },
  channels: {
    push: true,
    sms: false,
  },
};

/**
 * Get current reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[AutoReminders] Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save reminder settings
 */
export async function saveReminderSettings(settings: Partial<ReminderSettings>): Promise<void> {
  try {
    const current = await getReminderSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(updated));
    console.log('[AutoReminders] Settings saved:', updated);
  } catch (error) {
    console.error('[AutoReminders] Error saving settings:', error);
    throw error;
  }
}

/**
 * Schedule a training reminder
 */
export async function scheduleTrainingReminder(training: {
  id: number;
  trainingDate: string;
  location?: string;
  notes?: string;
}): Promise<string | null> {
  try {
    const settings = await getReminderSettings();
    
    if (!settings.enabled || !settings.reminderTypes.training) {
      console.log('[AutoReminders] Training reminders disabled');
      return null;
    }

    const trainingDate = new Date(training.trainingDate);
    const reminderDate = new Date(trainingDate.getTime() - settings.trainingReminderHours * 60 * 60 * 1000);
    
    // Don't schedule if reminder time has passed
    if (reminderDate <= new Date()) {
      console.log('[AutoReminders] Reminder time has passed');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚽ Przypomnienie o treningu',
        body: `Trening za ${settings.trainingReminderHours}h${training.location ? ` - ${training.location}` : ''}`,
        data: {
          type: 'training_reminder',
          trainingId: training.id,
        },
      },
      trigger: {
        type: 'date',
        date: reminderDate,
      } as Notifications.DateTriggerInput,
    });

    console.log('[AutoReminders] Training reminder scheduled:', notificationId);
    
    // Store scheduled notification ID
    await storeScheduledReminder('training', training.id, notificationId);
    
    return notificationId;
  } catch (error) {
    console.error('[AutoReminders] Error scheduling training reminder:', error);
    return null;
  }
}

/**
 * Schedule a match reminder
 */
export async function scheduleMatchReminder(match: {
  id: number;
  matchDate: string;
  opponent?: string;
  location?: string;
}): Promise<string | null> {
  try {
    const settings = await getReminderSettings();
    
    if (!settings.enabled || !settings.reminderTypes.match) {
      console.log('[AutoReminders] Match reminders disabled');
      return null;
    }

    const matchDate = new Date(match.matchDate);
    const reminderDate = new Date(matchDate.getTime() - settings.matchReminderHours * 60 * 60 * 1000);
    
    // Don't schedule if reminder time has passed
    if (reminderDate <= new Date()) {
      console.log('[AutoReminders] Reminder time has passed');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Przypomnienie o meczu',
        body: `Mecz${match.opponent ? ` vs ${match.opponent}` : ''} za ${settings.matchReminderHours}h${match.location ? ` - ${match.location}` : ''}`,
        data: {
          type: 'match_reminder',
          matchId: match.id,
        },
      },
      trigger: {
        type: 'date',
        date: reminderDate,
      } as Notifications.DateTriggerInput,
    });

    console.log('[AutoReminders] Match reminder scheduled:', notificationId);
    
    // Store scheduled notification ID
    await storeScheduledReminder('match', match.id, notificationId);
    
    return notificationId;
  } catch (error) {
    console.error('[AutoReminders] Error scheduling match reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled reminder
 */
export async function cancelReminder(type: 'training' | 'match', eventId: number): Promise<void> {
  try {
    const notificationId = await getScheduledReminder(type, eventId);
    
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await removeScheduledReminder(type, eventId);
      console.log('[AutoReminders] Reminder cancelled:', notificationId);
    }
  } catch (error) {
    console.error('[AutoReminders] Error cancelling reminder:', error);
  }
}

/**
 * Store scheduled reminder ID
 */
async function storeScheduledReminder(
  type: 'training' | 'match',
  eventId: number,
  notificationId: string
): Promise<void> {
  const key = `scheduled_reminder_${type}_${eventId}`;
  await AsyncStorage.setItem(key, notificationId);
}

/**
 * Get scheduled reminder ID
 */
async function getScheduledReminder(
  type: 'training' | 'match',
  eventId: number
): Promise<string | null> {
  const key = `scheduled_reminder_${type}_${eventId}`;
  return AsyncStorage.getItem(key);
}

/**
 * Remove scheduled reminder ID
 */
async function removeScheduledReminder(
  type: 'training' | 'match',
  eventId: number
): Promise<void> {
  const key = `scheduled_reminder_${type}_${eventId}`;
  await AsyncStorage.removeItem(key);
}

/**
 * Schedule reminders for multiple trainings
 */
export async function scheduleTrainingReminders(trainings: Array<{
  id: number;
  trainingDate: string;
  location?: string;
  notes?: string;
}>): Promise<number> {
  let scheduled = 0;
  
  for (const training of trainings) {
    const result = await scheduleTrainingReminder(training);
    if (result) scheduled++;
  }
  
  console.log(`[AutoReminders] Scheduled ${scheduled} training reminders`);
  return scheduled;
}

/**
 * Schedule reminders for multiple matches
 */
export async function scheduleMatchReminders(matches: Array<{
  id: number;
  matchDate: string;
  opponent?: string;
  location?: string;
}>): Promise<number> {
  let scheduled = 0;
  
  for (const match of matches) {
    const result = await scheduleMatchReminder(match);
    if (result) scheduled++;
  }
  
  console.log(`[AutoReminders] Scheduled ${scheduled} match reminders`);
  return scheduled;
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[AutoReminders] All reminders cancelled');
}
