import * as db from "../db";

interface ParentInfo {
  playerId: number;
  playerName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  parentUserId: number | null;
}

interface AbsenceNotificationData {
  clubId: number;
  eventType: 'training' | 'match';
  eventId: number;
  eventDate: Date;
  eventName: string;
  absentPlayerIds: number[];
}

/**
 * Service for sending notifications to parents about their children's absences
 */
export const parentNotificationService = {
  /**
   * Get parent contact information for players
   */
  async getParentContacts(clubId: number, playerIds: number[]): Promise<ParentInfo[]> {
    if (playerIds.length === 0) return [];

    const allPlayers = await db.getPlayersByClubId(clubId);
    const filteredPlayers = allPlayers.filter((p: any) => playerIds.includes(p.id));

    return filteredPlayers.map((p: any) => ({
      playerId: p.id,
      playerName: `${p.firstName} ${p.lastName}`,
      parentEmail: p.parentEmail || null,
      parentPhone: p.parentPhone || null,
      parentUserId: p.userId || null,
    }));
  },

  /**
   * Schedule absence notifications for parents
   */
  async scheduleAbsenceNotifications(data: AbsenceNotificationData): Promise<number> {
    const parentContacts = await this.getParentContacts(data.clubId, data.absentPlayerIds);
    let scheduledCount = 0;

    for (const parent of parentContacts) {
      // Skip if no contact info
      if (!parent.parentEmail && !parent.parentPhone && !parent.parentUserId) {
        continue;
      }

      const eventTypeLabel = data.eventType === 'training' ? 'treningu' : 'meczu';
      const dateStr = data.eventDate.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const message = `Informujemy, że ${parent.playerName} był/a nieobecny/a na ${eventTypeLabel} (${data.eventName}) w dniu ${dateStr}. Prosimy o kontakt z trenerem w celu wyjaśnienia nieobecności.`;

      // Create notification using correct schema
      await db.createNotification({
        clubId: data.clubId,
        type: 'general',
        title: `Nieobecność na ${eventTypeLabel}`,
        message,
        sentVia: parent.parentPhone ? 'sms' : 'app',
        userId: parent.parentUserId,
      });

      scheduledCount++;
    }

    return scheduledCount;
  },

  /**
   * Send immediate absence notification to a parent
   */
  async sendImmediateAbsenceNotification(
    clubId: number,
    playerId: number,
    eventType: 'training' | 'match',
    eventName: string,
    eventDate: Date
  ): Promise<boolean> {
    const [parent] = await this.getParentContacts(clubId, [playerId]);
    if (!parent) return false;

    const eventTypeLabel = eventType === 'training' ? 'treningu' : 'meczu';
    const dateStr = eventDate.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const message = `Informujemy, że ${parent.playerName} był/a nieobecny/a na ${eventTypeLabel} (${eventName}) w dniu ${dateStr}. Prosimy o kontakt z trenerem w celu wyjaśnienia nieobecności.`;

    await db.createNotification({
      clubId,
      type: 'general',
      title: `Nieobecność na ${eventTypeLabel}`,
      message,
      sentVia: parent.parentPhone ? 'sms' : 'app',
      userId: parent.parentUserId,
    });

    return true;
  },

  /**
   * Generate absence report message
   */
  generateAbsenceMessage(
    playerName: string,
    eventType: 'training' | 'match',
    eventName: string,
    eventDate: Date,
    reason?: string
  ): string {
    const eventTypeLabel = eventType === 'training' ? 'treningu' : 'meczu';
    const dateStr = eventDate.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `📋 Powiadomienie o nieobecności\n\n`;
    message += `Zawodnik: ${playerName}\n`;
    message += `Wydarzenie: ${eventName}\n`;
    message += `Typ: ${eventTypeLabel}\n`;
    message += `Data: ${dateStr}\n`;

    if (reason) {
      message += `\nPowód nieobecności: ${reason}\n`;
    } else {
      message += `\nPowód nieobecności: Nie podano\n`;
      message += `\nProsimy o kontakt z trenerem w celu wyjaśnienia nieobecności.`;
    }

    return message;
  },

  /**
   * Send bulk absence notifications for an event
   */
  async sendBulkAbsenceNotifications(
    clubId: number,
    eventType: 'training' | 'match',
    eventId: number,
    eventName: string,
    eventDate: Date,
    absentPlayerIds: number[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const playerId of absentPlayerIds) {
      try {
        const success = await this.sendImmediateAbsenceNotification(
          clubId,
          playerId,
          eventType,
          eventName,
          eventDate
        );
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send notification for player ${playerId}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  },
};
