# Small Club Manager (SKM) - Dokumentacja dla Agenta AI

## Spis Treści
1. [Przegląd Projektu](#przegląd-projektu)
2. [Stack Technologiczny](#stack-technologiczny)
3. [Architektura Aplikacji](#architektura-aplikacji)
4. [Struktura Plików](#struktura-plików)
5. [Baza Danych](#baza-danych)
6. [Ekrany i Funkcjonalności](#ekrany-i-funkcjonalności)
7. [System Ról i Uprawnień](#system-ról-i-uprawnień)
8. [Integracje Zewnętrzne](#integracje-zewnętrzne)
9. [Design System](#design-system)
10. [Przepływy Użytkownika](#przepływy-użytkownika)
11. [Konfiguracja i Uruchomienie](#konfiguracja-i-uruchomienie)

---

## Przegląd Projektu

**Small Club Manager (SKM)** to kompleksowa aplikacja mobilna do zarządzania amatorskimi klubami piłkarskimi. Aplikacja jest przeznaczona dla małych klubów sportowych w Polsce i umożliwia zarządzanie:

- Kadrą zawodników (dane, statystyki, kontuzje)
- Meczami (wyniki, składy, statystyki)
- Treningami (frekwencja, harmonogram)
- Finansami klubu (przychody, wydatki, składki)
- Szkółką piłkarską (uczniowie, płatności rodziców)
- Komunikacją (SMS, email, powiadomienia push)
- Mediami społecznościowymi (posty na FB/Instagram)

### Główne Cechy

| Cecha | Opis |
|-------|------|
| **Platforma** | React Native (Expo) - iOS, Android, PWA |
| **Język** | Polski (z obsługą EN, DE) |
| **Motyw** | Ciemny (dark theme) z zielonym akcentem |
| **Autoryzacja** | OAuth (Google, Microsoft, Apple) |
| **Backend** | tRPC + Node.js |
| **Baza danych** | MySQL (Drizzle ORM) |

---

## Stack Technologiczny

### Frontend (Mobile App)

```
React Native 0.81
Expo SDK 54
Expo Router 6 (file-based routing)
TypeScript 5.9
React 19
react-native-reanimated 4.x
expo-image, expo-haptics, expo-notifications
AsyncStorage (local storage)
```

### Backend (Server)

```
Node.js
tRPC (type-safe API)
Drizzle ORM (MySQL)
Zod (validation)
JWT (authentication)
```

### Zewnętrzne Serwisy

```
Stripe - płatności subskrypcji
Twilio/SMSAPI - wysyłka SMS
SMTP - wysyłka email
Facebook Graph API - posty social media
RegioWyniki.pl - dane ligowe (scraping)
Expo Push Notifications - powiadomienia
```

---

## Architektura Aplikacji

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (Expo)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Screens   │  │ Components  │  │    Hooks    │         │
│  │  (app/*.tsx)│  │             │  │             │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    ┌─────▼─────┐                           │
│                    │   tRPC    │                           │
│                    │  Client   │                           │
│                    └─────┬─────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                    ┌─────▼─────┐                           │
│                    │   tRPC    │     SERVER                │
│                    │  Router   │                           │
│                    └─────┬─────┘                           │
│         ┌────────────────┼────────────────┐                │
│         │                │                │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │  Services   │  │   Routers   │  │  Webhooks   │        │
│  │ (email,sms) │  │ (clubs,etc) │  │  (stripe)   │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘        │
│         │                │                                 │
│         └────────────────┼─────────────────────────────────│
│                    ┌─────▼─────┐                           │
│                    │  Drizzle  │                           │
│                    │    ORM    │                           │
│                    └─────┬─────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL     │
                    │  Database   │
                    └─────────────┘
```

---

## Struktura Plików

```
small-club-manager/
├── app/                          # Ekrany aplikacji (Expo Router)
│   ├── (tabs)/                   # Główne zakładki (bottom navigation)
│   │   ├── _layout.tsx           # Konfiguracja tab bar
│   │   ├── index.tsx             # Dashboard/Home
│   │   ├── players.tsx           # Lista zawodników
│   │   ├── matches.tsx           # Lista meczów
│   │   ├── calendar.tsx          # Kalendarz
│   │   └── more.tsx              # Menu "Więcej"
│   ├── admin/                    # Panel Master Admin
│   │   ├── index.tsx             # Dashboard admina
│   │   ├── analytics.tsx         # Statystyki
│   │   ├── audit-logs.tsx        # Logi audytu
│   │   └── ...
│   ├── club/                     # Zarządzanie klubem
│   │   ├── [id].tsx              # Szczegóły klubu
│   │   ├── settings.tsx          # Ustawienia klubu
│   │   └── ...
│   ├── match/                    # Mecze
│   │   ├── [id].tsx              # Szczegóły meczu
│   │   └── add.tsx               # Dodaj mecz
│   ├── player/                   # Zawodnicy
│   │   ├── [id].tsx              # Szczegóły zawodnika
│   │   └── add.tsx               # Dodaj zawodnika
│   ├── onboarding/               # Onboarding nowych użytkowników
│   │   ├── welcome.tsx           # Ekran powitalny
│   │   ├── country-select.tsx    # Wybór kraju
│   │   ├── club-setup.tsx        # Konfiguracja klubu
│   │   └── complete.tsx          # Zakończenie
│   └── ...                       # Pozostałe ekrany
│
├── components/                   # Komponenty wielokrotnego użytku
│   ├── themed-text.tsx           # Tekst z obsługą motywu
│   ├── themed-view.tsx           # View z obsługą motywu
│   ├── club-selection-wizard.tsx # Kreator wyboru klubu
│   ├── league-table.tsx          # Tabela ligowa
│   ├── social-share-card.tsx     # Karta do social media
│   └── ui/                       # Podstawowe komponenty UI
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Autoryzacja
│   ├── use-club-role.ts          # Role w klubie
│   ├── use-offline.ts            # Tryb offline
│   ├── use-push-notifications.ts # Powiadomienia push
│   └── ...
│
├── lib/                          # Biblioteki i utilities
│   ├── trpc.ts                   # Klient tRPC
│   ├── auth.ts                   # Funkcje autoryzacji
│   ├── polish-football-data.ts   # Dane polskiej piłki
│   ├── facebook-oauth.ts         # Facebook OAuth
│   └── ...
│
├── constants/                    # Stałe
│   ├── theme.ts                  # Kolory i fonty
│   └── oauth.ts                  # Konfiguracja OAuth
│
├── server/                       # Backend (tRPC)
│   ├── routers.ts                # Główny router
│   ├── routers/                  # Poszczególne routery
│   │   └── regiowyniki.ts        # Router RegioWyniki
│   ├── services/                 # Serwisy backendowe
│   │   ├── emailService.ts       # Wysyłka email
│   │   ├── notificationService.ts# Powiadomienia SMS
│   │   ├── pdfService.ts         # Generowanie PDF
│   │   ├── regiowyniki-scraper.ts# Scraping danych
│   │   └── ...
│   └── webhooks/                 # Webhooki
│       └── stripe.ts             # Stripe webhook
│
├── drizzle/                      # Schemat bazy danych
│   └── schema.ts                 # Definicje tabel
│
├── docs/                         # Dokumentacja
│   ├── DEPLOYMENT.md             # Instrukcje wdrożenia
│   ├── SECURITY_AUDIT.md         # Audyt bezpieczeństwa
│   └── EXTERNAL_INTEGRATIONS.md  # Integracje zewnętrzne
│
├── public/                       # Pliki statyczne PWA
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icon-*.png                # Ikony aplikacji
│
├── assets/                       # Zasoby
│   └── images/                   # Obrazy i ikony
│
├── app.config.ts                 # Konfiguracja Expo
├── todo.md                       # Lista zadań
└── design.md                     # Dokumentacja designu
```

---

## Baza Danych

### Główne Tabele

| Tabela | Opis |
|--------|------|
| `users` | Użytkownicy systemu (OAuth) |
| `clubs` | Kluby sportowe |
| `clubMembers` | Członkowie klubu z rolami |
| `teams` | Drużyny w klubie (grupy wiekowe) |
| `players` | Zawodnicy |
| `playerStats` | Statystyki zawodników per sezon |
| `matches` | Mecze |
| `matchStats` | Statystyki zawodników per mecz |
| `trainings` | Treningi |
| `trainingAttendance` | Frekwencja na treningach |
| `finances` | Transakcje finansowe |
| `academyStudents` | Uczniowie szkółki |
| `academyPayments` | Płatności za szkółkę |
| `injuries` | Kontuzje zawodników |
| `photos` | Zdjęcia w galerii |
| `notifications` | Powiadomienia |
| `scheduledNotifications` | Zaplanowane powiadomienia |
| `matchCallups` | Powołania na mecze |
| `clubInvitations` | Zaproszenia do klubu |
| `auditLogs` | Logi audytu |
| `appSettings` | Globalne ustawienia (Stripe) |
| `subscriptionPlans` | Plany subskrypcji |
| `userSubscriptions` | Subskrypcje użytkowników |

### Schemat Użytkownika

```typescript
users = {
  id: int (PK),
  openId: varchar(64) - identyfikator OAuth,
  name: text,
  email: varchar(320),
  role: enum("admin", "trener", "zawodnik", "user"),
  isMasterAdmin: boolean,
  isPro: boolean,
  subscriptionId: varchar(255),
  subscriptionStatus: varchar(50),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Schemat Klubu

```typescript
clubs = {
  id: int (PK),
  userId: int (FK) - właściciel,
  name: varchar(255),
  location: varchar(255),
  city: varchar(255),
  logoUrl: text,
  // Konfiguracja SMS
  smsProvider: enum("none", "smsapi", "twilio", "smslabs"),
  twilioAccountSid: varchar(255),
  twilioAuthToken: varchar(255),
  twilioPhoneNumber: varchar(20),
  smsEnabled: boolean,
  // Konfiguracja Email
  emailProvider: enum("none", "smtp", "sendgrid", "mailgun"),
  smtpHost: varchar(255),
  smtpPort: int,
  smtpUser: varchar(255),
  smtpPassword: varchar(255),
  emailEnabled: boolean,
  // Trial
  trialStartDate: timestamp,
  trialEndDate: timestamp,
  isTrialActive: boolean,
  // Kolory klubu
  primaryColor: varchar(7),
  secondaryColor: varchar(7),
  accentColor: varchar(7)
}
```

---

## Ekrany i Funkcjonalności

### Główna Nawigacja (Bottom Tabs)

| Tab | Ikona | Ekran | Funkcje |
|-----|-------|-------|---------|
| Start | house.fill | Dashboard | Statystyki, ostatnia aktywność, skróty |
| Kadra | person.2.fill | Players | Lista zawodników, wyszukiwarka, filtry |
| Mecze | sportscourt.fill | Matches | Nadchodzące/zakończone mecze |
| Kalendarz | calendar | Calendar | Widok miesięczny, wydarzenia |
| Więcej | ellipsis | More | Menu rozszerzone |

### Menu "Więcej"

- Treningi
- Szkółka (Academy)
- Finanse (tylko admin)
- Galeria
- Powołania
- Kontuzje
- Zespoły
- Struktura Klubu
- Powiadomienia
- Ustawienia
- Pomoc
- Wyloguj

### Panel Master Admin

Dostępny tylko dla użytkowników z `isMasterAdmin = true`:

- Dashboard z analityką
- Zarządzanie użytkownikami
- Zarządzanie klubami
- Nadawanie/odbieranie PRO
- Konfiguracja Stripe
- Plany subskrypcji
- Logi audytu
- Bezpieczeństwo (2FA)
- Kampanie powiadomień

### Onboarding (Nowi Użytkownicy)

1. **Welcome** - Ekran powitalny z logo i funkcjami
2. **Country Select** - Wybór kraju (15 krajów)
3. **Club Setup** - Kreator wyboru klubu:
   - Województwo → Okręg (OZPN) → Klub → Drużyna
   - Lub tryb ręczny
4. **Complete** - Podsumowanie z tabelą ligową

---

## System Ról i Uprawnień

### Role w Klubie

| Rola | Kod | Uprawnienia |
|------|-----|-------------|
| **Manager** | `manager` | Pełne uprawnienia, zarządzanie strukturą |
| **Członek Zarządu** | `board_member` | Odczyt wszystkiego, edycja podstawowa |
| **Zarząd - Finanse** | `board_member_finance` | Dostęp do finansów |
| **Trener** | `coach` | Zarządzanie kadrą, treningami, meczami |
| **Zawodnik** | `player` | Odczyt własnych danych, odpowiedzi na powołania |

### Uprawnienia

```typescript
ROLE_PERMISSIONS = {
  manager: ["*"], // wszystko
  board_member: ["read:*", "write:players", "write:matches", "write:trainings"],
  board_member_finance: ["read:*", "write:finances"],
  coach: ["read:players", "write:players", "read:matches", "write:matches", 
          "read:trainings", "write:trainings", "read:callups", "write:callups"],
  player: ["read:own", "write:callup_response"]
}
```

---

## Integracje Zewnętrzne

### 1. Stripe (Płatności)

```
Endpoint: /api/webhooks/stripe
Funkcje:
- Checkout session dla subskrypcji
- Automatyczna aktywacja PRO po płatności
- Anulowanie subskrypcji
- Webhook dla potwierdzenia płatności
```

### 2. Twilio/SMSAPI (SMS)

```
Konfiguracja per klub w ustawieniach.
Funkcje:
- Powiadomienia o powołaniach (48h, 24h przed meczem)
- Przypomnienia o płatnościach (szkółka)
- Przypomnienia o treningach
```

### 3. Facebook Graph API

```
OAuth flow dla publikacji postów.
Funkcje:
- Publikacja wyników meczów
- Szablony graficzne z logo SKM
- Wybór strony FB i konta IG
```

### 4. RegioWyniki.pl (Scraping)

```
Serwer proxy dla obejścia CORS.
Funkcje:
- Wyszukiwanie klubów
- Pobieranie tabel ligowych
- Synchronizacja terminarza
- Cache z TTL (10min-1h)
```

### 5. Expo Push Notifications

```
Funkcje:
- Powiadomienia o powołaniach
- Przypomnienia 1h i 24h przed meczem
- Powiadomienia o zmianach w harmonogramie
```

---

## Design System

### Paleta Kolorów

| Rola | Kolor | HEX |
|------|-------|-----|
| Primary Accent | Zielony | `#22c55e` |
| Background | Slate 900 | `#0f172a` |
| Surface | Slate 800 | `#1e293b` |
| Surface Elevated | Slate 700 | `#334155` |
| Text Primary | Slate 50 | `#f8fafc` |
| Text Secondary | Slate 400 | `#94a3b8` |
| Danger | Red | `#ef4444` |
| Warning | Amber | `#f59e0b` |

### Typografia

| Typ | Rozmiar | Waga |
|-----|---------|------|
| Title | 28pt | Bold |
| Subtitle | 20pt | Semibold |
| Body | 16pt | Regular |
| Caption | 14pt | Regular |
| Small | 12pt | Regular |

### Spacing (8pt Grid)

- xs: 4pt
- sm: 8pt
- md: 12pt
- lg: 16pt
- xl: 24pt
- 2xl: 32pt

### Border Radius

- Buttons: 12pt
- Cards: 16pt
- Modals: 24pt
- Avatars: 50%

---

## Przepływy Użytkownika

### 1. Rejestracja i Onboarding

```
1. Użytkownik otwiera aplikację
2. Ekran Welcome → klik "Rozpocznij"
3. Wybór kraju (Polska)
4. Kreator wyboru klubu:
   a. Wybór województwa
   b. Wybór okręgu (OZPN)
   c. Wybór klubu (wyszukiwarka)
   d. Wybór drużyny (kategoria wiekowa)
5. Potwierdzenie z podglądem tabeli
6. Przekierowanie do Dashboard
```

### 2. Dodawanie Meczu

```
1. Zakładka Mecze → przycisk "+"
2. Formularz: przeciwnik, data, godzina, lokalizacja
3. Zapisanie meczu
4. Opcjonalnie: Powołania → wybór zawodników
5. Automatyczne powiadomienia SMS/push
```

### 3. Publikacja na Social Media

```
1. Szczegóły meczu → sekcja "Udostępnij"
2. Wybór typu: Wynik / Zapowiedź / Statystyki
3. Wybór szablonu (8 stylów)
4. Wybór platformy: Facebook / Instagram
5. Podgląd i edycja opisu
6. Publikacja
```

### 4. Zarządzanie Subskrypcją

```
1. Ustawienia → Subskrypcja
2. Wybór planu (miesięczny/roczny)
3. Przekierowanie do Stripe Checkout
4. Płatność
5. Webhook aktywuje PRO
6. Powrót do aplikacji z aktywnym PRO
```

---

## Konfiguracja i Uruchomienie

### Wymagania

- Node.js 22+
- pnpm
- MySQL database
- Expo CLI

### Zmienne Środowiskowe

```env
# Database
DATABASE_URL=mysql://user:pass@host:3306/dbname

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
```

### Uruchomienie Lokalne

```bash
# Instalacja zależności
pnpm install

# Migracja bazy danych
pnpm db:push

# Uruchomienie dev server
pnpm dev
```

### Build Produkcyjny

```bash
# Android APK
npx eas build --platform android

# iOS
npx eas build --platform ios

# PWA
npx expo export --platform web
```

---

## Identyfikatory Aplikacji

```
Bundle ID (iOS): pl.smallclubmanager.app
Package Name (Android): pl.smallclubmanager.app
App Scheme: manus20241219...
```

---

## Repozytorium

**GitHub:** https://github.com/tomekrnikon-blip/small-club-manager

---

## Kontakt

Aplikacja stworzona przez Manus AI dla zarządzania amatorskimi klubami piłkarskimi w Polsce.
