/**
 * International League Data Service
 * Fetches league data from football associations across different countries
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  nameLocal: string;
  flag: string;
  association: string;
  associationCode: string;
  website: string;
  language: string;
  enabled: boolean;
  leagueLevels: LeagueLevel[];
}

export interface LeagueLevel {
  level: number;
  name: string;
  nameLocal: string;
  hasRegions: boolean;
}

export interface Region {
  code: string;
  name: string;
  website?: string;
}

// Supported countries with their football associations
export const COUNTRIES: Country[] = [
  {
    code: "PL",
    name: "Poland",
    nameLocal: "Polska",
    flag: "🇵🇱",
    association: "Polish Football Association",
    associationCode: "PZPN",
    website: "https://pzpn.pl",
    language: "pl",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Ekstraklasa", nameLocal: "Ekstraklasa", hasRegions: false },
      { level: 2, name: "I Liga", nameLocal: "I Liga", hasRegions: false },
      { level: 3, name: "II Liga", nameLocal: "II Liga", hasRegions: false },
      { level: 4, name: "III Liga", nameLocal: "III Liga", hasRegions: true },
      { level: 5, name: "IV Liga", nameLocal: "IV Liga", hasRegions: true },
      { level: 6, name: "V Liga", nameLocal: "V Liga (Klasa okręgowa)", hasRegions: true },
      { level: 7, name: "VI Liga", nameLocal: "Klasa A", hasRegions: true },
      { level: 8, name: "VII Liga", nameLocal: "Klasa B", hasRegions: true },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    nameLocal: "Deutschland",
    flag: "🇩🇪",
    association: "German Football Association",
    associationCode: "DFB",
    website: "https://dfb.de",
    language: "de",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Bundesliga", nameLocal: "Bundesliga", hasRegions: false },
      { level: 2, name: "2. Bundesliga", nameLocal: "2. Bundesliga", hasRegions: false },
      { level: 3, name: "3. Liga", nameLocal: "3. Liga", hasRegions: false },
      { level: 4, name: "Regionalliga", nameLocal: "Regionalliga", hasRegions: true },
      { level: 5, name: "Oberliga", nameLocal: "Oberliga", hasRegions: true },
      { level: 6, name: "Landesliga", nameLocal: "Landesliga", hasRegions: true },
      { level: 7, name: "Bezirksliga", nameLocal: "Bezirksliga", hasRegions: true },
      { level: 8, name: "Kreisliga", nameLocal: "Kreisliga", hasRegions: true },
    ],
  },
  {
    code: "CZ",
    name: "Czech Republic",
    nameLocal: "Česká republika",
    flag: "🇨🇿",
    association: "Football Association of the Czech Republic",
    associationCode: "FAČR",
    website: "https://facr.cz",
    language: "cs",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "First League", nameLocal: "Fortuna liga", hasRegions: false },
      { level: 2, name: "Second League", nameLocal: "Fortuna:Národní liga", hasRegions: false },
      { level: 3, name: "Third League", nameLocal: "ČFL / MSFL", hasRegions: true },
      { level: 4, name: "Fourth League", nameLocal: "Divize", hasRegions: true },
      { level: 5, name: "Fifth League", nameLocal: "Krajský přebor", hasRegions: true },
      { level: 6, name: "Sixth League", nameLocal: "I.A třída", hasRegions: true },
    ],
  },
  {
    code: "SK",
    name: "Slovakia",
    nameLocal: "Slovensko",
    flag: "🇸🇰",
    association: "Slovak Football Association",
    associationCode: "SFZ",
    website: "https://futbalsfz.sk",
    language: "sk",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Super Liga", nameLocal: "Niké liga", hasRegions: false },
      { level: 2, name: "Second League", nameLocal: "2. liga", hasRegions: false },
      { level: 3, name: "Third League", nameLocal: "3. liga", hasRegions: true },
      { level: 4, name: "Fourth League", nameLocal: "4. liga", hasRegions: true },
      { level: 5, name: "Fifth League", nameLocal: "5. liga", hasRegions: true },
    ],
  },
  {
    code: "AT",
    name: "Austria",
    nameLocal: "Österreich",
    flag: "🇦🇹",
    association: "Austrian Football Association",
    associationCode: "ÖFB",
    website: "https://oefb.at",
    language: "de",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Bundesliga", nameLocal: "Bundesliga", hasRegions: false },
      { level: 2, name: "2. Liga", nameLocal: "2. Liga", hasRegions: false },
      { level: 3, name: "Regionalliga", nameLocal: "Regionalliga", hasRegions: true },
      { level: 4, name: "Landesliga", nameLocal: "Landesliga", hasRegions: true },
      { level: 5, name: "Gebietsliga", nameLocal: "Gebietsliga", hasRegions: true },
    ],
  },
  {
    code: "HU",
    name: "Hungary",
    nameLocal: "Magyarország",
    flag: "🇭🇺",
    association: "Hungarian Football Federation",
    associationCode: "MLSZ",
    website: "https://mlsz.hu",
    language: "hu",
    enabled: false,
    leagueLevels: [
      { level: 1, name: "NB I", nameLocal: "NB I", hasRegions: false },
      { level: 2, name: "NB II", nameLocal: "NB II", hasRegions: false },
      { level: 3, name: "NB III", nameLocal: "NB III", hasRegions: true },
    ],
  },
  {
    code: "UA",
    name: "Ukraine",
    nameLocal: "Україна",
    flag: "🇺🇦",
    association: "Ukrainian Association of Football",
    associationCode: "UAF",
    website: "https://uaf.ua",
    language: "uk",
    enabled: false,
    leagueLevels: [
      { level: 1, name: "Premier League", nameLocal: "Прем'єр-ліга", hasRegions: false },
      { level: 2, name: "First League", nameLocal: "Перша ліга", hasRegions: false },
    ],
  },
  {
    code: "LT",
    name: "Lithuania",
    nameLocal: "Lietuva",
    flag: "🇱🇹",
    association: "Lithuanian Football Federation",
    associationCode: "LFF",
    website: "https://lff.lt",
    language: "lt",
    enabled: false,
    leagueLevels: [
      { level: 1, name: "A Lyga", nameLocal: "A lyga", hasRegions: false },
      { level: 2, name: "I Lyga", nameLocal: "I lyga", hasRegions: false },
    ],
  },
  {
    code: "GB",
    name: "England",
    nameLocal: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    association: "The Football Association",
    associationCode: "FA",
    website: "https://thefa.com",
    language: "en",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Premier League", nameLocal: "Premier League", hasRegions: false },
      { level: 2, name: "Championship", nameLocal: "EFL Championship", hasRegions: false },
      { level: 3, name: "League One", nameLocal: "EFL League One", hasRegions: false },
      { level: 4, name: "League Two", nameLocal: "EFL League Two", hasRegions: false },
      { level: 5, name: "National League", nameLocal: "National League", hasRegions: false },
      { level: 6, name: "National League N/S", nameLocal: "National League North/South", hasRegions: true },
      { level: 7, name: "Northern/Southern/Isthmian Premier", nameLocal: "Step 3", hasRegions: true },
      { level: 8, name: "Northern/Southern/Isthmian Div 1", nameLocal: "Step 4", hasRegions: true },
      { level: 9, name: "Step 5", nameLocal: "Step 5 Leagues", hasRegions: true },
      { level: 10, name: "Step 6", nameLocal: "Step 6 Leagues", hasRegions: true },
    ],
  },
  {
    code: "NL",
    name: "Netherlands",
    nameLocal: "Nederland",
    flag: "🇳🇱",
    association: "Royal Dutch Football Association",
    associationCode: "KNVB",
    website: "https://knvb.nl",
    language: "nl",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Eredivisie", nameLocal: "Eredivisie", hasRegions: false },
      { level: 2, name: "Eerste Divisie", nameLocal: "Eerste Divisie", hasRegions: false },
      { level: 3, name: "Tweede Divisie", nameLocal: "Tweede Divisie", hasRegions: false },
      { level: 4, name: "Derde Divisie", nameLocal: "Derde Divisie", hasRegions: true },
      { level: 5, name: "Hoofdklasse", nameLocal: "Hoofdklasse", hasRegions: true },
      { level: 6, name: "Eerste Klasse", nameLocal: "Eerste Klasse", hasRegions: true },
      { level: 7, name: "Tweede Klasse", nameLocal: "Tweede Klasse", hasRegions: true },
      { level: 8, name: "Derde Klasse", nameLocal: "Derde Klasse", hasRegions: true },
      { level: 9, name: "Vierde Klasse", nameLocal: "Vierde Klasse", hasRegions: true },
    ],
  },
  {
    code: "BE",
    name: "Belgium",
    nameLocal: "België / Belgique",
    flag: "🇧🇪",
    association: "Royal Belgian Football Association",
    associationCode: "KBVB",
    website: "https://rbfa.be",
    language: "nl",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Pro League", nameLocal: "Jupiler Pro League", hasRegions: false },
      { level: 2, name: "Challenger Pro League", nameLocal: "Challenger Pro League", hasRegions: false },
      { level: 3, name: "National 1", nameLocal: "Nationale 1", hasRegions: false },
      { level: 4, name: "First Amateur", nameLocal: "Eerste Amateur", hasRegions: true },
      { level: 5, name: "Second Amateur", nameLocal: "Tweede Amateur", hasRegions: true },
      { level: 6, name: "Third Amateur", nameLocal: "Derde Amateur", hasRegions: true },
      { level: 7, name: "First Provincial", nameLocal: "Eerste Provinciale", hasRegions: true },
      { level: 8, name: "Second Provincial", nameLocal: "Tweede Provinciale", hasRegions: true },
      { level: 9, name: "Third Provincial", nameLocal: "Derde Provinciale", hasRegions: true },
    ],
  },
  {
    code: "DK",
    name: "Denmark",
    nameLocal: "Danmark",
    flag: "🇩🇰",
    association: "Danish Football Association",
    associationCode: "DBU",
    website: "https://dbu.dk",
    language: "da",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Superliga", nameLocal: "Superligaen", hasRegions: false },
      { level: 2, name: "1st Division", nameLocal: "1. Division", hasRegions: false },
      { level: 3, name: "2nd Division", nameLocal: "2. Division", hasRegions: true },
      { level: 4, name: "Denmark Series", nameLocal: "Danmarksserien", hasRegions: true },
      { level: 5, name: "Jutland/Zealand Series", nameLocal: "Jyllandsserien/Sjællandsserien", hasRegions: true },
      { level: 6, name: "Series 1", nameLocal: "Serie 1", hasRegions: true },
      { level: 7, name: "Series 2", nameLocal: "Serie 2", hasRegions: true },
    ],
  },
  {
    code: "SE",
    name: "Sweden",
    nameLocal: "Sverige",
    flag: "🇸🇪",
    association: "Swedish Football Association",
    associationCode: "SvFF",
    website: "https://svenskfotboll.se",
    language: "sv",
    enabled: true,
    leagueLevels: [
      { level: 1, name: "Allsvenskan", nameLocal: "Allsvenskan", hasRegions: false },
      { level: 2, name: "Superettan", nameLocal: "Superettan", hasRegions: false },
      { level: 3, name: "Division 1", nameLocal: "Division 1", hasRegions: true },
      { level: 4, name: "Division 2", nameLocal: "Division 2", hasRegions: true },
      { level: 5, name: "Division 3", nameLocal: "Division 3", hasRegions: true },
      { level: 6, name: "Division 4", nameLocal: "Division 4", hasRegions: true },
      { level: 7, name: "Division 5", nameLocal: "Division 5", hasRegions: true },
      { level: 8, name: "Division 6", nameLocal: "Division 6", hasRegions: true },
      { level: 9, name: "Division 7", nameLocal: "Division 7", hasRegions: true },
    ],
  },
];

// Regional associations by country
export const REGIONS_BY_COUNTRY: Record<string, Region[]> = {
  PL: [
    { code: "WZPN", name: "Wielkopolski ZPN", website: "https://wielkopolskizpn.pl" },
    { code: "MZPN", name: "Mazowiecki ZPN", website: "https://mzpn.pl" },
    { code: "SLZPN", name: "Śląski ZPN", website: "https://slzpn.pl" },
    { code: "DZPN", name: "Dolnośląski ZPN" },
    { code: "OZPN", name: "Opolski ZPN", website: "https://pilkaopolska.pl" },
    { code: "LZPN", name: "Lubelski ZPN" },
    { code: "PZPN_POD", name: "Podkarpacki ZPN" },
    { code: "KPZPN", name: "Kujawsko-Pomorski ZPN" },
    { code: "LOZPN", name: "Łódzki ZPN" },
    { code: "MPZPN", name: "Małopolski ZPN" },
    { code: "POZPN", name: "Pomorski ZPN" },
    { code: "SWZPN", name: "Świętokrzyski ZPN" },
    { code: "WMZPN", name: "Warmińsko-Mazurski ZPN" },
    { code: "ZZPN", name: "Zachodniopomorski ZPN" },
    { code: "LUZPN", name: "Lubuski ZPN" },
    { code: "PLZPN", name: "Podlaski ZPN" },
  ],
  DE: [
    { code: "BFV", name: "Bayerischer Fußball-Verband" },
    { code: "WDFV", name: "Westdeutscher Fußballverband" },
    { code: "NFV", name: "Niedersächsischer Fußballverband" },
    { code: "SHFV", name: "Schleswig-Holsteinischer Fußballverband" },
    { code: "HFV", name: "Hessischer Fußball-Verband" },
    { code: "SWFV", name: "Südwestdeutscher Fußballverband" },
    { code: "BFV_BERLIN", name: "Berliner Fußball-Verband" },
    { code: "SBFV", name: "Südbadischer Fußballverband" },
    { code: "WFV", name: "Württembergischer Fußballverband" },
    { code: "SFV", name: "Sächsischer Fußball-Verband" },
    { code: "TFV", name: "Thüringer Fußball-Verband" },
  ],
  CZ: [
    { code: "PKFS", name: "Pražský krajský fotbalový svaz" },
    { code: "SKFS", name: "Středočeský krajský fotbalový svaz" },
    { code: "JCKFS", name: "Jihočeský krajský fotbalový svaz" },
    { code: "PLKFS", name: "Plzeňský krajský fotbalový svaz" },
    { code: "KKVFS", name: "Karlovarský krajský fotbalový svaz" },
    { code: "ULKFS", name: "Ústecký krajský fotbalový svaz" },
    { code: "LBKFS", name: "Liberecký krajský fotbalový svaz" },
    { code: "HKKFS", name: "Královéhradecký krajský fotbalový svaz" },
    { code: "PAKFS", name: "Pardubický krajský fotbalový svaz" },
    { code: "VYKFS", name: "Vysočina krajský fotbalový svaz" },
    { code: "JMKFS", name: "Jihomoravský krajský fotbalový svaz" },
    { code: "OLKFS", name: "Olomoucký krajský fotbalový svaz" },
    { code: "ZLKFS", name: "Zlínský krajský fotbalový svaz" },
    { code: "MSKFS", name: "Moravskoslezský krajský fotbalový svaz" },
  ],
  SK: [
    { code: "BFZ", name: "Bratislavský futbalový zväz" },
    { code: "ZsFZ", name: "Západoslovenský futbalový zväz" },
    { code: "SsFZ", name: "Stredoslovenský futbalový zväz" },
    { code: "VsFZ", name: "Východoslovenský futbalový zväz" },
  ],
  AT: [
    { code: "WFV", name: "Wiener Fußball-Verband" },
    { code: "NÖFV", name: "Niederösterreichischer Fußball-Verband" },
    { code: "BFV", name: "Burgenländischer Fußballverband" },
    { code: "STFV", name: "Steirischer Fußballverband" },
    { code: "KFV", name: "Kärntner Fußballverband" },
    { code: "OÖFV", name: "Oberösterreichischer Fußball-Verband" },
    { code: "SFV", name: "Salzburger Fußballverband" },
    { code: "TFV", name: "Tiroler Fußballverband" },
    { code: "VFV", name: "Vorarlberger Fußballverband" },
  ],
  GB: [
    { code: "NL_NORTH", name: "National League North" },
    { code: "NL_SOUTH", name: "National League South" },
    { code: "NPL", name: "Northern Premier League" },
    { code: "SPL", name: "Southern Football League" },
    { code: "IL", name: "Isthmian League" },
    { code: "NCEL", name: "Northern Counties East League" },
    { code: "NWC", name: "North West Counties League" },
    { code: "WMRL", name: "West Midlands Regional League" },
    { code: "SWPL", name: "South West Peninsula League" },
    { code: "ECL", name: "Eastern Counties League" },
  ],
  NL: [
    { code: "KNVB_WEST1", name: "West I" },
    { code: "KNVB_WEST2", name: "West II" },
    { code: "KNVB_NOORD", name: "Noord" },
    { code: "KNVB_OOST", name: "Oost" },
    { code: "KNVB_ZUID1", name: "Zuid I" },
    { code: "KNVB_ZUID2", name: "Zuid II" },
  ],
  BE: [
    { code: "ACFF", name: "ACFF (Francophone)" },
    { code: "VV", name: "Voetbal Vlaanderen" },
    { code: "ANTW", name: "Antwerpen" },
    { code: "BRAB", name: "Brabant" },
    { code: "LIMB", name: "Limburg" },
    { code: "OOST", name: "Oost-Vlaanderen" },
    { code: "WEST", name: "West-Vlaanderen" },
    { code: "HAIN", name: "Hainaut" },
    { code: "LIEGE", name: "Liège" },
    { code: "LUX", name: "Luxembourg" },
    { code: "NAMUR", name: "Namur" },
  ],
  DK: [
    { code: "DBU_JYL", name: "Jylland" },
    { code: "DBU_SJL", name: "Sjælland" },
    { code: "DBU_FYN", name: "Fyn" },
    { code: "DBU_BH", name: "Bornholm" },
  ],
  SE: [
    { code: "STFF", name: "Stockholms FF" },
    { code: "GBGFF", name: "Göteborgs FF" },
    { code: "SKFF", name: "Skånes FF" },
    { code: "VGFF", name: "Västergötlands FF" },
    { code: "OGFF", name: "Östergötlands FF" },
    { code: "SMFF", name: "Smålands FF" },
    { code: "DAFF", name: "Dalarnas FF" },
    { code: "NGFF", name: "Norrbottens FF" },
    { code: "VBFF", name: "Västerbottens FF" },
  ],
};

/**
 * Get all available countries
 */
export function getCountries(enabledOnly = true): Country[] {
  if (enabledOnly) {
    return COUNTRIES.filter(c => c.enabled);
  }
  return COUNTRIES;
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Get regions for a country
 */
export function getRegionsByCountry(countryCode: string): Region[] {
  return REGIONS_BY_COUNTRY[countryCode] || [];
}

/**
 * Get league levels for a country
 */
export function getLeagueLevelsByCountry(countryCode: string): LeagueLevel[] {
  const country = getCountryByCode(countryCode);
  return country?.leagueLevels || [];
}

/**
 * Get lower leagues (amateur level) for a country
 */
export function getLowerLeagues(countryCode: string): LeagueLevel[] {
  const country = getCountryByCode(countryCode);
  if (!country) return [];
  
  // Return leagues from level 4 and below (amateur/regional)
  return country.leagueLevels.filter(l => l.level >= 4);
}

/**
 * Interface for fetched league data
 */
export interface LeagueTableEntry {
  position: number;
  teamName: string;
  teamId?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueData {
  countryCode: string;
  regionCode?: string;
  leagueLevel: number;
  leagueName: string;
  season: string;
  table: LeagueTableEntry[];
  lastUpdated: string;
}

/**
 * Fetch league data for a specific country and region
 * This is a placeholder that would be implemented with actual scraping/API calls
 */
export async function fetchLeagueData(
  countryCode: string,
  leagueLevel: number,
  regionCode?: string,
  season?: string
): Promise<LeagueData | null> {
  console.log(`[InternationalLeague] Fetching data for ${countryCode}, level ${leagueLevel}, region ${regionCode}`);
  
  // For now, delegate to country-specific services
  switch (countryCode) {
    case "PL":
      // Use existing PZPN service
      const { fetchWzpnLeague } = await import("./pzpnService");
      const plData = await fetchWzpnLeague(season || "2025/2026", leagueLevel, "1");
      if (plData) {
        return {
          countryCode: "PL",
          regionCode,
          leagueLevel,
          leagueName: plData.name,
          season: plData.season,
          table: plData.teams.map(t => ({
            position: t.position,
            teamName: t.name,
            teamId: t.externalId,
            played: t.matches,
            won: t.wins,
            drawn: t.draws,
            lost: t.losses,
            goalsFor: t.goalsFor,
            goalsAgainst: t.goalsAgainst,
            goalDifference: t.goalDifference,
            points: t.points,
          })),
          lastUpdated: new Date().toISOString(),
        };
      }
      return null;
      
    case "DE":
    case "CZ":
    case "SK":
    case "AT":
      // Placeholder - would implement specific scrapers
      console.log(`[InternationalLeague] ${countryCode} scraping not yet implemented`);
      return null;
      
    default:
      return null;
  }
}

/**
 * Search for a team across all enabled countries
 */
export async function searchTeamGlobally(
  query: string,
  countryCode?: string
): Promise<{
  countryCode: string;
  countryName: string;
  regionCode?: string;
  teamName: string;
  leagueName: string;
  position?: number;
}[]> {
  const results: {
    countryCode: string;
    countryName: string;
    regionCode?: string;
    teamName: string;
    leagueName: string;
    position?: number;
  }[] = [];
  
  const countries = countryCode 
    ? COUNTRIES.filter(c => c.code === countryCode && c.enabled)
    : COUNTRIES.filter(c => c.enabled);
  
  for (const country of countries) {
    // Search in lower leagues
    for (const level of country.leagueLevels.filter(l => l.level >= 4)) {
      const data = await fetchLeagueData(country.code, level.level);
      if (data) {
        const matches = data.table.filter(t => 
          t.teamName.toLowerCase().includes(query.toLowerCase())
        );
        for (const match of matches) {
          results.push({
            countryCode: country.code,
            countryName: country.nameLocal,
            teamName: match.teamName,
            leagueName: data.leagueName,
            position: match.position,
          });
        }
      }
    }
  }
  
  return results;
}
