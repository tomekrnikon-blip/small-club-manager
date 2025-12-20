# Small Club Manager - Specyfikacja API

## Architektura API

Aplikacja używa **tRPC** (Type-safe Remote Procedure Call) do komunikacji między frontendem a backendem. Wszystkie endpointy są zdefiniowane w `server/routers.ts` i automatycznie generują typy TypeScript.

---

## Główne Routery

### 1. Users Router

```typescript
// Zarządzanie użytkownikami
users.list()                    // Lista wszystkich użytkowników (admin)
users.getById(id)               // Pobierz użytkownika po ID
users.updateRole(id, role)      // Zmień rolę użytkownika
users.grantPro(id)              // Nadaj status PRO
users.revokePro(id)             // Odbierz status PRO
users.delete(id)                // Usuń użytkownika
users.scheduleDelete(reason)    // Zaplanuj usunięcie konta
users.cancelDelete()            // Anuluj usunięcie konta
```

### 2. Clubs Router

```typescript
// Zarządzanie klubami
clubs.list()                    // Lista klubów użytkownika
clubs.create(data)              // Utwórz nowy klub
clubs.getById(id)               // Pobierz klub po ID
clubs.update(id, data)          // Aktualizuj klub
clubs.delete(id)                // Usuń klub
clubs.updateSettings(id, data)  // Aktualizuj ustawienia (SMS, email)
clubs.updateColors(id, colors)  // Aktualizuj kolory klubu
clubs.uploadLogo(id, file)      // Upload logo
```

### 3. Club Members Router

```typescript
// Członkowie klubu
clubMembers.list(clubId)        // Lista członków
clubMembers.add(clubId, userId, role)  // Dodaj członka
clubMembers.updateRole(id, role)       // Zmień rolę
clubMembers.remove(id)          // Usuń członka
clubMembers.getMyRole(clubId)   // Pobierz moją rolę
```

### 4. Club Invitations Router

```typescript
// Zaproszenia do klubu
clubInvitations.create(clubId, email, role)  // Utwórz zaproszenie
clubInvitations.list(clubId)    // Lista zaproszeń
clubInvitations.getByToken(token)  // Pobierz zaproszenie po tokenie
clubInvitations.accept(token)   // Akceptuj zaproszenie
clubInvitations.revoke(id)      // Anuluj zaproszenie
```

### 5. Teams Router

```typescript
// Drużyny
teams.list(clubId)              // Lista drużyn
teams.create(clubId, data)      // Utwórz drużynę
teams.update(id, data)          // Aktualizuj drużynę
teams.delete(id)                // Usuń drużynę
```

### 6. Players Router

```typescript
// Zawodnicy
players.list(clubId)            // Lista zawodników
players.getById(id)             // Pobierz zawodnika
players.create(clubId, data)    // Dodaj zawodnika
players.update(id, data)        // Aktualizuj zawodnika
players.delete(id)              // Usuń zawodnika
players.uploadPhoto(id, file)   // Upload zdjęcia
players.getStats(id, season)    // Statystyki zawodnika
```

### 7. Matches Router

```typescript
// Mecze
matches.list(clubId)            // Lista meczów
matches.getById(id)             // Pobierz mecz
matches.create(clubId, data)    // Dodaj mecz
matches.update(id, data)        // Aktualizuj mecz
matches.delete(id)              // Usuń mecz
matches.updateStats(id, stats)  // Aktualizuj statystyki
matches.getLineup(id)           // Pobierz skład
```

### 8. Match Stats Router

```typescript
// Statystyki meczowe
matchStats.list(matchId)        // Lista statystyk meczu
matchStats.create(matchId, playerId, data)  // Dodaj statystyki
matchStats.update(id, data)     // Aktualizuj statystyki
matchStats.delete(id)           // Usuń statystyki
```

### 9. Match Callups Router

```typescript
// Powołania
matchCallups.createForMatch(matchId, playerIds, channel)  // Utwórz powołania
matchCallups.getForMatch(matchId)  // Pobierz powołania na mecz
matchCallups.getMyCallups()     // Moje powołania (jako zawodnik)
matchCallups.respond(id, status)  // Odpowiedz na powołanie
matchCallups.markAttendance(id, attended)  // Zaznacz obecność
```

### 10. Trainings Router

```typescript
// Treningi
trainings.list(clubId)          // Lista treningów
trainings.getById(id)           // Pobierz trening
trainings.create(clubId, data)  // Dodaj trening
trainings.update(id, data)      // Aktualizuj trening
trainings.delete(id)            // Usuń trening
trainings.getAttendance(id)     // Pobierz frekwencję
trainings.markAttendance(id, playerId, present)  // Zaznacz obecność
```

### 11. Finances Router

```typescript
// Finanse
finances.list(clubId)           // Lista transakcji
finances.create(clubId, data)   // Dodaj transakcję
finances.update(id, data)       // Aktualizuj transakcję
finances.delete(id)             // Usuń transakcję
finances.getSummary(clubId, period)  // Podsumowanie finansów
finances.getCategories(clubId)  // Lista kategorii
```

### 12. Academy Router

```typescript
// Szkółka
academy.listStudents(clubId)    // Lista uczniów
academy.getStudent(id)          // Pobierz ucznia
academy.createStudent(clubId, data)  // Dodaj ucznia
academy.updateStudent(id, data) // Aktualizuj ucznia
academy.deleteStudent(id)       // Usuń ucznia
academy.listPayments(studentId) // Płatności ucznia
academy.createPayment(studentId, data)  // Dodaj płatność
academy.sendReminder(studentId) // Wyślij przypomnienie
```

### 13. Injuries Router

```typescript
// Kontuzje
injuries.list(clubId)           // Lista kontuzji
injuries.create(playerId, data) // Dodaj kontuzję
injuries.update(id, data)       // Aktualizuj kontuzję
injuries.markRecovered(id)      // Oznacz jako wyleczoną
```

### 14. Photos Router

```typescript
// Galeria
photos.list(clubId)             // Lista zdjęć
photos.upload(clubId, file, albumId)  // Upload zdjęcia
photos.delete(id)               // Usuń zdjęcie
photos.listAlbums(clubId)       // Lista albumów
photos.createAlbum(clubId, name)  // Utwórz album
```

### 15. Notifications Router

```typescript
// Powiadomienia
notifications.list()            // Lista powiadomień
notifications.markRead(id)      // Oznacz jako przeczytane
notifications.markAllRead()     // Oznacz wszystkie jako przeczytane
notifications.delete(id)        // Usuń powiadomienie
notifications.getSettings()     // Pobierz ustawienia
notifications.updateSettings(data)  // Aktualizuj ustawienia
```

### 16. Subscriptions Router

```typescript
// Subskrypcje
subscriptions.getPlans()        // Lista planów
subscriptions.createCheckout(planId)  // Utwórz sesję Stripe
subscriptions.getMySubscription()  // Moja subskrypcja
subscriptions.cancel()          // Anuluj subskrypcję
subscriptions.reactivate()      // Reaktywuj subskrypcję
```

### 17. RegioWyniki Router

```typescript
// Integracja RegioWyniki
regiowyniki.searchClubs(query, region)  // Wyszukaj kluby
regiowyniki.getLeagueTable(leagueId)    // Pobierz tabelę
regiowyniki.getMatchSchedule(teamId)    // Pobierz terminarz
regiowyniki.syncClubData(clubId)        // Synchronizuj dane
regiowyniki.getCacheStats()             // Statystyki cache
regiowyniki.clearCache()                // Wyczyść cache
```

### 18. Social Media Router

```typescript
// Social Media
socialMedia.getSettings(clubId)         // Pobierz ustawienia
socialMedia.updateSettings(clubId, data)  // Aktualizuj ustawienia
socialMedia.createPost(clubId, data)    // Utwórz post
socialMedia.listPosts(clubId)           // Lista postów
socialMedia.deletePost(id)              // Usuń post
```

### 19. Reports Router

```typescript
// Raporty PDF
reports.generatePlayerReport(playerId)  // Raport zawodnika
reports.generateTeamReport(teamId)      // Raport drużyny
reports.generateFinanceReport(clubId, period)  // Raport finansowy
reports.generateAttendanceReport(clubId, period)  // Raport frekwencji
```

### 20. Backup Router

```typescript
// Backup
backup.export(clubId)           // Eksport danych JSON
backup.import(clubId, data)     // Import danych JSON
backup.getHistory(clubId)       // Historia backupów
```

### 21. Analytics Router (Admin)

```typescript
// Analityka (tylko admin)
analytics.getUserStats(period)  // Statystyki użytkowników
analytics.getClubStats(period)  // Statystyki klubów
analytics.getRevenueStats(period)  // Statystyki przychodów
analytics.getActivityStats(period)  // Statystyki aktywności
```

### 22. Audit Router (Admin)

```typescript
// Logi audytu (tylko admin)
audit.list(filters)             // Lista logów
audit.getById(id)               // Szczegóły logu
audit.export(filters)           // Eksport logów
```

---

## Serwisy Backendowe

### Email Service (server/services/emailService.ts)

```typescript
interface EmailService {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
  sendReminder(clubId: number, studentId: number): Promise<void>;
  sendCallupNotification(playerId: number, matchId: number): Promise<void>;
}
```

### SMS Service (server/services/notificationService.ts)

```typescript
interface SMSService {
  sendSMS(clubId: number, phone: string, message: string): Promise<void>;
  sendBulkSMS(clubId: number, phones: string[], message: string): Promise<void>;
  getBalance(clubId: number): Promise<number>;
}
```

### PDF Service (server/services/pdfService.ts)

```typescript
interface PDFService {
  generatePlayerReport(playerId: number): Promise<Buffer>;
  generateTeamReport(teamId: number): Promise<Buffer>;
  generateFinanceReport(clubId: number, period: DateRange): Promise<Buffer>;
}
```

### RegioWyniki Scraper (server/services/regiowyniki-scraper.ts)

```typescript
interface RegioWynikiScraper {
  searchClubs(query: string, region?: string): Promise<Club[]>;
  getLeagueTable(leagueId: string): Promise<LeagueTable>;
  getMatchSchedule(teamId: string): Promise<Match[]>;
  getClubDetails(clubId: string): Promise<ClubDetails>;
}
```

### CORS Proxy (server/services/cors-proxy.ts)

```typescript
interface CORSProxy {
  fetch(url: string, options?: FetchOptions): Promise<Response>;
  getCacheStats(): CacheStats;
  clearCache(): void;
}
```

### Cron Services

```typescript
// server/services/regiowyniki-sync-cron.ts
// Codzienna synchronizacja danych z RegioWyniki

// server/services/match-reminder-service.ts
// Przypomnienia 24h i 1h przed meczem

// server/services/cronService.ts
// Przetwarzanie scheduled_notifications
```

---

## Schemat Bazy Danych (Drizzle ORM)

### Główne Tabele

```sql
-- Użytkownicy
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  role ENUM('admin', 'trener', 'zawodnik', 'user') DEFAULT 'user',
  isMasterAdmin BOOLEAN DEFAULT FALSE,
  isPro BOOLEAN DEFAULT FALSE,
  subscriptionId VARCHAR(255),
  subscriptionStatus VARCHAR(50),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Kluby
CREATE TABLE clubs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  city VARCHAR(255),
  logoUrl TEXT,
  smsProvider ENUM('none', 'smsapi', 'twilio', 'smslabs') DEFAULT 'none',
  twilioAccountSid VARCHAR(255),
  twilioAuthToken VARCHAR(255),
  twilioPhoneNumber VARCHAR(20),
  smsEnabled BOOLEAN DEFAULT FALSE,
  emailProvider ENUM('none', 'smtp', 'sendgrid', 'mailgun') DEFAULT 'none',
  smtpHost VARCHAR(255),
  smtpPort INT DEFAULT 587,
  smtpUser VARCHAR(255),
  smtpPassword VARCHAR(255),
  emailEnabled BOOLEAN DEFAULT FALSE,
  trialStartDate TIMESTAMP DEFAULT NOW(),
  trialEndDate TIMESTAMP,
  isTrialActive BOOLEAN DEFAULT TRUE,
  primaryColor VARCHAR(7) DEFAULT '#22c55e',
  secondaryColor VARCHAR(7) DEFAULT '#1e3a5f',
  accentColor VARCHAR(7) DEFAULT '#ffffff',
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Zawodnicy
CREATE TABLE players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clubId INT NOT NULL,
  teamId INT,
  name VARCHAR(255) NOT NULL,
  position ENUM('bramkarz', 'obrońca', 'pomocnik', 'napastnik') NOT NULL,
  jerseyNumber INT,
  dateOfBirth DATE,
  photoUrl TEXT,
  phone VARCHAR(20),
  email VARCHAR(320),
  isAcademy BOOLEAN DEFAULT FALSE,
  parentName VARCHAR(255),
  parentPhone VARCHAR(20),
  parentEmail VARCHAR(320),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Mecze
CREATE TABLE matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clubId INT NOT NULL,
  teamId INT,
  season VARCHAR(20) DEFAULT '2025/2026',
  opponent VARCHAR(255) NOT NULL,
  matchDate DATE NOT NULL,
  matchTime VARCHAR(10),
  location VARCHAR(255),
  homeAway ENUM('home', 'away') NOT NULL,
  goalsScored INT DEFAULT 0,
  goalsConceded INT DEFAULT 0,
  result ENUM('win', 'draw', 'loss'),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Powołania
CREATE TABLE matchCallups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  matchId INT NOT NULL,
  playerId INT NOT NULL,
  status ENUM('pending', 'confirmed', 'declined') DEFAULT 'pending',
  notificationChannel ENUM('app', 'sms', 'both') DEFAULT 'app',
  notifiedAt TIMESTAMP,
  respondedAt TIMESTAMP,
  attended BOOLEAN,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Zaplanowane powiadomienia
CREATE TABLE scheduledNotifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clubId INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  referenceId INT,
  referenceType VARCHAR(50),
  scheduledFor TIMESTAMP NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  channel ENUM('app', 'sms', 'email', 'push') NOT NULL,
  recipientIds JSON,
  title VARCHAR(255),
  message TEXT,
  sentAt TIMESTAMP,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## Autentykacja

### OAuth Flow

1. Frontend wywołuje `getLoginUrl()` z `constants/oauth.ts`
2. Użytkownik jest przekierowany do OAuth provider (Google/Microsoft/Apple)
3. Po autoryzacji, callback URL zawiera `code` i `state`
4. Frontend wywołuje `/oauth/callback` z parametrami
5. Backend wymienia `code` na token i tworzy/aktualizuje użytkownika
6. JWT token jest zapisywany w cookies

### JWT Token

```typescript
interface JWTPayload {
  userId: number;
  openId: string;
  role: string;
  isMasterAdmin: boolean;
  isPro: boolean;
  iat: number;
  exp: number;
}
```

### Middleware

```typescript
// server/_core/context.ts
// Weryfikacja JWT i dodanie user do context

// Przykład użycia w routerze:
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

---

## Webhooks

### Stripe Webhook (server/webhooks/stripe.ts)

```typescript
// POST /api/webhooks/stripe
// Obsługuje wydarzenia:
// - checkout.session.completed
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed
```

---

## Rate Limiting

```typescript
// server/services/rateLimitService.ts
interface RateLimiter {
  check(key: string, limit: number, window: number): Promise<boolean>;
  reset(key: string): Promise<void>;
}

// Limity:
// - SMS: 100/dzień per klub
// - Login: 5/minutę per IP
// - API: 1000/godzinę per user
// - RegioWyniki: 10/minutę per domena
```

---

## Szyfrowanie

```typescript
// server/utils/encryption.ts
// AES-256-GCM dla wrażliwych danych (klucze API, hasła SMTP)

interface Encryption {
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
}
```
