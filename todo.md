# Small Club Manager - TODO

## Completed Features
- [x] Dashboard/Home screen with club overview
- [x] Players list with search and filters
- [x] Matches list with upcoming/past tabs
- [x] Calendar view with events
- [x] More menu with all features
- [x] Add/Edit player screen
- [x] Player detail screen with statistics
- [x] Add/Edit match screen
- [x] Match detail screen
- [x] Trainings list and management
- [x] Finances overview with income/expenses
- [x] Academy (Szkółka) management
- [x] Notifications list
- [x] Settings screen
- [x] Subscription/PRO plans screen
- [x] Master Admin panel with user management
- [x] Grant/revoke PRO status
- [x] View all users and clubs
- [x] Create club screen
- [x] Club detail screen
- [x] New SKM logo (option 3 - dynamic S with ball)
- [x] Teams management screen (Zespoły)
- [x] Club structure screen (Struktura Klubu) - user invitations, roles
- [x] Callups system (Powołania) - select players for matches
- [x] Injuries module (Kontuzje) - track player injuries
- [x] Gallery module (Galeria) - photos with albums
- [x] PDF reports screen (Raporty PDF)
- [x] Help screen with FAQ
- [x] Profile screen
- [x] Notification settings screen with SMS API config
- [x] Club settings screen
- [x] Back navigation button on all screens

## System Ról i Uprawnień (Completed)
- [x] Rozszerzenie schematu bazy danych o role i uprawnienia
- [x] Tabela club_members z rolami
- [x] Tabela club_invitations dla zaproszeń
- [x] Backend middleware dla ról (ROLE_PERMISSIONS system)
- [x] API zaproszeń (create, list, accept, revoke, getByToken)
- [x] API członków klubu (list, updateRole, remove, getMyRole)
- [x] useClubRole hook dla sprawdzania uprawnień w frontend
- [x] Frontend - ekran struktury klubu z zaproszeniami (real API)
- [x] Frontend - lista członków z zarządzaniem rolami
- [x] Frontend - ukrywanie sekcji na podstawie roli (Finanse, Struktura)
- [x] Ekran akceptacji zaproszenia (/invite/[token])

## Automatyczne Powiadomienia (Completed)
- [x] Schemat bazy danych dla powołań (match_callups) - rozszerzony
- [x] Schemat dla harmonogramu powiadomień (scheduled_notifications)
- [x] Backend API dla powołań (createForMatch, getForMatch, getMyCallups, respond)
- [x] Serwis powiadomień SMS (Twilio z kluczem użytkownika)
- [x] Serwis powiadomień email (przygotowany)
- [x] Automatyczne planowanie 48h przed meczem
- [x] Automatyczne planowanie 24h przed meczem
- [x] Frontend - wybór zawodników do powołania z kanałem powiadomień
- [x] Frontend - ekran "Moje powołania" dla zawodników
- [x] Frontend - potwierdzenie/odmowa obecności przez zawodnika
- [x] Wybór kanału powiadomień (App/SMS/Both)
- [x] Dokumentacja integracji zewnętrznych (docs/EXTERNAL_INTEGRATIONS.md)

## Twilio i Stripe Integration (Completed)
- [x] Panel konfiguracji Twilio dla właściciela klubu (Ustawienia Klubu)
- [x] Wybór dostawcy SMS (Twilio, SMSAPI, SMSLabs)
- [x] Integracja Stripe dla płatności subskrypcji
- [x] Router subscriptions z checkout i cancel
- [x] Panel Master Admin - zarządzanie cenami subskrypcji
- [x] Tworzenie/edycja planów subskrypcji (miesięczny/roczny)
- [x] Tabela app_settings dla globalnej konfiguracji Stripe
- [x] Tabela user_subscriptions dla śledzenia subskrypcji
- [x] Ekran zakupu subskrypcji PRO z wyborem okresu
- [x] Anulowanie subskrypcji przez użytkownika

## Pending Features (Future)
- [x] Panel konfiguracji SMTP w UI (backend gotowy)
- [x] PWA install prompt (use-pwa-install.ts, pwa-install-banner.tsx)
- [ ] Advertising/affiliate space
- [x] Real-time notifications with WebSockets (websocketService.ts, use-realtime.ts)
- [x] Offline mode with data caching (offline-storage.ts, use-offline.ts)
- [x] Offline settings screen (offline-settings.tsx)
- [x] Advanced analytics dashboard


## Webhook i Cron Job (Completed)
- [x] Stripe webhook endpoint dla potwierdzenia płatności
- [x] Automatyczna aktywacja PRO po płatności
- [x] Cron job dla przetwarzania scheduled_notifications
- [x] Wysyłanie SMS przez Twilio/SMSAPI
- [x] Przypomnienia o płatnościach dla rodziców w Szkółce
- [x] Przycisk wysyłania przypomnień w module Szkółka


## Kontynuacja Rozwoju (Completed)
- [x] Integracja SMTP do wysyłania emaili (emailService.ts)
- [x] Pola SMTP w schemacie bazy danych
- [x] Upload zdjęć do S3 w module Galeria (photoService.ts, photos router)
- [x] Galeria z expo-image-picker
- [x] Rzeczywiste generowanie raportów PDF (pdfService.ts)
- [x] Reports router z generowaniem HTML
- [x] Ekran raportów z podglądem i udostępnianiem


## Wielojęzyczność i Integracje (Completed)
- [x] Wielojęzyczność (i18n) - PL, EN, DE
- [x] Pliki tłumaczeń dla każdego języka (pl.json, en.json, de.json)
- [x] Hook useTranslation z i18next
- [x] Wybór języka w ustawieniach
- [x] Integracja Google Calendar (calendarService.ts)
- [x] Eksport kalendarza do ICS
- [x] Ekran eksportu kalendarza
- [x] Eksport danych do CSV (excelService.ts)
- [x] Ekran eksportu danych


## PWA i Push Notifications (Completed)
- [x] PWA manifest dla web (manifest.json)
- [x] Service worker dla offline (sw.js)
- [x] Offline page (offline.html)
- [x] Expo push notifications hook (use-push-notifications.ts)
- [x] Local notification helpers
- [x] Scheduled notifications support


## Onboarding i Dokumentacja (Completed)
- [x] Ekrany onboardingu z przewodnikiem po funkcjach
- [x] Animowany przycisk (AnimatedButton component)
- [x] Dokumentacja wdrożeniowa (DEPLOYMENT.md)
- [x] Instrukcje EAS Build dla Android i iOS
- [x] Instrukcje publikacji w App Store i Google Play
- [x] Konfiguracja PWA


## Audyt Bezpieczeństwa (Completed)
- [x] Sprawdzenie szyfrowania haseł (JWT z HS256)
- [x] Weryfikacja przechowywania kluczy API (AES-256-GCM)
- [x] Bezpieczeństwo połączenia z bazą danych (SSL)
- [x] Szyfrowanie wrażliwych danych (Twilio, SMTP)
- [x] Walidacja danych wejściowych (Zod schemas)
- [x] Ochrona przed SQL injection (Drizzle ORM)
- [x] Bezpieczeństwo sesji i tokenów JWT
- [x] Raport bezpieczeństwa (docs/SECURITY_AUDIT.md)


## Zaawansowane Bezpieczeństwo (Completed)
- [x] Audit log - tabela w bazie danych (audit_logs)
- [x] Logowanie wrażliwych operacji (zmiany ról, konfiguracji)
- [x] Ekran przeglądania logów w panelu Master Admin (admin/audit-logs.tsx)
- [x] Rate limiting na endpointy SMS (rateLimitService.ts)
- [x] Rate limiting na endpointy logowania
- [x] 2FA dla konta Master Admin (twoFactorService.ts)
- [x] Generowanie i weryfikacja kodów TOTP
- [x] Ekran konfiguracji 2FA (admin/security.tsx)


## Dashboard Analityczny i WebSocket (Completed)
- [x] Dashboard analityczny z wykresami (admin/analytics.tsx)
- [x] Statystyki aktywności użytkowników
- [x] Statystyki klubów i przychodów z subskrypcji
- [x] WebSocket hook dla powiadomień w czasie rzeczywistym (use-realtime.ts)
- [x] Backup - eksport danych klubu do JSON (backupService.ts)
- [x] Restore - import danych z pliku JSON (club/backup.tsx)
- [x] Backend API dla backup/restore (backup router)
- [x] Backend API dla analytics (analytics router)


## UI Improvements (Completed)
- [x] WebSocket notifications UI integration (realtime-toast.tsx)
- [x] Sync indicator badge on More tab (sync-badge-icon.tsx)
- [x] tRPC caching wrapper for offline support (trpc-offline.ts)


## Enhanced Features (Completed)
- [x] Integrate offline caching with players list (use-offline-query.ts, offline-indicator.tsx)
- [x] Integrate offline caching with matches list
- [x] Notification sound option with haptic feedback (use-notification-sound.ts)
- [x] Notification history screen (notification-history.tsx)


## Extended Offline & Notifications (In Progress)
- [x] Extend offline caching to trainings screen
- [x] Extend offline caching to finances screen
- [x] Extend offline caching to calendar screen
- [x] Advertising/affiliate space component (ad-banner.tsx)
- [x] Background push notifications with Expo (background-notifications.ts)


## Next Improvements (In Progress)
- [x] Notification settings screen for users (notification-preferences.tsx)
- [x] Ad management panel in admin (admin/ads.tsx)
- [x] System calendar integration (system-calendar.ts, match/[id].tsx, trainings.tsx)


## Calendar & Ads Improvements (In Progress)
- [x] Bulk calendar export for all upcoming events (calendar-sync.tsx)
- [x] Ad statistics charts over time (admin/ads.tsx)
- [x] Sponsor push notifications (sponsor-notifications.ts, notification-preferences.tsx)


## Advanced Features (In Progress)
- [x] Google Calendar API integration for two-way sync (google-calendar-sync.ts, google-calendar-settings.tsx)
- [x] A/B testing for ads with automatic optimization (ab-testing.ts, admin/ab-testing.tsx)
- [x] Notification segmentation by user groups (notification-segments.ts, admin/notification-segments.tsx)


## Campaign & Analytics Features (In Progress)
- [x] Notification campaign creator with scheduling (admin/campaigns.tsx)
- [x] Ad ROI dashboard with analytics (admin/ad-roi.tsx)
- [x] Apple Calendar integration (apple-calendar.ts, apple-calendar-settings.tsx)


## Calendar Event Creation (Completed)
- [x] Day selection in calendar to show events for that day
- [x] Modal/sheet to create new match from selected day
- [x] Modal/sheet to create new training from selected day
- [x] Support multiple events per day display
- [x] Event count indicator for selected day


## Callups & Attendance System (Completed)
- [x] Match callups - select whole team or individual players from different age categories (calendar.tsx)
- [x] Training invitations - select age categories or teams (multiple groups per training)
- [x] Match attendance tracking - mark who attended from callups (match/[id].tsx)
- [x] Training attendance tracking - mark who attended from invited groups (training/[id].tsx)
- [x] Player frequency statistics for trainings (player-stats/[id].tsx)
- [x] Player frequency statistics for matches


## Attendance Enhancements (In Progress)
- [x] Attendance notifications for unmarked players after training (attendance-notifications.ts, training/[id].tsx)
- [x] Frequency report PDF export for team (frequency-report.tsx)
- [x] Absence excuse system with reasons (absence-excuse.tsx, training/[id].tsx)


## Reminder & Analytics Improvements (In Progress)
- [x] Automatic reminder scheduling before trainings (auto-reminders.ts, auto-reminders.tsx)
- [x] Team frequency comparison chart (team-frequency.tsx)
- [x] Excel/CSV export for frequency data (frequency-report.tsx)


## WhatsApp Integration (In Progress)
- [x] WhatsApp Business API configuration service (whatsapp-service.ts)
- [x] WhatsApp settings screen for users (whatsapp-settings.tsx)
- [x] Integration with notification system (attendance-notifications.ts)
- [x] WhatsApp message templates for reminders (whatsapp-templates.tsx)


## Messaging Improvements (In Progress)
- [x] WhatsApp test connection button (whatsapp-settings.tsx - handleTestMessage)
- [x] WhatsApp message statistics and history (whatsapp-stats.tsx)
- [x] SMS integration with user's own provider (sms-user-service.ts, sms-settings.tsx)


## Unified Messaging (In Progress)
- [x] SMS statistics screen with history and charts (sms-stats.tsx)
- [x] Unified messaging settings screen (messaging-settings.tsx)
- [x] Monthly cost limits with alerts for SMS/WhatsApp (messaging-limits.tsx)


## Coach & Parent Features (Completed)
- [x] Coach dashboard with team attendance and stats (coach-dashboard.tsx)
- [x] Automatic parent notifications for child absences (parentNotificationService.ts, parent-notifications.tsx)
- [x] PDF export for frequency and statistics reports (pdf-export.tsx, pdfService.ts)


## Player Rating System (Completed)
- [x] Database schema for player ratings (player_ratings table)
- [x] Rating categories: technique, engagement, progress, teamwork
- [x] Coach rating form after training/match (player-rating.tsx)
- [x] Player rating history and trends (player-ratings.tsx)
- [x] Rating summary in player profile

## Parent Panel (Completed)
- [x] Parent role in club membership (parentChildren table)
- [x] Child schedule view (trainings, matches)
- [x] Attendance history for child
- [x] Payment history and pending fees
- [x] Parent panel screen (parent-panel.tsx)

## Team Statistics Dashboard (Completed)
- [x] Match results comparison charts
- [x] Attendance trends over time
- [x] Top scorers ranking
- [x] Season summary statistics
- [x] Team performance indicators (team-statistics.tsx)


## Messaging System (Completed)
- [x] Database schema for messages (messages table)
- [x] Message threads between coach and parent
- [x] Unread message counter
- [x] Message notifications
- [x] Messages screen UI (messages.tsx)

## Push Notifications (Completed)
- [x] Push notification service setup (pushNotificationService.ts)
- [x] Automatic reminders for upcoming trainings
- [x] Schedule change notifications
- [x] Parent notification preferences (push-settings.tsx)

## Statistics Export (Completed)
- [x] PDF/HTML/CSV export from team statistics dashboard
- [x] Include charts and rankings in export
- [x] Season summary report generation (statistics-export.tsx)


## Email Notifications (Completed)
- [x] Email service setup with templates (emailService.ts)
- [x] Weekly summary emails for parents
- [x] Event reminder emails
- [x] Email preferences screen (email-settings.tsx)

## Parent Surveys (Completed)
- [x] Database schema for surveys and votes (surveys, surveyOptions, surveyVotes tables)
- [x] Survey creation form for coaches
- [x] Voting interface for parents (surveys.tsx)
- [x] Survey results visualization

## Change History (Completed)
- [x] Audit log for schedule changes (changeHistory table)
- [x] Change history viewer (change-history.tsx)
- [x] Revert functionality for recent changes


## Survey Creation & Notifications (Completed)
- [x] Survey creation form for coaches (create-survey.tsx)
- [x] Survey options editor with type selection
- [x] Date picker for date voting surveys
- [x] Push notifications for new surveys (surveyNotificationService.ts)
- [x] Email notifications for new surveys

## Automatic Change Logging (Completed)
- [x] Change logging service (changeLogService.ts)
- [x] Integrate change history with training CRUD
- [x] Integrate change history with match CRUD
- [x] Integrate change history with player CRUD
- [x] Integrate change history with finance CRUD

## Player Dashboard (Completed)
- [x] Personal statistics overview (goals, assists, attendance)
- [x] Upcoming trainings and matches schedule
- [x] Recent ratings from coach
- [x] Performance metrics (attendance rate, average rating, cards)
- [x] Quick actions (callups, surveys, messages, stats)
- [x] Player dashboard screen (player-dashboard.tsx)


## Player Achievements System (Completed)
- [x] Database schema for achievements and player_achievements
- [x] Achievement types: goals milestones, attendance streaks, rating excellence
- [x] Badge icons and visual design
- [x] Achievement progress tracking
- [x] Achievements display in player profile (player-achievements.tsx)

## Player Comparison (Completed)
- [x] Select multiple players for comparison
- [x] Side-by-side stats comparison view
- [x] Radar chart for skill comparison
- [x] Visual comparison bars
- [x] Player comparison screen (player-comparison.tsx)

## Development Trends (Completed)
- [x] Rating trends over time chart
- [x] Goals/assists bar chart progression
- [x] Attendance trend visualization
- [x] Time range selector (3m, 6m, 1y, all)
- [x] Period summary statistics
- [x] Development trends screen (player-trends.tsx)


## Club Leaderboard (Completed)
- [x] Points calculation from achievements and stats
- [x] Season leaderboard with rankings and podium
- [x] Category leaders (goals, assists, attendance, rating)
- [x] Monthly/weekly/season time range filter
- [x] Leaderboard screen (club-leaderboard.tsx)

## Training Goals (Completed)
- [x] Database schema for player goals (trainingGoals table)
- [x] Goal types: goals, assists, attendance, rating, custom
- [x] Goal creation form with target values
- [x] Progress tracking with visual progress bars
- [x] Goals screen (training-goals.tsx)

## Achievements Export (Completed)
- [x] Certificate/diploma template design with preview
- [x] Player achievements summary with selection
- [x] PDF generation for printing
- [x] Share achievements functionality
- [x] Export screen (achievements-export.tsx)


## Goal Notifications (Completed)
- [x] Service for tracking goal progress (goalNotificationService.ts)
- [x] Notifications when approaching goal (75%, 90%)
- [x] Celebration notification on goal completion
- [x] Milestone detection and message generation

## Seasonal Awards (Completed)
- [x] Database schema for awards (seasonalAwards table)
- [x] Award types: MVP, Top Scorer, Best Attendance, Most Improved, Best Defender, Best Goalkeeper, Fair Play
- [x] Season selector with historical data
- [x] MVP featured card with podium display
- [x] Awards screen (seasonal-awards.tsx)

## Club Bulletin Board (Completed)
- [x] Database schema for announcements (announcements, announcementReads tables)
- [x] Announcement creation for coaches/admins
- [x] Priority levels (normal, important, urgent)
- [x] Read status tracking and filtering
- [x] Pinned announcements support
- [x] Bulletin board screen (bulletin-board.tsx)


## Photo Gallery (Completed)
- [x] Database schema for photos and albums (photoAlbums, photos, photoTags tables)
- [x] Photo upload from device camera/gallery
- [x] Album organization by event/date
- [x] Player tagging in photos
- [x] Photo gallery screen (photo-gallery.tsx)

## Calendar Integration (Already Existed)
- [x] Export events to iCal format
- [x] Google Calendar integration
- [x] Apple Calendar integration
- [x] Subscribe to club calendar feed
- [x] Calendar export screen (calendar-export.tsx)

## Season Statistics Summary (Completed)
- [x] Season overview with key metrics
- [x] Comparison with previous seasons
- [x] Charts for goals, attendance, results
- [x] Best performers of the season (top scorer, assister, attendance)
- [x] Season summary screen (season-summary.tsx)


## Album Sharing (Completed)
- [x] Generate shareable public links for albums
- [x] Public album view without login
- [x] Link expiration settings (1 day, 7 days, 30 days, unlimited)
- [x] Share via social media / messaging (WhatsApp, Messenger, Email)
- [x] Album sharing screen (share-album.tsx)

## Season Summary Export (Completed)
- [x] HTML/CSV generation from season summary
- [x] Include charts and statistics in export
- [x] Club branding in exported document
- [x] Share/download options
- [x] Season export functionality in season-summary.tsx and pdfService.ts

## Additional Improvements (Completed)
- [x] Export button in season summary header
- [x] Share album link in more menu
- [x] Improved navigation and UX polish


## External Cloud Storage Integration (Completed)
- [x] Cloud storage settings screen (cloud-storage-settings.tsx)
- [x] Support for Google Drive, Dropbox, OneDrive
- [x] User connects their own cloud account via OAuth
- [x] Photos stored on user's cloud, not app storage
- [x] Cloud folder selection and sync settings (wifi only, auto-sync)
- [x] Cloud storage service (cloudStorageService.ts)

## Automatic Training Reminders (Completed)
- [x] Reminder service for upcoming events (trainingReminderService.ts)
- [x] Send notifications 24h before training/match
- [x] Message formatting for push, SMS, email channels
- [x] Integration with notification system

## Public Album View (Completed)
- [x] Public page for shared album links (public-album.tsx)
- [x] No login required for viewing
- [x] Respect sharing settings (download, expiration)
- [x] Mobile-optimized gallery with lightbox viewer
- [x] Navigation arrows and photo counter


## Enhanced Invitation & Permission System (Completed)
- [x] Manager permissions panel with member search (manager-permissions.tsx)
- [x] Role hierarchy: Manager > Board > Coach > Player
- [x] Board members and coaches can only invite players
- [x] Manager can change any member's permissions
- [x] Search members by name, email, role
- [x] Grant/revoke permissions from manager panel
- [x] Invitation restrictions based on sender's role (routers.ts)
- [x] Role change restrictions based on hierarchy (routers.ts)


## Non-Intrusive Ad Placement (In Progress)
- [ ] Ad banner component that doesn't interfere with app usage
- [ ] Strategic ad placement (bottom of screens, between sections)
- [ ] Ad rotation and management
- [ ] Respect user experience - no popups or overlays

## Player Card Navigation (In Progress)
- [ ] Clickable player cards in match lineup
- [ ] Clickable player cards in training attendance
- [ ] Clickable player cards in team roster
- [ ] Clickable player cards in statistics screens
- [ ] Navigate to player profile from any list

## Expanded Match Statistics (In Progress)
- [ ] Goals per player per match
- [ ] Assists per player per match
- [ ] Clean sheets for goalkeepers
- [ ] Goals conceded for goalkeepers
- [ ] Successful saves/interventions
- [ ] Minutes played per match
- [ ] Yellow/red cards per match
- [ ] Match statistics input form

## Team-Specific Rankings (In Progress)
- [ ] Separate statistics for each team
- [ ] Separate statistics for academy (szkółka)
- [ ] Top scorer per team/season
- [ ] Top assister per team/season
- [ ] Best goalkeeper per team/season
- [ ] Most minutes played per team/season
- [ ] Best training attendance per team/season
- [ ] Team rankings dashboard



## Non-Intrusive Ad Placement (Completed)
- [x] Ad banner component (ad-banner.tsx)
- [x] Placement at bottom of screens, not blocking content
- [x] Sponsored section in more menu
- [x] Ad rotation and tracking

## Player Card Navigation (Completed)
- [x] Clickable player cards from all screens (player-card.tsx)
- [x] Player detail screen with full profile (player/[id].tsx)
- [x] Navigation from matches, trainings, teams, stats
- [x] Quick actions on player profile (add stats, rate, message)

## Expanded Match Statistics (Completed)
- [x] Goals, assists, clean sheets tracking
- [x] Minutes played per match
- [x] Yellow/red cards
- [x] Goalkeeper stats (saves, goals conceded)
- [x] Add stats form after match (add-player-stats.tsx)

## Separate Team Rankings (Completed)
- [x] Rankings per team (not just club-wide)
- [x] Academy separate from main teams
- [x] Top scorer, assister, attendance per team
- [x] Season stats per team (team-rankings.tsx)


## Automatic Stats Updates (Completed)
- [x] Integrate match stats form with database (db.ts)
- [x] Auto-calculate player season stats after match (updatePlayerSeasonStats)
- [x] Update rankings automatically after stats entry
- [x] Match stats API endpoint (players.addMatchStats)

## Ranking Notifications (Completed)
- [x] Ranking milestone detection service (rankingNotificationService.ts)
- [x] Notifications when player moves up in ranking
- [x] Notifications for top 3 achievements
- [x] Weekly ranking summary notifications

## Rankings PDF Export (Completed)
- [x] PDF/HTML/CSV export for team rankings (rankings-export.tsx)
- [x] Include podium and full ranking list
- [x] Category filter in export (goals, assists, attendance, rating, minutes)
- [x] Team filter and preview before export


## Live Match Statistics (In Progress)
- [ ] Live match screen with real-time timer
- [ ] Quick buttons for goals, assists, cards during match
- [ ] Player selection for each event
- [ ] Match timeline with events
- [ ] Pause/resume timer functionality
- [ ] End match and save all stats

## Season Comparison (In Progress)
- [ ] Compare stats between different seasons
- [ ] Charts showing goals, wins, attendance trends
- [ ] Team performance over multiple seasons
- [ ] Best season highlights

## Automatic Awards (In Progress)
- [ ] Service for detecting milestone achievements
- [ ] Auto-award badges when milestones reached
- [ ] Notification to player about new award
- [ ] Award ceremony animation/modal


## Live Match Statistics (Completed)
- [x] Real-time match timer with half tracking (live-match.tsx)
- [x] Quick stat entry buttons (goal, assist, card, sub)
- [x] Player selection for stat attribution
- [x] Live score display
- [x] Match events timeline

## Season Comparison (Completed)
- [x] Compare two seasons side by side (season-comparison.tsx)
- [x] Charts for goals, wins, attendance trends
- [x] Team performance comparison
- [x] Season selector

## Automatic Awards (Completed)
- [x] Milestone detection service (autoAwardsService.ts)
- [x] Auto-award badges when thresholds reached
- [x] Badge definitions for all categories (goals, assists, attendance, etc.)
- [x] Next milestone progress tracking


## Live Stats Database Integration (Completed)
- [x] Save match events to database in real-time
- [x] Match events table schema (matchEvents)
- [x] API endpoint for creating match events
- [x] Update player stats after match ends
- [x] Match timeline persistence

## Badge Notifications (Completed)
- [x] Push notification when badge is earned
- [x] Badge notification service integration
- [x] In-app notification for new achievements
- [ ] Badge celebration animation (UI enhancement)

## Match Report PDF Export (Completed)
- [x] Single match report generation
- [x] Include match events timeline
- [x] Player statistics for the match
- [x] Team formation and lineup
- [ ] Share/download match report (UI integration)


## Facebook & Instagram Integration (Backend Ready)
- [x] Social media integration service (socialMediaService.ts)
- [x] Database schema for connections and posts
- [ ] Facebook/Instagram account connection UI
- [ ] Match statistics sharing templates
- [ ] Match announcement/preview templates
- [ ] Post scheduler for social media
- [ ] Social media settings screen


## PZPN Data Integration (In Progress)
- [x] Research PZPN/OZPN data sources and APIs
- [x] PZPN data scraping/API service
- [x] Regional associations (OZPN) selection
- [x] League tables import
- [x] Team selection and registration
- [ ] Manager verification as team representative
- [ ] Automatic data synchronization scheduler
- [ ] Match schedule import from PZPN


## Social Media UI (Completed)
- [x] Social media settings screen
- [x] Facebook connection flow
- [x] Instagram connection flow
- [x] Connected accounts list
- [x] Disconnect account option

## Post Templates (Completed)
- [x] Match result template with stats
- [x] Match preview/announcement template
- [x] Player highlight template
- [x] Season stats template
- [x] Custom post template
- [x] Template preview before posting
- [x] Platform selection (FB/Instagram)
- [ ] Schedule post for later (UI ready, backend pending)

## PZPN Expansion (In Progress)
- [ ] Add Mazowiecki ZPN scraping
- [ ] Add Śląski ZPN scraping
- [ ] Add more regional associations
- [ ] Unified scraping interface


## International Country Selection (Completed)
- [x] Country selection screen with flags
- [x] Football association data for each country
- [x] Poland (PZPN) - already implemented
- [x] Germany (DFB) - lower leagues data
- [x] Czech Republic (FAČR) - league data
- [x] Slovakia (SFZ) - league data
- [x] Austria (ÖFB) - league data
- [x] International league service with all countries
- [x] League selection flow (country → region → league → team)
- [ ] Language localization based on country
- [ ] Store selected country in user preferences


## New Countries Support (Completed)
- [x] England (FA) - National League System (Step 5-10)
- [x] Netherlands (KNVB) - Amateur leagues (Derde Divisie - Vierde Klasse)
- [x] Belgium (KBVB) - Provincial leagues (Eerste Amateur - 3e Provinciale)
- [x] Denmark (DBU) - Danmarksserien (2. Division - Serie 2)
- [x] Sweden (SvFF) - Division system (Division 1-7)


## Additional Countries (Completed)
- [x] France (FFF) - Ligue 1 → District 2 (13 regions)
- [x] Italy (FIGC) - Serie A → Terza Categoria (20 regions)
- [x] Spain (RFEF) - La Liga → Segunda Regional (17 regions)

## League Data Scraping (Completed)
- [x] Research official data sources for each country
- [x] Unified league scraping service (leagueScrapingService.ts)
- [x] FA Full-Time API integration (England)
- [x] KNVB voetbal.nl API integration (Netherlands)
- [x] Fogis scraping (Sweden)
- [x] Data source configuration for all 14 countries
- [ ] Automatic data synchronization scheduler (cron job pending)


## Cron Job & Onboarding (Completed)
- [x] Cron job for automatic league data sync (every 24h)
- [x] Country selection in onboarding flow (app/onboarding/country.tsx)
- [x] Match schedule import to calendar (matchImportService.ts)
- [x] User country preference storage (AsyncStorage)


## Calendar Import & Notifications (Completed)
- [x] Import matches button in calendar
- [x] Import matches screen (import-matches.tsx)
- [x] Sync status screen with import history (sync-status.tsx)
- [x] Schedule change notifications (notificationService.ts)
- [x] Last sync timestamp display


## Sync Settings & Enhanced Notifications (Completed)
- [x] Sync settings screen with frequency options (12h, 24h, 48h, manual)
- [x] Enhanced change notifications with old vs new comparison (ScheduleChangeCard component)
- [x] Connect to real league data APIs (FA Full-Time, KNVB, Fogis)
- [x] Store sync preferences in AsyncStorage
- [x] Link to sync history from import screen
- [x] fetchLeagueDataForClub function for on-demand sync


## Notifications & Calendar Integration (Completed)
- [x] Notifications screen with schedule changes list (ScheduleChangeCard integration)
- [x] Mark notifications as read
- [x] Calendar export integration (iOS/Android) - lib/calendar-export.ts
- [x] Offline mode with data caching - lib/offline-cache.ts
- [x] Cache league tables locally
- [x] Pre-cache essential data function
- [x] Cache statistics and management


## Logout Option (Completed)
- [x] Add logout button to tab bar menu (all 5 tabs)
- [x] Add logout option in settings/more menu
- [x] Logout confirmation dialog (in more.tsx)


## Logout Enhancements (Completed)
- [x] Confirmation dialog for all logout buttons
- [x] Logout animation/farewell screen (farewell.tsx)
- [x] Remember me option for persistent login (RememberMeSetting component)


## Delete Account Feature (Completed)
- [x] Delete account API endpoint (account.deleteAccount)
- [x] Role-based deletion logic (manager vs regular user)
- [x] Manager deletion removes club profile and all data
- [x] Regular user deletion preserves club stats
- [x] Delete account confirmation UI with warnings
- [x] Account info query (account.getAccountInfo)
- [x] Delete account screen with detailed warnings


## Data Export & Account Recovery (Completed)
- [x] Data export service for backup before deletion (dataExportService.ts)
- [x] Export club data to JSON/CSV
- [x] 30-day grace period for account deletion (scheduleAccountDeletion)
- [x] Account recovery during grace period (cancelAccountDeletion)
- [x] Club ownership transfer to another manager (transferClubOwnership)
- [x] Transfer confirmation flow (transfer-club.tsx)
- [x] Get transfer candidates endpoint


## Trial Period & Subscription (Completed)
- [x] Add trial period fields to club schema (trialStartDate, trialEndDate, isTrialActive)
- [x] Create trial status service (trialService.ts)
- [x] Subscription check logic for edit permissions
- [x] Read-only mode UI for expired trials (TrialBanner, ReadOnlyBanner)
- [x] Subscription paywall screen (updated subscription.tsx)
- [x] Trial router with status endpoints
- [x] useTrialStatus hook for app-wide access
- [x] Block editing after trial without subscription


## Ad Banner & Trial Reminders (Completed)
- [x] Ad banner component for trial period (updated ad-banner.tsx with showAds prop)
- [x] Cron job for processing expired trials (cronService.ts)
- [x] Reminder notifications 7, 3, 1 days before trial ends (trialService.ts)
- [x] Trial expiration email template (emailService.ts)


## AdMob & Admin Panel (Completed)
- [x] Google AdMob integration for ad serving (admob-banner.tsx)
- [x] Banner ad component with AdMob
- [x] Interstitial and rewarded ad hooks
- [x] Admin panel for trial management (admin/trials.tsx)
- [x] Extend trial period manually
- [x] View all clubs with trial status
- [x] Conversion statistics tracking (admin/stats.tsx)
- [x] Trial to subscription conversion rate
- [x] Daily activity chart
- [x] Conversion sources breakdown


## Admin Access & Notifications (Completed)
- [x] Add admin panel link to More tab (for isMasterAdmin users)
- [x] Role-based visibility for admin features
- [x] Admin push notifications for new registrations
- [x] Admin push notifications for expiring trials
- [x] Admin push notifications for new subscriptions
- [x] Admin alerts screen (admin/alerts.tsx)
- [x] getAdminUsers database function


## Admin Dashboard & FCM (Completed)
- [x] Admin dashboard with alerts and statistics summary (admin/dashboard.tsx)
- [x] Firebase Cloud Messaging integration (firebase-messaging.ts)
- [x] Production AdMob ID configuration (admob-config.ts)
- [x] FCM token registration service
- [x] Notification channels for Android (default, alerts, reminders)


## Onboarding & Payments (In Progress)
- [ ] Onboarding welcome screen
- [ ] Country selection step
- [ ] Club creation/selection step
- [ ] RevenueCat integration for subscriptions
- [ ] Subscription plans configuration
- [ ] E2E tests for registration flow
- [ ] E2E tests for match creation flow
- [ ] E2E tests for statistics flow


## Onboarding Flow (Completed)
- [x] Welcome screen with app features overview
- [x] Country selection screen (14 countries with football associations)
- [x] Club setup screen (name, city, type)
- [x] Completion screen with trial info and next steps
- [x] Animated transitions between onboarding steps
- [x] Progress indicators (step 1/2/3)
- [x] Skip option for returning users
- [x] AsyncStorage for onboarding state persistence
- [x] Auto-redirect new users to onboarding flow


## Stripe & Social Media Integration (Completed)
- [x] Master Admin panel - Stripe API keys configuration (already exists)
- [x] Social media sharing templates with SKM logo
- [x] Facebook integration for match statistics posting
- [x] Instagram integration for match statistics posting
- [x] Match result template with score and scorers
- [x] Custom post templates with club branding
- [x] Social share card component with 4 style options
- [x] Share button on match detail screen


## Facebook OAuth & Template Gallery (Completed)
- [x] Facebook Graph API OAuth authentication flow
- [x] Facebook Page selection after OAuth
- [x] Instagram Business account linking
- [x] Expanded template gallery with more designs (8 styles)
- [x] Pattern overlays (stripes, diagonal)
- [x] Neon glow effect template
- [x] Elegant gold border template
- [x] Sport dynamic template
- [x] Retro vintage template


## Live Preview, Post History & Custom Colors (Completed)
- [x] Live post preview with real FB/IG data before publishing
- [x] Post history tracking in database (socialMediaPosts table)
- [x] Social posts table schema (already exists)
- [x] Post history screen with links to FB/IG
- [x] Custom club colors for templates (primaryColor, secondaryColor, accentColor in clubs table)
- [x] Club color picker in settings (club-colors.tsx)
- [x] Apply club colors to all templates ("Klubowy" template option)


## Club Logo in Social Media Templates (Completed)
- [x] Club logo upload functionality (uses existing logoUrl from clubs table)
- [x] Display club logo in social share templates
- [x] Replace SKM logo with club logo when available
- [x] Pass club colors and logo to SocialShareCard component


## Bug Fixes (In Progress)
- [ ] Fix logout functionality not working


## PZPN Integration (In Progress)
- [ ] Club search with PZPN data
- [ ] District/region selection (okręgi)
- [ ] Team selection within club
- [ ] Live league table from PZPN website
- [ ] Fix logout functionality


## PZPN Integration (Completed)
- [x] Club search with PZPN database (sample data for demo)
- [x] District/region selection (16 województw)
- [x] Team selection within club
- [x] Live league table component
- [x] League table screen with legend
- [x] Club setup with search/manual modes
- [x] ClubSearch component with region filter
- [x] LeagueTable component with standings
- [x] PZPN client library (lib/pzpn-client.ts)


## Multi-Level Club Search (Completed)
- [x] Hierarchical data: Województwo → Okręg → Liga → Klub
- [x] Multi-step selection wizard UI (5 steps)
- [x] Current season table fetch after club selection
- [x] Club data display (name, league, position, stats)
- [x] 16 województw with OZPN districts
- [x] Central leagues (Ekstraklasa to 3. Liga) + Regional leagues
- [x] Sample clubs data for major cities
- [x] Season 2024/2025 standings preview
