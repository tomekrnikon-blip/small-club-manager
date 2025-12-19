/**
 * RegioWyniki tRPC Router
 * Server-side proxy for fetching real data from RegioWyniki.pl
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  searchClubs,
  getClubDetails,
  getLeagueTable,
  getMatchSchedule,
  getFullClubData,
} from "../services/regiowyniki-scraper";

export const regiowynikRouter = router({
  /**
   * Search for clubs by name
   */
  searchClubs: protectedProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
    }))
    .query(async ({ input }) => {
      try {
        const results = await searchClubs(input.query);
        return { clubs: results };
      } catch (error) {
        console.error('[RegioWyniki] Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się wyszukać klubów',
        });
      }
    }),

  /**
   * Get club details by URL
   */
  getClubDetails: protectedProcedure
    .input(z.object({
      clubUrl: z.string().url(),
    }))
    .query(async ({ input }) => {
      try {
        const details = await getClubDetails(input.clubUrl);
        if (!details) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nie znaleziono klubu',
          });
        }
        return details;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[RegioWyniki] Get club details error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się pobrać danych klubu',
        });
      }
    }),

  /**
   * Get league table for a club
   */
  getLeagueTable: protectedProcedure
    .input(z.object({
      clubUrl: z.string().url(),
    }))
    .query(async ({ input }) => {
      try {
        const table = await getLeagueTable(input.clubUrl);
        return {
          table,
          season: '2025/2026',
          fetchedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[RegioWyniki] Get league table error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się pobrać tabeli ligowej',
        });
      }
    }),

  /**
   * Get match schedule for a club
   */
  getMatchSchedule: protectedProcedure
    .input(z.object({
      clubUrl: z.string().url(),
    }))
    .query(async ({ input }) => {
      try {
        const schedule = await getMatchSchedule(input.clubUrl);
        return {
          matches: schedule,
          season: '2025/2026',
          fetchedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[RegioWyniki] Get match schedule error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się pobrać terminarza',
        });
      }
    }),

  /**
   * Get all data for a club (details + table + schedule)
   */
  getFullClubData: protectedProcedure
    .input(z.object({
      clubUrl: z.string().url(),
    }))
    .query(async ({ input }) => {
      try {
        const data = await getFullClubData(input.clubUrl);
        return data;
      } catch (error) {
        console.error('[RegioWyniki] Get full club data error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się pobrać pełnych danych klubu',
        });
      }
    }),

  /**
   * Sync club data and save to database
   */
  syncClubData: protectedProcedure
    .input(z.object({
      clubId: z.number(),
      regiowynikUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data = await getFullClubData(input.regiowynikUrl);
        
        // In production, save to database here
        // await db.updateClubRegiowynikData(input.clubId, data);
        
        return {
          success: true,
          syncedAt: new Date().toISOString(),
          matchesCount: data.schedule.length,
          tablePosition: data.table.find(t => 
            t.teamName.toLowerCase().includes(data.details?.name?.toLowerCase() || '')
          )?.position || null,
        };
      } catch (error) {
        console.error('[RegioWyniki] Sync club data error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się zsynchronizować danych klubu',
        });
      }
    }),
});
