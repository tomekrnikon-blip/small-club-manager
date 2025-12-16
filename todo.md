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

## Pending Features
- [ ] Match callup notifications (48h and 24h before) - backend integration
- [ ] Player attendance confirmation for callups - backend integration
- [ ] Email notifications for matches/trainings - backend integration
- [ ] Payment reminders for academy parents - backend integration
- [ ] Stripe API key configuration by Master Admin
- [ ] Multi-language support (PL, EN, DE)
- [ ] Full PDF export functionality
- [ ] Image upload for gallery
