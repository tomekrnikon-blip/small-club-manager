/**
 * Apple Calendar Integration Service
 * Provides native iOS calendar integration using expo-calendar
 */

import * as Calendar from "expo-calendar";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APPLE_CALENDAR_ID_KEY = "apple_calendar_id";
const APPLE_CALENDAR_NAME = "Small Club Manager";

export type CalendarEventType = "match" | "training" | "meeting" | "other";

export type CalendarEvent = {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  type: CalendarEventType;
  alarms?: number[]; // minutes before event
};

/**
 * Request calendar permissions
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

/**
 * Check if calendar permissions are granted
 */
export async function hasCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === "granted";
}

/**
 * Get or create the app's dedicated calendar
 */
export async function getOrCreateAppCalendar(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    Alert.alert(
      "Brak uprawnień",
      "Aplikacja potrzebuje dostępu do kalendarza, aby dodawać wydarzenia."
    );
    return null;
  }

  // Check if we already have a calendar ID stored
  const storedCalendarId = await AsyncStorage.getItem(APPLE_CALENDAR_ID_KEY);
  if (storedCalendarId) {
    // Verify the calendar still exists
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const exists = calendars.some((cal) => cal.id === storedCalendarId);
      if (exists) {
        return storedCalendarId;
      }
    } catch (error) {
      console.error("Error checking calendar:", error);
    }
  }

  // Create a new calendar
  try {
    const defaultCalendarSource =
      Platform.OS === "ios"
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: APPLE_CALENDAR_NAME, type: "local" as const };

    if (!defaultCalendarSource) {
      console.error("No default calendar source found");
      return null;
    }

    const newCalendarId = await Calendar.createCalendarAsync({
      title: APPLE_CALENDAR_NAME,
      color: "#22c55e", // Green color matching app theme
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: (defaultCalendarSource as any).id,
      source: defaultCalendarSource as any,
      name: APPLE_CALENDAR_NAME,
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    await AsyncStorage.setItem(APPLE_CALENDAR_ID_KEY, newCalendarId);
    return newCalendarId;
  } catch (error) {
    console.error("Error creating calendar:", error);
    return null;
  }
}

/**
 * Get the default calendar source for iOS
 */
async function getDefaultCalendarSource() {
  if (Platform.OS !== "ios") {
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendars = calendars.filter(
    (cal) => cal.source.name === "iCloud" || cal.source.name === "Default"
  );

  if (defaultCalendars.length > 0) {
    return defaultCalendars[0].source;
  }

  // Fallback to any available source
  if (calendars.length > 0) {
    return calendars[0].source;
  }

  return null;
}

/**
 * Add a single event to the Apple Calendar
 */
export async function addEventToAppleCalendar(event: CalendarEvent): Promise<string | null> {
  const calendarId = await getOrCreateAppCalendar();
  if (!calendarId) {
    return null;
  }

  try {
    const eventDetails: Partial<Calendar.Event> = {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: event.alarms?.map((minutes) => ({ relativeOffset: -minutes })) || [
        { relativeOffset: -60 }, // Default 1 hour reminder
      ],
    };
    
    if (event.location) {
      eventDetails.location = event.location;
    }
    if (event.notes) {
      eventDetails.notes = event.notes;
    }

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    return eventId;
  } catch (error) {
    console.error("Error adding event to Apple Calendar:", error);
    return null;
  }
}

/**
 * Add multiple events to the Apple Calendar
 */
export async function addEventsToAppleCalendar(
  events: CalendarEvent[]
): Promise<{ success: number; failed: number }> {
  const results = { success: 0, failed: 0 };

  for (const event of events) {
    const eventId = await addEventToAppleCalendar(event);
    if (eventId) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  return results;
}

/**
 * Remove an event from the Apple Calendar
 */
export async function removeEventFromAppleCalendar(eventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    console.error("Error removing event from Apple Calendar:", error);
    return false;
  }
}

/**
 * Get all events from the app's calendar within a date range
 */
export async function getAppleCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<Calendar.Event[]> {
  const calendarId = await getOrCreateAppCalendar();
  if (!calendarId) {
    return [];
  }

  try {
    const events = await Calendar.getEventsAsync([calendarId], startDate, endDate);
    return events;
  } catch (error) {
    console.error("Error getting Apple Calendar events:", error);
    return [];
  }
}

/**
 * Sync events with Apple Calendar (add new, update existing, remove deleted)
 */
export async function syncWithAppleCalendar(
  events: CalendarEvent[],
  existingEventIds: Map<string, string> // localId -> appleEventId
): Promise<{
  added: number;
  updated: number;
  removed: number;
  errors: number;
}> {
  const results = { added: 0, updated: 0, removed: 0, errors: 0 };
  const calendarId = await getOrCreateAppCalendar();

  if (!calendarId) {
    return results;
  }

  // Add or update events
  for (const event of events) {
    try {
      if (event.id && existingEventIds.has(event.id)) {
        // Update existing event
        const appleEventId = existingEventIds.get(event.id)!;
        await Calendar.updateEventAsync(appleEventId, {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location || undefined,
          notes: event.notes || undefined,
        });
        results.updated++;
      } else {
        // Add new event
        await addEventToAppleCalendar(event);
        results.added++;
      }
    } catch (error) {
      console.error("Error syncing event:", error);
      results.errors++;
    }
  }

  return results;
}

/**
 * Get list of available calendars on the device
 */
export async function getAvailableCalendars(): Promise<Calendar.Calendar[]> {
  if (Platform.OS === "web") {
    return [];
  }

  const hasPermission = await hasCalendarPermissions();
  if (!hasPermission) {
    return [];
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars.filter((cal) => cal.allowsModifications);
  } catch (error) {
    console.error("Error getting calendars:", error);
    return [];
  }
}

/**
 * Check if Apple Calendar integration is available
 */
export function isAppleCalendarAvailable(): boolean {
  return Platform.OS === "ios";
}

/**
 * Format event for display
 */
export function formatEventForCalendar(
  type: CalendarEventType,
  title: string,
  date: Date,
  durationMinutes: number = 90,
  location?: string,
  notes?: string
): CalendarEvent {
  const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000);

  const prefix = type === "match" ? "⚽ " : type === "training" ? "🏃 " : "";

  return {
    title: `${prefix}${title}`,
    startDate: date,
    endDate,
    location,
    notes,
    type,
    alarms: type === "match" ? [1440, 60] : [60], // Match: 24h and 1h before, Training: 1h before
  };
}
