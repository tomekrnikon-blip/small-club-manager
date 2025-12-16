import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
        const { hasAccess, permissions } = await checkClubAccess(ctx.user.id, input.clubId);
        if (!hasAccess || !permissions.canInviteUsers) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień do zapraszania użytkowników" });
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
        
        const id = await db.createInvitation({
          clubId: input.clubId,
          email: input.email,
          role: input.role,
          token,
          invitedBy: ctx.user.id,
          expiresAt,
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
    
    grantPro: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        await db.updateUser(input.userId, {
          isPro: true,
          proGrantedBy: ctx.user.id,
          proGrantedAt: new Date(),
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
        stripePriceIdMonthly: z.string().optional(),
        stripePriceIdYearly: z.string().optional(),
        price: z.string().optional(),
        yearlyPrice: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireMasterAdmin(ctx.user);
        const { id, ...data } = input;
        await db.updateSubscriptionPlan(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
