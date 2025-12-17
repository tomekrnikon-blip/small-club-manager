import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { encrypt, decrypt, maskSensitive } from "./utils/encryption";
import { logAuditEvent, AuditActions, createAuditContext } from "./services/auditService";
import { checkRateLimit, createRateLimitIdentifier, getRateLimitHeaders } from "./services/rateLimitService";

// Role hierarchy and permissions
type ClubRole = "manager" | "board_member" | "board_member_finance" | "coach" | "player";

const ROLE_PERMISSIONS = {
  manager: {
    canManageMembers: true,
    canRemoveManager: false, // Only board member can remove manager
    canEditClub: true,
    canViewFinances: true,
    canEditFinances: true,
    canEditPlayers: true,
    canEditMatches: true,
    canEditTrainings: true,
    canManageCallups: true,
    canInviteUsers: true,
    canAssignRoles: true,
  },
  board_member: {
    canManageMembers: true,
    canRemoveManager: true,
    canEditClub: true,
    canViewFinances: false,
    canEditFinances: false,
    canEditPlayers: true,
    canEditMatches: true,
    canEditTrainings: true,
    canManageCallups: true,
    canInviteUsers: true,
    canAssignRoles: true,
  },
  board_member_finance: {
    canManageMembers: true,
    canRemoveManager: true,
    canEditClub: true,
    canViewFinances: true,
    canEditFinances: true,
    canEditPlayers: true,
    canEditMatches: true,
    canEditTrainings: true,
    canManageCallups: true,
    canInviteUsers: true,
    canAssignRoles: true,
  },
  coach: {
    canManageMembers: false,
    canRemoveManager: false,
    canEditClub: false,
    canViewFinances: false,
    canEditFinances: false,
    canEditPlayers: true,
    canEditMatches: true,
    canEditTrainings: true,
    canManageCallups: true,
    canInviteUsers: false,
    canAssignRoles: false,
  },
  player: {
    canManageMembers: false,
    canRemoveManager: false,
    canEditClub: false,
    canViewFinances: false,
    canEditFinances: false,
    canEditPlayers: false,
    canEditMatches: false,
    canEditTrainings: false,
    canManageCallups: false,
    canInviteUsers: false,
    canAssignRoles: false,
  },
};

function getPermissions(role: ClubRole | undefined, isOwner: boolean) {
  if (isOwner) return ROLE_PERMISSIONS.manager;
  if (!role) return ROLE_PERMISSIONS.player;
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.player;
}

// Helper to check club access
async function checkClubAccess(userId: number, clubId: number) {
  const club = await db.getClubById(clubId);
  if (!club) return { hasAccess: false, isOwner: false, role: undefined as ClubRole | undefined, permissions: ROLE_PERMISSIONS.player };
  
  if (club.userId === userId) {
    return { hasAccess: true, isOwner: true, role: "manager" as ClubRole, permissions: ROLE_PERMISSIONS.manager };
  }
  
  const member = await db.getClubMember(clubId, userId);
  if (member && member.isActive) {
    const role = member.role as ClubRole;
    return { hasAccess: true, isOwner: false, role, permissions: getPermissions(role, false) };
  }
  
  return { hasAccess: false, isOwner: false, role: undefined as ClubRole | undefined, permissions: ROLE_PERMISSIONS.player };
}

// Master admin check
function requireMasterAdmin(user: { isMasterAdmin: boolean }) {
  if (!user.isMasterAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Dostęp tylko dla Master Admin" });
  }
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // CLUBS ROUTER
  // ============================================
  clubs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getClubsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.id);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getClubById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        location: z.string().max(255).optional(),
        city: z.string().max(255).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createClub({ ...input, userId: ctx.user.id });
        await db.initDefaultFinanceCategories(id);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        location: z.string().max(255).optional(),
        city: z.string().max(255).optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, isOwner } = await checkClubAccess(ctx.user.id, input.id);
        if (!hasAccess || !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        const { id, ...data } = input;
        await db.updateClub(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, isOwner } = await checkClubAccess(ctx.user.id, input.id);
        if (!hasAccess || !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        await db.deleteClub(input.id);
        return { success: true };
      }),

    updateSmsConfig: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        smsEnabled: z.boolean(),
        smsProvider: z.enum(['none', 'twilio', 'smsapi']),
        twilioAccountSid: z.string().optional(),
        twilioAuthToken: z.string().optional(),
        twilioPhoneNumber: z.string().optional(),
        smsapiToken: z.string().optional(),
        smsSenderName: z.string().max(11).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, isOwner } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel klubu może konfigurować SMS" });
        
        const { clubId, ...smsConfig } = input;
        // Encrypt sensitive API keys before storing
        await db.updateClub(clubId, {
          smsEnabled: smsConfig.smsEnabled,
          smsProvider: smsConfig.smsProvider,
          twilioAccountSid: smsConfig.twilioAccountSid ? encrypt(smsConfig.twilioAccountSid) : undefined,
          twilioAuthToken: smsConfig.twilioAuthToken ? encrypt(smsConfig.twilioAuthToken) : undefined,
          twilioPhoneNumber: smsConfig.twilioPhoneNumber,
          smsapiToken: smsConfig.smsapiToken ? encrypt(smsConfig.smsapiToken) : undefined,
          smsSenderName: smsConfig.smsSenderName,
        });
        return { success: true };
      }),

    updateEmailConfig: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        emailEnabled: z.boolean(),
        emailProvider: z.enum(['none', 'smtp', 'sendgrid', 'mailgun']),
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        emailFromName: z.string().optional(),
        emailFromAddress: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, isOwner } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel klubu może konfigurować email" });
        
        const { clubId, ...emailConfig } = input;
        // Encrypt sensitive SMTP credentials before storing
        await db.updateClub(clubId, {
          emailEnabled: emailConfig.emailEnabled,
          emailProvider: emailConfig.emailProvider,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpUser: emailConfig.smtpUser,
          smtpPassword: emailConfig.smtpPassword ? encrypt(emailConfig.smtpPassword) : undefined,
          emailFromName: emailConfig.emailFromName,
          emailFromAddress: emailConfig.emailFromAddress,
        });
        return { success: true };
      }),
  }),

  // ============================================
  // TEAMS ROUTER
  // ============================================
  teams: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getTeamsByClubId(input.clubId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        name: z.string().min(1).max(255),
        ageGroup: z.string().max(50).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const id = await db.createTeam(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        ageGroup: z.string().max(50).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const team = await db.getTeamById(input.id);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono drużyny" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, team.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { id, ...data } = input;
        await db.updateTeam(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await db.getTeamById(input.id);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono drużyny" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, team.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deleteTeam(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // PLAYERS ROUTER
  // ============================================
  players: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getPlayersByClubId(input.clubId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const player = await db.getPlayerById(input.id);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zawodnika" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, player.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return player;
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        teamId: z.number().optional(),
        name: z.string().min(1).max(255),
        position: z.enum(["bramkarz", "obrońca", "pomocnik", "napastnik"]),
        jerseyNumber: z.number().optional(),
        dateOfBirth: z.string().optional(),
        phone: z.string().max(20).optional(),
        email: z.string().max(320).optional(),
        isAcademy: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { dateOfBirth, ...rest } = input;
        const id = await db.createPlayer({
          ...rest,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        teamId: z.number().nullable().optional(),
        name: z.string().min(1).max(255).optional(),
        position: z.enum(["bramkarz", "obrońca", "pomocnik", "napastnik"]).optional(),
        jerseyNumber: z.number().nullable().optional(),
        dateOfBirth: z.string().nullable().optional(),
        phone: z.string().max(20).nullable().optional(),
        email: z.string().max(320).nullable().optional(),
        photoUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerById(input.id);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zawodnika" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, player.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { id, dateOfBirth, ...data } = input;
        await db.updatePlayer(id, {
          ...data,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerById(input.id);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zawodnika" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, player.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deletePlayer(input.id);
        return { success: true };
      }),
    
    getStats: protectedProcedure
      .input(z.object({ playerId: z.number(), season: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zawodnika" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, player.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getPlayerStats(input.playerId, input.season);
      }),
    
    addMatchStats: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        matchId: z.number(),
        goals: z.number().min(0).default(0),
        assists: z.number().min(0).default(0),
        minutesPlayed: z.number().min(0).max(120).default(0),
        yellowCards: z.number().min(0).max(2).default(0),
        redCards: z.number().min(0).max(1).default(0),
        cleanSheet: z.boolean().default(false),
        saves: z.number().min(0).default(0),
        goalsConceded: z.number().min(0).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zawodnika" });
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, player.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        if (!permissions.canEditMatches) throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do edycji meczów" });
        
        // Save match stats
        const statsId = await db.createPlayerMatchStats(input);
        
        // Update player season totals
        await db.updatePlayerSeasonStats(input.playerId, {
          goals: input.goals,
          assists: input.assists,
          minutesPlayed: input.minutesPlayed,
          yellowCards: input.yellowCards,
          redCards: input.redCards,
          cleanSheets: input.cleanSheet ? 1 : 0,
          saves: input.saves,
          goalsConceded: input.goalsConceded,
        });
        
        return { id: statsId, success: true };
      }),
  }),

  // ============================================
  // MATCHES ROUTER
  // ============================================
  matches: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getMatchesByClubId(input.clubId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.id);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono meczu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return match;
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        teamId: z.number().optional(),
        opponent: z.string().min(1).max(255),
        matchDate: z.string(),
        matchTime: z.string().max(10).optional(),
        location: z.string().max(255).optional(),
        homeAway: z.enum(["home", "away"]),
        goalsScored: z.number().default(0),
        goalsConceded: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { matchDate, ...rest } = input;
        
        // Calculate result
        let result: "win" | "draw" | "loss" | undefined;
        if (input.goalsScored > input.goalsConceded) result = "win";
        else if (input.goalsScored < input.goalsConceded) result = "loss";
        else result = "draw";
        
        const id = await db.createMatch({
          ...rest,
          matchDate: new Date(matchDate),
          result,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        opponent: z.string().min(1).max(255).optional(),
        matchDate: z.string().optional(),
        matchTime: z.string().max(10).optional(),
        location: z.string().max(255).optional(),
        homeAway: z.enum(["home", "away"]).optional(),
        goalsScored: z.number().optional(),
        goalsConceded: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.id);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono meczu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        const { id, matchDate, goalsScored, goalsConceded, ...data } = input;
        
        const updateData: any = { ...data };
        if (matchDate) updateData.matchDate = new Date(matchDate);
        if (goalsScored !== undefined) updateData.goalsScored = goalsScored;
        if (goalsConceded !== undefined) updateData.goalsConceded = goalsConceded;
        
        // Recalculate result
        const finalScored = goalsScored ?? match.goalsScored;
        const finalConceded = goalsConceded ?? match.goalsConceded;
        if (finalScored > finalConceded) updateData.result = "win";
        else if (finalScored < finalConceded) updateData.result = "loss";
        else updateData.result = "draw";
        
        await db.updateMatch(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.id);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono meczu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deleteMatchStats(input.id);
        await db.deleteMatch(input.id);
        return { success: true };
      }),
    
    getStats: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono meczu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getMatchStats(input.matchId);
      }),
    
    addStats: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number(),
        minutesPlayed: z.number().default(0),
        goals: z.number().default(0),
        assists: z.number().default(0),
        yellowCards: z.number().default(0),
        redCards: z.number().default(0),
        saves: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono meczu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const id = await db.addMatchStats(input);
        return { id };
      }),
  }),

  // ============================================
  // TRAININGS ROUTER
  // ============================================
  trainings: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getTrainingsByClubId(input.clubId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const training = await db.getTrainingById(input.id);
        if (!training) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono treningu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, training.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return training;
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        teamId: z.number().optional(),
        trainingDate: z.string(),
        trainingTime: z.string().max(10).optional(),
        location: z.string().max(255).optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { trainingDate, ...rest } = input;
        const id = await db.createTraining({
          ...rest,
          trainingDate: new Date(trainingDate),
        });
        return { id };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const training = await db.getTrainingById(input.id);
        if (!training) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono treningu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, training.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deleteTraining(input.id);
        return { success: true };
      }),
    
    getAttendance: protectedProcedure
      .input(z.object({ trainingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const training = await db.getTrainingById(input.trainingId);
        if (!training) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono treningu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, training.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getTrainingAttendance(input.trainingId);
      }),
    
    setAttendance: protectedProcedure
      .input(z.object({
        trainingId: z.number(),
        playerId: z.number(),
        attended: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const training = await db.getTrainingById(input.trainingId);
        if (!training) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono treningu" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, training.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.setTrainingAttendance(input);
        return { success: true };
      }),
  }),

  // ============================================
  // FINANCES ROUTER
  // ============================================
  finances: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getFinancesByClubId(input.clubId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        type: z.enum(["income", "expense"]),
        category: z.string().min(1).max(100),
        amount: z.number(),
        transactionDate: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { transactionDate, ...rest } = input;
        const id = await db.createFinance({
          ...rest,
          transactionDate: new Date(transactionDate),
        });
        return { id };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const finance = await db.getFinanceById(input.id);
        if (!finance) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono transakcji" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, finance.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deleteFinance(input.id);
        return { success: true };
      }),
    
    getSummary: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getFinanceSummary(input.clubId);
      }),
    
    getCategories: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.initDefaultFinanceCategories(input.clubId);
        return db.getFinanceCategoriesByClubId(input.clubId);
      }),
  }),

  // ============================================
  // ACADEMY ROUTER
  // ============================================
  academy: router({
    listStudents: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getAcademyStudentsByClubId(input.clubId);
      }),
    
    getStudent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const student = await db.getAcademyStudentById(input.id);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, student.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return student;
      }),
    
    createStudent: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        name: z.string().min(1).max(255),
        dateOfBirth: z.string().optional(),
        parentName: z.string().max(255).optional(),
        parentPhone: z.string().max(20).optional(),
        parentEmail: z.string().max(320).optional(),
        groupName: z.string().max(100).optional(),
        monthlyFee: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { dateOfBirth, ...rest } = input;
        const id = await db.createAcademyStudent({
          ...rest,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });
        return { id };
      }),
    
    deleteStudent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getAcademyStudentById(input.id);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, student.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        await db.deleteAcademyStudent(input.id);
        return { success: true };
      }),
    
    getPayments: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const student = await db.getAcademyStudentById(input.studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, student.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getAcademyPayments(input.studentId);
      }),
    
    addPayment: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        amount: z.number(),
        paymentDate: z.string(),
        paymentMonth: z.string().optional(),
        paymentMethod: z.string().max(50).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getAcademyStudentById(input.studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
        const { hasAccess } = await checkClubAccess(ctx.user.id, student.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        const { paymentDate, ...rest } = input;
        const id = await db.createAcademyPayment({
          ...rest,
          paymentDate: new Date(paymentDate),
        });
        return { id };
      }),
    
    getDashboard: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getAcademyDashboard(input.clubId);
      }),
  }),

  // ============================================
  // CALENDAR ROUTER
  // ============================================
  calendar: router({
    getEvents: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getCalendarEvents(input.clubId, new Date(input.startDate), new Date(input.endDate));
      }),
    exportICS: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        const { exportClubCalendar } = await import('./services/calendarService');
        const icsContent = await exportClubCalendar(
          input.clubId,
          new Date(input.startDate),
          new Date(input.endDate)
        );
        return { icsContent };
      }),
  }),

  // ============================================
  // EXPORTS ROUTER
  // ============================================
  exports: router({
    toCSV: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        type: z.enum(['players', 'stats', 'matches', 'trainings', 'finances', 'attendance']),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        // Check finance permission for finance export
        if (input.type === 'finances' && !permissions.canViewFinances) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu do finansów" });
        }
        
        const excel = await import('./services/excelService');
        let csvContent: string;
        let filename: string;
        
        switch (input.type) {
          case 'players':
            csvContent = await excel.exportPlayersToCSV(input.clubId);
            filename = 'zawodnicy';
            break;
          case 'stats':
            csvContent = await excel.exportPlayerStatsToCSV(input.clubId);
            filename = 'statystyki';
            break;
          case 'matches':
            csvContent = await excel.exportMatchesToCSV(input.clubId);
            filename = 'mecze';
            break;
          case 'trainings':
            csvContent = await excel.exportTrainingsToCSV(input.clubId);
            filename = 'treningi';
            break;
          case 'finances':
            csvContent = await excel.exportFinancesToCSV(input.clubId);
            filename = 'finanse';
            break;
          case 'attendance':
            csvContent = await excel.exportAttendanceToCSV(input.clubId);
            filename = 'frekwencja';
            break;
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nieznany typ eksportu" });
        }
        
        return { csvContent, filename };
      }),
  }),

  // ============================================
  // NOTIFICATIONS ROUTER
  // ============================================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getNotificationsByClubId(input.clubId);
      }),
    
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    
    getUnreadCount: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) return { unread: 0 };
        const count = await db.getUnreadNotificationCount(input.clubId);
        return { unread: count };
      }),
  }),

  // ============================================
  // INVITATIONS ROUTER
  // ============================================
  invitations: router({
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        email: z.string().email(),
        role: z.enum(["manager", "board_member", "board_member_finance", "coach", "player"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, permissions, role: senderRole } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canInviteUsers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do zapraszania użytkowników" });
        }
        
        // Role-based invitation restrictions
        // Manager can invite: board_member, board_member_finance, coach, player
        // Board members and coaches can only invite: player
        const roleHierarchy = ["manager", "board_member", "board_member_finance", "coach", "player"];
        const senderRoleIndex = roleHierarchy.indexOf(senderRole || "player");
        const targetRoleIndex = roleHierarchy.indexOf(input.role);
        
        // Can only invite roles lower in hierarchy
        if (targetRoleIndex <= senderRoleIndex && senderRole !== "manager") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Nie możesz zaprosić osoby z tą lub wyższą rolą" 
          });
        }
        
        // Board members and coaches can only invite players
        if ((senderRole === "board_member" || senderRole === "board_member_finance" || senderRole === "coach") && 
            input.role !== "player") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Możesz zaprosić tylko zawodników" 
          });
        }
        
        // Check if invitation already exists
        const existing = await db.getPendingInvitationByEmail(input.clubId, input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Zaproszenie dla tego emaila już istnieje" });
        }
        
        // Check if user is already a member
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          const existingMember = await db.getClubMember(input.clubId, existingUser.id);
          if (existingMember && existingMember.isActive) {
            throw new TRPCError({ code: "CONFLICT", message: "Użytkownik jest już członkiem klubu" });
          }
        }
        
        // Generate unique token
        const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Rate limit check
        const rateLimitId = createRateLimitIdentifier({ clubId: input.clubId });
        const rateCheck = await checkRateLimit(rateLimitId, "invitation.send");
        if (!rateCheck.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Zbyt wiele zaproszeń. Spróbuj za ${rateCheck.retryAfter} sekund.` });
        }
        
        const id = await db.createInvitation({
          clubId: input.clubId,
          email: input.email,
          role: input.role,
          token,
          invitedBy: ctx.user.id,
          expiresAt,
        });
        
        // Audit log
        await logAuditEvent({
          userId: ctx.user.id,
          userEmail: ctx.user.email || undefined,
          action: AuditActions.MEMBER_INVITED,
          category: "member",
          targetType: "invitation",
          targetId: id,
          details: { clubId: input.clubId, invitedEmail: input.email, role: input.role },
        });
        
        return { id, token };
      }),
    
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canInviteUsers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        }
        return db.getInvitationsByClubId(input.clubId);
      }),
    
    revoke: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invitation = await db.getInvitationById(input.id);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zaproszenia" });
        
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, invitation.clubId);
        if (!hasAccess || !permissions.canInviteUsers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        }
        
        await db.updateInvitation(input.id, { status: "revoked" });
        return { success: true };
      }),
    
    accept: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invitation = await db.getInvitationByToken(input.token);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zaproszenia" });
        
        if (invitation.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Zaproszenie nie jest aktywne" });
        }
        
        if (new Date() > invitation.expiresAt) {
          await db.updateInvitation(invitation.id, { status: "expired" });
          throw new TRPCError({ code: "BAD_REQUEST", message: "Zaproszenie wygasło" });
        }
        
        // Check if user email matches invitation
        if (ctx.user.email && ctx.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Zaproszenie jest dla innego adresu email" });
        }
        
        // Add user as club member
        await db.addClubMember({
          clubId: invitation.clubId,
          userId: ctx.user.id,
          role: invitation.role,
          acceptedAt: new Date(),
        });
        
        // Update invitation status
        await db.updateInvitation(invitation.id, {
          status: "accepted",
          acceptedAt: new Date(),
          acceptedBy: ctx.user.id,
        });
        
        return { success: true, clubId: invitation.clubId };
      }),
    
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invitation = await db.getInvitationByToken(input.token);
        if (!invitation) return null;
        
        const club = await db.getClubById(invitation.clubId);
        return {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          clubName: club?.name || "Nieznany klub",
        };
      }),
  }),

  // ============================================
  // CLUB MEMBERS ROUTER
  // ============================================
  clubMembers: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getClubMembersWithUsers(input.clubId);
      }),
    
    updateRole: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        role: z.enum(["manager", "board_member", "board_member_finance", "coach", "player"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getClubMembers(0).then(async () => {
          const db2 = await import("./db");
          const allMembers = await db2.getClubMembers(0);
          return allMembers.find(m => m.id === input.memberId);
        });
        
        // Get member by ID directly
        const members = await db.getClubMembers(input.memberId);
        const targetMember = members[0];
        
        if (!targetMember) {
          // Try to find by iterating - this is a workaround
          throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono członka" });
        }
        
        const { hasAccess, permissions, role: currentUserRole } = await checkClubAccess(ctx.user.id, targetMember.clubId);
        if (!hasAccess || !permissions.canAssignRoles) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do zmiany ról" });
        }
        
        // Manager cannot be changed to lower role by non-board member
        if (targetMember.role === "manager" && !permissions.canRemoveManager) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nie możesz zmienić roli Managera" });
        }
        
        // Role hierarchy restrictions - can only change roles lower than your own
        const roleHierarchy = ["manager", "board_member", "board_member_finance", "coach", "player"];
        const currentUserRoleIndex = roleHierarchy.indexOf(currentUserRole || "player");
        const targetMemberRoleIndex = roleHierarchy.indexOf(targetMember.role);
        const newRoleIndex = roleHierarchy.indexOf(input.role);
        
        // Cannot change role of someone at same or higher level (except manager can change anyone)
        if (currentUserRole !== "manager" && targetMemberRoleIndex <= currentUserRoleIndex) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Nie możesz zmienić roli osoby na tym samym lub wyższym poziomie" 
          });
        }
        
        // Cannot assign role higher than your own (except manager)
        if (currentUserRole !== "manager" && newRoleIndex <= currentUserRoleIndex) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Nie możesz przyznać roli wyższej niż Twoja" 
          });
        }
        
        // Board members and coaches can only assign player role
        if ((currentUserRole === "board_member" || currentUserRole === "board_member_finance" || currentUserRole === "coach") && 
            input.role !== "player") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Możesz przyznać tylko rolę zawodnika" 
          });
        }
        
        await db.updateClubMember(input.memberId, { role: input.role });
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // We need to get the member's clubId first
        // This is a simplified approach - in production you'd have a getMemberById function
        const allClubs = await db.getClubsByUserId(ctx.user.id);
        let targetMember = null;
        let targetClubId = 0;
        
        for (const club of allClubs) {
          const members = await db.getClubMembers(club.id);
          const found = members.find(m => m.id === input.memberId);
          if (found) {
            targetMember = found;
            targetClubId = club.id;
            break;
          }
        }
        
        if (!targetMember) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono członka" });
        }
        
        const { hasAccess, permissions, isOwner } = await checkClubAccess(ctx.user.id, targetClubId);
        if (!hasAccess || !permissions.canManageMembers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        }
        
        // Cannot remove club owner
        const club = await db.getClubById(targetClubId);
        if (club && targetMember.userId === club.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nie można usunąć właściciela klubu" });
        }
        
        // Manager can only be removed by board member
        if (targetMember.role === "manager" && !permissions.canRemoveManager) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nie możesz usunąć Managera" });
        }
        
        await db.removeClubMember(input.memberId);
        return { success: true };
      }),
    
    getMyRole: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess, role, permissions, isOwner } = await checkClubAccess(ctx.user.id, input.clubId);
        return { hasAccess, role, permissions, isOwner };
      }),
  }),

  // ============================================
  // CALLUPS ROUTER (Match Call-ups with Notifications)
  // ============================================
  callups: router({
    // Create callups for a match with notification scheduling
    createForMatch: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerIds: z.array(z.number()),
        notificationChannel: z.enum(["app", "email", "sms", "both"]).default("app"),
      }))
      .mutation(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Mecz nie znaleziony" });
        
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess || !permissions.canManageCallups) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do zarządzania powołaniami" });
        }
        
        // Delete existing callups for this match
        await db.deleteCallupsByMatchId(input.matchId);
        
        // Cancel any existing scheduled notifications for this match
        await db.cancelScheduledNotificationsForMatch(input.matchId);
        
        // Create new callups
        const callupIds = [];
        for (const playerId of input.playerIds) {
          const id = await db.createMatchCallup({
            matchId: input.matchId,
            playerId,
            notificationChannel: input.notificationChannel,
          });
          callupIds.push(id);
        }
        
        // Schedule notifications (48h and 24h before match)
        const matchDate = new Date(match.matchDate);
        const now = new Date();
        
        // Calculate notification times
        const notify48h = new Date(matchDate);
        notify48h.setHours(notify48h.getHours() - 48);
        
        const notify24h = new Date(matchDate);
        notify24h.setHours(notify24h.getHours() - 24);
        
        const club = await db.getClubById(match.clubId);
        const clubName = club?.name || "Klub";
        
        // Schedule 48h notification if it's in the future
        if (notify48h > now) {
          await db.createScheduledNotification({
            clubId: match.clubId,
            type: "callup_48h",
            referenceId: input.matchId,
            referenceType: "match",
            scheduledFor: notify48h,
            channel: input.notificationChannel,
            recipientIds: JSON.stringify(input.playerIds),
            title: `Powołanie na mecz za 2 dni`,
            message: `Zostałeś powołany na mecz ${match.opponent} (${match.homeAway === "home" ? "dom" : "wyjazd"}). Potwierdź obecność.`,
          });
        }
        
        // Schedule 24h notification if it's in the future
        if (notify24h > now) {
          await db.createScheduledNotification({
            clubId: match.clubId,
            type: "callup_24h",
            referenceId: input.matchId,
            referenceType: "match",
            scheduledFor: notify24h,
            channel: input.notificationChannel,
            recipientIds: JSON.stringify(input.playerIds),
            title: `Przypomnienie: Mecz jutro!`,
            message: `Przypomnienie o meczu ${match.opponent} jutro. Potwierdź obecność jeśli jeszcze tego nie zrobiłeś.`,
          });
        }
        
        return { success: true, callupIds, notificationsScheduled: (notify48h > now ? 1 : 0) + (notify24h > now ? 1 : 0) };
      }),
    
    // Get callups for a match
    getForMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Mecz nie znaleziony" });
        
        const { hasAccess } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        return db.getCallupsWithPlayerInfo(input.matchId);
      }),
    
    // Respond to callup (confirm/decline)
    respond: protectedProcedure
      .input(z.object({
        callupId: z.number(),
        status: z.enum(["confirmed", "declined"]),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.respondToCallup(input.callupId, input.status, input.note);
        return { success: true };
      }),
    
    // Get player's callups
    getMyCallups: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        // Find player linked to this user
        const players = await db.getPlayersByClubId(input.clubId);
        const myPlayer = players.find(p => p.email === ctx.user.email);
        if (!myPlayer) return [];
        
        const callups = await db.getPlayerCallups(myPlayer.id);
        const result = [];
        for (const callup of callups) {
          const match = await db.getMatchById(callup.matchId);
          result.push({ ...callup, match });
        }
        return result;
      }),
    
    // Delete a callup
    delete: protectedProcedure
      .input(z.object({ callupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const callup = await db.getCallupById(input.callupId);
        if (!callup) throw new TRPCError({ code: "NOT_FOUND", message: "Powołanie nie znalezione" });
        
        const match = await db.getMatchById(callup.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Mecz nie znaleziony" });
        
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess || !permissions.canManageCallups) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        }
        
        await db.deleteCallup(input.callupId);
        return { success: true };
      }),
    
    // Get scheduled notifications for a match
    getScheduledNotifications: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const match = await db.getMatchById(input.matchId);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Mecz nie znaleziony" });
        
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, match.clubId);
        if (!hasAccess || !permissions.canManageCallups) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        }
        
        return db.getScheduledNotificationsForMatch(input.matchId);
      }),
  }),

  // ============================================
  // SUBSCRIPTIONS ROUTER
  // ============================================
  subscriptions: router({
    getPlans: publicProcedure.query(async () => {
      return db.getSubscriptionPlans();
    }),
    
    getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscription(ctx.user.id);
    }),
    
    createCheckoutSession: protectedProcedure
      .input(z.object({
        planId: z.number(),
        billingPeriod: z.enum(['monthly', 'yearly']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get plan details
        const plans = await db.getSubscriptionPlans();
        const plan = plans.find(p => p.id === input.planId);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan nie znaleziony" });
        
        // Get Stripe keys from app settings
        const stripeSecretKey = await db.getAppSetting('stripe_secret_key');
        if (!stripeSecretKey?.value) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Płatności nie są skonfigurowane. Skontaktuj się z administratorem." 
          });
        }
        
        const priceId = input.billingPeriod === 'monthly' 
          ? plan.stripePriceIdMonthly 
          : plan.stripePriceIdYearly;
        
        if (!priceId) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Ten plan nie ma skonfigurowanej ceny w Stripe." 
          });
        }
        
        // Create Stripe checkout session
        // Note: In production, you would use the Stripe SDK here
        // For now, return a placeholder URL
        return {
          url: `https://checkout.stripe.com/pay/${priceId}?client_reference_id=${ctx.user.id}`,
          sessionId: `cs_${Date.now()}`,
        };
      }),
    
    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      await db.cancelUserSubscription(ctx.user.id);
      await db.updateUser(ctx.user.id, { isPro: false });
      return { success: true };
    }),
  }),

  // ============================================
  // REPORTS ROUTER
  // ============================================
  reports: router({
    generatePlayerStats: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        const { generatePlayerStatsReport, generateReportHTML } = await import("./services/pdfService");
        const report = await generatePlayerStatsReport(input.clubId);
        const html = generateReportHTML(report);
        return { html, title: report.title };
      }),

    generateFinancial: protectedProcedure
      .input(z.object({ 
        clubId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canViewFinances) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu do finansów" });
        }
        
        const { generateFinancialReport, generateReportHTML } = await import("./services/pdfService");
        const report = await generateFinancialReport(
          input.clubId,
          input.startDate ? new Date(input.startDate) : undefined,
          input.endDate ? new Date(input.endDate) : undefined
        );
        const html = generateReportHTML(report);
        return { html, title: report.title };
      }),

    generateAttendance: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        const { generateAttendanceReport, generateReportHTML } = await import("./services/pdfService");
        const report = await generateAttendanceReport(input.clubId);
        const html = generateReportHTML(report);
        return { html, title: report.title };
      }),
  }),

  // ============================================
  // PHOTOS ROUTER
  // ============================================
  photos: router({
    list: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getPhotosByClubId(input.clubId);
      }),

    upload: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        base64Data: z.string(),
        fileName: z.string(),
        contentType: z.string(),
        albumName: z.string().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        
        // Import storage helper
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Generate unique file key
        const extension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `clubs/${input.clubId}/photos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        
        // Save to database
        const photoId = await db.createPhoto({
          clubId: input.clubId,
          url,
          title: input.title || input.fileName,
          description: input.albumName,
        });
        
        return { id: photoId, url };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get photo to verify club access
        const photos = await db.getPhotosByClubId(0); // We need to get photo by id
        await db.deletePhoto(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // MASTER ADMIN ROUTER
  // ============================================
  masterAdmin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      return db.getAllUsers();
    }),
    
    getAllClubs: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      return db.getAllClubs();
    }),
    
    getAnalytics: protectedProcedure
      .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
      .query(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        
        // Calculate date range
        const now = new Date();
        const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
        const days = daysMap[input.timeRange];
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        // Get all users and clubs
        const allUsers = await db.getAllUsers();
        const allClubs = await db.getAllClubs();
        
        // Calculate stats
        const totalUsers = allUsers.length;
        const proSubscriptions = allUsers.filter(u => u.isPro).length;
        const freeUsers = totalUsers - proSubscriptions;
        const totalClubs = allClubs.length;
        const activeClubs = allClubs.filter(c => !c.isBlocked).length;
        
        // New users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = allUsers.filter(u => new Date(u.createdAt) >= today).length;
        const newClubsToday = allClubs.filter(c => new Date(c.createdAt) >= today).length;
        
        // Mock growth data (in real app, aggregate from DB)
        const userGrowth = Array.from({ length: 7 }, (_, i) => totalUsers - (6 - i) * 15 + Math.floor(Math.random() * 10));
        const revenueHistory = Array.from({ length: 6 }, (_, i) => 3000 + i * 200 + Math.floor(Math.random() * 100));
        
        return {
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.7),
          totalClubs,
          activeClubs,
          proSubscriptions,
          freeUsers,
          revenue: proSubscriptions * 49.99,
          revenueGrowth: 12.5,
          newUsersToday,
          newClubsToday,
          matchesThisMonth: Math.floor(totalClubs * 2.2),
          trainingsThisMonth: Math.floor(totalClubs * 8),
          userGrowth,
          revenueHistory,
        };
      }),
    
    grantPro: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.updateUser(input.userId, {
          isPro: true,
          proGrantedBy: ctx.user.id,
          proGrantedAt: new Date(),
        });
        
        // Audit log
        await logAuditEvent({
          userId: ctx.user.id,
          userEmail: ctx.user.email || undefined,
          action: AuditActions.USER_PRO_GRANTED,
          category: "admin",
          targetType: "user",
          targetId: input.userId,
          details: { grantedBy: ctx.user.id },
        });
        
        return { success: true };
      }),
    
    revokePro: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.updateUser(input.userId, {
          isPro: false,
          proGrantedBy: null,
          proGrantedAt: null,
        });
        
        // Audit log
        await logAuditEvent({
          userId: ctx.user.id,
          userEmail: ctx.user.email || undefined,
          action: AuditActions.USER_PRO_REVOKED,
          category: "admin",
          targetType: "user",
          targetId: input.userId,
          details: { revokedBy: ctx.user.id },
        });
        return { success: true };
      }),
    
    blockClub: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.updateClub(input.clubId, { isBlocked: true });
        return { success: true };
      }),
    
    unblockClub: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.updateClub(input.clubId, { isBlocked: false });
        return { success: true };
      }),
    
    getSubscriptionPlans: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      return db.getSubscriptionPlans();
    }),
    
    updateSubscriptionPlan: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        displayName: z.string().optional(),
        stripePriceIdMonthly: z.string().optional(),
        stripePriceIdYearly: z.string().optional(),
        price: z.string().optional(),
        yearlyPrice: z.string().optional(),
        features: z.string().optional(),
        maxPlayers: z.number().optional(),
        maxTeams: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const { id, ...data } = input;
        await db.updateSubscriptionPlan(id, data);
        return { success: true };
      }),
    
    createSubscriptionPlan: protectedProcedure
      .input(z.object({
        name: z.string(),
        displayName: z.string(),
        price: z.string(),
        yearlyPrice: z.string().optional(),
        features: z.string().optional(),
        maxPlayers: z.number().optional(),
        maxTeams: z.number().optional(),
        stripePriceIdMonthly: z.string().optional(),
        stripePriceIdYearly: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const id = await db.createSubscriptionPlan(input);
        return { success: true, id };
      }),
    
    getAppSettings: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      return db.getAllAppSettings();
    }),
    
    setAppSetting: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.setAppSetting(input.key, input.value, input.description, ctx.user.id);
        return { success: true };
      }),
    
    // 2FA endpoints
    setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      const twoFactorService = await import("./services/twoFactorService");
      const result = await twoFactorService.enable2FA(ctx.user.id);
      return result;
    }),
    
    verify2FA: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const twoFactorService = await import("./services/twoFactorService");
        const success = await twoFactorService.verify2FA(ctx.user.id, input.code);
        
        if (success) {
          await logAuditEvent({
            userId: ctx.user.id,
            userEmail: ctx.user.email || undefined,
            action: AuditActions.TWO_FACTOR_ENABLED,
            category: "auth",
            targetType: "user",
            targetId: ctx.user.id,
          });
        }
        
        return { success };
      }),
    
    disable2FA: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const twoFactorService = await import("./services/twoFactorService");
        
        // Verify code before disabling
        const isValid = await twoFactorService.verify2FALogin(ctx.user.id, input.code);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Nieprawidłowy kod 2FA" });
        }
        
        await twoFactorService.disable2FA(ctx.user.id);
        
        await logAuditEvent({
          userId: ctx.user.id,
          userEmail: ctx.user.email || undefined,
          action: AuditActions.TWO_FACTOR_DISABLED,
          category: "auth",
          targetType: "user",
          targetId: ctx.user.id,
        });
        
        return { success: true };
      }),
    
    get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      const twoFactorService = await import("./services/twoFactorService");
      const isEnabled = await twoFactorService.is2FAEnabled(ctx.user.id);
      const backupCodesCount = await twoFactorService.getBackupCodesCount(ctx.user.id);
      return { isEnabled, backupCodesCount };
    }),
    
    regenerateBackupCodes: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const twoFactorService = await import("./services/twoFactorService");
        
        // Verify code before regenerating
        const isValid = await twoFactorService.verify2FALogin(ctx.user.id, input.code);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Nieprawidłowy kod 2FA" });
        }
        
        const backupCodes = await twoFactorService.regenerateBackupCodes(ctx.user.id);
        return { backupCodes };
      }),
    
    // Audit logs
    getAuditLogs: protectedProcedure
      .input(z.object({
        category: z.enum(["auth", "club", "member", "finance", "config", "admin", "subscription"]).optional(),
        limit: z.number().max(500).optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const auditService = await import("./services/auditService");
        return auditService.getAuditLogs({
          category: input.category,
          limit: input.limit,
          offset: input.offset,
        });
      }),
    
    getAuditStats: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      const auditService = await import("./services/auditService");
      return auditService.getAuditStats(30);
    }),
  }),

  // ============================================
  // BACKUP ROUTER
  // ============================================
  backup: router({
    create: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, isOwner } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !isOwner) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel klubu może tworzyć kopie zapasowe" });
        }
        
        const backupService = await import("./services/backupService");
        const backup = await backupService.createClubBackup(input.clubId);
        
        // Log audit event
        const auditContext = createAuditContext(ctx.req);
        await logAuditEvent({
          userId: ctx.user.id,
          action: "backup.create",
          category: "club",
          details: { clubId: input.clubId, clubName: backup.clubName },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        });
        
        return {
          backup,
          size: backupService.estimateBackupSize(backup),
          sizeFormatted: backupService.formatBackupSize(backupService.estimateBackupSize(backup)),
        };
      }),
    
    validate: protectedProcedure
      .input(z.object({ data: z.any() }))
      .mutation(async ({ input }) => {
        const backupService = await import("./services/backupService");
        return backupService.validateBackup(input.data);
      }),
    
    restore: protectedProcedure
      .input(z.object({ data: z.any() }))
      .mutation(async ({ ctx, input }) => {
        const backupService = await import("./services/backupService");
        
        // Validate backup first
        const validation = backupService.validateBackup(input.data);
        if (!validation.valid) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `Nieprawidłowy plik kopii zapasowej: ${validation.errors.join(", ")}` 
          });
        }
        
        const result = await backupService.restoreClubFromBackup(input.data, ctx.user.id);
        
        // Log audit event
        const auditContext = createAuditContext(ctx.req);
        await logAuditEvent({
          userId: ctx.user.id,
          action: "backup.restore",
          category: "club",
          details: { 
            originalClubName: input.data.clubName,
            newClubId: result.clubId,
            stats: result.stats,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        });
        
        return result;
      }),
  }),

  // ============================================
  // ANALYTICS ROUTER
  // ============================================
  analytics: router({
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      requireMasterAdmin(ctx.user);
      
      const allUsers = await db.getAllUsers();
      const allClubs = await db.getAllClubs();
      // Get subscription data from users table
      const subscriptions = allUsers.filter(u => u.isPro);
      
      // Calculate stats
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => {
        const lastActive = new Date(u.lastSignedIn);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastActive > thirtyDaysAgo;
      }).length;
      
      const totalClubs = allClubs.length;
      const proUsers = allUsers.filter(u => u.isPro).length;
      
      // Subscription revenue (estimate based on PRO users)
      const monthlyRevenue = proUsers * 50; // Estimate 50 PLN per PRO user
      
      // User growth by month (last 6 months)
      const userGrowth: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = allUsers.filter(u => {
          const created = new Date(u.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        userGrowth.push({
          month: monthStart.toLocaleDateString("pl-PL", { month: "short", year: "numeric" }),
          count,
        });
      }
      
      // Club distribution by size
      const clubSizes: { size: string; count: number }[] = [];
      const smallClubs = allClubs.filter(c => c.id <= 10).length; // Placeholder logic
      const mediumClubs = allClubs.filter(c => c.id > 10 && c.id <= 50).length;
      const largeClubs = allClubs.filter(c => c.id > 50).length;
      
      return {
        totalUsers,
        activeUsers,
        totalClubs,
        proUsers,
        monthlyRevenue,
        userGrowth,
        subscriptionBreakdown: {
          free: totalUsers - proUsers,
          pro: proUsers,
        },
      };
    }),
    
    getRecentActivity: protectedProcedure
      .input(z.object({ limit: z.number().max(100).optional() }))
      .query(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        
        const auditService = await import("./services/auditService");
        const logs = await auditService.getAuditLogs({ limit: input.limit || 20 });
        
        return logs.map(log => ({
          id: log.id,
          action: log.action,
          category: log.category,
          timestamp: log.createdAt,
          userId: log.userId,
        }));
      }),
  }),

  // ============================================
  // PLAYER RATINGS ROUTER
  // ============================================
  playerRatings: router({
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        playerId: z.number(),
        eventType: z.enum(["training", "match"]),
        eventId: z.number(),
        eventDate: z.string(),
        technique: z.number().min(1).max(5),
        engagement: z.number().min(1).max(5),
        progress: z.number().min(1).max(5),
        teamwork: z.number().min(1).max(5),
        overall: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canEditPlayers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do oceniania zawodników" });
        }
        
        const id = await db.createPlayerRating({
          ...input,
          coachId: ctx.user.id,
          eventDate: new Date(input.eventDate),
          overall: input.overall.toString(),
        });
        return { id };
      }),
    
    listByPlayer: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerRatingsByPlayerId(input.playerId);
      }),
    
    listByClub: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        return db.getPlayerRatingsByClubId(input.clubId);
      }),
    
    listByEvent: protectedProcedure
      .input(z.object({ eventType: z.enum(["training", "match"]), eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerRatingsByEvent(input.eventType, input.eventId);
      }),
    
    getAverages: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAverageRatings(input.playerId);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const rating = await db.getPlayerRatingById(input.id);
        if (!rating) throw new TRPCError({ code: "NOT_FOUND", message: "Ocena nie znaleziona" });
        
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, rating.clubId);
        if (!hasAccess || !permissions.canEditPlayers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        }
        
        await db.deletePlayerRating(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // PARENT-CHILD ROUTER
  // ============================================
  parentChildren: router({
    linkChild: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        relationship: z.enum(["parent", "guardian", "other"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if relation already exists
        const existing = await db.getParentChildRelation(ctx.user.id, input.playerId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Relacja już istnieje" });
        }
        
        const id = await db.createParentChild({
          parentUserId: ctx.user.id,
          playerId: input.playerId,
          relationship: input.relationship || "parent",
        });
        return { id };
      }),
    
    getMyChildren: protectedProcedure.query(async ({ ctx }) => {
      return db.getChildrenByParentId(ctx.user.id);
    }),
    
    getParents: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getParentsByPlayerId(input.playerId);
      }),
    
    verify: protectedProcedure
      .input(z.object({ id: z.number(), clubId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canEditPlayers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        }
        
        await db.verifyParentChild(input.id);
        return { success: true };
      }),
    
    unlink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Parents can unlink their own children
        const relations = await db.getChildrenByParentId(ctx.user.id);
        const relation = relations.find(r => r.id === input.id);
        
        if (!relation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Relacja nie znaleziona" });
        }
        
        await db.deleteParentChild(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // MESSAGES ROUTER
  // ============================================
  messages: router({
    send: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        receiverId: z.number(),
        playerId: z.number().optional(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hasAccess } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu" });
        }
        
        // Generate thread ID
        const ids = [ctx.user.id, input.receiverId].sort((a, b) => a - b);
        const threadId = input.playerId 
          ? `thread_${ids[0]}_${ids[1]}_player_${input.playerId}`
          : `thread_${ids[0]}_${ids[1]}`;
        
        const id = await db.createMessage({
          clubId: input.clubId,
          threadId,
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          playerId: input.playerId,
          content: input.content,
        });
        
        return { id, threadId };
      }),
    
    getThreads: protectedProcedure.query(async ({ ctx }) => {
      const threads = await db.getMessageThreadsForUser(ctx.user.id);
      
      // Enrich with user info
      const enriched = [];
      for (const thread of threads) {
        const otherUserId = thread.senderId === ctx.user.id ? thread.receiverId : thread.senderId;
        const otherUser = await db.getUserById(otherUserId);
        const player = thread.playerId ? await db.getPlayerById(thread.playerId) : null;
        
        enriched.push({
          ...thread,
          otherUser,
          player,
        });
      }
      
      return enriched;
    }),
    
    getThread: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Mark messages as read
        await db.markMessagesAsRead(input.threadId, ctx.user.id);
        
        const messages = await db.getMessagesByThreadId(input.threadId);
        
        // Enrich with sender info
        const enriched = [];
        for (const msg of messages) {
          const sender = await db.getUserById(msg.senderId);
          enriched.push({ ...msg, sender });
        }
        
        return enriched;
      }),
    
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadMessageCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessagesAsRead(input.threadId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================
  // PUSH SUBSCRIPTIONS ROUTER
  // ============================================
  pushSubscriptions: router({
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        deviceType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if subscription already exists
        const existing = await db.getPushSubscriptionByEndpoint(input.endpoint);
        if (existing) {
          return { id: existing.id };
        }
        
        const id = await db.createPushSubscription({
          userId: ctx.user.id,
          ...input,
        });
        
        return { id };
      }),
    
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        await db.deactivatePushSubscription(input.endpoint);
        return { success: true };
      }),
    
    getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return db.getPushSubscriptionsByUserId(ctx.user.id);
    }),
  }),

  // ============================================
  // SURVEYS ROUTER
  // ============================================
  surveys: router({
    list: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        status: z.enum(["active", "closed", "draft"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const surveys = await db.getSurveysByClubId(input.clubId, input.status);
        const result = [];
        
        for (const survey of surveys) {
          const options = await db.getSurveyOptions(survey.id);
          const userVote = await db.getUserSurveyVote(survey.id, ctx.user.id);
          
          result.push({
            ...survey,
            options,
            totalVotes: options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0),
            userVoted: !!userVote,
          });
        }
        
        return result;
      }),
    
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        surveyType: z.enum(["poll", "feedback", "date_vote"]),
        allowMultiple: z.boolean().optional(),
        isAnonymous: z.boolean().optional(),
        endsAt: z.date().optional(),
        options: z.array(z.object({
          optionText: z.string(),
          optionDate: z.date().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { options, ...surveyData } = input;
        
        const surveyId = await db.createSurvey({
          ...surveyData,
          createdBy: ctx.user.id,
        });
        
        for (let i = 0; i < options.length; i++) {
          await db.createSurveyOption({
            surveyId,
            optionText: options[i].optionText,
            optionDate: options[i].optionDate,
            sortOrder: i,
          });
        }
        
        return { id: surveyId };
      }),
    
    vote: protectedProcedure
      .input(z.object({
        surveyId: z.number(),
        optionIds: z.array(z.number()),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const survey = await db.getSurveyById(input.surveyId);
        if (!survey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ankieta nie istnieje" });
        }
        
        if (survey.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ankieta jest zamknięta" });
        }
        
        // Check if user already voted
        const existingVote = await db.getUserSurveyVote(input.surveyId, ctx.user.id);
        if (existingVote) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Już zagłosowałeś w tej ankiecie" });
        }
        
        // Check multiple votes
        if (!survey.allowMultiple && input.optionIds.length > 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Można wybrać tylko jedną opcję" });
        }
        
        // Create votes
        for (const optionId of input.optionIds) {
          await db.createSurveyVote({
            surveyId: input.surveyId,
            optionId,
            userId: ctx.user.id,
            comment: input.comment,
          });
          
          // Increment vote count
          await db.incrementSurveyOptionVoteCount(optionId);
        }
        
        return { success: true };
      }),
    
    close: protectedProcedure
      .input(z.object({ surveyId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateSurvey(input.surveyId, { status: "closed" });
        return { success: true };
      }),
  }),

  // ============================================
  // CHANGE HISTORY ROUTER
  // ============================================
  changeHistory: router({
    list: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        entityType: z.enum(["training", "match", "player", "team", "finance"]).optional(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        return db.getChangeHistory(input.clubId, input.entityType, input.limit);
      }),
    
    revert: protectedProcedure
      .input(z.object({ changeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const change = await db.getChangeHistoryById(input.changeId);
        if (!change) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Zmiana nie istnieje" });
        }
        
        if (!change.canRevert || change.revertedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nie można cofnąć tej zmiany" });
        }
        
        // Mark as reverted
        await db.markChangeReverted(input.changeId, ctx.user.id);
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
