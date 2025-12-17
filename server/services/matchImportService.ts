/**
 * Match Import Service
 * Imports official match schedules from league data into club calendar
 */

import * as db from "../db";
import { LeagueMatch, getDataSourceByCountry } from "./leagueScrapingService";

export interface ImportedMatch {
  id: number;
  date: Date;
  time: string;
  opponent: string;
  isHome: boolean;
  venue?: string;
  leagueName?: string;
  source?: string;
}

export interface MatchImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Import matches from league schedule to club calendar
 */
export async function importLeagueMatches(
  clubId: number,
  teamName: string,
  matches: LeagueMatch[],
  leagueName: string,
  source: string
): Promise<MatchImportResult> {
  const result: MatchImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const match of matches) {
    try {
      // Determine if this match involves our team
      const isHomeTeam = match.homeTeam.toLowerCase().includes(teamName.toLowerCase());
      const isAwayTeam = match.awayTeam.toLowerCase().includes(teamName.toLowerCase());

      if (!isHomeTeam && !isAwayTeam) {
        // Match doesn't involve our team
        continue;
      }

      // Parse date
      const matchDate = new Date(match.date);

      // Create match in database using existing schema
      await db.createMatch({
        clubId,
        opponent: isHomeTeam ? match.awayTeam : match.homeTeam,
        matchDate,
        matchTime: match.time || "15:00",
        location: match.venue || (isHomeTeam ? "Dom" : "Wyjazd"),
        homeAway: isHomeTeam ? "home" : "away",
        goalsScored: match.homeScore !== null && isHomeTeam ? match.homeScore : 
                     match.awayScore !== null && !isHomeTeam ? match.awayScore : 0,
        goalsConceded: match.awayScore !== null && isHomeTeam ? match.awayScore :
                       match.homeScore !== null && !isHomeTeam ? match.homeScore : 0,
        notes: `Imported from ${source} - ${leagueName}`,
      });

      result.imported++;
    } catch (error) {
      result.errors.push(`Failed to import match: ${error}`);
    }
  }

  return result;
}

/**
 * Sync club matches with official league schedule
 */
export async function syncClubMatches(
  clubId: number,
  countryCode: string,
  regionCode: string,
  leagueLevel: number,
  teamName: string
): Promise<MatchImportResult> {
  const source = getDataSourceByCountry(countryCode);
  
  if (!source || !source.scrapingEnabled) {
    return {
      imported: 0,
      skipped: 0,
      errors: [`Data source not available for country: ${countryCode}`],
    };
  }

  // In production, this would fetch matches from the appropriate API
  console.log(`[MatchImport] Syncing matches for ${teamName} in ${countryCode}/${regionCode}`);
  
  return {
    imported: 0,
    skipped: 0,
    errors: [],
  };
}

/**
 * Get upcoming matches for a club
 */
export async function getUpcomingMatches(
  clubId: number,
  limit: number = 5
): Promise<ImportedMatch[]> {
  const matches = await db.getMatchesByClubId(clubId);
  const now = new Date();
  
  return matches
    .filter((m) => new Date(m.matchDate) > now)
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      date: new Date(m.matchDate),
      time: m.matchTime || "15:00",
      opponent: m.opponent,
      isHome: m.homeAway === "home",
      venue: m.location || undefined,
      leagueName: m.notes?.includes("Imported") ? m.notes.split(" - ")[1] : undefined,
      source: m.notes?.includes("Imported") ? "official" : "manual",
    }));
}

/**
 * Update match result
 */
export async function updateMatchResult(
  matchId: number,
  goalsScored: number,
  goalsConceded: number
): Promise<boolean> {
  try {
    const result = goalsScored > goalsConceded ? "win" : 
                   goalsScored < goalsConceded ? "loss" : "draw";
    
    await db.updateMatch(matchId, {
      goalsScored,
      goalsConceded,
      result,
    });
    return true;
  } catch (error) {
    console.error(`[MatchImport] Failed to update match ${matchId}:`, error);
    return false;
  }
}
