/**
 * Google Calendar API Integration
 * 
 * Provides two-way synchronization between the app calendar and Google Calendar.
 * Requires OAuth2 authentication with Google.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_CALENDAR_TOKEN_KEY = 'google_calendar_token';
const GOOGLE_CALENDAR_SYNC_KEY = 'google_calendar_sync_enabled';
const GOOGLE_CALENDAR_ID_KEY = 'google_calendar_id';
const LAST_SYNC_KEY = 'google_calendar_last_sync';

export type GoogleCalendarToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type GoogleCalendarEvent = {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  extendedProperties?: {
    private: {
      appEventId?: string;
      appEventType?: string;
    };
  };
};

export type SyncResult = {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
};

/**
 * Check if Google Calendar sync is enabled
 */
export async function isGoogleCalendarSyncEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GOOGLE_CALENDAR_SYNC_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable Google Calendar sync
 */
export async function setGoogleCalendarSyncEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(GOOGLE_CALENDAR_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('[GoogleCalendar] Error saving sync preference:', error);
  }
}

/**
 * Get stored Google Calendar token
 */
export async function getGoogleCalendarToken(): Promise<GoogleCalendarToken | null> {
  try {
    const value = await AsyncStorage.getItem(GOOGLE_CALENDAR_TOKEN_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * Store Google Calendar token
 */
export async function setGoogleCalendarToken(token: GoogleCalendarToken): Promise<void> {
  try {
    await AsyncStorage.setItem(GOOGLE_CALENDAR_TOKEN_KEY, JSON.stringify(token));
  } catch (error) {
    console.error('[GoogleCalendar] Error saving token:', error);
  }
}

/**
 * Clear Google Calendar token (logout)
 */
export async function clearGoogleCalendarToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GOOGLE_CALENDAR_TOKEN_KEY);
    await AsyncStorage.removeItem(GOOGLE_CALENDAR_ID_KEY);
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error('[GoogleCalendar] Error clearing token:', error);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: GoogleCalendarToken): boolean {
  return Date.now() >= token.expiresAt - 60000; // 1 minute buffer
}

/**
 * Get or create the app calendar in Google Calendar
 */
export async function getOrCreateAppCalendar(accessToken: string): Promise<string | null> {
  try {
    // First, try to find existing calendar
    const listResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      console.error('[GoogleCalendar] Failed to list calendars');
      return null;
    }

    const calendars = await listResponse.json();
    const appCalendar = calendars.items?.find(
      (cal: any) => cal.summary === 'Small Club Manager'
    );

    if (appCalendar) {
      await AsyncStorage.setItem(GOOGLE_CALENDAR_ID_KEY, appCalendar.id);
      return appCalendar.id;
    }

    // Create new calendar
    const createResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: 'Small Club Manager',
          description: 'Wydarzenia z aplikacji Small Club Manager',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }
    );

    if (!createResponse.ok) {
      console.error('[GoogleCalendar] Failed to create calendar');
      return null;
    }

    const newCalendar = await createResponse.json();
    await AsyncStorage.setItem(GOOGLE_CALENDAR_ID_KEY, newCalendar.id);
    return newCalendar.id;
  } catch (error) {
    console.error('[GoogleCalendar] Error getting/creating calendar:', error);
    return null;
  }
}

/**
 * Create an event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[GoogleCalendar] Failed to create event:', error);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  } catch (error) {
    console.error('[GoogleCalendar] Error creating event:', error);
    return null;
  }
}

/**
 * Update an event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEvent
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[GoogleCalendar] Error updating event:', error);
    return false;
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404; // 404 means already deleted
  } catch (error) {
    console.error('[GoogleCalendar] Error deleting event:', error);
    return false;
  }
}

/**
 * Get events from Google Calendar
 */
export async function getGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[GoogleCalendar] Failed to get events');
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('[GoogleCalendar] Error getting events:', error);
    return [];
  }
}

/**
 * Convert app event to Google Calendar event format
 */
export function convertToGoogleEvent(
  event: {
    id: number;
    type: 'match' | 'training';
    title: string;
    date: Date;
    endDate?: Date;
    location?: string;
    notes?: string;
  }
): GoogleCalendarEvent {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const startDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return {
    summary: event.type === 'match' ? `⚽ ${event.title}` : `🏃 ${event.title}`,
    description: event.notes || `Wydarzenie z Small Club Manager`,
    location: event.location,
    start: {
      dateTime: startDate.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 },
      ],
    },
    extendedProperties: {
      private: {
        appEventId: event.id.toString(),
        appEventType: event.type,
      },
    },
  };
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return value ? parseInt(value, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('[GoogleCalendar] Error saving last sync time:', error);
  }
}

/**
 * Perform full sync with Google Calendar
 */
export async function syncWithGoogleCalendar(
  accessToken: string,
  appEvents: Array<{
    id: number;
    type: 'match' | 'training';
    title: string;
    date: Date;
    endDate?: Date;
    location?: string;
    notes?: string;
    googleEventId?: string;
  }>
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };

  try {
    // Get or create app calendar
    const calendarId = await getOrCreateAppCalendar(accessToken);
    if (!calendarId) {
      result.errors.push('Nie udało się utworzyć kalendarza');
      return result;
    }

    // Sync each event
    for (const event of appEvents) {
      const googleEvent = convertToGoogleEvent(event);

      if (event.googleEventId) {
        // Update existing event
        const updated = await updateGoogleCalendarEvent(
          accessToken,
          calendarId,
          event.googleEventId,
          googleEvent
        );
        if (updated) {
          result.eventsUpdated++;
        } else {
          // Event might have been deleted, create new one
          const newId = await createGoogleCalendarEvent(accessToken, calendarId, googleEvent);
          if (newId) {
            result.eventsCreated++;
          } else {
            result.errors.push(`Nie udało się zaktualizować wydarzenia: ${event.title}`);
          }
        }
      } else {
        // Create new event
        const eventId = await createGoogleCalendarEvent(accessToken, calendarId, googleEvent);
        if (eventId) {
          result.eventsCreated++;
        } else {
          result.errors.push(`Nie udało się utworzyć wydarzenia: ${event.title}`);
        }
      }
    }

    await setLastSyncTime();
    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error('[GoogleCalendar] Sync error:', error);
    result.errors.push('Błąd synchronizacji');
    return result;
  }
}
