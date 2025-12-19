/**
 * RegioWyniki.pl Web Scraper Service
 * Fetches real club data, league tables, and match schedules
 * Season 2025/2026
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://regiowyniki.pl';

// Region mapping for URL construction
export const REGIONS = {
  'dolnoslaskie': 'Dolnośląskie',
  'kujawsko-pomorskie': 'Kujawsko-pomorskie',
  'lubelskie': 'Lubelskie',
  'lubuskie': 'Lubuskie',
  'lodzkie': 'Łódzkie',
  'malopolskie': 'Małopolskie',
  'mazowieckie': 'Mazowieckie',
  'opolskie': 'Opolskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'pomorskie': 'Pomorskie',
  'slaskie': 'Śląskie',
  'swietokrzyskie': 'Świętokrzyskie',
  'warminsko-mazurskie': 'Warmińsko-mazurskie',
  'wielkopolskie': 'Wielkopolskie',
  'zachodniopomorskie': 'Zachodniopomorskie',
} as const;

export interface ClubSearchResult {
  name: string;
  region: string;
  url: string;
  logoUrl?: string;
}

export interface LeagueTableEntry {
  position: number;
  teamName: string;
  teamUrl: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string[]; // Last 5-6 matches: 'W', 'D', 'L'
}

export interface MatchScheduleEntry {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  isHome: boolean;
  competition: string;
}

export interface ClubDetails {
  name: string;
  logoUrl?: string;
  founded?: string;
  colors?: string;
  address?: string;
  president?: string;
  phone?: string;
  league: string;
  region: string;
}

/**
 * Encode club name for URL
 */
function encodeClubName(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '_')
    .replace(/__+/g, '_');
}

/**
 * Search for clubs by name
 */
export async function searchClubs(query: string): Promise<ClubSearchResult[]> {
  try {
    const searchUrl = `${BASE_URL}/szukaj/Pilka_Nozna/?search_text=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmallClubManager/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: ClubSearchResult[] = [];

    // Parse search results
    $('a[href*="/druzyna/Pilka_Nozna/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const name = $(el).text().trim();
      
      if (name && href.includes('/druzyna/')) {
        // Extract region from URL
        const urlParts = href.split('/');
        const regionIndex = urlParts.indexOf('Pilka_Nozna') + 1;
        const region = regionIndex > 0 ? urlParts[regionIndex] : '';

        results.push({
          name,
          region: region.replace(/_/g, ' '),
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        });
      }
    });

    // Remove duplicates
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex((t) => t.name === item.name && t.region === item.region)
    );

    return uniqueResults.slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('[RegioWyniki] Search error:', error);
    return [];
  }
}

/**
 * Get club details from club page
 */
export async function getClubDetails(clubUrl: string): Promise<ClubDetails | null> {
  try {
    const response = await fetch(clubUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmallClubManager/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract club name from title
    const name = $('h1').first().text().replace('Terminarz', '').replace('Tabela', '').trim();

    // Extract logo URL
    const logoImg = $('img[src*="herb"], img[src*="logo"]').first();
    const logoUrl = logoImg.attr('src');

    // Extract club info
    const infoText = $('.club-info, .team-info').text();
    
    // Extract league from breadcrumb or page content
    const leagueText = $('h4, .league-name').text();
    const league = leagueText.match(/Liga|Klasa|Ekstraklasa|Okręgowa/i)?.[0] || 'Nieznana';

    // Extract region from URL
    const urlParts = clubUrl.split('/');
    const regionIndex = urlParts.indexOf('Pilka_Nozna') + 1;
    const region = regionIndex > 0 ? urlParts[regionIndex].replace(/_/g, ' ') : '';

    return {
      name,
      logoUrl: logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${BASE_URL}${logoUrl}`) : undefined,
      league,
      region,
    };
  } catch (error) {
    console.error('[RegioWyniki] Get club details error:', error);
    return null;
  }
}

/**
 * Get league table for a club
 */
export async function getLeagueTable(clubUrl: string): Promise<LeagueTableEntry[]> {
  try {
    const tableUrl = clubUrl.endsWith('/') ? `${clubUrl}tabela/` : `${clubUrl}/tabela/`;
    
    const response = await fetch(tableUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmallClubManager/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const entries: LeagueTableEntry[] = [];

    // Parse table rows - looking for the main standings table
    $('table tr, .standings-row, .table-row').each((index, el) => {
      const $row = $(el);
      const cells = $row.find('td, .cell');
      
      if (cells.length >= 7) {
        const position = parseInt(cells.eq(0).text().trim()) || index + 1;
        const teamCell = cells.eq(1);
        const teamName = teamCell.find('a').text().trim() || teamCell.text().trim();
        const teamUrl = teamCell.find('a').attr('href') || '';
        
        const points = parseInt(cells.eq(2).text().trim()) || 0;
        const matchesPlayed = parseInt(cells.eq(3).text().trim()) || 0;
        const wins = parseInt(cells.eq(4).text().trim()) || 0;
        const draws = parseInt(cells.eq(5).text().trim()) || 0;
        const losses = parseInt(cells.eq(6).text().trim()) || 0;
        
        // Goals format: "scored:conceded" or separate columns
        const goalsText = cells.eq(7).text().trim();
        let goalsFor = 0, goalsAgainst = 0;
        
        if (goalsText.includes(':')) {
          const [gf, ga] = goalsText.split(':').map(g => parseInt(g.trim()) || 0);
          goalsFor = gf;
          goalsAgainst = ga;
        }

        // Form - last matches
        const form: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $row.find('.form a, .form-indicator').each((_: number, formEl: any) => {
          const formText = $(formEl).text().trim().toUpperCase();
          if (['W', 'R', 'P', 'D', 'L'].includes(formText)) {
            // Convert Polish to English: W=Win, R=Draw, P=Loss
            const mapped = formText === 'R' ? 'D' : formText === 'P' ? 'L' : formText;
            form.push(mapped);
          }
        });

        if (teamName && position > 0) {
          entries.push({
            position,
            teamName,
            teamUrl: teamUrl.startsWith('http') ? teamUrl : `${BASE_URL}${teamUrl}`,
            points,
            matchesPlayed,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            goalDifference: goalsFor - goalsAgainst,
            form: form.slice(0, 5),
          });
        }
      }
    });

    // Sort by position
    entries.sort((a, b) => a.position - b.position);

    return entries;
  } catch (error) {
    console.error('[RegioWyniki] Get league table error:', error);
    return [];
  }
}

/**
 * Get match schedule for a club
 */
export async function getMatchSchedule(clubUrl: string): Promise<MatchScheduleEntry[]> {
  try {
    const response = await fetch(clubUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmallClubManager/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const matches: MatchScheduleEntry[] = [];

    // Extract club name for determining home/away
    const clubName = $('h1').first().text().replace('Terminarz', '').trim();

    // Parse match rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $('.match-row, .fixture, tr[class*="match"]').each((_: number, el: any) => {
      const $row = $(el);
      
      const dateText = $row.find('.date, .match-date, td:first-child').text().trim();
      const timeText = $row.find('.time, .match-time').text().trim();
      
      const homeTeam = $row.find('.home-team, .team-home').text().trim();
      const awayTeam = $row.find('.away-team, .team-away').text().trim();
      
      const scoreText = $row.find('.score, .result').text().trim();
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      
      if (scoreText.includes(':')) {
        const [hs, as] = scoreText.split(':').map((s: string) => parseInt(s.trim()));
        if (!isNaN(hs) && !isNaN(as)) {
          homeScore = hs;
          awayScore = as;
        }
      }

      const competition = $row.find('.competition, .league').text().trim() || 'Liga';

      if (homeTeam && awayTeam) {
        matches.push({
          date: dateText,
          time: timeText,
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          isHome: homeTeam.includes(clubName),
          competition,
        });
      }
    });

    return matches;
  } catch (error) {
    console.error('[RegioWyniki] Get match schedule error:', error);
    return [];
  }
}

/**
 * Get all data for a club (details + table + schedule)
 */
export async function getFullClubData(clubUrl: string) {
  const [details, table, schedule] = await Promise.all([
    getClubDetails(clubUrl),
    getLeagueTable(clubUrl),
    getMatchSchedule(clubUrl),
  ]);

  return {
    details,
    table,
    schedule,
    fetchedAt: new Date().toISOString(),
    season: '2025/2026',
  };
}
