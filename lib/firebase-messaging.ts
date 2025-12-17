import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = 'fcm_token';
const FCM_TOKEN_SENT_KEY = 'fcm_token_sent';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get FCM token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('[FCM] Must use physical device for push notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[FCM] Failed to get push token - permission not granted');
    return null;
  }

  try {
    // Get Expo push token (works with FCM on Android)
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    token = pushTokenData.data;
    console.log('[FCM] Push token:', token);

    // Store token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    console.error('[FCM] Error getting push token:', error);
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Domyślne',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerty',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Przypomnienia',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#F59E0B',
    });
  }

  return token;
}

/**
 * Get stored FCM token
 */
export async function getStoredFCMToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Send FCM token to server for registration
 */
export async function sendTokenToServer(
  token: string,
  userId: string,
  clubId?: string
): Promise<boolean> {
  try {
    // Check if token was already sent
    const sentKey = `${FCM_TOKEN_SENT_KEY}_${userId}`;
    const lastSentToken = await AsyncStorage.getItem(sentKey);
    
    if (lastSentToken === token) {
      console.log('[FCM] Token already registered on server');
      return true;
    }

    // Send token to server
    const response = await fetch('/api/trpc/notifications.registerDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        userId,
        clubId,
      }),
    });

    if (response.ok) {
      await AsyncStorage.setItem(sentKey, token);
      console.log('[FCM] Token registered on server');
      return true;
    }

    console.error('[FCM] Failed to register token on server');
    return false;
  } catch (error) {
    console.error('[FCM] Error sending token to server:', error);
    return false;
  }
}

/**
 * Unregister device from push notifications
 */
export async function unregisterDevice(userId: string): Promise<boolean> {
  try {
    const token = await getStoredFCMToken();
    if (!token) return true;

    const response = await fetch('/api/trpc/notifications.unregisterDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, userId }),
    });

    if (response.ok) {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      await AsyncStorage.removeItem(`${FCM_TOKEN_SENT_KEY}_${userId}`);
      console.log('[FCM] Device unregistered');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[FCM] Error unregistering device:', error);
    return false;
  }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove notification subscription
 */
export function removeNotificationSubscription(
  subscription: Notifications.EventSubscription
): void {
  subscription.remove();
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get all pending notifications
 */
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Types for notification data
export interface NotificationData {
  type: 'match' | 'training' | 'callup' | 'message' | 'alert' | 'system';
  entityId?: string;
  clubId?: string;
  action?: string;
}

/**
 * Handle notification response and navigate to appropriate screen
 */
export function getNavigationFromNotification(
  data: NotificationData
): { screen: string; params?: Record<string, string> } | null {
  switch (data.type) {
    case 'match':
      return data.entityId 
        ? { screen: '/match/[id]', params: { id: data.entityId } }
        : { screen: '/(tabs)/matches' };
    
    case 'training':
      return data.entityId
        ? { screen: '/training/[id]', params: { id: data.entityId } }
        : { screen: '/(tabs)/calendar' };
    
    case 'callup':
      return { screen: '/my-callups' };
    
    case 'message':
      return { screen: '/messages' };
    
    case 'alert':
      return { screen: '/notifications' };
    
    case 'system':
      return { screen: '/(tabs)' };
    
    default:
      return null;
  }
}
