/**
 * Google Calendar Integration Service
 * 
 * This service provides functionality to sync club events with Google Calendar.
 * Users need to configure their Google Calendar API credentials in club settings.
 */

import * as db from '../db';

// Event types that can be synced
export type CalendarEventType = 'match' | 'training' | 'meeting' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: CalendarEventType;
  clubId: number;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

/**
 * Generate Google Calendar event URL for adding event
 * This creates a URL that opens Google Calendar with pre-filled event details
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatDateForGoogleCalendar(event.startTime);
  const endDate = formatDateForGoogleCalendar(event.endTime);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: event.location || '',
    sf: 'true',
    output: 'xml',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Format date for Google Calendar URL
 */
function formatDateForGoogleCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate ICS file content for calendar event
 * This can be downloaded and imported into any calendar app
 */
export function generateICSContent(event: CalendarEvent): string {
  const startDate = formatDateForICS(event.startTime);
  const endDate = formatDateForICS(event.endTime);
  const now = formatDateForICS(new Date());
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Small Club Manager//SKM//PL
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
DTSTAMP:${now}
UID:${event.id}@smallclubmanager.app
SUMMARY:${escapeICSText(event.title)}
DESCRIPTION:${escapeICSText(event.description || '')}
LOCATION:${escapeICSText(event.location || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Format date for ICS file
 */
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', '');
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Get all events for a club within a date range
 */
export async function getClubEvents(
  clubId: number,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  
  // Get matches
  const matches = await db.getMatchesByClubId(clubId);
  for (const match of matches) {
    const matchDate = new Date(match.matchDate);
    if (matchDate >= startDate && matchDate <= endDate) {
      events.push({
        id: `match-${match.id}`,
        title: `${match.homeAway === 'home' ? 'Dom' : 'Wyjazd'}: vs ${match.opponent}`,
        description: `Mecz ${match.season || ''}`,
        startTime: matchDate,
        endTime: new Date(matchDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        location: match.location || undefined,
        type: 'match',
        clubId,
      });
    }
  }
  
  // Get trainings
  const trainings = await db.getTrainingsByClubId(clubId);
  for (const training of trainings) {
    const trainingDate = new Date(training.trainingDate);
    if (trainingDate >= startDate && trainingDate <= endDate) {
      events.push({
        id: `training-${training.id}`,
        title: `Trening`,
        description: training.notes || undefined,
        startTime: trainingDate,
        endTime: new Date(trainingDate.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours
        location: training.location || undefined,
        type: 'training',
        clubId,
      });
    }
  }
  
  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Export all club events as ICS file content
 */
export async function exportClubCalendar(
  clubId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const events = await getClubEvents(clubId, startDate, endDate);
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Small Club Manager//SKM//PL
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Small Club Manager
`;
  
  for (const event of events) {
    const startDateStr = formatDateForICS(event.startTime);
    const endDateStr = formatDateForICS(event.endTime);
    const now = formatDateForICS(new Date());
    
    icsContent += `BEGIN:VEVENT
DTSTART:${startDateStr}
DTEND:${endDateStr}
DTSTAMP:${now}
UID:${event.id}@smallclubmanager.app
SUMMARY:${escapeICSText(event.title)}
DESCRIPTION:${escapeICSText(event.description || '')}
LOCATION:${escapeICSText(event.location || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
  }
  
  icsContent += 'END:VCALENDAR';
  
  return icsContent;
}
