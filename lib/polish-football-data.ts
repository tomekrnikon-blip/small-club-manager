/**
 * Polish Football Structure Data
 * Hierarchical: Województwo → Okręg (OZPN) → Liga → Klub → Drużyna
 * Season: 2025/2026
 */

export interface District {
  code: string;
  name: string;
  ozpnName: string;
}

export interface League {
  code: string;
  name: string;
  level: number;
  districtCode?: string;
}

export interface Team {
  id: string;
  name: string;
  ageGroup: 'senior' | 'junior-starszy' | 'junior-mlodszy' | 'trampkarz-starszy' | 'trampkarz-mlodszy' | 'zak' | 'orlik' | 'bambino';
  leagueCode: string;
  leagueName: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
  districtCode: string;
  logoUrl?: string;
  teams: Team[];
}

export interface LeagueStanding {
  position: number;
  teamId: string;
  clubName: string;
  teamName: string;
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

// Current season
export const CURRENT_SEASON = '2025/2026';

// Age group labels
export const AGE_GROUP_LABELS: Record<Team['ageGroup'], string> = {
  'senior': 'Seniorzy',
  'junior-starszy': 'Junior starszy (U19)',
  'junior-mlodszy': 'Junior młodszy (U17)',
  'trampkarz-starszy': 'Trampkarz starszy (U15)',
  'trampkarz-mlodszy': 'Trampkarz młodszy (U13)',
  'zak': 'Żak (U11)',
  'orlik': 'Orlik (U9)',
  'bambino': 'Bambino (U7)',
};

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

// League levels
export const LEAGUES: Record<string, League[]> = {
  '_central': [
    { code: 'ekstraklasa', name: 'Ekstraklasa', level: 1 },
    { code: '1-liga', name: '1. Liga', level: 2 },
    { code: '2-liga', name: '2. Liga', level: 3 },
    { code: '3-liga', name: '3. Liga', level: 4 },
  ],
  '_regional': [
    { code: '4-liga', name: '4. Liga', level: 5 },
    { code: 'klasa-okregowa', name: 'Klasa Okręgowa', level: 6 },
    { code: 'klasa-a', name: 'Klasa A', level: 7 },
    { code: 'klasa-b', name: 'Klasa B', level: 8 },
    { code: 'klasa-c', name: 'Klasa C', level: 9 },
  ],
  '_youth': [
    { code: 'clj-u19', name: 'CLJ U19', level: 1 },
    { code: 'clj-u17', name: 'CLJ U17', level: 1 },
    { code: 'liga-okregowa-junior', name: 'Liga Okręgowa Junior', level: 2 },
    { code: 'liga-okregowa-trampkarz', name: 'Liga Okręgowa Trampkarz', level: 2 },
  ],
};

// Full clubs data with teams
export const CLUBS_DATA: Record<string, Club[]> = {
  'poznan': [
    {
      id: 'lech-poznan',
      name: 'Lech Poznań',
      city: 'Poznań',
      districtCode: 'poznan',
      teams: [
        { id: 'lech-poznan-senior', name: 'Lech Poznań', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'lech-poznan-u19', name: 'Lech Poznań U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'lech-poznan-u17', name: 'Lech Poznań U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
        { id: 'lech-poznan-u15', name: 'Lech Poznań U15', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
      ],
    },
    {
      id: 'warta-poznan',
      name: 'Warta Poznań',
      city: 'Poznań',
      districtCode: 'poznan',
      teams: [
        { id: 'warta-poznan-senior', name: 'Warta Poznań', ageGroup: 'senior', leagueCode: '1-liga', leagueName: '1. Liga' },
        { id: 'warta-poznan-u19', name: 'Warta Poznań U19', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'olimpia-poznan',
      name: 'Olimpia Poznań',
      city: 'Poznań',
      districtCode: 'poznan',
      teams: [
        { id: 'olimpia-poznan-senior', name: 'Olimpia Poznań', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'huragan-pobiedziska',
      name: 'Huragan Pobiedziska',
      city: 'Pobiedziska',
      districtCode: 'poznan',
      teams: [
        { id: 'huragan-senior', name: 'Huragan Pobiedziska', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'huragan-junior', name: 'Huragan Pobiedziska Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
        { id: 'huragan-trampkarz', name: 'Huragan Pobiedziska Trampkarz', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
      ],
    },
    {
      id: 'sokol-kleczew',
      name: 'Sokół Kleczew',
      city: 'Kleczew',
      districtCode: 'poznan',
      teams: [
        { id: 'sokol-senior', name: 'Sokół Kleczew', ageGroup: 'senior', leagueCode: 'klasa-okregowa', leagueName: 'Klasa Okręgowa' },
        { id: 'sokol-junior', name: 'Sokół Kleczew Junior', ageGroup: 'junior-mlodszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'orlik-mosina',
      name: 'Orlik Mosina',
      city: 'Mosina',
      districtCode: 'poznan',
      teams: [
        { id: 'orlik-senior', name: 'Orlik Mosina', ageGroup: 'senior', leagueCode: 'klasa-a', leagueName: 'Klasa A' },
        { id: 'orlik-junior', name: 'Orlik Mosina Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
        { id: 'orlik-trampkarz', name: 'Orlik Mosina Trampkarz', ageGroup: 'trampkarz-mlodszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
        { id: 'orlik-zak', name: 'Orlik Mosina Żak', ageGroup: 'zak', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Żaków' },
      ],
    },
  ],
  'warszawa': [
    {
      id: 'legia-warszawa',
      name: 'Legia Warszawa',
      city: 'Warszawa',
      districtCode: 'warszawa',
      teams: [
        { id: 'legia-senior', name: 'Legia Warszawa', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'legia-u19', name: 'Legia Warszawa U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'legia-u17', name: 'Legia Warszawa U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
        { id: 'legia-u15', name: 'Legia Warszawa U15', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
        { id: 'legia-u13', name: 'Legia Warszawa U13', ageGroup: 'trampkarz-mlodszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Trampkarzy' },
      ],
    },
    {
      id: 'polonia-warszawa',
      name: 'Polonia Warszawa',
      city: 'Warszawa',
      districtCode: 'warszawa',
      teams: [
        { id: 'polonia-senior', name: 'Polonia Warszawa', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
        { id: 'polonia-junior', name: 'Polonia Warszawa Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'swit-nowy-dwor',
      name: 'Świt Nowy Dwór Maz.',
      city: 'Nowy Dwór Maz.',
      districtCode: 'warszawa',
      teams: [
        { id: 'swit-senior', name: 'Świt Nowy Dwór Maz.', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'legionovia',
      name: 'Legionovia Legionowo',
      city: 'Legionowo',
      districtCode: 'warszawa',
      teams: [
        { id: 'legionovia-senior', name: 'Legionovia Legionowo', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'legionovia-junior', name: 'Legionovia Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
        { id: 'legionovia-trampkarz', name: 'Legionovia Trampkarz', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
      ],
    },
    {
      id: 'mazur-karczew',
      name: 'Mazur Karczew',
      city: 'Karczew',
      districtCode: 'warszawa',
      teams: [
        { id: 'mazur-senior', name: 'Mazur Karczew', ageGroup: 'senior', leagueCode: 'klasa-okregowa', leagueName: 'Klasa Okręgowa' },
        { id: 'mazur-junior', name: 'Mazur Karczew Junior', ageGroup: 'junior-mlodszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'katowice': [
    {
      id: 'gornik-zabrze',
      name: 'Górnik Zabrze',
      city: 'Zabrze',
      districtCode: 'katowice',
      teams: [
        { id: 'gornik-senior', name: 'Górnik Zabrze', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'gornik-u19', name: 'Górnik Zabrze U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'gornik-u17', name: 'Górnik Zabrze U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'piast-gliwice',
      name: 'Piast Gliwice',
      city: 'Gliwice',
      districtCode: 'katowice',
      teams: [
        { id: 'piast-senior', name: 'Piast Gliwice', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'piast-u19', name: 'Piast Gliwice U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
      ],
    },
    {
      id: 'gks-katowice',
      name: 'GKS Katowice',
      city: 'Katowice',
      districtCode: 'katowice',
      teams: [
        { id: 'gks-senior', name: 'GKS Katowice', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'gks-junior', name: 'GKS Katowice Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'ruch-chorzow',
      name: 'Ruch Chorzów',
      city: 'Chorzów',
      districtCode: 'katowice',
      teams: [
        { id: 'ruch-senior', name: 'Ruch Chorzów', ageGroup: 'senior', leagueCode: '1-liga', leagueName: '1. Liga' },
        { id: 'ruch-u19', name: 'Ruch Chorzów U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
      ],
    },
    {
      id: 'gks-tychy',
      name: 'GKS Tychy',
      city: 'Tychy',
      districtCode: 'katowice',
      teams: [
        { id: 'gks-tychy-senior', name: 'GKS Tychy', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
      ],
    },
    {
      id: 'victoria-jaworzno',
      name: 'Victoria Jaworzno',
      city: 'Jaworzno',
      districtCode: 'katowice',
      teams: [
        { id: 'victoria-senior', name: 'Victoria Jaworzno', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'victoria-junior', name: 'Victoria Jaworzno Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
        { id: 'victoria-trampkarz', name: 'Victoria Jaworzno Trampkarz', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
        { id: 'victoria-zak', name: 'Victoria Jaworzno Żak', ageGroup: 'zak', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Żaków' },
      ],
    },
  ],
  'krakow': [
    {
      id: 'cracovia',
      name: 'Cracovia',
      city: 'Kraków',
      districtCode: 'krakow',
      teams: [
        { id: 'cracovia-senior', name: 'Cracovia', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'cracovia-u19', name: 'Cracovia U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'cracovia-u17', name: 'Cracovia U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'wisla-krakow',
      name: 'Wisła Kraków',
      city: 'Kraków',
      districtCode: 'krakow',
      teams: [
        { id: 'wisla-senior', name: 'Wisła Kraków', ageGroup: 'senior', leagueCode: '1-liga', leagueName: '1. Liga' },
        { id: 'wisla-u19', name: 'Wisła Kraków U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'wisla-u17', name: 'Wisła Kraków U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'hutnik-krakow',
      name: 'Hutnik Kraków',
      city: 'Kraków',
      districtCode: 'krakow',
      teams: [
        { id: 'hutnik-senior', name: 'Hutnik Kraków', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
        { id: 'hutnik-junior', name: 'Hutnik Kraków Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'garbarnia-krakow',
      name: 'Garbarnia Kraków',
      city: 'Kraków',
      districtCode: 'krakow',
      teams: [
        { id: 'garbarnia-senior', name: 'Garbarnia Kraków', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'wisloka-debica',
      name: 'Wisłoka Dębica',
      city: 'Dębica',
      districtCode: 'krakow',
      teams: [
        { id: 'wisloka-senior', name: 'Wisłoka Dębica', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'wisloka-junior', name: 'Wisłoka Dębica Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'gdansk': [
    {
      id: 'lechia-gdansk',
      name: 'Lechia Gdańsk',
      city: 'Gdańsk',
      districtCode: 'gdansk',
      teams: [
        { id: 'lechia-senior', name: 'Lechia Gdańsk', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'lechia-u19', name: 'Lechia Gdańsk U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'lechia-u17', name: 'Lechia Gdańsk U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'arka-gdynia',
      name: 'Arka Gdynia',
      city: 'Gdynia',
      districtCode: 'gdansk',
      teams: [
        { id: 'arka-senior', name: 'Arka Gdynia', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
        { id: 'arka-junior', name: 'Arka Gdynia Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'baltyk-gdynia',
      name: 'Bałtyk Gdynia',
      city: 'Gdynia',
      districtCode: 'gdansk',
      teams: [
        { id: 'baltyk-senior', name: 'Bałtyk Gdynia', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'gedania-gdansk',
      name: 'Gedania Gdańsk',
      city: 'Gdańsk',
      districtCode: 'gdansk',
      teams: [
        { id: 'gedania-senior', name: 'Gedania Gdańsk', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'gedania-junior', name: 'Gedania Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
        { id: 'gedania-trampkarz', name: 'Gedania Trampkarz', ageGroup: 'trampkarz-starszy', leagueCode: 'liga-okregowa-trampkarz', leagueName: 'Liga Okręgowa Trampkarz' },
      ],
    },
  ],
  'wroclaw': [
    {
      id: 'slask-wroclaw',
      name: 'Śląsk Wrocław',
      city: 'Wrocław',
      districtCode: 'wroclaw',
      teams: [
        { id: 'slask-senior', name: 'Śląsk Wrocław', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'slask-u19', name: 'Śląsk Wrocław U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'slask-u17', name: 'Śląsk Wrocław U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'zaglebie-lubin',
      name: 'Zagłębie Lubin',
      city: 'Lubin',
      districtCode: 'wroclaw',
      teams: [
        { id: 'zaglebie-senior', name: 'Zagłębie Lubin', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'zaglebie-u19', name: 'Zagłębie Lubin U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
      ],
    },
    {
      id: 'miedz-legnica',
      name: 'Miedź Legnica',
      city: 'Legnica',
      districtCode: 'wroclaw',
      teams: [
        { id: 'miedz-senior', name: 'Miedź Legnica', ageGroup: 'senior', leagueCode: '1-liga', leagueName: '1. Liga' },
        { id: 'miedz-junior', name: 'Miedź Legnica Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'chrobry-glogow',
      name: 'Chrobry Głogów',
      city: 'Głogów',
      districtCode: 'wroclaw',
      teams: [
        { id: 'chrobry-senior', name: 'Chrobry Głogów', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
      ],
    },
  ],
  'lodz': [
    {
      id: 'widzew-lodz',
      name: 'Widzew Łódź',
      city: 'Łódź',
      districtCode: 'lodz',
      teams: [
        { id: 'widzew-senior', name: 'Widzew Łódź', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'widzew-u19', name: 'Widzew Łódź U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'widzew-u17', name: 'Widzew Łódź U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'lks-lodz',
      name: 'ŁKS Łódź',
      city: 'Łódź',
      districtCode: 'lodz',
      teams: [
        { id: 'lks-senior', name: 'ŁKS Łódź', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
        { id: 'lks-junior', name: 'ŁKS Łódź Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
    {
      id: 'pelikan-lowicz',
      name: 'Pelikan Łowicz',
      city: 'Łowicz',
      districtCode: 'lodz',
      teams: [
        { id: 'pelikan-senior', name: 'Pelikan Łowicz', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'rks-radomsko',
      name: 'RKS Radomsko',
      city: 'Radomsko',
      districtCode: 'lodz',
      teams: [
        { id: 'rks-senior', name: 'RKS Radomsko', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'rks-junior', name: 'RKS Radomsko Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'bialystok': [
    {
      id: 'jagiellonia',
      name: 'Jagiellonia Białystok',
      city: 'Białystok',
      districtCode: 'bialystok',
      teams: [
        { id: 'jagiellonia-senior', name: 'Jagiellonia Białystok', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'jagiellonia-u19', name: 'Jagiellonia U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'jagiellonia-u17', name: 'Jagiellonia U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'wigry-suwalki',
      name: 'Wigry Suwałki',
      city: 'Suwałki',
      districtCode: 'bialystok',
      teams: [
        { id: 'wigry-senior', name: 'Wigry Suwałki', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
      ],
    },
    {
      id: 'sokol-siemiatycze',
      name: 'Sokół Siemiatycze',
      city: 'Siemiatycze',
      districtCode: 'bialystok',
      teams: [
        { id: 'sokol-siem-senior', name: 'Sokół Siemiatycze', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'sokol-siem-junior', name: 'Sokół Siemiatycze Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'szczecin': [
    {
      id: 'pogon-szczecin',
      name: 'Pogoń Szczecin',
      city: 'Szczecin',
      districtCode: 'szczecin',
      teams: [
        { id: 'pogon-senior', name: 'Pogoń Szczecin', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'pogon-u19', name: 'Pogoń Szczecin U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'pogon-u17', name: 'Pogoń Szczecin U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'flota-swinoujscie',
      name: 'Flota Świnoujście',
      city: 'Świnoujście',
      districtCode: 'szczecin',
      teams: [
        { id: 'flota-senior', name: 'Flota Świnoujście', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'vineta-wolin',
      name: 'Vineta Wolin',
      city: 'Wolin',
      districtCode: 'szczecin',
      teams: [
        { id: 'vineta-senior', name: 'Vineta Wolin', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'vineta-junior', name: 'Vineta Wolin Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'lublin': [
    {
      id: 'motor-lublin',
      name: 'Motor Lublin',
      city: 'Lublin',
      districtCode: 'lublin',
      teams: [
        { id: 'motor-senior', name: 'Motor Lublin', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'motor-u19', name: 'Motor Lublin U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
      ],
    },
    {
      id: 'gornik-leczna',
      name: 'Górnik Łęczna',
      city: 'Łęczna',
      districtCode: 'lublin',
      teams: [
        { id: 'gornik-leczna-senior', name: 'Górnik Łęczna', ageGroup: 'senior', leagueCode: '2-liga', leagueName: '2. Liga' },
      ],
    },
    {
      id: 'lublinianka',
      name: 'Lublinianka Lublin',
      city: 'Lublin',
      districtCode: 'lublin',
      teams: [
        { id: 'lublinianka-senior', name: 'Lublinianka Lublin', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'lublinianka-junior', name: 'Lublinianka Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'kielce': [
    {
      id: 'korona-kielce',
      name: 'Korona Kielce',
      city: 'Kielce',
      districtCode: 'kielce',
      teams: [
        { id: 'korona-senior', name: 'Korona Kielce', ageGroup: 'senior', leagueCode: '1-liga', leagueName: '1. Liga' },
        { id: 'korona-u19', name: 'Korona Kielce U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
      ],
    },
    {
      id: 'star-starachowice',
      name: 'Star Starachowice',
      city: 'Starachowice',
      districtCode: 'kielce',
      teams: [
        { id: 'star-senior', name: 'Star Starachowice', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
    {
      id: 'spartakus-daleszyce',
      name: 'Spartakus Daleszyce',
      city: 'Daleszyce',
      districtCode: 'kielce',
      teams: [
        { id: 'spartakus-senior', name: 'Spartakus Daleszyce', ageGroup: 'senior', leagueCode: '4-liga', leagueName: '4. Liga' },
        { id: 'spartakus-junior', name: 'Spartakus Junior', ageGroup: 'junior-starszy', leagueCode: 'liga-okregowa-junior', leagueName: 'Liga Okręgowa Junior' },
      ],
    },
  ],
  'czestochowa': [
    {
      id: 'rakow-czestochowa',
      name: 'Raków Częstochowa',
      city: 'Częstochowa',
      districtCode: 'czestochowa',
      teams: [
        { id: 'rakow-senior', name: 'Raków Częstochowa', ageGroup: 'senior', leagueCode: 'ekstraklasa', leagueName: 'Ekstraklasa' },
        { id: 'rakow-u19', name: 'Raków U19', ageGroup: 'junior-starszy', leagueCode: 'clj-u19', leagueName: 'CLJ U19' },
        { id: 'rakow-u17', name: 'Raków U17', ageGroup: 'junior-mlodszy', leagueCode: 'clj-u17', leagueName: 'CLJ U17' },
      ],
    },
    {
      id: 'skra-czestochowa',
      name: 'Skra Częstochowa',
      city: 'Częstochowa',
      districtCode: 'czestochowa',
      teams: [
        { id: 'skra-senior', name: 'Skra Częstochowa', ageGroup: 'senior', leagueCode: '3-liga', leagueName: '3. Liga' },
      ],
    },
  ],
};

// Helper functions
export function getRegions() {
  return REGIONS;
}

export function getDistrictsForRegion(regionCode: string): District[] {
  return DISTRICTS[regionCode] || [];
}

export function getLeaguesForDistrict(districtCode: string): League[] {
  return [...LEAGUES['_central'], ...LEAGUES['_regional'].map(l => ({ ...l, districtCode }))];
}

export function getClubsForDistrict(districtCode: string): Club[] {
  return CLUBS_DATA[districtCode] || [];
}

export function getClubById(clubId: string): Club | undefined {
  return Object.values(CLUBS_DATA).flat().find(c => c.id === clubId);
}

export function getTeamById(teamId: string): { club: Club; team: Team } | undefined {
  for (const clubs of Object.values(CLUBS_DATA)) {
    for (const club of clubs) {
      const team = club.teams.find(t => t.id === teamId);
      if (team) {
        return { club, team };
      }
    }
  }
  return undefined;
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

// Generate season data for a specific team
export function getSeasonDataForTeam(teamId: string): SeasonData | null {
  const result = getTeamById(teamId);
  if (!result) return null;
  
  const { club, team } = result;
  
  // Generate sample standings
  const teamCount = team.leagueCode === 'ekstraklasa' ? 18 : 
                    team.leagueCode === '1-liga' ? 18 :
                    team.leagueCode === '2-liga' ? 18 :
                    team.leagueCode === '3-liga' ? 18 :
                    team.leagueCode.includes('clj') ? 16 : 14;
  
  const standings: LeagueStanding[] = [];
  const matchesPlayed = Math.floor(Math.random() * 10) + 8;
  
  for (let i = 0; i < teamCount; i++) {
    const wins = Math.max(0, teamCount - i - Math.floor(Math.random() * 4));
    const draws = Math.floor(Math.random() * 5);
    const losses = matchesPlayed - wins - draws;
    const goalsFor = wins * 2 + draws + Math.floor(Math.random() * 8);
    const goalsAgainst = losses * 2 + draws + Math.floor(Math.random() * 6);
    
    standings.push({
      position: i + 1,
      teamId: i === Math.floor(teamCount / 3) ? teamId : `team-${i + 1}`,
      clubName: i === Math.floor(teamCount / 3) ? club.name : `Klub ${i + 1}`,
      teamName: i === Math.floor(teamCount / 3) ? team.name : `Drużyna ${i + 1}`,
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

  return {
    season: CURRENT_SEASON,
    leagueName: team.leagueName,
    standings,
    lastUpdated: new Date().toISOString(),
  };
}

function generateForm(): ('W' | 'D' | 'L')[] {
  const results: ('W' | 'D' | 'L')[] = ['W', 'D', 'L'];
  return Array.from({ length: 5 }, () => results[Math.floor(Math.random() * 3)]);
}
