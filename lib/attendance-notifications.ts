/**
 * Attendance Notifications Service
 * 
 * Sends notifications to players who haven't been marked as present/absent
 * after a training or match has ended.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ATTENDANCE_NOTIFICATION_KEY = 'attendance_notifications_sent';

export type AttendanceNotification = {
  eventId: number;
  eventType: 'training' | 'match';
  playerId: number;
  playerName: string;
  eventDate: string;
  sentAt: string;
};

/**
 * Get list of players who haven't been marked for attendance
 */
export function getUnmarkedPlayers(
  attendance: Array<{ playerId: number; attended: number }>,
  players: Array<{ id: number; name: string }>
): Array<{ id: number; name: string }> {
  const unmarkedPlayerIds = attendance
    .filter(a => a.attended === 0) // 0 = pending/unmarked
    .map(a => a.playerId);
  
  return players.filter(p => unmarkedPlayerIds.includes(p.id));
}

/**
 * Check if event has ended (based on date and time)
 */
export function hasEventEnded(
  eventDate: Date,
  eventTime: string | null,
  durationMinutes: number = 90
): boolean {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  
  if (eventTime) {
    const [hours, minutes] = eventTime.split(':').map(Number);
    eventDateTime.setHours(hours, minutes, 0, 0);
  } else {
    // Default to end of day if no time specified
    eventDateTime.setHours(23, 59, 59, 999);
  }
  
  // Add duration to get end time
  eventDateTime.setMinutes(eventDateTime.getMinutes() + durationMinutes);
  
  return now > eventDateTime;
}

/**
 * Check if notification was already sent for this event
 */
export async function wasNotificationSent(
  eventId: number,
  eventType: 'training' | 'match'
): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(ATTENDANCE_NOTIFICATION_KEY);
    if (!stored) return false;
    
    const notifications: AttendanceNotification[] = JSON.parse(stored);
    return notifications.some(
      n => n.eventId === eventId && n.eventType === eventType
    );
  } catch (error) {
    console.error('[AttendanceNotifications] Error checking sent status:', error);
    return false;
  }
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(
  eventId: number,
  eventType: 'training' | 'match',
  players: Array<{ id: number; name: string }>,
  eventDate: string
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ATTENDANCE_NOTIFICATION_KEY);
    const notifications: AttendanceNotification[] = stored ? JSON.parse(stored) : [];
    
    const newNotifications = players.map(player => ({
      eventId,
      eventType,
      playerId: player.id,
      playerName: player.name,
      eventDate,
      sentAt: new Date().toISOString(),
    }));
    
    notifications.push(...newNotifications);
    
    // Keep only last 100 notifications
    const trimmed = notifications.slice(-100);
    
    await AsyncStorage.setItem(ATTENDANCE_NOTIFICATION_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[AttendanceNotifications] Error marking notification sent:', error);
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<AttendanceNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(ATTENDANCE_NOTIFICATION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[AttendanceNotifications] Error getting history:', error);
    return [];
  }
}

/**
 * Clear notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ATTENDANCE_NOTIFICATION_KEY);
  } catch (error) {
    console.error('[AttendanceNotifications] Error clearing history:', error);
  }
}

/**
 * Generate notification message for unmarked attendance
 */
export function generateAttendanceReminderMessage(
  eventType: 'training' | 'match',
  eventDate: Date,
  unmarkedCount: number
): { title: string; body: string } {
  const dateStr = eventDate.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  });
  
  const eventName = eventType === 'training' ? 'treningu' : 'meczu';
  
  return {
    title: `Nieoznaczona obecność`,
    body: `${unmarkedCount} zawodnik${unmarkedCount === 1 ? '' : 'ów'} nie ma oznaczonej obecności po ${eventName} z dnia ${dateStr}. Kliknij aby uzupełnić listę.`,
  };
}

/**
 * Generate SMS message for player about unmarked attendance
 */
export function generatePlayerAttendanceSMS(
  playerName: string,
  eventType: 'training' | 'match',
  eventDate: Date
): string {
  const dateStr = eventDate.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  });
  
  const eventName = eventType === 'training' ? 'treningu' : 'meczu';
  
  return `Cześć ${playerName}! Twoja obecność na ${eventName} z dnia ${dateStr} nie została jeszcze oznaczona. Prosimy o kontakt z trenerem.`;
}
