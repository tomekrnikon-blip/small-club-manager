/**
 * Badge Notification Service
 * Sends push notifications when players earn new badges/achievements
 */

import * as db from "../db";
import { checkMilestones, formatAchievementNotification, PlayerStats } from "./autoAwardsService";
import { sendPushToUser } from "./pushNotificationService";

/**
 * Check player stats and send notifications for new achievements
 */
export async function checkAndNotifyBadges(
  playerId: number,
  clubId: number
): Promise<{ newBadges: string[]; notificationsSent: number }> {
  const result = {
    newBadges: [] as string[],
    notificationsSent: 0,
  };

  try {
    // Get player info
    const player = await db.getPlayerById(playerId);
    if (!player) {
      console.log(`[BadgeNotification] Player ${playerId} not found`);
      return result;
    }

    // Get player stats
    const playerStats = await db.getPlayerStatsAggregate(playerId);
    if (!playerStats) {
      console.log(`[BadgeNotification] No stats for player ${playerId}`);
      return result;
    }

    // Get existing achievements
    const existingAchievements = await db.getPlayerAchievements(playerId);
    const existingBadgeNames: string[] = [];
    
    // For each achievement, we need to look up the achievement name
    // Since the schema uses achievementId, we'll track by ID for now
    const existingAchievementIds = existingAchievements.map((a: any) => a.achievementId);

    // Check for new milestones
    const stats: PlayerStats = {
      playerId,
      goals: playerStats.goals || 0,
      assists: playerStats.assists || 0,
      attendance: playerStats.attendance || 0,
      cleanSheets: playerStats.cleanSheets || 0,
      minutesPlayed: playerStats.minutesPlayed || 0,
      averageRating: playerStats.averageRating || 0,
    };

    const newAchievements = checkMilestones(stats, existingBadgeNames);

    if (newAchievements.length === 0) {
      return result;
    }

    // Save new achievements and send notifications
    for (const achievement of newAchievements) {
      result.newBadges.push(achievement.badge);

      // Create notification message
      const message = formatAchievementNotification(player.name, achievement);

      // Send push notification to player (if they have a linked user account)
      const playerUser = await db.getUserByPlayerId(playerId);
      if (playerUser) {
        try {
          await sendPushToUser(playerUser.id, {
            title: "🏆 Nowa odznaka!",
            body: message,
            data: {
              type: "badge",
              playerId,
              badge: achievement.badge,
            },
          });
          result.notificationsSent++;
        } catch (err) {
          console.error(`[BadgeNotification] Failed to send push to user ${playerUser.id}:`, err);
        }
      }

      // Also notify club managers/coaches via in-app notification
      const clubMembers = await db.getClubMembers(clubId);
      const managers = clubMembers.filter(
        (m: any) => m.role === "manager" || m.role === "coach"
      );

      for (const manager of managers) {
        try {
          await db.createNotification({
            userId: manager.userId,
            clubId,
            type: "achievement",
            title: "Nowa odznaka zawodnika",
            message,
          });
        } catch (err) {
          console.error(`[BadgeNotification] Failed to create notification for manager ${manager.userId}:`, err);
        }
      }

      // Notify parents if player is academy student
      if (player.isAcademy && player.parentEmail) {
        try {
          await db.createNotification({
            userId: 0, // System notification
            clubId,
            type: "achievement",
            title: "Nowa odznaka Twojego dziecka",
            message: `${player.name} zdobył odznakę "${achievement.badge}"!`,
          });
        } catch (err) {
          console.error(`[BadgeNotification] Failed to create parent notification:`, err);
        }
      }
    }

    console.log(
      `[BadgeNotification] Player ${player.name} earned ${result.newBadges.length} new badges: ${result.newBadges.join(", ")}`
    );

    return result;
  } catch (error) {
    console.error("[BadgeNotification] Error checking badges:", error);
    return result;
  }
}

/**
 * Check all players in a club for new badges
 */
export async function checkClubBadges(clubId: number): Promise<{
  playersChecked: number;
  totalNewBadges: number;
  notificationsSent: number;
}> {
  const result = {
    playersChecked: 0,
    totalNewBadges: 0,
    notificationsSent: 0,
  };

  try {
    const players = await db.getPlayersByClubId(clubId);

    for (const player of players) {
      const playerResult = await checkAndNotifyBadges(player.id, clubId);
      result.playersChecked++;
      result.totalNewBadges += playerResult.newBadges.length;
      result.notificationsSent += playerResult.notificationsSent;
    }

    console.log(
      `[BadgeNotification] Club ${clubId}: checked ${result.playersChecked} players, ${result.totalNewBadges} new badges, ${result.notificationsSent} notifications sent`
    );

    return result;
  } catch (error) {
    console.error("[BadgeNotification] Error checking club badges:", error);
    return result;
  }
}

/**
 * Trigger badge check after match stats are updated
 */
export async function onMatchStatsUpdated(matchId: number): Promise<void> {
  try {
    const match = await db.getMatchById(matchId);
    if (!match) return;

    const stats = await db.getMatchStats(matchId);
    const playerIds = [...new Set(stats.map((s: any) => s.playerId))];

    for (const playerId of playerIds) {
      await checkAndNotifyBadges(playerId, match.clubId);
    }
  } catch (error) {
    console.error("[BadgeNotification] Error on match stats updated:", error);
  }
}

/**
 * Trigger badge check after training attendance is recorded
 */
export async function onTrainingAttendanceUpdated(
  trainingId: number,
  clubId: number
): Promise<void> {
  try {
    const attendance = await db.getTrainingAttendance(trainingId);
    const presentPlayerIds = attendance
      .filter((a: any) => a.attended === 1)
      .map((a: any) => a.playerId);

    for (const playerId of presentPlayerIds) {
      await checkAndNotifyBadges(playerId, clubId);
    }
  } catch (error) {
    console.error("[BadgeNotification] Error on training attendance updated:", error);
  }
}
