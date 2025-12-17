# PZPN Data Integration - Research Findings

## Data Sources Analysis

### 1. Wojewódzkie ZPN (Regional Football Associations)

Each regional association (WZPN/OZPN) has its own website with league data:

| Region | Website | Data Available |
|--------|---------|----------------|
| Wielkopolski ZPN | wielkopolskizpn.pl | ✅ Tables, Results, Teams |
| Dolnośląski ZPN | dolzpn.wroclaw.pl | ❌ Domain expired |
| Opolski ZPN | pilkaopolska.pl | ✅ Tables, Results |
| Mazowiecki ZPN | mzpn.pl | To verify |
| Śląski ZPN | slzpn.pl | To verify |

### 2. Data Structure (from Wielkopolski ZPN)

**URL Pattern**: `wielkopolskizpn.pl/rozgrywki/?year={year}&liga={liga}&class={class}&group={group}&round={round}&queue={queue}`

**Available Filters**:
- Season (year): 2025/2026, 2024/2025, etc.
- League type (liga): Seniorzy, Juniorzy, etc.
- Class (class): Czwarta liga, Piąta liga, Klasa okręgowa, etc.
- Group (group): Specific group within class
- Round (round): Jesienna (autumn), Wiosenna (spring)
- Matchday (queue): 1-17+

**Table Data Fields**:
- Position (Pozycja)
- Team name (Drużyna)
- Matches played (Mecze)
- Points (Punkty)
- Wins (Wygrane)
- Draws (Remisy)
- Losses (Porażki)
- Goals scored (Gole +)
- Goals conceded (Gole -)
- Goal difference (Bilans)

**Match Data Fields**:
- Date (Data)
- Time (Godzina)
- Home team vs Away team
- Score
- Status (Rozegrany/Zaplanowany)

### 3. Technical Implementation Options

#### Option A: Web Scraping (Recommended)
- Parse HTML from WZPN websites
- Use cheerio or puppeteer for scraping
- Schedule updates every 24 hours
- Cache data locally

#### Option B: mPZPN Mobile App API
- PZPN has official app "mPZPN" with all league data
- API endpoints may be available (requires reverse engineering)
- More reliable but potentially against ToS

### 4. Database Schema for PZPN Integration

```sql
-- Regional associations
CREATE TABLE pzpn_regions (
  id INT PRIMARY KEY,
  name VARCHAR(100),  -- "Wielkopolski ZPN"
  code VARCHAR(10),   -- "WZPN"
  website VARCHAR(255),
  scraping_enabled BOOLEAN
);

-- Leagues within regions
CREATE TABLE pzpn_leagues (
  id INT PRIMARY KEY,
  region_id INT,
  name VARCHAR(100),  -- "IV Liga Artbud Group"
  level INT,          -- 4 for IV liga, 5 for V liga
  season VARCHAR(10), -- "2025/2026"
  external_id VARCHAR(50)
);

-- Teams from PZPN
CREATE TABLE pzpn_teams (
  id INT PRIMARY KEY,
  league_id INT,
  name VARCHAR(100),
  external_id VARCHAR(50),
  position INT,
  matches INT,
  points INT,
  wins INT,
  draws INT,
  losses INT,
  goals_for INT,
  goals_against INT,
  last_updated TIMESTAMP
);

-- Link club to PZPN team
CREATE TABLE club_pzpn_links (
  club_id INT,
  pzpn_team_id INT,
  verified BOOLEAN,
  verified_at TIMESTAMP,
  PRIMARY KEY (club_id, pzpn_team_id)
);
```

### 5. User Flow

1. **Registration**: Manager creates account
2. **Region Selection**: Choose WZPN/OZPN from list
3. **League Selection**: Choose league level (IV liga, V liga, etc.)
4. **Team Selection**: Find and select their team from table
5. **Verification**: Optional verification as official representative
6. **Auto-sync**: Match schedule and results sync automatically

### 6. Implementation Priority

1. ✅ Create schema for PZPN data
2. ✅ Build scraping service for Wielkopolski ZPN (as template)
3. ⬜ Add region selection UI
4. ⬜ Add team selection/linking UI
5. ⬜ Implement scheduled sync job
6. ⬜ Add more regional associations

### 7. Legal Considerations

- Data is publicly available on WZPN websites
- Scraping for personal/club use should be acceptable
- Rate limiting required to avoid overloading servers
- Consider reaching out to PZPN for official API access
