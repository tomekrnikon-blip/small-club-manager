# PZPN Data Integration Research

## Data Sources Found

### 1. RegioWyniki.pl (now Superscore)
- **URL**: https://regiowyniki.pl/
- **Features**:
  - Club search by name
  - League tables with full statistics (Pkt, M, W, R, P, Bramki, Forma)
  - Match schedules and results
  - Team pages with logo, schedule, table, stats, squad
  - All 16 Polish regions (województwa) supported
  - Multiple league levels (Ekstraklasa, 1-3 Liga, 4 Liga, Klasy okręgowe)

### 2. URL Structure
- Search: `https://regiowyniki.pl/szukaj/Pilka_Nozna/`
- Team page: `https://regiowyniki.pl/druzyna/Pilka_Nozna/{Region}/{Team_Name}/`
- Table: `https://regiowyniki.pl/druzyna/Pilka_Nozna/{Region}/{Team_Name}/tabela/`

### 3. Data Available
- **Team Info**: Logo, name, founded date, colors, address, president, phone
- **League Table**: Position, Points, Matches, Wins, Draws, Losses, Goals For/Against, Form
- **Matches**: Date, time, home/away teams, scores, live status
- **Statistics**: Goal stats, common results, win percentages

## Implementation Plan

### Club Search Flow
1. User enters club name in search field
2. App calls RegioWyniki search API/scraper
3. Display matching clubs with region info
4. User selects their club
5. Store club external ID and region for future sync

### League Table Sync
1. Fetch team page from RegioWyniki
2. Parse league table HTML
3. Display current standings in app
4. Auto-refresh on match days

### Regions (Województwa)
- Dolnośląskie
- Kujawsko-pomorskie
- Lubelskie
- Lubuskie
- Łódzkie
- Małopolskie
- Mazowieckie
- Opolskie
- Podkarpackie
- Podlaskie
- Pomorskie
- Śląskie
- Świętokrzyskie
- Warmińsko-mazurskie
- Wielkopolskie
- Zachodniopomorskie
