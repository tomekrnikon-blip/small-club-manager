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
