import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  InsertClub, clubs,
  InsertClubMember, clubMembers,
  InsertClubInvitation, clubInvitations,
  InsertTeam, teams,
  InsertPlayer, players,
  InsertPlayerStat, playerStats,
  InsertMatch, matches,
  InsertMatchStat, matchStats,
  InsertMatchCallup, matchCallups,
  InsertTraining, trainings,
  InsertTrainingAttendance, trainingAttendance,
  InsertFinance, finances,
  InsertFinanceCategory, financeCategories,
  InsertAcademyStudent, academyStudents,
  InsertAcademyPayment, academyPayments,
  InsertInjury, injuries,
  InsertPhoto, photos,
  InsertNotification, notifications,
  InsertSubscriptionPlan, subscriptionPlans,
  InsertScheduledNotification, scheduledNotifications,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
    values.isMasterAdmin = true;
    updateSet.isMasterAdmin = true;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ============================================
// CLUB FUNCTIONS
// ============================================
export async function createClub(data: InsertClub) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clubs).values(data);
  return result[0].insertId;
}

export async function getClubById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
  return result[0];
}

export async function getClubsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clubs).where(eq(clubs.userId, userId));
}

export async function getAllClubs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clubs).orderBy(desc(clubs.createdAt));
}

export async function updateClub(id: number, data: Partial<InsertClub>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clubs).set(data).where(eq(clubs.id, id));
}

export async function deleteClub(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clubs).where(eq(clubs.id, id));
}

// ============================================
// CLUB MEMBERS FUNCTIONS
// ============================================
export async function addClubMember(data: InsertClubMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clubMembers).values(data);
  return result[0].insertId;
}

export async function getClubMembers(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clubMembers).where(eq(clubMembers.clubId, clubId));
}

export async function getClubMember(clubId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId))).limit(1);
  return result[0];
}

export async function updateClubMember(id: number, data: Partial<InsertClubMember>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clubMembers).set(data).where(eq(clubMembers.id, id));
}

export async function removeClubMember(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clubMembers).where(eq(clubMembers.id, id));
}

// ============================================
// TEAM FUNCTIONS
// ============================================
export async function createTeam(data: InsertTeam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teams).values(data);
  return result[0].insertId;
}

export async function getTeamsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).where(eq(teams.clubId, clubId));
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result[0];
}

export async function updateTeam(id: number, data: Partial<InsertTeam>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teams).set(data).where(eq(teams.id, id));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teams).where(eq(teams.id, id));
}

// ============================================
// PLAYER FUNCTIONS
// ============================================
export async function createPlayer(data: InsertPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(players).values(data);
  return result[0].insertId;
}

export async function getPlayersByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).where(eq(players.clubId, clubId));
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result[0];
}

export async function updatePlayer(id: number, data: Partial<InsertPlayer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set(data).where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(players).where(eq(players.id, id));
}

// ============================================
// PLAYER STATS FUNCTIONS
// ============================================
export async function getPlayerStats(playerId: number, season?: string) {
  const db = await getDb();
  if (!db) return [];
  if (season) {
    return db.select().from(playerStats)
      .where(and(eq(playerStats.playerId, playerId), eq(playerStats.season, season)));
  }
  return db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
}

export async function upsertPlayerStats(data: InsertPlayerStat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(playerStats)
    .where(and(eq(playerStats.playerId, data.playerId), eq(playerStats.season, data.season))).limit(1);
  
  if (existing[0]) {
    await db.update(playerStats).set(data).where(eq(playerStats.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(playerStats).values(data);
  return result[0].insertId;
}

// ============================================
// MATCH FUNCTIONS
// ============================================
export async function createMatch(data: InsertMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matches).values(data);
  return result[0].insertId;
}

export async function getMatchesByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.clubId, clubId)).orderBy(desc(matches.matchDate));
}

export async function getMatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result[0];
}

export async function updateMatch(id: number, data: Partial<InsertMatch>) {
  const db = await getDb();
  if (!db) return;
  await db.update(matches).set(data).where(eq(matches.id, id));
}

export async function deleteMatch(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(matches).where(eq(matches.id, id));
}

// ============================================
// MATCH STATS FUNCTIONS
// ============================================
export async function addMatchStats(data: InsertMatchStat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchStats).values(data);
  return result[0].insertId;
}

export async function getMatchStats(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchStats).where(eq(matchStats.matchId, matchId));
}

export async function updateMatchStats(id: number, data: Partial<InsertMatchStat>) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchStats).set(data).where(eq(matchStats.id, id));
}

export async function deleteMatchStats(matchId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(matchStats).where(eq(matchStats.matchId, matchId));
}

// ============================================
// MATCH CALLUPS FUNCTIONS
// ============================================
export async function addMatchCallup(data: InsertMatchCallup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchCallups).values(data);
  return result[0].insertId;
}

export async function getMatchCallups(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchCallups).where(eq(matchCallups.matchId, matchId));
}

export async function updateCallupStatus(id: number, status: "pending" | "confirmed" | "declined") {
  const db = await getDb();
  if (!db) return;
  await db.update(matchCallups).set({ status, respondedAt: new Date() }).where(eq(matchCallups.id, id));
}

// ============================================
// TRAINING FUNCTIONS
// ============================================
export async function createTraining(data: InsertTraining) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainings).values(data);
  return result[0].insertId;
}

export async function getTrainingsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trainings).where(eq(trainings.clubId, clubId)).orderBy(desc(trainings.trainingDate));
}

export async function getTrainingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trainings).where(eq(trainings.id, id)).limit(1);
  return result[0];
}

export async function updateTraining(id: number, data: Partial<InsertTraining>) {
  const db = await getDb();
  if (!db) return;
  await db.update(trainings).set(data).where(eq(trainings.id, id));
}

export async function deleteTraining(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(trainings).where(eq(trainings.id, id));
}

// ============================================
// TRAINING ATTENDANCE FUNCTIONS
// ============================================
export async function setTrainingAttendance(data: InsertTrainingAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(trainingAttendance)
    .where(and(eq(trainingAttendance.trainingId, data.trainingId), eq(trainingAttendance.playerId, data.playerId))).limit(1);
  
  if (existing[0]) {
    await db.update(trainingAttendance).set({ attended: data.attended }).where(eq(trainingAttendance.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(trainingAttendance).values(data);
  return result[0].insertId;
}

export async function getTrainingAttendance(trainingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trainingAttendance).where(eq(trainingAttendance.trainingId, trainingId));
}

export async function getPlayerAttendanceStats(playerId: number) {
  const db = await getDb();
  if (!db) return { total: 0, attended: 0 };
  const result = await db.select().from(trainingAttendance).where(eq(trainingAttendance.playerId, playerId));
  const total = result.length;
  const attended = result.filter(r => r.attended === 1).length;
  return { total, attended };
}

// ============================================
// FINANCE FUNCTIONS
// ============================================
export async function createFinance(data: InsertFinance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(finances).values(data);
  return result[0].insertId;
}

export async function getFinancesByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(finances).where(eq(finances.clubId, clubId)).orderBy(desc(finances.transactionDate));
}

export async function getFinanceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(finances).where(eq(finances.id, id)).limit(1);
  return result[0];
}

export async function updateFinance(id: number, data: Partial<InsertFinance>) {
  const db = await getDb();
  if (!db) return;
  await db.update(finances).set(data).where(eq(finances.id, id));
}

export async function deleteFinance(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(finances).where(eq(finances.id, id));
}

export async function getFinanceSummary(clubId: number) {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpense: 0, balance: 0 };
  
  const allFinances = await db.select().from(finances).where(eq(finances.clubId, clubId));
  const totalIncome = allFinances.filter(f => f.type === "income").reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = allFinances.filter(f => f.type === "expense").reduce((sum, f) => sum + f.amount, 0);
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

// ============================================
// FINANCE CATEGORIES FUNCTIONS
// ============================================
export async function createFinanceCategory(data: InsertFinanceCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(financeCategories).values(data);
  return result[0].insertId;
}

export async function getFinanceCategoriesByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financeCategories).where(eq(financeCategories.clubId, clubId));
}

export async function deleteFinanceCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(financeCategories).where(eq(financeCategories.id, id));
}

export async function initDefaultFinanceCategories(clubId: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(financeCategories).where(eq(financeCategories.clubId, clubId)).limit(1);
  if (existing.length > 0) return;
  
  const defaults = [
    { clubId, name: "Składki", type: "income" as const, isDefault: true },
    { clubId, name: "Sponsorzy", type: "income" as const, isDefault: true },
    { clubId, name: "Dotacje", type: "income" as const, isDefault: true },
    { clubId, name: "Sprzęt", type: "expense" as const, isDefault: true },
    { clubId, name: "Transport", type: "expense" as const, isDefault: true },
    { clubId, name: "Wynajem boiska", type: "expense" as const, isDefault: true },
    { clubId, name: "Inne", type: "expense" as const, isDefault: true },
  ];
  
  for (const cat of defaults) {
    await db.insert(financeCategories).values(cat);
  }
}

// ============================================
// ACADEMY FUNCTIONS
// ============================================
export async function createAcademyStudent(data: InsertAcademyStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(academyStudents).values(data);
  return result[0].insertId;
}

export async function getAcademyStudentsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(academyStudents).where(eq(academyStudents.clubId, clubId));
}

export async function getAcademyStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(academyStudents).where(eq(academyStudents.id, id)).limit(1);
  return result[0];
}

export async function updateAcademyStudent(id: number, data: Partial<InsertAcademyStudent>) {
  const db = await getDb();
  if (!db) return;
  await db.update(academyStudents).set(data).where(eq(academyStudents.id, id));
}

export async function deleteAcademyStudent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(academyStudents).where(eq(academyStudents.id, id));
}

// ============================================
// ACADEMY PAYMENTS FUNCTIONS
// ============================================
export async function createAcademyPayment(data: InsertAcademyPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(academyPayments).values(data);
  return result[0].insertId;
}

export async function getAcademyPayments(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(academyPayments).where(eq(academyPayments.studentId, studentId)).orderBy(desc(academyPayments.paymentDate));
}

export async function getAcademyDashboard(clubId: number) {
  const db = await getDb();
  if (!db) return { totalStudents: 0, paidThisMonth: 0, unpaidThisMonth: 0 };
  
  const allStudents = await db.select().from(academyStudents).where(eq(academyStudents.clubId, clubId));
  const totalStudents = allStudents.length;
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let paidThisMonth = 0;
  for (const student of allStudents) {
    const payments = await db.select().from(academyPayments)
      .where(eq(academyPayments.studentId, student.id));
    const hasPaidThisMonth = payments.some(p => p.paymentMonth === currentMonth);
    if (hasPaidThisMonth) paidThisMonth++;
  }
  
  return { totalStudents, paidThisMonth, unpaidThisMonth: totalStudents - paidThisMonth };
}

// ============================================
// INJURY FUNCTIONS
// ============================================
export async function createInjury(data: InsertInjury) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(injuries).values(data);
  return result[0].insertId;
}

export async function getInjuriesByPlayerId(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(injuries).where(eq(injuries.playerId, playerId)).orderBy(desc(injuries.injuryDate));
}

export async function getActiveInjuries(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  const clubPlayers = await db.select().from(players).where(eq(players.clubId, clubId));
  const playerIds = clubPlayers.map(p => p.id);
  if (playerIds.length === 0) return [];
  
  const allInjuries = await db.select().from(injuries);
  return allInjuries.filter(i => playerIds.includes(i.playerId) && i.status !== "recovered");
}

export async function updateInjury(id: number, data: Partial<InsertInjury>) {
  const db = await getDb();
  if (!db) return;
  await db.update(injuries).set(data).where(eq(injuries.id, id));
}

// ============================================
// PHOTO FUNCTIONS
// ============================================
export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(data);
  return result[0].insertId;
}

export async function getPhotosByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.clubId, clubId)).orderBy(desc(photos.uploadDate));
}

export async function deletePhoto(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(photos).where(eq(photos.id, id));
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getNotificationsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.clubId, clubId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(clubId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications)
    .where(and(eq(notifications.clubId, clubId), eq(notifications.isRead, false)));
  return result.length;
}

// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================
export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

export async function getSubscriptionPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result[0];
}

export async function createSubscriptionPlan(data: InsertSubscriptionPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptionPlans).values(data);
  return result[0].insertId;
}

export async function updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
}

// ============================================
// CALENDAR/EVENTS FUNCTIONS
// ============================================
export async function getCalendarEvents(clubId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { matches: [], trainings: [] };
  
  const clubMatches = await db.select().from(matches)
    .where(eq(matches.clubId, clubId));
  const filteredMatches = clubMatches.filter(m => {
    const d = new Date(m.matchDate);
    return d >= startDate && d <= endDate;
  });
  
  const clubTrainings = await db.select().from(trainings)
    .where(eq(trainings.clubId, clubId));
  const filteredTrainings = clubTrainings.filter(t => {
    const d = new Date(t.trainingDate);
    return d >= startDate && d <= endDate;
  });
  
  return { matches: filteredMatches, trainings: filteredTrainings };
}

// ============================================
// INVITATION FUNCTIONS
// ============================================
export async function createInvitation(data: InsertClubInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clubInvitations).values(data);
  return result[0].insertId;
}

export async function getInvitationsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clubInvitations).where(eq(clubInvitations.clubId, clubId)).orderBy(desc(clubInvitations.createdAt));
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clubInvitations).where(eq(clubInvitations.token, token)).limit(1);
  return result[0];
}

export async function getInvitationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clubInvitations).where(eq(clubInvitations.id, id)).limit(1);
  return result[0];
}

export async function updateInvitation(id: number, data: Partial<InsertClubInvitation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clubInvitations).set(data).where(eq(clubInvitations.id, id));
}

export async function getPendingInvitationByEmail(clubId: number, email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clubInvitations)
    .where(and(
      eq(clubInvitations.clubId, clubId),
      eq(clubInvitations.email, email),
      eq(clubInvitations.status, "pending")
    ))
    .limit(1);
  return result[0];
}

export async function getClubMembersWithUsers(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db.select().from(clubMembers).where(eq(clubMembers.clubId, clubId));
  const result = [];
  for (const member of members) {
    const user = await getUserById(member.userId);
    result.push({ ...member, user });
  }
  return result;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}


// ============================================
// MATCH CALLUPS FUNCTIONS
// ============================================
export async function createMatchCallup(data: InsertMatchCallup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchCallups).values(data);
  return result[0].insertId;
}

export async function getCallupsByMatchId(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchCallups).where(eq(matchCallups.matchId, matchId));
}

export async function getCallupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matchCallups).where(eq(matchCallups.id, id)).limit(1);
  return result[0];
}

export async function updateCallup(id: number, data: Partial<InsertMatchCallup>) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchCallups).set(data).where(eq(matchCallups.id, id));
}

export async function deleteCallup(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(matchCallups).where(eq(matchCallups.id, id));
}

export async function deleteCallupsByMatchId(matchId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(matchCallups).where(eq(matchCallups.matchId, matchId));
}

export async function getCallupsWithPlayerInfo(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  const callups = await db.select().from(matchCallups).where(eq(matchCallups.matchId, matchId));
  const result = [];
  for (const callup of callups) {
    const player = await getPlayerById(callup.playerId);
    result.push({ ...callup, player });
  }
  return result;
}

export async function getPlayerCallups(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchCallups).where(eq(matchCallups.playerId, playerId)).orderBy(desc(matchCallups.createdAt));
}

export async function respondToCallup(id: number, status: "confirmed" | "declined", responseNote?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchCallups).set({
    status,
    respondedAt: new Date(),
    responseNote: responseNote || null,
  }).where(eq(matchCallups.id, id));
}

// ============================================
// SCHEDULED NOTIFICATIONS FUNCTIONS
// ============================================
export async function createScheduledNotification(data: InsertScheduledNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduledNotifications).values(data);
  return result[0].insertId;
}

export async function getScheduledNotificationsByClubId(clubId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledNotifications).where(eq(scheduledNotifications.clubId, clubId)).orderBy(desc(scheduledNotifications.scheduledFor));
}

export async function getPendingScheduledNotifications() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(scheduledNotifications)
    .where(and(
      eq(scheduledNotifications.status, "pending"),
      lte(scheduledNotifications.scheduledFor, now)
    ));
}

export async function updateScheduledNotification(id: number, data: Partial<InsertScheduledNotification>) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledNotifications).set(data).where(eq(scheduledNotifications.id, id));
}

export async function markScheduledNotificationSent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledNotifications).set({
    status: "sent",
    sentAt: new Date(),
  }).where(eq(scheduledNotifications.id, id));
}

export async function markScheduledNotificationFailed(id: number, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledNotifications).set({
    status: "failed",
    errorMessage,
  }).where(eq(scheduledNotifications.id, id));
}

export async function cancelScheduledNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledNotifications).set({ status: "cancelled" }).where(eq(scheduledNotifications.id, id));
}

export async function getScheduledNotificationsForMatch(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledNotifications)
    .where(and(
      eq(scheduledNotifications.referenceId, matchId),
      eq(scheduledNotifications.referenceType, "match")
    ));
}

export async function cancelScheduledNotificationsForMatch(matchId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledNotifications)
    .set({ status: "cancelled" })
    .where(and(
      eq(scheduledNotifications.referenceId, matchId),
      eq(scheduledNotifications.referenceType, "match"),
      eq(scheduledNotifications.status, "pending")
    ));
}
