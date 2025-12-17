/**
 * Ranking Notification Service
 * Sends notifications when players achieve ranking milestones
 */

import * as db from "../db";

interface RankingMilestone {
  type: "top3" | "promotion" | "goals" | "assists" | "attendance";
  position?: number;
  previousPosition?: number;
  value?: number;
}

/**
 * Check for ranking milestones after stats update
 */
export async function checkRankingMilestones(
  playerId: number,
  clubId: number,
  teamId: number | null
): Promise<RankingMilestone[]> {
  const milestones: RankingMilestone[] = [];
  
  // Get player's current stats
  const playerStats = await db.getPlayerStats(playerId);
  if (!playerStats || playerStats.length === 0) return milestones;
  
  const currentStats = playerStats[0];
  
  // Get all players in the same team/club for comparison
  const allPlayers = await db.getPlayersByClubId(clubId);
  const relevantPlayers = teamId 
    ? allPlayers.filter((p: any) => p.teamId === teamId)
    : allPlayers;
  
  // Get stats for all players
  const allStats = await Promise.all(
    relevantPlayers.map(async (p: any) => {
      const stats = await db.getPlayerStats(p.id);
      return {
        playerId: p.id,
        goals: stats[0]?.goals || 0,
        assists: stats[0]?.assists || 0,
        attendance: 0, // Would need to calculate from attendance records
      };
    })
  );
  
  // Sort by goals to find ranking
  const goalRanking = [...allStats].sort((a, b) => b.goals - a.goals);
  const playerGoalRank = goalRanking.findIndex(s => s.playerId === playerId) + 1;
  
  // Check if player is in top 3 for goals
  if (playerGoalRank <= 3 && currentStats.goals > 0) {
    milestones.push({
      type: "top3",
      position: playerGoalRank,
      value: currentStats.goals,
    });
  }
  
  // Check goal milestones (5, 10, 15, 20, etc.)
  const goalMilestones = [5, 10, 15, 20, 25, 30, 50, 100];
  for (const milestone of goalMilestones) {
    if (currentStats.goals === milestone) {
      milestones.push({
        type: "goals",
        value: milestone,
      });
      break;
    }
  }
  
  // Sort by assists to find ranking
  const assistRanking = [...allStats].sort((a, b) => b.assists - a.assists);
  const playerAssistRank = assistRanking.findIndex(s => s.playerId === playerId) + 1;
  
  // Check if player is in top 3 for assists
  if (playerAssistRank <= 3 && currentStats.assists > 0) {
    milestones.push({
      type: "top3",
      position: playerAssistRank,
      value: currentStats.assists,
    });
  }
  
  // Check assist milestones
  const assistMilestones = [5, 10, 15, 20, 25, 30];
  for (const milestone of assistMilestones) {
    if (currentStats.assists === milestone) {
      milestones.push({
        type: "assists",
        value: milestone,
      });
      break;
    }
  }
  
  return milestones;
}

/**
 * Send ranking milestone notification
 */
export async function sendRankingNotification(
  userId: number,
  playerId: number,
  clubId: number,
  milestone: RankingMilestone
): Promise<void> {
  let title = "";
  let message = "";
  
  switch (milestone.type) {
    case "top3":
      title = "🏆 Awans w rankingu!";
      message = `Gratulacje! Jesteś na ${milestone.position}. miejscu w rankingu!`;
      break;
    case "goals":
      title = "⚽ Nowy kamień milowy!";
      message = `Gratulacje! Zdobyłeś ${milestone.value} bramek w sezonie!`;
      break;
    case "assists":
      title = "🎯 Nowy kamień milowy!";
      message = `Gratulacje! Masz już ${milestone.value} asyst w sezonie!`;
      break;
    case "attendance":
      title = "📅 Wzorowa frekwencja!";
      message = `Gratulacje! Twoja frekwencja wynosi ${milestone.value}%!`;
      break;
    case "promotion":
      title = "📈 Awans w rankingu!";
      message = `Awansowałeś z ${milestone.previousPosition}. na ${milestone.position}. miejsce!`;
      break;
  }
  
  // Create notification in database
  await db.createNotification({
    userId,
    clubId,
    type: "general",
    title,
    message,
    isRead: false,
  });
}

/**
 * Generate weekly ranking summary for a team
 */
export async function generateWeeklyRankingSummary(
  clubId: number,
  teamId: number | null
): Promise<{
  topScorers: { playerId: number; name: string; goals: number }[];
  topAssisters: { playerId: number; name: string; assists: number }[];
  topAttendance: { playerId: number; name: string; rate: number }[];
}> {
  const allPlayers = await db.getPlayersByClubId(clubId);
  const relevantPlayers = teamId 
    ? allPlayers.filter((p: any) => p.teamId === teamId)
    : allPlayers;
  
  // Get stats for all players
  const playersWithStats = await Promise.all(
    relevantPlayers.map(async (p: any) => {
      const stats = await db.getPlayerStats(p.id);
      const attendance = await db.getPlayerAttendanceStats(p.id);
      return {
        playerId: p.id,
        name: p.name,
        goals: stats[0]?.goals || 0,
        assists: stats[0]?.assists || 0,
        attendanceRate: attendance.total > 0 
          ? Math.round((attendance.attended / attendance.total) * 100)
          : 0,
      };
    })
  );
  
  // Sort and get top 5 for each category
  const topScorers = [...playersWithStats]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
    .map(p => ({ playerId: p.playerId, name: p.name, goals: p.goals }));
  
  const topAssisters = [...playersWithStats]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5)
    .map(p => ({ playerId: p.playerId, name: p.name, assists: p.assists }));
  
  const topAttendance = [...playersWithStats]
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5)
    .map(p => ({ playerId: p.playerId, name: p.name, rate: p.attendanceRate }));
  
  return { topScorers, topAssisters, topAttendance };
}
