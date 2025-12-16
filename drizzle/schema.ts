import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with role field for admin/trener/zawodnik access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "trener", "zawodnik", "user"]).default("user").notNull(),
  isMasterAdmin: boolean("isMasterAdmin").default(false).notNull(),
  isPro: boolean("isPro").default(false).notNull(),
  proGrantedBy: int("proGrantedBy"),
  proGrantedAt: timestamp("proGrantedAt"),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }),
  subscriptionPlanId: int("subscriptionPlanId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clubs table - stores club information
 */
export const clubs = mysqlTable("clubs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  city: varchar("city", { length: 255 }),
  foundedYear: int("foundedYear"),
  description: text("description"),
  logoUrl: text("logoUrl"),
  reminderEmailSubject: varchar("reminderEmailSubject", { length: 255 }).default("Przypomnienie o opłacie składki"),
  reminderEmailBody: text("reminderEmailBody"),
  reminderEmailSignature: varchar("reminderEmailSignature", { length: 255 }),
  smsProvider: mysqlEnum("smsProvider", ["none", "smsapi", "twilio", "smslabs"]).default("none").notNull(),
  smsApiKey: varchar("smsApiKey", { length: 255 }),
  smsSenderName: varchar("smsSenderName", { length: 11 }),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  smsMonthlyLimit: int("smsMonthlyLimit").default(500),
  reminderHoursBefore: int("reminderHoursBefore").default(24),
  reminderEnabled: boolean("reminderEnabled").default(true).notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Club = typeof clubs.$inferSelect;
export type InsertClub = typeof clubs.$inferInsert;

/**
 * Club members - manages club membership and roles
 */
export const clubMembers = mysqlTable("clubMembers", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["manager", "board_member", "board_member_finance", "coach", "player"]).default("player").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClubMember = typeof clubMembers.$inferSelect;
export type InsertClubMember = typeof clubMembers.$inferInsert;

/**
 * Teams table - stores team/squad information within a club
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Players table - stores player information
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  teamId: int("teamId"),
  name: varchar("name", { length: 255 }).notNull(),
  position: mysqlEnum("position", ["bramkarz", "obrońca", "pomocnik", "napastnik"]).notNull(),
  jerseyNumber: int("jerseyNumber"),
  dateOfBirth: date("dateOfBirth"),
  photoUrl: text("photoUrl"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  isAcademy: boolean("isAcademy").default(false).notNull(),
  parentName: varchar("parentName", { length: 255 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Player stats table - aggregated statistics per season
 */
export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  season: varchar("season", { length: 20 }).notNull(),
  matchesPlayed: int("matchesPlayed").default(0).notNull(),
  minutesPlayed: int("minutesPlayed").default(0).notNull(),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  yellowCards: int("yellowCards").default(0).notNull(),
  redCards: int("redCards").default(0).notNull(),
  saves: int("saves").default(0).notNull(),
  goalsConceded: int("goalsConceded").default(0).notNull(),
  cleanSheets: int("cleanSheets").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStat = typeof playerStats.$inferSelect;
export type InsertPlayerStat = typeof playerStats.$inferInsert;

/**
 * Matches table - stores match information
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  teamId: int("teamId"),
  season: varchar("season", { length: 20 }).default("2024/2025").notNull(),
  opponent: varchar("opponent", { length: 255 }).notNull(),
  matchDate: date("matchDate").notNull(),
  matchTime: varchar("matchTime", { length: 10 }),
  location: varchar("location", { length: 255 }),
  homeAway: mysqlEnum("homeAway", ["home", "away"]).notNull(),
  goalsScored: int("goalsScored").default(0).notNull(),
  goalsConceded: int("goalsConceded").default(0).notNull(),
  result: mysqlEnum("result", ["win", "draw", "loss"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Match stats table - individual player statistics per match
 */
export const matchStats = mysqlTable("matchStats", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  playerId: int("playerId").notNull(),
  teamId: int("teamId"),
  minutesPlayed: int("minutesPlayed").default(0).notNull(),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  yellowCards: int("yellowCards").default(0).notNull(),
  redCards: int("redCards").default(0).notNull(),
  saves: int("saves").default(0).notNull(),
  goalsConceded: int("goalsConceded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchStat = typeof matchStats.$inferSelect;
export type InsertMatchStat = typeof matchStats.$inferInsert;

/**
 * Match call-ups table - player selections for matches
 */
export const matchCallups = mysqlTable("matchCallups", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  playerId: int("playerId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "declined"]).default("pending").notNull(),
  notifiedAt: timestamp("notifiedAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchCallup = typeof matchCallups.$inferSelect;
export type InsertMatchCallup = typeof matchCallups.$inferInsert;

/**
 * Trainings table - stores training session information
 */
export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  teamId: int("teamId"),
  trainingDate: date("trainingDate").notNull(),
  trainingTime: varchar("trainingTime", { length: 10 }),
  location: varchar("location", { length: 255 }),
  duration: int("duration"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

/**
 * Training attendance table - tracks player attendance
 */
export const trainingAttendance = mysqlTable("trainingAttendance", {
  id: int("id").autoincrement().primaryKey(),
  trainingId: int("trainingId").notNull(),
  playerId: int("playerId").notNull(),
  attended: int("attended").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingAttendance = typeof trainingAttendance.$inferSelect;
export type InsertTrainingAttendance = typeof trainingAttendance.$inferInsert;

/**
 * Finances table - tracks income and expenses
 */
export const finances = mysqlTable("finances", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: int("amount").notNull(),
  transactionDate: date("transactionDate").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Finance = typeof finances.$inferSelect;
export type InsertFinance = typeof finances.$inferInsert;

/**
 * Finance categories table - custom categories for finances
 */
export const financeCategories = mysqlTable("financeCategories", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanceCategory = typeof financeCategories.$inferSelect;
export type InsertFinanceCategory = typeof financeCategories.$inferInsert;

/**
 * Academy students table - manages szkółka students
 */
export const academyStudents = mysqlTable("academyStudents", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("dateOfBirth"),
  parentName: varchar("parentName", { length: 255 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  groupName: varchar("groupName", { length: 100 }),
  monthlyFee: int("monthlyFee").default(0),
  lastReminderSent: timestamp("lastReminderSent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademyStudent = typeof academyStudents.$inferSelect;
export type InsertAcademyStudent = typeof academyStudents.$inferInsert;

/**
 * Academy payments table - tracks tuition payments
 */
export const academyPayments = mysqlTable("academyPayments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  amount: int("amount").notNull(),
  paymentDate: date("paymentDate").notNull(),
  paymentMonth: varchar("paymentMonth", { length: 20 }),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AcademyPayment = typeof academyPayments.$inferSelect;
export type InsertAcademyPayment = typeof academyPayments.$inferInsert;

/**
 * Injuries table - tracks player injuries
 */
export const injuries = mysqlTable("injuries", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  injuryType: varchar("injuryType", { length: 255 }).notNull(),
  injuryDate: date("injuryDate").notNull(),
  expectedRecoveryDate: date("expectedRecoveryDate"),
  actualRecoveryDate: date("actualRecoveryDate"),
  status: mysqlEnum("status", ["active", "recovering", "recovered"]).default("active").notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "severe"]).default("moderate").notNull(),
  notes: text("notes"),
  treatment: text("treatment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Injury = typeof injuries.$inferSelect;
export type InsertInjury = typeof injuries.$inferInsert;

/**
 * Photos table - stores club photo gallery
 */
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  albumId: int("albumId"),
  url: text("url").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  uploadDate: timestamp("uploadDate").defaultNow().notNull(),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * Notifications table - stores user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  userId: int("userId"),
  type: mysqlEnum("type", ["match", "training", "payment", "callup", "general"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  sentVia: mysqlEnum("sentVia", ["app", "email", "sms"]).default("app").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Subscription plans - defines available subscription tiers
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearlyPrice", { precision: 10, scale: 2 }),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 255 }),
  features: text("features"),
  maxPlayers: int("maxPlayers").default(50),
  maxTeams: int("maxTeams").default(3),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// Relations
export const clubsRelations = relations(clubs, ({ one, many }) => ({
  owner: one(users, { fields: [clubs.userId], references: [users.id] }),
  players: many(players),
  matches: many(matches),
  trainings: many(trainings),
  finances: many(finances),
  academyStudents: many(academyStudents),
  teams: many(teams),
  members: many(clubMembers),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, { fields: [players.clubId], references: [clubs.id] }),
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  stats: many(playerStats),
  matchStats: many(matchStats),
  trainingAttendance: many(trainingAttendance),
  injuries: many(injuries),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  club: one(clubs, { fields: [matches.clubId], references: [clubs.id] }),
  team: one(teams, { fields: [matches.teamId], references: [teams.id] }),
  stats: many(matchStats),
  callups: many(matchCallups),
}));

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  club: one(clubs, { fields: [trainings.clubId], references: [clubs.id] }),
  team: one(teams, { fields: [trainings.teamId], references: [teams.id] }),
  attendance: many(trainingAttendance),
}));

export const academyStudentsRelations = relations(academyStudents, ({ one, many }) => ({
  club: one(clubs, { fields: [academyStudents.clubId], references: [clubs.id] }),
  payments: many(academyPayments),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, { fields: [teams.clubId], references: [clubs.id] }),
  players: many(players),
  matches: many(matches),
  trainings: many(trainings),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, { fields: [clubMembers.clubId], references: [clubs.id] }),
  user: one(users, { fields: [clubMembers.userId], references: [users.id] }),
}));

export const injuriesRelations = relations(injuries, ({ one }) => ({
  player: one(players, { fields: [injuries.playerId], references: [players.id] }),
}));
