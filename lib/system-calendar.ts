/**
 * System Calendar Integration
 * 
 * Exports events to iOS/Android native calendar apps.
 * Uses expo-calendar for cross-platform calendar access.
 */

import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export type CalendarEvent = {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: number[]; // Minutes before event
};

/**
 * Request calendar permissions
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Calendar] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Get the default calendar ID for the platform
 */
async function getDefaultCalendarId(): Promise<string | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Find the default calendar
    const defaultCalendar = calendars.find((cal: Calendar.Calendar) => {
      if (Platform.OS === 'ios') {
        return cal.allowsModifications && cal.source?.name === 'Default';
      }
      return cal.allowsModifications && cal.isPrimary;
    });

    if (defaultCalendar) {
      return defaultCalendar.id;
    }

    // Fallback to first writable calendar
    const writableCalendar = calendars.find((cal: Calendar.Calendar) => cal.allowsModifications);
    return writableCalendar?.id || null;
  } catch (error) {
    console.error('[Calendar] Error getting calendars:', error);
    return null;
  }
}

/**
 * Create a new calendar for Small Club Manager events
 */
async function createAppCalendar(): Promise<string | null> {
  try {
    const defaultCalendarSource = Platform.select({
      ios: async () => {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find((cal: Calendar.Calendar) => cal.source?.name === 'Default');
        return defaultCalendar?.source;
      },
      android: async () => {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const localCalendar = calendars.find(
          (cal: Calendar.Calendar) => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
        );
        return localCalendar?.source || { isLocalAccount: true, name: 'Small Club Manager', type: 'LOCAL' };
      },
    });

    const source = await defaultCalendarSource?.();
    if (!source) {
      return null;
    }

    const calendarId = await Calendar.createCalendarAsync({
      title: 'Small Club Manager',
      color: '#22c55e',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: source.id,
      source: source as any,
      name: 'Small Club Manager',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return calendarId;
  } catch (error) {
    console.error('[Calendar] Error creating calendar:', error);
    return null;
  }
}

/**
 * Get or create the app calendar
 */
async function getOrCreateAppCalendar(): Promise<string | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const appCalendar = calendars.find((cal: Calendar.Calendar) => cal.title === 'Small Club Manager');
    
    if (appCalendar) {
      return appCalendar.id;
    }

    // Create new calendar if not found
    return await createAppCalendar();
  } catch (error) {
    console.error('[Calendar] Error getting/creating calendar:', error);
    return null;
  }
}

/**
 * Add a single event to the system calendar
 */
export async function addEventToCalendar(event: CalendarEvent): Promise<string | null> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Brak uprawnień',
        'Aplikacja potrzebuje dostępu do kalendarza, aby dodawać wydarzenia.'
      );
      return null;
    }

    const calendarId = await getOrCreateAppCalendar();
    if (!calendarId) {
      // Fallback to default calendar
      const defaultId = await getDefaultCalendarId();
      if (!defaultId) {
        Alert.alert('Błąd', 'Nie znaleziono kalendarza do dodania wydarzenia.');
        return null;
      }
    }

    const eventDetails: Partial<Calendar.Event> = {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (event.location) {
      eventDetails.location = event.location;
    }
    if (event.notes) {
      eventDetails.notes = event.notes;
    }
    if (event.alarms && event.alarms.length > 0) {
      eventDetails.alarms = event.alarms.map((minutes) => ({ relativeOffset: -minutes }));
    }

    const eventId = await Calendar.createEventAsync(calendarId || (await getDefaultCalendarId())!, eventDetails);
    return eventId;
  } catch (error) {
    console.error('[Calendar] Error adding event:', error);
    Alert.alert('Błąd', 'Nie udało się dodać wydarzenia do kalendarza.');
    return null;
  }
}

/**
 * Add a match to the system calendar
 */
export async function addMatchToCalendar(
  opponent: string,
  matchDate: Date,
  matchTime: string | null,
  location: string | null,
  isHome: boolean
): Promise<string | null> {
  const startDate = new Date(matchDate);
  if (matchTime) {
    const [hours, minutes] = matchTime.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
  }

  // Match duration: 2 hours
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return addEventToCalendar({
    title: `⚽ Mecz: ${isHome ? 'vs' : '@'} ${opponent}`,
    startDate,
    endDate,
    location: location || undefined,
    notes: `Mecz ${isHome ? 'domowy' : 'wyjazdowy'} z ${opponent}`,
    alarms: [60, 1440], // 1 hour and 24 hours before
  });
}

/**
 * Add a training to the system calendar
 */
export async function addTrainingToCalendar(
  trainingDate: Date,
  trainingTime: string | null,
  location: string | null,
  notes: string | null
): Promise<string | null> {
  const startDate = new Date(trainingDate);
  if (trainingTime) {
    const [hours, minutes] = trainingTime.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
  }

  // Training duration: 1.5 hours
  const endDate = new Date(startDate.getTime() + 1.5 * 60 * 60 * 1000);

  return addEventToCalendar({
    title: '🏃 Trening',
    startDate,
    endDate,
    location: location || undefined,
    notes: notes || 'Trening klubowy',
    alarms: [60], // 1 hour before
  });
}

/**
 * Add multiple events to the system calendar
 */
export async function addEventsToCalendar(events: CalendarEvent[]): Promise<number> {
  let successCount = 0;

  for (const event of events) {
    const eventId = await addEventToCalendar(event);
    if (eventId) {
      successCount++;
    }
  }

  return successCount;
}

/**
 * Check if calendar permissions are granted
 */
export async function hasCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get all calendars available on the device
 */
export async function getAvailableCalendars(): Promise<Calendar.Calendar[]> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return [];
    }
    return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  } catch (error) {
    console.error('[Calendar] Error getting calendars:', error);
    return [];
  }
}
