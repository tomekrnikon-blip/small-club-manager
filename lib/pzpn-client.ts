/**
 * PZPN Client - Club search and league table integration
 * Uses RegioWyniki.pl/Superscore as data source
 */

// Polish regions (województwa)
export const POLISH_REGIONS = [
  { code: 'dolnoslaskie', name: 'Dolnośląskie' },
  { code: 'kujawsko-pomorskie', name: 'Kujawsko-pomorskie' },
  { code: 'lubelskie', name: 'Lubelskie' },
  { code: 'lubuskie', name: 'Lubuskie' },
  { code: 'lodzkie', name: 'Łódzkie' },
  { code: 'malopolskie', name: 'Małopolskie' },
  { code: 'mazowieckie', name: 'Mazowieckie' },
  { code: 'opolskie', name: 'Opolskie' },
  { code: 'podkarpackie', name: 'Podkarpackie' },
  { code: 'podlaskie', name: 'Podlaskie' },
  { code: 'pomorskie', name: 'Pomorskie' },
  { code: 'slaskie', name: 'Śląskie' },
  { code: 'swietokrzyskie', name: 'Świętokrzyskie' },
  { code: 'warminsko-mazurskie', name: 'Warmińsko-mazurskie' },
  { code: 'wielkopolskie', name: 'Wielkopolskie' },
  { code: 'zachodniopomorskie', name: 'Zachodniopomorskie' },
];

// League levels
export const LEAGUE_LEVELS = [
  { level: 1, name: 'Ekstraklasa', class: 'ekstraklasa' },
  { level: 2, name: '1. Liga', class: '1-liga' },
  { level: 3, name: '2. Liga', class: '2-liga' },
  { level: 4, name: '3. Liga', class: '3-liga' },
  { level: 5, name: '4. Liga', class: '4-liga' },
  { level: 6, name: 'Klasa okręgowa', class: 'klasa-okregowa' },
  { level: 7, name: 'Klasa A', class: 'klasa-a' },
  { level: 8, name: 'Klasa B', class: 'klasa-b' },
];

export interface PzpnClubSearchResult {
  id: string;
  name: string;
  region: string;
  regionCode: string;
  league: string;
  logoUrl?: string;
}

export interface PzpnTeamStanding {
  position: number;
  teamName: string;
  teamId: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[]; // Last 5 results: 'W', 'D', 'L'
}

export interface PzpnLeagueTable {
  leagueName: string;
  season: string;
  lastUpdated: string;
  standings: PzpnTeamStanding[];
}

// Sample clubs data for demo (in production, this would be fetched from server)
const SAMPLE_CLUBS: PzpnClubSearchResult[] = [
  { id: 'lech-poznan', name: 'Lech Poznań', region: 'Wielkopolskie', regionCode: 'wielkopolskie', league: 'Ekstraklasa' },
  { id: 'warta-poznan', name: 'Warta Poznań', region: 'Wielkopolskie', regionCode: 'wielkopolskie', league: '1. Liga' },
  { id: 'lks-lodz', name: 'ŁKS Łódź', region: 'Łódzkie', regionCode: 'lodzkie', league: '2. Liga' },
  { id: 'widzew-lodz', name: 'Widzew Łódź', region: 'Łódzkie', regionCode: 'lodzkie', league: 'Ekstraklasa' },
  { id: 'legia-warszawa', name: 'Legia Warszawa', region: 'Mazowieckie', regionCode: 'mazowieckie', league: 'Ekstraklasa' },
  { id: 'polonia-warszawa', name: 'Polonia Warszawa', region: 'Mazowieckie', regionCode: 'mazowieckie', league: '2. Liga' },
  { id: 'slask-wroclaw', name: 'Śląsk Wrocław', region: 'Dolnośląskie', regionCode: 'dolnoslaskie', league: 'Ekstraklasa' },
  { id: 'zaglebie-lubin', name: 'Zagłębie Lubin', region: 'Dolnośląskie', regionCode: 'dolnoslaskie', league: 'Ekstraklasa' },
  { id: 'gornik-zabrze', name: 'Górnik Zabrze', region: 'Śląskie', regionCode: 'slaskie', league: 'Ekstraklasa' },
  { id: 'piast-gliwice', name: 'Piast Gliwice', region: 'Śląskie', regionCode: 'slaskie', league: 'Ekstraklasa' },
  { id: 'ruch-chorzow', name: 'Ruch Chorzów', region: 'Śląskie', regionCode: 'slaskie', league: '1. Liga' },
  { id: 'gks-katowice', name: 'GKS Katowice', region: 'Śląskie', regionCode: 'slaskie', league: 'Ekstraklasa' },
  { id: 'cracovia', name: 'Cracovia', region: 'Małopolskie', regionCode: 'malopolskie', league: 'Ekstraklasa' },
  { id: 'wisla-krakow', name: 'Wisła Kraków', region: 'Małopolskie', regionCode: 'malopolskie', league: '1. Liga' },
  { id: 'pogon-szczecin', name: 'Pogoń Szczecin', region: 'Zachodniopomorskie', regionCode: 'zachodniopomorskie', league: 'Ekstraklasa' },
  { id: 'lechia-gdansk', name: 'Lechia Gdańsk', region: 'Pomorskie', regionCode: 'pomorskie', league: 'Ekstraklasa' },
  { id: 'arka-gdynia', name: 'Arka Gdynia', region: 'Pomorskie', regionCode: 'pomorskie', league: '2. Liga' },
  { id: 'jagiellonia', name: 'Jagiellonia Białystok', region: 'Podlaskie', regionCode: 'podlaskie', league: 'Ekstraklasa' },
  { id: 'motor-lublin', name: 'Motor Lublin', region: 'Lubelskie', regionCode: 'lubelskie', league: 'Ekstraklasa' },
  { id: 'korona-kielce', name: 'Korona Kielce', region: 'Świętokrzyskie', regionCode: 'swietokrzyskie', league: '1. Liga' },
  // Lower league clubs
  { id: 'victoria-jaworzno', name: 'Victoria Jaworzno', region: 'Śląskie', regionCode: 'slaskie', league: '4. Liga' },
  { id: 'start-otwock', name: 'Start Otwock', region: 'Mazowieckie', regionCode: 'mazowieckie', league: 'Klasa okręgowa' },
  { id: 'orzel-myslowice', name: 'Orzeł Mysłowice', region: 'Śląskie', regionCode: 'slaskie', league: 'Klasa A' },
  { id: 'sokol-aleksandrow', name: 'Sokół Aleksandrów', region: 'Łódzkie', regionCode: 'lodzkie', league: 'Klasa B' },
];

// Sample league table for demo
const SAMPLE_LEAGUE_TABLE: PzpnLeagueTable = {
  leagueName: 'Ekstraklasa',
  season: '2024/2025',
  lastUpdated: new Date().toISOString(),
  standings: [
    { position: 1, teamName: 'Jagiellonia Białystok', teamId: 'jagiellonia', matches: 18, wins: 12, draws: 4, losses: 2, goalsFor: 35, goalsAgainst: 15, goalDifference: 20, points: 40, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 2, teamName: 'Lech Poznań', teamId: 'lech-poznan', matches: 18, wins: 11, draws: 5, losses: 2, goalsFor: 32, goalsAgainst: 14, goalDifference: 18, points: 38, form: ['W', 'D', 'W', 'W', 'D'] },
    { position: 3, teamName: 'Legia Warszawa', teamId: 'legia-warszawa', matches: 18, wins: 10, draws: 4, losses: 4, goalsFor: 30, goalsAgainst: 18, goalDifference: 12, points: 34, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 4, teamName: 'Raków Częstochowa', teamId: 'rakow', matches: 18, wins: 9, draws: 5, losses: 4, goalsFor: 28, goalsAgainst: 17, goalDifference: 11, points: 32, form: ['D', 'W', 'W', 'L', 'W'] },
    { position: 5, teamName: 'Pogoń Szczecin', teamId: 'pogon-szczecin', matches: 18, wins: 8, draws: 6, losses: 4, goalsFor: 25, goalsAgainst: 18, goalDifference: 7, points: 30, form: ['W', 'D', 'D', 'W', 'L'] },
    { position: 6, teamName: 'Cracovia', teamId: 'cracovia', matches: 18, wins: 8, draws: 5, losses: 5, goalsFor: 24, goalsAgainst: 19, goalDifference: 5, points: 29, form: ['L', 'W', 'D', 'W', 'W'] },
    { position: 7, teamName: 'Piast Gliwice', teamId: 'piast-gliwice', matches: 18, wins: 7, draws: 6, losses: 5, goalsFor: 22, goalsAgainst: 20, goalDifference: 2, points: 27, form: ['D', 'D', 'W', 'L', 'W'] },
    { position: 8, teamName: 'Górnik Zabrze', teamId: 'gornik-zabrze', matches: 18, wins: 7, draws: 5, losses: 6, goalsFor: 21, goalsAgainst: 21, goalDifference: 0, points: 26, form: ['W', 'L', 'D', 'W', 'L'] },
    { position: 9, teamName: 'Motor Lublin', teamId: 'motor-lublin', matches: 18, wins: 6, draws: 7, losses: 5, goalsFor: 20, goalsAgainst: 19, goalDifference: 1, points: 25, form: ['D', 'D', 'W', 'D', 'L'] },
    { position: 10, teamName: 'Śląsk Wrocław', teamId: 'slask-wroclaw', matches: 18, wins: 6, draws: 6, losses: 6, goalsFor: 19, goalsAgainst: 20, goalDifference: -1, points: 24, form: ['L', 'W', 'D', 'L', 'W'] },
    { position: 11, teamName: 'Widzew Łódź', teamId: 'widzew-lodz', matches: 18, wins: 5, draws: 7, losses: 6, goalsFor: 18, goalsAgainst: 21, goalDifference: -3, points: 22, form: ['D', 'L', 'D', 'W', 'D'] },
    { position: 12, teamName: 'Lechia Gdańsk', teamId: 'lechia-gdansk', matches: 18, wins: 5, draws: 6, losses: 7, goalsFor: 17, goalsAgainst: 22, goalDifference: -5, points: 21, form: ['L', 'D', 'W', 'L', 'D'] },
    { position: 13, teamName: 'Zagłębie Lubin', teamId: 'zaglebie-lubin', matches: 18, wins: 4, draws: 7, losses: 7, goalsFor: 16, goalsAgainst: 23, goalDifference: -7, points: 19, form: ['D', 'L', 'D', 'L', 'W'] },
    { position: 14, teamName: 'GKS Katowice', teamId: 'gks-katowice', matches: 18, wins: 4, draws: 6, losses: 8, goalsFor: 15, goalsAgainst: 24, goalDifference: -9, points: 18, form: ['L', 'D', 'L', 'W', 'L'] },
    { position: 15, teamName: 'Radomiak Radom', teamId: 'radomiak', matches: 18, wins: 3, draws: 6, losses: 9, goalsFor: 14, goalsAgainst: 26, goalDifference: -12, points: 15, form: ['L', 'L', 'D', 'L', 'D'] },
    { position: 16, teamName: 'Stal Mielec', teamId: 'stal-mielec', matches: 18, wins: 2, draws: 5, losses: 11, goalsFor: 12, goalsAgainst: 30, goalDifference: -18, points: 11, form: ['L', 'L', 'L', 'D', 'L'] },
  ],
};

/**
 * Search for clubs by name and optionally filter by region
 */
export async function searchClubs(
  query: string,
  regionCode?: string
): Promise<PzpnClubSearchResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const normalizedQuery = query.toLowerCase().trim();
  
  if (normalizedQuery.length < 2) {
    return [];
  }
  
  let results = SAMPLE_CLUBS.filter(club => 
    club.name.toLowerCase().includes(normalizedQuery)
  );
  
  if (regionCode) {
    results = results.filter(club => club.regionCode === regionCode);
  }
  
  return results.slice(0, 10); // Limit to 10 results
}

/**
 * Get league table for a specific team
 */
export async function getLeagueTable(teamId: string): Promise<PzpnLeagueTable | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo, return sample table if team is in Ekstraklasa
  const team = SAMPLE_CLUBS.find(c => c.id === teamId);
  if (team?.league === 'Ekstraklasa') {
    return SAMPLE_LEAGUE_TABLE;
  }
  
  // Generate a sample lower league table
  if (team) {
    return {
      leagueName: team.league,
      season: '2024/2025',
      lastUpdated: new Date().toISOString(),
      standings: generateSampleStandings(team.name, 12),
    };
  }
  
  return null;
}

/**
 * Get team details by ID
 */
export async function getTeamDetails(teamId: string): Promise<PzpnClubSearchResult | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return SAMPLE_CLUBS.find(c => c.id === teamId) || null;
}

/**
 * Generate sample standings for lower leagues
 */
function generateSampleStandings(teamName: string, teamCount: number): PzpnTeamStanding[] {
  const standings: PzpnTeamStanding[] = [];
  const teamPosition = Math.floor(Math.random() * teamCount) + 1;
  
  for (let i = 1; i <= teamCount; i++) {
    const isUserTeam = i === teamPosition;
    const matches = 15;
    const wins = Math.max(0, teamCount - i + Math.floor(Math.random() * 3));
    const draws = Math.floor(Math.random() * 5);
    const losses = matches - wins - draws;
    const goalsFor = wins * 2 + draws + Math.floor(Math.random() * 10);
    const goalsAgainst = losses * 2 + draws + Math.floor(Math.random() * 8);
    
    standings.push({
      position: i,
      teamName: isUserTeam ? teamName : `Drużyna ${i}`,
      teamId: isUserTeam ? teamName.toLowerCase().replace(/\s+/g, '-') : `team-${i}`,
      matches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
      form: ['W', 'D', 'L', 'W', 'D'].sort(() => Math.random() - 0.5).slice(0, 5),
    });
  }
  
  // Sort by points
  standings.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
  standings.forEach((s, i) => s.position = i + 1);
  
  return standings;
}

/**
 * Get all regions
 */
export function getRegions() {
  return POLISH_REGIONS;
}

/**
 * Get league levels
 */
export function getLeagueLevels() {
  return LEAGUE_LEVELS;
}
