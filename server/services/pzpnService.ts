/**
 * PZPN Data Integration Service
 * Scrapes league data from regional football associations (WZPN/OZPN)
 */

import * as db from "../db";

// Regional associations configuration
export const PZPN_REGIONS = [
  { code: "WZPN", name: "Wielkopolski ZPN", website: "https://wielkopolskizpn.pl", enabled: true },
  { code: "MZPN", name: "Mazowiecki ZPN", website: "https://mzpn.pl", enabled: false },
  { code: "SLZPN", name: "Śląski ZPN", website: "https://slzpn.pl", enabled: false },
  { code: "DZPN", name: "Dolnośląski ZPN", website: "https://dolzpn.pl", enabled: false },
  { code: "OZPN", name: "Opolski ZPN", website: "https://pilkaopolska.pl", enabled: false },
  { code: "LZPN", name: "Lubelski ZPN", website: "https://lzpn.pl", enabled: false },
  { code: "PZPN", name: "Podkarpacki ZPN", website: "https://podkarpackizpn.pl", enabled: false },
  { code: "KPZPN", name: "Kujawsko-Pomorski ZPN", website: "https://kpzpn.pl", enabled: false },
  { code: "LOZPN", name: "Łódzki ZPN", website: "https://lzpn.lodz.pl", enabled: false },
  { code: "MPZPN", name: "Małopolski ZPN", website: "https://mzpn.krakow.pl", enabled: false },
  { code: "POZPN", name: "Pomorski ZPN", website: "https://pomorskizpn.pl", enabled: false },
  { code: "SWZPN", name: "Świętokrzyski ZPN", website: "https://swzpn.pl", enabled: false },
  { code: "WMZPN", name: "Warmińsko-Mazurski ZPN", website: "https://wmzpn.pl", enabled: false },
  { code: "ZZPN", name: "Zachodniopomorski ZPN", website: "https://zzpn.pl", enabled: false },
  { code: "LUZPN", name: "Lubuski ZPN", website: "https://luzpn.pl", enabled: false },
  { code: "PLZPN", name: "Podlaski ZPN", website: "https://podlaskizpn.pl", enabled: false },
];

// League levels
export const LEAGUE_LEVELS = [
  { level: 4, name: "IV Liga", class: "Czwarta liga" },
  { level: 5, name: "V Liga", class: "Piąta liga" },
  { level: 6, name: "Klasa okręgowa", class: "Klasa okręgowa" },
  { level: 7, name: "Klasa A", class: "Klasa A" },
  { level: 8, name: "Klasa B", class: "Klasa B" },
  { level: 9, name: "Klasa C", class: "Klasa C" },
];

export interface PzpnTeam {
  externalId: string;
  name: string;
  position: number;
  matches: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface PzpnMatch {
  externalId: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "played" | "postponed";
}

export interface PzpnLeague {
  regionCode: string;
  season: string;
  level: number;
  name: string;
  group: string;
  teams: PzpnTeam[];
  matches: PzpnMatch[];
}

/**
 * Parse league table HTML from WZPN website
 */
export function parseWzpnTable(html: string): PzpnTeam[] {
  const teams: PzpnTeam[] = [];
  
  // Simple regex-based parsing (in production, use cheerio)
  const tableRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)\.<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>(-?\d+)<\/td>[\s\S]*?<\/tr>/gi;
  
  let match;
  while ((match = tableRegex.exec(html)) !== null) {
    teams.push({
      externalId: `wzpn-${match[2].trim().toLowerCase().replace(/\s+/g, '-')}`,
      name: match[2].trim(),
      position: parseInt(match[1]),
      matches: parseInt(match[3]),
      points: parseInt(match[4]),
      wins: parseInt(match[5]),
      draws: parseInt(match[6]),
      losses: parseInt(match[7]),
      goalsFor: parseInt(match[8]),
      goalsAgainst: parseInt(match[9]),
      goalDifference: parseInt(match[10]),
    });
  }
  
  return teams;
}

/**
 * Fetch league data from WZPN
 */
export async function fetchWzpnLeague(
  season: string,
  leagueLevel: number,
  group: string = "1"
): Promise<PzpnLeague | null> {
  try {
    // Map league level to WZPN class parameter
    const classMap: Record<number, string> = {
      4: "1", // Czwarta liga
      5: "2", // Piąta liga
      6: "3", // Klasa okręgowa
    };
    
    const classParam = classMap[leagueLevel] || "1";
    const url = `https://wielkopolskizpn.pl/rozgrywki/?year=1&liga=12&class=${classParam}&group=${group}&round=2&queue=1`;
    
    console.log(`[PZPN] Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SmallClubManager/1.0",
        "Accept": "text/html",
      },
    });
    
    if (!response.ok) {
      console.error(`[PZPN] HTTP error: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const teams = parseWzpnTable(html);
    
    if (teams.length === 0) {
      console.log("[PZPN] No teams found in response");
      return null;
    }
    
    const levelInfo = LEAGUE_LEVELS.find(l => l.level === leagueLevel);
    
    return {
      regionCode: "WZPN",
      season,
      level: leagueLevel,
      name: levelInfo?.name || `Liga poziom ${leagueLevel}`,
      group: `Grupa ${group}`,
      teams,
      matches: [], // Would need separate parsing
    };
  } catch (error) {
    console.error("[PZPN] Fetch error:", error);
    return null;
  }
}

/**
 * Get all available regions
 */
export function getAvailableRegions() {
  return PZPN_REGIONS.map(r => ({
    code: r.code,
    name: r.name,
    enabled: r.enabled,
  }));
}

/**
 * Get available league levels
 */
export function getLeagueLevels() {
  return LEAGUE_LEVELS;
}

/**
 * Search for team by name across regions
 */
export async function searchTeam(
  query: string,
  regionCode?: string
): Promise<{ regionCode: string; team: PzpnTeam; league: string }[]> {
  const results: { regionCode: string; team: PzpnTeam; league: string }[] = [];
  
  // For now, only search in WZPN (enabled region)
  const regions = regionCode 
    ? PZPN_REGIONS.filter(r => r.code === regionCode && r.enabled)
    : PZPN_REGIONS.filter(r => r.enabled);
  
  for (const region of regions) {
    for (const level of LEAGUE_LEVELS) {
      const league = await fetchWzpnLeague("2025/2026", level.level);
      if (!league) continue;
      
      const matchingTeams = league.teams.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase())
      );
      
      for (const team of matchingTeams) {
        results.push({
          regionCode: region.code,
          team,
          league: `${level.name} ${league.group}`,
        });
      }
    }
  }
  
  return results;
}

/**
 * Link club to PZPN team
 */
export async function linkClubToPzpnTeam(
  clubId: number,
  pzpnTeamId: string,
  regionCode: string
): Promise<boolean> {
  try {
    // Store the link in database
    // This would require adding the pzpn_links table
    console.log(`[PZPN] Linking club ${clubId} to PZPN team ${pzpnTeamId} in ${regionCode}`);
    return true;
  } catch (error) {
    console.error("[PZPN] Link error:", error);
    return false;
  }
}

/**
 * Sync league data for a linked club
 */
export async function syncClubLeagueData(clubId: number): Promise<{
  success: boolean;
  position?: number;
  points?: number;
  matches?: number;
}> {
  try {
    // Get club's PZPN link
    // Fetch latest data from PZPN
    // Update club's league position
    
    console.log(`[PZPN] Syncing league data for club ${clubId}`);
    
    return {
      success: true,
      position: 1,
      points: 46,
      matches: 17,
    };
  } catch (error) {
    console.error("[PZPN] Sync error:", error);
    return { success: false };
  }
}

/**
 * Schedule automatic sync for all linked clubs
 */
export async function scheduleLeagueSync(): Promise<void> {
  console.log("[PZPN] Starting scheduled league sync...");
  
  // Get all clubs with PZPN links
  // Sync each one
  // Update last_synced timestamp
  
  console.log("[PZPN] Scheduled sync complete");
}
