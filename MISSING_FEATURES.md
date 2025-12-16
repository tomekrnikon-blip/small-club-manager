# Small Club Manager - Lista Brakujących Funkcji i Powiązań

Na podstawie analizy dokumentacji technicznej, todo.docx i API_DOCUMENTATION.docx, poniżej znajduje się kompletna lista funkcji do zaimplementowania.

---

## 1. SYSTEM RÓL I UPRAWNIEŃ (Priorytet: KRYTYCZNY)

### 1.1 Rozszerzenie ról użytkowników
- [ ] **Manager** - właściciel klubu, pełne uprawnienia
- [ ] **Trener (Coach)** - dostęp do wszystkiego oprócz finansów
- [ ] **Zawodnik (Player)** - tylko odczyt swoich statystyk
- [ ] **Członek Zarządu (Board Member)** - jak Manager, bez usuwania Managera
- [ ] **Członek Zarządu - Finanse** - jak Board Member + dostęp do finansów

### 1.2 Backend - middleware uprawnień
- [ ] Utworzenie `coachProcedure` - wymaga roli trener lub admin
- [ ] Utworzenie `boardMemberProcedure` - wymaga roli członka zarządu
- [ ] Kontrola dostępu do finansów na podstawie roli
- [ ] Kontrola widoczności danych na podstawie roli

### 1.3 Frontend - widoki według ról
- [ ] Ukrywanie sekcji finansów dla trenerów i zawodników
- [ ] Widok tylko-odczyt dla zawodników
- [ ] Ukrywanie przycisków edycji dla ról bez uprawnień

---

## 2. SYSTEM ZAPROSZEŃ I CZŁONKÓW KLUBU (Priorytet: WYSOKI)

### 2.1 Backend - API zaproszeń
- [ ] Router `invitations.create` - tworzenie zaproszenia z emailem i rolą
- [ ] Router `invitations.list` - lista zaproszeń klubu
- [ ] Router `invitations.accept` - akceptacja zaproszenia
- [ ] Router `invitations.revoke` - anulowanie zaproszenia
- [ ] Tabela `club_invitations` w bazie danych

### 2.2 Backend - API członków klubu
- [ ] Router `clubMembers.list` - lista członków klubu
- [ ] Router `clubMembers.updateRole` - zmiana roli członka
- [ ] Router `clubMembers.remove` - usunięcie członka z klubu
- [ ] Tabela `club_members` z polami: userId, clubId, role, isActive, joinedAt

### 2.3 Frontend - ekrany zaproszeń
- [ ] Formularz zaproszenia nowego członka (email + rola)
- [ ] Lista oczekujących zaproszeń
- [ ] Lista aktywnych członków klubu z ich rolami
- [ ] Przyciski zmiany roli i usunięcia członka

---

## 3. SYSTEM POWOŁAŃ NA MECZE (Priorytet: WYSOKI)

### 3.1 Backend - API powołań
- [ ] Router `callups.create` - tworzenie powołania na mecz
- [ ] Router `callups.list` - lista powołań dla meczu
- [ ] Router `callups.respond` - odpowiedź zawodnika (potwierdzenie/odmowa)
- [ ] Router `callups.sendReminders` - wysyłanie przypomnień 48h i 24h przed meczem
- [ ] Tabela `callups` z polami: matchId, playerId, status, respondedAt

### 3.2 Automatyczne powiadomienia
- [ ] Cron job wysyłający przypomnienia 48h przed meczem
- [ ] Cron job wysyłający przypomnienia 24h przed meczem
- [ ] Wybór kanału powiadomienia (email/SMS/push)
- [ ] Szablon wiadomości z opcją potwierdzenia

### 3.3 Frontend - ekrany powołań
- [ ] Ekran wyboru zawodników na mecz (z listy drużyny + młodszych kategorii)
- [ ] Status powołań (oczekujące/potwierdzone/odrzucone)
- [ ] Widok zawodnika - moje powołania z przyciskiem potwierdzenia

---

## 4. INTEGRACJA STRIPE (Priorytet: WYSOKI)

### 4.1 Backend - konfiguracja Stripe
- [ ] Router `subscription.createCheckoutSession` - tworzenie sesji płatności
- [ ] Router `subscription.getStatus` - status subskrypcji użytkownika
- [ ] Router `subscription.cancel` - anulowanie subskrypcji
- [ ] Router `subscription.getPaymentHistory` - historia płatności
- [ ] Webhook obsługujący zdarzenia Stripe

### 4.2 Master Admin - konfiguracja Stripe
- [ ] Formularz wprowadzania Stripe API Key przez Master Admin
- [ ] Konfiguracja Stripe Price IDs dla planów (miesięczny/roczny)
- [ ] Włączanie/wyłączanie płatności

### 4.3 Frontend - ekrany subskrypcji
- [ ] Porównanie planów (Darmowy vs PRO)
- [ ] Przycisk zakupu subskrypcji (przekierowanie do Stripe Checkout)
- [ ] Panel zarządzania subskrypcją (anulowanie, zmiana planu)
- [ ] Historia płatności z fakturami PDF

---

## 5. SYSTEM SMS (Priorytet: ŚREDNI)

### 5.1 Backend - API SMS
- [ ] Router `sms.send` - wysyłanie SMS przez Twilio
- [ ] Router `sms.getHistory` - historia wysłanych SMS
- [ ] Router `sms.getBalance` - stan konta SMS
- [ ] Konfiguracja klucza API Twilio przez użytkownika

### 5.2 Frontend - konfiguracja SMS
- [ ] Formularz wprowadzania Twilio API Key
- [ ] Wybór SMS jako kanału powiadomień
- [ ] Historia wysłanych SMS z kosztami

---

## 6. EKSPORT PDF (Priorytet: ŚREDNI)

### 6.1 Backend - generowanie PDF
- [ ] Router `pdf.generateFinanceReport` - raport finansowy
- [ ] Router `pdf.generatePlayerStats` - statystyki zawodnika
- [ ] Router `pdf.generateAttendanceReport` - raport frekwencji
- [ ] Router `pdf.generateTeamReport` - raport drużyny

### 6.2 Frontend - przyciski eksportu
- [ ] Przycisk eksportu PDF na stronie finansów
- [ ] Przycisk eksportu PDF na profilu zawodnika
- [ ] Przycisk eksportu PDF na stronie frekwencji
- [ ] Podgląd przed eksportem

---

## 7. GALERIA ZDJĘĆ (Priorytet: ŚREDNI)

### 7.1 Backend - API galerii
- [ ] Router `photos.upload` - przesyłanie zdjęć do S3
- [ ] Router `photos.list` - lista zdjęć klubu
- [ ] Router `photos.delete` - usuwanie zdjęć
- [ ] Router `albums.create` - tworzenie albumów
- [ ] Router `albums.list` - lista albumów
- [ ] Tabela `photos` i `albums` w bazie danych

### 7.2 Frontend - ekrany galerii
- [ ] Grid zdjęć z lightboxem
- [ ] Tworzenie i zarządzanie albumami
- [ ] Upload wielu zdjęć jednocześnie
- [ ] Sortowanie i filtrowanie zdjęć
- [ ] Masowe operacje (usuwanie, przenoszenie)

---

## 8. KONTUZJE (Priorytet: ŚREDNI)

### 8.1 Backend - API kontuzji
- [ ] Router `injuries.create` - dodawanie kontuzji
- [ ] Router `injuries.list` - lista kontuzji klubu
- [ ] Router `injuries.update` - aktualizacja statusu kontuzji
- [ ] Router `injuries.delete` - usuwanie kontuzji
- [ ] Tabela `injuries` z polami: playerId, type, startDate, endDate, notes

### 8.2 Frontend - ekrany kontuzji
- [ ] Lista kontuzji z filtrowaniem (aktywne/wyleczone)
- [ ] Formularz dodawania kontuzji
- [ ] Status kontuzji na profilu zawodnika
- [ ] Alerty o kontuzjowanych zawodnikach przy powołaniach

---

## 9. WIELOJĘZYCZNOŚĆ (Priorytet: NISKI)

### 9.1 Konfiguracja i18n
- [ ] Instalacja react-i18next
- [ ] Pliki tłumaczeń: pl.json, en.json, de.json
- [ ] Przełącznik języka w ustawieniach
- [ ] Zapisywanie wyboru języka w localStorage

### 9.2 Tłumaczenia
- [ ] Nawigacja i menu
- [ ] Formularze i przyciski
- [ ] Komunikaty błędów
- [ ] Powiadomienia

---

## 10. PWA I OFFLINE (Priorytet: NISKI)

### 10.1 Konfiguracja PWA
- [ ] manifest.json z metadanymi aplikacji
- [ ] Service worker dla offline mode
- [ ] Ikony aplikacji (192x192, 512x512)
- [ ] Install prompt dla urządzeń mobilnych

---

## 11. INTEGRACJE ZEWNĘTRZNE (Priorytet: NISKI)

### 11.1 Google Calendar
- [ ] Eksport wydarzeń do formatu .ics
- [ ] Przycisk "Dodaj do Google Calendar" przy meczach/treningach

### 11.2 Eksport Excel
- [ ] Eksport listy zawodników do Excel
- [ ] Eksport listy meczów do Excel
- [ ] Eksport finansów do Excel/CSV

---

## 12. POPRAWKI UI/UX

### 12.1 Responsywność
- [ ] Optymalizacja tabel na mobile (karty zamiast tabel)
- [ ] Touch gestures w kalendarzu
- [ ] Sprawdzenie nakładania się elementów na mobile

### 12.2 Nawigacja
- [ ] Przycisk powrotu na wszystkich ekranach ✅ (zrobione)
- [ ] Breadcrumbs dla głębokiej nawigacji
- [ ] Animacje przejść między ekranami

---

## PODSUMOWANIE PRIORYTETÓW

| Priorytet | Moduł | Szacowany czas |
|-----------|-------|----------------|
| KRYTYCZNY | System ról i uprawnień | 8-12h |
| WYSOKI | System zaproszeń | 6-8h |
| WYSOKI | System powołań | 6-8h |
| WYSOKI | Integracja Stripe | 8-10h |
| ŚREDNI | System SMS | 4-6h |
| ŚREDNI | Eksport PDF | 4-6h |
| ŚREDNI | Galeria zdjęć | 6-8h |
| ŚREDNI | Kontuzje | 4-6h |
| NISKI | Wielojęzyczność | 6-8h |
| NISKI | PWA | 4-6h |
| NISKI | Integracje zewnętrzne | 4-6h |

**Łączny szacowany czas: 60-84 godziny**

---

## ISTNIEJĄCE ROUTERY (Backend)

Aktualnie zaimplementowane routery w `server/routers.ts`:
1. `auth` - autentykacja
2. `clubs` - zarządzanie klubami
3. `teams` - zarządzanie drużynami
4. `players` - zarządzanie zawodnikami
5. `matches` - zarządzanie meczami
6. `trainings` - zarządzanie treningami
7. `finances` - zarządzanie finansami
8. `academy` - szkółka piłkarska
9. `calendar` - kalendarz wydarzeń
10. `notifications` - powiadomienia
11. `masterAdmin` - panel administratora

**Brakujące routery do dodania:**
- `invitations` - zaproszenia do klubu
- `clubMembers` - członkowie klubu
- `callups` - powołania na mecze
- `subscription` - subskrypcje Stripe
- `sms` - wysyłanie SMS
- `pdf` - generowanie raportów PDF
- `photos` - galeria zdjęć
- `albums` - albumy zdjęć
- `injuries` - kontuzje

---

*Dokument wygenerowany: 16 grudnia 2024*
