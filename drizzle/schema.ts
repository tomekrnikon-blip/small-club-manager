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
  twilioAccountSid: varchar("twilioAccountSid", { length: 255 }),
  twilioAuthToken: varchar("twilioAuthToken", { length: 255 }),
  twilioPhoneNumber: varchar("twilioPhoneNumber", { length: 20 }),
  smsapiToken: varchar("smsapiToken", { length: 255 }),
  smsSenderName: varchar("smsSenderName", { length: 11 }),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  smsMonthlyLimit: int("smsMonthlyLimit").default(500),
  reminderHoursBefore: int("reminderHoursBefore").default(24),
  reminderEnabled: boolean("reminderEnabled").default(true).notNull(),
  // Email/SMTP configuration
  emailProvider: mysqlEnum("emailProvider", ["none", "smtp", "sendgrid", "mailgun"]).default("none").notNull(),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort").default(587),
  smtpSecure: boolean("smtpSecure").default(false),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 255 }),
  emailFromName: varchar("emailFromName", { length: 255 }),
  emailFromAddress: varchar("emailFromAddress", { length: 320 }),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
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
  notified48h: boolean("notified48h").default(false).notNull(),
  notified24h: boolean("notified24h").default(false).notNull(),
  notifiedAt: timestamp("notifiedAt"),
  respondedAt: timestamp("respondedAt"),
  responseNote: text("responseNote"),
  notificationChannel: mysqlEnum("notificationChannel", ["app", "email", "sms", "both"]).default("app").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
 * Scheduled notifications - for automated notification sending
 */
export const scheduledNotifications = mysqlTable("scheduledNotifications", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  type: mysqlEnum("type", ["callup_48h", "callup_24h", "payment_reminder", "training_reminder", "custom"]).notNull(),
  referenceId: int("referenceId"), // matchId, trainingId, etc.
  referenceType: mysqlEnum("referenceType", ["match", "training", "payment", "academy"]),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  channel: mysqlEnum("channel", ["app", "email", "sms", "both"]).default("app").notNull(),
  recipientIds: text("recipientIds"), // JSON array of user/player IDs
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = typeof scheduledNotifications.$inferInsert;

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

/**
 * Club invitations table - manages pending invitations to join clubs
 */
export const clubInvitations = mysqlTable("clubInvitations", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["manager", "board_member", "board_member_finance", "coach", "player"]).default("player").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedBy: int("acceptedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClubInvitation = typeof clubInvitations.$inferSelect;
export type InsertClubInvitation = typeof clubInvitations.$inferInsert;

export const clubInvitationsRelations = relations(clubInvitations, ({ one }) => ({
  club: one(clubs, { fields: [clubInvitations.clubId], references: [clubs.id] }),
  inviter: one(users, { fields: [clubInvitations.invitedBy], references: [users.id] }),
}));


/**
 * App settings - global application settings managed by Master Admin
 */
export const appSettings = mysqlTable("appSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: varchar("description", { length: 255 }),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

/**
 * User subscriptions - tracks user subscription history
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing", "expired", "manual"]).default("active").notNull(),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "yearly"]).default("monthly").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  grantedBy: int("grantedBy"), // For manual grants by Master Admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [userSubscriptions.planId], references: [subscriptionPlans.id] }),
  granter: one(users, { fields: [userSubscriptions.grantedBy], references: [users.id] }),
}));


/**
 * Audit logs - tracks sensitive operations for security monitoring
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  action: varchar("action", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["auth", "club", "member", "finance", "config", "admin", "subscription"]).default("admin").notNull(),
  targetType: varchar("targetType", { length: 50 }), // e.g., "club", "user", "player"
  targetId: int("targetId"),
  details: text("details"), // JSON with additional context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failure", "warning"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

/**
 * Rate limits - tracks API usage for rate limiting
 */
export const rateLimits = mysqlTable("rateLimits", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // userId, IP, or clubId
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  count: int("count").default(0).notNull(),
  windowStart: timestamp("windowStart").defaultNow().notNull(),
  windowEnd: timestamp("windowEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = typeof rateLimits.$inferInsert;

/**
 * Two-factor authentication - stores 2FA secrets for users
 */
export const twoFactorAuth = mysqlTable("twoFactorAuth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(), // Encrypted TOTP secret
  isEnabled: boolean("isEnabled").default(false).notNull(),
  backupCodes: text("backupCodes"), // Encrypted JSON array of backup codes
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

export const twoFactorAuthRelations = relations(twoFactorAuth, ({ one }) => ({
  user: one(users, { fields: [twoFactorAuth.userId], references: [users.id] }),
}));


/**
 * Player ratings table - coach ratings for players after trainings/matches
 */
export const playerRatings = mysqlTable("playerRatings", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  playerId: int("playerId").notNull(),
  coachId: int("coachId").notNull(),
  eventType: mysqlEnum("eventType", ["training", "match"]).notNull(),
  eventId: int("eventId").notNull(),
  eventDate: date("eventDate").notNull(),
  technique: int("technique").notNull(), // 1-5
  engagement: int("engagement").notNull(), // 1-5
  progress: int("progress").notNull(), // 1-5
  teamwork: int("teamwork").notNull(), // 1-5
  overall: decimal("overall", { precision: 3, scale: 2 }).notNull(), // calculated average
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerRating = typeof playerRatings.$inferSelect;
export type InsertPlayerRating = typeof playerRatings.$inferInsert;

export const playerRatingsRelations = relations(playerRatings, ({ one }) => ({
  player: one(players, { fields: [playerRatings.playerId], references: [players.id] }),
  coach: one(users, { fields: [playerRatings.coachId], references: [users.id] }),
}));

/**
 * Parent-child relationships for parent panel
 */
export const parentChildren = mysqlTable("parentChildren", {
  id: int("id").autoincrement().primaryKey(),
  parentUserId: int("parentUserId").notNull(),
  playerId: int("playerId").notNull(),
  relationship: mysqlEnum("relationship", ["parent", "guardian", "other"]).default("parent").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentChild = typeof parentChildren.$inferSelect;
export type InsertParentChild = typeof parentChildren.$inferInsert;

export const parentChildrenRelations = relations(parentChildren, ({ one }) => ({
  parent: one(users, { fields: [parentChildren.parentUserId], references: [users.id] }),
  player: one(players, { fields: [parentChildren.playerId], references: [players.id] }),
}));


/**
 * Messages table - direct messages between coaches and parents
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  threadId: varchar("threadId", { length: 64 }).notNull(), // Format: "coach_{coachId}_parent_{parentId}_player_{playerId}"
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  playerId: int("playerId"), // The player this conversation is about
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id] }),
  player: one(players, { fields: [messages.playerId], references: [players.id] }),
}));

/**
 * Push notification subscriptions for parents
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  deviceType: varchar("deviceType", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));
