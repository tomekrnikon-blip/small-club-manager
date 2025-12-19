# RegioWyniki API Research

## URL Structure

### Club/Team Page
```
https://regiowyniki.pl/druzyna/Pilka_Nozna/{Region}/{Club_Name}/
```
Example: `https://regiowyniki.pl/druzyna/Pilka_Nozna/Wielkopolskie/Lech_Poznan_UAM__k_/`

### League Table
```
https://regiowyniki.pl/druzyna/Pilka_Nozna/{Region}/{Club_Name}/tabela/
```

### Schedule/Terminarz
```
https://regiowyniki.pl/druzyna/Pilka_Nozna/{Region}/{Club_Name}/
```
(default view)

### Search
```
https://regiowyniki.pl/szukaj/Pilka_Nozna/?search_text={query}
```

## Data Available

### Team Page Contains:
- Club logo
- Club info (założony, barwy, adres, prezes, telefon)
- Match schedule with dates, times, opponents, scores
- Tabs: Terminarz, Tabela, Statystyki, Kadra, Fani

### League Table Contains:
- Position (1-12+)
- Team name with link
- Points (Pkt)
- Matches played (M)
- Wins (W)
- Draws (R)
- Losses (P)
- Goals (Bramki) - format: scored:conceded
- Form (last 5-6 matches: W/R/P)

### Regions Available:
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

### Central Leagues:
- Ekstraklasa
- 1. Liga
- 2. Liga
- 3. Liga
- Puchar Polski

## Scraping Notes

1. No public API - requires web scraping
2. Data is rendered server-side (good for scraping)
3. Club names use underscores instead of spaces
4. Special characters encoded (e.g., (k) for women's teams)
5. Season selector available (2025/26 current)
6. CORS may block client-side requests - need server-side proxy
