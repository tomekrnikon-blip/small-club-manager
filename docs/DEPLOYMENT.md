# Small Club Manager - Dokumentacja Wdrożeniowa

## Przegląd

Aplikacja Small Club Manager jest zbudowana przy użyciu Expo SDK 54 i może być wdrożona jako:
- Natywna aplikacja iOS (App Store)
- Natywna aplikacja Android (Google Play)
- Progressive Web App (PWA)

---

## 1. Wymagania Wstępne

### Konta i Narzędzia

| Wymaganie | Opis |
|-----------|------|
| Konto Expo | Zarejestruj się na [expo.dev](https://expo.dev) |
| Konto Apple Developer | Wymagane dla iOS ($99/rok) |
| Konto Google Play Console | Wymagane dla Android ($25 jednorazowo) |
| Node.js 18+ | Środowisko uruchomieniowe |
| EAS CLI | `npm install -g eas-cli` |

### Konfiguracja EAS

```bash
# Zaloguj się do Expo
eas login

# Skonfiguruj projekt
eas build:configure
```

---

## 2. Budowanie Aplikacji

### Android (APK/AAB)

```bash
# Build produkcyjny (AAB dla Google Play)
eas build --platform android --profile production

# Build APK do testów
eas build --platform android --profile preview
```

### iOS (IPA)

```bash
# Build produkcyjny (wymaga konta Apple Developer)
eas build --platform ios --profile production

# Build do TestFlight
eas build --platform ios --profile preview
```

### Obie Platformy

```bash
eas build --platform all --profile production
```

---

## 3. Profile Budowania

Plik `eas.json` zawiera konfigurację profili:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 4. Publikacja w Sklepach

### Google Play Store

1. **Przygotuj zasoby graficzne:**
   - Ikona aplikacji (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshoty (min. 2, max. 8)

2. **Utwórz aplikację w Google Play Console:**
   - Przejdź do [Google Play Console](https://play.google.com/console)
   - Kliknij "Utwórz aplikację"
   - Wypełnij informacje o aplikacji

3. **Prześlij AAB:**
   ```bash
   eas submit --platform android
   ```

4. **Wypełnij formularz:**
   - Kategoria: Sport
   - Polityka prywatności URL
   - Ocena treści (PEGI/ESRB)

### Apple App Store

1. **Przygotuj zasoby graficzne:**
   - Ikona aplikacji (1024x1024 PNG)
   - Screenshoty dla różnych urządzeń

2. **Utwórz aplikację w App Store Connect:**
   - Przejdź do [App Store Connect](https://appstoreconnect.apple.com)
   - Kliknij "+" → "Nowa aplikacja"
   - Wybierz Bundle ID

3. **Prześlij build:**
   ```bash
   eas submit --platform ios
   ```

4. **Wypełnij informacje:**
   - Opis aplikacji (PL/EN)
   - Słowa kluczowe
   - Polityka prywatności URL
   - Kategoria: Sport

---

## 5. Konfiguracja Środowiska Produkcyjnego

### Zmienne Środowiskowe

Ustaw następujące zmienne w panelu Expo:

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | URL bazy danych PostgreSQL |
| `JWT_SECRET` | Sekret do podpisywania tokenów |
| `STRIPE_SECRET_KEY` | Klucz API Stripe (produkcyjny) |
| `STRIPE_WEBHOOK_SECRET` | Sekret webhooka Stripe |

### Baza Danych

Zalecane usługi hostingowe:
- **Neon** - serverless PostgreSQL
- **Supabase** - PostgreSQL z dodatkowymi funkcjami
- **PlanetScale** - MySQL serverless

---

## 6. PWA (Progressive Web App)

### Budowanie PWA

```bash
# Eksport statyczny dla web
npx expo export --platform web
```

### Hosting

Zalecane platformy:
- **Vercel** - automatyczny deploy z GitHub
- **Netlify** - prosty hosting statyczny
- **Cloudflare Pages** - globalny CDN

### Konfiguracja

Plik `public/manifest.json` zawiera konfigurację PWA:
- Nazwa aplikacji
- Ikony
- Kolory motywu
- Tryb wyświetlania

---

## 7. Aktualizacje OTA (Over-The-Air)

Expo umożliwia aktualizacje bez ponownej publikacji w sklepach:

```bash
# Opublikuj aktualizację
eas update --branch production --message "Poprawki błędów"
```

### Kanały Aktualizacji

| Kanał | Opis |
|-------|------|
| `production` | Wersja produkcyjna |
| `preview` | Wersja testowa |
| `development` | Wersja deweloperska |

---

## 8. Monitorowanie i Analityka

### Expo Insights

Automatycznie zbiera:
- Crash reports
- Statystyki użycia
- Wydajność aplikacji

### Firebase Analytics (opcjonalnie)

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

---

## 9. Checklist Przed Publikacją

### Ogólne
- [ ] Przetestuj wszystkie funkcje na urządzeniach fizycznych
- [ ] Sprawdź działanie offline (PWA)
- [ ] Zweryfikuj politykę prywatności
- [ ] Przygotuj regulamin usługi

### Android
- [ ] Ikona aplikacji (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Min. 2 screenshoty
- [ ] Opis w Google Play Console
- [ ] Ocena treści (PEGI)

### iOS
- [ ] Ikona aplikacji (1024x1024)
- [ ] Screenshoty dla iPhone i iPad
- [ ] Opis w App Store Connect
- [ ] Kategoria wiekowa
- [ ] Przegląd App Review

---

## 10. Wsparcie i Kontakt

W razie problemów z wdrożeniem:
- Dokumentacja Expo: [docs.expo.dev](https://docs.expo.dev)
- Forum Expo: [forums.expo.dev](https://forums.expo.dev)
- GitHub Issues: Zgłoś problem w repozytorium projektu

---

## Szybki Start

```bash
# 1. Zainstaluj EAS CLI
npm install -g eas-cli

# 2. Zaloguj się
eas login

# 3. Skonfiguruj projekt
eas build:configure

# 4. Zbuduj aplikację
eas build --platform all --profile production

# 5. Opublikuj w sklepach
eas submit --platform all
```

Gotowe! Twoja aplikacja Small Club Manager jest teraz dostępna w sklepach.
