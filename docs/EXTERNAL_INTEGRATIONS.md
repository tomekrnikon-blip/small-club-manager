# Integracje Zewnętrzne - Small Club Manager

Ten dokument opisuje jak skonfigurować zewnętrzne usługi w aplikacji Small Club Manager.

## 1. Konfiguracja SMS (Twilio)

### Wymagania
- Konto Twilio (https://www.twilio.com)
- Numer telefonu Twilio do wysyłania SMS

### Kroki konfiguracji

#### Krok 1: Utwórz konto Twilio
1. Przejdź na https://www.twilio.com/try-twilio
2. Zarejestruj się i potwierdź email
3. Potwierdź numer telefonu

#### Krok 2: Pobierz dane uwierzytelniające
1. Zaloguj się do Twilio Console
2. Na stronie głównej znajdziesz:
   - **Account SID** - identyfikator konta (np. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
   - **Auth Token** - token autoryzacji (kliknij "Show" aby zobaczyć)
3. Zapisz te dane bezpiecznie

#### Krok 3: Kup numer telefonu
1. W Twilio Console przejdź do: Phone Numbers → Buy a Number
2. Wybierz kraj (np. Polska +48)
3. Upewnij się, że numer obsługuje SMS
4. Kup numer (koszt ~$1/miesiąc)

#### Krok 4: Skonfiguruj w aplikacji
1. W aplikacji SKM przejdź do: Więcej → Ustawienia klubu
2. W sekcji "Konfiguracja SMS" wybierz dostawcę: **Twilio**
3. Wprowadź klucz API w formacie: `AccountSID:AuthToken`
   - Przykład: `ACxxxxxxxx:yyyyyyyyyyy`
4. Wprowadź nazwę nadawcy (numer telefonu Twilio lub nazwa do 11 znaków)
5. Włącz SMS i zapisz ustawienia

### Koszty
- SMS do Polski: ~$0.05-0.08 za wiadomość
- Miesięczny koszt numeru: ~$1
- Twilio oferuje $15 kredytu na start

---

## 2. Konfiguracja SMS (SMSAPI.pl)

### Wymagania
- Konto SMSAPI.pl (https://www.smsapi.pl)

### Kroki konfiguracji

#### Krok 1: Utwórz konto
1. Przejdź na https://www.smsapi.pl
2. Zarejestruj się i potwierdź email
3. Uzupełnij dane firmy (wymagane dla nadawcy alfanumerycznego)

#### Krok 2: Wygeneruj token API
1. Zaloguj się do panelu SMSAPI
2. Przejdź do: Ustawienia → API Tokens
3. Kliknij "Dodaj token"
4. Nadaj nazwę (np. "SKM App")
5. Skopiuj wygenerowany token

#### Krok 3: Zarejestruj nadawcę
1. Przejdź do: Ustawienia → Nadawcy
2. Dodaj nadawcę alfanumerycznego (np. "MojKlub")
3. Poczekaj na weryfikację (1-2 dni robocze)

#### Krok 4: Skonfiguruj w aplikacji
1. W aplikacji SKM przejdź do: Więcej → Ustawienia klubu
2. W sekcji "Konfiguracja SMS" wybierz dostawcę: **SMSAPI**
3. Wprowadź token API
4. Wprowadź zweryfikowaną nazwę nadawcy
5. Włącz SMS i zapisz ustawienia

### Koszty
- SMS do Polski: ~0.07-0.09 PLN za wiadomość
- Brak opłat miesięcznych
- Płatność za pakiety SMS

---

## 3. Konfiguracja Email (Planowane)

> Funkcja wysyłania emaili jest w przygotowaniu.

### Planowane integracje:
- SendGrid
- Mailgun
- Amazon SES
- SMTP własny

---

## 4. Konfiguracja Stripe (Płatności)

### Wymagania
- Konto Stripe (https://stripe.com)
- Zweryfikowane konto biznesowe

### Kroki konfiguracji (tylko Master Admin)

#### Krok 1: Utwórz konto Stripe
1. Przejdź na https://dashboard.stripe.com/register
2. Zarejestruj się i potwierdź email
3. Uzupełnij dane firmy i weryfikację

#### Krok 2: Pobierz klucze API
1. W Stripe Dashboard przejdź do: Developers → API keys
2. Skopiuj:
   - **Publishable key** (pk_live_xxx lub pk_test_xxx)
   - **Secret key** (sk_live_xxx lub sk_test_xxx)

#### Krok 3: Utwórz produkty i ceny
1. Przejdź do: Products → Add product
2. Utwórz plany subskrypcji (np. "PRO Miesięczny", "PRO Roczny")
3. Zapisz Price ID dla każdego planu

#### Krok 4: Skonfiguruj w panelu Master Admin
1. Zaloguj się jako Master Admin
2. Przejdź do: Panel administracyjny → Ustawienia płatności
3. Wprowadź klucze Stripe
4. Przypisz Price ID do planów subskrypcji

### Tryb testowy
- Używaj kluczy testowych (pk_test_, sk_test_) do testowania
- Karty testowe: 4242 4242 4242 4242 (sukces), 4000 0000 0000 0002 (odmowa)

---

## 5. Bezpieczeństwo

### Przechowywanie kluczy API
- Klucze API są szyfrowane w bazie danych
- Każdy klub przechowuje własne klucze
- Klucze nie są widoczne po zapisaniu (tylko możliwość nadpisania)

### Zalecenia
1. **Nigdy nie udostępniaj kluczy API** publicznie
2. **Używaj osobnych kluczy** dla produkcji i testów
3. **Regularnie rotuj klucze** (co 6-12 miesięcy)
4. **Monitoruj użycie** w panelach dostawców

---

## 6. Rozwiązywanie problemów

### SMS nie są wysyłane
1. Sprawdź czy SMS jest włączony w ustawieniach klubu
2. Sprawdź format klucza API
3. Sprawdź saldo/kredyt u dostawcy
4. Sprawdź czy numer telefonu jest poprawny (format +48xxxxxxxxx)

### Błąd autoryzacji Twilio
- Upewnij się, że format to `AccountSID:AuthToken`
- Sprawdź czy nie ma spacji przed/po kluczu
- Zweryfikuj klucze w panelu Twilio

### Błąd SMSAPI
- Sprawdź czy token jest aktywny
- Sprawdź czy nadawca jest zweryfikowany
- Sprawdź saldo konta

---

## Kontakt i wsparcie

W razie problemów z integracjami:
1. Sprawdź dokumentację dostawcy
2. Skontaktuj się z supportem dostawcy
3. Zgłoś problem w aplikacji SKM

---

*Ostatnia aktualizacja: Grudzień 2024*
