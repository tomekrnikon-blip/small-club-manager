import * as db from "../db";

export interface ClubBackup {
  version: string;
  createdAt: string;
  clubId: number;
  clubName: string;
  data: {
    club: any;
    teams: any[];
    players: any[];
    matches: any[];
    trainings: any[];
    finances: any[];
    academyStudents: any[];
    photos: any[];
    notifications: any[];
  };
}

/**
 * Create a full backup of club data
 */
export async function createClubBackup(clubId: number): Promise<ClubBackup> {
  // Get club info
  const club = await db.getClubById(clubId);
  if (!club) {
    throw new Error("Club not found");
  }

  // Get all related data
  const teams = await db.getTeamsByClubId(clubId);
  const players = await db.getPlayersByClubId(clubId);
  const matches = await db.getMatchesByClubId(clubId);
  const trainings = await db.getTrainingsByClubId(clubId);
  const finances = await db.getFinancesByClubId(clubId);
  const academyStudents = await db.getAcademyStudentsByClubId(clubId);
  const photos = await db.getPhotosByClubId(clubId);
  const notifications = await db.getNotificationsByClubId(clubId);

  const backup: ClubBackup = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    clubId,
    clubName: club.name,
    data: {
      club: {
        name: club.name,
        location: club.location,
        city: club.city,
        foundedYear: club.foundedYear,
        description: club.description,
        logoUrl: club.logoUrl,
      },
      teams: teams.map((t) => ({
        name: t.name,
        ageGroup: t.ageGroup,
        description: t.description,
      })),
      players: players.map((p) => ({
        name: p.name,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        dateOfBirth: p.dateOfBirth,
        phone: p.phone,
        email: p.email,
        photoUrl: p.photoUrl,
        isAcademy: p.isAcademy,
        parentName: p.parentName,
        parentPhone: p.parentPhone,
        parentEmail: p.parentEmail,
      })),
      matches: matches.map((m) => ({
        opponent: m.opponent,
        matchDate: m.matchDate,
        matchTime: m.matchTime,
        location: m.location,
        homeAway: m.homeAway,
        goalsScored: m.goalsScored,
        goalsConceded: m.goalsConceded,
        result: m.result,
        season: m.season,
        notes: m.notes,
      })),
      trainings: trainings.map((t) => ({
        trainingDate: t.trainingDate,
        trainingTime: t.trainingTime,
        duration: t.duration,
        location: t.location,
        notes: t.notes,
      })),
      finances: finances.map((f) => ({
        type: f.type,
        category: f.category,
        amount: f.amount,
        description: f.description,
        transactionDate: f.transactionDate,
      })),
      academyStudents: academyStudents.map((s) => ({
        name: s.name,
        dateOfBirth: s.dateOfBirth,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail,
        groupName: s.groupName,
        monthlyFee: s.monthlyFee,
      })),
      photos: photos.map((p) => ({
        title: p.title,
        description: p.description,
        url: p.url,
        tags: p.tags,
      })),
      notifications: notifications.map((n) => ({
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
      })),
    },
  };

  return backup;
}

/**
 * Validate backup data structure
 */
export function validateBackup(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.version) {
    errors.push("Missing version field");
  }

  if (!data.createdAt) {
    errors.push("Missing createdAt field");
  }

  if (!data.clubName) {
    errors.push("Missing clubName field");
  }

  if (!data.data) {
    errors.push("Missing data field");
  } else {
    if (!data.data.club) {
      errors.push("Missing club data");
    }
    if (!Array.isArray(data.data.teams)) {
      errors.push("Invalid or missing teams array");
    }
    if (!Array.isArray(data.data.players)) {
      errors.push("Invalid or missing players array");
    }
    if (!Array.isArray(data.data.matches)) {
      errors.push("Invalid or missing matches array");
    }
    if (!Array.isArray(data.data.trainings)) {
      errors.push("Invalid or missing trainings array");
    }
    if (!Array.isArray(data.data.finances)) {
      errors.push("Invalid or missing finances array");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Restore club data from backup
 * Note: This creates a NEW club with the backup data, doesn't overwrite existing
 */
export async function restoreClubFromBackup(
  backup: ClubBackup,
  ownerId: number
): Promise<{ clubId: number; stats: RestoreStats }> {
  const stats: RestoreStats = {
    teams: 0,
    players: 0,
    matches: 0,
    trainings: 0,
    finances: 0,
    academyStudents: 0,
    photos: 0,
    notifications: 0,
  };

  // Create new club
  const newClubId = await db.createClub({
    name: `${backup.data.club.name} (Restored)`,
    userId: ownerId,
    location: backup.data.club.location,
    city: backup.data.club.city,
    foundedYear: backup.data.club.foundedYear,
    description: backup.data.club.description,
    logoUrl: backup.data.club.logoUrl,
  });

  const clubId = newClubId;

  // Restore teams
  for (const team of backup.data.teams) {
    await db.createTeam({
      clubId,
      name: team.name,
      ageGroup: team.ageGroup,
      description: team.description,
    });
    stats.teams++;
  }

  // Restore players
  for (const player of backup.data.players) {
    await db.createPlayer({
      clubId,
      name: player.name,
      position: player.position || "pomocnik",
      jerseyNumber: player.jerseyNumber,
      dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth) : null,
      phone: player.phone,
      email: player.email,
      photoUrl: player.photoUrl,
      isAcademy: player.isAcademy ?? false,
      parentName: player.parentName,
      parentPhone: player.parentPhone,
      parentEmail: player.parentEmail,
    });
    stats.players++;
  }

  // Restore matches
  for (const match of backup.data.matches) {
    await db.createMatch({
      clubId,
      opponent: match.opponent,
      matchDate: new Date(match.matchDate),
      matchTime: match.matchTime,
      location: match.location,
      homeAway: match.homeAway || "home",
      goalsScored: match.goalsScored ?? 0,
      goalsConceded: match.goalsConceded ?? 0,
      result: match.result,
      season: match.season,
      notes: match.notes,
    });
    stats.matches++;
  }

  // Restore trainings
  for (const training of backup.data.trainings) {
    await db.createTraining({
      clubId,
      trainingDate: new Date(training.trainingDate),
      trainingTime: training.trainingTime,
      duration: training.duration,
      location: training.location,
      notes: training.notes,
    });
    stats.trainings++;
  }

  // Restore finances
  for (const finance of backup.data.finances) {
    await db.createFinance({
      clubId,
      type: finance.type,
      category: finance.category,
      amount: finance.amount,
      description: finance.description,
      transactionDate: new Date(finance.transactionDate),
    });
    stats.finances++;
  }

  // Restore academy students
  for (const student of backup.data.academyStudents || []) {
    await db.createAcademyStudent({
      clubId,
      name: student.name,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      groupName: student.groupName,
      monthlyFee: student.monthlyFee,
    });
    stats.academyStudents++;
  }

  return { clubId, stats };
}

export interface RestoreStats {
  teams: number;
  players: number;
  matches: number;
  trainings: number;
  finances: number;
  academyStudents: number;
  photos: number;
  notifications: number;
}

/**
 * Get backup file size estimate (in bytes)
 */
export function estimateBackupSize(backup: ClubBackup): number {
  return JSON.stringify(backup).length;
}

/**
 * Format backup size for display
 */
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
