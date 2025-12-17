/**
 * Calendar Export Service
 * Exports matches to device calendar (iOS/Android)
 */

import * as Calendar from "expo-calendar";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CALENDAR_ID_KEY = "@skm_calendar_id";
const EXPORTED_EVENTS_KEY = "@skm_exported_events";

export interface MatchEvent {
  id: number | string;
  opponent: string;
  date: Date;
  homeAway: "home" | "away";
  venue?: string;
  competition?: string;
}

/**
 * Request calendar permissions
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[Calendar] Permission request failed:", error);
    return false;
  }
}

/**
 * Get or create the SKM calendar
 */
export async function getOrCreateSKMCalendar(): Promise<string | null> {
  try {
    // Check if we already have a calendar ID stored
    const storedId = await AsyncStorage.getItem(CALENDAR_ID_KEY);
    
    if (storedId) {
      // Verify the calendar still exists
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const exists = calendars.find(cal => cal.id === storedId);
      if (exists) {
        return storedId;
      }
    }

    // Get default calendar source
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    let defaultCalendarSource: Calendar.Source | undefined;
    
    if (Platform.OS === "ios") {
      defaultCalendarSource = calendars.find(
        cal => cal.source?.name === "iCloud" || cal.source?.name === "Default"
      )?.source;
      
      if (!defaultCalendarSource) {
        defaultCalendarSource = calendars[0]?.source;
      }
    } else {
      // Android
      const localCalendar = calendars.find(
        cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
      );
      defaultCalendarSource = localCalendar?.source;
    }

    if (!defaultCalendarSource) {
      console.error("[Calendar] No calendar source found");
      return null;
    }

    // Create new calendar
    const newCalendarId = await Calendar.createCalendarAsync({
      title: "Small Club Manager",
      color: "#22c55e",
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: "skm-matches",
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    await AsyncStorage.setItem(CALENDAR_ID_KEY, newCalendarId);
    return newCalendarId;
  } catch (error) {
    console.error("[Calendar] Failed to get/create calendar:", error);
    return null;
  }
}

/**
 * Export a single match to calendar
 */
export async function exportMatchToCalendar(
  match: MatchEvent,
  clubName: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return { success: false, error: "Brak uprawnień do kalendarza" };
    }

    const calendarId = await getOrCreateSKMCalendar();
    if (!calendarId) {
      return { success: false, error: "Nie udało się utworzyć kalendarza" };
    }

    // Check if already exported
    const exportedEvents = await getExportedEvents();
    if (exportedEvents[match.id]) {
      return { success: true, eventId: exportedEvents[match.id] };
    }

    const isHome = match.homeAway === "home";
    const title = isHome
      ? `⚽ ${clubName} vs ${match.opponent}`
      : `⚽ ${match.opponent} vs ${clubName}`;

    const startDate = new Date(match.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      location: match.venue || (isHome ? "Stadion domowy" : "Wyjazd"),
      notes: `${match.competition || "Liga"}\n${isHome ? "Mecz domowy" : "Mecz wyjazdowy"}`,
      alarms: [
        { relativeOffset: -1440 }, // 24h before
        { relativeOffset: -120 },  // 2h before
      ],
    });

    // Save exported event
    exportedEvents[match.id] = eventId;
    await AsyncStorage.setItem(EXPORTED_EVENTS_KEY, JSON.stringify(exportedEvents));

    return { success: true, eventId };
  } catch (error) {
    console.error("[Calendar] Export failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Export multiple matches to calendar
 */
export async function exportMatchesToCalendar(
  matches: MatchEvent[],
  clubName: string
): Promise<{ exported: number; failed: number; errors: string[] }> {
  const results = {
    exported: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const match of matches) {
    const result = await exportMatchToCalendar(match, clubName);
    if (result.success) {
      results.exported++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push(`${match.opponent}: ${result.error}`);
      }
    }
  }

  return results;
}

/**
 * Update an exported event (when schedule changes)
 */
export async function updateCalendarEvent(
  matchId: number | string,
  updates: Partial<{
    date: Date;
    venue: string;
    opponent: string;
  }>,
  clubName: string
): Promise<boolean> {
  try {
    const exportedEvents = await getExportedEvents();
    const eventId = exportedEvents[matchId];

    if (!eventId) {
      return false;
    }

    const calendarId = await getOrCreateSKMCalendar();
    if (!calendarId) {
      return false;
    }

    const updateData: Partial<Calendar.Event> = {};

    if (updates.date) {
      updateData.startDate = new Date(updates.date);
      updateData.endDate = new Date(updates.date.getTime() + 2 * 60 * 60 * 1000);
    }

    if (updates.venue) {
      updateData.location = updates.venue;
    }

    await Calendar.updateEventAsync(eventId, updateData);
    return true;
  } catch (error) {
    console.error("[Calendar] Update failed:", error);
    return false;
  }
}

/**
 * Delete an exported event
 */
export async function deleteCalendarEvent(matchId: number | string): Promise<boolean> {
  try {
    const exportedEvents = await getExportedEvents();
    const eventId = exportedEvents[matchId];

    if (!eventId) {
      return true; // Already not in calendar
    }

    await Calendar.deleteEventAsync(eventId);

    delete exportedEvents[matchId];
    await AsyncStorage.setItem(EXPORTED_EVENTS_KEY, JSON.stringify(exportedEvents));

    return true;
  } catch (error) {
    console.error("[Calendar] Delete failed:", error);
    return false;
  }
}

/**
 * Get list of exported event IDs
 */
async function getExportedEvents(): Promise<Record<string | number, string>> {
  try {
    const stored = await AsyncStorage.getItem(EXPORTED_EVENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Check if a match is already exported
 */
export async function isMatchExported(matchId: number | string): Promise<boolean> {
  const exportedEvents = await getExportedEvents();
  return !!exportedEvents[matchId];
}

/**
 * Show calendar export dialog
 */
export function showExportDialog(
  onExport: () => void,
  matchCount: number
): void {
  Alert.alert(
    "Eksport do kalendarza",
    `Czy chcesz wyeksportować ${matchCount} ${matchCount === 1 ? "mecz" : "meczów"} do kalendarza systemowego?`,
    [
      { text: "Anuluj", style: "cancel" },
      { text: "Eksportuj", onPress: onExport },
    ]
  );
}
