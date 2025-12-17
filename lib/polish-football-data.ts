/**
 * Polish Football Structure Data
 * Hierarchical: Województwo → Okręg (OZPN) → Liga → Klub
 */

export interface District {
  code: string;
  name: string;
  ozpnName: string; // Official OZPN name
}

export interface League {
  code: string;
  name: string;
  level: number;
  districtCode?: string; // For regional leagues
}

export interface Club {
  id: string;
  name: string;
  city: string;
  districtCode: string;
  leagueCode: string;
  logoUrl?: string;
}

export interface LeagueStanding {
  position: number;
  clubId: string;
  clubName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface SeasonData {
  season: string;
  leagueName: string;
  standings: LeagueStanding[];
  lastUpdated: string;
}

// Województwa (Regions)
export const REGIONS = [
  { code: 'dolnoslaskie', name: 'Dolnośląskie' },
  { code: 'kujawsko-pomorskie', name: 'Kujawsko-Pomorskie' },
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
  { code: 'warminsko-mazurskie', name: 'Warmińsko-Mazurskie' },
  { code: 'wielkopolskie', name: 'Wielkopolskie' },
  { code: 'zachodniopomorskie', name: 'Zachodniopomorskie' },
];

// Okręgi (Districts/OZPN) per Region
export const DISTRICTS: Record<string, District[]> = {
  'dolnoslaskie': [
    { code: 'wroclaw', name: 'Wrocław', ozpnName: 'OZPN Wrocław' },
    { code: 'legnica', name: 'Legnica', ozpnName: 'OZPN Legnica' },
    { code: 'walbrzych', name: 'Wałbrzych', ozpnName: 'OZPN Wałbrzych' },
  ],
  'kujawsko-pomorskie': [
    { code: 'bydgoszcz', name: 'Bydgoszcz', ozpnName: 'OZPN Bydgoszcz' },
    { code: 'torun', name: 'Toruń', ozpnName: 'OZPN Toruń' },
    { code: 'wloclawek', name: 'Włocławek', ozpnName: 'OZPN Włocławek' },
  ],
  'lubelskie': [
    { code: 'lublin', name: 'Lublin', ozpnName: 'OZPN Lublin' },
    { code: 'zamosc', name: 'Zamość', ozpnName: 'OZPN Zamość' },
    { code: 'chelm', name: 'Chełm', ozpnName: 'OZPN Chełm' },
    { code: 'biala-podlaska', name: 'Biała Podlaska', ozpnName: 'OZPN Biała Podlaska' },
  ],
  'lubuskie': [
    { code: 'zielona-gora', name: 'Zielona Góra', ozpnName: 'OZPN Zielona Góra' },
    { code: 'gorzow', name: 'Gorzów Wlkp.', ozpnName: 'OZPN Gorzów Wlkp.' },
  ],
  'lodzkie': [
    { code: 'lodz', name: 'Łódź', ozpnName: 'OZPN Łódź' },
    { code: 'piotrkow', name: 'Piotrków Trybunalski', ozpnName: 'OZPN Piotrków Tryb.' },
    { code: 'sieradz', name: 'Sieradz', ozpnName: 'OZPN Sieradz' },
    { code: 'skierniewice', name: 'Skierniewice', ozpnName: 'OZPN Skierniewice' },
  ],
  'malopolskie': [
    { code: 'krakow', name: 'Kraków', ozpnName: 'OZPN Kraków' },
    { code: 'tarnow', name: 'Tarnów', ozpnName: 'OZPN Tarnów' },
    { code: 'nowy-sacz', name: 'Nowy Sącz', ozpnName: 'OZPN Nowy Sącz' },
  ],
  'mazowieckie': [
    { code: 'warszawa', name: 'Warszawa', ozpnName: 'MZPN Warszawa' },
    { code: 'radom', name: 'Radom', ozpnName: 'OZPN Radom' },
    { code: 'siedlce', name: 'Siedlce', ozpnName: 'OZPN Siedlce' },
    { code: 'plock', name: 'Płock', ozpnName: 'OZPN Płock' },
    { code: 'ciechanow', name: 'Ciechanów', ozpnName: 'OZPN Ciechanów' },
  ],
  'opolskie': [
    { code: 'opole', name: 'Opole', ozpnName: 'OZPN Opole' },
  ],
  'podkarpackie': [
    { code: 'rzeszow', name: 'Rzeszów', ozpnName: 'OZPN Rzeszów' },
    { code: 'przemysl', name: 'Przemyśl', ozpnName: 'OZPN Przemyśl' },
    { code: 'krosno', name: 'Krosno', ozpnName: 'OZPN Krosno' },
    { code: 'tarnobrzeg', name: 'Tarnobrzeg', ozpnName: 'OZPN Tarnobrzeg' },
  ],
  'podlaskie': [
    { code: 'bialystok', name: 'Białystok', ozpnName: 'OZPN Białystok' },
    { code: 'lomza', name: 'Łomża', ozpnName: 'OZPN Łomża' },
    { code: 'suwalki', name: 'Suwałki', ozpnName: 'OZPN Suwałki' },
  ],
  'pomorskie': [
    { code: 'gdansk', name: 'Gdańsk', ozpnName: 'PZPN Gdańsk' },
    { code: 'slupsk', name: 'Słupsk', ozpnName: 'OZPN Słupsk' },
  ],
  'slaskie': [
    { code: 'katowice', name: 'Katowice', ozpnName: 'ŚZPN Katowice' },
    { code: 'czestochowa', name: 'Częstochowa', ozpnName: 'OZPN Częstochowa' },
    { code: 'bielsko-biala', name: 'Bielsko-Biała', ozpnName: 'OZPN Bielsko-Biała' },
    { code: 'rybnik', name: 'Rybnik', ozpnName: 'OZPN Rybnik' },
  ],
  'swietokrzyskie': [
    { code: 'kielce', name: 'Kielce', ozpnName: 'ŚZPN Kielce' },
  ],
  'warminsko-mazurskie': [
    { code: 'olsztyn', name: 'Olsztyn', ozpnName: 'WZPN Olsztyn' },
    { code: 'elblag', name: 'Elbląg', ozpnName: 'OZPN Elbląg' },
  ],
  'wielkopolskie': [
    { code: 'poznan', name: 'Poznań', ozpnName: 'WZPN Poznań' },
    { code: 'kalisz', name: 'Kalisz', ozpnName: 'OZPN Kalisz' },
    { code: 'leszno', name: 'Leszno', ozpnName: 'OZPN Leszno' },
    { code: 'konin', name: 'Konin', ozpnName: 'OZPN Konin' },
    { code: 'pila', name: 'Piła', ozpnName: 'OZPN Piła' },
  ],
  'zachodniopomorskie': [
    { code: 'szczecin', name: 'Szczecin', ozpnName: 'ZZPN Szczecin' },
    { code: 'koszalin', name: 'Koszalin', ozpnName: 'OZPN Koszalin' },
  ],
};

// League levels per district
export const LEAGUES: Record<string, League[]> = {
  // Central leagues (all districts)
  '_central': [
    { code: 'ekstraklasa', name: 'Ekstraklasa', level: 1 },
    { code: '1-liga', name: '1. Liga', level: 2 },
    { code: '2-liga', name: '2. Liga', level: 3 },
    { code: '3-liga', name: '3. Liga', level: 4 },
  ],
  // Regional leagues template (applied per district)
  '_regional': [
    { code: '4-liga', name: '4. Liga', level: 5 },
    { code: 'klasa-okregowa', name: 'Klasa Okręgowa', level: 6 },
    { code: 'klasa-a', name: 'Klasa A', level: 7 },
    { code: 'klasa-b', name: 'Klasa B', level: 8 },
    { code: 'klasa-c', name: 'Klasa C', level: 9 },
  ],
};

// Sample clubs data per district and league
export const CLUBS_DATA: Record<string, Club[]> = {
  'poznan': [
    { id: 'lech-poznan', name: 'Lech Poznań', city: 'Poznań', districtCode: 'poznan', leagueCode: 'ekstraklasa' },
    { id: 'warta-poznan', name: 'Warta Poznań', city: 'Poznań', districtCode: 'poznan', leagueCode: '1-liga' },
    { id: 'olimpia-poznan', name: 'Olimpia Poznań', city: 'Poznań', districtCode: 'poznan', leagueCode: '3-liga' },
    { id: 'huragan-pobiedziska', name: 'Huragan Pobiedziska', city: 'Pobiedziska', districtCode: 'poznan', leagueCode: '4-liga' },
    { id: 'sokol-kleczew', name: 'Sokół Kleczew', city: 'Kleczew', districtCode: 'poznan', leagueCode: 'klasa-okregowa' },
    { id: 'orlik-mosina', name: 'Orlik Mosina', city: 'Mosina', districtCode: 'poznan', leagueCode: 'klasa-a' },
  ],
  'warszawa': [
    { id: 'legia-warszawa', name: 'Legia Warszawa', city: 'Warszawa', districtCode: 'warszawa', leagueCode: 'ekstraklasa' },
    { id: 'polonia-warszawa', name: 'Polonia Warszawa', city: 'Warszawa', districtCode: 'warszawa', leagueCode: '2-liga' },
    { id: 'swit-nowy-dwor', name: 'Świt Nowy Dwór Maz.', city: 'Nowy Dwór Maz.', districtCode: 'warszawa', leagueCode: '3-liga' },
    { id: 'legionovia', name: 'Legionovia Legionowo', city: 'Legionowo', districtCode: 'warszawa', leagueCode: '4-liga' },
    { id: 'mazur-karczew', name: 'Mazur Karczew', city: 'Karczew', districtCode: 'warszawa', leagueCode: 'klasa-okregowa' },
  ],
  'katowice': [
    { id: 'gornik-zabrze', name: 'Górnik Zabrze', city: 'Zabrze', districtCode: 'katowice', leagueCode: 'ekstraklasa' },
    { id: 'piast-gliwice', name: 'Piast Gliwice', city: 'Gliwice', districtCode: 'katowice', leagueCode: 'ekstraklasa' },
    { id: 'gks-katowice', name: 'GKS Katowice', city: 'Katowice', districtCode: 'katowice', leagueCode: 'ekstraklasa' },
    { id: 'ruch-chorzow', name: 'Ruch Chorzów', city: 'Chorzów', districtCode: 'katowice', leagueCode: '1-liga' },
    { id: 'gks-tychy', name: 'GKS Tychy', city: 'Tychy', districtCode: 'katowice', leagueCode: '2-liga' },
    { id: 'rozwoj-katowice', name: 'Rozwój Katowice', city: 'Katowice', districtCode: 'katowice', leagueCode: '3-liga' },
    { id: 'victoria-jaworzno', name: 'Victoria Jaworzno', city: 'Jaworzno', districtCode: 'katowice', leagueCode: '4-liga' },
  ],
  'krakow': [
    { id: 'cracovia', name: 'Cracovia', city: 'Kraków', districtCode: 'krakow', leagueCode: 'ekstraklasa' },
    { id: 'wisla-krakow', name: 'Wisła Kraków', city: 'Kraków', districtCode: 'krakow', leagueCode: '1-liga' },
    { id: 'hutnik-krakow', name: 'Hutnik Kraków', city: 'Kraków', districtCode: 'krakow', leagueCode: '2-liga' },
    { id: 'garbarnia-krakow', name: 'Garbarnia Kraków', city: 'Kraków', districtCode: 'krakow', leagueCode: '3-liga' },
    { id: 'wisloka-debica', name: 'Wisłoka Dębica', city: 'Dębica', districtCode: 'krakow', leagueCode: '4-liga' },
  ],
  'gdansk': [
    { id: 'lechia-gdansk', name: 'Lechia Gdańsk', city: 'Gdańsk', districtCode: 'gdansk', leagueCode: 'ekstraklasa' },
    { id: 'arka-gdynia', name: 'Arka Gdynia', city: 'Gdynia', districtCode: 'gdansk', leagueCode: '2-liga' },
    { id: 'bałtyk-gdynia', name: 'Bałtyk Gdynia', city: 'Gdynia', districtCode: 'gdansk', leagueCode: '3-liga' },
    { id: 'gedania-gdansk', name: 'Gedania Gdańsk', city: 'Gdańsk', districtCode: 'gdansk', leagueCode: '4-liga' },
  ],
  'wroclaw': [
    { id: 'slask-wroclaw', name: 'Śląsk Wrocław', city: 'Wrocław', districtCode: 'wroclaw', leagueCode: 'ekstraklasa' },
    { id: 'zaglebie-lubin', name: 'Zagłębie Lubin', city: 'Lubin', districtCode: 'wroclaw', leagueCode: 'ekstraklasa' },
    { id: 'miedz-legnica', name: 'Miedź Legnica', city: 'Legnica', districtCode: 'wroclaw', leagueCode: '1-liga' },
    { id: 'chrobry-glogow', name: 'Chrobry Głogów', city: 'Głogów', districtCode: 'wroclaw', leagueCode: '2-liga' },
  ],
  'lodz': [
    { id: 'widzew-lodz', name: 'Widzew Łódź', city: 'Łódź', districtCode: 'lodz', leagueCode: 'ekstraklasa' },
    { id: 'lks-lodz', name: 'ŁKS Łódź', city: 'Łódź', districtCode: 'lodz', leagueCode: '2-liga' },
    { id: 'pelikan-lowicz', name: 'Pelikan Łowicz', city: 'Łowicz', districtCode: 'lodz', leagueCode: '3-liga' },
    { id: 'rks-radomsko', name: 'RKS Radomsko', city: 'Radomsko', districtCode: 'lodz', leagueCode: '4-liga' },
  ],
  'bialystok': [
    { id: 'jagiellonia', name: 'Jagiellonia Białystok', city: 'Białystok', districtCode: 'bialystok', leagueCode: 'ekstraklasa' },
    { id: 'wigry-suwalki', name: 'Wigry Suwałki', city: 'Suwałki', districtCode: 'bialystok', leagueCode: '2-liga' },
    { id: 'sokol-siemiatycze', name: 'Sokół Siemiatycze', city: 'Siemiatycze', districtCode: 'bialystok', leagueCode: '4-liga' },
  ],
  'szczecin': [
    { id: 'pogon-szczecin', name: 'Pogoń Szczecin', city: 'Szczecin', districtCode: 'szczecin', leagueCode: 'ekstraklasa' },
    { id: 'flota-swinoujscie', name: 'Flota Świnoujście', city: 'Świnoujście', districtCode: 'szczecin', leagueCode: '3-liga' },
    { id: 'vineta-wolin', name: 'Vineta Wolin', city: 'Wolin', districtCode: 'szczecin', leagueCode: '4-liga' },
  ],
  'lublin': [
    { id: 'motor-lublin', name: 'Motor Lublin', city: 'Lublin', districtCode: 'lublin', leagueCode: 'ekstraklasa' },
    { id: 'gornik-leczna', name: 'Górnik Łęczna', city: 'Łęczna', districtCode: 'lublin', leagueCode: '2-liga' },
    { id: 'lublinianka', name: 'Lublinianka Lublin', city: 'Lublin', districtCode: 'lublin', leagueCode: '4-liga' },
  ],
  'kielce': [
    { id: 'korona-kielce', name: 'Korona Kielce', city: 'Kielce', districtCode: 'kielce', leagueCode: '1-liga' },
    { id: 'star-starachowice', name: 'Star Starachowice', city: 'Starachowice', districtCode: 'kielce', leagueCode: '3-liga' },
    { id: 'spartakus-daleszyce', name: 'Spartakus Daleszyce', city: 'Daleszyce', districtCode: 'kielce', leagueCode: '4-liga' },
  ],
  'czestochowa': [
    { id: 'rakow-czestochowa', name: 'Raków Częstochowa', city: 'Częstochowa', districtCode: 'czestochowa', leagueCode: 'ekstraklasa' },
    { id: 'skra-czestochowa', name: 'Skra Częstochowa', city: 'Częstochowa', districtCode: 'czestochowa', leagueCode: '3-liga' },
  ],
};

// Current season standings (sample data)
export const CURRENT_SEASON = '2024/2025';

export function getSeasonData(clubId: string): SeasonData | null {
  const club = Object.values(CLUBS_DATA).flat().find(c => c.id === clubId);
  if (!club) return null;

  // Generate sample standings based on league
  const leagueClubs = Object.values(CLUBS_DATA).flat().filter(c => c.leagueCode === club.leagueCode);
  
  // Add more clubs to fill the league
  const teamCount = club.leagueCode === 'ekstraklasa' ? 18 : 
                    club.leagueCode === '1-liga' ? 18 :
                    club.leagueCode === '2-liga' ? 18 :
                    club.leagueCode === '3-liga' ? 18 : 16;
  
  const standings: LeagueStanding[] = [];
  const matchesPlayed = Math.floor(Math.random() * 10) + 10;
  
  for (let i = 0; i < teamCount; i++) {
    const existingClub = leagueClubs[i];
    const wins = Math.max(0, teamCount - i - Math.floor(Math.random() * 4));
    const draws = Math.floor(Math.random() * 5);
    const losses = matchesPlayed - wins - draws;
    const goalsFor = wins * 2 + draws + Math.floor(Math.random() * 8);
    const goalsAgainst = losses * 2 + draws + Math.floor(Math.random() * 6);
    
    standings.push({
      position: i + 1,
      clubId: existingClub?.id || `team-${i + 1}`,
      clubName: existingClub?.name || `Drużyna ${i + 1}`,
      matches: matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points: wins * 3 + draws,
      form: generateForm(),
    });
  }
  
  // Sort by points
  standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  standings.forEach((s, i) => s.position = i + 1);
  
  // Make sure the selected club is in the standings
  const clubIndex = standings.findIndex(s => s.clubId === clubId);
  if (clubIndex === -1) {
    const randomPos = Math.floor(Math.random() * teamCount);
    standings[randomPos].clubId = clubId;
    standings[randomPos].clubName = club.name;
  }
  
  const leagueName = LEAGUES['_central'].find(l => l.code === club.leagueCode)?.name ||
                     LEAGUES['_regional'].find(l => l.code === club.leagueCode)?.name ||
                     club.leagueCode;

  return {
    season: CURRENT_SEASON,
    leagueName,
    standings,
    lastUpdated: new Date().toISOString(),
  };
}

function generateForm(): ('W' | 'D' | 'L')[] {
  const results: ('W' | 'D' | 'L')[] = ['W', 'D', 'L'];
  return Array.from({ length: 5 }, () => results[Math.floor(Math.random() * 3)]);
}

// Helper functions
export function getRegions() {
  return REGIONS;
}

export function getDistrictsForRegion(regionCode: string): District[] {
  return DISTRICTS[regionCode] || [];
}

export function getLeaguesForDistrict(districtCode: string): League[] {
  // Return both central and regional leagues
  return [...LEAGUES['_central'], ...LEAGUES['_regional'].map(l => ({ ...l, districtCode }))];
}

export function getClubsForDistrictAndLeague(districtCode: string, leagueCode: string): Club[] {
  const clubs = CLUBS_DATA[districtCode] || [];
  return clubs.filter(c => c.leagueCode === leagueCode);
}

export function getClubById(clubId: string): Club | undefined {
  return Object.values(CLUBS_DATA).flat().find(c => c.id === clubId);
}

export function searchClubsByName(query: string, districtCode?: string): Club[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length < 2) return [];
  
  let clubs = Object.values(CLUBS_DATA).flat();
  
  if (districtCode) {
    clubs = clubs.filter(c => c.districtCode === districtCode);
  }
  
  return clubs.filter(c => 
    c.name.toLowerCase().includes(normalizedQuery) ||
    c.city.toLowerCase().includes(normalizedQuery)
  ).slice(0, 15);
}
