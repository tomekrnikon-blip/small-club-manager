# Small Club Manager - Ekrany i Funkcjonalności

## Kompletna Lista Ekranów

### Onboarding (app/onboarding/)

| Ekran | Plik | Opis |
|-------|------|------|
| Welcome | `welcome.tsx` | Ekran powitalny z logo SKM, listą funkcji, przycisk "Rozpocznij" |
| Country Select | `country-select.tsx` | Wybór kraju (15 krajów z flagami) |
| Club Setup | `club-setup.tsx` | 5-krokowy kreator: Województwo → Okręg → Klub → Drużyna → Potwierdzenie |
| Complete | `complete.tsx` | Podsumowanie z animacją confetti i tabelą ligową |

### Główne Zakładki (app/(tabs)/)

| Ekran | Plik | Opis |
|-------|------|------|
| Dashboard | `index.tsx` | Statystyki klubu, ostatnia aktywność, skróty |
| Players | `players.tsx` | Lista zawodników z wyszukiwarką i filtrami pozycji |
| Matches | `matches.tsx` | Nadchodzące/zakończone mecze z wynikami |
| Calendar | `calendar.tsx` | Widok miesięczny, tworzenie wydarzeń |
| More | `more.tsx` | Menu rozszerzone (slide-up sheet) |

### Zarządzanie Zawodnikami (app/player/)

| Ekran | Plik | Opis |
|-------|------|------|
| Player Detail | `[id].tsx` | Profil, statystyki (ring chart), historia meczów |
| Add Player | `add.tsx` | Formularz z upload zdjęcia |
| Player Stats | `player-stats/[id].tsx` | Szczegółowe statystyki, frekwencja |

### Zarządzanie Meczami (app/match/)

| Ekran | Plik | Opis |
|-------|------|------|
| Match Detail | `[id].tsx` | Wynik, skład, statystyki, udostępnianie social media |
| Add Match | `add.tsx` | Formularz meczu |
| Live Match | `live-match.tsx` | Śledzenie na żywo z minutnikiem |

### Treningi (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Trainings | `trainings.tsx` | Lista treningów z harmonogramem |
| Training Detail | `training/[id].tsx` | Szczegóły, frekwencja, notatki |
| Auto Reminders | `auto-reminders.tsx` | Konfiguracja automatycznych przypomnień |

### Finanse (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Finances | `finances.tsx` | Dashboard z wykresami, przychody/wydatki |
| Frequency Report | `frequency-report.tsx` | Raport frekwencji z eksportem PDF/CSV |

### Szkółka (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Academy | `academy.tsx` | Dashboard uczniów, płatności |
| Parent Notifications | `parent-notifications.tsx` | Przypomnienia o płatnościach |

### Klub (app/club/)

| Ekran | Plik | Opis |
|-------|------|------|
| Club Detail | `[id].tsx` | Informacje o klubie |
| Club Settings | `settings.tsx` | Ustawienia klubu, SMS, email |
| Club Members | `[id]/members.tsx` | Członkowie z rolami |
| Club Structure | `club-structure.tsx` | Zaproszenia, zarządzanie strukturą |
| Club Colors | `club-colors.tsx` | Kolory klubu dla social media |
| Club Logo | `club-logo.tsx` | Upload logo klubu |
| Backup | `backup.tsx` | Eksport/import danych JSON |

### Kalendarz i Synchronizacja (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Calendar Export | `calendar-export.tsx` | Eksport do ICS |
| Calendar Sync | `calendar-sync.tsx` | Bulk export wydarzeń |
| Google Calendar | `google-calendar-settings.tsx` | Integracja Google Calendar |
| Apple Calendar | `apple-calendar-settings.tsx` | Integracja Apple Calendar |

### Social Media (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Social Media Settings | `social-media-settings.tsx` | Konfiguracja FB/IG OAuth |
| Social Media Post | `social-media-post.tsx` | Tworzenie postów |
| Social Media History | `social-media-history.tsx` | Historia opublikowanych postów |

### Powiadomienia (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Notifications | `notifications.tsx` | Lista powiadomień |
| Notification History | `notification-history.tsx` | Historia powiadomień |
| Notification Preferences | `notification-preferences.tsx` | Ustawienia powiadomień |
| Notification Settings | `notifications/settings.tsx` | Konfiguracja SMS API |

### Powołania (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Callups | `callups.tsx` | Wybór zawodników na mecz |
| My Callups | `my-callups.tsx` | Powołania dla zawodnika |

### Panel Admin (app/admin/)

| Ekran | Plik | Opis |
|-------|------|------|
| Admin Dashboard | `index.tsx` | Główny panel, konfiguracja Stripe |
| Analytics | `analytics.tsx` | Wykresy aktywności, przychody |
| Audit Logs | `audit-logs.tsx` | Logi bezpieczeństwa |
| Security | `security.tsx` | 2FA, ustawienia bezpieczeństwa |
| Campaigns | `campaigns.tsx` | Kampanie powiadomień |
| A/B Testing | `ab-testing.tsx` | Testy A/B dla reklam |
| Ad ROI | `ad-roi.tsx` | Dashboard ROI reklam |
| Notification Segments | `notification-segments.tsx` | Segmentacja użytkowników |
| Trials | `trials.tsx` | Zarządzanie okresami próbnymi |

### Inne Ekrany (app/)

| Ekran | Plik | Opis |
|-------|------|------|
| Gallery | `gallery.tsx` | Galeria zdjęć z albumami |
| Injuries | `injuries.tsx` | Kontuzje zawodników |
| Teams | `teams.tsx` | Zarządzanie drużynami |
| Help | `help.tsx` | FAQ i pomoc |
| Profile | `profile.tsx` | Profil użytkownika |
| Settings | `settings.tsx` | Ustawienia aplikacji |
| Subscription | `subscription.tsx` | Plany PRO |
| League Table | `league-table.tsx` | Tabela ligowa |
| Messages | `messages.tsx` | Wiadomości |
| Bulletin Board | `bulletin-board.tsx` | Tablica ogłoszeń |
| Surveys | `surveys.tsx` | Ankiety |
| Export | `export.tsx` | Eksport danych CSV |
| Offline Settings | `offline-settings.tsx` | Tryb offline |
| Delete Account | `delete-account.tsx` | Usuwanie konta |
| Farewell | `farewell.tsx` | Ekran pożegnalny po wylogowaniu |

---

## Komponenty Wielokrotnego Użytku

### UI Components (components/)

| Komponent | Plik | Opis |
|-----------|------|------|
| ThemedText | `themed-text.tsx` | Tekst z obsługą dark/light mode |
| ThemedView | `themed-view.tsx` | View z obsługą motywu |
| AnimatedButton | `ui/animated-button.tsx` | Przycisk z animacją |
| IconSymbol | `ui/icon-symbol.tsx` | Ikony SF Symbols/Material |
| Collapsible | `ui/collapsible.tsx` | Rozwijana sekcja |

### Feature Components (components/)

| Komponent | Plik | Opis |
|-----------|------|------|
| ClubSelectionWizard | `club-selection-wizard.tsx` | 5-krokowy kreator wyboru klubu |
| ClubSearch | `club-search.tsx` | Wyszukiwarka klubów |
| LeagueTable | `league-table.tsx` | Tabela ligowa z pozycjami |
| SocialShareCard | `social-share-card.tsx` | Karta do social media (8 szablonów) |
| PlayerCard | `player-card.tsx` | Karta zawodnika |
| AdBanner | `ad-banner.tsx` | Banner reklamowy |
| AdmobBanner | `admob-banner.tsx` | Google AdMob |
| OfflineIndicator | `offline-indicator.tsx` | Wskaźnik trybu offline |
| PWAInstallBanner | `pwa-install-banner.tsx` | Banner instalacji PWA |
| RealtimeToast | `realtime-toast.tsx` | Toast dla WebSocket |
| SyncBadgeIcon | `sync-badge-icon.tsx` | Badge synchronizacji |
| TrialBanner | `trial-banner.tsx` | Banner okresu próbnego |
| ScheduleChangeCard | `schedule-change-card.tsx` | Karta zmiany harmonogramu |

---

## Funkcjonalności Szczegółowo

### 1. Onboarding Flow

Nowy użytkownik przechodzi przez 5-krokowy kreator:

1. **Welcome** - Logo SKM, lista funkcji (Zarządzanie kadrą, Statystyki, Kalendarz, Finanse, Osiągnięcia)
2. **Country Select** - 15 krajów z flagami i statusem (aktywne/coming soon)
3. **Club Setup Step 1** - Wybór województwa (16 regionów)
4. **Club Setup Step 2** - Wybór okręgu OZPN
5. **Club Setup Step 3** - Wyszukiwarka klubów z filtrami
6. **Club Setup Step 4** - Wybór drużyny (kategorie wiekowe: SEN, U19, U17, U15, U13, U11, U9, U7)
7. **Club Setup Step 5** - Potwierdzenie z podglądem tabeli ligowej (sezon 2025/2026)

### 2. System Powołań

Trener może powołać zawodników na mecz:

- Wybór całej drużyny lub indywidualnych zawodników
- Wybór kanału powiadomień (App/SMS/Both)
- Automatyczne powiadomienia 48h i 24h przed meczem
- Zawodnik potwierdza/odmawia obecność
- Śledzenie statusu odpowiedzi

### 3. Social Media Sharing

8 szablonów graficznych:
- Ciemny (Dark)
- Gradient
- Minimalny (Minimal)
- Wyrazisty (Bold)
- Neon
- Retro
- Sportowy (Sport)
- Elegancki (Elegant)
- Klubowy (z kolorami klubu)

Typy postów:
- Wynik meczu
- Zapowiedź meczu
- Statystyki zawodnika

### 4. Integracja RegioWyniki

Scraping danych z RegioWyniki.pl:
- Wyszukiwanie klubów po nazwie
- Pobieranie tabel ligowych
- Synchronizacja terminarza meczów
- Cache z TTL (10min dla wyszukiwania, 30min dla tabeli, 1h dla terminarza)
- Rate limiting (10 req/min)

### 5. System Subskrypcji

Plany PRO:
- Miesięczny
- Roczny (zniżka)

Funkcje PRO:
- Brak reklam
- Nieograniczone SMS
- Zaawansowane raporty PDF
- Eksport danych
- Priorytetowe wsparcie

### 6. Tryb Offline

- Cachowanie danych lokalnie (AsyncStorage)
- Wskaźnik trybu offline
- Synchronizacja po powrocie online
- Kolejkowanie operacji

---

## Hooks (hooks/)

| Hook | Plik | Opis |
|------|------|------|
| useAuth | `use-auth.ts` | Autoryzacja, login/logout |
| useClubRole | `use-club-role.ts` | Sprawdzanie roli w klubie |
| useThemeColor | `use-theme-color.ts` | Kolory motywu |
| useColorScheme | `use-color-scheme.ts` | Dark/light mode |
| useOffline | `use-offline.ts` | Stan offline |
| useOfflineQuery | `use-offline-query.ts` | Zapytania z cache |
| usePushNotifications | `use-push-notifications.ts` | Powiadomienia push |
| useNotificationSound | `use-notification-sound.ts` | Haptic feedback |
| useRealtime | `use-realtime.ts` | WebSocket |
| usePWAInstall | `use-pwa-install.ts` | Instalacja PWA |
| useLogoutConfirm | `use-logout-confirm.ts` | Potwierdzenie wylogowania |
| useTranslation | `use-translation.ts` | i18n tłumaczenia |
