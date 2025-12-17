/**
 * Unified League Data Scraping Service
 * Fetches league tables and match data from official football association websites
 */

import * as db from "../db";

// Data source configuration for each country
export interface DataSource {
  countryCode: string;
  name: string;
  baseUrl: string;
  apiAvailable: boolean;
  scrapingEnabled: boolean;
  lastSync?: Date;
}

export const DATA_SOURCES: DataSource[] = [
  // Poland - PZPN regional associations
  {
    countryCode: "PL",
    name: "PZPN (Wielkopolski ZPN)",
    baseUrl: "https://wielkopolskizpn.pl",
    apiAvailable: false,
    scrapingEnabled: true,
  },
  // Germany - DFB regional associations
  {
    countryCode: "DE",
    name: "DFB (Bayerischer FV)",
    baseUrl: "https://bfv.de",
    apiAvailable: false,
    scrapingEnabled: false,
  },
  // England - FA Full-Time system
  {
    countryCode: "GB",
    name: "FA Full-Time",
    baseUrl: "https://fulltime.thefa.com",
    apiAvailable: true,
    scrapingEnabled: true,
  },
  // Netherlands - KNVB
  {
    countryCode: "NL",
    name: "KNVB",
    baseUrl: "https://www.voetbal.nl",
    apiAvailable: true,
    scrapingEnabled: true,
  },
  // Belgium - KBVB
  {
    countryCode: "BE",
    name: "KBVB Voetbal Vlaanderen",
    baseUrl: "https://www.voetbalvlaanderen.be",
    apiAvailable: false,
    scrapingEnabled: false,
  },
  // Denmark - DBU
  {
    countryCode: "DK",
    name: "DBU",
    baseUrl: "https://www.dbu.dk",
    apiAvailable: false,
    scrapingEnabled: false,
  },
  // Sweden - SvFF
  {
    countryCode: "SE",
    name: "SvFF Fogis",
    baseUrl: "https://fogis.se",
    apiAvailable: true,
    scrapingEnabled: true,
  },
  // France - FFF
  {
    countryCode: "FR",
    name: "FFF",
    baseUrl: "https://fff.fr",
    apiAvailable: false,
    scrapingEnabled: false,
  },
  // Italy - FIGC
  {
    countryCode: "IT",
    name: "FIGC LND",
    baseUrl: "https://www.lnd.it",
    apiAvailable: false,
    scrapingEnabled: false,
  },
  // Spain - RFEF
  {
    countryCode: "ES",
    name: "RFEF",
    baseUrl: "https://www.rfef.es",
    apiAvailable: false,
    scrapingEnabled: false,
  },
];

// Unified team data structure
export interface LeagueTeam {
  externalId: string;
  name: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// Unified match data structure
export interface LeagueMatch {
  externalId: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
}

// League table response
export interface LeagueTableResponse {
  countryCode: string;
  regionCode: string;
  leagueLevel: number;
  leagueName: string;
  season: string;
  lastUpdated: Date;
  teams: LeagueTeam[];
}

// Match schedule response
export interface MatchScheduleResponse {
  countryCode: string;
  regionCode: string;
  leagueLevel: number;
  leagueName: string;
  season: string;
  lastUpdated: Date;
  matches: LeagueMatch[];
}

/**
 * Get available data sources
 */
export function getDataSources(enabledOnly = true): DataSource[] {
  if (enabledOnly) {
    return DATA_SOURCES.filter(ds => ds.scrapingEnabled);
  }
  return DATA_SOURCES;
}

/**
 * Get data source for country
 */
export function getDataSourceByCountry(countryCode: string): DataSource | undefined {
  return DATA_SOURCES.find(ds => ds.countryCode === countryCode);
}

/**
 * Fetch league table from FA Full-Time (England)
 * Uses their public API
 */
export async function fetchFAFullTimeTable(
  leagueId: string,
  season: string = "2024-25"
): Promise<LeagueTableResponse | null> {
  try {
    // FA Full-Time has a public API for league tables
    const url = `https://fulltime.thefa.com/api/league/${leagueId}/standings?season=${season}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SmallClubManager/1.0",
      },
    });
    
    if (!response.ok) {
      console.error(`[LeagueScraping] FA Full-Time API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Transform to unified format
    const teams: LeagueTeam[] = data.standings?.map((team: any, index: number) => ({
      externalId: team.teamId || `fa-${index}`,
      name: team.teamName,
      position: team.position || index + 1,
      played: team.played || 0,
      won: team.won || 0,
      drawn: team.drawn || 0,
      lost: team.lost || 0,
      goalsFor: team.goalsFor || 0,
      goalsAgainst: team.goalsAgainst || 0,
      goalDifference: team.goalDifference || 0,
      points: team.points || 0,
    })) || [];
    
    return {
      countryCode: "GB",
      regionCode: "FA",
      leagueLevel: 6,
      leagueName: data.leagueName || "Unknown League",
      season,
      lastUpdated: new Date(),
      teams,
    };
  } catch (error) {
    console.error("[LeagueScraping] FA Full-Time fetch error:", error);
    return null;
  }
}

/**
 * Fetch league table from KNVB (Netherlands)
 * Uses voetbal.nl public data
 */
export async function fetchKNVBTable(
  competitionId: string,
  season: string = "2024-25"
): Promise<LeagueTableResponse | null> {
  try {
    const url = `https://www.voetbal.nl/api/competition/${competitionId}/standings`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SmallClubManager/1.0",
      },
    });
    
    if (!response.ok) {
      console.error(`[LeagueScraping] KNVB API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    const teams: LeagueTeam[] = data.teams?.map((team: any, index: number) => ({
      externalId: team.id || `knvb-${index}`,
      name: team.name,
      position: team.rank || index + 1,
      played: team.matchesPlayed || 0,
      won: team.wins || 0,
      drawn: team.draws || 0,
      lost: team.losses || 0,
      goalsFor: team.goalsScored || 0,
      goalsAgainst: team.goalsConceded || 0,
      goalDifference: (team.goalsScored || 0) - (team.goalsConceded || 0),
      points: team.points || 0,
    })) || [];
    
    return {
      countryCode: "NL",
      regionCode: "KNVB",
      leagueLevel: 5,
      leagueName: data.competitionName || "Unknown League",
      season,
      lastUpdated: new Date(),
      teams,
    };
  } catch (error) {
    console.error("[LeagueScraping] KNVB fetch error:", error);
    return null;
  }
}

/**
 * Fetch league table from Fogis (Sweden)
 * Swedish football information system
 */
export async function fetchFogisTable(
  seriesId: string,
  season: string = "2024"
): Promise<LeagueTableResponse | null> {
  try {
    const url = `https://fogis.se/information/?scr=table&ftid=${seriesId}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "SmallClubManager/1.0",
      },
    });
    
    if (!response.ok) {
      console.error(`[LeagueScraping] Fogis error: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Parse HTML table (simplified - in production use cheerio)
    const teams: LeagueTeam[] = [];
    const tableRegex = /<tr[^>]*class="[^"]*tabell[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    let position = 1;
    
    while ((match = tableRegex.exec(html)) !== null) {
      const row = match[1];
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      
      if (cells.length >= 10) {
        const extractText = (cell: string) => cell.replace(/<[^>]+>/g, "").trim();
        
        teams.push({
          externalId: `fogis-${position}`,
          name: extractText(cells[1]),
          position,
          played: parseInt(extractText(cells[2])) || 0,
          won: parseInt(extractText(cells[3])) || 0,
          drawn: parseInt(extractText(cells[4])) || 0,
          lost: parseInt(extractText(cells[5])) || 0,
          goalsFor: parseInt(extractText(cells[6]).split("-")[0]) || 0,
          goalsAgainst: parseInt(extractText(cells[6]).split("-")[1]) || 0,
          goalDifference: parseInt(extractText(cells[7])) || 0,
          points: parseInt(extractText(cells[8])) || 0,
        });
        position++;
      }
    }
    
    return {
      countryCode: "SE",
      regionCode: "SvFF",
      leagueLevel: 5,
      leagueName: "Division",
      season,
      lastUpdated: new Date(),
      teams,
    };
  } catch (error) {
    console.error("[LeagueScraping] Fogis fetch error:", error);
    return null;
  }
}

/**
 * Sync league data to database
 */
export async function syncLeagueToDatabase(
  table: LeagueTableResponse,
  clubId: string
): Promise<boolean> {
  try {
    // Find or create the league in pzpnLeagues table
    // This would need to be adapted to use a more generic leagues table
    
    console.log(`[LeagueScraping] Syncing ${table.teams.length} teams for ${table.leagueName}`);
    
    // In a full implementation, this would:
    // 1. Update/create league record
    // 2. Update/create team records
    // 3. Update standings
    // 4. Import upcoming matches
    
    return true;
  } catch (error) {
    console.error("[LeagueScraping] Database sync error:", error);
    return false;
  }
}

/**
 * Schedule automatic data sync
 * This would be called by a cron job
 */
export async function scheduledSync(): Promise<void> {
  console.log("[LeagueScraping] Starting scheduled sync...");
  
  const enabledSources = getDataSources(true);
  const results: { source: string; success: boolean; error?: string }[] = [];
  
  for (const source of enabledSources) {
    console.log(`[LeagueScraping] Syncing ${source.name}...`);
    
    try {
      let table: LeagueTableResponse | null = null;
      
      // Fetch data based on country
      switch (source.countryCode) {
        case "GB":
          // FA Full-Time API
          table = await fetchFAFullTimeTable("default-league");
          break;
        case "NL":
          // KNVB API
          table = await fetchKNVBTable("default-league");
          break;
        case "SE":
          // Fogis scraping
          table = await fetchFogisTable("default-league");
          break;
        default:
          console.log(`[LeagueScraping] No implementation for ${source.countryCode}`);
      }
      
      if (table && table.teams.length > 0) {
        results.push({ source: source.name, success: true });
        console.log(`[LeagueScraping] ${source.name}: ${table.teams.length} teams fetched`);
      } else {
        results.push({ source: source.name, success: false, error: "No data returned" });
      }
    } catch (error) {
      console.error(`[LeagueScraping] Error syncing ${source.name}:`, error);
      results.push({ source: source.name, success: false, error: String(error) });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`[LeagueScraping] Scheduled sync complete: ${successful} successful, ${failed} failed`);
}

/**
 * Fetch league data for a specific club
 */
export async function fetchLeagueDataForClub(
  countryCode: string,
  leagueId: string
): Promise<LeagueTableResponse | null> {
  const source = getDataSourceByCountry(countryCode);
  
  if (!source || !source.scrapingEnabled) {
    console.log(`[LeagueScraping] Source not available for ${countryCode}`);
    return null;
  }
  
  switch (countryCode) {
    case "GB":
      return fetchFAFullTimeTable(leagueId);
    case "NL":
      return fetchKNVBTable(leagueId);
    case "SE":
      return fetchFogisTable(leagueId);
    default:
      return null;
  }
}
