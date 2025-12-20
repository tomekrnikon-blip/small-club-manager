# Small Club Manager - Design System

## Filozofia Designu

Small Club Manager jest aplikacją mobilną zaprojektowaną zgodnie z **Apple Human Interface Guidelines (HIG)**. Aplikacja powinna wyglądać i działać jak natywna aplikacja iOS, z ciemnym motywem jako domyślnym i zielonym akcentem nawiązującym do murawy piłkarskiej.

---

## Paleta Kolorów

### Kolory Główne

| Nazwa | HEX | RGB | Użycie |
|-------|-----|-----|--------|
| **Primary Accent** | `#22c55e` | 34, 197, 94 | Przyciski główne, linki, akcenty |
| **Primary Dark** | `#16a34a` | 22, 163, 74 | Hover/pressed state |
| **Primary Light** | `#4ade80` | 74, 222, 128 | Tła z akcentem |

### Kolory Tła (Dark Theme)

| Nazwa | HEX | RGB | Użycie |
|-------|-----|-----|--------|
| **Background** | `#0f172a` | 15, 23, 42 | Główne tło aplikacji |
| **Surface** | `#1e293b` | 30, 41, 59 | Karty, sekcje |
| **Surface Elevated** | `#334155` | 51, 65, 85 | Modalne, dropdown |
| **Surface Highlight** | `#475569` | 71, 85, 105 | Hover states |

### Kolory Tekstu

| Nazwa | HEX | RGB | Użycie |
|-------|-----|-----|--------|
| **Text Primary** | `#f8fafc` | 248, 250, 252 | Główny tekst |
| **Text Secondary** | `#94a3b8` | 148, 163, 184 | Opisy, podtytuły |
| **Text Muted** | `#64748b` | 100, 116, 139 | Placeholder, disabled |
| **Text Inverse** | `#0f172a` | 15, 23, 42 | Tekst na jasnym tle |

### Kolory Semantyczne

| Nazwa | HEX | Użycie |
|-------|-----|--------|
| **Success** | `#22c55e` | Potwierdzenia, sukces |
| **Danger** | `#ef4444` | Błędy, usuwanie |
| **Warning** | `#f59e0b` | Ostrzeżenia |
| **Info** | `#3b82f6` | Informacje |

### Kolory Wyników Meczów

| Wynik | HEX | Użycie |
|-------|-----|--------|
| **Win** | `#22c55e` | Wygrana |
| **Draw** | `#f59e0b` | Remis |
| **Loss** | `#ef4444` | Przegrana |

### Kolory Pozycji Zawodników

| Pozycja | HEX | Badge |
|---------|-----|-------|
| **Bramkarz** | `#f59e0b` | Żółty |
| **Obrońca** | `#3b82f6` | Niebieski |
| **Pomocnik** | `#22c55e` | Zielony |
| **Napastnik** | `#ef4444` | Czerwony |

---

## Typografia

### Font Family

```typescript
// constants/theme.ts
Fonts = {
  ios: {
    sans: "system-ui",      // SF Pro
    serif: "ui-serif",      // New York
    rounded: "ui-rounded",  // SF Pro Rounded
    mono: "ui-monospace",   // SF Mono
  },
  android: {
    sans: "Roboto",
    serif: "serif",
    rounded: "Roboto",
    mono: "monospace",
  }
}
```

### Skala Typografii

| Typ | Rozmiar | Waga | Line Height | Użycie |
|-----|---------|------|-------------|--------|
| **Title** | 32pt | Bold (700) | 40pt | Nagłówki ekranów |
| **Subtitle** | 20pt | Semibold (600) | 28pt | Sekcje, podtytuły |
| **Body** | 16pt | Regular (400) | 24pt | Główny tekst |
| **Body Semibold** | 16pt | Semibold (600) | 24pt | Wyróżnienia |
| **Caption** | 14pt | Regular (400) | 20pt | Opisy, meta |
| **Small** | 12pt | Regular (400) | 16pt | Etykiety, badge |
| **Link** | 16pt | Regular (400) | 30pt | Linki (kolor: #0a7ea4) |

### ThemedText Component

```tsx
// components/themed-text.tsx
<ThemedText type="title">Nagłówek</ThemedText>
<ThemedText type="subtitle">Podtytuł</ThemedText>
<ThemedText type="default">Tekst podstawowy</ThemedText>
<ThemedText type="defaultSemiBold">Tekst wyróżniony</ThemedText>
<ThemedText type="link">Link</ThemedText>
```

---

## Spacing System (8pt Grid)

| Token | Wartość | Użycie |
|-------|---------|--------|
| `xs` | 4pt | Minimalne odstępy |
| `sm` | 8pt | Wewnętrzne paddingi |
| `md` | 12pt | Odstępy między elementami |
| `lg` | 16pt | Standardowe paddingi |
| `xl` | 24pt | Sekcje |
| `2xl` | 32pt | Duże odstępy |
| `3xl` | 48pt | Separatory sekcji |

### Przykłady Użycia

```tsx
// Karta
<View style={{ padding: 16, marginBottom: 12 }}>

// Lista elementów
<View style={{ gap: 8 }}>

// Sekcja
<View style={{ marginTop: 24, marginBottom: 24 }}>
```

---

## Border Radius

| Element | Wartość | Użycie |
|---------|---------|--------|
| **Small** | 8pt | Małe przyciski, badge |
| **Medium** | 12pt | Przyciski, inputy |
| **Large** | 16pt | Karty |
| **XLarge** | 24pt | Bottom sheets, modals |
| **Full** | 9999pt | Avatary, okrągłe przyciski |

---

## Shadows

### iOS Shadows

```tsx
// Karta
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 8,

// Elevated (modal)
shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 16,
```

### Android Elevation

```tsx
// Karta
elevation: 2,

// Elevated
elevation: 8,
```

---

## Komponenty UI

### Przyciski

#### Primary Button

```tsx
<Pressable style={styles.primaryButton}>
  <ThemedText style={styles.primaryButtonText}>Zapisz</ThemedText>
</Pressable>

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

#### Secondary Button

```tsx
secondaryButton: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#22c55e',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 12,
},
secondaryButtonText: {
  color: '#22c55e',
  fontSize: 16,
  fontWeight: '600',
},
```

#### Danger Button

```tsx
dangerButton: {
  backgroundColor: '#ef4444',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 12,
},
```

### Karty

```tsx
card: {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
},
cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
cardTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#f8fafc',
},
```

### Inputy

```tsx
input: {
  backgroundColor: '#1e293b',
  borderWidth: 1,
  borderColor: '#334155',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#f8fafc',
},
inputFocused: {
  borderColor: '#22c55e',
},
inputLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#94a3b8',
  marginBottom: 8,
},
```

### Badge

```tsx
badge: {
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 8,
  backgroundColor: '#22c55e20',
},
badgeText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#22c55e',
},
```

### Avatar

```tsx
avatar: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#334155',
  alignItems: 'center',
  justifyContent: 'center',
},
avatarLarge: {
  width: 80,
  height: 80,
  borderRadius: 40,
},
avatarText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#f8fafc',
},
```

---

## Ikony

### SF Symbols → Material Icons Mapping

```tsx
// components/ui/icon-symbol.tsx
const MAPPING = {
  "house.fill": "home",
  "person.2.fill": "people",
  "sportscourt.fill": "sports-soccer",
  "calendar": "calendar-today",
  "ellipsis": "more-horiz",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "plus": "add",
  "trash.fill": "delete",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "checkmark": "check",
};
```

### Rozmiary Ikon

| Kontekst | Rozmiar |
|----------|---------|
| Tab Bar | 28pt |
| Navigation | 24pt |
| Button | 20pt |
| List Item | 24pt |
| Badge | 16pt |

---

## Nawigacja

### Tab Bar

```tsx
// app/(tabs)/_layout.tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: '#22c55e',
    tabBarInactiveTintColor: '#64748b',
    tabBarStyle: {
      backgroundColor: '#0f172a',
      borderTopColor: '#1e293b',
      paddingBottom: insets.bottom,
      height: 49 + insets.bottom,
    },
    headerShown: false,
  }}
>
```

### Header

```tsx
headerStyle: {
  backgroundColor: '#0f172a',
},
headerTintColor: '#f8fafc',
headerTitleStyle: {
  fontWeight: '600',
  fontSize: 17,
},
```

---

## Animacje

### Reanimated Presets

```tsx
import { withSpring, withTiming } from 'react-native-reanimated';

// Sprężysta animacja
withSpring(value, {
  damping: 15,
  stiffness: 150,
});

// Płynna animacja
withTiming(value, {
  duration: 300,
});
```

### Pressed State

```tsx
<Pressable
  style={({ pressed }) => [
    styles.button,
    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
  ]}
>
```

---

## Safe Area

### Obsługa Notch i Home Indicator

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      paddingTop: Math.max(insets.top, 20),
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: Math.max(insets.left, 16),
      paddingRight: Math.max(insets.right, 16),
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## Dark/Light Mode

### useThemeColor Hook

```tsx
import { useThemeColor } from '@/hooks/use-theme-color';

function Component() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}
```

### Colors Object

```tsx
// constants/theme.ts
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};
```

---

## Szablony Social Media

### 8 Stylów Graficznych

| Styl | Opis | Kolory |
|------|------|--------|
| **Dark** | Ciemne tło, biały tekst | #1a1a2e, #ffffff |
| **Gradient** | Gradient zielono-niebieski | #22c55e → #3b82f6 |
| **Minimal** | Białe tło, czarny tekst | #ffffff, #000000 |
| **Bold** | Żółte tło, czarny tekst | #fbbf24, #000000 |
| **Neon** | Ciemne tło, neonowy blask | #0f0f23, #00ff88 |
| **Retro** | Vintage, seppia | #f5e6d3, #8b4513 |
| **Sport** | Dynamiczny, paski | #1e3a5f, #22c55e |
| **Elegant** | Złote obramowanie | #1a1a2e, #d4af37 |
| **Club** | Kolory klubu | primaryColor, secondaryColor |

---

## Responsywność

### Breakpoints

```tsx
import { useWindowDimensions } from 'react-native';

function Component() {
  const { width } = useWindowDimensions();
  
  const isSmall = width < 375;   // iPhone SE
  const isMedium = width >= 375 && width < 414;  // iPhone 12
  const isLarge = width >= 414;  // iPhone Pro Max
  
  return (
    <View style={{ padding: isSmall ? 12 : 16 }}>
      {/* Content */}
    </View>
  );
}
```

### Touch Targets

Minimalna wielkość elementu interaktywnego: **44pt × 44pt**

```tsx
touchable: {
  minWidth: 44,
  minHeight: 44,
  alignItems: 'center',
  justifyContent: 'center',
},
```

---

## Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// Lekkie dotknięcie
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Średni impact
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Sukces
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Błąd
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

---

## Accessibility

### Semantic Labels

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Dodaj zawodnika"
  accessibilityHint="Otwiera formularz dodawania nowego zawodnika"
>
  <IconSymbol name="plus" />
</Pressable>
```

### Kontrast

Wszystkie kombinacje tekst/tło spełniają WCAG AA (4.5:1 dla tekstu, 3:1 dla dużego tekstu).
