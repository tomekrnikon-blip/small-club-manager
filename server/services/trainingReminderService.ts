/**
 * Training Reminder Service
 * 
 * Sends automatic reminders to players and parents 24 hours before
 * trainings and matches.
 */

import { getDb } from "../db";
import { trainings, matches, players, clubMembers, notifications, parentChildren } from "../../drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

export interface ReminderConfig {
  trainingReminder: boolean;
  matchReminder: boolean;
  reminderHours: number; // Hours before event
  notifyPlayers: boolean;
  notifyParents: boolean;
}

export interface ScheduledReminder {
  eventType: "training" | "match";
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  location?: string;
  recipientId: string;
  recipientType: "player" | "parent";
  scheduledFor: Date;
}

/**
 * Get upcoming events that need reminders
 */
export async function getEventsNeedingReminders(
  clubId: number,
  hoursAhead: number = 24
): Promise<{ trainings: any[]; matches: any[] }> {
  const db = await getDb();
  if (!db) {
    return { trainings: [], matches: [] };
  }
  
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const reminderStart = new Date(now.getTime() + (hoursAhead - 1) * 60 * 60 * 1000);
  
  // Get trainings in the reminder window
  const upcomingTrainings = await db
    .select()
    .from(trainings)
    .where(eq(trainings.clubId, clubId));
  
  // Get matches in the reminder window  
  const upcomingMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.clubId, clubId));
  
  // Filter by date in memory (simpler approach)
  const filterByDate = (items: any[]) => items.filter(item => {
    const itemDate = new Date(item.trainingDate || item.matchDate || item.date);
    return itemDate >= reminderStart && itemDate <= reminderWindow;
  });
  
  return {
    trainings: filterByDate(upcomingTrainings),
    matches: filterByDate(upcomingMatches),
  };
}

/**
 * Get recipients for event reminders
 */
export async function getEventRecipients(
  clubId: number,
  teamId?: number
): Promise<{ players: any[]; parents: any[] }> {
  const db = await getDb();
  if (!db) {
    return { players: [], parents: [] };
  }
  
  // Get all players in the club/team
  const clubPlayers = await db
    .select()
    .from(players)
    .where(eq(players.clubId, clubId));
  
  // Get parent-child relationships
  const parentRelations = await db
    .select()
    .from(parentChildren)
    .where(eq(parentChildren.isVerified, true));
  
  return {
    players: clubPlayers,
    parents: parentRelations,
  };
}

/**
 * Create reminder notification
 */
export async function createReminderNotification(
  reminder: ScheduledReminder,
  clubId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[Reminder] Database not available');
    return;
  }
  
  const eventTypeLabel = reminder.eventType === "training" ? "Trening" : "Mecz";
  const eventDate = new Date(reminder.eventDate);
  const formattedDate = eventDate.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = eventDate.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const title = `Przypomnienie: ${eventTypeLabel} jutro`;
  const message = `${reminder.eventTitle} - ${formattedDate} o ${formattedTime}${reminder.location ? ` (${reminder.location})` : ''}`;
  
  await db.insert(notifications).values({
    clubId,
    type: reminder.eventType,
    title,
    message,
  });
  
  console.log(`[Reminder] Created notification for ${reminder.recipientType} ${reminder.recipientId}: ${title}`);
}

/**
 * Process and send reminders for upcoming events
 */
export async function processUpcomingReminders(clubId: number): Promise<{
  sent: number;
  failed: number;
}> {
  console.log(`[Reminder] Processing reminders for club ${clubId}`);
  
  let sent = 0;
  let failed = 0;
  
  try {
    const { trainings: upcomingTrainings, matches: upcomingMatches } = 
      await getEventsNeedingReminders(clubId, 24);
    
    const { players: clubPlayers, parents } = await getEventRecipients(clubId);
    
    // Process training reminders
    for (const training of upcomingTrainings) {
      for (const player of clubPlayers) {
        try {
          await createReminderNotification({
            eventType: "training",
            eventId: String(training.id),
            eventTitle: training.title || "Trening",
            eventDate: new Date(`${training.date}T${training.startTime || '18:00'}`),
            location: training.location || undefined,
            recipientId: String(player.id),
            recipientType: "player",
            scheduledFor: new Date(),
          }, training.clubId);
          sent++;
        } catch (error) {
          console.error(`[Reminder] Failed to send training reminder:`, error);
          failed++;
        }
      }
      
      // Send to parents
      for (const parent of parents) {
        try {
          await createReminderNotification({
            eventType: "training",
            eventId: String(training.id),
            eventTitle: training.title || "Trening",
            eventDate: new Date(`${training.date}T${training.startTime || '18:00'}`),
            location: training.location || undefined,
            recipientId: String(parent.parentUserId),
            recipientType: "parent",
            scheduledFor: new Date(),
          }, training.clubId);
          sent++;
        } catch (error) {
          console.error(`[Reminder] Failed to send parent reminder:`, error);
          failed++;
        }
      }
    }
    
    // Process match reminders
    for (const match of upcomingMatches) {
      for (const player of clubPlayers) {
        try {
          await createReminderNotification({
            eventType: "match",
            eventId: String(match.id),
            eventTitle: `${match.homeTeam || 'My'} vs ${match.awayTeam || 'Przeciwnik'}`,
            eventDate: new Date(`${match.date}T${match.time || '10:00'}`),
            location: match.location || undefined,
            recipientId: String(player.id),
            recipientType: "player",
            scheduledFor: new Date(),
          }, match.clubId);
          sent++;
        } catch (error) {
          console.error(`[Reminder] Failed to send match reminder:`, error);
          failed++;
        }
      }
      
      // Send to parents
      for (const parent of parents) {
        try {
          await createReminderNotification({
            eventType: "match",
            eventId: String(match.id),
            eventTitle: `${match.homeTeam || 'My'} vs ${match.awayTeam || 'Przeciwnik'}`,
            eventDate: new Date(`${match.date}T${match.time || '10:00'}`),
            location: match.location || undefined,
            recipientId: String(parent.parentUserId),
            recipientType: "parent",
            scheduledFor: new Date(),
          }, match.clubId);
          sent++;
        } catch (error) {
          console.error(`[Reminder] Failed to send parent match reminder:`, error);
          failed++;
        }
      }
    }
    
    console.log(`[Reminder] Completed: ${sent} sent, ${failed} failed`);
  } catch (error) {
    console.error(`[Reminder] Processing error:`, error);
  }
  
  return { sent, failed };
}

/**
 * Format reminder message for different channels
 */
export function formatReminderMessage(
  reminder: ScheduledReminder,
  channel: "push" | "sms" | "email"
): { title: string; body: string; html?: string } {
  const eventTypeLabel = reminder.eventType === "training" ? "Trening" : "Mecz";
  const eventDate = new Date(reminder.eventDate);
  const formattedDate = eventDate.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = eventDate.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const title = `Przypomnienie: ${eventTypeLabel} jutro`;
  const body = `${reminder.eventTitle} odbędzie się ${formattedDate} o ${formattedTime}${reminder.location ? ` w lokalizacji: ${reminder.location}` : ''}.`;
  
  if (channel === "email") {
    return {
      title,
      body,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">📅 ${title}</h2>
          <p style="font-size: 16px; color: #333;">${body}</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p style="margin: 0;"><strong>Wydarzenie:</strong> ${reminder.eventTitle}</p>
            <p style="margin: 8px 0 0;"><strong>Data:</strong> ${formattedDate}</p>
            <p style="margin: 8px 0 0;"><strong>Godzina:</strong> ${formattedTime}</p>
            ${reminder.location ? `<p style="margin: 8px 0 0;"><strong>Miejsce:</strong> ${reminder.location}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            Wiadomość wysłana automatycznie przez Small Club Manager
          </p>
        </div>
      `,
    };
  }
  
  return { title, body };
}
