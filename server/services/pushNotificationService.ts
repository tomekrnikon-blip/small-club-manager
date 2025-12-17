import * as db from "../db";

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: number, payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  const subscriptions = await db.getPushSubscriptionsByUserId(userId);
  
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      // In a real implementation, you would use web-push library here
      // For now, we'll just log the notification
      console.log(`[Push] Sending to user ${userId}:`, payload.title);
      
      // Simulate sending - in production use web-push
      // await webpush.sendNotification(sub, JSON.stringify(payload));
      
      sent++;
    } catch (error: any) {
      console.error(`[Push] Failed to send to ${sub.endpoint}:`, error.message);
      
      // If subscription is invalid, deactivate it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await db.deactivatePushSubscription(sub.endpoint);
      }
      
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send training reminder to parents
 */
export async function sendTrainingReminder(
  clubId: number,
  trainingId: number,
  trainingDate: Date,
  location: string,
  teamName: string
): Promise<{ totalSent: number; totalFailed: number }> {
  // Get all parent-child relationships for this club
  const players = await db.getPlayersByClubId(clubId);
  
  let totalSent = 0;
  let totalFailed = 0;

  for (const player of players) {
    // Get parents of this player
    const parentRelations = await db.getParentsByPlayerId(player.id);
    
    for (const relation of parentRelations) {
      if (!relation.isVerified) continue;
      
      const { sent, failed } = await sendPushToUser(relation.parentUserId, {
        title: `Przypomnienie o treningu - ${teamName}`,
        body: `Trening ${player.name} odbędzie się ${formatDateTime(trainingDate)} w ${location}`,
        data: {
          type: 'training_reminder',
          trainingId,
          playerId: player.id,
        },
      });
      
      totalSent += sent;
      totalFailed += failed;
    }
  }

  return { totalSent, totalFailed };
}

/**
 * Send match reminder to parents
 */
export async function sendMatchReminder(
  clubId: number,
  matchId: number,
  matchDate: Date,
  opponent: string,
  location: string,
  teamName: string
): Promise<{ totalSent: number; totalFailed: number }> {
  const players = await db.getPlayersByClubId(clubId);
  
  let totalSent = 0;
  let totalFailed = 0;

  for (const player of players) {
    const parentRelations = await db.getParentsByPlayerId(player.id);
    
    for (const relation of parentRelations) {
      if (!relation.isVerified) continue;
      
      const { sent, failed } = await sendPushToUser(relation.parentUserId, {
        title: `Przypomnienie o meczu - ${teamName}`,
        body: `Mecz ${player.name} przeciwko ${opponent} odbędzie się ${formatDateTime(matchDate)} w ${location}`,
        data: {
          type: 'match_reminder',
          matchId,
          playerId: player.id,
        },
      });
      
      totalSent += sent;
      totalFailed += failed;
    }
  }

  return { totalSent, totalFailed };
}

/**
 * Send schedule change notification
 */
export async function sendScheduleChangeNotification(
  clubId: number,
  eventType: 'training' | 'match',
  eventId: number,
  changeDescription: string,
  teamName: string
): Promise<{ totalSent: number; totalFailed: number }> {
  const players = await db.getPlayersByClubId(clubId);
  
  let totalSent = 0;
  let totalFailed = 0;

  for (const player of players) {
    const parentRelations = await db.getParentsByPlayerId(player.id);
    
    for (const relation of parentRelations) {
      if (!relation.isVerified) continue;
      
      const { sent, failed } = await sendPushToUser(relation.parentUserId, {
        title: `Zmiana w harmonogramie - ${teamName}`,
        body: changeDescription,
        data: {
          type: 'schedule_change',
          eventType,
          eventId,
          playerId: player.id,
        },
      });
      
      totalSent += sent;
      totalFailed += failed;
    }
  }

  return { totalSent, totalFailed };
}

/**
 * Send new message notification
 */
export async function sendNewMessageNotification(
  receiverId: number,
  senderName: string,
  messagePreview: string
): Promise<{ sent: number; failed: number }> {
  return sendPushToUser(receiverId, {
    title: `Nowa wiadomość od ${senderName}`,
    body: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
    data: {
      type: 'new_message',
    },
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}


/**
 * Send notification to all admin users
 */
export async function sendPushToAdmins(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  // Get all admin users
  const admins = await db.getAdminUsers();
  
  let totalSent = 0;
  let totalFailed = 0;

  for (const admin of admins) {
    const result = await sendPushToUser(admin.id, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  console.log(`[Push] Admin notification sent: ${totalSent} successful, ${totalFailed} failed`);
  return { sent: totalSent, failed: totalFailed };
}

/**
 * Notify admins about new club registration
 */
export async function notifyAdminsNewRegistration(
  clubName: string,
  managerEmail: string,
  managerName: string
): Promise<void> {
  await sendPushToAdmins({
    title: '🆕 Nowa rejestracja klubu',
    body: `Klub "${clubName}" został zarejestrowany przez ${managerName}`,
    data: {
      type: 'new_registration',
      clubName,
      managerEmail,
      managerName,
    },
  });

  // Also create in-app notification for admins
  const admins = await db.getAdminUsers();
  for (const admin of admins) {
    await db.createNotification({
      userId: admin.id,
      clubId: 0, // System notification
      type: 'general',
      title: 'Nowa rejestracja klubu',
      message: `Klub "${clubName}" został zarejestrowany przez ${managerName} (${managerEmail})`,
    });
  }
}

/**
 * Notify admins about trial expiring soon
 */
export async function notifyAdminsTrialExpiring(
  clubId: number,
  clubName: string,
  managerEmail: string,
  daysRemaining: number
): Promise<void> {
  const urgency = daysRemaining <= 1 ? '🔴' : daysRemaining <= 3 ? '🟡' : '🟢';
  
  await sendPushToAdmins({
    title: `${urgency} Trial wygasa za ${daysRemaining} dni`,
    body: `Klub "${clubName}" - trial kończy się wkrótce`,
    data: {
      type: 'trial_expiring',
      clubId,
      clubName,
      managerEmail,
      daysRemaining,
    },
  });
}

/**
 * Notify admins about trial expired
 */
export async function notifyAdminsTrialExpired(
  clubId: number,
  clubName: string,
  managerEmail: string
): Promise<void> {
  await sendPushToAdmins({
    title: '⏰ Trial wygasł',
    body: `Klub "${clubName}" - okres próbny zakończony`,
    data: {
      type: 'trial_expired',
      clubId,
      clubName,
      managerEmail,
    },
  });

  // Also create in-app notification for admins
  const admins = await db.getAdminUsers();
  for (const admin of admins) {
    await db.createNotification({
      userId: admin.id,
      clubId: clubId,
      type: 'general',
      title: 'Trial wygasł',
      message: `Klub "${clubName}" - okres próbny zakończony. Manager: ${managerEmail}`,
    });
  }
}

/**
 * Notify admins about new subscription
 */
export async function notifyAdminsNewSubscription(
  clubName: string,
  planName: string,
  managerEmail: string
): Promise<void> {
  await sendPushToAdmins({
    title: '⭐ Nowa subskrypcja',
    body: `Klub "${clubName}" wykupił plan ${planName}`,
    data: {
      type: 'new_subscription',
      clubName,
      planName,
      managerEmail,
    },
  });

  // Also create in-app notification for admins
  const admins = await db.getAdminUsers();
  for (const admin of admins) {
    await db.createNotification({
      userId: admin.id,
      clubId: 0, // System notification
      type: 'general',
      title: 'Nowa subskrypcja',
      message: `Klub "${clubName}" wykupił plan ${planName}. Manager: ${managerEmail}`,
    });
  }
}
